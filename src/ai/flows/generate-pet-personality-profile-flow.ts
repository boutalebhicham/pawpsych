'use server';
/**
 * @fileOverview A Genkit flow for generating a detailed pet personality profile based on quiz answers.
 *
 * - generatePetPersonalityProfile - A function that handles the pet personality profile generation process.
 * - GeneratePetPersonalityProfileInput - The input type for the generatePetPersonalityProfile function.
 * - GeneratePetPersonalityProfileOutput - The return type for the generatePetPersonalityProfile function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePetPersonalityProfileInputSchema = z.object({
  petType: z.enum(['dog', 'cat']).describe('The type of pet (dog or cat).'),
  petName: z.string().describe('The name of the pet.'),
  quizResponses: z
    .array(
      z.object({
        question: z.string().describe('The question from the personality quiz.'),
        answer: z.string().describe('The pet owner\'s answer to the question.'),
      })
    )
    .describe('An array of questions and answers from the pet personality quiz.'),
});
export type GeneratePetPersonalityProfileInput = z.infer<
  typeof GeneratePetPersonalityProfileInputSchema
>;

const GeneratePetPersonalityProfileOutputSchema = z.object({
  profileTitle: z.string().describe('A catchy and descriptive title for the personality profile.'),
  profileSummary:
    z.string().describe('A short, engaging summary that encapsulates the pet\'s main traits.'),
  personalityTraits: z
    .array(z.string())
    .describe('An array of 3-5 key adjectives or short phrases describing the pet\'s personality.'),
  detailedDescription:
    z.string().describe('A longer, narrative description elaborating on the pet\'s character, behaviors, and what makes them unique.'),
  funFacts: z
    .array(z.string())
    .optional()
    .describe('An optional array of 1-3 delightful and engaging tidbits or habits specific to the pet.'),
});
export type GeneratePetPersonalityProfileOutput = z.infer<
  typeof GeneratePetPersonalityProfileOutputSchema
>;

export async function generatePetPersonalityProfile(
  input: GeneratePetPersonalityProfileInput
): Promise<GeneratePetPersonalityProfileOutput> {
  return generatePetPersonalityProfileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePetPersonalityProfilePrompt',
  input: {schema: GeneratePetPersonalityProfileInputSchema},
  output: {schema: GeneratePetPersonalityProfileOutputSchema},
  prompt: `You are 'PawPsych', an expert pet personality profiler. Your task is to analyze the provided quiz answers about a pet and generate a unique, detailed, and engaging personality profile. The profile should be creative, insightful, and capture the true essence of the pet's character.

Pet Type: {{{petType}}}
Pet Name: {{{petName}}}

Here are the quiz responses describing {{{petName}}}'s behaviors and traits:
{{#each quizResponses}}
  - Question: {{{question}}}
  - Answer: {{{answer}}}
{{/each}}

Based on these details, craft a personality profile for {{{petName}}}. Focus on making it sound warm, playful, and insightful, as if written by a professional pet psychologist. The profile should be formatted as a JSON object with the following structure:
- 'profileTitle': A catchy and descriptive title for the personality profile.
- 'profileSummary': A short, engaging summary that encapsulates the pet's main traits.
- 'personalityTraits': An array of 3-5 key adjectives or short phrases describing the pet's personality.
- 'detailedDescription': A longer, narrative description elaborating on {{{petName}}}'s character, behaviors, and what makes them unique.
- 'funFacts': An optional array of 1-3 delightful and engaging tidbits or habits specific to {{{petName}}}. If no good fun facts can be inferred, omit this field.
`,
});

const generatePetPersonalityProfileFlow = ai.defineFlow(
  {
    name: 'generatePetPersonalityProfileFlow',
    inputSchema: GeneratePetPersonalityProfileInputSchema,
    outputSchema: GeneratePetPersonalityProfileOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
