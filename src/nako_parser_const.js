/* eslint-disable quote-props */
const opPriority = {
  // and or
  'and': 1,
  'or': 1,
  // compare
  'eq': 2,
  'noteq': 2,
  '===': 2,
  '!==': 2,
  'gt': 2,
  'gteq': 2,
  'lt': 2,
  'lteq': 2,
  '&': 3,
  // + - << >> >>>
  '+': 4,
  '-': 4,
  'shift_l': 4,
  'shift_r': 4,
  'shift_r0': 4,
  // * /
  '*': 5,
  '/': 5,
  '%': 5,
  // ^
  '^': 6
}

const keizokuJosi = [
  'いて', 'えて', 'きて', 'けて', 'して', 'って', 'にて', 'みて', 'めて', 'ねて', 'には', 'んで'
]

module.exports = {
  opPriority,
  keizokuJosi
}
