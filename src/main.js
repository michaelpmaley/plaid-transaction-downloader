const { app, BrowserWindow, ipcMain, session } = require('electron');
import fs from 'fs';
import os from 'os';
import path from 'path';

const PLAIDCONFIGFILE = path.join(app.getPath('userData'), 'plaidConfig.json');
const MAPPINGSFILE = path.join(app.getPath('userData'), 'transaction-mappings.json');
const DOWNLOADSFOLDER = path.join(os.homedir(), 'Downloads');


// Windows: handle creating/removing shortcuts when installing/uninstalling
// eslint-disable-next-line global-require
if (require('electron-squirrel-startup')) {
   app.quit();
}

const createWindow = () => {
   const mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
         // HACK to fix preload.js failing to load  https://codesti.com/issue/electron-userland/electron-forge/2931
         sandbox: false,
         //contextIsolation: true,
         //nodeIntegrationInWorker: true,
         // HACK to fix CORS
         webSecurity: false,
         preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      },
   });

   mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
   //mainWindow.webContents.openDevTools();
};

app.whenReady().then(() => {   // use instead of app.on('ready', () => {
   createWindow();

   // HACK to fix plaid scripts failing to load
   session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
         responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': ['default-src * cdn.plaid.com data: \'unsafe-eval\' \'unsafe-inline\'', 'script-src * cdn.plaid.com \'unsafe-eval\' \'unsafe-inline\''],
         }
      })
   });
});

app.on('activate', () => {
   // macOS: re-create a window in the app when the dock icon is clicked and there are no other windows open
   if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
   }
});

// HACK to skip local certificate errors
app.on("certificate-error", (event, webContents, url, error, cert, callback) => {
   if (url.startsWith ("https://localhost")) {
       event.preventDefault();
       callback(true);
   } else
      callback(false);
});
//app.commandLine.appendSwitch('ignore-certificate-errors');
//app.commandLine.appendSwitch('allow-insecure-localhost', 'true');
//win.webContents.session.setCertificateVerifyProc((request, callback) => {
//   if (request.hostname === 'localhost') {
//      callback(0); //this means trust this domain
//   } else {
//      callback(-3); //use chromium's verification result
//   }
//});

app.on('window-all-closed', () => {
   app.quit();
});


ipcMain.handle('loadPlaidConfig', async (event) => {
   if (!fs.existsSync(PLAIDCONFIGFILE)) {
      console.log(`Error: plaid config file does not exist`);
      return {};
   }
   return JSON.parse(fs.readFileSync(PLAIDCONFIGFILE, 'utf8'));
});

ipcMain.handle('addPlaidItem', async (event, plaidItem) => {
   if (!fs.existsSync(PLAIDCONFIGFILE)) {
      console.log(`Error: plaid config file does not exist`);
      return false;
   }
   const plaidConfig = JSON.parse(fs.readFileSync(PLAIDCONFIGFILE, 'utf8'));
   plaidConfig.items.push(plaidItem);
   fs.writeFileSync(PLAIDCONFIGFILE, JSON.stringify(plaidConfig) + '\n', 'utf8');
   return true;
});

ipcMain.handle('updatePlaidItem', async (event, plaidItem) => {
   if (!fs.existsSync(PLAIDCONFIGFILE)) {
      console.log(`Error: plaid config file does not exist`);
      return false;
   }
   const plaidConfig = JSON.parse(fs.readFileSync(PLAIDCONFIGFILE, 'utf8'));
   const i = plaidConfig.items.findIndex(item => item.id == plaidItem.id);
   plaidConfig.items[i] = plaidItem;
   fs.writeFileSync(PLAIDCONFIGFILE, JSON.stringify(plaidConfig) + '\n', 'utf8');
   return true;
});

ipcMain.handle('savePlaidConfig', async (event, plaidConfig) => {
   fs.writeFileSync(PLAIDCONFIGFILE, JSON.stringify(plaidConfig) + '\n', 'utf8');
});

ipcMain.handle('loadMappings', async (event) => {
   if (!fs.existsSync(MAPPINGSFILE)) {
      console.log(`Warning: mappings file does not exist`);
      return null;
   }
   return JSON.parse(fs.readFileSync(MAPPINGSFILE, 'utf8'));
});

ipcMain.handle('saveCSVFile', async (event, csvFileName, csvContent) => {
   fs.writeFileSync(path.join(DOWNLOADSFOLDER, csvFileName), csvContent + '\n', 'utf8');
});
