import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

function PaperTrading() {
  const [balance, setBalance] = useState(100000);
  const [selectedSymbol, setSelectedSymbol] = useState('BTC-USD');
  const [quantity, setQuantity] = useState(0.001);
  const [side, setSide] = useState('buy');
  const [stoploss, setStoploss] = useState('');
  const [takeprofit, setTakeprofit] = useState('');
  const [portfolio, setPortfolio] = useState([]);
  const [history, setHistory] = useState([]);
  const [prices, setPrices] = useState({});
  const [stockDetails, setStockDetails] = useState(null);
  const [amountInvested, setAmountInvested] = useState(0);
  const [totalPNL, setTotalPNL] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [percentPNL, setPercentPNL] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const portfolioRef = useRef(portfolio);
  const historyRef = useRef(history);
  const balanceRef = useRef(balance);
  const pricesRef = useRef(prices);

  // Update refs when state changes
  useEffect(() => { portfolioRef.current = portfolio; }, [portfolio]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { balanceRef.current = balance; }, [balance]);
  useEffect(() => { pricesRef.current = prices; }, [prices]);

  const fetchSymbolPrice = async (symbol) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/price/${symbol}`);
      return response.data.price;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  };

  const fetchStockDetails = async (symbol) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`http://localhost:5000/api/details/${symbol}`);
      setStockDetails(response.data);
    } catch (error) {
      console.error('Error fetching stock details:', error);
      setStockDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

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
        axios.get(`http://localhost:5000/api/price/${symbol}`)
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

  useEffect(() => {
    const initialize = async () => {
      await fetchPrices();
      loadStorage();
    };
    initialize();

    const interval = setInterval(() => {
      checkStopConditions();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const priceInterval = setInterval(async () => {
      const updatedPrices = await fetchPrices();
      if (updatedPrices) {
        updatePortfolioValuesFromData(portfolioRef.current);
      }
    }, 5000);

    return () => clearInterval(priceInterval);
  }, []);

  return (
    <div className="dashboard">
      <style>
        {`
        .dashboard {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
          background-color: #f5f7fa;
        }

        h1, h2 {
          color: #2c3e50;
          margin-bottom: 20px;
        }

        h1 {
          font-size: 28px;
          text-align: center;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
          margin-bottom: 30px;
        }

        h2 {
          font-size: 22px;
          margin-top: 30px;
        }

        .bold {
          font-weight: bold;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .card {
          background: white;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .card p {
          margin: 10px 0;
          font-size: 16px;
        }

        button {
          background-color: #3498db;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.3s;
          margin: 5px 0;
        }

        button:hover:not(:disabled) {
          background-color: #2980b9;
        }

        button:disabled {
          background-color: #95a5a6;
          cursor: not-allowed;
        }

        .reset-button {
          background-color: #e74c3c;
          margin-bottom: 20px;
        }

        .reset-button:hover:not(:disabled) {
          background-color: #c0392b;
        }

        .symbol-search, .trade-form {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .search-controls {
          display: flex;
          gap: 10px;
        }

        input, select {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          flex: 1;
        }

        input:focus, select:focus {
          outline: none;
          border-color: #3498db;
        }

        .trade-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 5px;
          font-weight: 500;
        }

        .table-container {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          background: white;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        th {
          background-color: #3498db;
          color: white;
          font-weight: 500;
        }

        tr:hover {
          background-color: #f5f5f5;
        }

        .side {
          font-weight: bold;
          text-transform: uppercase;
        }

        .side.buy {
          color: #27ae60;
        }

        .side.sell {
          color: #e74c3c;
        }

        .positive {
          color: #27ae60;
          font-weight: 500;
        }

        .negative {
          color: #e74c3c;
          font-weight: 500;
        }

        .no-trades, .no-history {
          text-align: center;
          padding: 20px;
          color: #7f8c8d;
          font-style: italic;
        }

        .stock-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        @media (max-width: 768px) {
          .summary-cards, .trade-options, .details-grid {
            grid-template-columns: 1fr;
          }
          
          .search-controls {
            flex-direction: column;
          }
        }
        `}
      </style>

      <h1>Paper Trading</h1>

      <div className="summary-cards">
        <div className="card">
          <p>💰 Balance: <span className="bold">${balance.toFixed(2)}</span></p>
          <p>📉 {selectedSymbol} Price: <span className="bold">${getCurrentPrice(selectedSymbol).toFixed(2)}</span></p>
        </div>
        <div className="card">
          <p>💸 Amount Invested: <span className="bold">${amountInvested.toFixed(2)}</span></p>
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
        className="reset-button"
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Reset Balance'}
      </button>

      <div className="symbol-search">
        <h2>Search for Symbol</h2>
        <div className="search-controls">
          <input
            type="text"
            placeholder="Enter symbol (e.g. BTC-USD)"
            onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
            value={selectedSymbol}
            disabled={isLoading}
          />
          <button
            onClick={() => fetchStockDetails(selectedSymbol)}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Get Details'}
          </button>
        </div>
      </div>

      {stockDetails && (
        <div className="stock-details">
          <h2>Stock Details for {selectedSymbol}</h2>
          <div className="details-grid">
            <p><strong>Current Price:</strong> ${stockDetails.price}</p>
            <p><strong>Market Cap:</strong> {stockDetails.marketCap}</p>
            <p><strong>24h Change:</strong> 
              <span className={stockDetails.change24h >= 0 ? 'positive' : 'negative'}>
                {stockDetails.change24h}%
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="trade-form">
        <h2>Place Trade</h2>
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
          onClick={placeTrade}
          disabled={isLoading || !selectedSymbol || !quantity}
        >
          {isLoading ? 'Processing...' : 'Place Trade'}
        </button>
      </div>

      <div className="open-trades">
        <h2>Open Trades ({portfolio.length})</h2>
        {portfolio.length === 0 ? (
          <p className="no-trades">No open trades</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Side</th>
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
                {portfolio.map(trade => {
                  const currentPrice = getCurrentPrice(trade.symbol);
                  const pnl = trade.side === 'buy'
                    ? (currentPrice - trade.entry_price) * trade.quantity
                    : (trade.entry_price - currentPrice) * trade.quantity;

                  return (
                    <tr key={trade.id}>
                      <td>{trade.symbol}</td>
                      <td className={`side ${trade.side}`}>{trade.side}</td>
                      <td>{trade.quantity.toFixed(4)}</td>
                      <td>${trade.entry_price.toFixed(2)}</td>
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

      <div className="history">
        <h2>Trade History ({history.length})</h2>
        {history.length === 0 ? (
          <p className="no-history">No trade history</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Side</th>
                  <th>Qty</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>P&L</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {history.slice().reverse().map((trade, index) => (
                  <tr key={index}>
                    <td>{trade.symbol}</td>
                    <td className={`side ${trade.side}`}>{trade.side}</td>
                    <td>{Number(trade.quantity).toFixed(4)}</td>
                    <td>${trade.entry_price.toFixed(2)}</td>
                    <td>${trade.exit_price.toFixed(2)}</td>
                    <td className={trade.pnl >= 0 ? 'positive' : 'negative'}>
                      ${trade.pnl.toFixed(2)}
                    </td>
                    <td>{new Date(trade.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaperTrading;
