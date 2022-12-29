const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipc', {
   loadPlaidConfig: () => ipcRenderer.invoke('loadPlaidConfig'),
   addPlaidItem: (plaidItem) => ipcRenderer.invoke('addPlaidItem', plaidItem),
   updatePlaidItem: (plaidItem) => ipcRenderer.invoke('updatePlaidItem', plaidItem),
   savePlaidConfig: (plaidConfig) => ipcRenderer.invoke('savePlaidConfig', plaidConfig),
   loadMappings: () => ipcRenderer.invoke('loadMappings'),
   saveCSVFile: (csvFileName, csvContent) => ipcRenderer.invoke('saveCSVFile', csvFileName, csvContent),
});
