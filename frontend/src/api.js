const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function toWsBaseUrl() {
  return API_BASE_URL.replace("https://", "wss://").replace("http://", "ws://");
}

export async function apiFetch(path, options = {}, token) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let detail = "Request failed";
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch (error) {
      // Ignore JSON parsing errors.
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
