"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { getPublicDocumentPreview, publicSign, publicReject } from "../../../lib/api";
import Link from "next/link";

const GuestPDFRenderer = dynamic(
    () => import("./components/GuestPDFRenderer"),
    {
        ssr: false,
    }
);

interface PreviewData {
    document_id: number;
    filename: string;
    thumbnail: string | null;
    pdf_url: string;
    signer_email: string;
    expires_at: string;
    status: string;
    rejection_reason: string | null;
}

const FONTS = [
    { name: "Pacifico Cursive", value: "'Pacifico', cursive" },
    { name: "Great Vibes Signature", value: "'Great Vibes', cursive" },
    { name: "Dancing Script Handwriting", value: "'Dancing Script', cursive" },
    { name: "Alex Brush Calligraphy", value: "'Alex Brush', cursive" }
];

const COLORS = [
    { name: "Slate", value: "#0f172a" },
    { name: "Red", value: "#ef4444" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#10b981" }
];

export default function GuestSignPage({
    params,
}: {
    params: Promise<{ token: string }>;
}) {
    const resolvedParams = React.use(params);
    const token = resolvedParams.token;

    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [numPages, setNumPages] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);

    // Guest signature placement & options
    const [signature, setSignature] = useState<{ x: number; y: number; page: number } | null>(null);
    const [signatureText, setSignatureText] = useState("Guest Signer");
    const [signatureFont, setSignatureFont] = useState("'Pacifico', cursive");
    const [signatureColor, setSignatureColor] = useState("#0f172a");

    const [isSigning, setIsSigning] = useState(false);
    const [signedSuccess, setSignedSuccess] = useState(false);

    // Modal state for Set Signature Details
    const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
    const [styleTab, setStyleTab] = useState<"signature" | "initials">("signature");
    const [fullNameInput, setFullNameInput] = useState("");
    const [initialsInput, setInitialsInput] = useState("");
    const [selectedFont, setSelectedFont] = useState("'Pacifico', cursive");
    const [selectedColor, setSelectedColor] = useState("#0f172a");

    // Modal state for Rejection
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejecting, setIsRejecting] = useState(false);

    const submitRejection = async () => {
        const trimmedReason = rejectionReason.trim();
        if (!trimmedReason) {
            alert("Please enter a reason for rejecting the signature request.");
            return;
        }

        try {
            setIsRejecting(true);
            const res = await publicReject(token, trimmedReason);
            if (res.success) {
                setPreview(prev => prev ? { ...prev, status: "rejected", rejection_reason: trimmedReason } : null);
                setIsRejectModalOpen(false);
            } else {
                alert("Error rejecting request: " + res.message);
            }
        } catch (err) {
            console.error(err);
            alert("Network error occurred during rejection.");
        } finally {
            setIsRejecting(false);
        }
    };

    const handleApplyStyle = () => {
        if (styleTab === "signature") {
            const text = fullNameInput.trim() || "Guest Signer";
            setSignatureText(text);
        } else {
            const text = initialsInput.trim() || "GS";
            setSignatureText(text);
        }
        setSignatureFont(selectedFont);
        setSignatureColor(selectedColor);
        setIsStyleModalOpen(false);
    };

    useEffect(() => {
        const loadDocument = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await getPublicDocumentPreview(token);
                if (result.success) {
                    setPreview(result.data);
                } else {
                    setError(result.message);
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load document details.");
            } finally {
                setLoading(false);
            }
        };
        loadDocument();
    }, [token]);

    const handleLoadSuccess = ({ numPages: totalPages }: { numPages: number }) => {
        setNumPages(totalPages);
        setPageNumber(1);
    };

    const submitSignature = async () => {
        if (!signature) {
            alert("Please click on the document first to place your signature.");
            return;
        }
        try {
            setIsSigning(true);
            const res = await publicSign(token, {
                ...signature,
                text: signatureText,
                font: signatureFont,
                color: signatureColor
            });
            if (res.success) {
                setSignedSuccess(true);
            } else {
                alert("Error placing signature: " + res.message);
            }
        } catch (err) {
            console.error(err);
            alert("Network error occurred during signing.");
        } finally {
            setIsSigning(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center text-cyan-400">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-lg font-medium">Loading document details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#081122] border border-red-500/20 rounded-[28px] p-8 text-center space-y-6 shadow-2xl">
                    <div className="text-5xl">⚠️</div>
                    <h2 className="text-2xl font-bold text-white">Signing Link Inactive</h2>
                    <p className="text-slate-400 text-sm">{error}</p>
                    <div className="pt-2">
                        <Link
                            href="/"
                            className="inline-block rounded-full bg-cyan-500 hover:bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition-colors"
                        >
                            Return to Homepage
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (signedSuccess || preview?.status === "signed") {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#081122] border border-green-500/20 rounded-[28px] p-8 text-center space-y-6 shadow-2xl animate-fade-in">
                    <div className="text-6xl text-green-400 animate-bounce">✓</div>
                    <h2 className="text-3xl font-bold text-white">Document Signed!</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Your signature has been permanently captured and appended. The document owner has been notified.
                    </p>
                    <div className="pt-4 border-t border-cyan-900/20">
                        <p className="text-xs text-slate-500 font-mono">Token: {token}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (preview?.status === "rejected") {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#081122] border border-red-500/20 rounded-[28px] p-8 text-center space-y-6 shadow-2xl animate-fade-in">
                    <div className="text-6xl text-red-400 animate-pulse">❌</div>
                    <h2 className="text-3xl font-bold text-white">Request Rejected</h2>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        You have rejected this signature request.
                    </p>
                    {preview.rejection_reason && (
                        <div className="bg-[#020617]/50 rounded-2xl p-4 border border-red-950 text-left">
                            <p className="text-xs uppercase tracking-wider text-red-400 font-bold mb-1">Reason for Rejection</p>
                            <p className="text-sm text-slate-300 font-mono leading-relaxed">{preview.rejection_reason}</p>
                        </div>
                    )}
                    <div className="pt-4 border-t border-cyan-900/20">
                        <p className="text-xs text-slate-500 font-mono">Token: {token}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white flex flex-col">
            <header className="sticky top-0 z-40 border-b border-cyan-500/10 bg-[#020617]/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
                <div>
                    <span className="text-xs uppercase tracking-[0.35em] text-cyan-400/80 font-semibold">Signature Request</span>
                    <h1 className="text-lg font-bold text-white truncate max-w-xs sm:max-w-md mt-0.5">
                        {preview?.filename}
                    </h1>
                </div>
                <div className="hidden sm:block text-right">
                    <span className="text-xs text-slate-400">Request for</span>
                    <p className="text-sm font-medium text-cyan-300 font-mono">{preview?.signer_email}</p>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
                {/* Left controls panel */}
                <section className="bg-[#07111f] rounded-[28px] border border-cyan-500/10 p-6 flex flex-col justify-between shadow-lg">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Placement Guide</h2>
                            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                                Customize your signature style below, then scroll and click anywhere on the document page to position your signature mark. Drag to adjust.
                            </p>
                        </div>

                        {/* Signature Look Preview Selection */}
                        <div className="bg-[#020617]/70 rounded-2xl p-4 border border-cyan-500/20 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs uppercase tracking-wider text-cyan-400 font-bold">Signature Look</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFullNameInput(signatureText === "Guest Signer" ? "" : signatureText);
                                        setSelectedFont(signatureFont);
                                        setSelectedColor(signatureColor);
                                        setIsStyleModalOpen(true);
                                    }}
                                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                                >
                                    Customize
                                </button>
                            </div>
                            <div className="h-16 flex items-center justify-center border border-cyan-950 bg-slate-950 rounded-xl overflow-hidden p-2">
                                <span
                                    style={{
                                        fontFamily: signatureFont,
                                        color: signatureColor,
                                        fontSize: "26px",
                                    }}
                                    className="select-none text-center truncate w-full"
                                >
                                    {signatureText}
                                </span>
                            </div>
                        </div>

                        <div className="bg-[#020617]/50 rounded-2xl p-4 border border-cyan-950 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Pages</span>
                                <span className="text-white font-medium">{numPages}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Expires At</span>
                                <span className="text-white font-medium">
                                    {preview ? new Date(preview.expires_at).toLocaleDateString() : "-"}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-slate-400">Status</span>
                                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${signature ? 'bg-cyan-500/20 text-cyan-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                    {signature ? 'Position Set' : 'Awaiting Mark'}
                                </span>
                            </div>
                        </div>

                        {signature && (
                            <div className="bg-cyan-950/20 rounded-2xl p-4 border border-cyan-500/20 space-y-2">
                                <p className="text-xs uppercase tracking-wider text-cyan-400 font-bold">Signature Position</p>
                                <div className="grid grid-cols-3 gap-2 text-xs font-mono text-slate-300">
                                    <div>Page: {signature.page}</div>
                                    <div>X: {Math.round(signature.x * 100)}%</div>
                                    <div>Y: {Math.round(signature.y * 100)}%</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-cyan-900/20 flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={submitSignature}
                            disabled={!signature || isSigning}
                            className="w-full rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-4 text-center transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isSigning ? "Signing..." : "Finalize Signature"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsRejectModalOpen(true)}
                            disabled={isSigning}
                            className="w-full rounded-2xl border border-red-500/30 hover:border-red-500/50 bg-red-950/10 hover:bg-red-950/20 text-red-400 font-semibold py-3 text-center transition cursor-pointer"
                        >
                            Reject Request
                        </button>
                    </div>
                </section>

                {/* Right PDF view panel */}
                <section className="bg-[#030816] rounded-[28px] border border-cyan-500/10 p-4 flex flex-col items-center shadow-lg relative min-h-[500px]">
                    <div className="w-full flex items-center justify-between border-b border-cyan-900/20 pb-4 mb-4">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={pageNumber <= 1}
                                onClick={() => setPageNumber((p) => p - 1)}
                                className="px-3 py-1.5 rounded-lg border border-cyan-500/20 text-xs hover:bg-cyan-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                ← Prev
                            </button>
                            <span className="text-sm text-slate-300">
                                Page {pageNumber} of {numPages || 1}
                            </span>
                            <button
                                type="button"
                                disabled={pageNumber >= numPages}
                                onClick={() => setPageNumber((p) => p + 1)}
                                className="px-3 py-1.5 rounded-lg border border-cyan-500/20 text-xs hover:bg-cyan-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next →
                            </button>
                        </div>
                        <span className="text-xs text-slate-400 hidden sm:inline">Click page to place sign</span>
                    </div>

                    <div className="flex-1 flex justify-center items-center w-full overflow-auto p-2">
                        {preview && (
                            <GuestPDFRenderer
                                token={token}
                                pageNumber={pageNumber}
                                onLoadSuccess={handleLoadSuccess}
                                signature={signature}
                                setSignature={setSignature}
                                signatureText={signatureText}
                                signatureFont={signatureFont}
                                signatureColor={signatureColor}
                            />
                        )}
                    </div>
                </section>
            </main>

            {/* Custom Cursive Signature Setup Modal */}
            {isStyleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
                    <div className="max-w-2xl w-full bg-[#081122] border border-cyan-500/20 rounded-[28px] p-6 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-cyan-950 pb-4">
                            <h3 className="text-xl font-bold text-white">Set your signature details</h3>
                            <button
                                type="button"
                                onClick={() => setIsStyleModalOpen(false)}
                                className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-4 border-b border-cyan-950/80">
                            <button
                                type="button"
                                onClick={() => setStyleTab("signature")}
                                className={`pb-2 text-sm font-semibold transition cursor-pointer ${styleTab === "signature"
                                        ? "text-cyan-400 border-b-2 border-cyan-400"
                                        : "text-slate-400 hover:text-slate-300"
                                    }`}
                            >
                                ✍️ Signature
                            </button>
                            <button
                                type="button"
                                onClick={() => setStyleTab("initials")}
                                className={`pb-2 text-sm font-semibold transition cursor-pointer ${styleTab === "initials"
                                        ? "text-cyan-400 border-b-2 border-cyan-400"
                                        : "text-slate-400 hover:text-slate-300"
                                    }`}
                            >
                                🔤 Initials
                            </button>
                        </div>

                        {/* Inputs */}
                        <div className="grid grid-cols-[2fr_1fr] gap-4">
                            {styleTab === "signature" ? (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name:</label>
                                    <input
                                        type="text"
                                        value={fullNameInput}
                                        onChange={(e) => setFullNameInput(e.target.value)}
                                        placeholder="Your name"
                                        className="w-full rounded-xl border border-cyan-500/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-400"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Initials:</label>
                                    <input
                                        type="text"
                                        value={initialsInput}
                                        onChange={(e) => setInitialsInput(e.target.value)}
                                        placeholder="Your initials"
                                        className="w-full rounded-xl border border-cyan-500/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-400"
                                    />
                                </div>
                            )}

                            {/* Color Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Color:</label>
                                <div className="flex gap-2.5 pt-2">
                                    {COLORS.map((col) => (
                                        <button
                                            key={col.value}
                                            type="button"
                                            onClick={() => setSelectedColor(col.value)}
                                            style={{ backgroundColor: col.value }}
                                            className={`w-8 h-8 rounded-full border transition-transform cursor-pointer ${selectedColor === col.value
                                                    ? "scale-125 border-cyan-400 ring-2 ring-cyan-500/30"
                                                    : "border-transparent opacity-80 hover:opacity-100"
                                                }`}
                                            title={col.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Choose Style Cursive Choices Grid */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Choose Style:</label>
                            <div className="grid grid-cols-2 gap-3">
                                {FONTS.map((font) => {
                                    const previewText = styleTab === "signature"
                                        ? (fullNameInput.trim() || "Signature")
                                        : (initialsInput.trim() || "Initial");

                                    return (
                                        <button
                                            key={font.value}
                                            type="button"
                                            onClick={() => setSelectedFont(font.value)}
                                            className={`h-20 flex items-center justify-center p-3 rounded-2xl border transition text-center overflow-hidden relative cursor-pointer ${selectedFont === font.value
                                                    ? "bg-cyan-950/20 border-cyan-500/60"
                                                    : "bg-slate-950/40 border-cyan-950/50 hover:bg-slate-950/70"
                                                }`}
                                        >
                                            {selectedFont === font.value && (
                                                <div className="absolute top-2 left-2 w-3.5 h-3.5 rounded-full bg-cyan-400 flex items-center justify-center text-[8px] text-slate-950 font-bold">✓</div>
                                            )}
                                            <span
                                                style={{
                                                    fontFamily: font.value,
                                                    color: selectedColor,
                                                    fontSize: "24px"
                                                }}
                                                className="truncate w-full block"
                                            >
                                                {previewText}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsStyleModalOpen(false)}
                                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium hover:bg-white/5 transition text-slate-300 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleApplyStyle}
                                className="flex-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 py-3 text-sm font-semibold text-slate-950 transition cursor-pointer"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
                    <div className="max-w-md w-full bg-[#081122] border border-cyan-500/20 rounded-[28px] p-6 space-y-6 shadow-2xl">
                        <div>
                            <h3 className="text-xl font-bold text-white">Reject Signature Request</h3>
                            <p className="text-xs text-slate-400 mt-1">Please provide a reason for rejecting this signature request. This feedback will be shared with the document owner.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rejection Reason</label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter reason here (e.g. incorrect terms, signature field misplaced...)"
                                rows={4}
                                className="w-full rounded-2xl border border-cyan-500/10 bg-slate-950 p-4 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-red-500"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRejectModalOpen(false);
                                    setRejectionReason("");
                                }}
                                disabled={isRejecting}
                                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium hover:bg-white/5 transition text-slate-300 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitRejection}
                                disabled={isRejecting || !rejectionReason.trim()}
                                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 py-3 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isRejecting ? "Rejecting..." : "Confirm Reject"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
