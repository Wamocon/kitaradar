"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { PostCard, NewPostForm } from "@/components/feed/PostCard";
import { Loader2, Users } from "lucide-react";
import { useTranslations } from "next-intl";

interface FeedPost {
  id: string;
  title: string;
  content: string;
  tag: string;
  upvotes: number;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

const TAG_FILTERS = ["all", "general", "tip", "experience", "question", "news"] as const;

export function FeedClient({ isPro }: { isPro: boolean }) {
  const t = useTranslations("feed");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [tag, setTag] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    const url = tag === "all" ? "/api/feed/posts" : `/api/feed/posts?tag=${tag}`;
    try {
      const res = await fetch(url);
      const data: { posts?: FeedPost[] } = await res.json();
      setPosts(data.posts ?? []);
    } finally {
      setIsLoading(false);
    }
  }, [tag]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Community</h1>
          <p className="text-sm text-muted">{t("subtitle")}</p>
        </div>
        {isPro && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            {showForm ? t("cancel_btn") : t("new_post_btn")}
          </button>
        )}
      </div>

      {/* Pro gate notice */}
      {!isPro && (
        <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
          <strong>{t("pro_notice_strong")}</strong> {t("pro_notice_text")}{" "}
          <Link href="/pricing" className="text-primary hover:underline font-medium">{t("upgrade_now")}</Link>
        </div>
      )}

      {/* New post form */}
      {showForm && isPro && (
        <div className="mb-6">
          <NewPostForm onPosted={() => { setShowForm(false); loadPosts(); }} />
        </div>
      )}

      {/* Tag filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TAG_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setTag(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tag === f
                ? "bg-primary text-white"
                : "border border-border text-muted hover:border-primary/50"
            }`}
          >
            {t(`tag_filters.${f}`)}
          </button>
        ))}
      </div>

      {/* Posts */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted">
          <Users className="h-12 w-12 opacity-20" />
          <p className="text-sm">{t("empty")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
