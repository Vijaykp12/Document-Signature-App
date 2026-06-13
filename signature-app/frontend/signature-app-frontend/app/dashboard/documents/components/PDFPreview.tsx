"use client";


import { useRef, useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import {createSignature, deleteSignature, generateSignedDocument, mySignatures, updateSignature} from "../../../../lib/api";

const BASE_URL =
    "https://vigilant-enigma-7vr96xxjqv7rfpvr-8000.app.github.dev";


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

interface SignatureState{
    id: number;
    document_id: number;
    x: number;
    y: number;
    page: number;
}

interface SignatureCreatePayload {
    document_id: number;
    x: number;
    y: number;
    page: number;
}

export default function PDFPreview({
    previewDoc,
    closePreview,
}: Props) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState(1);
    const pdfRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [signatures, setSignatures] = useState<
                                            SignatureState[]
                                            >([]);
    
    
    const [currentSign, setCurrentSign] = useState<
                                            SignatureState[]
                                            >([]);
    const signaturesRef = useRef(signatures);
    const currentSignRef = useRef(currentSign);

    useEffect(() => {
        const fetchSignatures = async () => {
            if(!previewDoc) return;
            const signs = await mySignatures();

            if(!signs) return;

            const signData = signs.data
                .filter((sig:any) => sig.document_id === previewDoc?.doc_id)
                .map((sig:any) => (
                    {   
                        id: sig.id,
                        document_id: sig.document_id,
                        x: sig.x,
                        y: sig.y,
                        page: sig.page
                    }
                ))
            setSignatures(signData);
            setCurrentSign(signData);
        }
        fetchSignatures();
    },[previewDoc?.doc_id]);


    useEffect(() => {
        signaturesRef.current = signatures;
    }, [signatures]);

    useEffect(() => {
        currentSignRef.current = currentSign;
    }, [currentSign]);

    const saveSessionSignatures = async() => {
        console.log("Original:", currentSignRef.current);
        console.log(
            "Current:",
            signaturesRef.current
        );  
        const createdSigns =
                signaturesRef.current.filter(
                    (sig) =>
                        !currentSignRef.current.some(
                            (oldSig) => oldSig.id === sig.id
                        )
                );

        const deletedSigns =
            currentSignRef.current.filter(
                (oldSig) =>
                    !signaturesRef.current.some(
                        (sig) => sig.id === oldSig.id
                    )
            );

        const updatedSigns = signaturesRef.current.filter(sig => {
            if (sig.id < 0) return false;

            const oldSig = currentSignRef.current.find(
                s => s.id === sig.id
            );

            if (!oldSig) return false;

            return (
                oldSig.x !== sig.x ||
                oldSig.y !== sig.y ||
                oldSig.page !== sig.page
            );
        });

        console.log(
            "Created:",
            createdSigns
        );

        console.log(
            "Deleted:",
            deletedSigns
        );

        const signData: SignatureCreatePayload[] = createdSigns.map((sig:any) => (
            {   
                document_id: sig.document_id,
                x: sig.x,
                y: sig.y,
                page: sig.page
            }
        ))

        for (const data of signData) {
            console.log("Creating:", data);
            const result = await createSignature(data);
            console.log(result);
        }

        for (const sig of deletedSigns) {
            console.log("Deleting:", sig.id);
            const result = await deleteSignature(sig.id);
            console.log(result);
        }

        for (const sig of updatedSigns) {
            console.log("Updating:", sig);

            await updateSignature(sig.id, {
                x: sig.x,
                y: sig.y,
                page: sig.page,
            });
        }
        currentSignRef.current = [...signaturesRef.current];
        setCurrentSign([...signaturesRef.current]);
        }

    useEffect(() => {

        return () => {
            saveSessionSignatures();
        };

    }, []);

    
    if (!previewDoc) return null;

    const handleGenerateSignedDocument = async() => {
        try {
            await saveSessionSignatures();
            const response = await generateSignedDocument(previewDoc.doc_id);

            if(response.success){
                console.log("Signed document generated successfully");
                alert("Signed document generated successfully");
            }
            else {
                console.error("Failed to generate signed document:", response.message);
                alert("Failed to generate signed document: " + response.message);
            }
        }
        catch(error){
            console.error("Network error while generating signed document:", error);
            alert("Network error while generating signed document");
        }
    }

    
    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPageNumber(1);
    };

    const handleMouseDown = (id: number) => {
        setDraggingId(id);
        isDragging.current = true;
    }

    const handleMouseUp = () => {
        setDraggingId(null);
        isDragging.current = false;
    }

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if(draggingId === null) return;
        if(!pdfRef.current) return;
        const rect = pdfRef.current.getBoundingClientRect();
        const x = (event.clientX - rect.left)/rect.width ;
        const y = (event.clientY - rect.top)/rect.height ;


        setSignatures((prev) => prev.map((sig) =>sig.id === draggingId ? { ...sig, x, y }: sig));
    }

    const handlePdfClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if(isDragging.current) {
            isDragging.current = false;
            return;
        }
        const rect = pdfRef.current?.getBoundingClientRect();
        const x = (event.clientX - rect!.left)/rect!.width ;
        const y = (event.clientY - rect!.top)/rect!.height ;

        setSignatures((prev) => [...prev, { id: -Date.now(), document_id: previewDoc?.doc_id || 0, x, y, page: pageNumber }]);
    }

    const handleDoubleClick = (id: number) => {
        setSignatures((prev) => prev.filter((sig) => sig.id !== id));
    }

    return (
        <div className="
            fixed
            top-0
            right-0
            h-screen
            w-[45vw]
            min-w-[650px]
            max-w-[900px]
            bg-[#020617]
            border-l
            border-cyan-900/30
            shadow-2xl
            z-50
            overflow-y-auto
        ">
            <div className="
                sticky
                top-0
                bg-[#020617]
                p-4
                flex
                justify-between
                items-center
                border-b
                border-cyan-900/30
            ">
                <h2 className="
                    text-cyan-400
                    text-xl
                    font-bold
                ">
                    PDF Preview
                </h2>

                <button
                    onClick={closePreview}
                    className="
                        text-red-400
                        hover:text-red-500
                    "
                >
                    ✕
                </button>
            </div>
            <div className="flex items-center justify-center gap-4 py-4 border-b border-cyan-900/30">

           

            <span className="text-white">
                Page {pageNumber} of {numPages}
            </span>

            

        </div>

           <div className="
                flex
                justify-center
                items-center
                overflow-hidden
                p-4
            ">
                 <button
                    disabled={pageNumber <= 1}
                    onClick={() => setPageNumber((p) => p - 1)}
                    className="
                        px-4 py-2
                        bg-cyan-500
                        h-[600px]
                        w-[50px]
                        rounded-lg
                        disabled:bg-gray-700
                        disabled:cursor-not-allowed
                    "
                >
                    ← 
                </button>
                <Document
                    file={`${BASE_URL}/${previewDoc.filepath}`}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <p className="text-cyan-400">
                            Loading PDF...
                        </p>
                    }
                    error={
                        <p className="text-red-400">
                            Failed to load PDF
                        </p>
                    }
                >
                    <div
                        ref={pdfRef}
                        className="
                            relative
                            inline-block
                        "
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onClick={handlePdfClick}
                    >
                        <Page
                            pageNumber={pageNumber}
                            width={520}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                        />

                        {signatures.filter(
                            (sig) => sig.page === pageNumber
                        ).map((sig, index) => (
                            <div 
                                key={sig.id}
                                className="
                                    absolute
                                    text-red-500
                                    text-2xl
                                    cursor-move

                                "
                                style={{
                                    left: `${sig.x * 100}%`,
                                    top: `${sig.y * 100}%`,
                                    transform: "translate(-50%, -50%)"
                                }}
                                onMouseDown={() => handleMouseDown(sig.id)}
                                onClick = {(e) => {e.stopPropagation()}}
                                onDoubleClick={() => handleDoubleClick(sig.id)}                               
                            >
                                ✍️
                            </div>
                        ))}
                    </div>
                    
                </Document>
                <button
                    disabled={pageNumber >= numPages}
                    onClick={() => setPageNumber((p) => p + 1)}
                    className="px-4 py-2 bg-cyan-500 h-[600px] w-[50px] rounded-lg disabled:bg-gray-700 disabled:cursor-not-allowed"
                >
                    →
                </button>
            </div>
            <button className="block m-auto px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-blue-600 transition-colors" onClick={handleGenerateSignedDocument}>
                Generate Signed Document
            </button>
        </div>
    );
}