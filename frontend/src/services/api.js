const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://pathfinder-ai-omoc.onrender.com"
).replace(/\/+$/, "");

async function apiRequest(endpoint, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;

    throw new Error(
      "Could not reach the backend. Please check your internet connection and try again.",
      { cause: error },
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    // The server returned an empty or non-JSON response.
  }

  if (!response.ok) {
    const detail = data?.detail;

    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? JSON.stringify(detail)
          : `Request failed with HTTP ${response.status}.`;

    throw new Error(message);
  }

  if (data === null) {
    throw new Error("The server returned an empty or invalid response.");
  }

  return data;
}

export async function testBackendConnection(options = {}) {
  return apiRequest("/api/health", options);
}

export async function getCareers() {
  return apiRequest("/api/careers");
}

export async function matchCareers(profile) {
  return apiRequest("/api/match", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export async function generateRoadmap(profile, careerId) {
  return apiRequest("/api/roadmap", {
    method: "POST",
    body: JSON.stringify({
      ...profile,
      career_id: careerId,
    }),
  });
}
