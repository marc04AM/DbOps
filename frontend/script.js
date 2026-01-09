const { useState } = React;

function PLCAlarmManager() {
    const [searchQuery, setSearchQuery] = useState('');
    const [updateRecords, setUpdateRecords] = useState([]);
    const [insertRecords, setInsertRecords] = useState([]);
    const [blockedRecords, setBlockedRecords] = useState([]);
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('success');
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [pendingChanges, setPendingChanges] = useState({ updates: [], inserts: [] });

    const [dbConfig, setDbConfig] = useState({
        host: '192.168.10.10',
        port: '3306',
        database: 'sistec',
        user: 'sistec',
        password: 'utsistec'
    });
    const [showConfig, setShowConfig] = useState(true);

    const API_URL = window.location.origin.includes('localhost') 
        ? 'http://localhost:3000'
        : '/api';

    const showNotificationMessage = (message, type = 'success') => {
        setNotificationMessage(message);
        setNotificationType(type);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
    };

    const connectToDatabase = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/connect`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbConfig)
            });

            const data = await response.json();

            if (response.ok) {
                setIsConnected(true);
                setShowConfig(false);
                showNotificationMessage('Connessione al database riuscita!', 'success');
            } else {
                showNotificationMessage(`Errore: ${data.error}`, 'error');
            }
        } catch (error) {
            showNotificationMessage(`Errore di connessione: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            showNotificationMessage('Inserisci una chiave di ricerca', 'error');
            return;
        }

        if (!isConnected) {
            showNotificationMessage('Connettiti prima al database', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: searchQuery })
            });

            const data = await response.json();

            if (response.ok) {
                setUpdateRecords(prev => {
                    const combined = [...prev, ...data.updates];
                    return Array.from(new Map(combined.map(item => [item.StringName, item])).values());
                });

                setInsertRecords(prev => {
                    const combined = [...prev, ...data.inserts];
                    return Array.from(new Map(combined.map(item => [item.StringName, item])).values());
                });

                setBlockedRecords(prev => {
                    const combined = [...prev, ...data.blocked];
                    return Array.from(new Map(combined.map(item => [item.StringName, item])).values());
                });

                showNotificationMessage(
                    `Trovati: ${data.updates.length} da aggiornare, ${data.inserts.length} da inserire, ${data.blocked.length} bloccati`,
                    'success'
                );
            } else {
                showNotificationMessage(`Errore nella ricerca: ${data.error}`, 'error');
            }
        } catch (error) {
            showNotificationMessage(`Errore di ricerca: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateChange = (index, field, value) => {
        const newRecords = [...updateRecords];
        newRecords[index][field] = value;
        setUpdateRecords(newRecords);
    };

    const handleInsertChange = (index, field, value) => {
        const newRecords = [...insertRecords];
        newRecords[index][field] = value;
        setInsertRecords(newRecords);
    };

    const handleDeleteUpdateRecord = (index) => {
        setUpdateRecords(updateRecords.filter((_, idx) => idx !== index));
    };

    const handleDeleteInsertRecord = (index) => {
        setInsertRecords(insertRecords.filter((_, idx) => idx !== index));
    };

    const handleApply = async () => {
        if (updateRecords.length === 0 && insertRecords.length === 0) {
            showNotificationMessage('Nessuna modifica da applicare', 'error');
            return;
        }

        if (!isConnected) {
            showNotificationMessage('Connettiti prima al database', 'error');
            return;
        }

        setPendingChanges({
            updates: updateRecords,
            inserts: insertRecords
        });
        setShowConfirm(true);
    };

    const handleConfirmApply = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updates: pendingChanges.updates,
                    inserts: pendingChanges.inserts
                })
            });

            const data = await response.json();

            if (response.ok) {
                showNotificationMessage(
                    `Database aggiornato: ${data.updated} record aggiornati, ${data.inserted} record inseriti`,
                    'success'
                );

                setUpdateRecords([]);
                setInsertRecords([]);
                setShowConfirm(false);
                setPendingChanges({ updates: [], inserts: [] });
            } else if (data.blocked && data.blocked.length > 0) {
                showNotificationMessage(`Chiavi bloccate: ${data.blocked.join(', ')}`, 'error');
            } else {
                showNotificationMessage(`Errore nell'applicazione: ${data.error}`, 'error');
            }
        } catch (error) {
            showNotificationMessage(`Errore di applicazione: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelApply = () => {
        setShowConfirm(false);
        setPendingChanges({ updates: [], inserts: [] });
    };

    return (
        <div className="page">
            <div className="bg-orbs" aria-hidden="true"></div>

            {showNotification && (
                <div className={`notice ${notificationType === 'success' ? 'success' : 'error'}`}>
                    {notificationMessage}
                </div>
            )}

            <div className="app-shell">
                <section className="card hero fade-in">
                    <div className="hero-header">
                        <div>
                            <p className="eyebrow">Procedura assistita</p>
                            <h1 className="title">Inserimento allarmi PLC</h1>
                        </div>
                        <div className="controls">
                            <span className={`status-pill ${isConnected ? 'ok' : 'off'}`}>
                                {isConnected ? '? Connesso' : '? Non connesso'}
                            </span>
                            {isConnected && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowConfig(prev => !prev)}
                                >
                                    {showConfig ? 'Nascondi config' : 'Cambia DB'}
                                </button>
                            )}
                        </div>
                    </div>
                    <p className="subtitle">
                        Ricerca, verifica e aggiorna testi in <strong>language_plcalm</strong> mantenendo protette le chiavi di <strong>language_spv</strong>.
                    </p>

                    {showConfig && (
                        <div className="card section-card slide-up">
                            <div className="section-title">
                                <h2 className="text-sm font-semibold">Configurazione database</h2>
                                <span className="badge">Connessione manuale</span>
                            </div>
                            <div className="grid-2">
                                <div className="form-field">
                                    <label className="form-label">Host</label>
                                    <input type="text" placeholder="Host" value={dbConfig.host}
                                        onChange={(e) => setDbConfig({...dbConfig, host: e.target.value})}
                                        className="input" />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Porta</label>
                                    <input type="text" placeholder="Porta" value={dbConfig.port}
                                        onChange={(e) => setDbConfig({...dbConfig, port: e.target.value})}
                                        className="input" />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Database</label>
                                    <input type="text" placeholder="Database" value={dbConfig.database}
                                        onChange={(e) => setDbConfig({...dbConfig, database: e.target.value})}
                                        className="input" />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Utente</label>
                                    <input type="text" placeholder="Utente" value={dbConfig.user}
                                        onChange={(e) => setDbConfig({...dbConfig, user: e.target.value})}
                                        className="input" />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Password</label>
                                    <input type="password" placeholder="Password" value={dbConfig.password}
                                        onChange={(e) => setDbConfig({...dbConfig, password: e.target.value})}
                                        className="input" />
                                </div>
                            </div>
                            <div className="controls" style={{ marginTop: '14px' }}>
                                <button onClick={connectToDatabase} disabled={isLoading}
                                    className="btn btn-primary">
                                    {isLoading ? 'Connessione...' : 'CONNETTI'}
                                </button>
                                <span className="callout">Inserisci i parametri del DB e avvia la sessione.</span>
                            </div>
                        </div>
                    )}

                    {isConnected && (
                        <div className="card section-card slide-up">
                            <div className="section-title">
                                <h2 className="text-sm font-semibold">Ricerca chiave</h2>
                                <span className="badge">wildcard % e _</span>
                            </div>
                            <div className="controls">
                                <input type="text" value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cerca chiave..."
                                    className="input" />
                                <button onClick={handleSearch} disabled={isLoading}
                                    className="btn btn-success">
                                    {isLoading ? 'Ricerca...' : 'SEARCH'}
                                </button>
                            </div>
                            <div className="callout" style={{ marginTop: '10px' }}>
                                Usa % per prefissi/suffissi e _ per un singolo carattere. Ogni ricerca aggiunge risultati alle tabelle sotto.
                            </div>
                        </div>
                    )}
                </section>

                {updateRecords.length > 0 && (
                    <section className="card section-card slide-up">
                        <div className="section-title">
                            <h2 className="text-sm font-semibold">UPDATE</h2>
                            <span className="badge">{updateRecords.length} record</span>
                        </div>
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>StringName</th>
                                        <th>Italian</th>
                                        <th>English</th>
                                        <th>Other</th>
                                        <th style={{ width: '80px', textAlign: 'center' }}>Azione</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {updateRecords.map((record, idx) => (
                                        <tr key={idx}>
                                            <td>{record.StringName}</td>
                                            <td>
                                                <input type="text" value={record.Italian}
                                                    onChange={(e) => handleUpdateChange(idx, 'Italian', e.target.value)}
                                                    className="input" />
                                            </td>
                                            <td>
                                                <input type="text" value={record.English}
                                                    onChange={(e) => handleUpdateChange(idx, 'English', e.target.value)}
                                                    className="input" />
                                            </td>
                                            <td>
                                                <input type="text" value={record.Other}
                                                    onChange={(e) => handleUpdateChange(idx, 'Other', e.target.value)}
                                                    className="input" />
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button onClick={() => handleDeleteUpdateRecord(idx)}
                                                    className="btn btn-danger">
                                                    ELIMINA
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {insertRecords.length > 0 && (
                    <section className="card section-card slide-up">
                        <div className="section-title">
                            <h2 className="text-sm font-semibold">INSERT</h2>
                            <span className="badge">{insertRecords.length} record</span>
                        </div>
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>StringName</th>
                                        <th>Italian</th>
                                        <th>English</th>
                                        <th>Other</th>
                                        <th style={{ width: '80px', textAlign: 'center' }}>Azione</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {insertRecords.map((record, idx) => (
                                        <tr key={idx}>
                                            <td>{record.StringName}</td>
                                            <td>
                                                <input type="text" value={record.Italian}
                                                    onChange={(e) => handleInsertChange(idx, 'Italian', e.target.value)}
                                                    className="input" placeholder="Italiano" />
                                            </td>
                                            <td>
                                                <input type="text" value={record.English}
                                                    onChange={(e) => handleInsertChange(idx, 'English', e.target.value)}
                                                    className="input" placeholder="English" />
                                            </td>
                                            <td>
                                                <input type="text" value={record.Other}
                                                    onChange={(e) => handleInsertChange(idx, 'Other', e.target.value)}
                                                    className="input" placeholder="Altro" />
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button onClick={() => handleDeleteInsertRecord(idx)}
                                                    className="btn btn-danger">
                                                    ELIMINA
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {(updateRecords.length > 0 || insertRecords.length > 0) && (
                    <div className="controls" style={{ justifyContent: 'flex-end' }}>
                        <button onClick={handleApply} disabled={isLoading}
                            className="btn btn-success" style={{ padding: '12px 28px' }}>
                            {isLoading ? 'Applicazione...' : 'APPLY'}
                        </button>
                    </div>
                )}

                {showConfirm && (
                    <div className="modal-overlay" onClick={handleCancelApply}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2 className="modal-title">Riepilogo delle modifiche</h2>
                            </div>
                            
                            <div className="modal-content">
                                {pendingChanges.updates.length > 0 && (
                                    <div className="summary-section">
                                        <h3>Record da aggiornare ({pendingChanges.updates.length})</h3>
                                        <ul className="summary-list">
                                            {pendingChanges.updates.map((record, idx) => (
                                                <li key={idx}>
                                                    <strong>{record.StringName}</strong><br/>
                                                    IT: {record.Italian || '(vuoto)'} | EN: {record.English || '(vuoto)'} | OTHER: {record.Other || '(vuoto)'}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {pendingChanges.inserts.length > 0 && (
                                    <div className="summary-section">
                                        <h3>Record da inserire ({pendingChanges.inserts.length})</h3>
                                        <ul className="summary-list">
                                            {pendingChanges.inserts.map((record, idx) => (
                                                <li key={idx}>
                                                    <strong>{record.StringName}</strong><br/>
                                                    IT: {record.Italian || '(vuoto)'} | EN: {record.English || '(vuoto)'} | OTHER: {record.Other || '(vuoto)'}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button onClick={handleCancelApply} className="btn btn-secondary">
                                    ANNULLA
                                </button>
                                <button onClick={handleConfirmApply} disabled={isLoading} className="btn btn-success">
                                    {isLoading ? 'Applicazione...' : 'CONFERMA'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {blockedRecords.length > 0 && (
                    <section className="card section-card slide-up">
                        <div className="section-title">
                            <h2 className="text-sm font-semibold">BLOCCATE</h2>
                            <span className="badge">{blockedRecords.length} record</span>
                        </div>
                        <div className="table-wrap">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>StringName</th>
                                        <th>Stato</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {blockedRecords.map((record, idx) => (
                                        <tr key={idx}>
                                            <td>{record.StringName}</td>
                                            <td className="callout" style={{ color: 'var(--danger)' }}>
                                                NON INSERIBILE
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}

ReactDOM.render(<PLCAlarmManager />, document.getElementById('root'));
