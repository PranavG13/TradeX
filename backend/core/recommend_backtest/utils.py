import pandas as pd
import numpy as np
import pandas_ta as ta

# Bollinger Bands Signal
def get_bb_signal(ticker, length=5, num_devs=1.7):
    df = ticker.copy()
    bb = df.ta.bbands(length=length, std=num_devs)
    df = df.join(bb)
    df["long_entry"] = (df["Close"].shift(1) < df[f"BBL_{length}_{num_devs}"]) & (df["Close"] > df[f"BBL_{length}_{num_devs}"])
    df["short_entry"] = (df["Close"].shift(1) > df[f"BBU_{length}_{num_devs}"]) & (df["Close"] < df[f"BBU_{length}_{num_devs}"])
    df["signal"] = 0
    position = 0
    for i in range(len(df)):
        if df.iloc[i]["long_entry"]:
            position = 1
        elif df.iloc[i]["short_entry"]:
            position = -1
        df.at[df.index[i], "signal"] = position
    return df[["Close", f"BBU_{length}_{num_devs}", f"BBM_{length}_{num_devs}", f"BBL_{length}_{num_devs}", "signal"]]

# DMI Signal
def get_dmi_signal(ticker, period=14, adx_threshold=25):
    df = ticker.copy()
    dmi = df.ta.adx(length=period)
    df = df.join(dmi)
    df["signal"] = np.where(
        ((df[f'DMP_{period}'] > df[f'DMN_{period}']) & (df[f'ADX_{period}'] > adx_threshold)), 1,
        np.where(((df[f'DMP_{period}'] < df[f'DMN_{period}']) & (df[f'ADX_{period}'] > adx_threshold)), -1, 0)
    )
    return df[["High", "Low", "Close", f'DMP_{period}', f'DMN_{period}', f'ADX_{period}', "signal"]]

# Moving Average Crossover Signal
def get_ma_signal(ticker, short_window=50, long_window=200, use_ema=False):
    df = ticker.copy()
    if use_ema:
        df['Short_MA'] = df.ta.ema(length=short_window)
        df['Long_MA'] = df.ta.ema(length=long_window)
    else:
        df['Short_MA'] = df.ta.sma(length=short_window)
        df['Long_MA'] = df.ta.sma(length=long_window)
    df["signal"] = np.where(df["Short_MA"] > df["Long_MA"], 1,
                            np.where(df["Short_MA"] < df["Long_MA"], -1, 0))
    return df[['Close', 'Short_MA', 'Long_MA', 'signal']]

# MACD Signal
def get_macd_signal(ticker, fast=12, slow=26, signal=9):
    df = ticker.copy()
    macd = df.ta.macd(fast=fast, slow=slow, signal=signal)
    df = df.join(macd)
    df['MACDDiff'] = df[f'MACD_{fast}_{slow}_{signal}'] - df[f'MACDs_{fast}_{slow}_{signal}']
    df["long_entry"] = (df["MACDDiff"].shift(1) < 0) & (df["MACDDiff"] > 0)
    df["short_entry"] = (df["MACDDiff"].shift(1) > 0) & (df["MACDDiff"] < 0)
    df["signal"] = 0
    position = 0
    for i in range(len(df)):
        if df.iloc[i]["long_entry"]:
            position = 1
        elif df.iloc[i]["short_entry"]:
            position = -1
        df.at[df.index[i], "signal"] = position
    return df[["Close", f"MACD_{fast}_{slow}_{signal}", f"MACDs_{fast}_{slow}_{signal}", "MACDDiff", "signal"]]

# RSI Signal
def get_rsi_signal(ticker, length=14, overbought=70, oversold=30):
    df = ticker.copy()
    df["RSI"] = df.ta.rsi(length=length)
    df["long_entry"] = (df["RSI"].shift(1) < oversold) & (df["RSI"] > oversold)
    df["short_entry"] = (df["RSI"].shift(1) > overbought) & (df["RSI"] < overbought)
    df["signal"] = 0
    position = 0
    for i in range(len(df)):
        if df.iloc[i]["long_entry"]:
            position = 1
        elif df.iloc[i]["short_entry"]:
            position = -1
        df.at[df.index[i], "signal"] = position
    return df[["Close", "RSI", "signal"]]


