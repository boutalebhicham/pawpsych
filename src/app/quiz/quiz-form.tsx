
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
  petName: z.string().min(2, "Pet's name must be at least 2 characters."),
  petType: z.enum(["dog", "cat"], { required_error: "Please select a pet type." }),
  answers: z.record(z.string()).refine(val => Object.keys(val).length === quizQuestions.length, {
    message: "Please answer all questions.",
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
      petName: "",
      petType: undefined,
      answers: {},
    },
  });

  const handleNext = async () => {
    const fieldsToValidate: (keyof QuizFormValues)[] = currentStep === 0 ? ["petName", "petType"] : [];
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
    const { petName, petType, answers } = data;

    const quizResponses = quizQuestions.map(q => ({
      question: q.question,
      answer: answers[q.id.toString()],
    }));

    try {
      const result = await handleQuizSubmission({ petName, petType, quizResponses });
      const stringifiedResult = encodeURIComponent(JSON.stringify(result));
      router.push(`/results?profile=${stringifiedResult}`);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: "We couldn't generate the personality profile. Please try again.",
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
                    <CardTitle className="font-headline text-2xl">First, tell us about your pet</CardTitle>
                    <FormField
                      control={form.control}
                      name="petName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What's your pet's name?</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Buddy" {...field} />
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
                          <FormLabel>Is your pet a dog or a cat?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="dog" /></FormControl>
                                <FormLabel className="font-normal">Dog</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl><RadioGroupItem value="cat" /></FormControl>
                                <FormLabel className="font-normal">Cat</FormLabel>
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
                  Previous
                </Button>
              )}
              <div className="flex-grow"></div>
              {currentStep < totalSteps - 1 && (
                <Button type="button" onClick={handleNext} disabled={isSubmitting}>
                  Next
                </Button>
              )}
              {currentStep === totalSteps - 1 && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Profile...</> : "See Results"}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
