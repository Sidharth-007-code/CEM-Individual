"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import {
  doc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Conversation, ChatMessage } from "@/types/chat";
import { ChevronLeft, Send, User, ExternalLink, ShieldAlert } from "lucide-react";

export default function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to conversation
  useEffect(() => {
    if (!id || !user) return;
    const convRef = doc(db, "conversations", id);

    const unsubscribeConv = onSnapshot(
      convRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Conversation;
          // Guard: verify current user is a participant
          if (!data.participantIds?.includes(user.uid)) {
            setConversation(null);
          } else {
            setConversation(data);
          }
        } else {
          setConversation(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Conv fetch error:", err.message);
        setLoading(false);
      }
    );

    // Subscribe to messages subcollection
    const messagesRef = collection(db, `conversations/${id}/messages`);
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribeMessages = onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ChatMessage[];
        setMessages(msgs);
      },
      (err) => {
        console.warn("Messages subcollection error:", err.message);
      }
    );

    return () => {
      unsubscribeConv();
      unsubscribeMessages();
    };
  }, [id, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !conversation || !newMessage.trim()) return;

    const textToSend = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      const messagesRef = collection(db, `conversations/${conversation.id}/messages`);
      await addDoc(messagesRef, {
        senderId: user.uid,
        senderName: profile?.name || "Student",
        text: textToSend,
        createdAt: serverTimestamp(),
      });

      // Update parent conversation lastMessage
      const convRef = doc(db, "conversations", conversation.id);
      await updateDoc(convRef, {
        lastMessage: textToSend,
        updatedAt: serverTimestamp(),
      });

      // Notify the other participant
      const otherParticipantId = conversation.participantIds.find((p) => p !== user.uid);
      if (otherParticipantId) {
        const notifRef = doc(collection(db, `notifications/${otherParticipantId}/items`));
        await setDoc(notifRef, {
          id: notifRef.id,
          type: "chat",
          text: `New message from ${profile?.name || "Student"}: "${textToSend.slice(0, 50)}"`,
          link: `/messages/${conversation.id}`,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err: any) {
      console.error("[Chat send error]:", err);
      alert("Failed to send message: " + err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-ink-300 border-t-saffron-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-serif text-ink-600">Connecting to secure campus chat...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="max-w-md mx-auto my-12 bg-paper-100 border border-ink-200 rounded-notice p-8 text-center space-y-4">
        <ShieldAlert className="w-8 h-8 text-admin-600 mx-auto" />
        <h2 className="font-serif text-xl font-bold text-ink-950">Chat Unavailable</h2>
        <p className="text-xs text-ink-600 leading-relaxed">
          You do not have permission to view this conversation, or it has been closed.
        </p>
        <Link
          href="/messages"
          className="inline-block px-4 py-2 bg-ink-950 text-paper-50 rounded text-xs font-serif font-bold"
        >
          Return to Messages
        </Link>
      </div>
    );
  }

  const otherId = conversation.participantIds?.find((p) => p !== user?.uid);
  const otherName = otherId && conversation.participantNames ? conversation.participantNames[otherId] : "Student";

  return (
    <RouteGuard requireAuth={true}>
      <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-paper-100 border border-ink-200 rounded-notice shadow-card overflow-hidden">
        
        {/* Chat Header */}
        <div className="p-3.5 border-b border-ink-200 bg-paper-200/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/messages"
              className="p-1 rounded text-ink-600 hover:text-ink-950 hover:bg-paper-300 transition"
              title="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>

            <div className="w-9 h-9 rounded-full bg-paper-300 border border-ink-300 flex items-center justify-center font-serif font-bold text-ink-950 text-sm">
              {otherName.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2 className="font-serif font-bold text-sm text-ink-950">
                {otherName}
              </h2>
              <span className="text-[11px] font-mono text-saffron-700 block">
                re: {conversation.listingTitle || "Campus Item"}
              </span>
            </div>
          </div>

          {conversation.listingId && (
            <Link
              href={`/listings/${conversation.listingId}`}
              className="px-2.5 py-1 text-xs text-ink-700 hover:text-ink-950 bg-paper-50 hover:bg-paper-300 border border-ink-300 rounded transition flex items-center space-x-1"
            >
              <span>View Item</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-paper-50/50">
          <div className="text-center my-2">
            <span className="px-2.5 py-1 bg-paper-200 text-ink-600 rounded text-[10px] font-mono border border-ink-300">
              Encrypted institutional peer-to-peer chat
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="py-12 text-center text-xs text-ink-500 italic">
              Say hello! Inquire about condition, notes, or agree on a campus meetup spot.
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMine = msg.senderId === user?.uid;
              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[78%] px-4 py-2.5 rounded-notice text-xs leading-relaxed shadow-sm ${
                      isMine
                        ? "bg-ink-900 text-paper-50 rounded-br-none"
                        : "bg-paper-200 text-ink-950 border border-ink-300 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className="text-[9px] font-mono text-ink-400 mt-0.5 px-1">
                    {msg.senderName}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-ink-200 bg-paper-100 flex items-center space-x-2">
          <input
            type="text"
            required
            placeholder="Type your message to agree on meetup..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-3.5 py-2 bg-paper-50 border border-ink-300 rounded-notice text-xs sm:text-sm text-ink-900 focus:outline-none focus:border-saffron-500"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2 bg-saffron-500 hover:bg-saffron-600 text-white rounded-notice transition font-serif font-bold text-xs flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </RouteGuard>
  );
}

