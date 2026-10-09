import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { question, lesson } = await request.json();

    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 4000
    ) {
      return NextResponse.json(
        { error: "Enter a valid question." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is missing from .env.local." },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You are StudyMate, a friendly AI tutor. Explain concepts clearly using simple language, practical examples, and step-by-step explanations.",
        },
        {
          role: "user",
          content: `Current lesson: ${
            typeof lesson === "string"
              ? lesson.slice(0, 200)
              : "General study"
          }\n\nQuestion: ${question.trim()}`,
        },
      ],
    });

    return NextResponse.json({
      answer:
        completion.choices[0]?.message?.content ||
        "I couldn't generate an answer. Please try again.",
    });
  } catch (error) {
    console.error("Groq API error:", error);

    return NextResponse.json(
      { error: "AI request failed. Check the VS Code terminal." },
      { status: 500 }
    );
  }
}