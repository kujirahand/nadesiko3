export function ajaxGet (url, param, callback) {
  const xhr = new window.XMLHttpRequest()
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return
    callback(xhr.responseText, xhr)
  }
  xhr.open('GET', url)
  xhr.send(param)
}
