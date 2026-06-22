export const QUERY_STALE_TIME = {
  list: 5 * 60 * 1000,
  detail: 5 * 60 * 1000,
  workers: 10 * 60 * 1000,
  auth: 2 * 60 * 1000,
  whatsapp: 60 * 1000,
  calendar: 2 * 60 * 1000,
} as const;

export const QUERY_GC_TIME = 30 * 60 * 1000;
