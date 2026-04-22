function getEnvVar(key: string): string {
  const value = process.env[key];
  if(!value) {
    throw new Error(`Missing environment variable ${key}`);
}
  return value
}

export const env = {
  bitrixWebhook: getEnvVar('BITRIX_WEBHOOK'),
  bankTokenBspb: getEnvVar('BANK_TOKEN_Bspb'),
  bankFilterBspb: getEnvVar('BANK_FILTER_Bspb'),
  dashboardToken: getEnvVar('DASHBOARD_TOKEN'),
} as const;