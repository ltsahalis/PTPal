const { app, BrowserWindow } = require('electron')

// create the browser window
const createWindow = () => {
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })
  // load html file
  window.loadFile('index.html')
}


// main
app.whenReady().then(() => {
  createWindow()
})

// exit application when window is closed
app.on('window-all-closed', () => { app.quit() })