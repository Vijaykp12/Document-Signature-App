"use client";

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {registerUser} from '../../../lib/api';

export default function RegisterPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();

        try { 
            setLoading(true);

            const data: any = registerUser(name, email, password);

            localStorage.setItem("token", data.access_token);
            router.push("/dashboard");
        }
        catch(error) {
            console.error(error);
            alert("Registration Failed");
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className = "bg-black min-h-screen flex items-center justify-center">
                <form onSubmit = {handleSubmit} className = "bg-cyan-500/20 p-6 border-t-5 rounded-lg border-cyan-500 shadow-lg w-full max-w-sm">
                    <h1 className = "text-2xl font-bold mb-4 text-cyan-500">Sign Up</h1>

                    <input name = "name"
                        type = "text"
                        placeholder = "Name"
                        value = {name}
                        onChange = {(e) => setName(e.target.value)}
                        className = "w-full p-2 my-6 border-3 text-cyan-500 rounded hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />

                    <input name = "email"
                        type = "email"
                        placeholder = "Email"
                        value = {email}
                        onChange = {(e) => setEmail(e.target.value)}
                        className = "w-full p-2 mb-6 border-3 text-cyan-500 rounded hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />

                    <input name = "password"
                        type = "password"
                        placeholder = "Password"
                        value = {password}
                        onChange = {(e) => setPassword(e.target.value)}
                        className = "w-full p-2 mb-10 border-3 text-cyan-500 rounded hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />

                    <button 
                        type = "submit" 
                        disabled = {loading} 
                        className = "block mx-auto w-[150px] bg-cyan-500 text-white p-2 rounded-3xl hover:bg-blue-600 disabled:bg-gray-400"
                    >
                        {loading ? "Signing up..." : "Sign Up"}
                    </button>

                </form> 
            </div>
        </>
    )
}