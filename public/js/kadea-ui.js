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

  document.addEventListener('input', function (event) {
    var target = event.target
    if (!target || !target.closest) return
    var field = target.closest('.auth-field')
    if (field) {
      field.querySelectorAll('.auth-field-error').forEach(function (el) {
        el.remove()
      })
      target.removeAttribute('aria-invalid')
    }
    var scope = target.closest('.auth-card, .chat-profile, .chat-main, .chat-group-form')
    if (!scope) return
    scope.querySelectorAll('.auth-message--error, .chat-composer-error').forEach(function (el) {
      el.remove()
    })
  })

  var newChatBtn = document.getElementById('btn-new-chat')
  var newChatPop = document.getElementById('new-chat-pop')
  var newChatSearch = document.getElementById('new-chat-search')
  var newChatList = document.getElementById('new-chat-list')
  var newChatCsrf = document.querySelector('#new-chat-csrf input')

  function renderPeople(people) {
    newChatList.textContent = ''
    if (!people.length) {
      var empty = document.createElement('p')
      empty.className = 'chat-empty'
      empty.textContent = 'Aucune personne trouvée.'
      newChatList.appendChild(empty)
      return
    }
    people.forEach(function (person) {
      var row = document.createElement('div')
      row.className = 'chat-person'
      if (person.avatar) {
        var img = document.createElement('img')
        img.className = 'chat-avatar'
        img.alt = ''
        img.src = person.avatar
        row.appendChild(img)
      } else {
        var avatar = document.createElement('div')
        avatar.className = 'chat-avatar'
        avatar.textContent = person.initials
        row.appendChild(avatar)
      }
      var meta = document.createElement('div')
      meta.className = 'chat-conv-meta'
      var name = document.createElement('span')
      name.className = 'chat-conv-name'
      name.textContent = person.fullName
      var preview = document.createElement('p')
      preview.className = 'chat-conv-preview'
      preview.textContent = person.email
      meta.appendChild(name)
      meta.appendChild(preview)
      row.appendChild(meta)
      if (person.blocked) {
        var quiet = document.createElement('span')
        quiet.className = 'chat-person-btn chat-person-btn--quiet'
        quiet.textContent = 'Bloqué'
        row.appendChild(quiet)
      } else {
        var form = document.createElement('form')
        form.method = 'post'
        form.action = newChatPop.getAttribute('data-store')
        var csrf = document.createElement('input')
        csrf.type = 'hidden'
        csrf.name = '_csrf'
        csrf.value = newChatCsrf ? newChatCsrf.value : ''
        var userId = document.createElement('input')
        userId.type = 'hidden'
        userId.name = 'userId'
        userId.value = String(person.id)
        var button = document.createElement('button')
        button.type = 'submit'
        button.className = 'btn-primary chat-person-btn'
        button.textContent = 'Discuter'
        form.appendChild(csrf)
        form.appendChild(userId)
        form.appendChild(button)
        row.appendChild(form)
      }
      newChatList.appendChild(row)
    })
  }

  function loadPeople(query) {
    var url = newChatPop.getAttribute('data-people') + '?q=' + encodeURIComponent(query || '')
    newChatList.textContent = 'Chargement…'
    fetch(url, { headers: { accept: 'application/json' }, credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('load')
        return res.json()
      })
      .then(renderPeople)
      .catch(function () {
        newChatList.textContent = ''
        var error = document.createElement('p')
        error.className = 'chat-empty'
        error.textContent = 'Impossible de charger les personnes.'
        newChatList.appendChild(error)
      })
  }

  if (newChatBtn && newChatPop) {
    newChatBtn.addEventListener('click', function () {
      var groupPanel = document.getElementById('new-group-pop')
      if (groupPanel) groupPanel.hidden = true
      newChatPop.hidden = !newChatPop.hidden
      if (!newChatPop.hidden) {
        if (newChatSearch) newChatSearch.value = ''
        loadPeople('')
        if (newChatSearch) newChatSearch.focus()
      }
    })
    newChatPop.querySelectorAll('[data-close-chat]').forEach(function (button) {
      button.addEventListener('click', function () {
        newChatPop.hidden = true
      })
    })
    document.addEventListener('click', function (event) {
      if (newChatPop.hidden) return
      if (newChatPop.contains(event.target) || newChatBtn.contains(event.target)) return
      newChatPop.hidden = true
    })
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') newChatPop.hidden = true
    })
    if (newChatSearch) {
      var searchTimer
      newChatSearch.addEventListener('input', function () {
        window.clearTimeout(searchTimer)
        var value = newChatSearch.value
        searchTimer = window.setTimeout(function () {
          loadPeople(value)
        }, 200)
      })
    }
  }

  var groupBtn = document.getElementById('btn-new-group')
  var groupPop = document.getElementById('new-group-pop')
  var groupForm = document.getElementById('new-group-form')
  var groupSearch = document.getElementById('new-group-search')
  var groupList = document.getElementById('new-group-list')
  var groupSelected = document.getElementById('new-group-selected')
  var groupHint = document.getElementById('new-group-hint')
  var picked = []
  var lastPeople = []

  function personChosen(id) {
    return picked.some(function (person) {
      return person.id === id
    })
  }

  function renderPicked() {
    groupSelected.textContent = ''
    picked.forEach(function (person) {
      var chip = document.createElement('button')
      chip.type = 'button'
      chip.className = 'chat-pop-chip'
      chip.textContent = person.fullName + ' ×'
      chip.addEventListener('click', function () {
        picked = picked.filter(function (item) {
          return item.id !== person.id
        })
        renderPicked()
        renderGroupPeople(lastPeople)
      })
      groupSelected.appendChild(chip)
    })
  }

  function renderGroupPeople(people) {
    lastPeople = people
    groupList.textContent = ''
    if (!people.length) {
      var empty = document.createElement('p')
      empty.className = 'chat-empty'
      empty.textContent = 'Aucune personne trouvée.'
      groupList.appendChild(empty)
      return
    }
    people.forEach(function (person) {
      var row = document.createElement('div')
      row.className = 'chat-person'
      var avatar = document.createElement('div')
      avatar.className = 'chat-avatar'
      avatar.textContent = person.initials
      if (person.avatar) {
        var img = document.createElement('img')
        img.className = 'chat-avatar'
        img.alt = ''
        img.src = person.avatar
        row.appendChild(img)
      } else {
        row.appendChild(avatar)
      }
      var meta = document.createElement('div')
      meta.className = 'chat-conv-meta'
      var name = document.createElement('span')
      name.className = 'chat-conv-name'
      name.textContent = person.fullName
      var preview = document.createElement('p')
      preview.className = 'chat-conv-preview'
      preview.textContent = person.email
      meta.appendChild(name)
      meta.appendChild(preview)
      row.appendChild(meta)
      var button = document.createElement('button')
      button.type = 'button'
      var chosen = personChosen(person.id)
      button.className = chosen ? 'chat-person-btn chat-person-btn--quiet' : 'btn-primary chat-person-btn'
      button.textContent = chosen ? 'Retirer' : 'Ajouter'
      button.addEventListener('click', function () {
        if (personChosen(person.id)) {
          picked = picked.filter(function (item) {
            return item.id !== person.id
          })
        } else {
          picked.push(person)
        }
        if (groupHint) groupHint.classList.remove('is-error')
        renderPicked()
        renderGroupPeople(lastPeople)
      })
      row.appendChild(button)
      groupList.appendChild(row)
    })
  }

  function loadGroupPeople(query) {
    var url = groupPop.getAttribute('data-people') + '?q=' + encodeURIComponent(query || '')
    groupList.textContent = 'Chargement…'
    fetch(url, { headers: { accept: 'application/json' }, credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('load')
        return res.json()
      })
      .then(renderGroupPeople)
      .catch(function () {
        groupList.textContent = ''
        var error = document.createElement('p')
        error.className = 'chat-empty'
        error.textContent = 'Impossible de charger les personnes.'
        groupList.appendChild(error)
      })
  }

  if (groupBtn && groupPop && groupForm) {
    groupBtn.addEventListener('click', function () {
      if (newChatPop) newChatPop.hidden = true
      groupPop.hidden = !groupPop.hidden
      if (!groupPop.hidden) {
        picked = []
        renderPicked()
        if (groupSearch) groupSearch.value = ''
        if (groupHint) groupHint.classList.remove('is-error')
        loadGroupPeople('')
        var nameInput = document.getElementById('new-group-name')
        if (nameInput) nameInput.focus()
      }
    })
    groupPop.querySelectorAll('[data-close-pop]').forEach(function (button) {
      button.addEventListener('click', function () {
        groupPop.hidden = true
      })
    })
    document.addEventListener('click', function (event) {
      if (groupPop.hidden) return
      if (groupPop.contains(event.target) || groupBtn.contains(event.target)) return
      groupPop.hidden = true
    })
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') groupPop.hidden = true
    })
    if (groupSearch) {
      var groupTimer
      groupSearch.addEventListener('input', function () {
        window.clearTimeout(groupTimer)
        var value = groupSearch.value
        groupTimer = window.setTimeout(function () {
          loadGroupPeople(value)
        }, 200)
      })
    }
    groupForm.addEventListener('submit', function (event) {
      if (!picked.length) {
        event.preventDefault()
        event.stopImmediatePropagation()
        if (groupHint) groupHint.classList.add('is-error')
        return
      }
      groupForm.querySelectorAll('input[name="members"]').forEach(function (input) {
        input.remove()
      })
      picked.forEach(function (person) {
        var input = document.createElement('input')
        input.type = 'hidden'
        input.name = 'members'
        input.value = String(person.id)
        groupForm.appendChild(input)
      })
    })
  }

  var peerInfoBtn = document.getElementById('btn-peer-info')
  var peerInfoPop = document.getElementById('peer-info-pop')
  if (peerInfoBtn && peerInfoPop) {
    peerInfoBtn.addEventListener('click', function () {
      peerInfoPop.hidden = !peerInfoPop.hidden
    })
    document.addEventListener('click', function (event) {
      if (peerInfoPop.hidden) return
      if (peerInfoPop.contains(event.target) || peerInfoBtn.contains(event.target)) return
      peerInfoPop.hidden = true
    })
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') peerInfoPop.hidden = true
    })
  }

  document.addEventListener('click', function (event) {
    var more = event.target.closest('.chat-bubble-more')
    var row = more ? more.closest('.chat-row') : null
    var menu = row ? row.querySelector('.chat-bubble-menu') : null
    document.querySelectorAll('.chat-bubble-menu.is-open').forEach(function (openMenu) {
      if (openMenu === menu) return
      openMenu.classList.remove('is-open')
      var button = openMenu.parentElement && openMenu.parentElement.querySelector('.chat-bubble-more')
      if (button) button.setAttribute('aria-expanded', 'false')
    })
    if (!more || !menu) return
    var open = !menu.classList.contains('is-open')
    menu.classList.toggle('is-open', open)
    more.setAttribute('aria-expanded', open ? 'true' : 'false')
  })

  var listSearch = document.getElementById('chat-list-search')
  if (listSearch) {
    listSearch.addEventListener('input', function () {
      var term = listSearch.value.trim().toLowerCase()
      document.querySelectorAll('.chat-list .chat-conv').forEach(function (item) {
        var text = item.textContent.toLowerCase()
        item.hidden = term !== '' && text.indexOf(term) === -1
      })
    })
  }

  var firstInvalid = document.querySelector('.auth-field:has(.auth-field-error) input, .auth-field:has(.auth-field-error) textarea')
  if (firstInvalid) {
    firstInvalid.setAttribute('aria-invalid', 'true')
    firstInvalid.focus()
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
