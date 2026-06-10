"use client";

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {getDocuments} from '../../../lib/api';
import UploadPanel
from "./components/UploadPanel";

import DocumentDetails
from "./components/DocumentDetails";

import DocumentList
from "./components/DocumentList";
import PDFPreview from './components/PDFPreview';

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

export default function Dashboard() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [previewDoc, setPreviewDoc] = useState<PreviewProps | null>(null);
    const router = useRouter();

    const fetchDocuments = async () => {
            const result = await getDocuments();
            if (result.success) {
                setDocuments(result.data);
            } else {
                console.error("Failed to fetch documents:", result.message);
            }
            setLoading(false);
        };

    const handleDeleteDocument = (id: number) => {
        setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== id));
    }

    useEffect(() => {
        const token = localStorage.getItem("token");
        console.log("Attempting to fetch documents with token:", token);
    
        // Check if token is missing or accidentally stored as a string "undefined"
        if (!token || token === "undefined") {
            console.error("No valid token found, redirecting to login...");
            router.push("/login");
            return;
        }

        fetchDocuments();
    }, [selectedFile, router]);

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <div className="h-[calc(100vh-80px)] p-6 flex flex-col gap-6">

            <div className="grid grid-cols-[1fr_2fr] gap-6 min-h-[200px]">
                <UploadPanel
                    selectedFile={selectedFile}
                    setSelectedFile={
                        setSelectedFile
                    }
                />

                <DocumentDetails
                    selectedFile={selectedFile}
                    fetchDocuments = {fetchDocuments}
                    setSelectedFile={setSelectedFile}
                />

            </div>

            <div className="mt-60 mb-5">
                <DocumentList documents={documents}  onDelete={handleDeleteDocument} onPreview={setPreviewDoc}/>
            </div> 
            <PDFPreview
                previewDoc={previewDoc}
                closePreview={() => setPreviewDoc(null)}
            />
        </div>
    );
}