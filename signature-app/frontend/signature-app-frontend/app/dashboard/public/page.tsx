"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PublicLandingPage() {
    const router = useRouter();
    const [token, setToken] = useState("");

    const handleOpenToken = () => {
        const trimmedToken = token.trim();

        if (!trimmedToken) {
            return;
        }

        router.push(`/dashboard/public/${trimmedToken}`);
    };

    return (
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
            <div className="w-full rounded-[28px] border border-cyan-500/10 bg-[#07111f] p-8 shadow-[0_24px_90px_rgba(8,145,178,0.12)]">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/60">
                    Public preview
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                    Open a shared document
                </h2>
                <p className="mt-3 text-sm text-slate-400">
                    Paste a signing token here to view the public PDF route.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <input
                        value={token}
                        onChange={(event) => setToken(event.target.value)}
                        placeholder="Enter token"
                        className="flex-1 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                    />
                    <button
                        type="button"
                        onClick={handleOpenToken}
                        className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                    >
                        Open public PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
