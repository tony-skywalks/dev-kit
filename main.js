const {app,BrowserWindow,Menu,ipcMain} = require("electron")
const path = require('path')
const {dialog} = require('electron');
const { resolve } = require('path');
const fs = require('fs')


const isMac = process.platform === "darvin"
const isDev = process.env.NODE_ENV !== 'production'
let mainWindow;

createMainWindow = () => {
  mainWindow = new BrowserWindow({
    webPreferences: {
      contextIsolation:true,
      nodeIntegration:true,
      enableRemoteModule: true,
      preload:path.join(__dirname,'preload.js')
    },
    title:'File Search',
    width: isDev ? 1600 : 1000,
    height:800,
  })
  
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }
  mainWindow.loadFile(path.join(__dirname,'./renderer/index.html'))
}

app.whenReady().then(() => {
  createMainWindow()
  
  appMenu = Menu.buildFromTemplate([{role:'fileMenu'}])
  Menu.setApplicationMenu(appMenu)

  app.on('activate',()=> {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    } 
  })
})  

app.on('window-all-closed',()=> {
  if (!isMac) {
    app.quit()
  }
})

ipcMain.on('delete:file',(e,options) => {
  if (options['file'] !== undefined) {
    fs.unlink(options['file'],(err) => console.log(err))
  }
})

ipcMain.on('select:location',(e,options) => {
  let properties = { properties: ['openDirectory'] }
  if (options['dir'] !== '') {
    properties.defaultPath = options['dir'] 
  }
  dialog.showOpenDialog(properties).then((res)=> {
    if (res.canceled === false) {
      mainWindow.webContents.send('set:searchbar',{path:res.filePaths[0]})
      getFilesWithSize(res.filePaths[0]).then((filesMap) => {
        mainWindow.webContents.send('get:results',{res:filesMap})
      }).catch((e)=>{
        console.log("Some Error Occured",e);
      })
    }
  })
})

async function* getFiles(dir) {
  const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
};

async function getFilesWithSize(dir) {
  var results = [];
  var i = 0;
  for await (const f of getFiles(dir)) {
    s = formatBytes(fs.statSync(f).size)
    results[i] = {name:f,size:s}
    i++;
  }
  return results
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}