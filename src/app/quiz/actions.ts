
"use server";

import { generatePetPersonalityProfile, type GeneratePetPersonalityProfileInput } from "@/ai/flows/generate-pet-personality-profile-flow";

export async function handleQuizSubmission(input: GeneratePetPersonalityProfileInput) {
    try {
        const profile = await generatePetPersonalityProfile(input);
        return profile;
    } catch (error) {
        console.error("Error generating pet personality profile:", error);
        throw new Error("Failed to generate profile from AI.");
    }
}
