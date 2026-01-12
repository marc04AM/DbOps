const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let dbConnection = null;

const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'plc_alarms',
  user: process.env.DB_USER || 'plcuser',
  password: process.env.DB_PASSWORD || 'plcpassword'
};

async function initConnection() {
  try {
    await new Promise(resolve => setTimeout(resolve, 5000));
    dbConnection = await mysql.createConnection(dbConfig);
    console.log('✓ Connesso al database MySQL');
  } catch (error) {
    console.error('✗ Errore connessione DB:', error.message);
  }
}

initConnection();

app.post('/api/connect', async (req, res) => {
  const { host, port, database, user, password } = req.body;

  try {
    if (dbConnection) {
      await dbConnection.end();
    }

    dbConnection = await mysql.createConnection({
      host: host || dbConfig.host,
      port: parseInt(port) || dbConfig.port,
      database: database || dbConfig.database,
      user: user || dbConfig.user,
      password: password || dbConfig.password
    });

    await dbConnection.ping();
    res.json({ success: true, message: 'Connessione riuscita' });
  } catch (error) {
    console.error('Errore di connessione:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/search', async (req, res) => {
  const { query } = req.body;

  if (!dbConnection) {
    return res.status(400).json({ error: 'Nessuna connessione al database attiva' });
  }

  try {
    const updates = [];
    const inserts = [];
    const blocked = [];

    const searchPattern = query;

    const [plcAlmRows] = await dbConnection.execute(
      'SELECT StringName, Italian, English, Other FROM language_plcalm WHERE StringName LIKE ?',
      [searchPattern]
    );

    updates.push(...plcAlmRows);

    const [spvRows] = await dbConnection.execute(
      'SELECT StringName FROM language_spv WHERE StringName LIKE ?',
      [searchPattern]
    );

    blocked.push(...spvRows);

    if (plcAlmRows.length === 0 && spvRows.length === 0 && 
        !query.includes('%') && !query.includes('_')) {
      inserts.push({
        StringName: query,
        Italian: '',
        English: '',
        Other: ''
      });
    }

    res.json({ success: true, updates, inserts, blocked });
  } catch (error) {
    console.error('Errore nella ricerca:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/apply', async (req, res) => {
  const updates = Array.isArray(req.body.updates) ? req.body.updates : [];
  const inserts = Array.isArray(req.body.inserts) ? req.body.inserts : [];

  if (!dbConnection) {
    return res.status(400).json({ error: 'Nessuna connessione al database attiva' });
  }

  try {
    let updatedCount = 0;
    let insertedCount = 0;

    const allKeys = [...new Set([...updates, ...inserts].map(record => record.StringName).filter(Boolean))];
    if (allKeys.length > 0) {
      const placeholders = allKeys.map(() => '?').join(', ');
      const [blockedRows] = await dbConnection.execute(
        `SELECT StringName FROM language_spv WHERE StringName IN (${placeholders})`,
        allKeys
      );
      if (blockedRows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Chiavi bloccate (presenti in language_spv)',
          blocked: blockedRows.map(row => row.StringName)
        });
      }
    }

    await dbConnection.beginTransaction();

    for (const record of updates) {
      await dbConnection.execute(
        `UPDATE language_plcalm 
         SET Italian = ?, English = ?, Other = ? 
         WHERE StringName = ?`,
        [record.Italian, record.English, record.Other, record.StringName]
      );
      updatedCount++;
    }

    for (const record of inserts) {
      await dbConnection.execute(
        `INSERT INTO language_plcalm (StringName, Italian, English, Other) 
         VALUES (?, ?, ?, ?)`,
        [record.StringName, record.Italian, record.English, record.Other]
      );
      insertedCount++;
    }

    await dbConnection.commit();

    res.json({
      success: true,
      updated: updatedCount,
      inserted: insertedCount,
      message: 'Operazioni completate con successo'
    });
  } catch (error) {
    if (dbConnection) {
      await dbConnection.rollback();
    }
    console.error('Errore nell\'applicazione:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

process.on('SIGINT', async () => {
  console.log('\nChiusura server...');
  if (dbConnection) {
    await dbConnection.end();
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`✓ Server in ascolto sulla porta ${PORT}`);
});