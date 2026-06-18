"use client";

import { useRef, useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { createSignature, deleteSignature, generateSignedDocument, mySignatures, updateSignature } from "../../../../lib/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

interface PreviewProps {
    filepath: string;
    doc_id: number;
}

interface Props {
    previewDoc: PreviewProps | null;
    closePreview: () => void;
}

interface SignatureState {
    id: number;
    document_id: number;
    x: number;
    y: number;
    page: number;
    text: string | null;
    font: string | null;
    color: string | null;
}

const FONTS = [
    { name: "Pacifico Cursive", value: "'Pacifico', cursive" },
    { name: "Great Vibes Signature", value: "'Great Vibes', cursive" },
    { name: "Dancing Script Handwriting", value: "'Dancing Script', cursive" },
    { name: "Alex Brush Calligraphy", value: "'Alex Brush', cursive" }
];

const COLORS = [
    { name: "Slate", value: "#0f172a" },
    { name: "Red", value: "#ef4444" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#10b981" }
];

export default function PDFPreview({
    previewDoc,
    closePreview,
}: Props) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState(1);
    const pdfRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [signatures, setSignatures] = useState<SignatureState[]>([]);
    const [currentSign, setCurrentSign] = useState<SignatureState[]>([]);
    
    // Custom signature look configurations
    const [signatureText, setSignatureText] = useState("Document Owner");
    const [signatureFont, setSignatureFont] = useState("'Pacifico', cursive");
    const [signatureColor, setSignatureColor] = useState("#ef4444");

    // Modal state for Set Signature Details
    const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
    const [styleTab, setStyleTab] = useState<"signature" | "initials">("signature");
    const [fullNameInput, setFullNameInput] = useState("");
    const [initialsInput, setInitialsInput] = useState("");
    const [selectedFont, setSelectedFont] = useState("'Pacifico', cursive");
    const [selectedColor, setSelectedColor] = useState("#ef4444");

    const signaturesRef = useRef(signatures);
    const currentSignRef = useRef(currentSign);

    useEffect(() => {
        const fetchSignatures = async () => {
            if (!previewDoc) return;
            const signs = await mySignatures();

            if (!signs || !signs.success) return;

            const signData = signs.data
                .filter((sig: any) => sig.document_id === previewDoc?.doc_id)
                .map((sig: any) => ({   
                    id: sig.id,
                    document_id: sig.document_id,
                    x: sig.x,
                    y: sig.y,
                    page: sig.page,
                    text: sig.text,
                    font: sig.font,
                    color: sig.color
                }));
            setSignatures(signData);
            setCurrentSign(signData);
        };
        fetchSignatures();
    }, [previewDoc?.doc_id]);

    useEffect(() => {
        signaturesRef.current = signatures;
    }, [signatures]);

    useEffect(() => {
        currentSignRef.current = currentSign;
    }, [currentSign]);

    const saveSessionSignatures = async () => {
        const createdSigns = signaturesRef.current.filter(
            (sig) => !currentSignRef.current.some((oldSig) => oldSig.id === sig.id)
        );

        const deletedSigns = currentSignRef.current.filter(
            (oldSig) => !signaturesRef.current.some((sig) => sig.id === oldSig.id)
        );

        const updatedSigns = signaturesRef.current.filter(sig => {
            if (sig.id < 0) return false;

            const oldSig = currentSignRef.current.find(s => s.id === sig.id);
            if (!oldSig) return false;

            return (
                oldSig.x !== sig.x ||
                oldSig.y !== sig.y ||
                oldSig.page !== sig.page ||
                oldSig.text !== sig.text ||
                oldSig.font !== sig.font ||
                oldSig.color !== sig.color
            );
        });

        const signData = createdSigns.map((sig: any) => ({   
            document_id: sig.document_id,
            x: sig.x,
            y: sig.y,
            page: sig.page,
            text: sig.text || null,
            font: sig.font || null,
            color: sig.color || null
        }));

        for (const data of signData) {
            await createSignature(data);
        }

        for (const sig of deletedSigns) {
            await deleteSignature(sig.id);
        }

        for (const sig of updatedSigns) {
            await updateSignature(sig.id, {
                x: sig.x,
                y: sig.y,
                page: sig.page,
                text: sig.text || null,
                font: sig.font || null,
                color: sig.color || null
            });
        }
        currentSignRef.current = [...signaturesRef.current];
        setCurrentSign([...signaturesRef.current]);
    };

    useEffect(() => {
        return () => {
            saveSessionSignatures();
        };
    }, []);

    if (!previewDoc) return null;

    const handleGenerateSignedDocument = async () => {
        try {
            await saveSessionSignatures();
            const response = await generateSignedDocument(previewDoc.doc_id);

            if (response.success) {
                alert("Signed document generated successfully");
            } else {
                alert("Failed to generate signed document: " + response.message);
            }
        } catch (error) {
            console.error(error);
            alert("Network error while generating signed document");
        }
    };

    const handleApplyStyle = () => {
        let text = "Document Owner";
        if (styleTab === "signature") {
            text = fullNameInput.trim() || "Document Owner";
        } else {
            text = initialsInput.trim() || "DO";
        }
        setSignatureText(text);
        setSignatureFont(selectedFont);
        setSignatureColor(selectedColor);
        setIsStyleModalOpen(false);
    };

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPageNumber(1);
    };

    const handleMouseDown = (id: number) => {
        setDraggingId(id);
        isDragging.current = true;
    };

    const handleMouseUp = () => {
        setDraggingId(null);
        isDragging.current = false;
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (draggingId === null) return;
        if (!pdfRef.current) return;
        const rect = pdfRef.current.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        setSignatures((prev) => prev.map((sig) => sig.id === draggingId ? { ...sig, x, y } : sig));
    };

    const handlePdfClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (isDragging.current) {
            isDragging.current = false;
            return;
        }
        const rect = pdfRef.current?.getBoundingClientRect();
        const x = (event.clientX - rect!.left) / rect!.width;
        const y = (event.clientY - rect!.top) / rect!.height;

        setSignatures((prev) => [
            ...prev,
            {
                id: -Date.now(),
                document_id: previewDoc?.doc_id || 0,
                x,
                y,
                page: pageNumber,
                text: signatureText,
                font: signatureFont,
                color: signatureColor
            }
        ]);
    };

    const handleDoubleClick = (id: number) => {
        setSignatures((prev) => prev.filter((sig) => sig.id !== id));
    };

    return (
        <div className="fixed top-0 right-0 h-screen w-[45vw] min-w-[650px] max-w-[900px] bg-[#020617] border-l border-cyan-900/30 shadow-2xl z-50 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-[#020617] p-4 flex justify-between items-center border-b border-cyan-900/30 z-10">
                <h2 className="text-cyan-400 text-xl font-bold">PDF Preview & Place Signature</h2>
                <button onClick={closePreview} className="text-red-400 hover:text-red-500 font-bold cursor-pointer">✕</button>
            </div>

            {/* Customization & Page Controls Bar */}
            <div className="p-4 bg-[#07111f]/60 border-b border-cyan-900/20 grid grid-cols-2 gap-4 items-center">
                {/* Signature Preview Look */}
                <div className="flex items-center gap-3 bg-[#020617] p-2.5 rounded-xl border border-cyan-900/30 justify-between">
                    <div className="min-w-0">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 block font-bold">Mark Appearance</span>
                        <span
                            style={{ fontFamily: signatureFont, color: signatureColor }}
                            className="text-lg truncate block font-normal select-none"
                        >
                            {signatureText}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setFullNameInput(signatureText === "Document Owner" ? "" : signatureText);
                            setSelectedFont(signatureFont);
                            setSelectedColor(signatureColor);
                            setIsStyleModalOpen(true);
                        }}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 px-2.5 py-1.5 rounded-lg bg-cyan-950/20 cursor-pointer"
                    >
                        Customize
                    </button>
                </div>

                {/* Page Controls */}
                <div className="flex items-center justify-end gap-3">
                    <span className="text-slate-400 text-sm">Page {pageNumber} of {numPages || 1}</span>
                    <button
                        type="button"
                        onClick={saveSessionSignatures}
                        className="text-xs font-bold text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 px-2.5 py-1.5 rounded-lg bg-cyan-950/25 cursor-pointer"
                    >
                        Save Draft
                    </button>
                </div>
            </div>

            {/* PDF Render Box */}
            <div className="flex justify-center items-center p-4">
                <button
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber((p) => p - 1)}
                    className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/10 text-cyan-400 text-lg font-bold h-[520px] w-[40px] rounded-l-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                    ←
                </button>
                
                <Document
                    file={previewDoc.filepath.startsWith("http") ? previewDoc.filepath : `${BASE_URL}/${previewDoc.filepath}`}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<p className="text-cyan-400">Loading PDF...</p>}
                    error={<p className="text-red-400">Failed to load PDF</p>}
                >
                    <div
                        ref={pdfRef}
                        className="relative inline-block border border-cyan-900/30 rounded-lg cursor-pointer bg-[#020617]"
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onClick={handlePdfClick}
                    >
                        <Page
                            pageNumber={pageNumber}
                            width={490}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                        />

                        {signatures.filter((sig) => sig.page === pageNumber).map((sig) => (
                            <div 
                                key={sig.id}
                                className="absolute cursor-move select-none p-1.5 border border-dashed border-cyan-500/30 rounded bg-cyan-950/15 backdrop-blur-xs font-normal"
                                style={{
                                    left: `${sig.x * 100}%`,
                                    top: `${sig.y * 100}%`,
                                    transform: "translate(-50%, -50%)",
                                    color: sig.color || "#ef4444",
                                    fontFamily: sig.font || "'Pacifico', cursive",
                                    fontSize: "22px",
                                    lineHeight: "1.1",
                                    whiteSpace: "nowrap"
                                }}
                                onMouseDown={() => handleMouseDown(sig.id)}
                                onClick={(e) => { e.stopPropagation(); }}
                                onDoubleClick={() => handleDoubleClick(sig.id)}                               
                            >
                                {sig.text || "Owner Signature"}
                            </div>
                        ))}
                    </div>
                </Document>

                <button
                    disabled={pageNumber >= numPages}
                    onClick={() => setPageNumber((p) => p + 1)}
                    className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/10 text-cyan-400 text-lg font-bold h-[520px] w-[40px] rounded-r-lg disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                    →
                </button>
            </div>

            {/* Bottom generate button */}
            <div className="p-6 border-t border-cyan-900/20 flex gap-4 justify-center">
                <button
                    className="px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-2xl transition shadow-lg cursor-pointer text-sm"
                    onClick={handleGenerateSignedDocument}
                >
                    Generate Signed PDF
                </button>
            </div>

            {/* Customize Cursive Signature Styling Modal */}
            {isStyleModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
                    <div className="max-w-2xl w-full bg-[#081122] border border-cyan-500/20 rounded-[28px] p-6 space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-cyan-950 pb-4">
                            <h3 className="text-xl font-bold text-white">Set your signature details</h3>
                            <button
                                type="button"
                                onClick={() => setIsStyleModalOpen(false)}
                                className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-4 border-b border-cyan-950/80">
                            <button
                                type="button"
                                onClick={() => setStyleTab("signature")}
                                className={`pb-2 text-sm font-semibold transition cursor-pointer ${
                                    styleTab === "signature"
                                        ? "text-cyan-400 border-b-2 border-cyan-400"
                                        : "text-slate-400 hover:text-slate-300"
                                }`}
                            >
                                ✍️ Signature
                            </button>
                            <button
                                type="button"
                                onClick={() => setStyleTab("initials")}
                                className={`pb-2 text-sm font-semibold transition cursor-pointer ${
                                    styleTab === "initials"
                                        ? "text-cyan-400 border-b-2 border-cyan-400"
                                        : "text-slate-400 hover:text-slate-300"
                                }`}
                            >
                                🔤 Initials
                            </button>
                        </div>

                        {/* Inputs */}
                        <div className="grid grid-cols-[2fr_1fr] gap-4">
                            {styleTab === "signature" ? (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name:</label>
                                    <input
                                        type="text"
                                        value={fullNameInput}
                                        onChange={(e) => setFullNameInput(e.target.value)}
                                        placeholder="Your name"
                                        className="w-full rounded-xl border border-cyan-500/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-400"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Initials:</label>
                                    <input
                                        type="text"
                                        value={initialsInput}
                                        onChange={(e) => setInitialsInput(e.target.value)}
                                        placeholder="Your initials"
                                        className="w-full rounded-xl border border-cyan-500/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-cyan-400"
                                    />
                                </div>
                            )}

                            {/* Color Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Color:</label>
                                <div className="flex gap-2.5 pt-2">
                                    {COLORS.map((col) => (
                                        <button
                                            key={col.value}
                                            type="button"
                                            onClick={() => setSelectedColor(col.value)}
                                            style={{ backgroundColor: col.value }}
                                            className={`w-8 h-8 rounded-full border transition-transform cursor-pointer ${
                                                selectedColor === col.value
                                                    ? "scale-125 border-cyan-400 ring-2 ring-cyan-500/30"
                                                    : "border-transparent opacity-80 hover:opacity-100"
                                            }`}
                                            title={col.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Styles Grid */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Choose Style:</label>
                            <div className="grid grid-cols-2 gap-3">
                                {FONTS.map((font) => {
                                    const previewText = styleTab === "signature" 
                                        ? (fullNameInput.trim() || "Signature")
                                        : (initialsInput.trim() || "Initial");

                                    return (
                                        <button
                                            key={font.value}
                                            type="button"
                                            onClick={() => setSelectedFont(font.value)}
                                            className={`h-20 flex items-center justify-center p-3 rounded-2xl border transition text-center overflow-hidden relative cursor-pointer ${
                                                selectedFont === font.value
                                                    ? "bg-cyan-950/20 border-cyan-500/60"
                                                    : "bg-slate-950/40 border-cyan-950/50 hover:bg-slate-950/70"
                                            }`}
                                        >
                                            {selectedFont === font.value && (
                                                <div className="absolute top-2 left-2 w-3.5 h-3.5 rounded-full bg-cyan-400 flex items-center justify-center text-[8px] text-slate-950 font-bold">✓</div>
                                            )}
                                            <span
                                                style={{
                                                    fontFamily: font.value,
                                                    color: selectedColor,
                                                    fontSize: "24px"
                                                }}
                                                className="truncate w-full block"
                                            >
                                                {previewText}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsStyleModalOpen(false)}
                                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium hover:bg-white/5 transition text-slate-300 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleApplyStyle}
                                className="flex-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 py-3 text-sm font-semibold text-slate-950 transition cursor-pointer"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}