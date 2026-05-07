export type KitaType = "public" | "church" | "private" | "free";
export type AgeGroup = "0-3" | "3-6" | "mixed";
export type ApplicationStatus = "draft" | "sent" | "waiting" | "positive" | "negative";
export type SubscriptionTier = "free" | "pro";
export type FeedTag = "tip" | "experience" | "availability" | "warning";
export type UserRole = "admin" | "mother" | "father" | "parent";

export interface Database {
  Tables: {
    profiles: {
      Row: {
        id: string;
        email: string;
        full_name: string | null;
        avatar_url: string | null;
        subscription_tier: SubscriptionTier;
        search_count_month: number;
        search_count_reset_at: string;
        stripe_customer_id: string | null;
        role: UserRole;
        phone: string | null;
        partner_name: string | null;
        notification_email: boolean;
        default_search_city: string | null;
        default_search_radius: number;
        created_at: string;
        updated_at: string;
      };
      Insert: Omit<Database["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
      Update: Partial<Database["Tables"]["profiles"]["Insert"]>;
    };
    children: {
      Row: {
        id: string;
        profile_id: string;
        name: string;
        date_of_birth: string;
        created_at: string;
      };
      Insert: Omit<Database["Tables"]["children"]["Row"], "id" | "created_at">;
      Update: Partial<Database["Tables"]["children"]["Insert"]>;
    };
    kitas: {
      Row: {
        id: string;
        name: string;
        address: string;
        city: string;
        postal_code: string;
        lat: number;
        lng: number;
        phone: string | null;
        email: string | null;
        website: string | null;
        kita_type: KitaType;
        age_groups: AgeGroup[];
        concept: string | null;
        opening_hours: string | null;
        capacity: number | null;
        osm_id: string | null;
        data_source: string;
        last_verified_at: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: Omit<Database["Tables"]["kitas"]["Row"], "id" | "created_at" | "updated_at">;
      Update: Partial<Database["Tables"]["kitas"]["Insert"]>;
    };
    applications: {
      Row: {
        id: string;
        profile_id: string;
        kita_id: string;
        child_id: string | null;
        status: ApplicationStatus;
        cover_letter: string | null;
        sent_at: string | null;
        response_at: string | null;
        notes: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: Omit<Database["Tables"]["applications"]["Row"], "id" | "created_at" | "updated_at">;
      Update: Partial<Database["Tables"]["applications"]["Insert"]>;
    };
    feed_posts: {
      Row: {
        id: string;
        profile_id: string;
        kita_id: string | null;
        content: string;
        tag: FeedTag;
        upvotes: number;
        is_moderated: boolean;
        is_hidden: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: Omit<Database["Tables"]["feed_posts"]["Row"], "id" | "upvotes" | "is_moderated" | "is_hidden" | "created_at" | "updated_at">;
      Update: Partial<Database["Tables"]["feed_posts"]["Insert"]>;
    };
    feed_reports: {
      Row: {
        id: string;
        post_id: string;
        reporter_profile_id: string;
        reason: string | null;
        created_at: string;
      };
      Insert: Omit<Database["Tables"]["feed_reports"]["Row"], "id" | "created_at">;
      Update: never;
    };
    subscriptions: {
      Row: {
        id: string;
        profile_id: string;
        stripe_subscription_id: string;
        stripe_price_id: string;
        status: string;
        current_period_end: string;
        cancel_at_period_end: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: Omit<Database["Tables"]["subscriptions"]["Row"], "id" | "created_at" | "updated_at">;
      Update: Partial<Database["Tables"]["subscriptions"]["Insert"]>;
    };
  };
}
