"use client";

import { useState } from "react";
import { uploadDocument } from "../../../../lib/api";

interface Props {
    selectedFile: File | null;
    fetchDocuments: () => Promise<void>;
    setSelectedFile: (file: File | null) => void;
}

export default function DocumentDetails({
    selectedFile,
    fetchDocuments,
    setSelectedFile,
}: Props) {
    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            setIsUploading(true);

            const response = await uploadDocument(selectedFile);

            if (response.success) {
                await fetchDocuments();
                setSelectedFile(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="
            bg-[#04081D]
            border border-cyan-900/30
            rounded-3xl
            p-8
            shadow-xl
        ">
            <h2 className="text-cyan-400 text-3xl font-bold mb-8">
                Document Details
            </h2>

            <div className="flex flex-col gap-6">

                <div className="flex justify-between border-b border-cyan-900/20 pb-3">
                    <span className="text-gray-400">Filename</span>
                    <span className="text-white">
                        {selectedFile?.name || "-"}
                    </span>
                </div>

                <div className="flex justify-between border-b border-cyan-900/20 pb-3">
                    <span className="text-gray-400">Size</span>
                    <span className="text-cyan-400">
                        {selectedFile
                            ? `${(selectedFile.size / 1024).toFixed(2)} KB`
                            : "-"}
                    </span>
                </div>

                <div className="flex justify-between border-b border-cyan-900/20 pb-3">
                    <span className="text-gray-400">Type</span>
                    <span className="text-white">
                        {selectedFile?.type || "-"}
                    </span>
                </div>

                <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={
                        selectedFile
                            ? "text-green-400"
                            : "text-yellow-400"
                    }>
                        {selectedFile ? "Ready" : "Waiting"}
                    </span>
                </div>

            </div>

            <button
                disabled={!selectedFile || isUploading}
                onClick={handleUpload}
                className="
                    mt-8
                    w-full
                    py-3
                    rounded-xl
                    bg-cyan-500
                    text-white
                    font-semibold
                    hover:bg-cyan-600
                    transition-all
                    disabled:bg-gray-700
                "
            >
                {
                    isUploading
                        ? "Uploading..."
                        : "Upload Document"
                }
            </button>
        </div>
    );
}