import json

from django.utils.timesince import timesince

from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .models import Message, Room
from accounts.models import User
from .templatetags.chatextras import initials

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'
        self.user = self.scope['user']

        # Join room group
        await self.get_room()
        await self.channel_layer.group_add(self.room_group_name, self.channel_name) # type: ignore
        await self.accept()

        # Inform user
        if self.user.is_staff:
            await self.channel_layer.group_send( # type: ignore
                self.room_group_name,
                {
                    'type': 'users_update',
                }
            )

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name) # type: ignore
        
        if not self.user.is_staff:
            await self.set_room_closed()

    async def receive(self, text_data):
        # Receive message from websocket (Frontend)
        text_data_json = json.loads(text_data)
        type = text_data_json['type']
        message = text_data_json['message']
        name = text_data_json['name']
        agent = text_data_json.get('agent', '')

        if type == 'message':
            new_message = await self.create_message(message, name, agent)
            # Send message to group/room
            await self.channel_layer.group_send( # type: ignore
                self.room_group_name, {
                    'type': 'chat_message',
                    'message': message,
                    'name': name,
                    'agent': agent,
                    'initials': initials(name),
                    'created_at': timesince(new_message.created_at)
                }
            )
        elif type == 'update':
            # Send update to the room
            await self.channel_layer.group_send( # type: ignore
                self.room_group_name,
                {
                    'type': 'writing_active',
                    'message': message,
                    'name': name,
                    'agent': agent,
                    'initials': initials(name),
                }
            )

    async def chat_message(self, event):
        # Send message to websocket (Frontend)
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'message': event['message'],
            'name': event['name'],
            'agent': event['agent'],
            'initials': event['initials'],
            'created_at': event['created_at'],
        }))

    async def users_update(self, event):
        # Send information to the web socket (Frontend)
        await self.send(text_data=json.dumps({
            'type': 'users_update'
        }))

    async def writing_active(self, event):
        # Send writing active to the room
        await self.send(text_data=json.dumps({
            'type': event['type'],
            'message': event['message'],
            'name': event['name'],
            'agent': event['agent'],
            'initials': event['initials'],
        }))

    @sync_to_async
    def get_room(self):
        self.room = Room.objects.get(uuid=self.room_name)

    @sync_to_async
    def set_room_closed(self):
        self.room = Room.objects.get(uuid=self.room_name)
        self.room.status = Room.CLOSED
        self.room.save()

    @sync_to_async
    def create_message(self, message, sent_by, agent):
        message = Message.objects.create(body=message, sent_by=sent_by)

        if agent:
            message.created_by = User.objects.get(pk=agent)
            message.save()

        self.room.messages.add(message)

        return message
