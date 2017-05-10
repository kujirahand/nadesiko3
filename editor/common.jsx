import React from 'react'

export function ajaxGet (url, param, callback) {
  const xhr = new window.XMLHttpRequest()
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return
    callback(xhr.responseText, xhr)
  }
  xhr.open('GET', url)
  xhr.send(param)
}

export function nl2br (text) {
  const regex = /(\n)/g
  return text.split(regex).map((line, i) => {
    if (line.match(regex)) {
      return React.createElement('br', {key: 'br-' + i})
    } else {
      return line
    }
  })
}
