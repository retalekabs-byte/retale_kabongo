;(function () {
  var app = document.getElementById('chat-app')
  var back = document.getElementById('btn-back-list')
  var themeBtn = document.getElementById('theme-toggle')
  var sun = themeBtn && themeBtn.querySelector('.theme-icon-sun')
  var moon = themeBtn && themeBtn.querySelector('.theme-icon-moon')

  function applyTheme(dark) {
    document.body.classList.toggle('theme-dark', dark)
    if (sun && moon) {
      sun.hidden = dark
      moon.hidden = !dark
    }
    try {
      localStorage.setItem('kadea-theme', dark ? 'dark' : 'light')
    } catch (e) {}
  }

  var saved = null
  try {
    saved = localStorage.getItem('kadea-theme')
  } catch (e) {}
  applyTheme(saved === 'dark')

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      applyTheme(!document.body.classList.contains('theme-dark'))
    })
  }

  document.querySelectorAll('form').forEach(function (form) {
    form.addEventListener('submit', function () {
      var button = form.querySelector('[type="submit"]')
      if (!button || button.getAttribute('data-loading')) return
      button.setAttribute('data-loading', '1')
      window.setTimeout(function () {
        button.disabled = true
        if (button.classList.contains('auth-submit')) button.textContent = 'Envoi…'
      }, 0)
    })
  })

  if (!app || !back) return
  if (window.matchMedia('(max-width: 900px)').matches) {
    app.classList.remove('show-list')
  }
  back.addEventListener('click', function () {
    app.classList.add('show-list')
  })
  document.querySelectorAll('.chat-conv').forEach(function (el) {
    el.addEventListener('click', function (event) {
      if (el.getAttribute('href') !== '#') return
      event.preventDefault()
      document.querySelectorAll('.chat-conv').forEach(function (item) {
        item.classList.remove('is-active')
      })
      el.classList.add('is-active')
      app.classList.remove('show-list')
    })
  })
})()
