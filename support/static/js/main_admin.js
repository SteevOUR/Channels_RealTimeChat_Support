/**
 * Variables
 */

const chatRoom = document.querySelector('#room_uuid').textContent.replaceAll('"', '')
const userName = document.querySelector('#user_name').textContent.replaceAll('"', '')
const userID = document.querySelector('#user_id').textContent.replaceAll('"', '')

let chatSocket = null

/**
 * Events
 */

const chatLogElement = document.querySelector('#chat_log')
const chatInputElement = document.querySelector('#chat_input')
const chatSubmitElement = document.querySelector('#submit')

/**
 * Functions
 */

function scrollToBottom() {
    chatLogElement.scrollTop = chatLogElement.scrollHeight
}

function sendMessage() {
    chatSocket.send(JSON.stringify({
        'type': 'message',
        'message': chatInputElement.value,
        'name': document.querySelector('#user_name').textContent.replaceAll('"', ''),
        'agent': document.querySelector('#user_id').textContent.replaceAll('"', '')
    }))

    chatInputElement.value = ''
}

function onChatMessage(data) {
    if(data.type === 'chat_message') {
        let tmpInfo = document.querySelector('.tmp_info')

        if(tmpInfo) {
            tmpInfo.remove()
        }

        if(!data.agent) {
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
    } else if(data.type === 'writing_active') {
        if(!data.agent) {
            let tmpInfo = document.querySelector('.tmp_info')

            if(tmpInfo) {
                tmpInfo.remove()
            }

            chatLogElement.innerHTML += `<div class='tmp_info flex w-full mt-2 space-x-3 max-w-md'>
                                            <div>
                                                <div class='bg-gray-300 p-3 rounded-l-lg rounded-br-lg'>
                                                    <p class='text-sm'>The user is typing...</p>
                                                </div> 
                                            </div>
                                        </div>`
        }
    }
    
    scrollToBottom()
}

/**
 * Web Socket
 */

chatSocket = new WebSocket(`ws://${window.location.host}/ws/${chatRoom}/`)

chatSocket.onmessage = function(e) {
    console.log('On message')
    onChatMessage(JSON.parse(e.data))
}

chatSocket.onopen = function(e) {
    console.log('On open')
    scrollToBottom()
}

chatSocket.onclose = function(e) {
    console.log('On close')
}

/**
 * Event listeners
 */

chatSubmitElement.onclick = function(e) {
    e.preventDefault()

    sendMessage()

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
        'name': document.querySelector('#user_name').textContent.replaceAll('"', ''),
        'agent': document.querySelector('#user_id').textContent.replaceAll('"', '')
    }))
}