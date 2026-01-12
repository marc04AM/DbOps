# DbOps

Applicazione desktop (Electron) per la gestione dei testi allarmi PLC con backend Node.js/Express e UI HTML/React statica.

## Struttura
- `backend/`: API Node.js/Express + static hosting della UI
- `electron/`: main process Electron

Nota: la UI e' servita da `backend/public/index.html`.

## Prerequisiti
- Node.js LTS + npm
- Accesso a MySQL
- (Opzionale) Docker Desktop per il flusso container

## Avvio rapido (Electron)
1) `npm install`
2) `npm run start`

L'app avvia il backend su `http://localhost:3000` e carica la UI tramite Electron.

## Build eseguibile (Electron)
1) `npm install`
2) `npm run dist`

Output in `dist/`.

## Configurazione database
Il backend usa una connessione MySQL.

Variabili ambiente (quando in Docker):
- `DB_HOST` (default: `mysql`)
- `DB_PORT` (default: `3306`)
- `DB_NAME` (default: `plc_alarms`)
- `DB_USER` (default: `plcuser`)
- `DB_PASSWORD` (default: `plcpassword`)

In modalita' desktop, la connessione si imposta dalla UI usando `/api/connect`.

## Tabelle coinvolte
- `language_plcalm`: testi allarmi gestiti dall'applicazione
  - colonne attese: `StringName`, `Italian`, `English`, `Other`
- `language_spv`: testi gestiti da altri sistemi (solo lettura)
  - colonne attese: `StringName`

## API
- `POST /api/connect`
  - body: `{ host, port, database, user, password }`
  - risposta: `{ success, message }`
- `POST /api/search`
  - body: `{ query }`
  - `query` supporta wildcard SQL (`%` e `_`)
  - risposta: `{ success, updates, inserts, blocked }`
- `POST /api/apply`
  - body: `{ updates: [], inserts: [] }`
  - aggiorna `language_plcalm` e impedisce modifiche su chiavi presenti in `language_spv`

## Flusso operativo
1) Search: cerca la chiave in `language_plcalm` e `language_spv`
2) Select:
   - se presente in `language_plcalm`: modifica in UPDATE
   - se presente in `language_spv`: chiave bloccata
   - se non presente: prepara INSERT
3) Apply: esegue UPDATE/INSERT su `language_plcalm`

## Best practice
- Usa uno standard di naming per le chiavi (es. prefisso `#`)
- Non forzare mai modifiche su chiavi presenti in `language_spv`
- Verifica sempre il risultato della ricerca prima di inserire nuove chiavi
