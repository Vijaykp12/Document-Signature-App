"use client" 

import {useRouter} from "next/navigation"

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    return (
        <div>
            <header className="flex justify-between items-center p-4 bg-cyan-500">
                <h1 className="text-white text-xl font-bold">Document Signature App</h1>
                <div className = "space-x-4 mr-7">
                    <button className = "font-bold p-1 px-3 rounded-2xl hover:scale-x-110 hover:bg-black/70 hover:text-cyan-500" onClick={() => router.push("/login")}>Login</button>
                    <button className = "font-bold p-1 px-3 rounded-2xl hover:scale-x-110 hover:bg-black/70 hover:text-cyan-500" onClick={() => router.push("/register")}>Register</button>
                </div>
            </header>
            <main>
                {children}
            </main>
        </div>
    )
}