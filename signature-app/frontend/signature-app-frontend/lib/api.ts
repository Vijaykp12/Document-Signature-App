const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
): Promise<ApiResult<{ message: string; document_id: number; thumbnail_url: string }>> {
    const token = getToken();

    if (!token) {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again.",
        };
    }

    if (!file) {
        return {
            success: false,
            message: "No file selected"
        }
    }

    const formData = new FormData();
    formData.append("file", file);

    return requestJson("/documents/upload", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });
}

export async function deleteDocument(documentId: number): Promise<ApiResult<{ message: string }>> {
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

export interface ApiSignature {
    id: number;
    document_id: number;
    page: number;
    x: number;
    y: number;
    status: string;
    text: string | null;
    font: string | null;
    color: string | null;
}

export async function mySignatures(): Promise<ApiResult<ApiSignature[]>> {
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

export async function deleteSignature(signatureId: number): Promise<ApiResult<{ message: string }>> {
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
    text: string | null;
    font: string | null;
    color: string | null;
}

export async function createSignature(
    payload: CreateSignaturePayload
): Promise<ApiResult<{ message: string; id: number }>> {
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
        text?: string | null;
        font?: string | null;
        color?: string | null;
    }
): Promise<ApiResult<{ message: string }>> {
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

export async function generateSignedDocument(documentId: number): Promise<ApiResult<{ message: string; path: string }>> {
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
        status: string;
        rejection_reason: string | null;
    }>(`/documents/public-document/preview/${token}`);
}

export async function publicSign(
    token: string,
    payload: {
        x: number;
        y: number;
        page: number;
        text?: string | null;
        font?: string | null;
        color?: string | null;
    }
): Promise<ApiResult<{ message: string }>> {
    return requestJson(`/signatures/public-sign/${token}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
}

export async function publicReject(
    token: string,
    reason: string
): Promise<ApiResult<{ message: string }>> {
    return requestJson(`/signatures/public-reject/${token}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
    });
}

export interface SigningLinkRecord {
    id: number;
    token: string;
    document_id: number;
    document_filename: string;
    signer_email: string;
    expires_at: string;
    is_used: boolean;
    status: string;
    rejection_reason: string | null;
    is_signed?: boolean;
    signed_url?: string | null;
}

export async function getSigningLinks(): Promise<ApiResult<SigningLinkRecord[]>> {
    const token = getToken();

    if (!token) {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again.",
        };
    }

    return requestJson("/documents/signing-links", {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
}

export async function deleteSigningLink(linkId: number): Promise<ApiResult<{ message: string }>> {
    const token = getToken();

    if (!token) {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again.",
        };
    }

    return requestJson(`/documents/signing-link/${linkId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
}



export interface ApiAuditLog {
    action: string;
    document_id: number | null;
    ip_address: string | null;
    timestamp: string;
}

export async function getAuditLogs(): Promise<ApiResult<ApiAuditLog[]>> {
    const token = getToken();

    if (!token) {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again.",
        };
    }

    return requestJson("/audit-logs/audit-logs", {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });
}
