from django.urls import path, include
from .views import *
from .papertrading_apiendpoints import *
from .charts_apiendpoints import *
from .recommend_backtest.backtesting_apiendpoints import *
from .recommend_backtest.recommendation_apiendpoints import *
from .newssentiment_analysis.apiendpoints import news_and_sentiment
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
    # paper-trading api end points
    path('api/price/<str:symbol>/', get_price, name='get-price'),
    path('api/details/<str:symbol>', stock_details, name='get-stock-detail'),
    # charts api end points
    path('historical/<str:symbol>', get_historical, name='get-historical'),
    path('stock/<str:symbol>', get_live_stock, name='get-live-stock'),
    path('api/latest/<str:symbol>', get_latest, name='get-latest'),
    # back-testing api end points
    path('api/backtesting', backtesting, name='backtesting'),
    # recommendation api end points
    path('api/recommendation', recommendation, name='recommendation'),
    # news sentiment analysis api end points
    path('api/news-sentiment', news_and_sentiment, name='news_and_sentiment'),
]
