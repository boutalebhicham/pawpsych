import { getDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { ResultTeaser } from "./result-teaser";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: Props) {
  const { id } = await params;

  const db = getDb();
  const doc = await db.collection("completions").doc(id).get();
  if (!doc.exists) return notFound();

  const data = doc.data()!;
  const profile = data.profile;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
      <ResultTeaser
        resultId={id}
        petName={data.petName}
        petType={data.petType}
        profileTitle={profile.profileTitle}
        profileSummary={profile.profileSummary}
        personalityTraits={profile.personalityTraits}
      />
    </div>
  );
}
