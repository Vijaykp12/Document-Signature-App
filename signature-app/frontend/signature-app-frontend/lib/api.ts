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

export async function uploadDocuments(
    file: File | null,
) {
    const token = localStorage.getItem("token");

    if (!token || token === "undefined" || token === "null") {
        return {
            success: false,
            message: "Session expired or invalid. Please log out and log in again."
        };
    }

    try {
        const response = await fetch(`${API_URL}/documents/upload`, {
            method: "POST",
            headers: {
                "Authorization" : `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({file})
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