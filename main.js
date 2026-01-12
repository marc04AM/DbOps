const { app, BrowserWindow } = require('electron');
const path = require('path');
const { startServer, stopServer } = require('./server');

const DEFAULT_PORT = 3001;
let serverHandle = null;

const createWindow = async () => {
  try {
    const port = process.env.PORT ? Number(process.env.PORT) : DEFAULT_PORT;
    serverHandle = await startServer(port);

    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true
      }
    });

    await win.loadURL(`http://localhost:${serverHandle.port}`);
  } catch (err) {
    // Fail fast if the embedded server cannot start.
    console.error('Failed to start embedded server:', err);
    app.quit();
  }
};

app.whenReady().then(createWindow);

app.on('window-all-closed', async () => {
  if (serverHandle?.server) {
    await stopServer(serverHandle.server);
    serverHandle = null;
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
