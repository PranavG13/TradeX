from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import time
import datetime
import pytz

app = Flask(__name__)
CORS(app)

live_candles = {}

manual_holidays = {
    'US': [],
    'IN': ["2025-04-10"]
}

def is_market_open(region):
    print("in is_market_open")
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
    print("in get_region")
    return 'IN' if symbol.upper().endswith('.NS') else 'US'

def floor_time(ts, resolution):
    print("in floor_time")
    if resolution == "daily":
        return int(datetime.datetime.fromtimestamp(ts).replace(hour=0, minute=0, second=0, microsecond=0).timestamp())
    elif resolution == "5m":
        return ts - (ts % 300)
    elif resolution == "1m":
        return ts - (ts % 60)
    else:
        return ts

def get_open_price(stock, target_date):
    print("in get_open_price")
    try:
        hist = stock.history(start=target_date, end=target_date + datetime.timedelta(days=3), interval="1d")
        if not hist.empty:
            return round(hist["Open"].iloc[0], 2)
    except:
        pass
    return None

@app.route('/historical/<string:symbol>', methods=['GET'])
def get_historical(symbol):
    print(f"in get_historical, symbol: {symbol}")
    resolution = request.args.get('resolution', '1d')
    interval_map = {
        'daily': '1d',
        '5m': '5m',
        '1m': '1m',
        'weekly': '1wk',
        'monthly': '1mo'
    }
    yf_interval = interval_map.get(resolution, '1d')
    print(f"trying to get data from ticker symbol")
    stock = yf.Ticker(symbol)
    print(f"got stock data from ticker symbol")
    hist = stock.history(period='max', interval=yf_interval)
    print(f"got stock history")
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
    return jsonify(data)

@app.route('/stock/<string:symbol>', methods=['GET'])
def get_live_stock(symbol):
    print("in get_live_stock")
    try:
        resolution = request.args.get('resolution', 'daily')
        region = get_region(symbol)
        now = int(time.time())
        candle_time = floor_time(now, resolution)
        candle_key = (symbol, resolution)
        market_open = is_market_open(region)

        stock = yf.Ticker(symbol)
        hist = stock.history(period="1d", interval="1m")

        if hist.empty:
            return jsonify({"error": "No data found"}), 404

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

        return jsonify({
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
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/api/latest/<symbol>', methods=['GET'])
def get_latest(symbol):
    print("in get_latest")
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period="1d", interval="1m")
        if hist.empty:
            return jsonify({"error": "No data found"}), 404

        latest = hist.iloc[-1]
        timestamp = int(latest.name.timestamp())
        return jsonify({
            "time": timestamp,
            "open": round(latest["Open"], 2),
            "high": round(latest["High"], 2),
            "low": round(latest["Low"], 2),
            "close": round(latest["Close"], 2)
        })
    except Exception as e:
        print(f"Error fetching latest data for {symbol}: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
