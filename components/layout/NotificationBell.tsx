"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { InAppNotification } from "@/types/report";
import Link from "next/link";
import { Card } from "@/components/ui";

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
        className="p-2 text-modern-text-secondary bg-modern-surface hover:bg-modern-surface-hover border border-modern-border rounded-xl shadow-modern-sm hover:shadow-modern-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modern-accent focus-visible:ring-offset-2 relative transition"
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 px-1.5 min-w-[18px] h-[18px] bg-modern-primary text-white font-mono text-[9px] font-semibold rounded-full border-2 border-modern-surface shadow-modern-sm flex items-center justify-center" aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setIsOpen(false)}
            aria-label="Close notifications"
          />
          <Card variant="elevated" padding="none" className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] z-50 overflow-hidden">
            <div className="p-3 border-b border-modern-border flex items-center justify-between bg-modern-surface-hover">
              <h4 className="text-xs font-sans font-semibold tracking-wider uppercase text-modern-text-primary">
                Campus Alerts
              </h4>
              <span className="text-[10px] font-mono font-semibold bg-modern-surface px-2 py-0.5 rounded-lg border border-modern-border text-modern-text-secondary">
                {unreadCount} unread
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-modern-border/70">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono font-medium text-modern-text-tertiary">
                  No campus notices at this time.
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 text-xs flex items-start justify-between space-x-2 hover:bg-modern-surface-hover transition-colors ${
                      !item.read ? "bg-modern-primary-light/50 font-medium" : ""
                    }`}
                  >
                    <div className="flex-1">
                      {item.link ? (
                        <Link
                          href={item.link}
                          onClick={() => setIsOpen(false)}
                          className="text-modern-text-primary hover:text-modern-primary hover:underline font-medium line-clamp-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modern-accent rounded-sm"
                        >
                          {item.text}
                        </Link>
                      ) : (
                        <p className="text-modern-text-secondary line-clamp-2">{item.text}</p>
                      )}
                    </div>
                    {!item.read && (
                      <button
                        onClick={(e) => markAsRead(item.id, e)}
                        className="text-modern-text-tertiary hover:text-modern-primary p-1.5 rounded-lg border border-modern-border bg-modern-surface hover:bg-modern-surface-hover hover:shadow-modern-sm shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modern-accent focus-visible:ring-offset-1"
                        title="Mark read"
                        aria-label="Mark notification as read"
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

