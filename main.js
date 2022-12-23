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
      getFilesWithSize(res.filePaths[0],options.options).then((filesMap) => {
        mainWindow.webContents.send('get:results',{res:filesMap})
        console.log("here");
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

async function getFilesWithSize(dir,options) {
  let sizeArry = {
    '0':0,
    '1':1000000,
    '2':5000000,
    '3':10000000,
    '4':10000000,
    '5':50000000,
    '6':100000000,
    '7':500000000,
    '7':1000000000,
  }
  let size = sizeArry[options.filter]
  var results = [];
  var i = 0;
  console.log(size)
  for await (const f of getFiles(dir)) {
    if (options.filter == '0') {
      s = fs.statSync(f).size
      results[i] = {name:f,size:s}
      i++;
    } else {
      s = fs.statSync(f).size
      if (((s <= size) && (options.filter < 4)) || ((s >= size) && (options.filter >= 4)) ) {
        results[i] = {name:f,size:s}
        i++;
      }
    }
  }
  if (options.sort == 1) {
    results = sortArrayWithSize(results)
  } else if (options.sort == 2) {
    results = sortArrayWithSize(results).reverse()
  } else if (options.sort == 3) {
    results = sortArrayWithName(results)
  } else if (options.sort == 4) {
    results = sortArrayWithName(results).reverse()
  }
  return results
}

function sortArrayWithSize(arr) {
  for (let i = 0; i < arr.length; i++) {
    let lowest = i
    console.log(arr[i]);
    for (let j = i +1; j < arr.length; j++) {
        if (arr[lowest].size > arr[j].size) {
            lowest = j
        }        
    }

    if (lowest !== i) {
        let temp = arr[i]
        arr[i] = arr[lowest]
        arr[lowest] = temp
    }
  }
  return arr
}


function sortArrayWithName(arr) {
  for (let i = 0; i < arr.length; i++) {
    let lowest = i
    
    for (let j = i +1; j < arr.length; j++) {
        if (arr[lowest].name.localeCompare(arr[j].name) == 1) {
            lowest = j
        }        
    }

    if (lowest !== i) {
        let temp = arr[i]
        arr[i] = arr[lowest]
        arr[lowest] = temp
    }
  }
  return arr
}