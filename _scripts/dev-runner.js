process.env.NODE_ENV = 'development'

const electron = require('electron')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const kill = require('tree-kill')

const path = require('path')
const { spawn } = require('child_process')

const mainConfig = require('./webpack.main.config')
const rendererConfig = require('./webpack.renderer.config')
const workersConfig = require('./webpack.workers.config')

let electronProcess = null
let manualRestart = null
const remoteDebugging = !!(
  process.argv[2] && process.argv[2] === '--remote-debug'
)

if (remoteDebugging) {
  // disable dvtools open in electron
  process.env.RENDERER_REMOTE_DEBUGGING = true
}

async function killElectron(pid) {
  return new Promise((resolve, reject) => {
    if (pid) {
      kill(pid, err => {
        if (err) reject(err)

        resolve()
      })
    } else {
      resolve()
    }
  })
}

async function restartElectron() {
  console.log('\nStarting electron...')

  const { pid } = electronProcess || {}
  await killElectron(pid)

  electronProcess = spawn(electron, [
    path.join(__dirname, '../dist/main.js'),
    // '--enable-logging', Enable to show logs from all electron processes
    remoteDebugging ? '--inspect=9222' : '',
    remoteDebugging ? '--remote-debugging-port=9223' : '',
  ])

  electronProcess.on('exit', (code, signal) => {
    if (!manualRestart) process.exit(0)
  })
}

function startMain() {
  const webpackSetup = webpack([mainConfig, workersConfig])

  webpackSetup.compilers.forEach(compiler => {
    const { name } = compiler

    switch (name) {
      case 'workers':
        compiler.hooks.afterEmit.tap('afterEmit', async () => {
          console.log(`\nCompiled ${name} script!`)
          console.log(`\nWatching file changes for ${name} script...`)
        })
        break
      case 'main':
      default:
        compiler.hooks.afterEmit.tap('afterEmit', async () => {
          console.log(`\nCompiled ${name} script!`)

          manualRestart = true
          await restartElectron()

          setTimeout(() => {
            manualRestart = false
          }, 2500)

          console.log(`\nWatching file changes for ${name} script...`)
        })
        break
    }
  })

  webpackSetup.watch({
    aggregateTimeout: 500,
  },
    err => {
      if (err) console.error(err)
    })
}

function startRenderer(callback) {
  const compiler = webpack(rendererConfig)
  const { name } = compiler

  compiler.hooks.afterEmit.tap('afterEmit', () => {
    console.log(`\nCompiled ${name} script!`)
    console.log(`\nWatching file changes for ${name} script...`)
  })

  const server = new WebpackDevServer(compiler, {
    contentBase: path.join(__dirname, '../'),
    hot: true,
    noInfo: true,
    overlay: true,
    clientLogLevel: 'warning',
  })

  server.listen(9080, '', err => {
    if (err) console.error(err)

    callback()
  })
}

startRenderer(startMain)
