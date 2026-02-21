
"use client";

import type { GeneratePetPersonalityProfileOutput } from "@/ai/flows/generate-pet-personality-profile-flow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { PawPrint, Share2, Twitter, Facebook, Repeat } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface ProfileDisplayProps {
  profile: GeneratePetPersonalityProfileOutput;
}

export function ProfileDisplay({ profile }: ProfileDisplayProps) {
  const router = useRouter();
  const profileImage = PlaceHolderImages.find(p => p.id === 'profile-placeholder');

  const shareOnTwitter = () => {
    const text = `I just discovered my pet's personality with PawPsych! They are a "${profile.profileTitle}". Find out yours!`;
    const url = window.location.href;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
  };

  const shareOnFacebook = () => {
    const url = window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in-50 zoom-in-95 duration-500">
      <Card className="shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-8 text-center relative">
          {profileImage && (
            <Image
              src={profileImage.imageUrl}
              alt={profileImage.description}
              data-ai-hint={profileImage.imageHint}
              width={120}
              height={120}
              className="rounded-full mx-auto mb-4 border-4 border-white shadow-lg"
            />
          )}
          <CardTitle className="font-headline text-3xl md:text-4xl">{profile.profileTitle}</CardTitle>
          <CardDescription className="text-lg mt-2">{profile.profileSummary}</CardDescription>
        </div>
        
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="font-headline text-xl font-semibold mb-3">Personality Traits</h3>
            <div className="flex flex-wrap gap-2">
              {profile.personalityTraits.map((trait, i) => (
                <Badge key={i} variant="secondary" className="text-base px-3 py-1 bg-primary/10 text-primary-foreground border-primary/20">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-headline text-xl font-semibold mb-3">Detailed Description</h3>
            <p className="text-base leading-relaxed">{profile.detailedDescription}</p>
          </div>

          {profile.funFacts && profile.funFacts.length > 0 && (
            <div>
              <h3 className="font-headline text-xl font-semibold mb-3">Fun Facts</h3>
              <ul className="list-disc list-inside space-y-2">
                {profile.funFacts.map((fact, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <PawPrint className="text-primary w-4 h-4 mt-1 shrink-0" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>

        <CardFooter className="bg-secondary/50 p-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2">
                <Button variant="outline" onClick={shareOnTwitter} aria-label="Share on Twitter">
                    <Twitter />
                </Button>
                <Button variant="outline" onClick={shareOnFacebook} aria-label="Share on Facebook">
                    <Facebook />
                </Button>
            </div>
            <Button onClick={() => router.push('/quiz')}>
                <Repeat className="mr-2" />
                Take Quiz Again
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
