import pandas as pd
import numpy as np
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import FeatureUnion
from sklearn.metrics import classification_report
from textblob import TextBlob
from xgboost import XGBClassifier
from financial_lexicon import FinancialLexiconTransformer
from sklearn.metrics import accuracy_score

def get_sentiment_score(text):
    return TextBlob(text).sentiment.polarity

def load_data(filepath):
    df = pd.read_csv(filepath, header=None, names=['Sentiment', 'Text'], encoding='ISO-8859-1')
    label_map = {"positive": 2, "neutral": 1, "negative": 0}
    X = df["Text"]
    y = df["Sentiment"].str.lower().map(label_map)
    return X, y

def train_model(X, y):
    tfidf = TfidfVectorizer(ngram_range=(1, 2), max_features=8000, stop_words='english', min_df=2, max_df=0.8)
    lexicon = FinancialLexiconTransformer()
    union = FeatureUnion([("tfidf", tfidf), ("lexicon", lexicon)])
    X_features = union.fit_transform(X)
    sentiment_scores = np.array([get_sentiment_score(t) for t in X]).reshape(-1, 1)
    X_final = np.hstack((X_features.toarray(), sentiment_scores))
    X_train, X_test, y_train, y_test = train_test_split(X_final, y, test_size=0.2, random_state=42)

    model = XGBClassifier(objective="multi:softprob", num_class=3, eval_metric="mlogloss")
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    print("Classification Report:\n", classification_report(y_test, preds))
    print(accuracy_score(y_test,preds))
    return model, union

if __name__ == "__main__":
    X, y = load_data("all-data.csv")
    model, vectorizer = train_model(X, y)
    joblib.dump(model, "sentiment_model.pkl")
    joblib.dump(vectorizer, "feature_extractor.pkl")
