const API_URL = "https://vigilant-enigma-7vr96xxjqv7rfpvr-8000.app.github.dev";

export async function loginUser(
    email: string, 
    password: string
) {
    const response = await fetch(
        `${API_URL}/auth/login`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({email, password}),
        }
    )

    return response.json();
}

export async function registerUser(
    name: string,
    email: string,
    password: string
) {
    const response = await fetch(
        `${API_URL}/auth/register`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({name, email, password}),
        }
    )
    return response.json();
}