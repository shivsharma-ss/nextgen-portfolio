/**
 * Purpose: Capture chat usage quotas shared between the website and guest logic.
 * Main responsibilities: Define per-day/session/message limits for guest and signed-in users.
 */
import { defineField, defineType } from "sanity";

const numberField = (
  name: string,
  title: string,
  description: string,
  defaultValue: number,
) =>
  defineField({
    name,
    title,
    type: "number",
    description,
    initialValue: defaultValue,
    validation: (Rule) => Rule.required().min(1).max(1000),
  });

export default defineType({
  name: "chatUsageLimits",
  title: "Chat Usage Limits",
  type: "document",
  fields: [
    numberField(
      "freeSessionsPerDay",
      "Free Sessions Per Day",
      "How many ChatKit sessions a visitor can start without signing in.",
      3,
    ),
    numberField(
      "freeMessagesPerDay",
      "Free Messages Per Day",
      "Daily message allowance for anonymous visitors.",
      20,
    ),
    numberField(
      "authSessionsPerDay",
      "Authenticated Sessions Per Day",
      "Session quota for signed-in users.",
      10,
    ),
    numberField(
      "authMessagesPerDay",
      "Authenticated Messages Per Day",
      "Daily message allowance for signed-in visitors.",
      50,
    ),
    numberField(
      "sessionMinutes",
      "Session Lifetime (minutes)",
      "How long each ChatKit session remains valid before reauthorization.",
      30,
    ),
    numberField(
      "cooldownHours",
      "Cooldown Between Sessions (hours)",
      "Minimum wait time between session creations for a single subject.",
      1,
    ),
  ],
});
