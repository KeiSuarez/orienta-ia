const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: 'Orienta IA - Superintendencia de Servicios de Salud',
    backgroundColor: '#0B192C',
    icon: path.join(__dirname, '../public/pwa-512x512.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false, // Don't show until ready-to-show to prevent white flash
  });

  // Graceful show
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load URL or local build
  const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === '1';
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Intercept external links and open in system browser (e.g. SSSalud portal, TAD, WhatsApp)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Build clean application menu
  const menuTemplate = [
    {
      label: 'Orienta IA',
      submenu: [
        { label: 'Acerca de Orienta IA', role: 'about' },
        { type: 'separator' },
        { label: 'Reiniciar aplicación', role: 'reload' },
        { label: 'Forzar recarga', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Salir', role: 'quit' },
      ],
    },
    {
      label: 'Edición',
      submenu: [
        { label: 'Deshacer', role: 'undo' },
        { label: 'Rehacer', role: 'redo' },
        { type: 'separator' },
        { label: 'Cortar', role: 'cut' },
        { label: 'Copiar', role: 'copy' },
        { label: 'Pegar', role: 'paste' },
        { label: 'Seleccionar todo', role: 'selectAll' },
      ],
    },
    {
      label: 'Ver',
      submenu: [
        { label: 'Restablecer zoom', role: 'resetZoom' },
        { label: 'Acercar', role: 'zoomIn' },
        { label: 'Alejar', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Pantalla completa', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'SSSalud Institucional',
      submenu: [
        {
          label: 'Portal Oficial SSSalud',
          click: () => shell.openExternal('https://www.argentina.gob.ar/sssalud'),
        },
        {
          label: 'Plataforma TAD (Trámites a Distancia)',
          click: () => shell.openExternal('https://tramitesadistancia.gob.ar'),
        },
        {
          label: 'Línea de Atención 0800-222-72583',
          click: () => shell.openExternal('tel:080022272583'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
