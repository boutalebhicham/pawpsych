
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { PawPrint } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-dog-cat');

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
        <div className="order-2 md:order-1 animate-in fade-in slide-in-from-left duration-500">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <PawPrint className="text-primary w-8 h-8"/>
                <h1 className="text-4xl font-headline font-bold text-foreground">
                  PawPsych
                </h1>
              </div>
              <CardTitle className="font-headline text-3xl md:text-4xl font-bold">
                Unlock Your Pet's True Personality.
              </CardTitle>
              <CardDescription className="text-lg pt-2">
                Ever wonder what your furry friend is really thinking? Our fun, AI-powered quiz reveals the unique personality of your dog or cat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-muted-foreground">
                Get a detailed personality profile, discover their quirks, and understand them better than ever before. It's fast, easy, and a whole lot of fun!
              </p>
              <Link href="/quiz">
                <Button size="lg" className="w-full md:w-auto font-bold text-lg">
                  Start the Quiz
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <div className="order-1 md:order-2 animate-in fade-in slide-in-from-right duration-500">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              data-ai-hint={heroImage.imageHint}
              width={600}
              height={600}
              className="rounded-xl shadow-2xl aspect-square object-cover w-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}
