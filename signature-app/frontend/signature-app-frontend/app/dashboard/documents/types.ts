export interface DocumentRecord {
    id: number;
    filename: string;
    filepath: string;
    thumbnail: string | null;
}

export interface PreviewDocument {
    filepath: string;
    doc_id: number;
}
