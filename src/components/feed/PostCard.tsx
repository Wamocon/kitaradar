"use client";

import { useState } from "react";
import { ThumbsUp, Flag, Loader2 } from "lucide-react";

interface FeedPost {
  id: string;
  title: string;
  content: string;
  tag: string;
  upvotes: number;
  created_at: string;
  profiles?: { full_name: string | null } | null;
}

const TAG_LABELS: Record<string, string> = {
  general: "Allgemein",
  tip: "Tipp",
  experience: "Erfahrung",
  question: "Frage",
  news: "News",
};

export function PostCard({ post }: { post: FeedPost }) {
  const [upvotes, setUpvotes] = useState(post.upvotes ?? 0);
  const [upvoted, setUpvoted] = useState(false);
  const [reported, setReported] = useState(false);

  async function handleUpvote() {
    if (upvoted) return;
    setUpvoted(true);
    setUpvotes((n) => n + 1);
    await fetch(`/api/feed/posts/${post.id}/upvote`, { method: "POST" });
  }

  async function handleReport() {
    if (reported) return;
    setReported(true);
    await fetch(`/api/feed/posts/${post.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "user_report" }),
    });
  }

  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{post.title}</h3>
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {TAG_LABELS[post.tag] ?? post.tag}
        </span>
      </div>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>
          {post.profiles?.full_name ?? "Anonym"} ·{" "}
          {new Date(post.created_at).toLocaleDateString("de-DE")}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleUpvote}
            disabled={upvoted}
            className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${
              upvoted
                ? "text-primary"
                : "hover:text-primary"
            }`}
          >
            <ThumbsUp className="h-3 w-3" />
            {upvotes}
          </button>
          <button
            onClick={handleReport}
            disabled={reported}
            className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${
              reported ? "text-red-400" : "hover:text-red-500"
            }`}
          >
            <Flag className="h-3 w-3" />
            {reported ? "Gemeldet" : "Melden"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function NewPostForm({ onPosted }: { onPosted: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/feed/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, tag }),
      });
      if (res.status === 403) {
        setError("Nur Pro-Mitglieder können Beiträge erstellen.");
        return;
      }
      if (!res.ok) {
        setError("Fehler beim Erstellen des Beitrags.");
        return;
      }
      setTitle("");
      setContent("");
      onPosted();
    } catch {
      setError("Fehler beim Erstellen des Beitrags.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <h3 className="mb-3 text-sm font-semibold text-foreground">Neuer Beitrag</h3>
      {error && (
        <p className="mb-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titel..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Ihr Beitrag..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
          >
            {Object.entries(TAG_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Veröffentlichen
          </button>
        </div>
      </div>
    </form>
  );
}
