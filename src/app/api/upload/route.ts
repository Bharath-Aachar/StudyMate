import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";



export async function POST(request: Request) {
    let parser: PDFParse | undefined;

    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: "Please select a PDF file." },
                { status: 400 }
            );
        }

        if (
            file.type !== "application/pdf" ||
            file.size > 10 * 1024 * 1024
        ) {
            return NextResponse.json(
                { error: "Upload a PDF smaller than 10 MB." },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        const text = result.text.trim();

        if (!text) {
            return NextResponse.json(
                {
                    error:
                        "No readable text found. This PDF may be scanned.",
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            filename: file.name,
            text: text.slice(0, 50000),
        });
    } catch (error) {
        console.error("PDF upload error:", error);

        return NextResponse.json(
            { error: "Could not read this PDF. Try another file." },
            { status: 500 }
        );
    } finally {
        await parser?.destroy().catch(() => { });
    }
}