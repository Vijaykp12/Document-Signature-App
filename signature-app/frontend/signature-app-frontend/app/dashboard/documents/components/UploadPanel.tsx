"use client";

interface UploadPanelProps {
    selectedFile: File | null;
    setSelectedFile: (
        file: File | null
    ) => void;
}

export default function UploadPanel({
    selectedFile,
    setSelectedFile,
}: UploadPanelProps) {

    return (
        <div className="
            h-full
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
                mb-4
            ">
                Upload PDF
            </h2>

            <p className="
                text-gray-400
                mb-8
            ">
                Upload a PDF document for signing
            </p>

            <label
                className="
                    flex
                    h-[55%]
                    flex-col
                    items-center
                    justify-center
                    border
                    border-dashed
                    border-cyan-800/40
                    rounded-2xl
                    cursor-pointer
                    hover:border-cyan-500
                    transition-all
                    mb-4
                "
            >
                <div className="text-2xl my-2">
                    {selectedFile ? "✅" : "📄"}
                </div>

                <h3
                    className={`
                        text-xl
                        font-semibold
                        my-1
                        ${
                            selectedFile
                            ? "text-green-400"
                            : "text-white"
                        }
                    `}
                >
                    {
                        selectedFile
                        ? "File Selected"
                        : "Upload PDF"
                    }
                </h3>

                <p className="text-gray-400 text-center mb-2 -mt-2">
                    {
                        selectedFile
                        ? selectedFile.name
                        : "PDF format (Max 10MB)"
                    }
                </p>
                <input
                    type="file"
                    accept=".pdf"
                    hidden
                    onChange={(e) =>
                        setSelectedFile(
                            e.target.files?.[0] || null
                        )
                    }
                />
            </label>

            <h3 className="mt-3 text-gray-400">
                Supported formats: PDF
            </h3>

        </div>
    );
}