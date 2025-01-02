/**
 * Variables
 */

let chatName = ''
let chatSocket = null
let chatWindowUrl = window.location.href
let chatRoomUUID = Math.random().toString(36).slice(2, 12)


/**
 * Elements
 */

const chatElement = document.querySelector('#chat')
const chatIconElement = document.querySelector('#chat_icon')
const chatOpenElement = document.querySelector('#chat_open')
const chatNameElement = document.querySelector('#chat_name')
const chatJoinElement = document.querySelector('#chat_join')
const chatWelcomElement = document.querySelector('#chat_welcome')
const chatRoomElement = document.querySelector('#chat_room')
const chatLogElement = document.querySelector('#chat_log')
const chatInputElement = document.querySelector('#chat_input')
const chatSubmitElement = document.querySelector('#submit')
const joinCloseElement = document.querySelector('#close')

/**
 * Functions
 */

function scrollToBottom() {
    chatLogElement.scrollTop = chatLogElement.scrollHeight
}

function getCookie(name) {
    var cookieValue = null

    if(document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';')

        for(var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim()

            if(cookie.substring(0, name.length + 1 ) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1))
                break
            }
        }
    }
    
    return cookieValue
}

async function joinChatRoom() {
    chatName = chatNameElement.value

    console.log(chatName + ` joined the room with code: ${chatRoomUUID}`)

    const data = new FormData()

    data.append('name', chatName)
    data.append('url', chatWindowUrl)

    await fetch(`api/create-room/${chatRoomUUID}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: data
    })
    .then(function(response) {
        return response.json()
    })
    .then(function(data) {
        console.log('data', data)
    })

    chatSocket = new WebSocket(`ws://${window.location.host}/ws/${chatRoomUUID}/`)

    chatSocket.onmessage = function(e) {
        console.log('On message')
        onChatMessage(JSON.parse(e.data))
    }

    chatSocket.onopen = function(e) {
        console.log('Chat message was opened')
        scrollToBottom()
    }

    chatSocket.onclose = function(e) {
        console.log('Chat message was closed')
    }
}

function sendMessage() {
    chatSocket.send(JSON.stringify({
        'type': 'message',
        'message': chatInputElement.value,
        'name': chatName
    }))

    chatInputElement.value = ''
}

function onChatMessage(data) {
    if(data.type === 'chat_message') {
        let tmpInfo = document.querySelector('.tmp_info')

        if(tmpInfo) {
            tmpInfo.remove()
        }

        if(data.agent) {
            chatLogElement.innerHTML += `<div class='flex w-full mt-2 space-x-3 max-w-md'>
                                            <div class='flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 text-center pt-2'>${data.initials}</div>
                                            <div>
                                                <div class='bg-gray-300 p-3 rounded-l-lg rounded-br-lg'>
                                                    <p class='text-sm'>${data.message}</p>
                                                </div>
                                            
                                                <span class='text-xs text-gray-500 leading-none'>${data.created_at} ago</span>
                                            </div>
                                        </div>`
        } else {
            chatLogElement.innerHTML += `<div class='flex w-full mt-2 space-x-3 max-w-md ml-auto justify-end'>
                                            <div>
                                                <div class='bg-blue-300 p-3 rounded-l-lg rounded-br-lg'>
                                                    <p class='text-sm'>${data.message}</p>
                                                </div>
                                            
                                                <span class='text-xs text-gray-500 leading-none'>${data.created_at} ago</span>
                                            </div>
                                            <div class='flex-shrink-0 h-10 w-10 rounded-full bg-gray-300 text-center pt-2'>${data.initials}</div>
                                        </div>`
        }
    } else if(data.type === 'users_update') {
        chatLogElement.innerHTML += '<p class="mt-2">The admin/agent has joined the chat!</p>'
    } else if(data.type === 'writing_active') {
        if(data.agent) {
            let tmpInfo = document.querySelector('.tmp_info')

            if(tmpInfo) {
                tmpInfo.remove()
            }

            chatLogElement.innerHTML += `<div class='tmp_info flex w-full mt-2 space-x-3 max-w-md'>
                                            <div>
                                                <div class='bg-gray-300 p-3 rounded-l-lg rounded-br-lg'>
                                                    <p class='text-sm'>The admin/agent is typing...</p>
                                                </div> 
                                            </div>
                                        </div>`
        }
    }

    scrollToBottom()
}

/**
 * Event listeners
 */

chatOpenElement.onclick = function(e) {
    e.preventDefault()

    chatIconElement.classList.add('hidden')
    chatWelcomElement.classList.remove('hidden')

    return false
}

chatJoinElement.onclick = function(e) {
    if(chatNameElement.value !== '') {
        chatWelcomElement.classList.add('hidden')
        chatRoomElement.classList.remove('hidden')

        joinChatRoom()

        return false
    } else {
        chatNameElement.focus()
    }
}

chatSubmitElement.onclick = function(e) {
    e.preventDefault()

    sendMessage()

    return false
}

joinCloseElement.onclick = function(e) {
    chatWelcomElement.classList.add('hidden')
    chatIconElement.classList.remove('hidden')

    return false
}

chatInputElement.onkeyup = function(e) {
    if(e.keyCode == 13) {
        sendMessage()
    }
    return false
}

chatInputElement.onfocus = function(e) {
    chatSocket.send(JSON.stringify({
        'type': 'update',
        'message': 'writing_active',
        'name': chatName,
    }))
}