import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import AxiosInstance from '../AxiosInstance';
import React from 'react';
import "./PaperTrading.css";
import { useNavigate } from 'react-router-dom';

function PaperTrading() {
  const [balance, setBalance] = useState(100000);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC-USD');
  const [quantity, setQuantity] = useState(0.001);
  const [stoploss, setStoploss] = useState('');
  const [takeprofit, setTakeprofit] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [openTradesPrices, setOpenTradesPrices] = useState({});
  const [isLoadingOpenTradePrices, setIsLoadingOpenTradePrices] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [side, setSide] = useState('buy'); // to be removed
  const [portfolio, setPortfolio] = useState([]);
  const [history, setHistory] = useState([]);
  const [prices, setPrices] = useState({});
  const [stockDetails, setStockDetails] = useState({});
  const [amountInvested, setAmountInvested] = useState(0);
  const [totalPNL, setTotalPNL] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [percentPNL, setPercentPNL] = useState(0);

  const portfolioRef = useRef(portfolio);
  const historyRef = useRef(history);
  const balanceRef = useRef(balance);
  const pricesRef = useRef(prices);

  const navigate = useNavigate();

  // Update refs when state changes
  useEffect(() => { portfolioRef.current = portfolio; }, [portfolio]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { balanceRef.current = balance; }, [balance]);
  useEffect(() => { pricesRef.current = prices; }, [prices]);

  const fetchSymbolPrice = async (symbol) => {
    try {
      // const response = await axios.get(`http://localhost:5001/api/price/${symbol}`);
      const response = await AxiosInstance.get(`api/price/${symbol}`);
      return response.data.price;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  };

  const fetchStockDetails = async (symbol) => {
    try {
      setIsLoading(true);
      // const response = await axios.get(`http://localhost:5001/api/details/${symbol}`);
      const response = await AxiosInstance.get(`api/details/${symbol}`);
      setStockDetails(response.data);
    } catch (error) {
      console.error('Error fetching stock details:', error);
      setStockDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserDetails = async () => {
    try{
      const response = await AxiosInstance.get(`users/me`);
      console.log("fetched user details", response.data);
      setUserDetails(response.data);
    } catch(error) {
      console.error('Error fetching user details:', error);
    }
  };

  const placeTradeSubmitHandler = (e) => {
    e.preventDefault()

    const data = {
      symbol : selectedSymbol.toUpperCase(),
      quantity: parseFloat(quantity),
      stoploss: stoploss ? parseFloat(stoploss) : null,
      takeprofit: takeprofit ? parseFloat(takeprofit) : null,
      buy_price: stockDetails.price,
    }
    console.log(`placing trade: ${data}`);
    AxiosInstance.post(
      `open-trades/`,
      data
    )
    .then((response) => {
      console.log('Trade created successfully', response.data);
    })
    .catch((error) => {
      console.error("error opening trade", error);
    })
  }

  const getCurrentPrice = (symbol) => {
    const upperSymbol = symbol.toUpperCase();
    return prices[upperSymbol] || 0;
  };

  const approximatelyEqual = (a, b, epsilon = 0.01) => {
    return Math.abs(a - b) < epsilon;
  };

  const checkStopConditions = async () => {
    const updatedPrices = await fetchPrices();
    if (!updatedPrices) return;

    const currentPortfolio = [...portfolioRef.current];
    let portfolioChanged = false;

    const newPortfolio = currentPortfolio.filter(trade => {
      const price = updatedPrices[trade.symbol];
      if (!price) return true;

      const isBuy = trade.side === 'buy';
      const sl = trade.stoploss;
      const tp = trade.takeprofit;

      if (sl === null && tp === null) return true;

      const shouldCloseBuy = isBuy && (
        (sl !== null && (price <= sl || approximatelyEqual(price, sl))) || 
        (tp !== null && (price >= tp || approximatelyEqual(price, tp)))
      );

      const shouldCloseSell = !isBuy && (
        (sl !== null && (price >= sl || approximatelyEqual(price, sl))) || 
        (tp !== null && (price <= tp || approximatelyEqual(price, tp)))
      );

      if (shouldCloseBuy || shouldCloseSell) {
        console.log(`Auto-closing ${trade.side.toUpperCase()} trade ${trade.id} for ${trade.symbol}`);
        closeTrade(trade.id, price);
        portfolioChanged = true;
        return false;
      }
      
      return true;
    });

    if (portfolioChanged) {
      setPortfolio(newPortfolio);
    }
  };

  const closeTrade = (id, currentPrice = null) => {
    const currentPortfolio = [...portfolioRef.current];
    const trade = currentPortfolio.find(t => t.id === id);

    if (!trade) {
      console.log(`Trade ${id} not found!`);
      return;
    }

    const price = currentPrice !== null ? currentPrice : getCurrentPrice(trade.symbol);
    const pnl = trade.side === 'buy'
      ? (price - trade.entry_price) * trade.quantity
      : (trade.entry_price - price) * trade.quantity;

    const updatedBalance = balanceRef.current + (trade.entry_price * trade.quantity) + pnl;
    const newPortfolio = currentPortfolio.filter(t => t.id !== id);
    const newHistory = [...historyRef.current, { 
      ...trade, 
      exit_price: price, 
      timestamp: new Date(), 
      pnl 
    }];

    setPortfolio(newPortfolio);
    setHistory(newHistory);
    setBalance(updatedBalance);
    updatePortfolioValuesFromData(newPortfolio);
    saveStorage(updatedBalance, newPortfolio, newHistory);
  };

  const updatePortfolioValuesFromData = (data) => {
    let invested = 0;
    let current = 0;
    let totalPnl = 0;
  
    data.forEach((trade) => {
      const entryPrice = trade.entry_price;
      const currentPrice = getCurrentPrice(trade.symbol);
      const quantity = Number(trade.quantity);

      const tradeCost = entryPrice * quantity;
      invested += tradeCost;
  
      const tradeCurrentValue = currentPrice * quantity;
      current += tradeCurrentValue;
  
      const tradePnl = tradeCurrentValue - tradeCost;
      totalPnl += tradePnl;
    });
  
    const percent = invested > 0 ? (totalPnl / invested) * 100 : 0;
  
    setAmountInvested(invested);
    setCurrentValue(current);
    setTotalPNL(totalPnl);
    setPercentPNL(percent);
  };

  const loadStorage = () => {
    try {
      const bal = localStorage.getItem('balance');
      const port = (JSON.parse(localStorage.getItem('portfolio')) || []).map(trade => ({
        ...trade,
        quantity: parseFloat(trade.quantity),
      }));
      const hist = JSON.parse(localStorage.getItem('history')) || [];
  
      setBalance(bal ? parseFloat(bal) : 100000);
      setPortfolio(port);
      setHistory(hist);
      updatePortfolioValuesFromData(port);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      resetBalance();
    }
  };

  const saveStorage = (bal, port, hist) => {
    try {
      localStorage.setItem('balance', bal);
      localStorage.setItem('portfolio', JSON.stringify(port));
      localStorage.setItem('history', JSON.stringify(hist));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const placeTrade = async () => {
    const symbol = selectedSymbol.toUpperCase();
    const price = await fetchSymbolPrice(symbol);
    
    if (!price || price <= 0) {
      alert('Invalid price for selected symbol');
      return;
    }
    
    const cost = price * quantity;
    if (side === 'buy' && balance < cost) {
      alert('Insufficient balance');
      return;
    }
    
    if (stoploss && takeprofit) {
      if (
        (side === 'buy' && parseFloat(stoploss) >= parseFloat(takeprofit)) ||
        (side === 'sell' && parseFloat(stoploss) <= parseFloat(takeprofit))
      ) {
        alert('Stoploss must be below takeprofit for buys and above for sells');
        return;
      }
    }
    
    const trade = {
      id: Date.now(),
      symbol,
      quantity: parseFloat(quantity),
      entry_price: price,
      stoploss: stoploss ? parseFloat(stoploss) : null,
      takeprofit: takeprofit ? parseFloat(takeprofit) : null,
      side,
    };
  
    const newPortfolio = [...portfolio, trade];
    const newBalance = side === 'buy' ? balance - cost : balance;
  
    saveStorage(newBalance, newPortfolio, history);
    setPortfolio(newPortfolio);
    setBalance(newBalance);
    updatePortfolioValuesFromData(newPortfolio);
    setPrices((prevPrices) => ({ ...prevPrices, [symbol]: price }));
    setStoploss('');
    setTakeprofit('');
  };

  const fetchPrices = async () => {
    try {
      const symbols = Array.from(new Set([
        selectedSymbol,
        ...portfolioRef.current.map(trade => trade.symbol)
      ]));
  
      const pricePromises = symbols.map(symbol => 
        // axios.get(`http://localhost:5001/api/price/${symbol}`)
        AxiosInstance.get(`api/price/${symbol}`)
      );
  
      const responses = await Promise.all(pricePromises);
      const newPrices = {};
  
      responses.forEach((res, index) => {
        if (res.data && res.data.price) {
          newPrices[symbols[index]] = res.data.price;
        }
      });
  
      setPrices(prev => ({ ...prev, ...newPrices }));
      return newPrices;
    } catch (error) {
      console.error('Error fetching prices:', error);
      return null;
    }
  };

  const resetBalance = () => {
    if (window.confirm('Are you sure you want to reset your balance and all trades?')) {
      localStorage.clear();
      setBalance(100000);
      setPortfolio([]);
      setHistory([]);
      setAmountInvested(0);
      setCurrentValue(0);
      setTotalPNL(0);
      setPercentPNL(0);
    }
  };

  // initializes and checks stop condition every 10 sec
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await fetchUserDetails();
      await fetchPrices();
      loadStorage();
      setIsLoading(false);
      console.log('loading is done');
    };
    initialize();

    const interval = setInterval(() => {
      checkStopConditions();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Updates price every 5 sec in the portfolio
  useEffect(() => {
    const priceInterval = setInterval(async () => {
      const updatedPrices = await fetchPrices();
      if (updatedPrices) {
        updatePortfolioValuesFromData(portfolioRef.current);
      }
    }, 5000);

    return () => clearInterval(priceInterval);
  }, []);

  useEffect(() => {
    if(!userDetails || !userDetails.open_trades) return;

    const fetchPrices = async () => {
      try{
        const updatedPrices = {};

        await Promise.all(userDetails.open_trades.map(async (trade) => {
          const symbol = trade.symbol.toUpperCase();
          const price = await fetchSymbolPrice(symbol);

          if(price !== null){
            updatedPrices[symbol] = price;
          }
        }));

        setOpenTradesPrices(updatedPrices);
        setIsLoadingOpenTradePrices(false);
      } catch(error) {
        console.error("Error fetching live prices", error)
        setIsLoadingOpenTradePrices(false);
      }
    };

    fetchPrices();

    const intervalId = setInterval(() => {
      fetchPrices();
    }, 20000); // fetch every 20 sec

    return () => clearInterval(intervalId);
  }, [userDetails])

  return (
    <>
      <div className="dashboard">
        

        <h1>Paper Trading</h1>

        <div className="summary-cards">
          <div className="card">
            <p>💰 Balance: <span className="bold">{isLoading?'Loading': `$${userDetails.balance.toFixed(2)}`}</span></p>
          </div>
          <div className="card">
            <p>💸 Amount Invested: <span className="bold">{isLoading?'Loading': `$${userDetails.amount_invested.toFixed(2)}`}</span></p>
          </div>
          {/*<div className="card">
            <p>📊 Current Value: <span className="bold">${currentValue.toFixed(2)}</span></p>
          </div>
          <div className="card">
            <p>📈 Total P&L: <span className={totalPNL >= 0 ? 'positive' : 'negative'}>${totalPNL.toFixed(2)} ({percentPNL.toFixed(2)}%)</span></p>
          </div>*/}
        </div>

        <button 
          onClick={resetBalance} 
          className="_button reset-button "
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Reset Balance'}
        </button>

        <div className="symbol-search">
          <h2 className='_h2'>Search for Symbol</h2>
          <div className="search-controls">
            <input
              type="text"
              placeholder="Enter symbol (e.g. BTC-USD)"
              onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
              value={selectedSymbol}
              disabled={isLoading}
            />
            <button
              className='_button'
              onClick={() => fetchStockDetails(selectedSymbol)}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Get Details'}
            </button>
          </div>
        </div>

        {stockDetails && (
          <div className="stock-details">
            <h2 className='_h2'>Stock Details for {selectedSymbol}</h2>
            <div className="details-grid">
              <p><strong>Current Price:</strong> ${stockDetails.price}</p>
              <p><strong>Market Cap:</strong> {stockDetails.marketCap}</p>
              <p><strong>24h Change:</strong> 
                <span className={stockDetails.change24h >= 0 ? 'positive' : 'negative'}>
                  {stockDetails.change24h}%
                </span>
              </p>
            </div>
            <div className='flex justify-center items-center py-5'>
              <button 
                className='text-white px-4 py-2 text-center bg-green-600 rounded-md text-sm'
                onClick={() => {navigate(`/stockchart/${selectedSymbol}`)}}
              >View Chart</button>
              </div>
          </div>
        )}

        <form onSubmit={placeTradeSubmitHandler}>
        <div className="trade-form">
          <h2 className='_h2'>Place Trade</h2>
          <div className="trade-options">
            <div className="form-group">
              <label>Side</label>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value)}
                disabled={isLoading}
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={isLoading}
                
              />
            </div>
            <div className="form-group">
              <label>Stoploss (optional)</label>
              <input
                type="number"
                step="0.01"
                value={stoploss}
                onChange={(e) => setStoploss(e.target.value)}
                disabled={isLoading}
                placeholder={side === 'buy' ? 'Below current price' : 'Above current price'}
                
              />
            </div>
            <div className="form-group">
              <label>Takeprofit (optional)</label>
              <input
                type="number"
                step="0.01"
                value={takeprofit}
                onChange={(e) => setTakeprofit(e.target.value)}
                disabled={isLoading}
                placeholder={side === 'buy' ? 'Above current price' : 'Below current price'}
                
              />
            </div>
          </div>
          <button
          className='_button'
            type='submit'
            disabled={isLoading || !selectedSymbol || !quantity}
          >
            {isLoading ? 'Processing...' : 'Place Trade'}
          </button>
        </div>
        </form>

        {!isLoading && 
          <div className="open-trades">
            <h2 className='_h2'>Open Trades {userDetails.open_trades.length}</h2>
            {userDetails.open_trades.length === 0 ? (
              <p className="no-trades">No open trades</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Qty</th>
                      <th>Entry</th>
                      <th>Current</th>
                      <th>Stoploss</th>
                      <th>Takeprofit</th>
                      <th>P&L</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userDetails.open_trades.map(trade => {
                      const currentPrice = isLoadingOpenTradePrices? 0 : openTradesPrices[trade.symbol];
                      const pnl = (currentPrice - trade.buy_price) * trade.quantity;

                      return (
                        <tr key={trade.id}>
                          <td>{trade.symbol}</td>
                          <td>{trade.quantity.toFixed(4)}</td>
                          <td>${trade.buy_price.toFixed(2)}</td>
                          <td>${currentPrice.toFixed(2)}</td>
                          <td>
                            {trade.stoploss ? `$${trade.stoploss.toFixed(2)}` : '-'}
                          </td>
                          <td>
                            {trade.takeprofit ? `$${trade.takeprofit.toFixed(2)}` : '-'}
                          </td>
                          <td className={pnl >= 0 ? 'positive' : 'negative'}>
                            ${pnl.toFixed(2)}
                          </td>
                          <td>
                            <button
                              onClick={() => closeTrade(trade.id)}
                              className='_button'
                              disabled={isLoading}
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        }

        {!isLoading && 
          <div className="history">
            <h2 className='_h2'>Trade History ({userDetails.closed_trades.length})</h2>
            {userDetails.closed_trades.length === 0 ? (
              <p className="no-history">No trade history</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Qty</th>
                      <th>Entry</th>
                      <th>Exit</th>
                      <th>P&L</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userDetails.closed_trades.map((trade) => (
                      <tr key={trade.id}>
                        <td>{trade.symbol}</td>
                        <td>{Number(trade.quantity).toFixed(4)}</td>
                        <td>${trade.buy_price.toFixed(2)}</td>
                        <td>${trade.sell_price.toFixed(2)}</td>
                        <td className={trade.p_and_l >= 0 ? 'positive' : 'negative'}>
                          ${trade.p_and_l.toFixed(2)}
                        </td>
                        <td>{new Date(trade.sell_date).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        }

      </div>

    </>
  );
}

export default PaperTrading;
