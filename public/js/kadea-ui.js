;(function () {
  var app = document.getElementById('chat-app')
  var back = document.getElementById('btn-back-list')

  function syncViewportFrame() {
    var vv = window.visualViewport
    var height = vv ? vv.height : window.innerHeight
    var offset = vv ? vv.offsetTop : 0
    document.documentElement.style.setProperty('--app-height', height + 'px')
    document.documentElement.style.setProperty('--app-offset', offset + 'px')
  }

  syncViewportFrame()
  window.addEventListener('resize', syncViewportFrame)
  window.addEventListener('orientationchange', syncViewportFrame)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncViewportFrame)
    window.visualViewport.addEventListener('scroll', syncViewportFrame)
  }

  document.addEventListener('focusin', function (event) {
    var target = event.target
    if (!target || !target.closest) return
    if (!target.closest('.chat-composer, .chat-search, .chat-pop, .auth-field, .chat-info-add')) return
    window.setTimeout(syncViewportFrame, 50)
    window.setTimeout(syncViewportFrame, 300)
  })
  document.addEventListener('focusout', function () {
    window.setTimeout(syncViewportFrame, 50)
    window.setTimeout(syncViewportFrame, 300)
  })

  function isDarkTheme() {
    return document.documentElement.classList.contains('theme-dark')
  }

  function applyTheme(dark) {
    document.documentElement.classList.toggle('theme-dark', dark)
    if (document.body) document.body.classList.toggle('theme-dark', dark)
    document.querySelectorAll('.js-theme-toggle').forEach(function (btn) {
      var sun = btn.querySelector('.theme-icon-sun')
      var moon = btn.querySelector('.theme-icon-moon')
      if (sun) sun.classList.toggle('is-hidden', dark)
      if (moon) moon.classList.toggle('is-hidden', !dark)
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false')
    })
    try {
      localStorage.setItem('kadea-theme', dark ? 'dark' : 'light')
    } catch (e) {}
  }

  var saved = null
  try {
    saved = localStorage.getItem('kadea-theme')
  } catch (e) {}
  applyTheme(saved === 'dark')

  var themeLock = false
  function onThemeToggle(event) {
    var btn = event.target.closest('.js-theme-toggle')
    if (!btn || themeLock) return
    themeLock = true
    event.preventDefault()
    event.stopPropagation()
    applyTheme(!isDarkTheme())
    window.setTimeout(function () {
      themeLock = false
    }, 350)
  }

  document.addEventListener('click', onThemeToggle, true)
  document.addEventListener(
    'touchend',
    function (event) {
      var btn = event.target.closest('.js-theme-toggle')
      if (!btn) return
      onThemeToggle(event)
    },
    { capture: true, passive: false }
  )

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
  var groupHint = document.getElementById('new-group-hint')
  var picked = []
  var lastPeople = []

  function personChosen(id) {
    return picked.some(function (person) {
      return person.id === id
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
      var row = document.createElement('label')
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
      var checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.className = 'chat-person-check'
      checkbox.checked = personChosen(person.id)
      checkbox.setAttribute('aria-label', 'Ajouter ' + person.fullName)
      checkbox.addEventListener('change', function () {
        if (checkbox.checked) {
          if (!personChosen(person.id)) picked.push(person)
        } else {
          picked = picked.filter(function (item) {
            return item.id !== person.id
          })
        }
        if (groupHint) groupHint.classList.remove('is-error')
      })
      row.appendChild(checkbox)
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
      groupSearch.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') event.preventDefault()
      })
    }
    groupForm.addEventListener('submit', function (event) {
      var nameInput = document.getElementById('new-group-name')
      var name = nameInput ? String(nameInput.value || '').trim() : ''
      if (!name) {
        event.preventDefault()
        event.stopImmediatePropagation()
        if (nameInput) nameInput.focus()
        return
      }
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

  var groupInfoBtn = document.getElementById('btn-group-info')
  var groupInfoPop = document.getElementById('group-info-pop')
  var groupAddForm = document.getElementById('group-add-form')
  var groupAddSearch = document.getElementById('group-add-search')
  var groupAddList = document.getElementById('group-add-list')
  var groupAddHint = document.getElementById('group-add-hint')
  var groupAddPicked = []
  var groupMemberIds = groupInfoPop
    ? (groupInfoPop.getAttribute('data-members') || '').split(',').filter(Boolean)
    : []

  function renderGroupAdd(people) {
    if (!groupAddList) return
    groupAddList.textContent = ''
    var available = people.filter(function (person) {
      return groupMemberIds.indexOf(String(person.id)) === -1
    })
    if (!available.length) {
      var empty = document.createElement('p')
      empty.className = 'chat-empty'
      empty.textContent = 'Aucune personne à ajouter.'
      groupAddList.appendChild(empty)
      return
    }
    available.forEach(function (person) {
      var row = document.createElement('label')
      row.className = 'chat-person'
      var avatar = document.createElement('div')
      avatar.className = 'chat-avatar'
      avatar.textContent = person.initials
      row.appendChild(avatar)
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
      var checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.className = 'chat-person-check'
      checkbox.checked = groupAddPicked.indexOf(String(person.id)) !== -1
      checkbox.setAttribute('aria-label', 'Ajouter ' + person.fullName)
      checkbox.addEventListener('change', function () {
        var id = String(person.id)
        if (checkbox.checked) {
          if (groupAddPicked.indexOf(id) === -1) groupAddPicked.push(id)
        } else {
          groupAddPicked = groupAddPicked.filter(function (item) {
            return item !== id
          })
        }
        if (groupAddHint) groupAddHint.classList.remove('is-error')
      })
      row.appendChild(checkbox)
      groupAddList.appendChild(row)
    })
  }

  function loadGroupAdd(query) {
    if (!groupInfoPop || !groupAddList) return
    var url = groupInfoPop.getAttribute('data-people') + '?q=' + encodeURIComponent(query || '')
    groupAddList.textContent = 'Chargement…'
    fetch(url, { headers: { accept: 'application/json' }, credentials: 'same-origin' })
      .then(function (res) {
        if (!res.ok) throw new Error('load')
        return res.json()
      })
      .then(renderGroupAdd)
      .catch(function () {
        groupAddList.textContent = ''
        var error = document.createElement('p')
        error.className = 'chat-empty'
        error.textContent = 'Impossible de charger les personnes.'
        groupAddList.appendChild(error)
      })
  }

  if (groupInfoBtn && groupInfoPop) {
    groupInfoBtn.addEventListener('click', function () {
      groupInfoPop.hidden = !groupInfoPop.hidden
      if (!groupInfoPop.hidden && groupAddList) {
        groupAddPicked = []
        if (groupAddSearch) groupAddSearch.value = ''
        if (groupAddHint) groupAddHint.classList.remove('is-error')
        loadGroupAdd('')
      }
    })
    document.addEventListener('click', function (event) {
      if (groupInfoPop.hidden) return
      if (groupInfoPop.contains(event.target) || groupInfoBtn.contains(event.target)) return
      groupInfoPop.hidden = true
    })
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') groupInfoPop.hidden = true
    })
    if (groupAddSearch) {
      var addTimer
      groupAddSearch.addEventListener('input', function () {
        window.clearTimeout(addTimer)
        var value = groupAddSearch.value
        addTimer = window.setTimeout(function () {
          loadGroupAdd(value)
        }, 200)
      })
      groupAddSearch.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') event.preventDefault()
      })
    }
    if (groupAddForm) {
      groupAddForm.addEventListener('submit', function (event) {
        if (!groupAddPicked.length) {
          event.preventDefault()
          if (groupAddHint) groupAddHint.classList.add('is-error')
          return
        }
        groupAddForm.querySelectorAll('input[name="members"]').forEach(function (input) {
          input.remove()
        })
        groupAddPicked.forEach(function (id) {
          var input = document.createElement('input')
          input.type = 'hidden'
          input.name = 'members'
          input.value = id
          groupAddForm.appendChild(input)
        })
      })
    }
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

  function xsrfToken() {
    var match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)
    return match ? decodeURIComponent(match[1]) : ''
  }

  function appendOwnMessage(payload, destroyUrl) {
    var list = document.querySelector('.chat-messages')
    if (!list) return
    if (list.querySelector('[data-message-id="' + payload.id + '"]')) return
    var empty = list.querySelector('.chat-empty')
    if (empty) empty.remove()

    var row = document.createElement('div')
    row.className = 'chat-row chat-row--out'
    row.dataset.messageId = String(payload.id)

    var menu = document.createElement('div')
    menu.className = 'chat-bubble-menu'
    var panel = document.createElement('div')
    panel.className = 'chat-bubble-menu-panel'
    var form = document.createElement('form')
    form.method = 'post'
    form.action = destroyUrl
    var csrf = document.createElement('input')
    csrf.type = 'hidden'
    csrf.name = '_csrf'
    csrf.value = xsrfToken()
    var del = document.createElement('button')
    del.type = 'submit'
    del.textContent = 'Supprimer'
    form.appendChild(csrf)
    form.appendChild(del)
    panel.appendChild(form)
    menu.appendChild(panel)
    row.appendChild(menu)

    var bubble = document.createElement('div')
    bubble.className = 'chat-bubble chat-bubble--out'
    var more = document.createElement('button')
    more.type = 'button'
    more.className = 'chat-bubble-more'
    more.setAttribute('aria-label', 'Actions du message')
    more.setAttribute('aria-expanded', 'false')
    more.innerHTML =
      '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></svg>'
    bubble.appendChild(more)
    var author = document.createElement('span')
    author.className = 'chat-bubble-author'
    author.textContent = payload.author
    bubble.appendChild(author)
    bubble.appendChild(document.createTextNode(payload.body))
    var time = document.createElement('time')
    time.textContent = payload.time
    bubble.appendChild(time)
    row.appendChild(bubble)
    list.appendChild(row)
    list.scrollTop = list.scrollHeight
  }

  var composer = document.querySelector('form.chat-composer')
  if (composer) {
    composer.addEventListener('submit', function (event) {
      event.preventDefault()
      event.stopImmediatePropagation()
      var input = composer.querySelector('input[name="body"]')
      var button = composer.querySelector('[type="submit"]')
      var body = input ? String(input.value || '').trim() : ''
      if (!body || composer.getAttribute('data-sending')) return
      composer.setAttribute('data-sending', '1')
      if (button) button.setAttribute('data-loading', '1')

      var csrfInput = composer.querySelector('input[name="_csrf"]')
      var data = new FormData()
      data.append('body', body)
      data.append('_csrf', csrfInput ? csrfInput.value : xsrfToken())

      fetch(composer.action, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': xsrfToken(),
        },
        body: data,
      })
        .then(function (res) {
          if (!res.ok) throw new Error('send')
          return res.json()
        })
        .then(function (payload) {
          if (input) input.value = ''
          var destroyUrl = composer.action.replace(/\/?$/, '/') + payload.id + '/delete'
          appendOwnMessage(payload, destroyUrl)
          var link = document.querySelector(
            '.chat-conv[data-conversation-id="' + payload.conversationId + '"]'
          )
          if (link) {
            var previewNode = link.querySelector('.chat-conv-preview')
            var timeNode = link.querySelector('.chat-conv-time')
            if (previewNode) previewNode.textContent = payload.body
            if (timeNode) timeNode.textContent = payload.time
            var list = link.parentElement
            if (list && list.firstElementChild !== link) list.prepend(link)
          }
          if (input) input.focus()
        })
        .catch(function () {
          if (input) input.value = body
          window.alert('Impossible d’envoyer le message. Réessaie.')
        })
        .finally(function () {
          composer.removeAttribute('data-sending')
          if (button) {
            button.removeAttribute('data-loading')
            button.disabled = false
          }
        })
    })
  }

  document.querySelectorAll('form').forEach(function (form) {
    if (form.classList.contains('chat-composer')) return
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
