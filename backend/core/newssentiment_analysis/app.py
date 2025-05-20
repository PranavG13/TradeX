#sentiment-backend
from flask import Flask, request, jsonify
import joblib
import requests
import re
import numpy as np
from textblob import TextBlob

app = Flask(__name__)

model = joblib.load("sentiment_model.pkl")
vectorizer = joblib.load("feature_extractor.pkl")

def preprocess(text):
    text = text.lower()
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\d+", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def get_sentiment_score(text):
    return TextBlob(text).sentiment.polarity

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    headlines = data.get("headlines")
    if not headlines:
        return jsonify({"error": "No headlines provided"}), 400

    processed = [preprocess(h) for h in headlines]
    features = vectorizer.transform(processed)
    sentiment_scores = np.array([get_sentiment_score(text) for text in processed]).reshape(-1, 1)
    final_features = np.hstack((features.toarray(), sentiment_scores))

    probs = model.predict_proba(final_features)
    predictions = np.argmax(probs, axis=1)
    confidences = np.max(probs, axis=1)

    return jsonify({
        "predictions": predictions.tolist(),
        "confidences": confidences.tolist()
    })

@app.route("/fetch-news", methods=["GET"])
def fetch_news():
    symbol = request.args.get("symbol", "AAPL")
    limit = request.args.get("limit", 10)
    api_key = "sZvNY6tfUphR9fVk3pCMy9aapX7yhz23dOa1UIrp"

    url = f"https://api.marketaux.com/v1/news/all?symbols={symbol}&limit={limit}&language=en&api_token={api_key}"
    try:
        response = requests.get(url)
        data = response.json()
        news_data = [{
            "title": article["title"],
            "published_at": article["published_at"],
            "url": article["url"]
        } for article in data.get("data", [])]
        return jsonify({"news": news_data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
