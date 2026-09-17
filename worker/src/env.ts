export interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_ADMIN_IDS: string;
  TELEGRAM_ADMIN_CHAT_ID: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  MINIAPP_URL?: string;
  APP_ORIGIN?: string;
}
