import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { extractText } from "unpdf";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const MAX_PAGES = 300;

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  // 1. FILE UPLOAD & PARSING (multipart/form-data)
  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: "No file was uploaded." },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        return NextResponse.json(
          {
            error: `File size (${sizeMb} MB) exceeds the 20MB limit. Please upload a smaller file.`,
          },
          { status: 400 }
        );
      }

      const fileName = file.name;
      const fileType = file.type;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const isPdf =
        fileType === "application/pdf" ||
        fileName.toLowerCase().endsWith(".pdf");
      const isImage =
        fileType.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileName);
      const isTextDoc =
        fileType.startsWith("text/") ||
        fileType === "application/json" ||
        /\.(txt|md|csv|json|py|js|ts|tsx|jsx|html|css|sql|env)$/i.test(fileName);

      let extractedText = "";
      let totalPages: number | undefined;
      let previewUrl: string | undefined;

      if (isPdf) {
        try {
          const result = await extractText(new Uint8Array(arrayBuffer), {
            mergePages: true,
          });

          totalPages = result.totalPages;

          if (totalPages && totalPages > MAX_PAGES) {
            return NextResponse.json(
              {
                error: `PDF document has ${totalPages} pages, which exceeds the maximum limit of ${MAX_PAGES} pages.`,
              },
              { status: 400 }
            );
          }

          extractedText = typeof result.text === "string" ? result.text : "";
        } catch (pdfErr) {
          console.error("PDF extraction error:", pdfErr);
          return NextResponse.json(
            {
              error:
                "Unable to read PDF contents. The file may be password protected or corrupted.",
            },
            { status: 400 }
          );
        }
      } else if (isImage) {
        const mime = fileType || "image/jpeg";
        const base64Data = buffer.toString("base64");
        previewUrl = `data:${mime};base64,${base64Data}`;
        extractedText = `[Uploaded Image: ${fileName}]`;
      } else if (isTextDoc) {
        extractedText = buffer.toString("utf-8");
      } else {
        extractedText = buffer.toString("utf-8");
      }

      const trimmedText = extractedText.slice(0, 150000);

      return NextResponse.json({
        success: true,
        fileName,
        fileSize: file.size,
        fileType: isPdf ? "pdf" : isImage ? "image" : "document",
        mimeType: fileType,
        totalPages: totalPages ?? null,
        previewUrl: previewUrl ?? null,
        extractedText: trimmedText,
        charCount: extractedText.length,
      });
    } catch (error) {
      console.error("Upload error:", error);
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Failed to process uploaded file.",
        },
        { status: 500 }
      );
    }
  }

  // 2. AI PRACTICE GENERATION (application/json)
  try {
    const { action, fileName, content, question } = await request.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "No document content provided." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured in .env." },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });
    const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
    const contextSnippet = content.slice(0, 25000);

    if (action === "summarize") {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are StudyMate, an expert academic tutor. Summarize the provided study material clearly. Structure your response with:\n1. 📌 Executive Summary (2-3 sentences)\n2. 🔑 Core Concepts & Key Takeaways (bullet points)\n3. 💡 High-Yield Study Tips / Memory Tricks.",
          },
          {
            role: "user",
            content: `Document Name: ${fileName || "Uploaded Material"}\n\nContent:\n${contextSnippet}`,
          },
        ],
      });

      return NextResponse.json({
        result:
          completion.choices[0]?.message?.content ||
          "Could not generate a summary. Please try again.",
      });
    }

    if (action === "quiz") {
      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return NextResponse.json(
          {
            error:
              "GEMINI_API_KEY is missing from .env. Please configure your Google Gemini API key to generate practice quizzes.",
          },
          { status: 500 }
        );
      }

      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      const prompt = `You are StudyMate, an expert academic examination designer.
Analyze the provided study document and generate exactly 10 high-quality multiple-choice questions (MCQs) that thoroughly test the student's comprehension of the material.

Document Name: ${fileName || "Uploaded Material"}
Document Content:
${contextSnippet}

Requirements:
1. Create exactly 10 distinct, challenging, and relevant MCQs covering key concepts, definitions, and applications from the text.
2. For each question, provide exactly 4 options.
3. Indicate the zero-based index of the correct option (0, 1, 2, or 3).
4. Provide a clear, educational explanation for why the correct option is right.

Format your output strictly as a JSON array of objects:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this answer is correct."
  }
]`;

      let responseText = "";
      let lastErrorMessage = "";
      const modelsToTry = [
        "gemini-3.5-flash",
        process.env.GEMINI_MODEL || "gemini-3.8-flash",
        "gemini-flash-latest",
        "gemini-3.7-flash",
      ];

      for (const m of modelsToTry) {
        try {
          const resp = await ai.models.generateContent({
            model: m,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });
          if (resp.text) {
            responseText = resp.text;
            break;
          }
        } catch (mErr) {
          lastErrorMessage = mErr instanceof Error ? mErr.message : String(mErr);
          console.warn(`Model ${m} failed, trying next fallback...`, mErr);
        }
      }

      if (!responseText) {
        return NextResponse.json(
          {
            error:
              lastErrorMessage ||
              "Google Gemini is currently experiencing high demand. Please try again in a few moments.",
          },
          { status: 503 }
        );
      }

      const raw = responseText.trim();
      let parsedQuiz = [];

      try {
        const cleaned = raw.replace(/^```(json)?/i, "").replace(/```$/i, "").trim();
        parsedQuiz = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error("Gemini quiz JSON parse error:", parseErr, raw);
        return NextResponse.json(
          { error: "Failed to parse 10-question quiz from Gemini response." },
          { status: 500 }
        );
      }

      if (!Array.isArray(parsedQuiz) || parsedQuiz.length === 0) {
        return NextResponse.json(
          { error: "Google Gemini returned an empty question list. Please try again." },
          { status: 500 }
        );
      }

      return NextResponse.json({ quiz: parsedQuiz });
    }

    if (action === "ask") {
      if (!question || typeof question !== "string") {
        return NextResponse.json(
          { error: "A question is required." },
          { status: 400 }
        );
      }

      const completion = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are StudyMate, a helpful and precise tutor. Answer the student's question directly based on the provided document. If the answer is not in the document, use your knowledge while noting that it is beyond the document scope.",
          },
          {
            role: "user",
            content: `Document: ${fileName || "Uploaded Material"}\n\nDocument Content:\n${contextSnippet}\n\nStudent Question: ${question.trim()}`,
          },
        ],
      });

      return NextResponse.json({
        answer:
          completion.choices[0]?.message?.content ||
          "I couldn't generate an answer. Please try again.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Practice generate error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process practice request.",
      },
      { status: 500 }
    );
  }
}
