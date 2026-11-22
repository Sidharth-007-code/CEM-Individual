"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Conversation } from "@/types/chat";
import { MessageSquare, ArrowRight } from "lucide-react";
import { Avatar, Card } from "@/components/ui";

function formatConversationTime(timestamp: any) {
  const date = timestamp?.toDate?.();
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

export default function MessagesListPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!user) return;
    const convsRef = collection(db, "conversations");
    const q = query(
      convsRef,
      where("participantIds", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Conversation[];

        // Sort client-side by updatedAt descending
        items.sort((a, b) => {
          const aT = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
          const bT = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
          return bT - aT;
        });

        setConversations(items);
        setLoading(false);
      },
      (err) => {
        console.warn("[MessagesListPage] Subscription warning:", err.message);
        setLoadError(true);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <RouteGuard requireAuth={true}>
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="border-b border-modern-border pb-4">
          <div className="flex items-center space-x-2.5">
            <MessageSquare className="w-7 h-7 text-modern-primary" />
            <h1 className="font-sans text-3xl font-semibold text-modern-text-primary tracking-tight">
              Campus Messages
            </h1>
          </div>
          <p className="text-sm text-modern-text-secondary mt-1">
            Direct, real-time conversations regarding textbook condition, price queries, and handover timing.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3" role="status">
            <div className="w-9 h-9 border-4 border-modern-border border-t-modern-primary rounded-full animate-spin mx-auto" />
            <p className="text-sm text-modern-text-secondary">Loading active conversations...</p>
          </div>
        ) : loadError ? (
          <Card variant="default" padding="lg" className="text-center space-y-3" role="alert">
            <MessageSquare className="w-9 h-9 text-modern-danger mx-auto" />
            <h2 className="font-semibold text-modern-text-primary">Messages could not be loaded</h2>
            <p className="text-sm text-modern-text-secondary">Please refresh the page to reconnect to your conversations.</p>
          </Card>
        ) : conversations.length === 0 ? (
          <Card variant="default" padding="lg" className="text-center space-y-4">
            <MessageSquare className="w-10 h-10 text-modern-primary mx-auto" />
            <h3 className="font-sans text-xl font-semibold text-modern-text-primary">
              No Conversations Yet
            </h3>
            <p className="text-sm text-modern-text-secondary max-w-sm mx-auto">
              Start a conversation directly with a seller by clicking &quot;Chat with Seller&quot; on any notice board listing.
            </p>
            <Link href="/browse" className="inline-flex px-5 py-2.5 bg-modern-primary hover:bg-modern-primary-hover text-white text-sm font-semibold rounded-xl border border-modern-primary shadow-modern-sm transition-colors">
              Browse Notice Board
            </Link>
          </Card>
        ) : (
          <Card variant="default" padding="none" className="divide-y divide-modern-border/70 overflow-hidden">
            {conversations.map((conv) => {
              // Find other participant's ID and name
              const otherId = conv.participantIds?.find((id) => id !== user?.uid);
              const otherName = otherId && conv.participantNames ? conv.participantNames[otherId] : "Student";

              return (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-modern-surface-hover transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-modern-primary"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <Avatar fallback={otherName} alt={otherName} size="lg" shape="rounded" className="border border-modern-border" />

                    <div className="min-w-0">
                      <div className="flex items-baseline space-x-2">
                        <span className="font-sans font-semibold text-sm text-modern-text-primary truncate">
                          {otherName}
                        </span>
                        <span className="text-xs text-modern-text-tertiary truncate">
                          re: {conv.listingTitle || "Item"}
                        </span>
                      </div>
                      <p className="text-sm text-modern-text-secondary truncate mt-0.5">
                        {conv.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="text-xs text-modern-text-tertiary">{formatConversationTime(conv.updatedAt)}</span>
                    <ArrowRight className="w-4 h-4 text-modern-text-tertiary group-hover:text-modern-primary transition-colors" />
                  </div>
                </Link>
              );
            })}
          </Card>
        )}
      </div>
    </RouteGuard>
  );
}

