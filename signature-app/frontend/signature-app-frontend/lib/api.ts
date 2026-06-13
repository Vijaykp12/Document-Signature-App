const API_URL = "https://vigilant-enigma-7vr96xxjqv7rfpvr-8000.app.github.dev";

import { getToken } from "./auth";

type ApiResult<T> =
    | { success: true; data: T }
    | { success: false; message: string };

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
    try {
        const response = await fetch(`${API_URL}${path}`, init);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                message: errorData.detail || "Request failed",
            };
        }

        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error("Network error:", error);
        return {
            success: false,
            message:
                "Unable to connect to the server. Please check if your backend server is running and set to Public.",
        };
    }
}

export async function loginUser(
    email: string,
    password: string
): Promise<ApiResult<{ access_token: string; token_type: string }>> {
    // Reuse the shared request helper so login and register report errors the same way.
    return requestJson("/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });
}

export async function registerUser(
    name: string,
    email: string,
    password: string
): Promise<ApiResult<{ message: string }>> {
    // Reuse the shared request helper so registration follows the same response contract as login.
    return requestJson("/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
    });
}

export async function getDocuments(): Promise<ApiResult<Array<{
    id: number;
    filename: string;
    filepath: string;
    thumbnail: string | null;
}>>> {
    const token = getToken();

    if (!token) {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again.",
        };
    }

    return requestJson("/documents/my-documents", {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
}

export async function uploadDocument(
    file: File | null,
) {
    const token = getToken();

    if (!token) {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again.",
        };
    }

    if(!file) {
        return {
            success: false,
            message: "No file selected"
        }
    }

    const formData = new FormData();
    formData.append("file", file);

    // Keep file uploads on the same request path so auth failures and server errors behave consistently.
    return requestJson("/documents/upload", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });
}

export async function deleteDocument(documentId: number) {
    const token = getToken();

    if (!token) {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again.",
        };
    }

    return requestJson(`/documents/${documentId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
}


export async function mySignatures() {
    const token = getToken();

    if (!token) {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again.",
        };
    }

    return requestJson("/signatures/my-signatures", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
}


export async function deleteSignature(signatureId: number) {
    const token = getToken();

    if (!token) {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again.",
        };
    }

    return requestJson(`/signatures/delete/${signatureId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
}

interface CreateSignaturePayload {
    document_id: number;
    x: number;
    y: number;
    page: number;
}

export async function createSignature(
    payload: CreateSignaturePayload
) {
    const token = getToken();

    if (!token) {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again.",
        };
    }

    return requestJson("/signatures/place-signature", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
}

export async function updateSignature(
    signatureId: number,
    payload: {
        x: number;
        y: number;
        page: number;
    }
) {
    return requestJson(
        `/signatures/update-signature/${signatureId}`,
        {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${getToken()}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }
    );
}

export async function generateSignedDocument(documentId: number) {
    const token = getToken();

    if (!token) {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again.",
        };
    }

    return requestJson(`/documents/generate-signed/${documentId}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
}

export async function downloadSignedDocument(documentId: number, filename: string) {
    // The backend streams the file directly, so the browser download can stay simple here.
    const token = getToken();
    const response = await fetch(
        `${API_URL}/documents/download-signed/${documentId}`,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `signed_document_${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl); 
}

export async function generatePublicLink(payload: {
    doc_id: number;
    signer_email: string;
    expires: number;
}): Promise<ApiResult<{ signing_link: string; token?: string }>> {
    const token = getToken();

    if (!token) {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again.",
        };
    }

    return requestJson("/documents/create-signing-link", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            document_id: payload.doc_id,
            signer_email: payload.signer_email,
            expires_in: payload.expires,
        }),
    });
}

export async function getPublicDocumentPreview(token: string) {
    return requestJson<{
        document_id: number;
        filename: string;
        thumbnail: string | null;
        pdf_url: string;
        signer_email: string;
        expires_at: string;
    }>(`/documents/public-document/preview/${token}`);
}
