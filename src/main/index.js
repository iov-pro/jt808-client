// import { app, BrowserWindow, Menu, dialog } from 'electron'
import { productName, updateServer } from '../../package.json'
import { autoUpdater } from 'electron-updater'
import { app, BrowserWindow, Menu } from 'electron'

// set app name
app.setName(productName)

// disable electron warning
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

const gotTheLock = app.requestSingleInstanceLock()
const isDev = process.env.NODE_ENV === 'development'
const isDebug = process.argv.includes('--debug')
let mainWindow

// only allow single instance of application
if (!isDev) {
  if (gotTheLock) {
    app.on('second-instance', () => {
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow && mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    })
  } else {
    app.quit()
    process.exit(0)
  }
} else {
  require('electron-debug')({
    showDevTools: !(process.env.RENDERER_REMOTE_DEBUGGING === 'true'),
  })
}

async function installDevTools() {
  try {
    /* eslint-disable */
    require('devtron').install()
    require('vue-devtools').install()
    /* eslint-enable */
  } catch (err) {
    console.log(err)
  }
}

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    backgroundColor: '#fff',
    width: 960,
    height: 540,
    minWidth: 960,
    minHeight: 540,
    // useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: false,
      webSecurity: false,
    },
    show: false,
  })

  // eslint-disable-next-line
  setMenu()

  // load root file/url
  if (isDev) {
    mainWindow.loadURL('http://localhost:9080')
  } else {
    mainWindow.loadFile(`${__dirname}/index.html`)

    global.__static = require('path')
      .join(__dirname, '/static')
      .replace(/\\/g, '\\\\')
  }

  // Show when loaded
  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.on('closed', () => {
    console.log('closed')
  })
}

app.on('ready', () => {
  createWindow()

  if (isDev) {
    installDevTools()
  }

  if (isDebug) {
    mainWindow.webContents.openDevTools()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */
const updateApp = 'jt808client';
const updatePlatform = 'windows_64';
const feed = `${updateServer}/update/${updateApp}/${updatePlatform}`

autoUpdater.setFeedURL(feed)

autoUpdater.on('update-downloaded', () => {
  const dialogOpts = {
    type: 'info',
    buttons: ['更新', '稍后'],
    title: '应用程序更新',
    message: productName,
    detail: '一个新的版本已经下载完成，重新应用并应用更新。'
  }

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall()
  })
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})

// const sendMenuEvent = async data => {
//   mainWindow.webContents.send('change-view', data)
// }

// const template = [
//   {
//     label: app.getName(),
//     submenu: [
//       {
//         label: 'Home',
//         accelerator: 'CommandOrControl+H',
//         click() {
//           sendMenuEvent({ route: '/' })
//         },
//       },
//       { type: 'separator' },
//       {
//         label: '场景编辑器',
//         accelerator: 'CommandOrControl+1',
//         click() {
//           sendMenuEvent({ route: '/scene' })
//         },
//       },
//       {
//         label: '材质编辑器',
//         accelerator: 'CommandOrControl+2',
//         click() {
//           sendMenuEvent({ route: '/material' })
//         },
//       },
//       {
//         label: '后期编辑器',
//         accelerator: 'CommandOrControl+3',
//         click() {
//           sendMenuEvent({ route: '/effect' })
//         },
//       },
//       { type: 'separator' },
//       { role: 'minimize' },
//       { role: 'togglefullscreen' },
//       { type: 'separator' },
//       { role: 'quit', accelerator: 'Alt+F4' },
//     ],
//   },
//   {
//     role: 'help',
//     submenu: [
//       {
//         label: 'Get Help',
//         role: 'help',
//         accelerator: 'F1',
//         click() {
//           sendMenuEvent({ route: '/help' })
//         },
//       },
//       {
//         label: 'About',
//         role: 'about',
//         accelerator: 'CommandOrControl+A',
//         click() {
//           sendMenuEvent({ route: '/about' })
//         },
//       },
//     ],
//   },
// ]

function setMenu() {
  // if (process.platform === 'darwin') {
  //   template.unshift({
  //     label: app.getName(),
  //     submenu: [
  //       { role: 'about' },
  //       { type: 'separator' },
  //       { role: 'services' },
  //       { type: 'separator' },
  //       { role: 'hide' },
  //       { role: 'hideothers' },
  //       { role: 'unhide' },
  //       { type: 'separator' },
  //       { role: 'quit' },
  //     ],
  //   })

  //   template.push({
  //     role: 'window',
  //   })

  //   template.push({
  //     role: 'help',
  //   })

  //   template.push({ role: 'services' })
  // }

  // const menu = Menu.buildFromTemplate(template)
  // Menu.setApplicationMenu(menu)
  Menu.setApplicationMenu(null)
}
