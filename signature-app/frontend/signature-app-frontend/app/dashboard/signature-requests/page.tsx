"use client";

import { useEffect, useState } from "react";
import { getSigningLinks, deleteSigningLink, type SigningLinkRecord } from "../../../lib/api";

export default function SignatureRequestsPage() {
    const [requests, setRequests] = useState<SigningLinkRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const loadRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await getSigningLinks();
            if (result.success) {
                setRequests(result.data);
            } else {
                setError(result.message);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to retrieve signature requests.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const copyToClipboard = (token: string) => {
        const url = `${window.location.origin}/sign/${token}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopiedToken(token);
            setTimeout(() => setCopiedToken(null), 2000);
        }).catch(err => {
            console.error("Failed to copy url: ", err);
        });
    };

    const handleRevoke = async (linkId: number) => {
        if (!confirm("Are you sure you want to revoke this signing link? This will permanently delete the link and make it completely invalid for the recipient.")) {
            return;
        }

        try {
            const res = await deleteSigningLink(linkId);
            if (res.success) {
                setRequests((prev) => prev.filter((r) => r.id !== linkId));
            } else {
                alert("Failed to revoke signing link: " + res.message);
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred while revoking the signing link.");
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center text-cyan-400">
                <div className="text-center space-y-4">
                    <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-400 text-sm">Loading signature requests...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-[24px] border border-red-500/20 bg-red-500/5 p-8 text-center max-w-xl mx-auto my-12">
                <p className="text-red-400 font-semibold mb-2">Failed to load signature requests</p>
                <p className="text-slate-400 text-sm mb-6">{error}</p>
                <button
                    onClick={loadRequests}
                    className="px-5 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-sm cursor-pointer"
                >
                    Retry Loading
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <span className="text-xs uppercase tracking-[0.35em] text-cyan-400 font-bold">Signature Status Flow</span>
                <h1 className="text-3xl font-extrabold text-white mt-1">Signature Requests</h1>
                <p className="text-sm text-slate-400 mt-2">
                    Track the lifecycle of public signing links sent to clients. Check pending, signed, or rejected flows.
                </p>
            </div>

            <div className="rounded-[24px] border border-cyan-500/10 bg-[#07111f] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-cyan-900/30 bg-[#091526]/50 text-slate-300 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Document</th>
                                <th className="px-6 py-4">Recipient Email</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Details / Rejection Reason</th>
                                <th className="px-6 py-4">Expiration</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cyan-950/45 text-sm text-slate-200">
                            {requests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        No signature requests generated yet.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-cyan-950/20 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">
                                            {req.document_filename}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-cyan-400/80">
                                            {req.signer_email}
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.status === "signed" && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                                                    Signed
                                                </span>
                                            )}
                                            {req.status === "rejected" && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                                                    Rejected
                                                </span>
                                            )}
                                            {req.status === "pending" && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs truncate">
                                            {req.status === "rejected" ? (
                                                <span className="text-red-300/90 text-xs italic font-sans" title={req.rejection_reason || ""}>
                                                    Reason: {req.rejection_reason || "No reason specified"}
                                                </span>
                                            ) : req.status === "signed" ? (
                                                <span className="text-green-400/80 text-xs font-sans">
                                                    Completed successfully
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 text-xs font-sans">
                                                    Waiting for signer response...
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                                            {new Date(req.expires_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button
                                                onClick={() => copyToClipboard(req.token)}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                    copiedToken === req.token
                                                        ? "bg-green-500 text-slate-950"
                                                        : "bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/20"
                                                }`}
                                            >
                                                {copiedToken === req.token ? "Copied!" : "Copy Link"}
                                            </button>
                                            <button
                                                onClick={() => handleRevoke(req.id)}
                                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-400 border border-red-500/20 bg-red-950/10 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                                            >
                                                Revoke
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

