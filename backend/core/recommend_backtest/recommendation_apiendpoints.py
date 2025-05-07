from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from .recommendations import get_recommendation

@api_view(['POST'])
def recommendation(request):
    data = request.data
    # data =  {recommendationSymbol: "BTC-USD", recommendationInterval: "day/week/month"}
    symbol = data.get("recommendationSymbol")
    interval = data.get("recommendationInterval")

    try:
        output = get_recommendation(sym=symbol, interval=interval)
        print(f'output of recommendation : {output}')
        return Response(output, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Error is getting recommendation : {e}")
        return Response({"error": "error in getting recommendation"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)