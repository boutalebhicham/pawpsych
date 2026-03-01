
"use client";

import { useState } from "react";
import { useForm, type FieldValues } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";

import { quizQuestions } from "@/lib/quiz-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { handleQuizSubmission } from "./actions";

const formSchema = z.object({
  email: z.string().email("Veuillez entrer un email valide."),
  petName: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  petType: z.enum(["dog", "cat"], { required_error: "Veuillez sélectionner un type." }),
  answers: z.record(z.string()).refine(val => Object.keys(val).length === quizQuestions.length, {
    message: "Veuillez répondre à toutes les questions.",
  }),
});

type QuizFormValues = z.infer<typeof formSchema>;

export function QuizForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalSteps = quizQuestions.length + 1;

  const form = useForm<QuizFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      petName: "",
      petType: undefined,
      answers: {},
    },
  });

  const handleNext = async () => {
    const fieldsToValidate: (keyof QuizFormValues)[] = currentStep === 0 ? ["email", "petName", "petType"] : [];
    if (currentStep > 0) {
      // No specific field to validate for answers on each step as we check at the end.
      // We just need to ensure an option is selected.
      const questionId = quizQuestions[currentStep - 1].id.toString();
      if (!form.getValues("answers")[questionId]) {
        form.setError(`answers.${questionId}` as any, { type: "manual", message: "Please select an answer." });
        return;
      }
      form.clearErrors(`answers.${questionId}` as any);
    }
    
    const isValid = await form.trigger(fieldsToValidate.length > 0 ? fieldsToValidate : undefined);
    if (isValid && currentStep < totalSteps -1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const onSubmit = async (data: QuizFormValues) => {
    setIsSubmitting(true);
    const { email, petName, petType, answers } = data;

    const quizResponses = quizQuestions.map(q => ({
      question: q.question,
      answer: answers[q.id.toString()],
    }));

    try {
      const { id } = await handleQuizSubmission({ email, petName, petType, quizResponses });
      router.push(`/results/${id}`);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Oups, une erreur est survenue.",
        description: "Impossible de générer le profil. Veuillez réessayer.",
      });
      setIsSubmitting(false);
    }
  };
  
  const progressValue = (currentStep / (totalSteps -1)) * 100;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <Progress value={progressValue} className="w-full" />
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 0 && (
                  <div className="space-y-6">
                    <CardTitle className="font-headline text-2xl">Parlez-nous de votre animal</CardTitle>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Votre email (pour recevoir les résultats)</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="exemple@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="petName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comment s'appelle votre animal ?</FormLabel>
                          <FormControl>
                            <Input placeholder="ex: Buddy" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="petType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>C'est un chien ou un chat ?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="dog" /></FormControl>
                                <FormLabel className="font-normal">Chien</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="cat" /></FormControl>
                                <FormLabel className="font-normal">Chat</FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
                {currentStep > 0 && (
                  <FormField
                    control={form.control}
                    name={`answers.${quizQuestions[currentStep - 1].id}`}
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-xl font-semibold">{quizQuestions[currentStep - 1].question}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-2"
                          >
                            {quizQuestions[currentStep - 1].options.map((option, i) => (
                              <FormItem key={i} className="flex items-center space-x-3 space-y-0 p-3 rounded-lg border has-[[data-state=checked]]:bg-secondary transition-colors">
                                <FormControl><RadioGroupItem value={option} /></FormControl>
                                <FormLabel className="font-normal text-base">{option}</FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between items-center pt-4">
              {currentStep > 0 && (
                <Button type="button" variant="outline" onClick={handlePrev} disabled={isSubmitting}>
                  Précédent
                </Button>
              )}
              <div className="flex-grow"></div>
              {currentStep < totalSteps - 1 && (
                <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                  Suivant
                </Button>
              )}
              {currentStep === totalSteps - 1 && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Génération en cours...</> : "Voir les résultats"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
