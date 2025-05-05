from utils import *
import yfinance as yf
from functools import partial

strats = {
    "MA": get_ma_signal,
    "BB": get_bb_signal,
    "MACD": get_macd_signal,
    "DMI": get_dmi_signal,
    "RSI": get_rsi_signal
}

def get_recommendation(sym, interval):
    data = yf.download(sym, interval=interval, multi_level_index=False)
    
    output = {}
    for strat, func in strats.items():
        data[strat] = func(data=data)
        res = backtest(data, strat)
        tt = transform_trades(res[-1])

        side = tt[2] if tt[1] is None else "None"

        output[strat] = side
    return output

        
        
