import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Phone, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SUPPORT_PHONE, SUPPORT_PHONE_TEL, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Australian Bite" },
      {
        name: "description",
        content:
          "Get help with an Australian Bite order: chat live with our crew or call the store directly on +61 2 8123 4400.",
      },
      { property: "og:title", content: "Support — Australian Bite" },
      { property: "og:description", content: "Chat live with our crew or call the store directly." },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const { user, loading } = useAuth();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-display text-4xl">Support</h1>
      <p className="mt-2 text-muted-foreground">
        Something not right with an order? Talk to a real person — chat here or call the store.
      </p>

      <a
        href={`tel:${SUPPORT_PHONE_TEL}`}
        className="mt-6 flex items-center gap-3 rounded-3xl border border-border bg-card p-5 shadow-card"
      >
        <Phone className="size-5 text-primary" />
        <div>
          <p className="font-bold">Call the store</p>
          <p className="text-sm text-muted-foreground">{SUPPORT_PHONE} · 10am–10pm daily</p>
        </div>
      </a>

      <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-card">
        <h2 className="text-lg font-bold">Live chat</h2>
        {loading ? (
          <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
        ) : user ? (
          <SupportChat userId={user.id} />
        ) : (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground">Sign in to start a chat with our crew.</p>
            <Link to="/auth" className="mt-3 inline-block">
              <Button>Sign in to chat</Button>
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

function SupportChat({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data: thread } = useQuery({
    queryKey: ["support-thread", userId],
    queryFn: async () => {
      const existing = await supabase
        .from("support_threads")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing.data) return existing.data;
      const created = await supabase.from("support_threads").insert({ user_id: userId }).select().single();
      if (created.error) throw created.error;
      return created.data;
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["support-messages", thread?.id],
    enabled: !!thread,
    refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("thread_id", thread!.id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages?.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thread || !body.trim()) return;
    const text = body.trim();
    setBody("");
    const { error } = await supabase
      .from("support_messages")
      .insert({ thread_id: thread.id, sender_id: userId, is_staff: false, body: text });
    if (error) {
      toast.error("Message not sent");
      return;
    }
    void qc.invalidateQueries({ queryKey: ["support-messages", thread.id] });
  };

  return (
    <div className="mt-3">
      <div className="max-h-80 space-y-2 overflow-y-auto rounded-2xl bg-secondary/60 p-3">
        {(messages ?? []).length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            Say hello — the crew usually replies within a few minutes.
          </p>
        ) : (
          (messages ?? []).map((m) => (
            <div
              key={m.id}
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                m.is_staff ? "bg-card" : "ml-auto bg-primary text-primary-foreground"
              }`}
            >
              <p>{m.body}</p>
              <p className="mt-1 text-[11px] opacity-70">{formatDateTime(m.created_at)}</p>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
      <form className="mt-3 flex gap-2" onSubmit={send}>
        <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message…" maxLength={800} />
        <Button type="submit" size="icon" aria-label="Send">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
