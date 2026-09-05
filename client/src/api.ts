const API_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: number;
  name: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export interface Requester {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

export async function checkSystem(): Promise<SystemStatus> {
  const healthResponse = await fetch(`${API_URL}/api/health`);

  if (!healthResponse.ok) {
    throw new Error("Health check failed");
  }

  const categoriesResponse = await fetch(
    `${API_URL}/api/categories`
  );

  if (!categoriesResponse.ok) {
    throw new Error("Failed to fetch categories");
  }

  const categories: Category[] = await categoriesResponse.json();

  return {
    online: true,
    categories,
  };
}

export async function getActiveRequesters(): Promise<Requester[]> {
  const response = await fetch(
    `${API_URL}/api/v1/requesters/active`
  );

  if (!response.ok) {
    throw new Error("Failed to load active requesters");
  }

  const result = await response.json();

  // Support both:
  // 1. Direct array response: [...]
  // 2. Lab 2 response format: { data: [...] }
  return Array.isArray(result) ? result : result.data;
}
