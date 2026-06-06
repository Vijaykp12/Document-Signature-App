"use client";

interface Document {
    id: number;
    filename: string;
}

interface DocumentListProps {
    documents: Document[];
}

export default function DocumentList({
    documents,
}: DocumentListProps) {

    return (
        <div className="bg-[#04081D] rounded-xl p-6 h-full overflow-y-auto shadow-xl border border-cyan-900/30">

            <h2 className="text-2xl text-cyan-400 font-bold mb-4">
                My Documents
            </h2>

            <div className="space-y-3">

                {documents.length === 0 ? (
                    <p>No documents found</p>
                ) : (
                    documents.map((doc) => (
                        <div
                            key={doc.id}
                            className="border rounded-lg p-4 hover:bg-cyan-900/30"
                        >
                            <h3 className="font-semibold">
                                {doc.filename}
                            </h3>

                            <p>
                                ID: {doc.id}
                            </p>
                        </div>
                    ))
                )}

            </div>

        </div>
    );
}