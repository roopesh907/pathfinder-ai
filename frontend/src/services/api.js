
const API_BASE_URL = "http://127.0.0.1:8000";

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with HTTP ${response.status}`;

    try {
      const errorData = await response.json();
      message = errorData.detail
        ? typeof errorData.detail === "string"
          ? errorData.detail
          : JSON.stringify(errorData.detail)
        : message;
    } catch {
      // Keep the original HTTP error message.
    }

    throw new Error(message);
  }

  return response.json();
}

export async function testBackendConnection() {
  return apiRequest("/api/health");
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
