"use client"

const BASE_URL = "https://vigilant-enigma-7vr96xxjqv7rfpvr-8000.app.github.dev";
import {deleteDocument} from "../../../../../lib/api";


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

interface DocumentCardProps {
    document: Document;
    onDelete: (id: number) => void;
    onPreview: (previewData: PreviewProps) => void;
}


export default function DocumentCard({ document, onDelete, onPreview }: DocumentCardProps) {

    const handleDelete = async () => {
        console.log(`Delete document with ID: ${document.id}`);
        try{
            const reponse = await deleteDocument(document.id);

            if(reponse.success) {
                console.log("Document deleted successfully");
                onDelete(document.id)
            } else {
                console.error("Failed to delete document:", reponse.message);
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
        console.log("Preview filepath:", previewData);
        onPreview(previewData);
    }

    console.log(document)
    return (
        <div className = "w-[250px] h-[400px] border rounded-lg m-2 hover:shadow-cyan-500 hover:translate-y-[-5px] ease-in-out transition-all p-4 bg-[#04081D] border-cyan-900/30 shadow-md">
            <img
                src={`${BASE_URL}${document.thumbnail}`}
                alt={document.thumbnail ? document.filename : "No Thumbnail"}
                className = "w-[250px] h-[300px] object-fit rounded-md"
            />
            <div className="flex justify-between items-center pt-2">
                <p className="font-semibold w-full truncate">{document.filename}</p>
                <button 
                    className="text-red-500 hover:text-red-700 hover:text-underlined cursor-pointer"
                    onClick={handlePreview}
                >
                    Preview
                </button>
                <button 
                    className="text-red-500 hover:text-red-700 hover:text-underlined cursor-pointer"
                    onClick={handleDelete}
                >
                    Delete
                </button>
            </div>
        </div>
    )
}