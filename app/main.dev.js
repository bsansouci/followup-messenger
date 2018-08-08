/* eslint global-require: 0, flowtype-errors/show-errors: 0 */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import MenuBuilder from './menu';
import fbchat from 'facebook-chat-api';

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
  const path = require('path');
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);
  
  var fuckingGarbage;
  fbchat({appState: JSON.parse(require('fs').readFileSync('./appstate.json', 'utf8'))}, (err, api) => {
      if (err) {
        console.error(err);
        return;
      }
      fuckingGarbage = api;
      // require('fs').writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
      
      ipcMain.on('getFriendsList', (event) => {
         api.getFriendsList((err, data) => {
          if (err) {
            console.error("getFriendsList", err);
            return;
          }

          event.sender.send('getFriendsListResponse', data);
        });
      });
      
      ipcMain.on('getThreadList', (event) => {
        console.log("getThreadList");
         api.getThreadList(20, null, [], (err, data) => {
          if (err) {
            console.error("getThreadList", err);
            return;
          }

          event.sender.send('getThreadListResponse', data);
        });
      });
      
      ipcMain.on('getThreadHistory', (event, args) => {
        console.log("getThreadHistory");
        api.getThreadHistory(args.threadID, args.amount, args.timestamp, (err, data) => {
          if (err) {
            console.error("getThreadHistory", err);
            return;
          }

          event.sender.send('getThreadHistoryResponse', data);
        });
      });
      
      ipcMain.on('sendMessage', (event, args) => {
        let now = Date.now();
        console.log("sendMessage", now);
         api.sendMessage(args.body, args.threadID, (err, data) => {
          if (err) {
            console.error("sendMessage", err);
            return;
          }
          console.log("timestamp - now = ", data.timestamp - now);
          event.sender.send('sendMessageResponse', data);
        });
      });
      
      ipcMain.on('markAsRead', (event, args) => {
        console.log("markAsRead");
         api.markAsRead(args.threadID, args.read, (err, data) => {
          if (err) {
            console.error("markAsRead", err);
            return;
          }

          // event.sender.send('sendMessageResponse', data);
        });
      });
      
      ipcMain.on('listen', (event, args) => {
         api.listen((err, data) => {
          if (err) {
            console.error("listen", err);
            return;
          }

          event.sender.send('message', data);
        });
      });
    });
  
  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    mainWindow.focus();
    
    
    ipcMain.on('test', console.log);
    mainWindow.webContents.send("message", "hey");
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
});
