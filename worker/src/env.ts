export interface Env {
  DB: D1Database;
  PHOTOS: R2Bucket;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_ADMIN_IDS: string;
  TELEGRAM_ADMIN_CHAT_ID: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  GEMINI_API_KEY?: string;
  MINIAPP_URL?: string;
  APP_ORIGIN?: string;
  TELEGRAM_BOT_USERNAME?: string;
  TELEGRAM_MINIAPP_SHORT_NAME?: string;
}
