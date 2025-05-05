import React from "react";
import { NavLink } from "react-router-dom";
import AxiosInstance from "../AxiosInstance";
import { useNavigate } from "react-router-dom";

function Header() {
    const navigate = useNavigate()

    const logoutUser = () => {
        AxiosInstance.post(`logout/`,{})
        .then(() => {
            localStorage.removeItem("token")
            navigate("/login")
        })
    }

    return (
        <header className="shadow sticky z-50 top-0 ">
            <nav className="bg-white border-gray-200 p-4 flex flex-row justify-between">
                    <div className="px-2"><h2 className="text-lg font-bold font-sans cursor-pointer"><NavLink to="/">TradeX</NavLink></h2></div>
                <div className="flex flex-wrap justify-center items-center mx-auto max-w-screen-xl">
                    <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
                        <li>
                            <NavLink 
                                to="/" 
                                className={({isActive}) =>
                                    `block py-2 pr-4 pl-3 duration-200 ${isActive ? "text-orange-700" : "text-gray-700"} border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 hover:text-orange-700 lg:p-0`
                                }
                            >
                                Home
                            </NavLink>
                        </li>
                        <li>
                            <NavLink 
                                to="/papertrading" 
                                className={({isActive}) =>
                                    `block py-2 pr-4 pl-3 duration-200 ${isActive ? "text-orange-700" : "text-gray-700"} border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 hover:text-orange-700 lg:p-0`
                                }
                            >
                                Trades
                            </NavLink>
                        </li>
                        <li>
                            <NavLink 
                                to="/stockchart/BTC-USD" 
                                className={({isActive}) =>
                                    `block py-2 pr-4 pl-3 duration-200 ${isActive ? "text-orange-700" : "text-gray-700"} border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 hover:text-orange-700 lg:p-0`
                                }
                            >
                                Charts
                            </NavLink>
                        </li>
                        <li>
                            <button onClick={logoutUser} className="block py-2 text-gray-700 pr-4 pl-3 cursor-pointer duration-200 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 hover:text-orange-700 lg:p-0">
                                Logout
                            </button>
                        </li>
                    </ul>
                </div>
            </nav>
        </header>
    );
}

export default Header;