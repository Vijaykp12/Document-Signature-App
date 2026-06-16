"use client";

import { useEffect, useState } from "react";
import { getAuditLogs, type ApiAuditLog } from "../../../lib/api";

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<ApiAuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await getAuditLogs();
            if (result.success) {
                setLogs(result.data);
            } else {
                setError(result.message);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to retrieve audit log data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center text-cyan-400">
                <div className="text-center space-y-4">
                    <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-slate-400 text-sm">Loading audit entries...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-[24px] border border-red-500/20 bg-red-500/5 p-8 text-center max-w-xl mx-auto my-12">
                <p className="text-red-400 font-semibold mb-2">Failed to load logs</p>
                <p className="text-slate-400 text-sm mb-6">{error}</p>
                <button
                    onClick={loadLogs}
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
                <span className="text-xs uppercase tracking-[0.35em] text-cyan-400 font-bold">Trace logs</span>
                <h1 className="text-3xl font-extrabold text-white mt-1">Audit History</h1>
                <p className="text-sm text-slate-400 mt-2">
                    Review trace records for file uploads, deletions, signature creation, and link access.
                </p>
            </div>

            <div className="rounded-[24px] border border-cyan-500/10 bg-[#07111f] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-cyan-900/30 bg-[#091526]/50 text-slate-300 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Action</th>
                                <th className="px-6 py-4">Document ID</th>
                                <th className="px-6 py-4">Client IP</th>
                                <th className="px-6 py-4 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cyan-950/45 text-sm text-slate-200">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        No audit log history entries recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log, index) => (
                                    <tr key={index} className="hover:bg-cyan-950/20 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">
                                            {log.action}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-cyan-400/80">
                                            {log.document_id ? `#${log.document_id}` : "-"}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-400">
                                            {log.ip_address || "unknown"}
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-400 font-mono text-xs">
                                            {new Date(log.timestamp).toLocaleString()}
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
