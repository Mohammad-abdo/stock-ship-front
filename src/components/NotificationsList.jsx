import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import hugeicon from "../assets/imgs/hugeicons_notification-01.png";
import { ROUTES } from "../routes";
import { notificationService } from "../services/notificationService";
import { useAuth } from "../contexts/AuthContext";

export default function NotificationsList() {
  const { t, i18n } = useTranslation();
  const currentDir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      
      if (response.data.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.data.success) {
        setUnreadCount(response.data.data?.count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  return (
    <div dir={currentDir} className="bg-white my-25">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-8 pt-30">
        {/* Top info bar */}
        <div className={`flex items-center gap-2 rounded-sm bg-blue-200/70 px-4 py-3 text-lg font-bold text-slate-700 ${currentDir === 'rtl' ? 'justify-start' : 'justify-start'}`}>
          <span className={currentDir === 'rtl' ? 'text-right' : 'text-left'}>
            {t("notifications.requestAccepted")}{" "}
            <Link
              to={ROUTES.PAYMENT_ONE}
              className="font-semibold text-amber-600 hover:text-amber-700 px-2 underline"
            >
              {t("notifications.clickHere")}
            </Link>
          </span>
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs">
            i
          </span>
        </div>

        {/* List */}
        {loading ? (
          <div className="mt-3 text-center py-12">
            <div className="text-slate-500">جاري التحميل...</div>
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-sm border border-slate-200 bg-white">
            {notifications.length > 0 ? (
              notifications.map((notification, idx) => (
                <div
                  key={notification.id || idx}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                  className={`flex items-start gap-3 px-4 py-4 cursor-pointer hover:bg-slate-50 transition ${
                    idx !== notifications.length - 1 ? "border-b border-slate-200" : ""
                  } ${!notification.isRead ? 'bg-blue-50/50' : ''} ${currentDir === 'rtl' ? 'flex-row-reverse' : ''}`}
                >
                  <img 
                    src={hugeicon}  
                    className={`rounded-md shadow-xl mt-1 ${currentDir === 'rtl' ? 'ml-2' : 'mr-2'}`} 
                    title="hugeicons" 
                    alt="hugeicons" 
                  />
                  <div className={`flex-1 ${currentDir === 'rtl' ? 'text-right' : 'text-left'}`}>
                    <p className={`leading-7 text-slate-700 text-lg font-bold ${!notification.isRead ? 'font-extrabold' : ''}`}>
                      {notification.title || notification.message || t("notifications.notificationText")}
                    </p>
                    {notification.message && notification.message !== notification.title && (
                      <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                    )}
                  </div>
                  {!notification.isRead && (
                    <span className="h-2 w-2 rounded-full bg-blue-600 mt-2"></span>
                  )}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-500">
                {t("orders.noOrders")}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
