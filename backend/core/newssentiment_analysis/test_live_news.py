#run this and u can 
import requests

BASE_URL = "http://127.0.0.1:5000"

def fetch_news(symbol="AAPL", limit=10):
    response = requests.get(f"{BASE_URL}/fetch-news", params={"symbol": symbol, "limit": limit})
    if response.status_code == 200:
        return response.json().get("news", [])
    else:
        print("❌ Failed to fetch news:", response.text)
        return []

def predict_sentiment(headlines):
    response = requests.post(f"{BASE_URL}/predict", json={"headlines": headlines})
    if response.status_code == 200:
        result = response.json()
        return result.get("predictions", []), result.get("confidences", [])
    else:
        print("❌ Failed to get predictions:", response.text)
        return [], []

def main():
    news = fetch_news()
    if not news:
        print("No news fetched.")
        return

    headlines = [article["title"] for article in news]
    print("📰 Headlines Fetched:")
    for h in headlines:
        print("•", h)

    predictions, confidences = predict_sentiment(headlines)

    print("\n📊 Sentiment Predictions:")
    for headline, pred, conf in zip(headlines, predictions, confidences):
        if pred == 0:
            sentiment = "Negative"
        
        else:
            sentiment = "Positive"
        
        print(f"• {headline}\n  → Sentiment: {sentiment} (Confidence: {conf:.2f})\n")

if __name__ == "__main__":
    main()
