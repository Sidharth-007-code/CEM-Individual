"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import {
  doc,
  getDoc,
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
import { UserProfile } from "@/types/user";
import { PRESET_AVATARS } from "@/lib/constants";
import { ChevronLeft, Send, ExternalLink, ShieldAlert, Phone } from "lucide-react";
import { Avatar, Badge, Button, Card, Input } from "@/components/ui";

function formatMessageTime(timestamp: any) {
  const date = timestamp?.toDate?.();
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
}

export default function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messageLoadError, setMessageLoadError] = useState(false);
  const [otherProfile, setOtherProfile] = useState<UserProfile | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherId = conversation?.participantIds?.find((p) => p !== user?.uid);

  // Fetch live student profile of other chat participant
  useEffect(() => {
    if (!otherId) return;
    const fetchOther = async () => {
      try {
        const snap = await getDoc(doc(db, "users", otherId));
        if (snap.exists()) {
          setOtherProfile({ uid: snap.id, ...snap.data() } as UserProfile);
        }
      } catch (e) {
        console.warn("[Chat] Failed to fetch other participant profile:", e);
      }
    };
    fetchOther();
  }, [otherId]);

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
        setMessageLoadError(true);
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
          senderId: user.uid,
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
        <div className="w-9 h-9 border-4 border-modern-border border-t-modern-primary rounded-full animate-spin mx-auto" />
        <p className="text-sm text-modern-text-secondary">Connecting to secure campus chat...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <Card variant="default" padding="lg" className="max-w-md mx-auto my-12 text-center space-y-4">
        <ShieldAlert className="w-10 h-10 text-modern-error mx-auto" />
        <h2 className="font-sans text-2xl font-semibold text-modern-text-primary">Chat Unavailable</h2>
        <p className="text-sm text-modern-text-secondary leading-relaxed">
          You do not have permission to view this conversation, or it has been closed.
        </p>
        <Link href="/messages" className="inline-flex">
          <Button variant="primary">
          Return to Messages
          </Button>
        </Link>
      </Card>
    );
  }

  const displayName = otherProfile?.name || (otherId && conversation.participantNames ? conversation.participantNames[otherId] : "Student");
  const otherAvatarPreset = PRESET_AVATARS.find((a) => a.id === otherProfile?.avatarId);

  return (
    <RouteGuard requireAuth={true}>
      <div className="max-w-3xl mx-auto h-[calc(100dvh-8rem)] min-h-[28rem] flex flex-col bg-white border border-modern-border rounded-2xl shadow-modern-lg overflow-hidden">
        
        {/* Chat Header */}
        <div className="p-3 sm:p-4 border-b border-modern-border bg-modern-surface-hover flex items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <Link
              href="/messages"
              className="p-2 rounded-xl border border-modern-border bg-white text-modern-text-secondary hover:bg-modern-surface-hover transition"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </Link>

            {otherAvatarPreset && !otherProfile?.photoURL ? (
              <div className="w-10 h-10 rounded-xl bg-modern-primary-light border border-modern-border flex items-center justify-center text-lg shrink-0" aria-label={displayName}>
                {otherAvatarPreset.emoji}
              </div>
            ) : (
              <Avatar src={otherProfile?.photoURL} alt={displayName} fallback={displayName} size="md" shape="rounded" className="border border-modern-border" />
            )}

            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="font-sans font-semibold text-sm text-modern-text-primary">
                  {displayName}
                </h2>
                <Badge variant="success" size="xs">
                  Verified
                </Badge>
              </div>
              <span className="text-xs text-modern-text-tertiary block">
                {otherProfile?.course ? `${otherProfile.course} ${otherProfile.year ? `• ${otherProfile.year}` : ""}` : (conversation.listingTitle ? `re: ${conversation.listingTitle}` : "MSRUAS Student")}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {otherProfile?.phone && (
              <a
                href={`tel:${otherProfile.phone}`}
                className="px-3 py-2 text-xs font-semibold text-modern-text-primary bg-white hover:bg-modern-success-light border border-modern-border rounded-xl transition flex items-center space-x-1"
                title={`Call ${displayName}`}
              >
                <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Call</span>
              </a>
            )}

            {conversation.listingId && (
              <Link
                href={`/listings/${conversation.listingId}`}
                className="px-3 py-2 text-xs font-semibold text-modern-primary bg-modern-primary-light hover:bg-modern-surface-hover border border-modern-border rounded-xl transition flex items-center space-x-1"
              >
                <span>View Item</span>
                <ExternalLink className="w-3 h-3 stroke-[2.5]" />
              </Link>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3 bg-modern-bg overscroll-contain">
          <div className="text-center my-2">
            <Badge variant="secondary" size="sm">
              Institutional Peer-to-Peer Verified Chat
            </Badge>
          </div>

          {messageLoadError ? (
            <div className="py-12 text-center text-sm text-modern-error" role="alert">
              Messages could not be loaded. Please refresh to reconnect.
            </div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center text-sm text-modern-text-tertiary">
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
                    className={`max-w-[88%] sm:max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? "bg-modern-primary text-white rounded-br-md"
                        : "bg-white text-modern-text-primary border border-modern-border rounded-bl-md shadow-modern-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className="text-[11px] text-modern-text-tertiary mt-1 px-1">
                    {msg.senderName}{formatMessageTime(msg.createdAt) ? ` · ${formatMessageTime(msg.createdAt)}` : ""}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-modern-border bg-white flex items-center gap-2.5">
          <Input
            type="text"
            required
            placeholder="Type your message to agree on meetup..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={sending || !newMessage.trim()}
            variant="primary"
            size="md"
            aria-label="Send message"
            leftIcon={<Send className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Send</span>
          </Button>
        </form>
      </div>
    </RouteGuard>
  );
}

