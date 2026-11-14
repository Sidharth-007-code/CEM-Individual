"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { InAppNotification } from "@/types/report";
import Link from "next/link";

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const notifsRef = collection(db, `notifications/${user.uid}/items`);
    const q = query(notifsRef, orderBy("createdAt", "desc"), limit(10));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as InAppNotification[];
        setNotifications(items);
      },
      (err) => {
        // Suppress initial empty subcollection index warnings
      }
    );

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      const notifRef = doc(db, `notifications/${user.uid}/items`, id);
      await updateDoc(notifRef, { read: true });
    } catch (err) {
      console.error("Failed to mark notification read", err);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 sm:p-2 text-black bg-white hover:bg-brutal-yellow/30 border-2 border-black rounded-xl shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] relative transition"
        title="Notifications"
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 min-w-[18px] h-[18px] bg-brutal-pink text-white font-mono text-[9px] font-black rounded-full border border-black shadow-[1px_1px_0px_#000] flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-brutal border-2 border-black z-50 overflow-hidden">
            <div className="p-3 border-b-2 border-black flex items-center justify-between bg-paper-100">
              <h4 className="text-xs font-sans font-black tracking-wider uppercase text-black">
                Campus Alerts
              </h4>
              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-black text-black">
                {unreadCount} unread
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y-2 divide-black/10">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono font-bold text-ink-500">
                  No campus notices at this time.
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 text-xs flex items-start justify-between space-x-2 hover:bg-paper-100 transition ${
                      !item.read ? "bg-brutal-yellow/20 font-medium" : ""
                    }`}
                  >
                    <div className="flex-1">
                      {item.link ? (
                        <Link
                          href={item.link}
                          onClick={() => setIsOpen(false)}
                          className="text-black hover:underline font-medium line-clamp-2"
                        >
                          {item.text}
                        </Link>
                      ) : (
                        <p className="text-ink-800 line-clamp-2">{item.text}</p>
                      )}
                    </div>
                    {!item.read && (
                      <button
                        onClick={(e) => markAsRead(item.id, e)}
                        className="text-black hover:text-brutal-purple-dark p-1 rounded-md border border-black bg-white hover:bg-paper-100 shadow-[1px_1px_0px_#000] shrink-0"
                        title="Mark read"
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

