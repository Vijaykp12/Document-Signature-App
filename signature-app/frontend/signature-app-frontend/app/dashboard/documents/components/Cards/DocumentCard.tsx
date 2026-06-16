"use client"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
import DropDownBar from "./DropDownBar";


import type { DocumentRecord, PreviewDocument } from "../../types";

interface DocumentCardProps {
    document: DocumentRecord;
    onDelete: (id: number) => void;
    onPreview: (previewData: PreviewDocument) => void;
    onGeneratePublicLink: (document: DocumentRecord) => void;

    openDropdownId: number | null;
    setOpenDropdownId: React.Dispatch<
        React.SetStateAction<number | null>
    >;
}

export default function DocumentCard({
    document,
    onDelete,
    onPreview,
    onGeneratePublicLink,
    openDropdownId,
    setOpenDropdownId,
}: DocumentCardProps)  {  

    const isOpen = openDropdownId === document.id;
    return (
        <div className = "relative w-[250px] h-[400px] border rounded-lg m-2 hover:shadow-cyan-500 hover:translate-y-[-5px] ease-in-out transition-all p-4 bg-[#04081D] border-cyan-900/30 shadow-md">
            {document.thumbnail ? (
                <img
                    src={`${BASE_URL}${document.thumbnail}`}
                    alt={document.filename}
                    className="w-full h-[300px] object-cover rounded-md"
                />
            ) : (
                <div className="w-full h-[300px] bg-slate-950/50 flex flex-col items-center justify-center rounded-md border border-cyan-900/20 text-slate-500">
                    <span className="text-4xl mb-2">📄</span>
                    <span className="text-xs font-semibold tracking-wider text-cyan-500/70">NO THUMBNAIL</span>
                </div>
            )}
            <div className="flex justify-between items-center pt-2">
                <p className="font-semibold w-full truncate">{document.filename}</p>
                <button
                    className="
                        ml-2
                        font-semibold
                        text-cyan-500
                        w-[28px]
                        h-[28px]
                        rounded-full
                        hover:text-cyan-300
                        hover:bg-cyan-900/30
                    "
                    onClick={(e) => {
                        e.stopPropagation();

                        setOpenDropdownId(
                            isOpen ? null : document.id
                        );
                    }}
                >
                    &#x22EE;
                </button>
                {/* The parent owns the open state so only one document menu can stay open at a time. */}
                {isOpen && <DropDownBar document={document} onDelete={onDelete} onPreview={onPreview} onGeneratePublicLink={onGeneratePublicLink}/>} 
            </div>
        </div>
    )
}