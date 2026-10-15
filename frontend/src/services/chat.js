const API_BASE = import.meta.env.VITE_API_URL || "https://pathfinder-ai-ashen.vercel.app";

export async function sendChatMessage(message, profile) {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, profile }),
    });
  } catch {
    throw new Error(
      "Could not reach the server. Check that the backend is running.",
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON body; fall through to the generic errors below.
  }

  if (!response.ok) {
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : Array.isArray(data?.detail)
          ? "The request was invalid. Check the profile fields."
          : `Request failed (${response.status}).`;
    throw new Error(detail);
  }

  if (typeof data?.reply !== "string") {
    throw new Error("The server returned an unexpected response.");
  }

  return data.reply;
}