import React from "react";
import { Routes, Route } from 'react-router-dom'
import StockChart from "./components/StockChart";
import Home from "./components/Home/Home";
import PaperTrading from "./components/PaperTrading";
import PageNotFound from "./components/PageNotFound/PageNotFound";
import Layout from "./Layout";
import Login from "./components/Login/Login";
import Register from "./components/Register/Register";
import ProtectedRoute from "./components/ProtectedRoutes";

function App() {
    return (
        <>
            <Routes>
                <Route element={<ProtectedRoute />} >
                    {/* All Protected Routes must go in here  */}
                    <Route path="/" element={<Layout  />}>
                        <Route path="" element={<Home />} />
                        <Route  path="stockchart/" element={<StockChart />} />
                        <Route  path="papertrading/" element={<PaperTrading />} />
                    </Route>
                </Route>
                <Route path="register/" element={<Register />} />
                <Route path="login/" element={<Login />} />
                <Route path="*" element={<PageNotFound />} />
            </Routes>
        </>
    );
}

export default App;
