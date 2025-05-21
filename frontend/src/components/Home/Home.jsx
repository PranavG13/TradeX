import React, { useEffect, useState } from "react";
import AxiosInstance from "../AxiosInstance";
import { useForm } from "react-hook-form";


function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState('');

  const [stockDetails, setStockDetails] = useState(null);
  const [errorStockDetails, setErrorStockDetails] = useState(false);
  const [isLoadingStockDetails, setIsLoadingStockDetails] = useState(false);

  const [stockNews, setStockNews] = useState(null);
  const [isLoadingStockNews, setIsLoadingStockNews] = useState(false);
  const [errorStockNews, setErrorStockNews] = useState(false);
  // const [strategyText, setStrategyText] = useState('')
  // const [strategySymbol, setStrategySymbol] = useState('')
  // const [strategyInterval, setStrategyInterval] = useState('daily')
    
  //Form 1: Strategy Test
  const {
          register: registerStrategy,
          handleSubmit: handleStrategySubmit,
          formState: {errors: errorsStrategy},
      } = useForm()

    // a handler to handle back testing submission
    const testStrategyHandler = (data) => {
      console.log("form submitted", data);
      // data = Object { strategySymbol: "BTC-USD", strategyInterval: "day", strategyText: "Text123" }

      // posting data to api
      // AxiosInstance.post(
      //     `api/backtesting/`,
      //     data
      // )
      // .then((response) => {
      //      HANDLE RESPONSE HERE
      //     console.log(response);
      //   
      // })
      // .catch((error) => {
      //     console.error("error during strategy testing", error);
      // })
    }

    //Form 2: Recommendation
  const {
          register: registerRecommendation,
          handleSubmit: handleRecommendationSubmit,
          formState: {errors: errorsRecommendation},
        } = useForm()

    const recommendationHandler = (data) => {
      console.log("recommendation form submitted", data);
      //data = Object {recommendationSymbol: "BTC-USD", recommendationInterval: "day/week/month"}
      AxiosInstance.post(
        `api/recommendation`,
        data
      )
      .then((response) => {
        console.log("response recieved", response);
      })
      .catch((error) => {
        console.log("Erorr in recommendation", error);
      })
    }

    const {
      register: registerSearch,
      handleSubmit: handleSearchSubmit,
      formState: {errors: errorsSearch},
    } = useForm()

    const searchHandler = (data) => {
      console.log("searching for ", data.searchSymbol);
      setSelectedSymbol(data.searchSymbol);
      fetchStockDetails(data.searchSymbol);
      fetchNews(data.searchSymbol);
    }

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

    const fetchNews = async (symbol) => {
      try{
        console.log("fetching news for ", symbol);
        setIsLoadingStockNews(true);
        setErrorStockNews(false);
        const response = await AxiosInstance.post(`api/news-sentiment`, {"symbol" : symbol});
        console.log(response.data);
        setStockNews(response.data);
      } catch (error) {
        console.error("Error in fetching news: ", error);
        setErrorStockNews(true);
      } finally {
        setIsLoadingStockNews(false);
      }
    }

    const renderStockDetails = () => {
      if (isLoadingStockDetails) {
        return <div>Loading Stock Details for {selectedSymbol}</div>;
      }
    
      if (errorStockDetails) {
        return (
          <div>
            <h2>Error Loading {selectedSymbol}</h2>
          </div>
        );
      }

      if(stockDetails === null) {
        return (<></>);
      }
    
      const { price, marketCap, change24h } = stockDetails;
    
      return (
        <div className="p-4 bg-gray-100 rounded shadow mb-6">
          <h2 className="font-bold mb-2">Stock Details for {selectedSymbol}</h2>
          <p>Current Price: <strong>{price ?? "N/A"}</strong></p>
          <p>Market Cap: <strong>{marketCap ?? "N/A"}</strong></p>
          <p><strong>24h Change:</strong>
            <span className={change24h >= 0 ? 'text-green-600' : 'text-red-600'}>
              {change24h ?? "0"}%
            </span>
          </p>
        </div>
      );
    };

    const renderStockNews = () => {
      if (isLoadingStockNews) {
        return <div>Loading News for {selectedSymbol}</div>;
      }
    
      if (errorStockDetails) {
        return (
          <div>
            <h2>Error Loading News for {selectedSymbol}</h2>
          </div>
        );
      }

      if(stockNews === null) {
        return (<></>);
      }
      return (
        <div className="p-4 bg-gray-100 rounded shadow">
          <h2 className="font-bold mb-4">Related News</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            {stockNews.data?.map((item, index) => (
              <li key={index}>
                <a href={item[1]} className={item[2] === 1? "hover:underline text-green-600" :  "hover:underline text-red-600"}>
                  {item[0]}
                </a>
                <span className={item[2] === 1 ? "text-green-600" : "text-red-600"}>
                  {item[2] === 1 ? "📈" : "📉"}
                </span>

                {/* Optionally show prediction and confidence */}
                {/* <div className="text-xs text-gray-500">Sentiment: {item.prediction} ({item.confidence}%)</div> */}
              </li>
            ))}
          </ul>
        </div>
      )
    }

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
          <h1 className="text-2xl font-bold text-center mb-6">TradeX</h1>
    
          {/* Symbol Search */}
          <form onSubmit={handleSearchSubmit(searchHandler)}> 
            <div className="mb-6">
              <label htmlFor="symbol" className="block font-bold mb-2">Search for Symbol</label>
              <div className="flex space-x-2">
                <input 
                  id="symbol" 
                  className="w-full p-2 border rounded bg-black text-white" 
                  placeholder="Enter Symbol"
                  {...registerSearch("searchSymbol", {required: "Enter Symbol "})}
                />
                {errorsSearch.searchSymbol && <span className="text-sm text-red-600">{errorsSearch.searchSymbol.message}</span>}
                <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">Get Details</button>
              </div>
            </div>
          </form>
    
          {/* Stock Details */}
          {renderStockDetails()}
    
          {/* Test Strategy OR Back-testing */}
          <form onSubmit={handleStrategySubmit(testStrategyHandler)}>
            <div className="p-4 bg-gray-100 rounded shadow mb-6">
              <h2 className="font-bold mb-2">Test Strategy</h2>
              <div className="my-4">
                <label className="block font-semibold mb-1">Symbol</label>
                <input 
                  type="text" 
                  id="strategy-symbol"
                  className="w-[50%] p-2 border rounded bg-white"
                  {...registerStrategy("strategySymbol", {required: "Enter Symbol"})}
                />
                {errorsStrategy.strategySymbol && <span className="text-sm text-red-600">{errorsStrategy.strategySymbol.message}</span>}
              </div>
              <div className="my-4 ">
                <label className="block font-semibold mb-1">Interval</label>
                <select 
                  className="w-[50%] p-2 border rounded bg-white" 
                  {...registerStrategy("strategyInterval", {required: "Select Interval"})}
                >
                  <option value={"day"}>day</option>
                  <option value={"week"}>week</option>
                  <option value={"month"}>month</option>
                </select>
                {errorsStrategy.strategyInterval && <span className="text-sm text-red-600">{errorsStrategy.strategyInterval.message}</span>}
              </div>
              <div className="my-4 ">
                <label className="block font-semibold mb-1">Strategy</label>
                <textarea
                id="strategy-text"
                className="w-full h-20 p-2 bg-white"
                {...registerStrategy("strategyText", {required: "Enter Strategy"})}
                ></textarea>
                {errorsStrategy.strategyText && <span className="text-sm text-red-600">{errorsStrategy.strategyText.message}</span>}
              </div>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded cursor-pointer" type="submit">Test Strategy</button>
            </div>
          </form>
          {/* Stock Recommendation */}
          <form onSubmit={handleRecommendationSubmit(recommendationHandler)}>
            <div className="p-4 bg-gray-100 rounded shadow mb-6">
              <h2 className="font-bold mb-2">Stock Recommendation</h2>
              <div className="my-4">
                <label className="block font-semibold mb-1">Symbol</label>
                <input 
                  type="text" 
                  id="recommendation-symbol"
                  className="w-[50%] p-2 border rounded bg-white"
                  {...registerRecommendation("recommendationSymbol", {required: "Enter Symbol"})}
                />
                {errorsRecommendation.recommendationSymbol && <span className="text-sm text-red-600">{errorsRecommendation.recommendationSymbol.message}</span>}
              </div>
              <div className="my-4 ">
                <label className="block font-semibold mb-1">Interval</label>
                <select 
                  className="w-[50%] p-2 border rounded bg-white" 
                  {...registerRecommendation("recommendationInterval", {required: "Select Interval"})}
                >
                  <option value={"1d"}>day</option>
                  <option value={"1wk"}>week</option>
                  <option value={"1mo"}>month</option>
                </select>
                {errorsRecommendation.recommendationInterval && <span className="text-sm text-red-600">{errorsRecommendation.recommendationInterval.message}</span>}
              </div>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded cursor-pointer" type="submit">Get Recommendation</button>
            </div>
          </form>
    
          {/* Related News Section */}
          {renderStockNews()}
          
        </div>
      );
}

export default Home;
