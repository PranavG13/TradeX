import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { createBrowserRouter, Route, createRoutesFromElements, RouterProvider } from "react-router-dom";
import StockChart from "./components/StockChart";
import Home from "./components/Home/Home";
import PageNotFound from "./components/PageNotFound/PageNotFound";
import Layout from "./Layout";

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path="/" element={<Layout />}>
            <Route path="" element={<Home />} />
            <Route  path="stockchart/" element={<StockChart />} />
            <Route path="*" element={<PageNotFound />} />
        </Route>
    )
)

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <RouterProvider router={router} />
);
