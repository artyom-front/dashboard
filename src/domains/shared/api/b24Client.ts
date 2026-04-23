import { env } from '@/domains/shared/config/env';

 const BASE_URL = env.bitrixWebhook;

// src/domains/shared/api/b24Client.ts
export async function callBitrix(method: string, params: Record<string, unknown> = {}) {
  const url = `${BASE_URL}${method}`;
  
  console.log('>>> callBitrix URL:', url);
  console.log('>>> callBitrix params:', JSON.stringify(params, null, 2));
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
 


  if (!response.ok) {
    throw new Error(`Bitrix API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Bitrix error: ${data.error} (${data.error_description || 'no description'})`);
  }

  return data;
}