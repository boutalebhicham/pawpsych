
'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { GeneratePetPersonalityProfileOutput } from '@/ai/flows/generate-pet-personality-profile-flow';
import { ProfileDisplay } from './profile-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

function Results() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const profileParam = searchParams.get('profile');

  if (!profileParam) {
    return <ErrorState message="No profile data found. Please take the quiz first." onRetry={() => router.push('/quiz')}/>;
  }

  try {
    const profile: GeneratePetPersonalityProfileOutput = JSON.parse(decodeURIComponent(profileParam));
    return <ProfileDisplay profile={profile} />;
  } catch (error) {
    console.error("Failed to parse profile data", error);
    return <ErrorState message="There was an error displaying your profile. The data might be corrupted." onRetry={() => router.push('/quiz')}/>;
  }
}

function ErrorState({ message, onRetry }: { message: string, onRetry: () => void }) {
    return (
        <Card className="max-w-2xl mx-auto text-center shadow-lg animate-in fade-in">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 font-headline text-2xl">
                    <AlertTriangle className="text-destructive w-8 h-8"/>
                    Something Went Wrong
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-6">{message}</p>
                <Button onClick={onRetry}>
                    Take the Quiz Again
                </Button>
            </CardContent>
        </Card>
    );
}

export default function ResultsPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Suspense fallback={<p>Loading profile...</p>}>
        <Results />
      </Suspense>
    </div>
  );
}
