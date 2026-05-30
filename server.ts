import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const groq = process.env.GROQ_API_KEY ? new Groq({
  apiKey: process.env.GROQ_API_KEY,
}) : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper for Groq JSON completion
  async function getGroqCompletion(prompt: string, systemPrompt?: string) {
    if (!groq) {
      throw new Error("GROQ_API_KEY is not configured. Please add it to your secrets.");
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt || "You are a helpful educational assistant. You MUST output ONLY valid JSON. Do not include any markdown formatting like ```json or any other text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });
    
    let content = chatCompletion.choices[0].message.content || "{}";
    // Clean potential markdown-style backticks if the model ignores the instruction
    content = content.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    return content;
  }

  // --- API Routes ---

  // Tool 1: MCQ Generator
  app.post("/api/mcqs", async (req, res) => {
    const { topic, count, difficulty, gradeLevel, language } = req.body;
    try {
      const prompt = `Generate ${count} multiple choice questions about "${topic}".
      Target Grade Level: ${gradeLevel || difficulty || "High School"}
      Target Language: ${language || "English"}

      Ensure all questions, options, correct answers, and feedback/explanations are fully written in the requested target language: ${language || "English"}.
      Return a JSON object with a "questions" key containing an array of objects.
      Each object must have: "question" (string), "options" (array of 4 strings), "correctIndex" (integer 0-3), and "explanation" (string).`;
      
      const result = await getGroqCompletion(prompt);
      const parsed = JSON.parse(result || '{"questions": []}');
      res.json(parsed.questions || []);
    } catch (error: any) {
      console.error("MCQ Error:", error);
      res.status(500).json({ error: "Failed to generate MCQs" });
    }
  });

  // Tool 2: Short Questions
  app.post("/api/short-questions", async (req, res) => {
    const { topic, count, gradeLevel, language } = req.body;
    try {
      const prompt = `Generate ${count} short academic questions about "${topic}". 
      Target Grade Level: ${gradeLevel || "High School"}
      Target Language: ${language || "English"}

      Ensure and formulate both the questions and their corresponding model answers to be written 100% in the requested target language: ${language || "English"}.
      For each, provide a 1-3 sentence model answer.
      Return a JSON object with a "questions" key containing an array of objects.
      Each object must have: "question" (string) and "modelAnswer" (string).`;
      
      const result = await getGroqCompletion(prompt);
      const parsed = JSON.parse(result || '{"questions": []}');
      res.json(parsed.questions || []);
    } catch (error: any) {
      console.error("Short Q Error:", error);
      res.status(500).json({ error: "Failed to generate short questions" });
    }
  });

  app.post("/api/check-short-answer", async (req, res) => {
    const { question, modelAnswer, userAnswer, language } = req.body;
    try {
      const prompt = `Question: ${question}\nModel Answer: ${modelAnswer}\nUser Answer: ${userAnswer}\n\n
      Target Language for assessment response: ${language || "English"}.
      Evaluate the user's answer compared to the model answer. Be encouraging but accurate. 
      Write all feedback, score justifications, and improvement bullet lists entirely in the requested target language: ${language || "English"}.
      Return a JSON object with: "score" (number 0-10), "feedback" (string), and "improvement" (string).`;
      
      const result = await getGroqCompletion(prompt);
      res.json(JSON.parse(result || "{}"));
    } catch (error: any) {
      res.status(500).json({ error: "Failed to check answer" });
    }
  });

  // Tool 3: Long Questions
  app.post("/api/long-questions", async (req, res) => {
    const { topic, count, gradeLevel, language } = req.body;
    try {
      const prompt = `Generate ${count} essay-style long structural questions about "${topic}". 
      Target Grade Level: ${gradeLevel || "High School"}
      Target Language: ${language || "English"}

      Make sure all questions, headers, body responses, and rubrics are written 100% in the requested target language: ${language || "English"}.
      For each, provide:
      1. A detailed multi-paragraph model answer WITH CLEAR HEADINGS (using markdown # or ##).
      2. Exactly 5 specific key point sentences that are most important.
      
      Return a JSON object with a "questions" key containing an array of objects.
      Each object must have: "question" (string), "modelAnswer" (string), and "keyPoints" (array of strings).`;
      
      const result = await getGroqCompletion(prompt);
      const parsed = JSON.parse(result || '{"questions": []}');
      res.json(parsed.questions || []);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to generate long questions" });
    }
  });

  // Tool 4: Topic Explainer
  app.post("/api/explain-topic", async (req, res) => {
    const { topic, level, gradeLevel, language } = req.body;
    const finalLevel = gradeLevel || level || "High School";
    try {
      const prompt = `Explain "${topic}" designed specifically for a student at the ${finalLevel} grade level.
      Target Language: ${language || "English"}

      You MUST write the title, summary, key concepts, analogy, misconceptions, detailed explanation, and diagram design entirely in the requested target language: ${language || "English"}.
      Include:
      1. A catchy title.
      2. A concise summary.
      3. 5-7 key concepts (as strings).
      4. A real-world analogy.
      5. 3 common misconceptions (as strings).
      6. A "Detailed Explanation" in markdown with multiple sections and headings.
      7. A "Diagram Description" - describe what a helpful diagram for this topic would look like.
      
      Return a JSON object with: "title" (string), "summary" (string), "keyConcepts" (array of strings), "analogy" (string), "misconceptions" (array of strings), "detailedExplanation" (string, markdown), and "diagramDescription" (string).`;
      
      const result = await getGroqCompletion(prompt);
      res.json(JSON.parse(result || "{}"));
    } catch (error: any) {
      res.status(500).json({ error: "Failed to explain topic" });
    }
  });

  // Tool 5: Story & Letter
  app.post("/api/write-story", async (req, res) => {
    const { theme, tone, gradeLevel, language } = req.body;
    try {
      const prompt = `Write a short story (300-500 words) with the theme/prompt: "${theme}" in a ${tone} tone suitable for ${gradeLevel || "High School"} level.
      Target Language: ${language || "English"}

      Write the story and title entirely in the requested target language: ${language || "English"}.
      Return a JSON object with: "title" (string) and "content" (string).`;
      
      const result = await getGroqCompletion(prompt);
      res.json(JSON.parse(result || "{}"));
    } catch (error: any) {
      res.status(500).json({ error: "Failed to write story" });
    }
  });

  app.post("/api/write-letter", async (req, res) => {
    const { type, details, gradeLevel, language } = req.body;
    try {
      const prompt = `Write a complete formal ${type} based on these details: "${details}", suited for ${gradeLevel || "High School"} reading level.
      Target Language: ${language || "English"}

      Write the letters, subject lines, and signatures entirely in the requested target language: ${language || "English"}.
      Return a JSON object with: "subject" (string) and "body" (string).`;
      
      const result = await getGroqCompletion(prompt);
      res.json(JSON.parse(result || "{}"));
    } catch (error: any) {
      res.status(500).json({ error: "Failed to write letter" });
    }
  });

  // Tool 6: Exam Mode
  app.post("/api/generate-exam", async (req, res) => {
    const { topic, mcqCount, shortCount, longCount, gradeLevel, language } = req.body;
    try {
      const prompt = `Generate a complete school assessment exam paper about "${topic}" customized for ${gradeLevel || "High School"} difficulty level.
      Target Language: ${language || "English"}

      Ensure all structural headers, questions, multiple choices, answers, essay questions, and checklist keys are written 100% in the requested target language: ${language || "English"}.
      Return a JSON object with:
      - "mcqs": an array of ${mcqCount} multiple choice questions (with options, correctIndex, explanation).
      - "shortQuestions": an array of ${shortCount} short questions (with modelAnswer).
      - "longQuestions": an array of ${longCount} long questions (with modelAnswer and keyPoints).
      
      Structure the output exactly as a JSON with these three keys.`;
      
      const result = await getGroqCompletion(prompt);
      res.json(JSON.parse(result || '{"mcqs":[], "shortQuestions":[], "longQuestions":[]}'));
    } catch (error: any) {
      console.error("Exam Error:", error);
      res.status(500).json({ error: "Failed to generate exam paper" });
    }
  });

  // Tool 7.5: Search Diagrams on Pexels using Pexels API
  app.get("/api/pexels-search", async (req, res) => {
    const { query, per_page } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Search query is required." });
    }

    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "Pexels API key is not configured on this server. Please define PEXELS_API_KEY in your environment variables." });
    }

    try {
      const fetchUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query as string)}&per_page=${per_page || 12}`;
      const response = await fetch(fetchUrl, {
        headers: {
          "Authorization": apiKey
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: `Pexels API responded with error: ${errText}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Pexels Search Error:", error);
      res.status(500).json({ error: "Failed to search photos on Pexels." });
    }
  });

  // Tool 7: Visual Analysis using Groq API (supporting client-side Text extraction for PDFs & Vision for Images)
  app.post("/api/visual-analysis", async (req, res) => {
    const { fileDataList, fileData, mimeType, task, classLevel, instructions, userKey, pdfText, language } = req.body;
    
    // Resolve which API key to use
    const resolvedApiKey = userKey || process.env.GROQ_API_KEY;
    if (!resolvedApiKey) {
      return res.status(400).json({ error: "Groq API key is not configured. Please paste your key in App Settings." });
    }

    try {
      const groqClient = new Groq({ apiKey: resolvedApiKey });
      const isJsonOutput = ["mcq", "short-questions", "exam-paper"].includes(task);

      // Build target prompt based on chosen task
      let targetPrompt = "";
      const langText = language ? `\n\nAll questions, options, answers, explanations, summaries, and generated exam contents MUST be written entirely in the target language: ${language}.` : "";

      if (task === "solve") {
        targetPrompt = `Identify and solve all educational questions, homework prompts, worksheets, or academic quizzes present in the uploaded document.
Be exceptionally thorough, rendering step-by-step solutions for each problem.
For each question identified:
1. Clearly state the Question text.
2. Provide the complete solved step-by-step answer or explanation.
3. If it is an MCQ, specify the correct option letter/text and explain why.`;
      } else if (task === "explain") {
        targetPrompt = `Analyze the content/diagrams within this document. Explain all concepts, theorems, equations, or illustrations in simple, clear, and highly intuitive language suitable for a student at the ${classLevel} class level.
Break down complex scholarly jargon into plain English, map out key terms, and provide a comprehensive section-by-section breakdown.`;
      } else if (task === "summarize") {
        targetPrompt = `Draft an organized, structured educational summary of the key notes, facts, and lessons found in this document. Make it tailored for a ${classLevel} level student.
Highlight core definitions, use lists/bullet points, and end with a concise 'Key Takeaways' bulleted checklist.`;
      } else if (task === "mcq") {
        targetPrompt = `Translate the curriculum topics present in this document into a list of exactly 10 multiple choice questions (MCQs) targeting the ${classLevel} difficulty level.
You MUST format your output as a clean, parseable JSON object with a single "questions" key containing an array of objects.
Each question object MUST have:
- "question" (string)
- "options" (array of exactly 4 strings)
- "correctIndex" (integer 0 to 3)
- "explanation" (string explaining why)

Ensure you output ONLY the valid JSON object.`;
      } else if (task === "short-questions") {
        targetPrompt = `Extract the educational concepts from this document and generate exactly 5 short-answer concept-check questions targeting the ${classLevel} level.
You MUST format your output as a clean, parseable JSON object with a "questions" key containing an array of objects.
Each question object MUST contain:
- "question" (string)
- "modelAnswer" (string, a concise 2-3 sentence reference model answer)

Ensure you output ONLY the valid JSON.`;
      } else if (task === "exam-paper") {
        targetPrompt = `Synthesize the educational materials from this document and compile a complete structured academic exam paper designed for the ${classLevel} level.
The exam paper MUST contain the following sections:
- 5 MCQs
- 3 Short Questions
- 1 Long essay-style Question

You MUST format your output as a clean, parseable JSON object with exactly the three keys below:
- "mcqs": an array of 5 MCQ objects (each with question, options, correctIndex, explanation)
- "shortQuestions": an array of 3 short questions (each with question, modelAnswer)
- "longQuestions": an array of 1 long question (with question, modelAnswer (a detailed multi-paragraph model essay response with heading subheaders), keyPoints (an array of exactly 5 bullet points to check/grade)).

Ensure you output ONLY the valid JSON object.`;
      } else {
        return res.status(400).json({ error: `Unsupported task: ${task}` });
      }

      if (instructions && instructions.trim()) {
        targetPrompt += `\n\nAdditional special instructions to respect: ${instructions}`;
      }

      targetPrompt += langText;

      let systemPrompt = "You are a highly experienced, elite academic educator and mentor. Return beautiful, high-quality responses matching the requested formats.";
      if (isJsonOutput) {
        systemPrompt += " You MUST format your response as a valid JSON object. Do NOT wrap inside backticks or add any extra text outside the JSON structure.";
      }

      let rawText = "";

      if (pdfText && pdfText.trim()) {
        // PDF Text Extraction Strategy (as instructed by the user)
        const promptText = `Class Level parameter: ${classLevel}\n\nExtracted Text from PDF file:\n${pdfText}\n\nTask instructions:\n${targetPrompt}`;

        const chatCompletion = await groqClient.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: promptText }
          ],
          model: "llama-3.3-70b-versatile",
          response_format: isJsonOutput ? { type: "json_object" } : undefined,
        });

        rawText = chatCompletion.choices[0]?.message?.content || "";
      } else if (fileData) {
        // Vision Strategy for Images (using Gemini API as explicitly requested: Gemini for images, Groq for text)
        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY environment variable is not set. Please add it to your environment variables / secrets panel.");
        }

        const aiClient = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        const promptText = `Class Level parameter: ${classLevel}\n\nTask instructions:\n${targetPrompt}`;

        const imagePart = {
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: fileData,
          },
        };
        const textPart = {
          text: promptText,
        };

        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [imagePart, textPart],
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: isJsonOutput ? "application/json" : undefined,
          }
        });

        rawText = response.text || "";
      } else {
        return res.status(400).json({ error: "No PDF text or Image data detected. Please upload a valid document or wait for conversion." });
      }

      rawText = rawText.trim();

      if (isJsonOutput) {
        // Safe JSON cleaning
        let cleanedText = rawText;
        const jsonBlockMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
          cleanedText = jsonBlockMatch[1].trim();
        } else {
          const firstBrace = rawText.indexOf("{");
          const lastBrace = rawText.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanedText = rawText.substring(firstBrace, lastBrace + 1);
          }
        }
        
        try {
          const parsedJson = JSON.parse(cleanedText);
          res.json({ text: rawText, json: parsedJson });
        } catch (jsonErr) {
          console.error("Failed to parse cleaned JSON:", cleanedText, jsonErr);
          res.status(500).json({ 
            error: "Failed to parse JSON reply from Groq. The AI output was not structured as a valid dictionary. Please try again.",
            raw: rawText 
          });
        }
      } else {
        // Plain text / markdown output tasks (solve, explain, summarize)
        res.json({ text: rawText });
      }

    } catch (error: any) {
      console.error("Visual Analysis Error:", error);
      res.status(500).json({ error: error.message || "Failed to process visual content" });
    }
  });

  // -- Static and Dev Middleware --
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
