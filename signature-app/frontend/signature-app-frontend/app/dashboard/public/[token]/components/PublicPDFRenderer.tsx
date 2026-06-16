"use client";

import React from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PublicPDFRendererProps {
    token: string;
    pageNumber: number;
    onLoadSuccess: (data: { numPages: number }) => void;
}

export default function PublicPDFRenderer({
    token,
    pageNumber,
    onLoadSuccess,
}: PublicPDFRendererProps) {
    return (
        <Document
            file={`${BASE_URL}/documents/public-document/pdf/${token}`}
            onLoadSuccess={onLoadSuccess}
            loading={<p className="text-cyan-300">Loading PDF...</p>}
            error={<p className="text-red-300">Failed to load PDF</p>}
        >
            <Page
                pageNumber={pageNumber}
                width={560}
                renderTextLayer={false}
                renderAnnotationLayer={false}
            />
        </Document>
    );
}
