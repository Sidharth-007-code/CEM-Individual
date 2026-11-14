"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Conversation } from "@/types/chat";
import { MessageSquare, User, Clock, ArrowRight } from "lucide-react";

export default function MessagesListPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <RouteGuard requireAuth={true}>
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="border-b border-ink-200 pb-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-saffron-600" />
            <h1 className="font-serif text-3xl font-black text-ink-950 tracking-tight">
              Campus Messages
            </h1>
          </div>
          <p className="text-xs text-ink-600 mt-1">
            Direct, real-time conversations regarding textbook condition, price queries, and handover timing.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-ink-300 border-t-saffron-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs font-serif text-ink-600">Loading active conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-paper-100 border border-ink-200 rounded-notice p-12 text-center space-y-3">
            <MessageSquare className="w-8 h-8 text-ink-300 mx-auto" />
            <h3 className="font-serif text-base font-bold text-ink-950">
              No Conversations Yet
            </h3>
            <p className="text-xs text-ink-600 max-w-sm mx-auto">
              Start a conversation directly with a seller by clicking &quot;Chat with Seller&quot; on any notice board listing.
            </p>
            <Link
              href="/browse"
              className="inline-block px-4 py-2 bg-ink-950 text-paper-50 text-xs font-serif font-bold rounded-notice shadow-sm"
            >
              Browse Notice Board
            </Link>
          </div>
        ) : (
          <div className="bg-paper-100 border border-ink-200 rounded-notice divide-y divide-ink-200 overflow-hidden shadow-card">
            {conversations.map((conv) => {
              // Find other participant's ID and name
              const otherId = conv.participantIds?.find((id) => id !== user?.uid);
              const otherName = otherId && conv.participantNames ? conv.participantNames[otherId] : "Student";

              return (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className="p-4 flex items-center justify-between hover:bg-paper-50 transition group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-paper-300 border border-ink-300 flex items-center justify-center font-serif font-bold text-ink-950 flex-shrink-0">
                      {otherName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-baseline space-x-2">
                        <span className="font-serif font-bold text-sm text-ink-950 truncate">
                          {otherName}
                        </span>
                        <span className="text-[11px] font-mono text-saffron-700 truncate">
                          re: {conv.listingTitle || "Item"}
                        </span>
                      </div>
                      <p className="text-xs text-ink-600 truncate mt-0.5">
                        {conv.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-ink-400 group-hover:text-ink-900 group-hover:translate-x-1 transition-all flex-shrink-0 ml-3" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}

