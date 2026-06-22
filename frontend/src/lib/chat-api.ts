import { parseApiResponse } from './parse-api-error';
import { ApiError } from './api';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;

  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor',
      0,
      'NETWORK_ERROR',
    );
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw parseApiResponse(data, res);
  }

  return data as T;
}

export function sendChatMessage(
  message: string,
  history: ChatMessage[],
): Promise<{ reply: string }> {
  return request<{ reply: string }>('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
}
