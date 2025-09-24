const { app, BrowserWindow } = require('electron')

// create a browser window
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600
  })

  win.loadFile('index.html')
}


// main
app.whenReady().then(() => {
  createWindow()
})

// Exit application when window is closed
app.on('window-all-closed', () => { app.quit() })