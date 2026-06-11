"use client" 

import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <div>
            <header className="flex justify-between items-center p-4 bg-cyan-500">
                <h1 className="text-white text-xl font-bold">Document Signature App</h1>
                <div className = "space-x-4 mr-7">
                    <Link href="/login">
                        <button className = "font-bold p-1 px-3 rounded-2xl hover:scale-x-110 hover:-translate-y-1 hover:bg-black hover:text-cyan-500">Login</button>
                    </Link>
                    <Link href="/register">
                        <button className = "font-bold p-1 px-3 rounded-2xl hover:scale-x-110 hover:-translate-y-1 hover:bg-black hover:text-cyan-500">Register</button>
                    </Link>
                </div>
            </header>
            <main>
                {children}
            </main>
        </div>
    )
}