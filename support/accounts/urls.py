from django.contrib.auth.views import LoginView
from django.urls import path

from .forms import LoginForm
from . import views

app_name = 'accounts'


urlpatterns = [
    path('login/', LoginView.as_view(template_name='accounts/login.html', form_class=LoginForm), name='login'),
    path('admin/add_user/', views.add_user, name='add_user'),
    path('admin/edit_user/<uuid:uuid>/', views.edit_user, name='edit_user'),
    path('admin/user_detail/<uuid:uuid>/', views.user_detail, name='user_detail'),
]
