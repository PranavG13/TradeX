'''APP.py API ENDPOINTS HERE'''
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
import datetime
import pytz
import time
import yfinance as yf

yf.set_tz_cache_location("./yf_cache")

live_candles = {}

manual_holidays = {
    'US': [],
    'IN': ["2025-04-10"]
}

def is_market_open(region):
    tz = pytz.timezone('Asia/Kolkata') if region == 'IN' else pytz.timezone('US/Eastern')
    now = datetime.datetime.now(tz)
    weekday = now.weekday()
    holidays = [datetime.datetime.strptime(d, "%Y-%m-%d").date() for d in manual_holidays[region]]

    if weekday >= 5 or now.date() in holidays:
        return False

    if region == 'IN':
        return datetime.time(9, 15) <= now.time() <= datetime.time(15, 30)
    else:
        return datetime.time(9, 30) <= now.time() <= datetime.time(16, 0)

def get_region(symbol):
    return 'IN' if symbol.upper().endswith('.NS') else 'US'

def floor_time(ts, resolution):
    if resolution == "daily":
        return int(datetime.datetime.fromtimestamp(ts).replace(hour=0, minute=0, second=0, microsecond=0).timestamp())
    elif resolution == "5m":
        return ts - (ts % 300)
    elif resolution == "1m":
        return ts - (ts % 60)
    else:
        return ts

def get_open_price(stock, target_date):
    try:
        hist = stock.history(start=target_date, end=target_date + datetime.timedelta(days=3), interval="1d")
        if not hist.empty:
            return round(hist["Open"].iloc[0], 2)
    except:
        pass
    return None

@api_view(['GET'])
def get_historical(request, symbol):
    resolution = request.query_params.get('resolution', '1d')
    interval_map = {
        'daily': '1d',
        '5m': '5m',
        '1m': '1m',
        'weekly': '1wk',
        'monthly': '1mo'
    }
    yf_interval = interval_map.get(resolution, '1d')
    stock = yf.Ticker(symbol)
    hist = stock.history(period='max', interval=yf_interval)
    data = []
    for i, row in hist.iterrows():
        timestamp = int(i.timestamp())
        data.append({
            "time": timestamp,
            "open": round(row["Open"], 2),
            "high": round(row["High"], 2),
            "low": round(row["Low"], 2),
            "close": round(row["Close"], 2)
        })
    print(f'returning data: {data}')
    return Response(data, status=status.HTTP_200_OK)

@api_view(['GET'])
def get_live_stock(request, symbol):
    try:
        resolution = request.query_params.get('resolution', 'daily')
        region = get_region(symbol)
        now = int(time.time())
        candle_time = floor_time(now, resolution)
        candle_key = (symbol, resolution)
        market_open = is_market_open(region)

        stock = yf.Ticker(symbol)
        hist = stock.history(period="1d", interval="1m")

        if hist.empty:
            return Response({"error": "No data found"}, status=status.HTTP_404_NOT_FOUND)

        last_price = round(hist["Close"].iloc[-1], 2)
        previous_close = round(hist["Close"].iloc[0], 2)

        if candle_key not in live_candles or live_candles[candle_key]["time"] != candle_time:
            open_price = previous_close
            live_candles[candle_key] = {
                "time": candle_time,
                "open": open_price,
                "high": open_price,
                "low": open_price,
                "close": open_price
            }

        candle = live_candles[candle_key]

        if market_open:
            candle["close"] = last_price
            candle["high"] = max(candle["high"], last_price)
            candle["low"] = min(candle["low"], last_price)

        today = datetime.date.today()

        ref_ytd = get_open_price(stock, datetime.date(today.year, 1, 1))
        ref_mtd = get_open_price(stock, today - datetime.timedelta(days=30))
        ref_3mo = get_open_price(stock, today - datetime.timedelta(days=90))
        ref_6mo = get_open_price(stock, today - datetime.timedelta(days=180))
        ref_1yr = get_open_price(stock, today - datetime.timedelta(days=365))
        ref_1w = get_open_price(stock, today - datetime.timedelta(days=7))
        ref_dtd = previous_close

        currency = "INR" if region == "IN" else "USD"

        return Response({
            **candle,
            "market_open": market_open,
            "server_time": now,
            "ref_ytd": ref_ytd,
            "ref_mtd": ref_mtd,
            "ref_3mo": ref_3mo,
            "ref_6mo": ref_6mo,
            "ref_1yr": ref_1yr,
            "ref_1w": ref_1w,
            "ref_dtd": ref_dtd,
            "last_price": last_price,
            "currency": currency
        }, status=status.HTTP_200_OK)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
def get_latest(symbol):
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period="1d", interval="1m")
        if hist.empty:
            return Response({"error": "No data found"}, status=status.HTTP_404_NOT_FOUND)

        latest = hist.iloc[-1]
        timestamp = int(latest.name.timestamp())
        return Response({
            "time": timestamp,
            "open": round(latest["Open"], 2),
            "high": round(latest["High"], 2),
            "low": round(latest["Low"], 2),
            "close": round(latest["Close"], 2)
        }, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error fetching latest data for {symbol}: {e}")
        return Response({"error": str(e)}, status.HTTP_500_INTERNAL_SERVER_ERROR)
