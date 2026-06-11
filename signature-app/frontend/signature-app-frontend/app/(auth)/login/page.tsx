"use client";

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {loginUser} from '../../../lib/api';

export default function LoginPage() {
    const router = useRouter();
    
    const [errorState, setErrorState] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();

        try { 
            setLoading(true);
            setErrorState(null);

            const response = await loginUser(email, password);

            if (response.success) {
                const token = response.data.access_token;

                // Only navigate after the backend returns a valid session token.
                localStorage.setItem("token", token);
                router.push("/dashboard/documents");
            } else {
                setErrorState(response.message);
            }
        }
        catch(error) {
            console.error(error);
            setErrorState("Login Failed");
        }
        finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className = "bg-black min-h-screen flex items-center justify-center">
                <form onSubmit = {handleSubmit} className = "bg-cyan-500/20 p-6 border-t-10 rounded-t-2xl border-cyan-500 shadow-lg w-full max-w-sm">
                    <h1 className = "text-2xl font-bold mb-4 text-cyan-500">Login</h1>

                    {/* Keep login failures visible in the form so users can recover without guessing. */}
                    {errorState ? (
                        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                            {errorState}
                        </p>
                    ) : null}

                    <input name = "email"
                        type = "email"
                        placeholder = "Email"
                        value = {email}
                        onChange = {(e) => setEmail(e.target.value)}
                        className = "w-full p-2 my-6 border-3 text-cyan-500 rounded hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                        {loading ? "Logging in..." : "Login"}
                    </button>

                </form> 
            </div>
        </>
    )
}