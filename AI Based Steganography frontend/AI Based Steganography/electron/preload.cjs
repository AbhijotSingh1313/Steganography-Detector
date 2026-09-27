const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Identity
  isElectron: true,

  // App info
  getVersion:  () => ipcRenderer.invoke('app:version'),
  getPlatform: () => ipcRenderer.invoke('app:platform'),
  getName:     () => ipcRenderer.invoke('app:name'),

  // Custom window controls (usable from React if needed)
  minimize:    () => ipcRenderer.invoke('window:minimize'),
  maximize:    () => ipcRenderer.invoke('window:maximize'),
  close:       () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Menu actions (for future native menus)
  onMenuAction: (callback) => ipcRenderer.on('menu:action', (_event, value) => callback(value)),
});
