"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import UploadPanel from "./components/UploadPanel";
import DocumentDetails from "./components/DocumentDetails";
import DocumentList from "./components/DocumentList";
import PublicSignCard from "./components/Cards/PublicSignCard";
import { useDocumentsDashboard } from "./hooks/useDocumentsDashboard";
import { generatePublicLink } from "../../../lib/api";
import type { PreviewDocument } from "./types";
import type { DocumentRecord } from "./types";

const PDFPreview = dynamic(
    () => import("./components/PDFPreview"),
    {
        ssr: false,
    }
);



export default function Dashboard() {
    const router = useRouter();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { documents, loading, fetchDocuments, removeDocument } = useDocumentsDashboard();
    const [previewDoc, setPreviewDoc] = useState<PreviewDocument | null>(null);
    const [publicLinkDocument, setPublicLinkDocument] = useState<DocumentRecord | null>(null);

    const handleOpenPublicLink = (document: DocumentRecord) => {
        setPublicLinkDocument(document);
    };

    const handleGeneratePublicLink = async (payload: {
        signerEmail: string;
        expiresIn: number;
    }) => {
        if (!publicLinkDocument) {
            return;
        }

        const response = await generatePublicLink({
            doc_id: publicLinkDocument.id,
            signer_email: payload.signerEmail,
            expires: payload.expiresIn,
        });

        if (!response.success) {
            throw new Error(response.message);
        }

        const signingLink = response.data.signing_link as string;
        const token =
            response.data.token ||
            signingLink.split("/").filter(Boolean).at(-1);

        if (!token) {
            throw new Error("Signing token was not returned by the server.");
        }

        setPublicLinkDocument(null);
        router.push(`/dashboard/public/${token}`);
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="flex flex-col gap-6">

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

            <div className="mt-8 mb-5">
                <DocumentList documents={documents} onDelete={removeDocument} onPreview={setPreviewDoc} onGeneratePublicLink={handleOpenPublicLink} />
            </div>
            <PublicSignCard
                document={publicLinkDocument}
                isOpen={Boolean(publicLinkDocument)}
                onClose={() => setPublicLinkDocument(null)}
                onGenerate={handleGeneratePublicLink}
            />
            <PDFPreview
                previewDoc={previewDoc}
                closePreview={() => setPreviewDoc(null)}
            />
        </div>
    );
}