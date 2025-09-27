const { app, BrowserWindow, Menu } = require('electron')

// create the browser window
const createWindow = () => {
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      //preload: path.join(__dirname, 'preload.js')
    }
  })
  // load html file
  window.loadFile('index.html')
}

// create top bar menu (nothing for now)
const menu_template = []
// set template created above
Menu.setApplicationMenu(Menu.buildFromTemplate(menu_template))

// main
app.whenReady().then(() => {
  createWindow()
})

// exit application when window is closed
app.on('window-all-closed', () => { app.quit() })