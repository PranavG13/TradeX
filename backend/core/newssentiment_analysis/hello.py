import requests

def fetch_news(symbol='AAPL', limit=10):
    url = f'https://api.marketaux.com/v1/news/all?symbols={symbol}&limit={limit}&filter_entities=true&language=en&api_token=YOUR_API_KEY'
    response = requests.get(url)
    
    try:
        data = response.json()
        if 'data' not in data:
            print("API Error:", data)  # Print full response if 'data' is missing
            return []

        return [(article['published_at'], article['title'], article['url']) for article in data['data']]
    except Exception as e:
        print("Failed to fetch or parse news:", e)
        return []
