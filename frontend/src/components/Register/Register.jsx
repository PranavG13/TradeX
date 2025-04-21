import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import AxiosInstance from "../AxiosInstance";


function Register() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const schema = yup
    .object({
        email: yup.string().email('Field expects an email address').required("Enter Email"),
        password: yup.string()
                    .required("Enter Password")
                    .min(8, "Password must be at least 8 characters long")
                    .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
                    .matches(/[a-z]/, "Password must contain at least one lowercase letter")
                    .matches(/[0-9]/, "password must contain at least one number")
                    .matches(/[!@#$%^&*(),.?':;{}|<>]/, "password must contain at least one special character"),
        confirm_password: yup.string().required("Confirm Password")
                        .oneOf( [yup.ref("password"), null] , "passwords must match")
    })

    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: {errors},
    } = useForm({
        resolver: yupResolver(schema)
    })

    const onSubmit = (data) => {
        console.log("form submitted", data);
        AxiosInstance.post(
            `register/`,
            {
                email: data.email,
                password: data.password,
            }
        )
        .then(() => {
            navigate(`/login`)
        })
    }

    return (
        <div className="w-full h-screen flex justify-center items-center text-lg">
            <div className="flex flex-col justify-center items-center bg-gray-50 rounded-lg w-100 h-110 shadow-lg">

                <h2 className="font-semibold text-3xl mb-5">Register</h2>

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

                    <input
                     type="password"
                     className="w-full bg-white p-2 my-2" 
                     placeholder="confirm password" 
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     {...register("confirm_password", {required: "Confirm the password"})}
                    />
                    {errors.confirm_password && <span className="text-sm text-red-600">{errors.confirm_password.message}</span>}

                    <button type="submit" className="py-2 px-4 mb-2 mt-4 bg-[#4CAF50] text-white rounded-lg shadow-md cursor-pointer hover:shadow-none">Register</button>

                </form>
                <div>
                    <NavLink to="/login" className="hover:underline hover:text-gray-700">already have an account? Login!</NavLink>
                </div>
            </div>
        </div>
    );
}

export default Register;