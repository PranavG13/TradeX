'''APP1.py API ENDPOINTS IN HERE'''

from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
import yfinance as yf
import datetime

yf.set_tz_cache_location("./yf_cache")


# Endpoint to get price for any symbol dynamically
@api_view(['GET'])
def get_price(request, symbol):
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period='1d', interval='1m')
        if not hist.empty:
            price = round(hist["Close"].iloc[-1], 2)
            return Response({"symbol": symbol, "price": price})
        else:
            return Response({"error": "Price not found for symbol"}, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        print(f'Error getting price for {symbol}: {e}')
        return Response({"error": "internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
# Endpoint to get additional stock/crypto details
@api_view(['GET'])
def stock_details(request, symbol):
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period="5d").tail(2)

        if hist.empty:
            return Response({"error": "No data found"}, status = status.HTTP_404_NOT_FOUND)

        current_price = round(hist["Close"].iloc[-1], 2)

        if len(hist) >= 2:
            prev_price = round(hist["Close"].iloc[-2], 2)
            change_24h = round(((current_price - prev_price) / prev_price) * 100, 2)
        else:
            change_24h = "N/A"

        info = stock.info

        return Response({
            "symbol": symbol,
            "price": current_price,
            "change24h": change_24h,
            "marketCap": info.get('marketCap', 'N/A'),
            "currency": info.get('currency', 'USD'),
            "timestamp": datetime.datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Error fetching details for {symbol}: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)