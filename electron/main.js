const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

let backendProcess = null;

const startBackend = () => {
  const serverPath = path.join(__dirname, '..', 'backend', 'server.js');
  backendProcess = spawn(process.execPath, [serverPath], {
    stdio: 'inherit'
  });
};

const waitForServer = (url, attempts = 30, delayMs = 500) => new Promise((resolve, reject) => {
  const attempt = (remaining) => {
    http.get(url, (res) => {
      res.resume();
      resolve();
    }).on('error', (err) => {
      if (remaining <= 1) {
        reject(err);
        return;
      }
      setTimeout(() => attempt(remaining - 1), delayMs);
    });
  };
  attempt(attempts);
});

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  try {
    await waitForServer('http://localhost:3000');
    await win.loadURL('http://localhost:3000');
  } catch (err) {
    const message = encodeURIComponent(`Backend non raggiungibile.\n${err.message || err}`);
    await win.loadURL(`data:text/plain;charset=utf-8,${message}`);
  }
};

app.whenReady().then(async () => {
  startBackend();
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
