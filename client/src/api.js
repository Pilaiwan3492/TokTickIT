const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
export async function checkSystem() {
    const healthResponse = await fetch(`${API_URL}/api/health`);
    if (!healthResponse.ok) {
        throw new Error("Health check failed");
    }
    const categoriesResponse = await fetch(`${API_URL}/api/categories`);
    if (!categoriesResponse.ok) {
        throw new Error("Failed to fetch categories");
    }
    const categories = await categoriesResponse.json();
    return { online: true, categories };
}
export async function getActiveRequesters() {
    const response = await fetch(`${API_URL}/api/v1/requesters/active`);
    if (!response.ok) {
        throw new Error("Failed to load active requesters");
    }
    return response.json();
}