def backtest(data, signal_column=None, preds=None):
      st = 0
      initial_price = 0
      price = 0
      ip = False
      profit = 0
      ltp = 0

      trades = []

      transitions = (((2, "SE"), (0, "N"), (1, "LE")), ((2, "LS"), (0, "LX"), (1, "N")), ((2, "N"), (0, "SX"), (1, "SL")))
      i = 0
      st = 0
      idx_itr = 0
      for idx, row in data.iterrows():
        i = int(row[signal_column])
        idx_itr += 1

        price = row["Close"]
        st, action = transitions[st][i+1]
        match(action):
          case "LE":
            if not ip:
              if (initial_price + profit) < row["Close"]:
                initial_price = row["Close"] - profit
              ip = True
              ltp = price
              trades.append((idx.strftime("%Y-%m-%d %H:%M"), "Long Entry", price, None))
          case "LX":
            if ip:
              ip = False
              profit += price - ltp
              trades.append((idx.strftime("%Y-%m-%d %H:%M"), "Long Exit", price, price - ltp))
          case "SE":
            if not ip:
              ip = True
              ltp = price
              trades.append((idx.strftime("%Y-%m-%d %H:%M"), "Short Entry", price, None))
          case "SX":
            if ip:
              ip = False
              if (ltp - price) < 0:
                if (initial_price + profit) < abs(ltp - price):
                  initial_price = abs(ltp - price) - profit
              profit += ltp - price
              trades.append((idx.strftime("%Y-%m-%d %H:%M"), "Short Exit", price, ltp - price))
          case "LS":
            if ip:
              profit += price - ltp
              trades.append((idx.strftime("%Y-%m-%d %H:%M"), "Long Exit", price, price - ltp))
            else:
              ip = True
            trades.append((idx.strftime("%Y-%m-%d %H:%M"), "Short Entry", price, None))
            ltp = price
          case "SL":
            if ip:
              if (ltp - price) < 0:
                if (initial_price + profit) < abs(ltp - price):
                  initial_price = abs(ltp - price) - profit
              profit += ltp - price
              trades.append((idx.strftime("%Y-%m-%d %H:%M"), "Short Exit", price, ltp - price))
            else:
              ip = False
            if (initial_price + profit) < row["Close"]:
                initial_price = row["Close"] - profit
            ltp = price
            trades.append((idx.strftime("%Y-%m-%d %H:%M"), "Long Entry", price, None))
    #   if trades:
    #      if "Entry" in trades[-1][1]:
    #         pri = trades[-1][2]
    #         if "Long" in trades[-1][1]:
    #            ent = "Long Exit"
    #            prf = price - pri
    #         else:
    #            ent = "Short Exit"
    #            prf = pri - price
    #         trades.append((idx.strftime("%Y-%m-%d %H:%M"), ent, price, prf))

      return initial_price, profit, data["Close"].iloc[0],data["Close"].iloc[-1] - data["Close"].iloc[0], trades


import pandas as pd
import numpy as np
from itertools import groupby

def max_consecutive(series: pd.Series, condition: bool) -> int:
    return max((sum(1 for _ in group) for key, group in groupby(series == condition) if key), default=0)

from itertools import groupby
from collections import Counter

def streak_frequencies(pnl: pd.Series) -> dict:
    """
    Returns frequency distributions of consecutive win/loss streaks.

    Returns:
        {
            'win_streaks': Counter({1: n1, 2: n2, ...}),
            'loss_streaks': Counter({1: m1, 2: m2, ...})
        }
    """
    signs = pnl.apply(lambda x: 1 if x > 0 else (-1 if x < 0 else 0))
    streaks = [(k, sum(1 for _ in g)) for k, g in groupby(signs) if k != 0]

    win_streaks = Counter(length for sign, length in streaks if sign > 0)
    loss_streaks = Counter(length for sign, length in streaks if sign < 0)

    return {
        "win_streaks": dict(win_streaks),
        "loss_streaks": dict(loss_streaks)
    }

def transform_trades(trades):
  transformed_data = []
  cumulative_profit = 0
  for i in range(0, len(trades), 2):
      entry_date, trade_type, _, _ = trades[i]
      try:
        exit_date, _, _, pnl = trades[i + 1]
      except:
        exit_date = None
        pnl = 0
      cumulative_profit += pnl
      trade_side = 'Short' if 'Short' in trade_type else 'Long'
      transformed_data.append((entry_date, exit_date, trade_side, pnl, cumulative_profit))
  
  return transformed_data

