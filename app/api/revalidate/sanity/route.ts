import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";

type WebhookPayload = {
  _type?: string;
};

const SANITY_WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!SANITY_WEBHOOK_SECRET) {
    return new Response("Missing SANITY_WEBHOOK_SECRET", { status: 500 });
  }

  const { body, isValidSignature } = await parseBody<WebhookPayload>(
    request,
    SANITY_WEBHOOK_SECRET,
  );

  if (!isValidSignature) {
    return new Response("Invalid signature", { status: 401 });
  }

  if (!body?._type) {
    return new Response("Missing document type", { status: 400 });
  }

  revalidateTag("sanity", {});

  return Response.json({ revalidated: ["sanity"] });
}
