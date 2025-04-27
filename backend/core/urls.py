from django.urls import path, include
from .views import *
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

router.register(r'register', RegisterViewset, basename='register')
router.register(r'login', LoginViewset, basename='login')
router.register(r'open-trades', OpenTradeViewSet, basename='opentrade')
router.register(r'closed-trades', ClosedTradeViewSet, basename='closedtrade')
router.register(r'users', UserViewSet, basename='customuser')

'''Below is an example url to which frontend can request'''
# router.register('users', UserViewset, basename='users')

urlpatterns = [
    path('', include(router.urls)),
]
