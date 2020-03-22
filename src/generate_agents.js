const fs = require('fs')
const path = require('path')
const data = require('caniuse-db/data.json')

fs.writeFileSync(path.join(__dirname, 'agents.json'), JSON.stringify(data.agents))
