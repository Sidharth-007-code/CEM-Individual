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
        className="p-2 text-ink-700 hover:text-ink-950 relative rounded-full hover:bg-paper-200 transition"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-saffron-500 text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
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
          <div className="absolute right-0 mt-2 w-80 bg-paper-50 rounded-notice shadow-float border border-ink-100 z-50 overflow-hidden">
            <div className="p-3 border-b border-ink-100 flex items-center justify-between bg-paper-100">
              <h4 className="text-xs font-serif font-bold tracking-wider uppercase text-ink-900">
                Campus Alerts
              </h4>
              <span className="text-[11px] font-mono text-ink-600">
                {unreadCount} unread
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-ink-100">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-ink-500 italic">
                  No campus notices at this time.
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 text-xs flex items-start justify-between space-x-2 hover:bg-paper-100 transition ${
                      !item.read ? "bg-saffron-50/60 font-medium" : ""
                    }`}
                  >
                    <div className="flex-1">
                      {item.link ? (
                        <Link
                          href={item.link}
                          onClick={() => setIsOpen(false)}
                          className="text-ink-900 hover:text-saffron-600 line-clamp-2"
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
                        className="text-ink-500 hover:text-saffron-600 p-1"
                        title="Mark read"
                      >
                        <Check className="w-3.5 h-3.5" />
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

