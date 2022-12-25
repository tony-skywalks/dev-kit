const {app,BrowserWindow,Menu,ipcMain} = require("electron")
const path = require('path')
const {dialog} = require('electron');
const { resolve } = require('path');
const fs = require('fs')
const {FileCleaner} = require('./cleaner/cleaner')


const isMac = process.platform === "darvin"
const isDev = process.env.NODE_ENV !== 'production'
let mainWindow;
let lastDir = '';

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
  if (lastDir != '' && lastDir == options.dir && options.trigger == false) {
    mainWindow.webContents.send('set:searchbar',{path:lastDir})
    let fc = new FileCleaner(options.dir,options.options)
    fc.getFilesWithSize(lastDir,options.options).then((filesMap) => {
      mainWindow.webContents.send('get:results',{res:filesMap})
    }).catch((e)=>{
      console.log("Some Error Occured",e);
      mainWindow.webContents.send('on:error',{msg:e})
    })
  } else {
    dialog.showOpenDialog(properties).then((res)=> {
      if (res.canceled === false) {
        mainWindow.webContents.send('set:searchbar',{path:res.filePaths[0]})
        let fc = new FileCleaner(res.filePaths[0],options.options)
        lastDir = res.filePaths[0]
        fc.getFilesWithSize(res.filePaths[0],options.options).then((filesMap) => {
          mainWindow.webContents.send('get:results',{res:filesMap})
        }).catch((e)=>{
          console.log("Some Error Occured",e);
          mainWindow.webContents.send('on:error',{msg:e})
        })
      }
    })
  }
})
