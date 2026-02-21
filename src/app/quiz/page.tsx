
import { QuizForm } from "./quiz-form";

export default function QuizPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-headline font-bold">Pet Personality Quiz</h1>
        <p className="text-muted-foreground mt-2 text-lg">Let's get to know your furry friend!</p>
      </div>
      <QuizForm />
    </div>
  );
}
