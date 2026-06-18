"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { DocumentRecord } from "../../types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

interface PublicSignCardProps {
    document: DocumentRecord | null;
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (payload: {
        signerEmail: string;
        expiresIn: number;
    }) => Promise<void>;
}

export default function PublicSignCard({
    document,
    isOpen,
    onClose,
    onGenerate,
}: PublicSignCardProps) {
    const [signerEmail, setSignerEmail] = useState("");
    const [expiresIn, setExpiresIn] = useState("7");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setSignerEmail("");
        setExpiresIn("7");
        setError(null);
        setLoading(false);
    }, [isOpen, document?.id]);

    if (!isOpen || !document) {
        return null;
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const parsedExpires = Number(expiresIn);

        if (!signerEmail.trim()) {
            setError("Signer email is required.");
            return;
        }

        if (!Number.isFinite(parsedExpires) || parsedExpires <= 0) {
            setError("Expires in must be a positive number of days.");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await onGenerate({
                signerEmail: signerEmail.trim(),
                expiresIn: parsedExpires,
            });
        } catch (submissionError) {
            console.error(submissionError);
            setError("Unable to generate the signing link.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
            <div
                className="w-full max-w-6xl overflow-hidden rounded-[28px] border border-cyan-500/20 bg-[#030816] shadow-[0_30px_120px_rgba(2,132,199,0.25)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-cyan-500/10 px-6 py-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">
                            Generate signing link
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold text-white">
                            {document.filename}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5"
                    >
                        Close
                    </button>
                </div>

                <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="border-b border-cyan-500/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:border-b-0 lg:border-r">
                        <div className="flex h-full min-h-[460px] flex-col justify-between rounded-[24px] border border-white/8 bg-white/3 p-4">
                            <div className="mb-4 flex items-center justify-between text-sm text-slate-300">
                                <span>Document preview</span>
                                <span>ID {document.id}</span>
                            </div>

                            <div className="flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/8 bg-[#020617]">
                                {document.thumbnail ? (
                                    <img
                                        src={`${BASE_URL}${document.thumbnail}`}
                                        alt={document.filename}
                                        className="max-h-[420px] w-full object-contain"
                                    />
                                ) : (
                                    <div className="space-y-2 p-8 text-center text-slate-400">
                                        <p className="text-lg font-medium text-slate-200">
                                            No thumbnail available
                                        </p>
                                        <p>
                                            The link can still be generated for this document.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
                                <span>{document.filename}</span>
                                <span>Ready to send</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 lg:p-8">
                        <div className="space-y-5 rounded-[24px] border border-cyan-500/10 bg-[#081122] p-6">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">
                                    Recipient details
                                </p>
                                <h3 className="mt-2 text-xl font-semibold text-white">
                                    Configure the public link
                                </h3>
                                <p className="mt-2 text-sm text-slate-400">
                                    Enter the signer email and how long the link should stay valid.
                                </p>
                            </div>

                            {error ? (
                                <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                    {error}
                                </p>
                            ) : null}

                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-slate-200">
                                    Signer email
                                </span>
                                <input
                                    type="email"
                                    value={signerEmail}
                                    onChange={(event) => setSignerEmail(event.target.value)}
                                    placeholder="signer@example.com"
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400"
                                />
                            </label>

                            <label className="block space-y-2">
                                <span className="text-sm font-medium text-slate-200">
                                    Expires in
                                </span>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        value={expiresIn}
                                        onChange={(event) => setExpiresIn(event.target.value)}
                                        className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 pr-20 text-white outline-none transition focus:border-cyan-400"
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-slate-500">
                                        days
                                    </span>
                                </div>
                            </label>

                            <div className="flex flex-wrap gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? "Generating..." : "Generate"}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
