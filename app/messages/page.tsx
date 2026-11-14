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
        
        <div className="border-b-2 border-black/10 pb-4">
          <div className="flex items-center space-x-2.5">
            <MessageSquare className="w-7 h-7 text-black stroke-[2.5]" />
            <h1 className="font-sans text-3xl font-black text-black tracking-tight">
              Campus Messages
            </h1>
          </div>
          <p className="text-xs font-mono font-bold text-ink-600 mt-1">
            Direct, real-time conversations regarding textbook condition, price queries, and handover timing.
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-black border-t-brutal-yellow rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono font-bold text-ink-600">Loading active conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="bg-white border-2 border-black rounded-3xl p-12 text-center space-y-4 shadow-brutal">
            <MessageSquare className="w-10 h-10 text-black mx-auto stroke-[2]" />
            <h3 className="font-sans text-xl font-black text-black">
              No Conversations Yet
            </h3>
            <p className="text-xs font-mono text-ink-600 max-w-sm mx-auto">
              Start a conversation directly with a seller by clicking &quot;Chat with Seller&quot; on any notice board listing.
            </p>
            <Link
              href="/browse"
              className="inline-block px-5 py-2.5 bg-brutal-yellow text-black text-xs font-sans font-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-brutal-yellow-light"
            >
              Browse Notice Board
            </Link>
          </div>
        ) : (
          <div className="bg-white border-2 border-black rounded-3xl divide-y-2 divide-black/10 overflow-hidden shadow-brutal">
            {conversations.map((conv) => {
              // Find other participant's ID and name
              const otherId = conv.participantIds?.find((id) => id !== user?.uid);
              const otherName = otherId && conv.participantNames ? conv.participantNames[otherId] : "Student";

              return (
                <Link
                  key={conv.id}
                  href={`/messages/${conv.id}`}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-brutal-yellow/20 transition group"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-brutal-yellow border-2 border-black flex items-center justify-center font-sans font-black text-black shadow-[2px_2px_0px_#000] shrink-0">
                      {otherName.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-baseline space-x-2">
                        <span className="font-sans font-black text-sm text-black truncate">
                          {otherName}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-ink-700 truncate">
                          re: {conv.listingTitle || "Item"}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-ink-600 truncate mt-0.5">
                        {conv.lastMessage || "No messages yet"}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1.5 transition-all flex-shrink-0 ml-3 stroke-[2.5]" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}

