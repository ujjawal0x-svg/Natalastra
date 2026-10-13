declare namespace Cloudflare {
  interface Env {
    GROQ_API_KEY?: string;
    NATALASTRA_AI_ENABLED?: string;
    DB?: D1Database;
    NATALASTRA_DATABASE?: string;
    NATALASTRA_STORAGE_MAINTENANCE?: string;
    NATALASTRA_AUTH?: string;
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    SUPABASE_URL?: string;
    SUPABASE_SECRET_KEY?: string;
    RESEARCH_ADMIN_EMAIL?: string;
    NATALASTRA_OPERATOR_NAME?: string;
    NATALASTRA_BUSINESS_ADDRESS?: string;
    NATALASTRA_SUPPORT_EMAIL?: string;
    RESEND_API_KEY?: string;
    NATALASTRA_MAIL_FROM?: string;
    NATALASTRA_DOSSIER_PREVIEW_UNTIL?: string;
    LEMON_API_KEY?: string;
    LEMON_WEBHOOK_SECRET?: string;
    LEMON_STORE_ID?: string;
    LEMON_DOSSIER_VARIANT_ID?: string;
    LEMON_PASS_VARIANT_ID?: string;
    LEMON_TEST_MODE?: string;
    NATALASTRA_PAID_ENABLED?: string;
    BUCKET?: R2Bucket;
  }
}
