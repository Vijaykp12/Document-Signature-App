const API_URL = "https://vigilant-enigma-7vr96xxjqv7rfpvr-8000.app.github.dev";

export async function loginUser(
    email: string, 
    password: string
) {
    try{
        const response = await fetch(`${API_URL}/auth/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({email, password}),
        }
        )

        if(!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                "success": false,
                "message": errorData.detail || "Login Failed"
            }
        }
        const data = await response.json();
        return {
            "success": true,
            "data": data
        }
    }
    catch(error){
        console.error("Network error:" , error);
        return {
            "success": false,
            "message": "Unable to connect to the server. Please check if your backend server is running and set to Public."
        }
    }
}

export async function registerUser(
    name: string,
    email: string,
    password: string
) {
    try{
        const response = await fetch(`${API_URL}/auth/register`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({name, email, password}),
        }
        )

        if(!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                "success": false,
                "message": errorData.detail || "Registration Failed"
            }
        }

        const data = await response.json();
        return {
            "success": true,
            "data": data
        }
    }

    catch(error) {
        console.error("Network error:" , error);
        return {
            "success": false,
            "message": "Unable to connect to the server. Please check if your backend server is running and set to Public."
        }
    }
}

export async function getDocuments() {
    const token = localStorage.getItem("token");

    console.log("Attempting to fetch documents with token: 2", token);

    if (!token || token === "undefined" || token === "null") {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again."
        };
    }

    try {
        const response = await fetch(`${API_URL}/documents/my-documents`, {
            headers: {
                "Authorization" : `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        })

        if(!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                "success": false,
                "message": errorData.detail || "Failed to fetch documents"
            }
        }

        const data = await response.json();
        return {
            "success": true,
            "data": data
        }
    }
    catch(error) {
        console.error("Network error:" , error);
        return {
            "success": false,
            "message": "Unable to connect to the server. Please check if your backend server is running and set to Public."
        }
    }
}

export async function uploadDocument(
    file: File | null,
) {
    const token = localStorage.getItem("token");

    if (!token || token === "undefined" || token === "null") {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again."
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
    try {
        const response = await fetch(`${API_URL}/documents/upload`, {
            method: "POST",
            headers: {
                "Authorization" : `Bearer ${token}`
            },
            body: formData
        })

        if(!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                "success": false,
                "message": errorData.detail || "Failed to upload document"
            }
        }

        const data = await response.json();
        return {
            "success": true,
            "data": data
        }
    }
    catch(error) {
        console.error("Network error:" , error);
        return {
            "success": false,
            "message": "Unable to connect to the server. Please check if your backend server is running and set to Public."
        }
    }
}

export async function deleteDocument(documentId: number) {
    const token = localStorage.getItem("token");

    console.log("Attempting to delete document with ID: 2", token);

    if (!token || token === "undefined" || token === "null") {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again."
        };
    }

    try {
        const response = await fetch(`${API_URL}/documents/${documentId}`, {
            method: "DELETE",
            headers: {
                "Authorization" : `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        })

        if(!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                "success": false,
                "message": errorData.detail || "Failed to delete document"
            }
        }

        const data = await response.json();
        return {
            "success": true,
            "data": data
        }
    }
    catch(error) {
        console.error("Network error:" , error);
        return {
            "success": false,
            "message": "Unable to connect to the server. Please check if your backend server is running and set to Public."
        }
    }
}


export async function mySignatures() {
    const token = localStorage.getItem("token");

    if (!token || token === "undefined" || token === "null") {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again."
        };
    }

    try {
        const response = await fetch(`${API_URL}/signatures/my-signatures`, {
            method: "GET",
            headers: {
                "Authorization" : `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        })

        if(!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                "success": false,
                "message": errorData.detail || "Failed to retrieve signatures"
            }
        }

        const data = await response.json();
        return {
            "success": true,
            "data": data
        }
    }
    catch(error) {
        console.error("Network error:" , error);
        return {
            "success": false,
            "message": "Unable to connect to the server. Please check if your backend server is running and set to Public."
        }
    }
}


export async function deleteSignature(signatureId: number) {
    const token = localStorage.getItem("token");

    console.log("Attempting to delete signature with ID: ", signatureId, token);

    if (!token || token === "undefined" || token === "null") {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again."
        };
    }

    try {
        const response = await fetch(`${API_URL}/signatures/${signatureId}`, {
            method: "DELETE",
            headers: {
                "Authorization" : `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        })

        if(!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                "success": false,
                "message": errorData.detail || "Failed to delete signature"
            }
        }

        const data = await response.json();
        return {
            "success": true,
            "data": data
        }
    }
    catch(error) {
        console.error("Network error:" , error);
        return {
            "success": false,
            "message": "Unable to connect to the server. Please check if your backend server is running and set to Public."
        }
    }
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
    const token = localStorage.getItem("token");

    if(!token || token === "undefined" || token === "null") {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again."
        };
    }

    try{
        const response = await fetch(`${API_URL}/signatures/place-signature`, {
            method: "POST",
            headers: {
                "Authorization" : `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload)
        })

        if(!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                "success": false,
                "message": errorData.detail || "Failed to place signature"
            }
        }

        const data = await response.json();
        return {
            "success": true,
            "data": data
        }
    }
    catch(error) {
        console.error("Network error:" , error);
        return {
            "success": false,
            "message": "Unable to connect to the server. Please check if your backend server is running and set to Public."
        }
    }
}