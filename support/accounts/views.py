from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group
from django.contrib import messages

# Create your views here.
from .forms import AddUserForm, EditUserForm
from .models import User


@login_required
def user_detail(request, uuid):
    user = User.objects.get(pk=uuid)
    rooms = user.rooms.all()

    return render(request, 'accounts/user_detail.html', {
        'user': user,
        'rooms': rooms
    })


@login_required
def edit_user(request, uuid):
    if request.user.has_perm('user.change_user'):
        user = User.objects.get(pk=uuid)

        if request.method == 'POST':
            form = EditUserForm(request.POST, instance=user)
            
            if form.is_valid():
                form.save()

                if user.role == User.MANAGER:
                    groupM = Group.objects.get(name='Managers')
                    groupM.user_set.add(user) # type: ignore
                    groupA = Group.objects.get(name='Agents')
                    groupA.user_set.remove(user) # type: ignore
                else:
                    groupA = Group.objects.get(name='Agents')
                    groupA.user_set.add(user) # type: ignore
                    groupM = Group.objects.get(name='Managers')
                    groupM.user_set.remove(user) # type: ignore
                
                messages.success(request, 'The user information was changed!')
                return redirect('/chat-admin/')
        else:
            form = EditUserForm(instance=user)

        return render(request, 'accounts/edit_user.html', {
            'form': form
        })
    else:
        messages.error(request, 'You don\'t have permission to edit users!')
        return redirect('/chat-admin/')


@login_required
def add_user(request):
    if request.user.has_perm('user.add_user'):
        if request.method == 'POST':
            form = AddUserForm(request.POST)
            if form.is_valid():
                user = form.save(commit=False)
                user.is_staff = True
                user.set_password(request.POST.get('password'))
                user.save()

                if user.role == User.MANAGER:
                    group = Group.objects.get(name='Managers')
                    group.user_set.add(user) # type: ignore
                else:
                    group = Group.objects.get(name='Agents')
                    group.user_set.add(user) # type: ignore

                messages.success(request, 'The user was added!')
                return redirect('/chat-admin/')
        else:
            form = AddUserForm()

        return render(request, 'accounts/add_user.html', {
            'form': form
        })
    else:
        messages.error(request, 'You don\'t have permission to add users!')
        return redirect('/chat-admin/')