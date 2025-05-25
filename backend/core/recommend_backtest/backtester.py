from utils import *
import yfinance as yf

yf.set_tz_cache_location("../yf_cache")

def get_signal(data, code):
    import pandas as pd
    import numpy as np
    import pandas_ta as ta

    # Prepare the local execution environment
    local_env = {
        "pd": pd,
        "np": np,
        "ta": ta,
        "df": data.copy()  # work on a copy of the original data
    }

    # Execute the provided code on df
    exec(code, {}, local_env)

    # Expect the code to modify `df` and include a 'signal' column
    if "df" in local_env and "signal" in local_env["df"].columns:
        return local_env["df"]["signal"]
    else:
        raise ValueError("The provided code did not produce a 'signal' column.")

def run_script(symbol, interval, code):
    data = yf.download(symbol, interval=interval, multi_level_index=False)

    data["script"] = get_signal(data, code)

    initial_price, profit, first_close, buyNhold, trades = backtest(data, "script")
    df = pd.DataFrame(trades, columns=["Timestamp", "Action", "Price", "PnL"])
    
    tt = transform_trades(trades)
    metrics = calculate_metrics(df)

    metrics["Capital"] = profit
    metrics["Buy and Hold"] = buyNhold
    metrics["Strating price"] = first_close
    return metrics, tt


if __name__ == "__main__":
    print(run_script("BTC-USD", "1d", "df['signal'] = np.where(df.ta.sma(length=20) > df.ta.sma(length=50), 1, -1)")[0])