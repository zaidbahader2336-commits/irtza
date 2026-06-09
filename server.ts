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
  async function getGroqCompletion(prompt: string, systemPrompt?: string, userKey?: string) {
    const activeKey = userKey || process.env.GROQ_API_KEY;
    if (!activeKey) {
      throw new Error("GROQ_API_KEY is not configured. Please add it to your secrets or paste it in App Settings.");
    }

    const client = new Groq({ apiKey: activeKey });
    const chatCompletion = await client.chat.completions.create({
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

  // Helper for Groq raw non-JSON completion
  async function getGroqRawCompletion(prompt: string, systemPrompt?: string, userKey?: string) {
    const activeKey = userKey || process.env.GROQ_API_KEY;
    if (!activeKey) {
      throw new Error("GROQ_API_KEY is not configured. Please add it to your secrets or paste it in App Settings.");
    }

    const client = new Groq({ apiKey: activeKey });
    const chatCompletion = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt || "You are a helpful educational assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });
    
    return chatCompletion.choices[0].message.content || "";
  }

  // --- API Routes ---

  // Tool 1: MCQ Generator
  app.post("/api/mcqs", async (req, res) => {
    const { topic, count, difficulty, gradeLevel, language, userKey } = req.body;
    try {
      const prompt = `Generate ${count} multiple choice questions about "${topic}".
      Target Grade Level: ${gradeLevel || difficulty || "High School"}
      Target Language: ${language || "English"}

      Ensure all questions, options, correct answers, and feedback/explanations are fully written in the requested target language: ${language || "English"}.
      Return a JSON object with a "questions" key containing an array of objects.
      Each object must have: "question" (string), "options" (array of 4 strings), "correctIndex" (integer 0-3), and "explanation" (string).`;
      
      const result = await getGroqCompletion(prompt, undefined, userKey);
      const parsed = JSON.parse(result || '{"questions": []}');
      res.json(parsed.questions || []);
    } catch (error: any) {
      console.error("MCQ Error:", error);
      res.status(500).json({ error: "Failed to generate MCQs" });
    }
  });

  // Tool 2: Short Questions
  app.post("/api/short-questions", async (req, res) => {
    const { topic, count, gradeLevel, language, userKey } = req.body;
    try {
      const prompt = `Generate ${count} short academic questions about "${topic}". 
      Target Grade Level: ${gradeLevel || "High School"}
      Target Language: ${language || "English"}

      Ensure and formulate both the questions and their corresponding model answers to be written 100% in the requested target language: ${language || "English"}.
      For each, provide a 1-3 sentence model answer.
      Return a JSON object with a "questions" key containing an array of objects.
      Each object must have: "question" (string) and "modelAnswer" (string).`;
      
      const result = await getGroqCompletion(prompt, undefined, userKey);
      const parsed = JSON.parse(result || '{"questions": []}');
      res.json(parsed.questions || []);
    } catch (error: any) {
      console.error("Short Q Error:", error);
      res.status(500).json({ error: "Failed to generate short questions" });
    }
  });

  app.post("/api/check-short-answer", async (req, res) => {
    const { question, modelAnswer, userAnswer, language, userKey } = req.body;
    try {
      const prompt = `Question: ${question}\nModel Answer: ${modelAnswer}\nUser Answer: ${userAnswer}\n\n
      Target Language for assessment response: ${language || "English"}.
      Evaluate the user's answer compared to the model answer. Be encouraging but accurate. 
      Write all feedback, score justifications, and improvement bullet lists entirely in the requested target language: ${language || "English"}.
      Return a JSON object with: "score" (number 0-10), "feedback" (string), and "improvement" (string).`;
      
      const result = await getGroqCompletion(prompt, undefined, userKey);
      res.json(JSON.parse(result || "{}"));
    } catch (error: any) {
      res.status(500).json({ error: "Failed to check answer" });
    }
  });

  // Tool 3: Long Questions
  app.post("/api/long-questions", async (req, res) => {
    const { topic, count, gradeLevel, language, userKey } = req.body;
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
      
      const result = await getGroqCompletion(prompt, undefined, userKey);
      const parsed = JSON.parse(result || '{"questions": []}');
      res.json(parsed.questions || []);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to generate long questions" });
    }
  });

  // Tool 4: Topic Explainer
  app.post("/api/explain-topic", async (req, res) => {
    const { topic, level, gradeLevel, language, userKey } = req.body;
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
      
      const result = await getGroqCompletion(prompt, undefined, userKey);
      res.json(JSON.parse(result || "{}"));
    } catch (error: any) {
      res.status(500).json({ error: "Failed to explain topic" });
    }
  });

  // Tool 5: Story & Letter
  app.post("/api/write-story", async (req, res) => {
    const { theme, tone, gradeLevel, language, userKey } = req.body;
    try {
      const prompt = `Write a short story (300-500 words) with the theme/prompt: "${theme}" in a ${tone} tone suitable for ${gradeLevel || "High School"} level.
      Target Language: ${language || "English"}

      Write the story and title entirely in the requested target language: ${language || "English"}.
      Return a JSON object with: "title" (string) and "content" (string).`;
      
      const result = await getGroqCompletion(prompt, undefined, userKey);
      res.json(JSON.parse(result || "{}"));
    } catch (error: any) {
      res.status(500).json({ error: "Failed to write story" });
    }
  });

  app.post("/api/write-letter", async (req, res) => {
    const { type, details, gradeLevel, language, userKey } = req.body;
    try {
      const prompt = `Write a complete formal ${type} based on these details: "${details}", suited for ${gradeLevel || "High School"} reading level.
      Target Language: ${language || "English"}

      Write the letters, subject lines, and signatures entirely in the requested target language: ${language || "English"}.
      Return a JSON object with: "subject" (string) and "body" (string).`;
      
      const result = await getGroqCompletion(prompt, undefined, userKey);
      res.json(JSON.parse(result || "{}"));
    } catch (error: any) {
      res.status(500).json({ error: "Failed to write letter" });
    }
  });

  // Tool 6: Exam Mode
  app.post("/api/generate-exam", async (req, res) => {
    const { topic, mcqCount, shortCount, longCount, gradeLevel, language, userKey } = req.body;
    try {
      const prompt = `Generate a complete school assessment exam paper about "${topic}" customized for ${gradeLevel || "High School"} difficulty level.
      Target Language: ${language || "English"}

      Ensure all structural headers, questions, multiple choices, answers, essay questions, and checklist keys are written 100% in the requested target language: ${language || "English"}.
      Return a JSON object with:
      - "mcqs": an array of ${mcqCount} multiple choice questions (with options, correctIndex, explanation).
      - "shortQuestions": an array of ${shortCount} short questions (with modelAnswer).
      - "longQuestions": an array of ${longCount} long questions (with modelAnswer and keyPoints).
      
      Structure the output exactly as a JSON with these three keys.`;
      
      const result = await getGroqCompletion(prompt, undefined, userKey);
      res.json(JSON.parse(result || '{"mcqs":[], "shortQuestions":[], "longQuestions":[]}'));
    } catch (error: any) {
      console.error("Exam Error:", error);
      res.status(500).json({ error: "Failed to generate exam paper" });
    }
  });

  // Tool 7.5: Generate scientifically-accurate educational SVG diagram using Groq Llama API instead of Gemini
  app.post("/api/generate-diagram", async (req, res) => {
    const { topic, userKey } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic/diagram description is required." });
    }

    try {
      const promptText = `Generate a highly professional, beautiful, and pristine 800x500 widescreen visual vector SVG diagram illustrating "${topic}".
      The diagram MUST EXACTLY implement a custom-styled "8 Steps Circular Infographic Diagram Template" tailored and filled with real academic steps for this topic.

      Layout and Structure of the SVG:
      1. Widescreen 16:9 canvas with viewBox="0 0 800 500" width="100%" height="100%". Use a very soft, clean light gray/blue background (#FAFBFD) with a thin margin border so it looks like a premium standalone card.
      2. Centering coordinates: Center point of the design is exactly (400, 240).
      3. Central Core Circle:
         - CX=400, CY=240, Radius=80.
         - Solid white background (#FFFFFF) with a beautiful card border (#E2E8F0) and soft subtle shadows.
         - Inside this circle: Place the central name of the topic "${topic}". Wrap or split this text into 2-3 short centered lines using <text text-anchor="middle" font-family="'Inter', system-ui, sans-serif"> with high contrast dark bold charcoal text. Scale the size dynamically to fit within the 80px radius circle.
         - Add a tiny, elegant sub-badge like "8 CORE PILLARS" or "PROCESS MAP" in small uppercase letters inside this circle.
      4. Surrounded Segmented Ring:
         - Around this central circle (radius 80 to 110), design a segmented wheel circle.
         - The ring must show 8 colored segment sections corresponding to Steps 01 to 08.
         - Each segment sector must contain its step number ("01", "02", "03", "04", "05", "06", "07", "08") written in bold white styled sans-serif text to create a premium, balanced, numbered ring.
         - Color code the segments and their corresponding connected cards in these 4 paired premium schemes:
           * Step 01 (top-right) and Step 05 (bottom-left): Warm Gold/Sienna (#D97706 or #E28C3E)
           * Step 02 (mid-high-right) and Step 06 (low-left): Emerald Sea (#10B981 or #118C62)
           * Step 03 (mid-low-right) and Step 07 (high-left): Sunset Orange (#E15D34)
           * Step 04 (bottom-right) and Step 08 (top-left): Classic Crimson Red (#991B1B or #B02A2A)
      5. Symmetrical Rounded Speech Cards on Left and Right:
         - Display four Cards on the right side and four Cards on the left side vertically, with plenty of margins.
         - Right-side cards (Steps 01, 02, 03, 04) - Starting at X=510. Width=230, Height=80.
           * Step 01: Y=25. Accent: Gold.
           * Step 02: Y=125. Accent: Emerald.
           * Step 03: Y=225. Accent: Sunset.
           * Step 04: Y=325. Accent: Crimson.
         - Left-side cards (Steps 08, 07, 06, 05) - Starting at X=60. Width=230, Height=80.
           * Step 08: Y=25. Accent: Crimson.
           * Step 07: Y=125. Accent: Sunset.
           * Step 06: Y=225. Accent: Emerald.
           * Step 05: Y=325. Accent: Gold.
         - Each card must be a beautiful rounded container (<rect> with rx="14" ry="14") having a soft off-white fill, colored outline matching its step accent color, and a small pointer indicator triangle on its inner side pointing exactly towards the center ring.
      6. Card Contents (Real Content, NEVER generic 'Lorem Ipsum'):
         - Fill all 8 items with real, highly-educational academic progression titles and 1-2 sentence small summaries specific to "${topic}".
         - For example, if the topic is "Mitosis", the 8 steps should cover Interphase, Prophase, Prometaphase, Metaphase, Anaphase, Telophase, Cytokinesis, and Daughter Cells. Ensure they are highly descriptive.
         - Draw an inline vector circle with a simple stylized academic symbol/icon (like scales, gear, chart, lightbulb, checklist, clock, puzzle piece, chemical flask) matching that step's name at the inner end of each card.
      7. Connecting lines or smooth curved arcs should connect these cards to the main ring cleanly.
      8. Ensure all labels, texts, and icons match exactly. The SVG must be perfect, valid XML. Output ONLY the raw XML string starting with <svg> and ending with </svg>. Do not wrap in markdown tags or add header text.`;

      const rawSvg = await getGroqRawCompletion(promptText, "You are a master academic vector illustrator of high-fidelity infographic schemas. Output strictly the raw SVG string starting with <svg> and ending with </svg> and nothing else. No explanation, no backticks, no markdown wrapping.", userKey);
      let cleanedSvg = rawSvg.trim();
      cleanedSvg = cleanedSvg.replace(/```xml\s*/gi, "").replace(/```svg\s*/gi, "").replace(/```html\s*/gi, "").replace(/```\s*/gi, "").trim();

      const startIdx = cleanedSvg.indexOf("<svg");
      const endIdx = cleanedSvg.lastIndexOf("</svg>");
      if (startIdx !== -1 && endIdx !== -1) {
        cleanedSvg = cleanedSvg.substring(startIdx, endIdx + 6);
      }

      res.json({ svg: cleanedSvg });
    } catch (error: any) {
      console.error("Groq Diagram Generation Error:", error);
      res.status(500).json({ error: "Failed to generate science diagram with Groq API." });
    }
  });

  // Tool 7.6: Generate dynamically structured mind map/diagram requests for Google Slides
  app.post("/api/generate-slides-requests", async (req, res) => {
    const { topic, userKey } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required." });
    }

    try {
      const prompt = `You are a professional educational illustrator and Google Slides diagram developer.
Generate a JSON array of Google Slides API presentations batchUpdate Request objects to construct a visually stunning, highly detailed, beautifully structured mind map/flow diagram for the academic topic: "${topic}".

The presentation canvas is standard widescreen: 720 points wide by 405 points high.
Placeholders:
You MUST use "{{SLIDE_ID}}" as the placeholder for the slide object ID. Do not hardcode a slide ID.

Requirements:
Create exactly the following elements:
1. One central core topic box (objectId: "center_box_node") positioned at the center of the slide:
   - Position coordinates: translateX = 260, translateY = 150, width = 200, height = 80.
   - Text inside: "${topic}" (Bold, font size 14, Centered).
2. Four supporting academic detail boxes (objectIds: "sub_box_1", "sub_box_2", "sub_box_3", "sub_box_4") that go around the central box. For each box, identify a key concept, subtopic, or stage relevant to "${topic}".
   - Coordinate guide:
     - Top-Left ("sub_box_1"): translateX = 30, translateY = 30, width = 180, height = 90.
       Text inside: a relevant key concept title (bold) and 1-2 sentence detailed description.
     - Top-Right ("sub_box_2"): translateX = 510, translateY = 30, width = 180, height = 90.
       Text inside: a second relevant key concept title (bold) and 1-2 sentence detailed description.
     - Bottom-Left ("sub_box_3"): translateX = 30, translateY = 270, width = 180, height = 90.
       Text inside: a third relevant key concept title (bold) and 1-2 sentence detailed description.
     - Bottom-Right ("sub_box_4"): translateX = 510, translateY = 270, width = 180, height = 90.
       Text inside: a fourth relevant key concept title (bold) and 1-2 sentence detailed description.
3. Four clean connecting lines (lineIds: "line_1", "line_2", "line_3", "line_4") going from the central box to each supporting box with arrows:
   - Line 1 (from center box to sub_box_1): from center box border to sub_box_1.
   - Line 2 (from center box to sub_box_2): from center box border to sub_box_2.
   - Line 3 (from center box to sub_box_3): from center box border to sub_box_3.
   - Line 4 (from center box to sub_box_4): from center box border to sub_box_4.

For each of the 5 shapes (center + 4 sub-boxes), include the following exact request sequence in your array:
- "createShape": creating a 'ROUND_RECTANGLE' with correct objectId, referencing 'pageObjectId': '{{SLIDE_ID}}', and size/transform.
- "updateShapeProperties": set solid shape fill color (use beautiful soft academic pastels, e.g. center box: red: 0.9, green: 0.93, blue: 0.98. Supporting boxes: red: 0.93, green: 0.98, blue: 0.93 for green-themed ones or light yellow/cream) and custom outline stroke (weight=1).
- "insertText": insert the title and descriptive details inside.
- "updateTextStyle": format text to Georgia or Arial, deep charcoal color, text range ALL.

For each of the 4 lines, include:
- "createLine": create 'STRAIGHT' line on slide '{{SLIDE_ID}}' with correct lineId and correct size and transform properties to place it between the central box and the target sub-box.
- "updateLineProperties": setting endArrow to 'STEALTH_ARROW' and color to charcoal.

Ensure that all requests are placed in the correct order so dependencies match (e.g. createShape must run before updateShapeProperties, insertText, etc.).
Return a JSON object with a single "requests" key containing the array of these Google Slides API Request objects. DO NOT include any markdown backticks or explanation text — only valid raw parseable JSON.`;

      const result = await getGroqCompletion(prompt, undefined, userKey);
      const parsed = JSON.parse(result || '{"requests": []}');
      res.json(parsed);

    } catch (error: any) {
      console.error("Slides API Request Generation Error:", error);
      res.status(500).json({ error: error.message || "An error occurred with the Google Slides generation." });
    }
  });

  // Secure Pexels Search API proxy
  app.get("/api/pexels-search", async (req, res) => {
    const { query, per_page } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Search query is required." });
    }

    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: "PEXELS_API_KEY is not configured on this server. Please setup PEXELS_API_KEY in your env secrets." });
    }

    try {
      const perPage = per_page || 12;
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(String(query))}&per_page=${perPage}`;
      
      const pexelsResponse = await fetch(url, {
        headers: {
          Authorization: apiKey
        }
      });

      if (!pexelsResponse.ok) {
        const errText = await pexelsResponse.text();
        return res.status(pexelsResponse.status).json({ error: `Pexels API error: ${errText}` });
      }

      const data = await pexelsResponse.json();
      res.json(data);
    } catch (error: any) {
      console.error("Pexels Search Error:", error);
      res.status(500).json({ error: error.message || "Failed to search images from Pexels" });
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
- 
Ensure you output ONLY the valid JSON object.`;
      } else if (task === "short-questions") {
        targetPrompt = `Extract the educational concepts from this document and generate exactly 5 short-answer concept-check questions targeting the ${classLevel} level.
You MUST format your output as a clean, parseable JSON object with a "questions" key containing an array of objects.
Each question object MUST contain:
- "question" (string)
- "modelAnswer" (string, a concise 2-3 sentence reference model answer)
- 
Ensure you output ONLY the valid JSON.`;
      } else if (task === "exam-paper") {
        targetPrompt = `Synthesize the educational materials from this document and compile a complete structured academic exam paper designed for the ${classLevel} level.
The exam paper MUST contain the following sections:
- 5 MCQs
- 3 Short Questions
- 1 Long essay-style Question
- 
You MUST format your output as a clean, parseable JSON object with exactly the three keys below:
- "mcqs": an array of 5 MCQ objects (each with question, options, correctIndex, explanation)
- "shortQuestions": an array of 3 short questions (each with question, modelAnswer)
- "longQuestions": an array of 1 long question (with question, modelAnswer (a detailed multi-paragraph model essay response with heading subheaders), keyPoints (an array of exactly 5 bullet points to check/grade)).
- 
You MUST format your output as a clean, parseable JSON object.`;
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
        // Vision Strategy for Images using Groq Vision API
        const chatCompletion = await groqClient.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: `Class Level parameter: ${classLevel}\n\nTask instructions:\n${targetPrompt}` },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType || "image/jpeg"};base64,${fileData}`
                  }
                }
              ]
            }
          ],
          model: "llama-3.2-11b-vision-preview",
          response_format: isJsonOutput ? { type: "json_object" } : undefined,
        });

        rawText = chatCompletion.choices[0]?.message?.content || "";
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

  // Tool 8: Advanced 10-in-1 Educational Smart Suite Route
  app.post("/api/smart-tool", async (req, res) => {
    const { toolId, topic, gradeLevel, language, userKey } = req.body;
    if (!toolId || !topic) {
      return res.status(400).json({ error: "Missing required toolId or topic parameters." });
    }

    const finalLevel = gradeLevel || "High School";
    const finalLanguage = language || "English";

    try {
      let prompt = "";
      if (toolId === "flashcard") {
        prompt = `Generate exactly 8 educational study flashcards for a student at the ${finalLevel} grade level about "${topic}" in ${finalLanguage}.
        Return a JSON object with a "deck" key containing an array of objects.
        Each flashcard object in the array MUST contain:
        - "front" (string representation of the question or vocabulary term)
        - "back" (string representation of the corresponding explanation or definition)
        Ensure all values are written entirely in the requested target language: ${finalLanguage}.`;
      } else if (toolId === "mindmap") {
        prompt = `Create a detailed, beautiful hierarchical educational mind-map outline about "${topic}" for a ${finalLevel} student in ${finalLanguage}.
        Return a JSON object structured exactly in a nested format:
        {
          "name": "${topic}",
          "children": [
            {
              "name": "Major Branch Title 1",
              "children": [
                { "name": "Key Concept Node 1.1" },
                { "name": "Key Concept Node 1.2" }
              ]
            }
          ]
        }
        Provide exactly 3-4 major branches, each with 2-3 specific child concept nodes.
        Make sure all values and terminology are generated completely in ${finalLanguage}.`;
      } else if (toolId === "planner") {
        prompt = `Create a comprehensive, custom 7-day study plan / learning syllabus architect for mastering "${topic}" tailored for a ${finalLevel} student in ${finalLanguage}.
        Return a JSON object with a "schedule" key containing an array of 7 day objects.
        Each day object MUST contain:
        - "day" (integer 1-7)
        - "title" (string, daily module focus topic)
        - "milestones" (array of exactly 3 granular learning checklist items)
        - "estimatedHours" (number or decimal of daily recommended study duration)
        Ensure everything is written written 100% in: ${finalLanguage}.`;
      } else if (toolId === "debate") {
        prompt = `Compile a strong, balanced, dual-sided academic debate outline and argument coach for the controversial topic: "${topic}" designed for a ${finalLevel} student in ${finalLanguage}.
        Return a JSON object containing:
        - "thesis" (string summarizing the core resolution or dilemma)
        - "affirmativeArguments" (array of exactly 3 strong arguments in favor of the thesis)
        - "negativeArguments" (array of exactly 3 strong arguments opposing the thesis)
        - "rebuttals" (array of 3 smart guidelines on how to tackle opposing arguments)
        Write everything entirely in ${finalLanguage}.`;
      } else if (toolId === "case-study") {
        prompt = `Draft an immersive, realistic real-world educational case study or scenario analyzing the application of: "${topic}" suited for a ${finalLevel} student in ${finalLanguage}.
        Return a JSON object containing:
        - "caseTitle" (string, catchy and contextual title)
        - "background" (string, narrative detailing the characters, challenge or organization)
        - "dilemma" (string, the core question, technical choice or moral decision)
        - "analysisQuestions" (array of exactly 3 thought-provoking comprehension questions with their corresponding answers)
        Write the narrative and analysis entirely in ${finalLanguage}.`;
      } else if (toolId === "code-explain") {
        prompt = `Provide a comprehensive code explanation, mental model visualization, or computational logic breakdown of: "${topic}" designed for a ${finalLevel} student in ${finalLanguage}.
        Return a JSON object containing:
        - "synopsis" (string explaining what the concept/code does)
        - "pseudocode" (string representing a flawless line-by-line step-by-step logic breakdown)
        - "dryRun" (array of exactly 3 simple state tracing comments)
        - "pitfalls" (array of exactly 2 common logical bugs, errors, or misunderstandings to avoid)
        Write all explanations and notes completely in ${finalLanguage}.`;
      } else if (toolId === "research") {
        prompt = `Formulate a rigorous, structures educational scientific research outline and thesis proposal on: "${topic}" aimed at the ${finalLevel} grade level in ${finalLanguage}.
        Return a JSON object with:
        - "abstract" (string summarizing the research goal and questions)
        - "researchScope" (string definition of the experimental bounds or limits)
        - "chapters" (array of exactly 4 chapter objects, each with chapterNum (integer), chapterTitle (string), and subsections (array of strings))
        Ensure all academic headings and content are in ${finalLanguage}.`;
      } else if (toolId === "mnemonics") {
        prompt = `Generate exactly 3 extremely creative, funny mnemonic acronyms, witty sentences, or memory palace architectures to memorize ideas related to: "${topic}" suited for ${finalLevel} in ${finalLanguage}.
        Return a JSON object with a "mnemonics" key containing an array of 3 objects.
        Each mnemonic object MUST have:
        - "acronym" (string, short key word or combination)
        - "phrase" (string, the funny text expansion mapping to the terms)
        - "visualpalace" (string, description of a vivid mental room or scenery to lock the concept)
        Translate all memories and mnemonics into: ${finalLanguage}.`;
      } else if (toolId === "eli5") {
        prompt = `Deconstruct "${topic}" using a humorous and creative analogy suitable for a five-year-old child ("Explain Like I'm 5"), alongside an academic transition translated for a ${finalLevel} student in ${finalLanguage}.
        Return a JSON object containing:
        - "metaphorTitle" (string, funny analogy name)
        - "eli5Metaphor" (string, the actual childish simple explanation)
        - "academicTranslation" (string, how it maps to high-grade technical concepts)
        - "interactiveAnalogyMatch" (string, a quick question or mental check for the student)
        Write the metaphor and translations in ${finalLanguage}.`;
      } else if (toolId === "jargon") {
        prompt = `Extract exactly 6 advanced vocabulary terms, academic headers, or obscure domain-specific jargon associated with: "${topic}" designed for a ${finalLevel} student learning in ${finalLanguage}.
        Return a JSON object with a "words" key containing an array of 6 objects.
        Each object MUST have:
        - "word" (string)
        - "definition" (string, short simplified meaning)
        - "contextSentence" (string showing proper contextual academic usage)
        Generate all vocabularies and translations in ${finalLanguage}.`;
      } else if (toolId === "summarizer") {
        prompt = `Generate a detailed textbook chapter-style summary and revision parameters on "${topic}" designed for ${finalLevel} level in ${finalLanguage}.
        Return a JSON object with:
        - "overview" (string, brief 2-3 sentence overview)
        - "chapters" (an array of exactly 3 objects, each with "chapterTitle" (string) and "bulletPoints" (array of exactly 3 strings showing revision highlights))
        Translate everything completely into ${finalLanguage}.`;
      } else if (toolId === "essay-grader") {
        prompt = `Analyze a simulated academic paper snippet about "${topic}" at the ${finalLevel} level in ${finalLanguage}.
        Return a JSON object containing:
        - "estimatedGrade" (string representing grade A, B, C, D, or F)
        - "feedbackScore" (integer 0-100 indicating visual-technical quality)
        - "issues" (an array of exactly 3 objects, each with "originalText" (string), "errorType" (string), "correction" (string), and "explanation" (string))
        - "overallFeedback" (string offering supportive holistic essay advice)
        Write everything completely in ${finalLanguage}.`;
      } else if (toolId === "lab-report") {
        prompt = `Architect a structures, comprehensive lab experiment sheet regarding "${topic}" at ${finalLevel} grade level in ${finalLanguage}.
        Return a JSON object containing:
        - "experimentTitle" (string)
        - "hypothesis" (string)
        - "materials" (array of exactly 5 experiment equipment/substance items)
        - "safetyRules" (array of exactly 3 safety precautions)
        - "procedure" (array of exactly 4 step-by-step experiment instructions)
        Generate all details in ${finalLanguage}.`;
      } else if (toolId === "formula-sheet") {
        prompt = `Compile a high-yield formula cheat sheet and LaTeX equation guide representing "${topic}" suited for ${finalLevel} mathematics/science levels in ${finalLanguage}.
        Return a JSON object containing:
        - "formulas" (an array of exactly 4 formula objects, each with "name" (string), "latexEquation" (string LaTeX math syntax like "E=mc^2"), "variableDeconstruction" (string deconstructing variables), and "practicalExample" (string example calculation representation))
        Explain formula values in ${finalLanguage}.`;
      } else if (toolId === "paper-questions") {
        prompt = `Extract deep literature assessment questions based on the scholarly topic/abstract of "${topic}" at ${finalLevel} level in ${finalLanguage}.
        Return a JSON object containing:
        - "questions" (an array of exactly 3 questions, each with "questionText" (string), "cognitiveDomain" (string represent Bloom's Level like Analysis/Evaluation), and "modelResponseKey" (string detailed multi-sentence model grading answer guide))
        Formulate evaluation keys in ${finalLanguage}.`;
      } else if (toolId === "socratic") {
        prompt = `Formulate an interactive conversational Socratic dialogue series that guides a ${finalLevel} student to understand "${topic}" intuitively in ${finalLanguage}.
        Return a JSON object containing:
        - "conversation" (an array of exactly 3 milestones, each with "step" (integer), "questionPrompt" (string leading Socratic prompt), "studentConceptTarget" (string conceptual target of this step), and "helperClue" (string supportive hint to guide response))
        Write Socratic clues in ${finalLanguage}.`;
      } else if (toolId === "curriculum-map") {
        prompt = `Break down the educational curriculum topic "${topic}" into milestone guidelines for a ${finalLevel} program in ${finalLanguage}.
        Return a JSON object containing:
        - "map" (an array of exactly 3 targets, each with "unitTitle" (string name of scholastic module), "coreStandardName" (string standard outline identifier), "targetObjective" (string learning target), and "assessmentTask" (string sample classroom test/quiz verification))
        Generate outlines entirely in ${finalLanguage}.`;
      } else if (toolId === "interview-prep") {
        prompt = `Synthesize challenging admission oral prepper questions on "${topic}" at ${finalLevel} level in ${finalLanguage}.
        Return a JSON object containing:
        - "interviewList" (an array of exactly 3 objects, each with "questionText" (string), "coreRubricFactor" (string what interviewer is grading), "modelAnswer" (string ideal high-grade reply), and "criticalTrap" (string common mistake or trap and how to avoid it))
        Explain interview tips in ${finalLanguage}.`;
      } else if (toolId === "citation") {
        prompt = `Synthesize beautiful scholarly citation and bibliography examples representing standard documents on "${topic}" in ${finalLanguage}.
        Return a JSON object containing:
        - "citations" (an array of exactly 4 referencing objects, each with "style" (string like APA, MLA, Chicago, IEEE), "bibliographyEntry" (string formatted citation string), and "inTextCitation" (string parenthetical context citation string))
        Write references completely in ${finalLanguage}.`;
      } else if (toolId === "hypothesis") {
        prompt = `Formulate a comprehensive scientific hypothesis testing plan regarding "${topic}" at the ${finalLevel} learning stage in ${finalLanguage}.
        Return a JSON object with:
        - "scienceStatement" (string proposed testable concept)
        - "independentVariable" (string)
        - "dependentVariable" (string)
        - "controlVariables" (array of exactly 3 variables)
        - "predictedOutcome" (string academic reasoning)
        Write hypothesis parameters completely in ${finalLanguage}.`;
      } else if (toolId === "difference") {
        prompt = `You are an expert academic comparative researcher. For the topics/concepts requested in "${topic}", formulate a clean structured comparison for a student at the ${finalLevel} level in ${finalLanguage}.
        Return a JSON object containing:
        - "comparisonTitle" (string, e.g. "React vs. Vue: Structural Comparative Guide")
        - "introduction" (string, formal overview of both concepts in ${finalLanguage})
        - "columns" (array of exactly 3 header strings, e.g. ["Comparison Feature", "Concept A", "Concept B"])
        - "rows" (array of exactly 5 objects representing comparison criteria. Each object MUST contain "feature" (string), "conceptA" (string), and "conceptB" (string))
        - "detailedAnalyses" (array of exactly 3 bullet points discussing secondary parameters or similarities in ${finalLanguage})
        - "conclusion" (string wrapping up when to choose which concept in ${finalLanguage})
        Generate all explanations and texts in ${finalLanguage}.`;
      } else {
        return res.status(400).json({ error: `Unsupported smart suite tool index: ${toolId}` });
      }

      const result = await getGroqCompletion(prompt, "You are a master academic trainer and learning tools architect. You must return ONLY clean valid parseable JSON. Do not write markdown or backticks.", userKey);
      res.json(JSON.parse(result || "{}"));
    } catch (error: any) {
      console.error(`Smart Suite Tool [${toolId}] Error:`, error);
      res.status(500).json({ error: `Failed to compile smart educational outputs for ${toolId}` });
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
