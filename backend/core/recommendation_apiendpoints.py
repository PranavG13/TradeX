from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from recommend_backtest.recommendations import get_recommendation

@api_view(['POST'])
def recommendation(request):
    data = request.data
    pass