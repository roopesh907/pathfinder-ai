
const API_BASE =
  import.meta.env.VITE_API_URL ||
  "https://pathfinder-ai-omoc.onrender.com";

const SESSION_STORAGE_KEY = "pathfinder_session_id";
const ACTIVE_CONVERSATION_KEY = "pathfinder_active_conversation_id";

async function requestJson(url, options = {}) {
  let response;

  try {
    response = await fetch(url, options);
  } catch {
    throw new Error(
      "Could not reach the server. Check your internet connection and try again.",
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    // The server may return an empty or non-JSON response.
  }

  if (!response.ok) {
    const detail =
      typeof data?.detail === "string"
        ? data.detail
        : `Request failed (${response.status}).`;

    throw new Error(detail);
  }

  return data;
}

function getOrCreateSessionId() {
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }

  return sessionId;
}

export function getSessionId() {
  return getOrCreateSessionId();
}

export function getActiveConversationId() {
  return localStorage.getItem(ACTIVE_CONVERSATION_KEY);
}

export function setActiveConversationId(conversationId) {
  if (conversationId) {
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, conversationId);
  } else {
    localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
  }
}

export async function sendChatMessage(message, profile = {}) {
  const sessionId = getOrCreateSessionId();
  const conversationId = getActiveConversationId();

  const data = await requestJson(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      profile,
      session_id: sessionId,
      ...(conversationId ? { conversation_id: conversationId } : {}),
    }),
  });

  if (typeof data?.reply !== "string") {
    throw new Error("The server returned an unexpected response.");
  }

  if (data.session_id) {
    localStorage.setItem(SESSION_STORAGE_KEY, data.session_id);
  }

  if (data.conversation_id) {
    setActiveConversationId(data.conversation_id);
  }

  return data.reply;
}

export async function getConversations() {
  const sessionId = getOrCreateSessionId();

  const data = await requestJson(
    `${API_BASE}/api/conversations?session_id=${encodeURIComponent(sessionId)}`,
  );

  return Array.isArray(data?.conversations) ? data.conversations : [];
}

export async function getConversationMessages(conversationId) {
  if (!conversationId) {
    throw new Error("A conversation ID is required.");
  }

  const sessionId = getOrCreateSessionId();

  const data = await requestJson(
    `${API_BASE}/api/conversations/${encodeURIComponent(
      conversationId,
    )}/messages?session_id=${encodeURIComponent(sessionId)}`,
  );

  return Array.isArray(data?.messages) ? data.messages : [];
}

export async function deleteConversation(conversationId) {
  if (!conversationId) {
    throw new Error("A conversation ID is required.");
  }

  const sessionId = getOrCreateSessionId();

  const data = await requestJson(
    `${API_BASE}/api/conversations/${encodeURIComponent(
      conversationId,
    )}?session_id=${encodeURIComponent(sessionId)}`,
    {
      method: "DELETE",
    },
  );

  if (data?.deleted !== true) {
    throw new Error("The conversation could not be deleted.");
  }

  // Clear the stored selection only if this was the active conversation.
  if (getActiveConversationId() === conversationId) {
    setActiveConversationId(null);
  }

  return true;
}

export function startNewConversation() {
  setActiveConversationId(null);
}
