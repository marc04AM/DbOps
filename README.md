# DbOps

App per gestire gli allarmi PLC tramite operazioni su database MySQL. L'app integra un backend Express che espone API per connettersi al DB e aggiornare/inserire record nelle tabelle di lingua.

## Funzionalita principali
- Connessione manuale a un database MySQL.
- Ricerca chiavi con wildcard (`%` e `_`).
- Aggiornamento record esistenti in `language_plcalm`.
- Inserimento nuove chiavi quando non presenti e non bloccate.
- Blocco automatico delle chiavi presenti in `language_spv`.
- Anteprima e conferma modifiche prima dell'applicazione.

## Requisiti
- Node.js 18+ (consigliato)
- MySQL/MariaDB con le tabelle `language_plcalm` e `language_spv`.

## Installazione
```bash
npm install
```

## Avvio
Avvia l'app Electron (include il server interno):
```bash
npm run start
```

Avvia solo il server API (per debug):
```bash
npm run start:server
```

Per cambiare la porta del server integrato:
```bash
set PORT=3002
npm run start
```

## Build pacchetto
```bash
npm run dist
```

L'output viene scritto in `dist`.

## API (server interno)
- `POST /api/connect`
  - Body: `{ host, port, database, user, password }`
- `POST /api/search`
  - Body: `{ query }`
  - Cerca in `language_plcalm` e verifica blocchi in `language_spv`.
- `POST /api/apply`
  - Body: `{ updates: [...], inserts: [...] }`
  - Aggiorna/inserisce in `language_plcalm` e blocca se presenti in `language_spv`.

## Note operative
- Le chiavi presenti in `language_spv` sono considerate bloccate e non modificabili.
- Ogni ricerca aggiunge risultati alle tabelle di lavoro nell'interfaccia.
- Il frontend e servito da `public/index.html`.

## Struttura progetto
- `main.js`: bootstrap Electron e avvio server.
- `server.js`: API Express e gestione DB.
- `public/index.html`: UI (React via CDN).
- `assets/`: icone applicazione.
