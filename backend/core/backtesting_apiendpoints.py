from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
import yfinance as yf

@api_view(['POST'])
def backtesting(request):
    pass