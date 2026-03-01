import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { createElement } from "react";
import QuizResultsEmail from "@/emails/quiz-results";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, prenom, animalName, animalType, profileTitle, profileTagline, dimensions } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const db = getDb();
    const doc = await db.collection("completions").add({
      email,
      prenom: prenom || "",
      petName: animalName || "",
      petType: animalType || "",
      profile: {
        profileTitle: profileTitle || "",
        profileTagline: profileTagline || "",
        profileSummary: profileTagline || "",
        personalityTraits: [],
      },
      dimensions: dimensions || {},
      source: "landing-page",
      createdAt: new Date().toISOString(),
    });

    // Send email with results link (fire-and-forget)
    sendResultEmail(email, animalName || "votre animal", doc.id, profileTitle || "").catch(
      (err) => console.error("[save-completion] Email failed:", err)
    );

    return NextResponse.json({ ok: true, id: doc.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[save-completion] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function sendResultEmail(
  email: string,
  petName: string,
  resultId: string,
  profileTitle: string
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002";
  const resultUrl = `${baseUrl}/results/${resultId}`;

  const html = await render(
    createElement(QuizResultsEmail, { petName, profileTitle, resultsUrl: resultUrl })
  );

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: "\u00c2me Animale <contact@ameanimale.fr>",
    to: [email],
    subject: `Les r\u00e9sultats de ${petName} sont pr\u00eats !`,
    html,
  });
}
