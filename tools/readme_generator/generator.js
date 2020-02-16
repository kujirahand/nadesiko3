const fs = require('fs')
const browserslist = require('browserslist')
const agents = require('caniuse-db/data.json').agents

const browsers = {}

for (const browserStr of browserslist()) {
  const browser = browserStr.split(' ')
  let type = 'その他'
  let device = ''

  if (browser[0] in agents) {
    const browserData = agents[browser[0]]

    if (browserData.browser === 'IE') {
      browser[0] = 'Internet Explorer'
    } else {
      browser[0] = browserData.browser
    }

    switch (browserData.type) {
      case 'mobile':
        type = 'Webブラウザ'
        device = 'モバイル'
        break
      case 'desktop':
        type = 'Webブラウザ'
        device = 'PC'
        break
      default:
        type = browserData.type
        break
    }
  } else if (browser[0] === 'node') {
    type = 'PC (Windows/macOS/Linux)'
    browser[0] = 'Node'
  }

  if (!(type in browsers)) {
    browsers[type] = {}
  }

  if (!(device in browsers[type])) {
    browsers[type][device] = {}
  }

  if (!(browser[0] in browsers[type][device])) {
    browsers[type][device][browser[0]] = []
  }

  browsers[type][device][browser[0]].push(browser[1])
}

const browserMd = []

for (const type in browsers) {
  browserMd.push('* ' + type)

  for (const device in browsers[type]) {
    let indent = ''

    if (device !== '') {
      browserMd.push('\t* ' + device)
      indent = '\t'
    }

    for (const browser in browsers[type][device]) {
      browserMd.push(indent + '\t* ' + browser)

      for (const version of browsers[type][device][browser]) {
        browserMd.push(indent + '\t\t* ' + version)
      }
    }
  }
}

let md = []

for (const row of fs.readFileSync('README.template.md').toString().split('\n')) {
  if (row === '{embed browser}') {
    md = md.concat(browserMd)
  } else {
    md.push(row)
  }
}

fs.writeFileSync('README.md', md.join('\n'))
