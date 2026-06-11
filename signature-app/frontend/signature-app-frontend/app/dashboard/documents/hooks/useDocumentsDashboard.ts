"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDocuments } from "../../../../lib/api";
import { getToken } from "../../../../lib/auth";
import type { DocumentRecord } from "../types";

export function useDocumentsDashboard() {
    const router = useRouter();
    const [documents, setDocuments] = useState<DocumentRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDocuments = useCallback(async () => {
        const result = await getDocuments();

        if (result.success) {
            setDocuments(result.data);
            return;
        }

        // Keep auth and refresh behavior in one place so the page stays mostly presentational.
        if (result.message.toLowerCase().includes("session expired") || result.message.toLowerCase().includes("invalid token")) {
            router.push("/login");
            return;
        }

        console.error("Failed to fetch documents:", result.message);
    }, [router]);

    useEffect(() => {
        const token = getToken();

        // Guard the dashboard once so the page does not repeat token checks on every render.
        if (!token) {
            router.push("/login");
            setLoading(false);
            return;
        }

        void fetchDocuments().finally(() => {
            setLoading(false);
        });
    }, [fetchDocuments, router]);

    const removeDocument = useCallback((id: number) => {
        setDocuments((currentDocuments) => currentDocuments.filter((document) => document.id !== id));
    }, []);

    return {
        documents,
        loading,
        fetchDocuments,
        removeDocument,
    };
}
