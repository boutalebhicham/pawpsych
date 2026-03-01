"use server";

import { cookies } from "next/headers";
import { createHash, randomInt } from "crypto";
import { Resend } from "resend";

const ADMIN_EMAIL = "boutalebhicham.mail@gmail.com";

// In-memory store for OTP codes (survives within the same server process)
const otpStore = new Map<string, { code: string; expires: number }>();

function makeSessionToken(email: string) {
  const secret = process.env.RESEND_API_KEY || "fallback-secret";
  return createHash("sha256").update(`admin-session:${email}:${secret}`).digest("hex");
}

export async function sendAdminCode(email: string) {
  if (email.toLowerCase().trim() !== ADMIN_EMAIL) {
    return { error: "Accès refusé." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { error: "RESEND_API_KEY non configuré." };
  }

  const code = String(randomInt(100000, 999999));
  otpStore.set(ADMIN_EMAIL, { code, expires: Date.now() + 10 * 60 * 1000 }); // 10 min

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: "\u00c2me Animale <contact@ameanimale.fr>",
    to: [ADMIN_EMAIL],
    subject: `Code admin : ${code}`,
    html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f7f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:400px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <div style="background:#111;padding:24px;text-align:center;">
    <div style="font-size:18px;font-weight:900;color:#fff;">\u00c2me Animale — Admin</div>
  </div>
  <div style="padding:32px;text-align:center;">
    <p style="color:#666;margin:0 0 16px;">Votre code de connexion :</p>
    <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#111;padding:16px;background:#f4f4f5;border-radius:8px;">${code}</div>
    <p style="color:#999;font-size:13px;margin:16px 0 0;">Valable 10 minutes.</p>
  </div>
</div></body></html>`,
  });

  return { ok: true };
}

export async function verifyAdminCode(code: string) {
  const entry = otpStore.get(ADMIN_EMAIL);
  if (!entry) {
    return { error: "Aucun code envoyé. Recommencez." };
  }

  if (Date.now() > entry.expires) {
    otpStore.delete(ADMIN_EMAIL);
    return { error: "Code expiré. Recommencez." };
  }

  if (entry.code !== code.trim()) {
    return { error: "Code incorrect." };
  }

  otpStore.delete(ADMIN_EMAIL);

  const token = makeSessionToken(ADMIN_EMAIL);
  const jar = await cookies();
  jar.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/admin",
  });

  return { ok: true };
}

export async function adminLogout() {
  const jar = await cookies();
  jar.delete("admin_token");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get("admin_token")?.value;
  if (!token) return false;
  return token === makeSessionToken(ADMIN_EMAIL);
}
