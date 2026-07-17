import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Webhook } from "svix";

const envPath = resolve(process.cwd(), ".env.local");
const envText = readFileSync(envPath, "utf8");
const secretLine = envText
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.startsWith("RESEND_WEBHOOK_SECRET="))
  .at(-1);
const secret = secretLine?.split("=")[1]?.trim();

if (!secret) {
  console.error("RESEND_WEBHOOK_SECRET missing in .env.local");
  process.exit(1);
}

const emailSendId = process.argv[2] ?? "64a240b7-29b9-49cf-a00b-6ab4a34af2bb";
const url = process.env.WEBHOOK_URL ?? "http://localhost:3000/api/v1/webhooks/resend";
const webhook = new Webhook(secret);

async function send(label, { svixId, body, signature, timestamp }) {
  const svixTimestamp = timestamp ?? Math.floor(Date.now() / 1000).toString();
  const svixSignature = signature ?? webhook.sign(svixId, svixTimestamp, body);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    },
    body,
  });
  const text = await response.text();
  console.log(`[${label}] ${response.status} ${text}`);
  return response.status;
}

const payload = JSON.stringify({
  type: "email.delivered",
  data: {
    email_id: "resend-test-msg-001",
    created_at: new Date().toISOString(),
    tags: [{ name: "email_send_id", value: emailSendId }],
  },
});

const replayId = `evt_live_test_delivered_${Date.now()}`;
await send("invalid signature", {
  svixId: "evt_invalid_sig",
  body: payload,
  signature: "v1,invalidsignaturevalue0000000000000000000000000000000000==",
});
await send("valid delivered event", { svixId: replayId, body: payload });
await send("replay same svix-id", { svixId: replayId, body: payload });
