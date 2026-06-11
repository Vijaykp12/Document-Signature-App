export function getToken() {
    // Keep token access browser-only so server rendering never touches localStorage.
    if (typeof window === 'undefined') {
        return null;
    }

    const token = localStorage.getItem('token');

    return (
        token &&
        token !== "undefined" &&
        token !== "null"
    )
        ? token
        : null;
}