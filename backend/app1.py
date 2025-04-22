from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Function to get current price of a symbol
def get_current_price(symbol):
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period="1d", interval="1m")
        if not hist.empty:
            return round(hist["Close"].iloc[-1], 2)
        return None
    except Exception as e:
        print(f"Error getting price for {symbol}: {e}")
        return None

# Endpoint to get price for any symbol dynamically
@app.route('/api/price/<symbol>', methods=['GET'])
def price(symbol):
    price = get_current_price(symbol)
    if price is not None:
        return jsonify({"symbol": symbol, "price": price})
    else:
        return jsonify({"error": "Price not found for symbol"}), 404

# Endpoint to get additional stock/crypto details
@app.route('/api/details/<symbol>', methods=['GET'])
def stock_details(symbol):
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period="5d").tail(2)

        if hist.empty:
            return jsonify({"error": "No data found"}), 404

        current_price = round(hist["Close"].iloc[-1], 2)

        if len(hist) >= 2:
            prev_price = round(hist["Close"].iloc[-2], 2)
            change_24h = round(((current_price - prev_price) / prev_price) * 100, 2)
        else:
            change_24h = "N/A"

        info = stock.info

        return jsonify({
            "symbol": symbol,
            "price": current_price,
            "change24h": change_24h,
            "marketCap": info.get('marketCap', 'N/A'),
            "currency": info.get('currency', 'USD'),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        print(f"Error fetching details for {symbol}: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
