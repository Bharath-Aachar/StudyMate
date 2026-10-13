import Groq from "groq-sdk";

export async function POST(request: Request) {
  try {
    const { question, lesson, history = [] } =
      await request.json();

    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 4000
    ) {
      return Response.json(
        { error: "Enter a valid question." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "GROQ_API_KEY is missing." },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });

    const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are StudyMate, a friendly AI tutor for college students.

       RESPONSE RULES:
      - Keep answers simple, clear, and concise.
      - Default to 100-150 words maximum.
      - Start with a one-sentence definition.
      - Use short headings and bullet points.
      - Give only one simple real-world example.
      - Use emojis sparingly.
      - For coding questions, show a small code example when useful.
      - For complex topics, explain step by step.
      - Avoid unnecessary introductions and conclusions.
      - If asked for more detail, expand the explanation.
      - Never invent facts or citations.

      FORMAT:
      **Simple explanation**
       Explain the concept in 2-3 sentences.

      **Example**
        Give one relatable example.

      **Remember**
       End with one key takeaway.

          Skip sections that aren't useful for the question.
         Current lesson: ${typeof lesson === "string" ? lesson.slice(0, 200) : "General study"
          }`,
      },
      ...(Array.isArray(history) ? history.slice(-10) : []),
      { role: "user", content: question.trim() },
    ];

    const stream = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages,
      stream: true,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content =
              chunk.choices[0]?.delta?.content;

            if (typeof content === "string" && content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch {
          controller.error(
            new Error("Streaming failed. Please try again.")
          );
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    console.error("StudyMate streaming error:", error);

    return Response.json(
      { error: "AI request failed. Check the terminal." },
      { status: 500 }
    );
  }
}