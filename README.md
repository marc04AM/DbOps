# DbOps

Procedura assistita per inserimento e gestione dei testi di allarmi PLC nel database, con separazione tra testi gestiti dall'applicazione e testi gestiti da altri sistemi.

## Struttura
- frontend: UI statica servita da Nginx
- backend: API Node.js/Express per ricerca e applicazione modifiche

## Avvio rapido (Docker)
1) docker compose up --build
2) apri http://localhost

La UI parla con il backend tramite /api (Nginx fa proxy verso http://backend:3000).

## Configurazione database
Il backend usa una connessione MySQL. Variabili ambiente:
- DB_HOST (default: mysql)
- DB_PORT (default: 3306)
- DB_NAME (default: plc_alarms)
- DB_USER (default: plcuser)
- DB_PASSWORD (default: plcpassword)

E' possibile sovrascrivere la connessione usando l'endpoint /api/connect.

## Tabelle coinvolte
- language_plcalm: testi allarmi gestiti dall'applicazione
  - colonne attese: StringName, Italian, English, Other
- language_spv: testi gestiti da altri sistemi (solo lettura)
  - colonne attese: StringName

## API
- POST /api/connect
  - body: { host, port, database, user, password }
  - risposta: { success, message }

- POST /api/search
  - body: { query }
  - query supporta wildcard SQL (% e _)
  - risposta: { success, updates, inserts, blocked }

- POST /api/apply
  - body: { updates: [], inserts: [] }
  - aggiorna language_plcalm e impedisce modifiche su chiavi presenti in language_spv

## Flusso operativo
1) Search: cerca la chiave in language_plcalm e language_spv
2) Select:
   - se presente in language_plcalm: modifica in UPDATE
   - se presente in language_spv: chiave bloccata
   - se non presente: prepara INSERT
3) Apply: esegue UPDATE/INSERT su language_plcalm

## Best practice
- Usa uno standard di naming per le chiavi (es. prefisso #)
- Non forzare mai modifiche su chiavi presenti in language_spv
- Verifica sempre il risultato della ricerca prima di inserire nuove chiavi
