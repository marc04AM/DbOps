# Procedura Assistita per l’Aggiunta di Nuovi Record di Allarmi PLC al Database

## Obiettivo
Definire una procedura guidata per l’inserimento e la gestione dei testi di allarmi PLC nel database, riducendo i conflitti con le modifiche effettuate dai PLCisti e mantenendo uno standard coerente per le chiavi di allarme.

## Riferimenti
- **Prototipo UI**:  
  https://claude.ai/public/artifacts/8f63e785-6902-4515-a6b5-0db8682acb31

## Tabelle Coinvolte
- `language_plcalm`  
  Contiene i testi degli allarmi PLC gestiti dall’applicazione.
- `language_spv`  
  Contiene testi gestiti da altri sistemi (es. supervisione) e **non modificabili** da questa procedura.

---

## Flusso Generale della Procedura

1. Ricerca della chiave di allarme
2. Analisi del risultato della ricerca
3. Aggiornamento o inserimento dei testi
4. Applicazione delle modifiche al database

---

## 1. SEARCH (Ricerca)

### Descrizione
L’applicazione presenta inizialmente una **casella di ricerca**.

Inserendo una chiave di allarme:
- viene eseguita una `SELECT` sul database
- la ricerca viene effettuata **sia** sulla tabella `language_plcalm` **sia** sulla tabella `language_spv`

### Comportamento
- Ogni ricerca aggiunge i risultati alle tabelle di visualizzazione sottostanti.
- È possibile utilizzare i **wildcard SQL** nella ricerca.

### Esempi
- `pippo` → cerca la chiave esatta
- `pippo%` → cerca tutte le chiavi che iniziano con `pippo`

---

## 2. SELECT – Analisi dei Risultati

In base all’esito della ricerca, si presentano tre casi distinti.

---

### Caso 1: Chiave già presente in `language_plcalm`

**Comportamento dell’applicazione:**
- Il record viene mostrato nella **tabella di UPDATE**
- L’utente può:
  - modificare i testi esistenti
  - premere **APPLY** per salvare le modifiche nel database

**Obiettivo:**
- Aggiornare testi di allarmi già gestiti dalla nostra applicazione

---

### Caso 2: Chiave già presente in `language_spv`

**Comportamento dell’applicazione:**
- Il record viene mostrato in una tabella informativa
- Viene segnalato che **la chiave non può essere aggiunta o modificata**

**Restrizioni:**
- La chiave rimane **bloccata**
- Nessuna operazione di INSERT o UPDATE è consentita

---

### Caso 3: Chiave non presente in nessuna delle due tabelle

**Comportamento dell’applicazione:**
- Il record viene mostrato nella **tabella di INSERT**
- L’utente può:
  - inserire i testi tradotti (per le lingue supportate)
  - preparare il nuovo record per il salvataggio

**Obiettivo:**
- Inserire un nuovo allarme PLC nel database

---

## 3. APPLY (Applicazione delle Modifiche)

### Descrizione
Dopo aver:
- modificato i testi nella tabella di **UPDATE**
- oppure inserito nuovi testi nella tabella di **INSERT**

l’utente preme il pulsante **APPLY**.

### Comportamento
- Vengono eseguite le operazioni necessarie sul database:
  - `UPDATE` per record esistenti in `language_plcalm`
  - `INSERT` per nuovi record non presenti in nessuna tabella
- Le chiavi presenti in `language_spv` restano **inalterate**

---

## Considerazioni Finali

- La separazione tra `language_plcalm` e `language_spv` riduce i conflitti:
  - i PLCisti modificano i loro testi
  - noi modifichiamo esclusivamente i nostri
- Nessuna sovrascrittura incrociata dei contenuti
- L’uso di uno **standard di chiavi dedicato** (es. prefisso `#...`) permette di:
  - evitare collisioni con altri sistemi
  - mantenere coerenza e riconoscibilità degli allarmi PLC

---

## Best Practice

- Verificare sempre l’esito della ricerca prima di inserire una nuova chiave
- Non forzare mai modifiche su chiavi presenti in `language_spv`
- Mantenere lo standard di naming concordato per le chiavi di allarme
- Utilizzare i wildcard con attenzione per evitare ambiguità nei risultati
