import React, { useEffect, useState } from "react";
import AxiosInstance from "../AxiosInstance";
import { useForm } from "react-hook-form";


function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [strategyText, setStrategyText] = useState('')
  const [strategySymbol, setStrategySymbol] = useState('')
  const [strategyInterval, setStrategyInterval] = useState('daily')
    
  const {
          register,
          handleSubmit,
          formState: {errors},
      } = useForm()

    // a handler to handle back testing submission
    const testStrategyHandler = (data) => {
      console.log("form submitted", data);
      // data = Object { strategySymbol: "BTC-USD", strategyInterval: "day", strategyText: "Text123" }

      // posting data to api
      // AxiosInstance.post(
      //     `API-URL-FOR-BACK-TESTING/`,
      //     {
      //         data
      //     }
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

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
          <h1 className="text-2xl font-bold text-center mb-6">TradeX</h1>
    
          {/* Symbol Search */}
          <div className="mb-6">
            <label htmlFor="symbol" className="block font-bold mb-2">Search for Symbol</label>
            <div className="flex space-x-2">
              <input 
                id="symbol" 
                className="w-full p-2 border rounded bg-black text-white" 
                placeholder="Enter Symbol"
                onChange={(e) => setSelectedSymbol(e.target.value)} 
                value={selectedSymbol}
              />
              <button className="bg-blue-600 text-white px-4 py-2 rounded">Get Details</button>
            </div>
          </div>
    
          {/* Stock Details */}
          <div className="p-4 bg-gray-100 rounded shadow mb-6">
            <h2 className="font-bold mb-2">Stock Details for BTC-USD</h2>
            <p>Current Price: <strong>$88674.62</strong></p>
            <p>Market Cap: <strong>1760604979200</strong></p>
            <p>24h Change: <span className="text-green-600">1.32%</span></p>
          </div>
    
          {/* Test Strategy OR Back-testing */}
          <form onSubmit={handleSubmit(testStrategyHandler)}>
            <div className="p-4 bg-gray-100 rounded shadow mb-6">
              <h2 className="font-bold mb-2">Test Strategy</h2>
              <div className="my-4">
                <label className="block font-semibold mb-1">Symbol</label>
                <input 
                  type="text" 
                  id="strategy-symbol"
                  className="w-[50%] p-2 border rounded bg-white"
                  {...register("strategySymbol", {required: "Enter Symbol"})}
                />
                {errors.strategySymbol && <span className="text-sm text-red-600">{errors.strategySymbol.message}</span>}
              </div>
              <div className="my-4 ">
                <label className="block font-semibold mb-1">Interval</label>
                <select 
                  className="w-[50%] p-2 border rounded bg-white" 
                  {...register("strategyInterval", {required: "Select Interval"})}
                >
                  <option value={"day"}>day</option>
                  <option value={"week"}>week</option>
                  <option value={"month"}>month</option>
                </select>
                {errors.strategyInterval && <span className="text-sm text-red-600">{errors.strategyInterval.message}</span>}
              </div>
              <div className="my-4 ">
                <label className="block font-semibold mb-1">Strategy</label>
                <textarea
                id="strategy-text"
                className="w-full h-20 p-2 bg-white"
                {...register("strategyText", {required: "Enter Strategy"})}
                ></textarea>
                {errors.strategyText && <span className="text-sm text-red-600">{errors.strategyText.message}</span>}
              </div>
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded" type="submit">Test Strategy</button>
            </div>
          </form>
    
          {/* Related News Section */}
          <div className="p-4 bg-gray-100 rounded shadow">
            <h2 className="font-bold mb-4">Related News</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
              <li><a href="#" className="hover:underline text-blue-600">Bitcoin hits new all-time high amid market optimism</a></li>
              <li><a href="#" className="hover:underline text-blue-600">Tesla stock rises after strong quarterly earnings</a></li>
              <li><a href="#" className="hover:underline text-blue-600">Analysts predict bullish crypto trend through Q3</a></li>
            </ul>
          </div>
        </div>
      );
}

export default Home;
