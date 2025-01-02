from django.urls import path

from . import views

app_name = 'chat'

urlpatterns = [
    path('api/create-room/<str:uuid>/', views.create_room, name='create_room'),
    path('chat-admin/', views.admin, name='chat-admin'),
    path('chat-admin/room/<str:uuid>/', views.room, name='room'),
    path('chat-admin/room/<str:uuid>/delete/', views.delete_room, name='delete_room'),
]
