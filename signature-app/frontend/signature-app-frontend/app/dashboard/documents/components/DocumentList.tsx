"use client";

import DocumentCard from "./Cards/DocumentCard";

interface Document {
    id: number;
    filename: string;
    filepath: string;
    thumbnail: string | null;
}

interface PreviewProps {
    filepath: string;
    doc_id: number;
}

interface DocumentListProps {
    documents: Document[];
    onDelete: (id: number) => void;
    onPreview: (previewData: PreviewProps) => void;
}

export default function DocumentList({
    documents,
    onDelete,
    onPreview
}: DocumentListProps) {

    return (
        <div className="bg-[#04081D] rounded-xl p-6 h-full shadow-xl border border-cyan-900/30">

            <h2 className="text-2xl text-cyan-400 font-bold mb-4">
                My Documents
            </h2>

            <div className="grid grid-cols-5 gap-1">

                {documents.length === 0 ? (
                    <p>No documents found</p>
                ) : (
                    documents.map((doc) => (
                        <DocumentCard key={doc.id} document={doc} onDelete={onDelete} onPreview={onPreview} />
                    ))
                )}
            </div>
        </div>
    );
}