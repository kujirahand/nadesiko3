'use strict'

const path = require('path')
const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const Menu = electron.Menu

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('ready', () => {
  // メニューをアプリケーションに追加
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'ファイル',
      submenu: [
        {
          label: '終了',
          accelerator: 'Ctrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: '表示',
      submenu: [
        {
          label: '更新',
          accelerator: 'F5',
          click: () => BrowserWindow.getFocusedWindow().reload()
        }
      ]
    },
    {
      label: 'ツール',
      submenu: [
        {
          label: '開発者ツール',
          accelerator: 'Ctrl+Shift+I',
          click: () => BrowserWindow.getFocusedWindow().toggleDevTools()
        }
      ]
    }
  ]))

  // ブラウザ (Chromium) の起動, 初期画面のロード
  let win = new BrowserWindow({width: 800, height: 600})
  win.loadURL('file://' + path.join(__dirname, '..', 'demo', 'index.html'))
  win.on('closed', () => {
    win = null
  })
})
