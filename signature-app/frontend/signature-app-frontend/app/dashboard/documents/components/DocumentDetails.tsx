"use client";
import {useState} from 'react';
import {uploadDocument} from '../../../../lib/api';

interface Props {
    selectedFile: File | null;
}

export default function DocumentDetails({
    selectedFile,
}: Props) {

    const [isUploading, setIsUploading] = useState(false);

    const handleUpload = () => {
        if(selectedFile) {
            setIsUploading(true);
            uploadDocument(selectedFile).finally(() => setIsUploading(false));
        }
    }

    return (
        <div className="
            bg-[#04081D]
            border border-cyan-900/30
            rounded-3xl
            p-8
            shadow-xl
        ">
            <h2 className="
                text-cyan-400
                text-3xl
                font-bold
                mb-8
            ">
                Document Details
            </h2>

            <div className="
                flex
                flex-col
                gap-6
            ">
                <div className="
                    flex
                    justify-between
                    border-b
                    border-cyan-900/20
                    pb-3
                ">
                    <span className="text-gray-400">
                        Filename
                    </span>

                    <span className="text-white font-semibold">
                        {selectedFile?.name || "-"}
                    </span>
                </div>

                <div className="
                    flex
                    justify-between
                    border-b
                    border-cyan-900/20
                    pb-3
                ">
                    <span className="text-gray-400">
                        Size
                    </span>

                    <span className="text-cyan-400 font-semibold">
                        {
                            selectedFile
                            ? `${(
                                selectedFile.size / 1024
                              ).toFixed(2)} KB`
                            : "-"
                        }
                    </span>
                </div>

                <div className="
                    flex
                    justify-between
                    border-b
                    border-cyan-900/20
                    pb-3
                ">
                    <span className="text-gray-400">
                        Type
                    </span>

                    <span className="text-white font-semibold">
                        {
                            selectedFile?.type ||
                            "-"
                        }
                    </span>
                </div>

                <div className="
                    flex
                    justify-between
                ">
                    <span className="text-gray-400">
                        Status
                    </span>

                    <span className="
                        text-green-400
                        font-semibold
                    ">
                        {
                            selectedFile
                            ? "Ready"
                            : "Waiting"
                        }
                    </span>
                </div>
            </div>
            <button className="mt-6 ml-[10%] px-4 py-2 w-[80%] bg-cyan-500 text-white rounded-lg hover:bg-blue-600 hover:-translate-y-1 transition-colors disabled:bg-gray-700"
                onClick = {() => handleUpload()}>
                Upload
            </button>
        </div>
    );
}