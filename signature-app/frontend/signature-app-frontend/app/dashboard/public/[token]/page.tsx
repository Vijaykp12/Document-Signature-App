"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getPublicDocumentPreview } from "../../../../lib/api";

const PublicPDFRenderer = dynamic(
    () => import("./components/PublicPDFRenderer"),
    {
        ssr: false,
    }
);

interface PublicPreviewData {
    document_id: number;
    filename: string;
    thumbnail: string | null;
    pdf_url: string;
    signer_email: string;
    expires_at: string;
}

export default function PublicDocumentPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const resolvedParams = use(params);
    const token = resolvedParams.token;
    const [preview, setPreview] = useState<PublicPreviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);

    useEffect(() => {
        const loadPreview = async () => {
            try {
                setLoading(true);
                setError(null);

                const result = await getPublicDocumentPreview(token);

                if (!result.success) {
                    setError(result.message);
                    return;
                }

                setPreview(result.data as PublicPreviewData);
            } catch (fetchError) {
                console.error(fetchError);
                setError("Unable to load the public document preview.");
            } finally {
                setLoading(false);
            }
        };

        void loadPreview();
    }, [token]);

    const handleLoadSuccess = ({ numPages: totalPages }: { numPages: number }) => {
        setNumPages(totalPages);
        setPageNumber(1);
    };

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center text-slate-300">
                Loading public document...
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-4 text-center">
                <p className="text-2xl font-semibold text-white">Public document unavailable</p>
                <p className="text-slate-400">{error}</p>
                <Link
                    href="/dashboard/documents"
                    className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                    Back to documents
                </Link>
            </div>
        );
    }

    if (!preview) {
        return null;
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-[28px] border border-cyan-500/10 bg-[#07111f] p-6 shadow-[0_24px_90px_rgba(8,145,178,0.12)]">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/60">
                    Shared document
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-white">
                    {preview.filename}
                </h2>
                <p className="mt-3 text-sm text-slate-400">
                    Signer email: {preview.signer_email}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                    Expires at: {new Date(preview.expires_at).toLocaleString()}
                </p>

                <div className="mt-6 p-6 rounded-[24px] border border-cyan-500/10 bg-[#020617]/50 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">📄</span>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-white truncate">{preview.filename}</h4>
                            <p className="text-xs text-slate-400">Public Document ready for review</p>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-cyan-900/20 text-xs text-slate-400 space-y-2">
                        <div className="flex justify-between">
                            <span>Recipient Email:</span>
                            <span className="font-mono text-cyan-300">{preview.signer_email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Expires At:</span>
                            <span className="text-white">{new Date(preview.expires_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex gap-3">
                    <Link
                        href="/dashboard/documents"
                        className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5"
                    >
                        Back to dashboard
                    </Link>
                </div>
            </section>

            <section className="rounded-[28px] border border-cyan-500/10 bg-[#030816] p-4 shadow-[0_24px_90px_rgba(8,145,178,0.12)]">
                <div className="flex items-center justify-between border-b border-white/8 px-2 pb-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/60">
                            PDF preview
                        </p>
                        <h3 className="mt-1 text-xl font-semibold text-white">
                            {preview.filename}
                        </h3>
                    </div>
                    <div className="text-right text-sm text-slate-400">
                        <p>Page {pageNumber} of {numPages || 1}</p>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-4">
                    <button
                        type="button"
                        disabled={pageNumber <= 1}
                        onClick={() => setPageNumber((current) => current - 1)}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Prev
                    </button>
                    <button
                        type="button"
                        disabled={pageNumber >= numPages}
                        onClick={() => setPageNumber((current) => current + 1)}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>

                <div className="mt-4 flex justify-center overflow-auto rounded-[22px] border border-white/8 bg-[#020617] p-4">
                    <PublicPDFRenderer
                        token={token}
                        pageNumber={pageNumber}
                        onLoadSuccess={handleLoadSuccess}
                    />
                </div>
            </section>
        </div>
    );
}
