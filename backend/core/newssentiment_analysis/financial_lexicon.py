# financial_lexicon.py

import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin
from textblob import TextBlob

positive_words = {
    'gain', 'profit', 'growth', 'surge', 'up', 'rise', 'beat', 'strong', 'increase',
    'positive', 'successful', 'optimistic', 'bullish', 'booming', 'recovery', 'expansion',
    'higher', 'improvement', 'top', 'outperform', 'record', 'rebound', 'exceed', 'robust',
    'advances', 'rally', 'support', 'confidence', 'boost', 'upgrade', 'healthy', 'stability',
    'demand', 'benefit', 'improved', 'momentum', 'progress', 'advancing', 'sustainability',
    'buy', 'recommend', 'bull', 'innovation', 'resilience', 'stabilize', 'maximize',
    'efficiency', 'resilient', 'secure', 'competitive', 'revival', 'enhance', 'steady',
    'recovering', 'high', 'positive outlook', 'expanding', 'growth-oriented', 'sustainable',
    'revamped', 'profitable', 'strategic', 'adaptive', 'oversubscribed', 'bull market',
    'upbeat', 'buyback', 'renewed', 'synergy', 'turnaround', 'gained', 'reinvest', 'elevated',
    'good', 'wealth', 'appreciation', 'capitalize', 'surpassed', 'gainful', 'uplift',
    'enthusiasm', 'innovation-driven', 'job growth', 'margin improvement', 'resurgence',
    'dividend increase', 'fund inflow', 'solid', 'dominance', 'strong demand', 'leadership',
    'expansive'
}

negative_words = {
    'loss', 'decline', 'drop', 'down', 'weak', 'miss', 'fall', 'plunge', 'negative',
    'losses', 'bearish', 'underperform', 'slump', 'crash', 'recession', 'stagnation',
    'downturn', 'poor', 'lack', 'disappointing', 'bankrupt', 'fraud', 'cut', 'shortfall',
    'unemployment', 'deficit', 'instability', 'debt', 'lawsuit', 'slowdown', 'downgrade',
    'outflow', 'sell-off', 'redundancy', 'fear', 'panic', 'inflation', 'tension',
    'withdrawal', 'deterioration', 'uncertain', 'unrest', 'declining', 'decreasing',
    'crisis', 'defaults', 'weakness', 'bear', 'missed', 'layoffs', 'delisting', 'lawsuits',
    'penalty', 'breach', 'delay', 'unprofitable', 'volatile', 'collapse', 'risks',
    'instabilities', 'cancellation', 'fines', 'scandal', 'unsecured', 'liquidation',
    'negative outlook', 'budget cut', 'inefficiency', 'lawsuit filed', 'malpractice',
    'devaluation', 'default', 'excessive losses', 'funding crisis', 'dropout', 'deflation',
    'blackout', 'downtime', 'delay in payment', 'loan loss', 'credit risk', 'negative cashflow',
    'retrenchment', 'outage', 'backlash', 'decline in revenue', 'poor guidance',
    'accounting error', 'interest hike', 'rate hike', 'downward trend', 'under investigation'
}

class FinancialLexiconTransformer(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.positive_words = positive_words
        self.negative_words = negative_words
        self.negations = {'not', 'no', 'never', "n't", 'none', 'cannot', 'neither', 'nor', 'hardly', 'barely'}

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        features = []
        for text in X:
            tokens = text.lower().split()
            pos_count, neg_count, i = 0, 0, 0
            while i < len(tokens):
                word = tokens[i]
                if word in self.negations:
                    for j in range(1, 4):
                        if i + j < len(tokens):
                            next_word = tokens[i + j]
                            if next_word in self.positive_words:
                                neg_count += 1
                                i += j + 1
                                break
                            elif next_word in self.negative_words:
                                pos_count += 1
                                i += j + 1
                                break
                    else:
                        i += 1
                    continue
                if word in self.positive_words:
                    pos_count += 1
                elif word in self.negative_words:
                    neg_count += 1
                i += 1
            total = len(tokens)
            pos_ratio = pos_count / total if total else 0
            neg_ratio = neg_count / total if total else 0
            features.append([pos_ratio, neg_ratio])
        return np.array(features)


