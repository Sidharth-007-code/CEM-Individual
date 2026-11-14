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
import { ChevronLeft, Send, User, ExternalLink, ShieldAlert, Phone } from "lucide-react";

export default function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
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
        <div className="w-10 h-10 border-4 border-black border-t-brutal-yellow rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono font-bold text-ink-600">Connecting to secure campus chat...</p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border-2 border-black rounded-2xl p-8 text-center space-y-4 shadow-brutal">
        <ShieldAlert className="w-10 h-10 text-admin-600 mx-auto" />
        <h2 className="font-sans text-2xl font-black text-black">Chat Unavailable</h2>
        <p className="text-xs font-mono text-ink-600 leading-relaxed">
          You do not have permission to view this conversation, or it has been closed.
        </p>
        <Link
          href="/messages"
          className="inline-block px-5 py-2.5 bg-brutal-yellow text-black rounded-xl border-2 border-black text-xs font-sans font-black shadow-[2px_2px_0px_#000] hover:bg-brutal-yellow-light"
        >
          Return to Messages
        </Link>
      </div>
    );
  }

  const displayName = otherProfile?.name || (otherId && conversation.participantNames ? conversation.participantNames[otherId] : "Student");
  const otherAvatarPreset = PRESET_AVATARS.find((a) => a.id === otherProfile?.avatarId);

  return (
    <RouteGuard requireAuth={true}>
      <div className="max-w-3xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-white border-2 border-black rounded-3xl shadow-brutal overflow-hidden">
        
        {/* Chat Header */}
        <div className="p-3.5 border-b-2 border-black bg-paper-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/messages"
              className="p-1.5 rounded-xl border-2 border-black bg-white text-black hover:bg-paper-200 shadow-[1.5px_1.5px_0px_#000] transition"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </Link>

            <div className="w-10 h-10 rounded-xl bg-brutal-yellow border-2 border-black flex items-center justify-center font-sans font-black text-black text-sm overflow-hidden shadow-[1.5px_1.5px_0px_#000] shrink-0">
              {otherProfile?.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={otherProfile.photoURL} alt={displayName} className="w-full h-full object-cover" />
              ) : otherAvatarPreset ? (
                <span className="text-base leading-none">{otherAvatarPreset.emoji}</span>
              ) : (
                <span>{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="font-sans font-black text-sm text-black">
                  {displayName}
                </h2>
                <span className="px-1.5 py-0.2 bg-brutal-green text-black text-[9px] font-mono font-bold rounded-md border border-black">
                  Verified
                </span>
              </div>
              <span className="text-[11px] font-mono text-ink-600 block">
                {otherProfile?.course ? `${otherProfile.course} ${otherProfile.year ? `• ${otherProfile.year}` : ""}` : (conversation.listingTitle ? `re: ${conversation.listingTitle}` : "MSRUAS Student")}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {otherProfile?.phone && (
              <a
                href={`tel:${otherProfile.phone}`}
                className="px-3 py-1.5 text-xs font-sans font-black text-black bg-white hover:bg-brutal-green border-2 border-black rounded-xl shadow-[1.5px_1.5px_0px_#000] transition flex items-center space-x-1"
                title={`Call ${displayName}`}
              >
                <Phone className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Call</span>
              </a>
            )}

            {conversation.listingId && (
              <Link
                href={`/listings/${conversation.listingId}`}
                className="px-3 py-1.5 text-xs font-sans font-black text-black bg-brutal-yellow hover:bg-brutal-yellow-light border-2 border-black rounded-xl shadow-[1.5px_1.5px_0px_#000] transition flex items-center space-x-1"
              >
                <span>View Item</span>
                <ExternalLink className="w-3 h-3 stroke-[2.5]" />
              </Link>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF8F5]">
          <div className="text-center my-2">
            <span className="px-3 py-1 bg-white text-black font-mono font-bold rounded-xl text-[10px] border-2 border-black shadow-[1.5px_1.5px_0px_#000]">
              Institutional Peer-to-Peer Verified Chat
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono font-bold text-ink-500">
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
                    className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs font-mono font-bold leading-relaxed border-2 border-black shadow-[2px_2px_0px_#000] ${
                      isMine
                        ? "bg-brutal-yellow text-black rounded-br-none"
                        : "bg-white text-black rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-ink-500 mt-1 px-1">
                    {msg.senderName}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-3.5 border-t-2 border-black bg-paper-50 flex items-center space-x-2.5">
          <input
            type="text"
            required
            placeholder="Type your message to agree on meetup..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white border-2 border-black rounded-xl text-xs sm:text-sm font-mono font-bold text-black shadow-[2px_2px_0px_#000] focus:outline-none focus:ring-2 focus:ring-brutal-yellow"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2.5 bg-brutal-yellow hover:bg-brutal-yellow-light text-black rounded-xl border-2 border-black font-sans font-black text-xs shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </RouteGuard>
  );
}

