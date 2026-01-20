"use server";

import { z } from "zod";
/**
 * Purpose: Handle contact form submissions on the server.
 * Main responsibilities: Validate input and create a Sanity contact document.
 * Key collaborators: Zod for validation and Sanity server client for persistence.
 * Notes/assumptions: Expects standard contact fields in FormData.
 */
import { serverClient } from "@/sanity/lib/serverClient";

/**
 * Purpose: Define validation rules for contact form submissions.
 * Main responsibilities: Enforce required fields and length constraints.
 * Notes/assumptions: Email must be valid and all fields are required.
 */
const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email").max(255, "Email is too long"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject is too long"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(5000, "Message is too long"),
});

/**
 * Purpose: Validate and persist a contact form submission.
 * Main responsibilities: Parse FormData, validate, and write to Sanity.
 * Inputs/outputs: Accepts FormData and returns success/error payloads.
 * Side effects: Creates a Sanity document and logs errors on failure.
 */
export async function submitContactForm(formData: FormData) {
  try {
    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    const validationResult = contactSchema.safeParse(rawData);

    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error.errors[0].message,
      };
    }

    const { name, email, subject, message } = validationResult.data;

    // Create the document in Sanity
    const result = await serverClient.create({
      _type: "contact",
      name,
      email,
      subject,
      message,
      submittedAt: new Date().toISOString(),
      status: "new",
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return {
      success: false,
      error: "Failed to submit the form. Please try again later.",
    };
  }
}
