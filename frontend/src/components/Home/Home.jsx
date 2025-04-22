import React, { useEffect, useState } from "react";
// import AxiosInstance from "../AxiosInstance";


function Home() {

    // A Way to get data from api
    // const [data, setData] = useState({})

    // const getData = () => {
    //     AxiosInstance.get(`users/`).then((res) => {
    //         setData(res.data)
    //         console.log(res.data);
    //     })
    // }

    // useEffect(() =>{
    //     getData();
    // }, [])

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
          <h1 className="text-2xl font-bold text-center mb-6">TradeX</h1>
    
          {/* Symbol Search */}
          <div className="mb-6">
            <label htmlFor="symbol" className="block font-bold mb-2">Search for Symbol</label>
            <div className="flex space-x-2">
              <input id="symbol" className="w-full p-2 border rounded bg-black text-white" defaultValue="BTC-USD" />
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
    
          {/* Test Strategy */}
          <div className="p-4 bg-gray-100 rounded shadow mb-6">
            <h2 className="font-bold mb-2">Test Strategy</h2>
            {/* <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Side</label>
                <select className="w-full p-2 border rounded">
                  <option>Buy</option>
                  <option>Sell</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Quantity</label>
                <input type="number" className="w-full p-2 border rounded" defaultValue="0.1" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Stoploss (optional)</label>
                <input className="w-full p-2 border rounded" placeholder="Below current price" />
              </div>
              <div>
                <label className="block font-semibold mb-1">Takeprofit (optional)</label>
                <input className="w-full p-2 border rounded" placeholder="Above current price" />
              </div>
            </div> */}
            <textarea name="" id="" className="w-full h-20 bg-white"></textarea><br />
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Test Strategy</button>
          </div>
    
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
