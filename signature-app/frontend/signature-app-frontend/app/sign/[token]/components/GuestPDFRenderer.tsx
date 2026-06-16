"use client";

import React, { useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface GuestPDFRendererProps {
    token: string;
    pageNumber: number;
    onLoadSuccess: (data: { numPages: number }) => void;
    signature: { x: number; y: number; page: number } | null;
    setSignature: (sig: { x: number; y: number; page: number } | null) => void;
    signatureText: string;
    signatureFont: string;
    signatureColor: string;
}

export default function GuestPDFRenderer({
    token,
    pageNumber,
    onLoadSuccess,
    signature,
    setSignature,
    signatureText,
    signatureFont,
    signatureColor,
}: GuestPDFRendererProps) {
    const pdfRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handlePdfClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging.current) {
            isDragging.current = false;
            return;
        }
        if (!pdfRef.current) return;
        const rect = pdfRef.current.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        setSignature({ x, y, page: pageNumber });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        isDragging.current = true;
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging.current || !signature) return;
        if (!pdfRef.current) return;
        const rect = pdfRef.current.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        setSignature({
            x: Math.max(0, Math.min(1, x)),
            y: Math.max(0, Math.min(1, y)),
            page: pageNumber
        });
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    return (
        <Document
            file={`${BASE_URL}/documents/public-document/pdf/${token}`}
            onLoadSuccess={onLoadSuccess}
            loading={<p className="text-cyan-400">Loading PDF...</p>}
            error={<p className="text-red-400">Failed to load PDF</p>}
        >
            <div
                ref={pdfRef}
                className="relative inline-block border border-cyan-500/10 rounded-lg cursor-pointer"
                onClick={handlePdfClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                <Page
                    pageNumber={pageNumber}
                    width={560}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                />

                {signature && signature.page === pageNumber && (
                    <div
                        className="absolute cursor-move select-none p-2 border border-dashed border-cyan-500/30 rounded bg-cyan-950/15 backdrop-blur-sm"
                        style={{
                            left: `${signature.x * 100}%`,
                            top: `${signature.y * 100}%`,
                            transform: "translate(-50%, -50%)",
                            color: signatureColor,
                            fontFamily: signatureFont,
                            fontSize: "28px",
                            lineHeight: "1.2",
                            whiteSpace: "nowrap",
                        }}
                        onMouseDown={handleMouseDown}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {signatureText}
                    </div>
                )}
            </div>
        </Document>
    );
}
