"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import UploadPanel from "./components/UploadPanel";
import DocumentDetails from "./components/DocumentDetails";
import DocumentList from "./components/DocumentList";
import { useDocumentsDashboard } from "./hooks/useDocumentsDashboard";
import type { PreviewDocument } from "./types";

const PDFPreview = dynamic(
    () => import("./components/PDFPreview"),
    {
        ssr: false,
    }
);



export default function Dashboard() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { documents, loading, fetchDocuments, removeDocument } = useDocumentsDashboard();
    const [previewDoc, setPreviewDoc] = useState<PreviewDocument | null>(null);

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="h-[calc(100vh-80px)] p-6 flex flex-col gap-6">

            <div className="grid grid-cols-[1fr_2fr] gap-6 min-h-[200px]">
                <UploadPanel
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                />

                <DocumentDetails
                    selectedFile={selectedFile}
                    fetchDocuments={fetchDocuments}
                    setSelectedFile={setSelectedFile}
                />

            </div>

            <div className="mt-60 mb-5">
                <DocumentList documents={documents} onDelete={removeDocument} onPreview={setPreviewDoc} />
            </div> 
            <PDFPreview
                previewDoc={previewDoc}
                closePreview={() => setPreviewDoc(null)}
            />
        </div>
    );
}