from django.urls import path
from .views import *
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

router.register('register', RegisterViewset, basename='register')
router.register('login', LoginViewset, basename='login')

'''Below is an example url to which frontend can request'''
# router.register('users', UserViewset, basename='users')

urlpatterns = router.urls
