import joblib
import re
import numpy as np
import requests
from datetime import datetime, timedelta
from textblob import TextBlob
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view

import sys
import os
import joblib

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)  # Add current directory to Python path

model_path = os.path.join(current_dir, "sentiment_model.pkl")
vectorizer_path = os.path.join(current_dir, "feature_extractor.pkl")

model = joblib.load(model_path)
vectorizer = joblib.load(vectorizer_path)

# import os
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# model_dir = os.path.join(BASE_DIR, "sentiment_model.pkl")
# vectorizer_dir = os.path.join(BASE_DIR, "feature_extractor.pkl")

# model = joblib.load(model_dir)
# vectorizer = joblib.load(vectorizer_dir)

def preprocess(text):
    text = text.lower()
    text = re.sub(r"http\S+|www\S+", "", text)
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\d+", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def get_sentiment_score(text):
    return TextBlob(text).sentiment.polarity

def is_indian_stock(symbol):
    return symbol.endswith(".NS") or symbol.endswith(".BO")
    
@api_view(['POST'])
def news_and_sentiment(request):
    ''' takes input {"symbol" : "AAPL", "limit": 10}'''
    '''outputs {data: {
                        headline1: ""(text),
                        prediction: 1(positive) else(negative),
                        confidence: 0.85 (float)
                    },
                    {
                        headline2: ""(text),
                        prediction: 1(positive) else(negative),
                        confidence: 0.56 (float)
                    }
                }
    '''
    try:
        data = request.data
        symbol = data.get("symbol")
        limit = data.get("limit", 10)

        now = datetime.utcnow()
        one_week_ago = now - timedelta(days=7)
        from_date = one_week_ago.strftime("%Y-%m-%d")
        to_date = now.strftime("%Y-%m-%d")
        published_after = one_week_ago.strftime("%Y-%m-%dT%H:%M")
    except Exception as e:
        print(f'Error in fetch news, {e}')
        return Response({"error": "cannot process request"}, status=status.HTTP_400_BAD_REQUEST)

    if is_indian_stock(symbol):
        api_key = "sZvNY6tfUphR9fVk3pCMy9aapX7yhz23dOa1UIrp"
        url = f"https://api.marketaux.com/v1/news/all"
        params = {
            "symbols": symbol,
            "countries": "in",
            "filter_entities": "true",
            "limit": limit,
            "language": "en",
            "published_after": published_after,
            "api_token": api_key
        }
        try:
            response = requests.get(url, params=params)
            data = response.json()
            news_data = [{
                "title": article["title"],
                "published_at": article["published_at"],
                "url": article["url"]
            } for article in data.get("data", [])]
            # return jsonify({"news": news_data})
        except Exception as e:
            print(f'Error in fetch news, {e}')
            return Response({"error": "error while processing request"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        api_key = "d0m99ehr01qkesvjceg0d0m99ehr01qkesvjcegg"
        url = f"https://finnhub.io/api/v1/company-news"
        params = {
            "symbol": symbol,
            "from": from_date,
            "to": to_date,
            "token": api_key
        }
        try:
            response = requests.get(url, params=params)
            data = response.json()
            news_data = [{
                "title": article["headline"],
                "published_at": article["datetime"],
                "url": article["url"]
            } for article in data]
            # return jsonify({"news": news_data[:limit]})
        except Exception as e:
            print(f'Error in fetch news, {e}')
            return Response({"error": "error while processing request"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

    headlines = [article["title"] for article in news_data]
    urls = [article["url"] for article in news_data]
    
    try:
        processed = [preprocess(h) for h in headlines]
        features = vectorizer.transform(processed)
        sentiment_scores = np.array([get_sentiment_score(text) for text in processed]).reshape(-1, 1)
        final_features = np.hstack((features.toarray(), sentiment_scores))

        probs = model.predict_proba(final_features)
        predictions = np.argmax(probs, axis=1).tolist()
        confidences = np.max(probs, axis=1).tolist()
    
    except Exception as e:
        print(f'error in prediction, {e}')
        return Response({"error":"cannot process request"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    print("\n📊 Sentiment Predictions:")
    for headline, pred, conf in zip(headlines, predictions, confidences):
        if pred == 1:
            sentiment = "Positive ✅"
        
        else:
            sentiment = "Negative ❌"
        
        print(f"• {headline}\n  → Sentiment: {sentiment} (Confidence: {conf:.2f})\n")
    return Response({"data" : zip(headlines, urls, predictions, confidences)}, status=status.HTTP_200_OK)