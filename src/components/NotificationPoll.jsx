import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { notificationService } from "../services/notificationService";
import { ROUTES } from "../routes";

const POLL_INTERVAL_MS = 25000;

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // ignore if audio not supported
  }
}

export default function NotificationPoll() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const previousCountRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      previousCountRef.current = null;
      return;
    }

    const fetchAndNotify = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await notificationService.getUnreadCount();
        if (!mountedRef.current) return;
        if (!res?.data?.success) return;
        const count = res.data.data?.count ?? 0;
        const prev = previousCountRef.current;
        if (prev !== null && count > prev) {
          playNotificationSound();
          toast(t("notifications.newNotifications"), {
            action: {
              label: t("common.view"),
              onClick: () => navigate(ROUTES.NOTIFICATION),
            },
          });
        }
        previousCountRef.current = count;
      } catch {
        // ignore
      }
    };

    // Set initial count so we don't toast on first load
    fetchAndNotify();
    const interval = setInterval(fetchAndNotify, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, t, navigate]);

  return null;
}
