from utils import *
import yfinance as yf
from functools import partial

yf.set_tz_cache_location("../yf_cache")

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
        data[strat] = func(ticker=data)["signal"]
        res = backtest(data, strat)
        tt = transform_trades(res[-1])
        # print(strat, ":",tt[-1])
        if len(tt) > 1:
            side = tt[-1][2] if tt[-1][1] is None else None
        else:
            side = None
        output[strat] = side
    return output

if __name__ == "__main__":
    print(get_recommendation("BTC-USD", "1d"))
        
        
