// ===== تنبيهات وامضة (Toasts) =====
"use client";
import { create } from "zustand";

export interface Toast {
  id: number;
  message: string;
  tone: "ok" | "info" | "error";
}

interface ToastState {
  toasts: Toast[];
  push: (message: string, tone?: Toast["tone"]) => void;
  dismiss: (id: number) => void;
}

let seq = 1;

export const useToasts = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, tone = "info") => {
    const id = seq++;
    set({ toasts: [...get().toasts, { id, message, tone }] });
    setTimeout(() => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    }, 3200);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) },
  ),
}));

export function toast(message: string, tone: Toast["tone"] = "info") {
  useToasts.getState().push(message, tone);
}

/** نسخ نص إلى الحافظة مع تنبيه عربي */
export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast("تم النسخ إلى الحافظة", "ok");
  } catch {
    toast("تعذّر النسخ", "error");
  }
}

/** مشاركة عبر Web Share API مع نسخ احتياطي */
export async function shareText(title: string, text: string): Promise<void> {
  try {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      await navigator.share({ title, text });
      return;
    }
    await copyText(text);
  } catch {
    /* ألغى المستخدم المشاركة */
  }
}
