"use client";

import Link from "next/link";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#020617] text-white">
            <header className="sticky top-0 z-40 border-b border-cyan-500/10 bg-[#020617]/90 backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/60">
                            Dashboard
                        </p>
                        <h1 className="mt-1 text-xl font-semibold text-white">
                            Document Signature App
                        </h1>
                    </div>

                    <nav className="flex items-center gap-3 rounded-full border border-white/8 bg-white/5 p-1">
                        <Link
                            href="/dashboard/documents"
                            className="rounded-full px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-cyan-500 hover:text-slate-950"
                        >
                            Documents
                        </Link>
                        <Link
                            href="/dashboard/public"
                            className="rounded-full px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-cyan-500 hover:text-slate-950"
                        >
                            Public Preview
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-6">
                {children}
            </main>
        </div>
    );
}
