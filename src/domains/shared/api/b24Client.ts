import { env } from '@/domains/shared/config/env';

const BASE_URL = env.bitrixWebhook;

interface BitrixResponse {
  result?: unknown;
  error?: string;
  error_description?: string;
  total?: number;
  next?: number;
}

export async function callBitrix(
  method: string,
  params: Record<string, unknown> = {}
): Promise<BitrixResponse> {
  const url = `${BASE_URL}${method}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch (networkError) {
    throw new Error(
      `Bitrix network error: ${networkError instanceof Error ? networkError.message : 'Unknown network error'}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Bitrix API HTTP error: ${response.status} ${response.statusText}`
    );
  }

  let data: BitrixResponse;
  try {
    data = await response.json();
  } catch (parseError) {
    throw new Error(
      `Bitrix API JSON parse error: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`
    );
  }

  if (data.error) {
    throw new Error(
      `Bitrix API error: ${data.error} (${data.error_description || 'no description'})`
    );
  }

  return data;
}