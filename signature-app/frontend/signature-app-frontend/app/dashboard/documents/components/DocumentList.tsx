"use client";

import { useState } from "react";
import DocumentCard from "./Cards/DocumentCard";

import type { DocumentRecord, PreviewDocument } from "../types";

interface DocumentListProps {
    documents: DocumentRecord[];
    onDelete: (id: number) => void;
    onPreview: (previewData: PreviewDocument) => void;
    onGeneratePublicLink: (document: DocumentRecord) => void;
}

export default function DocumentList({
    documents,
    onDelete,
    onPreview,
    onGeneratePublicLink,
}: DocumentListProps) {
    const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
    
    return (
        <div className="bg-[#04081D] rounded-xl p-6 h-full shadow-xl border border-cyan-900/30">

            <h2 className="text-2xl text-cyan-400 font-bold mb-4">
                My Documents
            </h2>

            <div className="grid grid-cols-4 gap-2">

                {documents.length === 0 ? (
                    // Keep the empty state explicit so the dashboard does not look broken when no documents exist.
                    <p>No documents found</p>
                ) : (
                    documents.map((doc) => (
                        <DocumentCard key={doc.id} document={doc} onDelete={onDelete} onPreview={onPreview} onGeneratePublicLink={onGeneratePublicLink} openDropdownId={openDropdownId} setOpenDropdownId={setOpenDropdownId} />
                    ))
                )}
            </div>
        </div>
    );
}