import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useForm } from "react-hook-form";
import AxiosInstance from "../AxiosInstance";
import { useNavigate } from "react-router-dom";

function Login() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showMessage, setShowMessage] = useState(false)
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm()

    const onSubmit = (data) => {
        console.log("form submitted", data);
        AxiosInstance.post(
            `login/`,
            {
                email: data.email,
                password: data.password,
            }
        )
        .then((response) => {
            console.log(response);
            localStorage.setItem('token', response.data.token)
            navigate(`/`)
        })
        .catch((error) => {
            console.error("error during login", error);
            setShowMessage(true)
        })
    }
    
    return (
        <div className="w-full h-screen flex flex-col justify-center items-center text-lg">
            {showMessage && <span className="w-3xl h-10 bg-red-600 text-white text-center text-lg items-center rounded-lg font-semibold">Login Failed, please try again</span>}
            <div className="flex flex-col justify-center items-center bg-gray-50 rounded-lg w-100 h-110 shadow-lg">

                <h2 className="font-semibold text-3xl mb-5">Login</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col justify-center items-center mt-5 mb-5">

                    <input
                     type="email"
                     className="w-full bg-white p-2 my-2 border-solid border-gray-700" 
                     placeholder="Email id" 
                     onChange={(e) => setEmail(e.target.value)} 
                     {...register("email", {required: "Enter email"})}
                    />
                    {errors.email && <span className="text-sm text-red-600">{errors.email.message}</span>}

                    <input
                     type="password" 
                     className="w-full bg-white p-2 my-2" 
                     placeholder="password" 
                     onChange={(e) => setPassword(e.target.value)} 
                     {...register("password", {required: "Enter password"})}
                    />
                    {errors.password && <span className="text-sm text-red-600">{errors.password.message}</span>}

                    <button
                     type="submit" 
                     className="py-2 px-4 mb-2 mt-4 bg-[#4CAF50] text-white rounded-lg shadow-md cursor-pointer hover:shadow-none"
                    >
                        Login
                    </button>



                </form>

                <div>
                    <NavLink to="/register" className="hover:underline hover:text-gray-700">No account yet? register!</NavLink>
                </div>

            </div>
        </div>
    );
}

export default Login;