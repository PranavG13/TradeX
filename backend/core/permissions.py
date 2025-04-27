from rest_framework import permissions

class IsOwner(permissions.BasePermission):
    '''Custom permission to only allow owners of an object to edit ans read it
    '''

    def has_object_permission(self, request, view, obj):
        print(f'requested user: {request.user.email}, object owner: {obj.owner}')
        print(f'is owner: {obj.owner == request.user.email}')
        return obj.owner == request.user
