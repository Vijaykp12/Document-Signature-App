"use client";

import { deleteDocument, downloadSignedDocument } from "../../../../../lib/api";
import type { DocumentRecord, PreviewDocument } from "../../types";

interface DropDownBarProps {
    document: DocumentRecord;
    onDelete: (id: number) => void;
    onPreview: (previewData: PreviewDocument) => void;
}

export default function DropDownBar({document, onDelete, onPreview}: DropDownBarProps) {
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
            await downloadSignedDocument(document.id);
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
                top-[350px]
                mt-2
                w-60
                bg-white
                rounded-xl
                shadow-2xl
                overflow-hidden
                z-50
                border
                border-gray-200
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
                    text-gray-700
                    hover:bg-gray-100
                    transition-colors
                "
            >
                👁️
                <span>Preview</span>
            </button>

            <div className="border-t border-gray-200" />

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
                    text-red-600
                    hover:bg-red-50
                    transition-colors
                "
            >
                🗑️
                <span>Delete</span>
            </button>

            <div className="border-t border-gray-200" />

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
                    text-red-600
                    hover:bg-red-50
                    transition-colors
                "
            >
                📥
                <span>Download</span>
            </button>
        </div>
    )
}