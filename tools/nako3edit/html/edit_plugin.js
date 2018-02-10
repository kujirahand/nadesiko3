// Add-on function
window.addEventListener('load', () => {
  navigator.nako3.setFunc('表示', [['と', 'を']], (s) => {
    console.log('[LOG]', s)
  })
})

