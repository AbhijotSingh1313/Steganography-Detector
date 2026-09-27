const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const fs   = require('fs');
const http = require('http');
const { spawn } = require('child_process');

const isDev = process.env.NODE_ENV === 'development';
let pythonProcess = null;

// ==========================================
// Python Backend Process Auto-Detection & Management
// ==========================================

function checkBackendOnline(timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:8000/', { timeout: timeoutMs }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

function findPythonBackend() {
  const candidateDirs = [
    path.resolve(__dirname, '../../..'),
    path.resolve(__dirname, '../..'),
    path.resolve(process.cwd(), '../..'),
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd()),
    path.resolve(app.getAppPath(), '../../..'),
    path.resolve(app.getAppPath(), '../..'),
  ];

  for (const dir of candidateDirs) {
    const venvPy = path.join(dir, 'venv', 'Scripts', 'python.exe');
    const appMain = path.join(dir, 'app', 'main.py');
    if (fs.existsSync(venvPy) && fs.existsSync(appMain)) {
      return { pythonPath: venvPy, cwd: dir };
    }
  }

  for (const dir of candidateDirs) {
    const appMain = path.join(dir, 'app', 'main.py');
    if (fs.existsSync(appMain)) {
      return { pythonPath: 'python', cwd: dir };
    }
  }

  return null;
}

async function ensureBackendRunning() {
  const isOnline = await checkBackendOnline(1000);
  if (isOnline) {
    console.log('[StegXplore Desktop] Backend is already running on http://127.0.0.1:8000');
    return;
  }

  const backend = findPythonBackend();
  if (backend) {
    console.log(`[StegXplore Desktop] Launching local backend from ${backend.cwd}...`);
    try {
      pythonProcess = spawn(
        backend.pythonPath,
        ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'],
        {
          cwd: backend.cwd,
          stdio: 'ignore',
          windowsHide: true,
          detached: false,
        }
      );

      pythonProcess.on('error', (err) => {
        console.warn('[StegXplore Desktop] Could not spawn local Python backend:', err.message);
      });

      // Poll until online or 6 seconds passed
      for (let i = 0; i < 12; i++) {
        await new Promise((r) => setTimeout(r, 500));
        if (await checkBackendOnline(500)) {
          console.log('[StegXplore Desktop] Local backend successfully started and ready!');
          break;
        }
      }
    } catch (e) {
      console.warn('[StegXplore Desktop] Backend auto-spawn error:', e);
    }
  }
}

function stopBackendProcess() {
  if (pythonProcess) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', pythonProcess.pid, '/f', '/t'], { windowsHide: true });
      } else {
        pythonProcess.kill('SIGTERM');
      }
    } catch {
      // Ignore
    }
    pythonProcess = null;
  }
}

// ==========================================
// Restore window size/position across launches
// ==========================================

const STATE_FILE = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const s   = JSON.parse(raw);
    if (s && s.width > 800 && s.height > 600) return s;
  } catch { /* first launch or corrupted file */ }
  return { width: 1300, height: 860, x: undefined, y: undefined };
}

function saveWindowState(win) {
  try {
    if (win.isMaximized() || win.isFullScreen()) return;
    const [x, y]          = win.getPosition();
    const [width, height] = win.getSize();
    fs.writeFileSync(STATE_FILE, JSON.stringify({ width, height, x, y }));
  } catch { /* storage unavailable */ }
}

// ==========================================
// Resolve icon path
// ==========================================

function resolveIcon() {
  const candidates = [
    path.join(__dirname, '../public/icon.png'),
    path.join(__dirname, '../public/stegxplore-logo.jpg'),
    path.join(__dirname, '../dist/icon.png'),
    path.join(__dirname, '../dist/stegxplore-logo.jpg'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

// ==========================================
// Create the main window
// ==========================================

function createWindow() {
  const state     = loadWindowState();
  const iconPath  = resolveIcon();

  const mainWindow = new BrowserWindow({
    width:     state.width,
    height:    state.height,
    x:         state.x,
    y:         state.y,
    minWidth:  1000,
    minHeight: 660,
    backgroundColor: '#0d071c',
    title: 'StegXplore - Forensic Steganography Suite',
    icon: iconPath,
    frame: true,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    }
  });

  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (state.maximized) mainWindow.maximize();
  });

  mainWindow.on('close',   () => saveWindowState(mainWindow));
  mainWindow.on('resize',  () => saveWindowState(mainWindow));
  mainWindow.on('move',    () => saveWindowState(mainWindow));
  mainWindow.on('maximize', () => {
    try {
      const saved = loadWindowState();
      fs.writeFileSync(STATE_FILE, JSON.stringify({ ...saved, maximized: true }));
    } catch { /* ignore */ }
  });
  mainWindow.on('unmaximize', () => saveWindowState(mainWindow));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return mainWindow;
}

// ==========================================
// App lifecycle
// ==========================================

app.whenReady().then(async () => {
  await ensureBackendRunning();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  stopBackendProcess();
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  stopBackendProcess();
});

app.on('before-quit', () => {
  stopBackendProcess();
});

// ==========================================
// IPC Handlers
// ==========================================

ipcMain.handle('app:version',  () => app.getVersion());
ipcMain.handle('app:platform', () => process.platform);
ipcMain.handle('app:name',     () => app.getName());

ipcMain.handle('window:minimize',  () => BrowserWindow.getFocusedWindow()?.minimize());
ipcMain.handle('window:maximize',  () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;
  win.isMaximized() ? win.unmaximize() : win.maximize();
});
ipcMain.handle('window:close',     () => BrowserWindow.getFocusedWindow()?.close());
ipcMain.handle('window:isMaximized', () => BrowserWindow.getFocusedWindow()?.isMaximized() ?? false);
