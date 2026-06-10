import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const ChatInput = z.object({
  messages: z.array(MessageSchema).min(1).max(30),
});

const SYSTEM_PROMPT = `You are MukubaBot, a friendly assistant for the Smart Mukuba University Suggestion Box platform.

About the platform:
- Students, staff and stakeholders of Mukuba University submit suggestions, complaints, or ideas about campus life.
- Categories: Academics, Hostel, Cafeteria, Security, ICT, Infrastructure, Sports, Administration.
- Submissions can be anonymous. Each suggestion has a status: Pending, Under Review, In Progress, Resolved, or Denied.
- Staff respond and update statuses; admins manage the platform and can mass-reply.
- The Transparency Portal shows public suggestions with their current status so anyone can see how the university is responding.
- AI features: smart duplicate detection groups similar complaints automatically.
- Users sign in to submit and track their own suggestions under "My suggestions".

Your job:
- Answer questions about how the platform works, where to find things, how to submit, how statuses are updated, and what responses mean.
- If asked about specific suggestions or status of someone's submission, point them to the Transparency Portal or their "My suggestions" page — you do not have access to live data.
- Be concise (2-5 sentences). Friendly, helpful, plain language.
- If the question is off-topic, gently steer back to the platform.`;

export const chatWithBot = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "custom",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages],
      }),
    });

    if (res.status === 429) throw new Error("Too many requests — please wait a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Please contact the administrator.");
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI request failed: ${t.slice(0, 200)}`);
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = json.choices?.[0]?.message?.content?.trim() ?? "Sorry, I couldn't generate a reply.";
    return { reply };
  });
