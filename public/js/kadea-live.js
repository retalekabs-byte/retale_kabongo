;(function () {
  var app = document.getElementById('chat-app')
  if (!app || !window.EventSource) return

  var userId = Number(app.dataset.userId)
  var openId = app.dataset.open || ''
  var channels = (app.dataset.channels || '')
    .split(',')
    .map(function (id) {
      return id.trim()
    })
    .filter(Boolean)

  if (openId && channels.indexOf(openId) === -1) channels.push(openId)
  if (channels.length === 0) return

  var uid = crypto.randomUUID()
  var source = new EventSource('/__transmit/events?uid=' + encodeURIComponent(uid))

  function xsrf() {
    var match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/)
    return match ? decodeURIComponent(match[1]) : ''
  }

  function subscribe(channel) {
    fetch('/__transmit/subscribe', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': xsrf(),
      },
      body: JSON.stringify({ uid: uid, channel: channel }),
    })
  }

  function conversationLink(id) {
    return document.querySelector('.chat-conv[data-conversation-id="' + id + '"]')
  }

  function touchList(id, preview, time) {
    var link = conversationLink(id)
    if (!link) return
    var previewNode = link.querySelector('.chat-conv-preview')
    var timeNode = link.querySelector('.chat-conv-time')
    if (previewNode) previewNode.textContent = preview
    if (timeNode && time) timeNode.textContent = time
    var list = link.parentElement
    if (list && list.firstElementChild !== link) list.prepend(link)
  }

  function appendMessage(payload) {
    if (String(openId) !== String(payload.conversationId)) return
    var list = document.querySelector('.chat-messages')
    if (!list) return
    if (list.querySelector('[data-message-id="' + payload.id + '"]')) return
    var empty = list.querySelector('.chat-empty')
    if (empty) empty.remove()

    var bubble = document.createElement('div')
    bubble.className = 'chat-bubble chat-bubble--in'
    bubble.dataset.messageId = String(payload.id)

    var author = document.createElement('span')
    author.className = 'chat-bubble-author'
    author.textContent = payload.author
    bubble.appendChild(author)
    bubble.appendChild(document.createTextNode(payload.body))

    var time = document.createElement('time')
    time.textContent = payload.time
    bubble.appendChild(time)

    list.appendChild(bubble)
    list.scrollTop = list.scrollHeight
  }

  source.addEventListener('open', function () {
    channels.forEach(function (id) {
      subscribe('conversations/' + id)
    })
  })

  source.addEventListener('message', function (event) {
    var data
    try {
      data = JSON.parse(event.data)
    } catch (error) {
      return
    }
    var payload = data.payload
    if (!payload || !data.channel) return
    var conversationId = data.channel.split('/')[1]

    if (payload.type === 'created') {
      if (Number(payload.userId) === userId) return
      touchList(conversationId, payload.body, payload.time)
      payload.conversationId = conversationId
      appendMessage(payload)
      return
    }

    if (payload.type === 'deleted') {
      var bubble = document.querySelector('[data-message-id="' + payload.id + '"]')
      if (bubble) bubble.remove()
      var list = document.querySelector('.chat-messages')
      if (list && String(openId) === String(conversationId) && !list.querySelector('.chat-bubble')) {
        var empty = document.createElement('p')
        empty.className = 'chat-empty'
        empty.textContent = 'Aucun message pour le moment.'
        list.appendChild(empty)
      }
      touchList(conversationId, payload.preview, payload.time)
    }
  })
})()
