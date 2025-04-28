import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import AxiosInstance from '../AxiosInstance';
import React from 'react';
import "./PaperTrading.css";
import { useNavigate } from 'react-router-dom';

function PaperTrading() {
  // states for place trade form
  const [quantity, setQuantity] = useState(0.001);
  const [stoploss, setStoploss] = useState('');
  const [takeprofit, setTakeprofit] = useState('');
  const [isLoadingPlaceTrade, setIsLoadingPlaceTrade] = useState(false);
  const [errorPlaceTrade, setErrorPlaceTrade] = useState(false);

  // states for user details (open_trades, balance, closed_trades, amount_invested, etc...)
  const [userDetails, setUserDetails] = useState(null);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState(true);
  const [errorUserDetails, setErrorUserDetails] = useState(false);

  // states for user's open-trades prices live updating
  const [openTradesPrices, setOpenTradesPrices] = useState({});
  const [isLoadingOpenTradePrices, setIsLoadingOpenTradePrices] = useState(true);
  const [errorOpenTradePrices, setErrorOpenTradePrices] = useState(false);

  // states for searching stock details
  const [selectedSymbol, setSelectedSymbol] = useState('BTC-USD');
  const [stockDetails, setStockDetails] = useState({});
  const [getDetailsPressed, setGetDetailsPressed] = useState(true);
  const [isLoadingStockDetails, setIsLoadingStockDetails] = useState(true);
  const [errorStockDetails, setErrorStockDetails] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  
  // might use later
  const [balance, setBalance] = useState(100000);
  const [amountInvested, setAmountInvested] = useState(0);
  const [totalPNL, setTotalPNL] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [percentPNL, setPercentPNL] = useState(0);

  // for navigation to charts
  const navigate = useNavigate();

  // fetches price of stock using symbol
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

  // updates user's open_trade's current prices every 20 sec
  useEffect(() => {
    if(!userDetails || !userDetails.open_trades) return; // waits until userDetails are fetched

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

  // fetches stock details using its symbol
  const fetchStockDetails = async (symbol, showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoadingStockDetails(true);
        setErrorStockDetails(false);
      }
  
      const response = await AxiosInstance.get(`api/details/${symbol}`);
      setStockDetails(response.data);
  
    } catch (error) {
      console.error('Error fetching stock details:', error);
      if (showLoading) {
        setErrorStockDetails(true);
        setStockDetails(null);
      }
    } finally {
      if (showLoading) {
        setIsLoadingStockDetails(false);
      }
    }
  };
  // updates stock details every 7 sec
  useEffect(() => {
    if(!selectedSymbol || selectedSymbol==="") return; // waits until selected symbol is not empty
    
    fetchStockDetails(selectedSymbol, true);
    
    const intervalId = setInterval(() => {
      fetchStockDetails(selectedSymbol, false); // silent loading
    }, 7000); // fetch every 7 sec
    
    return () => clearInterval(intervalId);
  }, [getDetailsPressed]);
  
  // fetches user details
  const fetchUserDetails = async () => {
    try{
      setIsLoadingUserDetails(true);
      setErrorUserDetails(false);
      const response = await AxiosInstance.get(`users/me`);
      console.log("fetched user details", response.data);
      setUserDetails(response.data);
    } catch(error) {
      setErrorUserDetails(true);
      console.error('Error fetching user details:', error);
    } finally {
      setIsLoadingUserDetails(false);
    }
  };

  // initializes and checks stop condition every 10 sec
  useEffect(() => {
    const initialize = async () => {
      await fetchUserDetails();
    };
    initialize();

    // UNCOMMENT WHEN checkStopCondition IS IMPLEMENTED
    // const interval = setInterval(() => {
    //   checkStopConditions();
    // }, 10000);

    // return () => clearInterval(interval);
  }, []);
  
  const placeTradeSubmitHandler = (e) => {
    e.preventDefault()

  }


  const approximatelyEqual = (a, b, epsilon = 0.01) => {
    return Math.abs(a - b) < epsilon;
  };

  const checkStopConditions = async () => {
    
  };

  const closeTrade = (id, currentPrice = null) => {
    
  };

  const resetBalance = () => {
    
  };



  return (
    <>
      <div className="dashboard">
        <h1>Paper Trading</h1>
        {errorUserDetails? <></>: 
          <div className="summary-cards">
            <div className="card">
              <p>💰 Balance: <span className="bold">{isLoadingUserDetails?'Loading': (errorUserDetails? "Error" : `$${userDetails.balance.toFixed(2)}`)}</span></p>
            </div>
            <div className="card">
              <p>💸 Amount Invested: <span className="bold">{isLoadingUserDetails?'Loading': (errorUserDetails? "Error" : `$${userDetails.amount_invested.toFixed(2)}`)}</span></p>
            </div>
            {/*<div className="card">
              <p>📊 Current Value: <span className="bold">${currentValue.toFixed(2)}</span></p>
            </div>
            <div className="card">
              <p>📈 Total P&L: <span className={totalPNL >= 0 ? 'positive' : 'negative'}>${totalPNL.toFixed(2)} ({percentPNL.toFixed(2)}%)</span></p>
            </div>*/}
          </div>
        }
        <button 
          onClick={resetBalance} 
          className="_button reset-button "
          disabled={isLoadingUserDetails}
        >
          {isLoadingUserDetails ? 'Loading...' : 'Reset Balance'}
        </button>

        <div className="symbol-search">
          <h2 className='_h2'>Search for Symbol</h2>
          <div className="search-controls">
            <input
              type="text"
              placeholder="Enter symbol (e.g. BTC-USD)"
              onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
              value={selectedSymbol}
              disabled={isLoadingStockDetails}
            />
            <button
              className='_button'
              onClick={() => setGetDetailsPressed((prev) => prev = !prev)}
              disabled={isLoadingStockDetails}
            >
              {isLoadingStockDetails ? 'Loading...' : 'Get Details'}
            </button>
          </div>
        </div>

        {isLoadingStockDetails ? 
          <div>Loading Stock Details for {selectedSymbol}</div> : 
            (errorStockDetails ? 
              <div className="stock-details">
                <h2 className='_h2'>Error Loading {selectedSymbol}</h2>
              </div> : 
           
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
            )
        }

        <form onSubmit={placeTradeSubmitHandler}>
          <div className="trade-form">
            <h2 className='_h2'>Place Trade</h2>
            <div className="trade-options">
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  disabled={isLoadingPlaceTrade}
                  
                />
              </div>
              <div className="form-group">
                <label>Stoploss (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={stoploss}
                  onChange={(e) => setStoploss(e.target.value)}
                  disabled={isLoadingPlaceTrade}
                  placeholder='Below current price'
                  
                />
              </div>
              <div className="form-group">
                <label>Takeprofit (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={takeprofit}
                  onChange={(e) => setTakeprofit(e.target.value)}
                  disabled={isLoadingPlaceTrade}
                  placeholder='Above current price'
                  
                />
              </div>
            </div>
            <button
            className='_button'
              type='submit'
              disabled={isLoadingPlaceTrade || !selectedSymbol || !quantity}
            >
              {isLoadingPlaceTrade ? 'Processing...' : 'Place Trade'}
            </button>
          </div>
          {errorPlaceTrade? 
            <div className='text-lg text-red-600 font-semibold text-center px-10 py-10 my-5'>
              Error: Cannot Place Trade
            </div> : 
              <></>
          }
        </form>

        {isLoadingUserDetails ? <div className='open-trades'><h2 className='_h2'>Loading...</h2></div> :
          (errorUserDetails? <div className='open-trades'><h2 className='_h2 text-red-600'>Error</h2></div> : 
            <div className="open-trades">
              <h2 className='_h2'>Open Trades ({userDetails.open_trades.length})</h2>
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
          )
        }

        {isLoadingUserDetails ? <div className='history'><h2 className='_h2'>Loading...</h2></div> : 
          (errorUserDetails? <div className='history'><h2 className='_h2 text-red-600'>Error</h2></div> : 
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
          )
        }

      </div>

    </>
  );
}

export default PaperTrading;
