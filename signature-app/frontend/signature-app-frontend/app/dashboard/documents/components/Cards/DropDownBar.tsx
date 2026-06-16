"use client";

import { deleteDocument, downloadSignedDocument } from "../../../../../lib/api";
import type { DocumentRecord, PreviewDocument } from "../../types";

interface DropDownBarProps {
    document: DocumentRecord;
    onDelete: (id: number) => void;
    onPreview: (previewData: PreviewDocument) => void;
    onGeneratePublicLink: (document: DocumentRecord) => void;
}

export default function DropDownBar({
    document,
    onDelete,
    onPreview,
    onGeneratePublicLink,
}: DropDownBarProps) {
    const handleDelete = async () => {
        try{
            const response = await deleteDocument(document.id);

            if(response.success) {
                onDelete(document.id)
            } else {
                console.error("Failed to delete document:", response.message);
            }
        }
        catch(error){
            console.error("Network error while deleting document:", error);
        }
    }

    const handlePreview = () => {
        const previewData = {
            filepath: document.filepath,
            doc_id: document.id
        }
        onPreview(previewData);
    }

    const handleDownload = async () => {
        try {
            await downloadSignedDocument(document.id, document.filename);
        }
        catch(error) {
            console.error("Error downloading signed document:", error);
        }
    }

    return (
        <div
            className="
                absolute
                right-0
                top-[345px]
                mt-2
                w-60
                bg-[#0b132b]
                rounded-xl
                shadow-[0_10px_40px_rgba(6,182,212,0.15)]
                overflow-hidden
                z-50
                border
                border-cyan-500/20
            "
        >
            <button
                onClick={handlePreview}
                className="
                    w-full
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    text-sm
                    text-slate-200
                    hover:bg-cyan-950/40
                    hover:text-cyan-400
                    transition-all
                "
            >
                <span>👁️</span>
                <span>Preview</span>
            </button>

            <div className="border-t border-cyan-950/40" />

            <button
                onClick={handleDownload}
                className="
                    w-full
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    text-sm
                    text-slate-200
                    hover:bg-cyan-950/40
                    hover:text-cyan-400
                    transition-all
                "
            >
                <span>📥</span>
                <span>Download</span>
            </button>

            <div className="border-t border-cyan-950/40" />

            <button
                onClick={() => onGeneratePublicLink(document)}
                className="
                    w-full
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    text-sm
                    text-slate-200
                    hover:bg-cyan-950/40
                    hover:text-cyan-400
                    transition-all
                "
            >
                <span>🔗</span>
                <span>Generate Public Link</span>
            </button>

            <div className="border-t border-cyan-950/40" />

            <button
                onClick={handleDelete}
                className="
                    w-full
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    text-sm
                    text-red-400
                    hover:bg-red-950/30
                    hover:text-red-300
                    transition-all
                "
            >
                <span>🗑️</span>
                <span>Delete</span>
            </button>
        </div>
    )
}