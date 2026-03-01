"use server";

import { generatePetPersonalityProfile, type GeneratePetPersonalityProfileInput } from "@/ai/flows/generate-pet-personality-profile-flow";
import { getDb } from "@/lib/firebase-admin";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { createElement } from "react";
import QuizResultsEmail from "@/emails/quiz-results";

interface QuizSubmissionInput extends GeneratePetPersonalityProfileInput {
  email: string;
}

export async function handleQuizSubmission(input: QuizSubmissionInput) {
  const { email, ...aiInput } = input;

  // 1. Generate AI profile
  const profile = await generatePetPersonalityProfile(aiInput);

  // 2. Save to Firestore
  const db = getDb();
  const doc = await db.collection("completions").add({
    email,
    petName: input.petName,
    petType: input.petType,
    quizResponses: input.quizResponses,
    profile,
    createdAt: new Date().toISOString(),
  });

  // 3. Send email with link (fire-and-forget, don't block the user)
  sendResultEmail(email, input.petName, doc.id, profile.profileTitle).catch(
    (err) => console.error("[quiz] Email send failed:", err)
  );

  return { id: doc.id };
}

async function sendResultEmail(
  email: string,
  petName: string,
  resultId: string,
  profileTitle: string
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[quiz] RESEND_API_KEY not set, skipping email");
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9002";
  const resultUrl = `${baseUrl}/results/${resultId}`;

  const html = await render(
    createElement(QuizResultsEmail, { petName, profileTitle, resultsUrl: resultUrl })
  );

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: "Âme Animale <contact@ameanimale.fr>",
    to: [email],
    subject: `Les résultats de ${petName} sont prêts !`,
    html,
  });
}
