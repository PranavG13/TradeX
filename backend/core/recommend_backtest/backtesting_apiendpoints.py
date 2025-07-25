from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from .backtester import run_script


@api_view(['POST'])
def backtesting(request):
    data = request.data
    # data = { strategySymbol: "BTC-USD", strategyInterval: "day", strategyText: "Text123" }
    try:
        symbol = data.get('strategySymbol')
        interval = data.get('strategyInterval')
        code = data.get('strategyText')
    except Exception as e:
        print(f'exception : {e}')
        return Response({"error":"Invalid Data received"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        metrics, tt = run_script(symbol, interval, code)
        print(metrics)
        return Response({"metrics" : metrics, "tt" : tt}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f'exception : {e}')
        return Response({"error":"Error encountered"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
