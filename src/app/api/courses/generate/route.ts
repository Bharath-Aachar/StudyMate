
import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { filename, documentText } = await request.json();

        if (
            typeof documentText !== "string" ||
            !documentText.trim() ||
            documentText.length > 50000
        ) {
            return NextResponse.json(
                { error: "Upload a readable PDF first." },
                { status: 400 }
            );
        }

        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "GROQ_API_KEY is missing." },
                { status: 500 }
            );
        }

        const groq = new Groq({ apiKey });

        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: [
                {
                    role: "system",
                    content: `
You create structured study courses from PDF text.

Use only the supplied document.
Do not invent topics or claim the PDF covers unsupported material.
Return valid JSON only, with this structure:
{
  "title": "Course title",
  "description": "One-sentence description",
  "lessons": [
    {
      "title": "Lesson title",
      "summary": "Short summary grounded in the PDF",
      "keyPoints": ["Point supported by the PDF"]
    }
  ]
}

Create 4 to 6 lessons when the source supports that many.
Use fewer lessons for shorter documents.
Each lesson should cover a distinct topic.
Keep each summary under 80 words.
Include only 3 to 5 concise key points per lesson.
Return valid JSON only. Do not include Markdown fences.
          `,
                },
                {
                    role: "user",
                    content: `Filename: ${String(filename || "Uploaded PDF").slice(0, 200)}

PDF TEXT:
${documentText.slice(0, 12000)}`,
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        const content = completion.choices[0]?.message?.content;

        if (!content) {
            throw new Error("The AI returned an empty response.");
        }

        const course = JSON.parse(content);

        if (
            typeof course.title !== "string" ||
            !Array.isArray(course.lessons) ||
            course.lessons.length === 0 ||
            course.lessons.length > 12
        ) {
            throw new Error("The AI returned an invalid lesson outline.");
        }

        return NextResponse.json({
            course: {
                title: course.title,
                description:
                    typeof course.description === "string"
                        ? course.description
                        : "",
                lessons: course.lessons,
            },
        });
    } catch (error) {
        console.error("Course generation error:", error);

        return NextResponse.json(
            { error: "Could not generate lessons. Please try again." },
            { status: 500 }
        );
    }
}