def calculate_metrics(df: pd.DataFrame, initial_equity: float = 1.0) -> dict:
    import numpy as np
    df = df.copy()
    df["Date"] = pd.to_datetime(df["Timestamp"])
    
    df_exit = df[((df["Action"].str.lower() == "long exit") | (df["Action"].str.lower() == "short exit"))].reset_index(drop=True)

    
    if df_exit.empty:
        return {"Error": "No closed trades with PnL found."}

    pnl = df_exit["PnL"]
    equity_curve = initial_equity + pnl.cumsum()

    total_trades = len(pnl)
    gross_profit = pnl[pnl > 0].sum()
    gross_loss = pnl[pnl < 0].sum()
    net_profit = pnl.sum()
    win_trades = (pnl > 0).sum()
    loss_trades = (pnl < 0).sum()
    win_ratio = win_trades / total_trades
    avg_win = pnl[pnl > 0].mean() if win_trades > 0 else 0
    avg_loss = pnl[pnl < 0].mean() if loss_trades > 0 else 0
    expectancy = win_ratio * avg_win + (1 - win_ratio) * avg_loss
    profit_factor = gross_profit / abs(gross_loss) if gross_loss else float("inf")
    max_win = pnl.max()
    max_loss = pnl.min()
    sharpe = pnl.mean() / pnl.std() if pnl.std() else 0

    # Drawdown
    peak = equity_curve.cummax()
    drawdown = equity_curve - peak
    drawdown_pct = drawdown / peak.replace(0, np.nan)
    max_drawdown = drawdown.min()
    max_drawdown_pct = drawdown_pct.min()
    recovery = net_profit / abs(max_drawdown) if max_drawdown else float("inf")

    # Streaks
    max_wins = max_consecutive(pnl > 0, True)
    max_losses = max_consecutive(pnl < 0, True)

    # Risk-adjusted returns
    duration = max((df_exit["Date"].iloc[-1] - df_exit["Date"].iloc[0]).days, 1)
    #cagr = ((equity_curve.iloc[-1] / initial_equity) ** (365 / duration)) - 1 if duration > 0 else 0

    try:
        if initial_equity > 0 and equity_curve.iloc[-1] > 0 and duration > 0:
            growth_ratio = equity_curve.iloc[-1] / initial_equity
            if growth_ratio > 0:
                import numpy as np
                try:
                    if duration > 0 and growth_ratio > 0:
                        cagr = np.power(growth_ratio, 365 / duration) - 1
                        if not np.isfinite(cagr):  # handle inf or NaN
                            cagr = np.nan
                    else:
                        cagr = np.nan
                except Exception:
                    cagr = np.nan

            else:
                cagr = float('nan')
        else:
            cagr = float('nan')
    except:
        cagr = float('nan')

    sortino = pnl.mean() / pnl[pnl < 0].std() if pnl[pnl < 0].std() else 0
    calmar = cagr / abs(max_drawdown_pct) if max_drawdown_pct != 0 else float("inf")

    return {
        "Total Trades": total_trades,
        "Net Profit": round(net_profit, 2),
        "Gross Profit": round(gross_profit, 2),
        "Gross Loss": round(gross_loss, 2),
        "Profit Factor": round(profit_factor, 2),
        "Expectancy": round(expectancy, 2),
        "Win Ratio": round(win_ratio, 2),
        "Avg Win": round(avg_win, 2),
        "Avg Loss": round(avg_loss, 2),
        "Max Win": round(max_win, 2),
        "Max Loss": round(max_loss, 2),
        "Sharpe Ratio": round(sharpe, 2),
        "Sortino Ratio": round(sortino, 2),
        "Max Drawdown": round(max_drawdown, 2),
        "Max Drawdown %": round(max_drawdown_pct * 100, 2),
        "Recovery Factor": round(recovery, 2),
        "CAGR (%)": round(cagr * 100, 2),
        "Calmar Ratio": round(calmar, 2),
        "Max Consecutive Wins": max_wins,
        "Max Consecutive Losses": max_losses
    }