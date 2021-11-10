const a = require('caniuse-db/data.json').agents
const e = {}
const t = {}
for (let key in a) {
  e[key] = a[key]['browser'];
  let type = a[key]['type'];
  if (t[type] === undefined) {
    t[type] = [];
  }
  t[type].push(key)
}
console.log(JSON.stringify(e))
// console.log(JSON.stringify(t))
// console.log(JSON.stringify(a))
