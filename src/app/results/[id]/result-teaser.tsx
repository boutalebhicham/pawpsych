"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, Sparkles } from "lucide-react";
import { useState } from "react";

interface ResultTeaserProps {
  resultId: string;
  petName: string;
  petType: string;
  profileTitle: string;
  profileSummary: string;
  personalityTraits: string[];
}

export function ResultTeaser({
  resultId,
  petName,
  petType,
  profileTitle,
  profileSummary,
  personalityTraits,
}: ResultTeaserProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animalName: petName, resultId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in-50 zoom-in-95 duration-500 space-y-6">
      <Card className="shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
            {petName} est
          </p>
          <CardTitle className="font-headline text-3xl md:text-4xl">
            {profileTitle}
          </CardTitle>
          <p className="text-lg mt-3 text-muted-foreground">{profileSummary}</p>
        </div>

        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="font-headline text-xl font-semibold mb-3">
              Traits de personnalité
            </h3>
            <div className="flex flex-wrap gap-2">
              {personalityTraits.map((trait, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-base px-3 py-1 bg-primary/10 text-primary-foreground border-primary/20"
                >
                  {trait}
                </Badge>
              ))}
            </div>
          </div>

          {/* Blurred / locked section */}
          <div className="relative">
            <div className="space-y-4 filter blur-sm select-none pointer-events-none" aria-hidden>
              <h3 className="font-headline text-xl font-semibold">
                Analyse détaillée
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </p>
              <h3 className="font-headline text-xl font-semibold">
                Points forts & conseils
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                Duis aute irure dolor in reprehenderit in voluptate velit esse
                cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                cupidatat non proident.
              </p>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background/90 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg border max-w-sm">
                <Lock className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <p className="font-semibold text-lg mb-1">
                  Rapport complet verrouillé
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Débloquez l'analyse détaillée, les conseils personnalisés et
                  le rapport PDF complet de {petName}.
                </p>
                <Button
                  size="lg"
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {loading
                    ? "Redirection..."
                    : "Obtenir le rapport complet — 14,99€"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Un email avec le lien vers cette page vous a été envoyé.
        <br />
        Vous pouvez y revenir à tout moment.
      </p>
    </div>
  );
}
