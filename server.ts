import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { generateWithFallback, getGeminiClient } from './server/geminiClient.ts';
import { registerCaseStudyRoutes } from './server/caseStudyRoutes.ts';
import { registerPodcastRoutes } from './server/podcastRoutes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '80mb' }));
app.use(express.urlencoded({ extended: true, limit: '80mb' }));

// 1. Test Gemini Connection
app.get('/api/gemini/status', (req, res) => {
  const hasEnvKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    hasEnvKey,
    provider: 'Google Gemini',
    model: 'gemini-3.8-flash',
  });
});

app.post('/api/gemini/test-connection', async (req, res) => {
  try {
    const ai = getGeminiClient(req);
    const response = await generateWithFallback(
      ai,
      ['gemini-3.1-flash-lite', 'gemini-4-hydrogen', 'gemini-4-argon'],
      (model) => ({
        model,
        contents: 'Ping test. Reply with: OK',
        config: {
          thinkingConfig: { thinkingLevel: 'LOW' as any },
        },
      })
    );

    res.json({
      success: true,
      message: 'Successfully connected to Google Gemini API',
      model: 'gemini-4-hydrogen',
      reply: response.text?.trim() || 'OK',
    });
  } catch (error: any) {
    if (error?.message === 'NO_API_KEY') {
      return res.status(400).json({
        success: false,
        error: 'No Gemini API key provided. Please configure it in Settings or set GEMINI_API_KEY in environment.',
      });
    }
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to authenticate with Gemini API. Please check your API key.',
    });
  }
});

// 2. Main Study Pack Generator
app.post('/api/study/generate', async (req, res) => {
  try {
    const { topic, text, image, modules } = req.body;

    if (!topic && !text && !image) {
      return res.status(400).json({
        error: 'Please provide either a topic, uploaded text/document content, or an image.',
      });
    }

    const ai = getGeminiClient(req);

    const systemInstruction = `You are AI StudyMate, an expert academic study assistant for MBA, BBA, college, and university students.
Analyze the provided topic or study material thoroughly.
Always generate academically rigorous, practical, clear, and structured study resources.
Ground all your outputs strictly in the provided study material or fundamental academic discipline.
Do not hallucinate facts.

You must return valid JSON matching this exact structure:
{
  "title": "Clear concise topic title",
  "subject": "Academic discipline/subject (e.g. Marketing, Finance, Computer Science, Economics)",
  "summary": {
    "quickRevision": ["Array of up to 10 punchy, high-impact exam revision bullet points"],
    "examNotes": "Comprehensive, formal academic explanation structured for university exams",
    "deepLearning": "Detailed explanation with real-world industry case studies, examples, and practical applications",
    "easyLanguageVersion": "Plain-English, conversational, simplified explanation (no jargon, intuitive analogies)"
  },
  "keyPoints": ["6-10 essential takeaways every student must memorize"],
  "definitions": [
    {
      "id": "def-1",
      "term": "Term Name",
      "definition": "Clear academic definition",
      "example": "Real-world example",
      "category": "Domain category"
    }
  ],
  "concepts": [
    {
      "id": "con-1",
      "concept": "Concept Name",
      "simpleExplanation": "Clear, accessible explanation",
      "example": "Practical illustration",
      "whyItMatters": "Strategic or real-world significance",
      "relatedConcepts": ["Concept A", "Concept B"]
    }
  ],
  "examImportantTopics": [
    {
      "topic": "Key Subtopic",
      "importance": "Critical" | "High" | "Medium",
      "expectedQuestionTypes": ["10-mark essay", "Case analysis", "Short note"],
      "keyFocusAreas": "Specific elements examiners focus on",
      "previousExamFrequency": "Commonly asked in university finals"
    }
  ],
  "handwrittenNotes": [
    {
      "id": "note-1",
      "heading": "Section Heading (e.g. I. Core Framework)",
      "subheading": "Context or key theorist",
      "content": "Student style formatted notes with arrows (->), bullet points, and clear takeaways",
      "keyFormulasOrRules": ["Important rule, formula, or mnemonic"],
      "examTip": "High-scoring exam tip or common pitfall to avoid",
      "diagramDescription": "Sketch or layout description of a diagram for this section"
    }
  ],
  "mindMap": {
    "id": "root",
    "label": "Central Subject",
    "description": "High level description",
    "children": [
      {
        "id": "branch-1",
        "label": "Major Subtopic 1",
        "description": "Brief description",
        "children": [
          { "id": "leaf-1-1", "label": "Detail item A" },
          { "id": "leaf-1-2", "label": "Detail item B" }
        ]
      }
    ]
  },
  "quiz": [
    {
      "id": "q-1",
      "type": "mcq" | "true_false" | "short_answer" | "case_based",
      "difficulty": "easy" | "medium" | "hard",
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact matching option text or answer",
      "explanation": "Why this is correct and why other options are wrong",
      "topicTag": "Specific subtopic tag",
      "caseScenario": "Optional short paragraph if case_based"
    }
  ],
  "shortQuestions": [
    {
      "question": "Academic short answer question",
      "answer": "Model crisp answer suitable for 3-5 marks",
      "marks": 5
    }
  ],
  "caseQuestions": [
    {
      "caseText": "A real-world mini business or academic scenario (2-3 sentences)",
      "question": "Evaluative question asking the student to apply frameworks",
      "modelAnswer": "Structured high-scoring model answer"
    }
  ],
  "vivaQuestions": [
    {
      "id": "viva-1",
      "question": "Direct oral viva/interview question",
      "topic": "Subtopic tested",
      "sampleAnswer": "Ideal verbal answer concise and confident",
      "keyPointsExpected": ["Key point 1", "Key point 2", "Key point 3"]
    }
  ],
  "studyPlan": [
    {
      "dayNumber": 1,
      "dateStr": "Day 1: Foundations",
      "topic": "Core topic name",
      "studyTimeMinutes": 45,
      "revisionTasks": ["Read concepts", "Memorize definitions", "Review diagram"],
      "quizAction": "Complete introductory 5-question quiz"
    }
  ],
  "youtubeSearchQueries": [
    {
      "id": "yt-1",
      "title": "Topic Overview & Crash Course",
      "channel": "Top Academic / Explainer Channels",
      "duration": "12-15 mins",
      "topicRelevance": "Foundational visual understanding with animations",
      "searchQuery": "Topic crash course lecture explained"
    }
  ]
}`;

    const parts: any[] = [];

    if (image && image.data && image.mimeType) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    }

    let userPromptText = `Please analyze the following material and generate a comprehensive study pack.\n`;
    if (topic) {
      userPromptText += `Topic: "${topic}"\n`;
    }
    if (text) {
      userPromptText += `Study Material Text:\n"""\n${text.slice(0, 40000)}\n"""\n`;
    }
    if (modules && Array.isArray(modules) && modules.length > 0) {
      userPromptText += `Focus specifically on providing rich details for: ${modules.join(', ')}.\n`;
    }
    userPromptText += `Ensure the output is strictly valid JSON without any markdown ticks or wrap with \`\`\`json.`;

    parts.push({ text: userPromptText });

    const response = await generateWithFallback(
      ai,
      ['gemini-4-hydrogen', 'gemini-3.1-flash-lite', 'gemini-4-argon'],
      (model) => ({
        model,
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      })
    );

    const responseText = response.text || '{}';
    let parsedData: any;
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      // In case wrapped in markdown code fence
      const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    // Assemble final StudyPack
    const finalPack = {
      id: 'pack-' + Date.now(),
      title: parsedData.title || topic || 'Generated Study Pack',
      subject: parsedData.subject || 'General Studies',
      createdAt: new Date().toISOString(),
      isFavorite: false,
      isDemo: false,
      sourceType: image ? 'image' : (text ? 'document' : 'topic'),
      sourceName: topic || (text ? 'Uploaded Document' : 'Uploaded Image'),
      summary: parsedData.summary || {
        quickRevision: parsedData.keyPoints || [],
        examNotes: parsedData.summary?.examNotes || '',
        deepLearning: parsedData.summary?.deepLearning || '',
        easyLanguageVersion: parsedData.summary?.easyLanguageVersion || '',
      },
      keyPoints: parsedData.keyPoints || [],
      definitions: parsedData.definitions || [],
      concepts: parsedData.concepts || [],
      examImportantTopics: parsedData.examImportantTopics || [],
      handwrittenNotes: parsedData.handwrittenNotes || [],
      mindMap: parsedData.mindMap || { id: 'root', label: topic || 'Topic', children: [] },
      quiz: parsedData.quiz || [],
      shortQuestions: parsedData.shortQuestions || [],
      caseQuestions: parsedData.caseQuestions || [],
      vivaQuestions: parsedData.vivaQuestions || [],
      studyPlan: parsedData.studyPlan || [],
      youtubeResources: parsedData.youtubeSearchQueries || [],
    };

    res.json({ success: true, studyPack: finalPack });
  } catch (error: any) {
    console.error('Study pack generation error:', error?.message);
    if (error?.message === 'NO_API_KEY') {
      return res.status(400).json({
        error: 'No Gemini API key detected. Please add your Gemini API key in Settings.',
      });
    }
    res.status(500).json({
      error: 'Something went wrong while generating your study pack. Please check your Gemini API connection and try again.',
      details: error?.message,
    });
  }
});

// 3. AI Viva Evaluation Endpoint
app.post('/api/study/viva-evaluate', async (req, res) => {
  try {
    const { question, studentAnswer, topic, keyPointsExpected } = req.body;

    if (!question || !studentAnswer) {
      return res.status(400).json({ error: 'Question and student answer are required' });
    }

    const ai = getGeminiClient(req);

    const systemInstruction = `You are a university professor conducting an oral viva voce examination.
Evaluate the student's answer to the viva question objectively.
Base confidence and score indicators strictly on the content of the answer (accuracy, terminology, logical flow, completeness), NOT on psychological speculation.
Return strict JSON with this schema:
{
  "accuracyScore": number (0 to 10),
  "clarityScore": number (0 to 10),
  "completenessScore": number (0 to 10),
  "totalScore": number (0 to 10),
  "whatYouDidWell": ["Point 1", "Point 2"],
  "whatYouCanImprove": ["Point 1", "Point 2"],
  "betterAnswer": "Concise, articulate, high-scoring model answer that the student can study"
}`;

    const prompt = `Topic: ${topic || 'Academic Examination'}
Viva Question: "${question}"
Key Points Expected by Examiner: ${JSON.stringify(keyPointsExpected || [])}
Student's Verbal/Written Answer: """${studentAnswer}"""

Evaluate the student's answer now:`;

    const response = await generateWithFallback(
      ai,
      ['gemini-4-hydrogen', 'gemini-3.1-flash-lite', 'gemini-4-argon'],
      (model) => ({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      })
    );

    const responseText = response.text || '{}';
    let evaluation: any;
    try {
      evaluation = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      evaluation = JSON.parse(cleaned);
    }

    res.json({ success: true, evaluation });
  } catch (error: any) {
    console.error('Viva evaluation error:', error?.message);
    if (error?.message === 'NO_API_KEY') {
      return res.status(400).json({ error: 'Please add your Gemini API key in Settings.' });
    }
    res.status(500).json({ error: 'Failed to evaluate viva answer. Please try again.' });
  }
});

// 4. Personalized Exam Study Planner Generator
app.post('/api/study/study-plan', async (req, res) => {
  try {
    const { subject, examDate, availableHoursPerDay, chapters } = req.body;
    const ai = getGeminiClient(req);

    const systemInstruction = `You are an academic productivity coach.
Generate a structured day-by-day exam revision schedule based on the student's exam date, available daily study hours, and topics.
Return strict JSON as an array of days:
[
  {
    "dayNumber": 1,
    "dateStr": "Day 1: Topic Focus",
    "topic": "Specific Topic",
    "studyTimeMinutes": 60,
    "revisionTasks": ["Task 1", "Task 2", "Task 3"],
    "quizAction": "Action for self-test"
  }
]`;

    const prompt = `Subject: ${subject}
Exam Target Date: ${examDate}
Available Study Hours Per Day: ${availableHoursPerDay || 2} hours
Chapters / Syllabus Topics: """${chapters}"""

Create a realistic, progressive revision plan that peaks before the exam with active recall and revision cycles:`;

    const response = await generateWithFallback(
      ai,
      ['gemini-4-hydrogen', 'gemini-3.1-flash-lite', 'gemini-4-argon'],
      (model) => ({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      })
    );

    const responseText = response.text || '[]';
    let plan: any;
    try {
      plan = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      plan = JSON.parse(cleaned);
    }

    res.json({ success: true, plan });
  } catch (error: any) {
    if (error?.message === 'NO_API_KEY') {
      return res.status(400).json({ error: 'Please add your Gemini API key in Settings.' });
    }
    res.status(500).json({ error: 'Failed to generate study plan.' });
  }
});

// 5. YouTube Search Endpoint (with optional YouTube Data API v3 integration)
app.post('/api/youtube/search', async (req, res) => {
  try {
    const { query, apiKey } = req.body;
    const ytApiKey = (apiKey && apiKey.trim() !== '') ? apiKey.trim() : process.env.YOUTUBE_API_KEY;

    if (ytApiKey && ytApiKey.trim() !== '') {
      try {
        const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=6&q=${encodeURIComponent(query)}&type=video&key=${ytApiKey}`;
        const ytRes = await fetch(ytUrl);
        const data = await ytRes.json();

        if (data.items && Array.isArray(data.items)) {
          const videos = data.items.map((item: any) => ({
            id: item.id?.videoId || Math.random().toString(),
            title: item.snippet?.title || query,
            channel: item.snippet?.channelTitle || 'YouTube Creator',
            thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
            videoUrl: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
            topicRelevance: 'Retrieved via official YouTube Data API based on syllabus query',
            searchQuery: query,
          }));
          return res.json({ success: true, fromApi: true, videos });
        }
      } catch (ytErr) {
        console.warn('YouTube API call failed, falling back to query links:', ytErr);
      }
    }

    // Fallback if no YouTube API key or API call fails:
    res.json({
      success: true,
      fromApi: false,
      videos: [
        {
          id: 'q-' + Date.now(),
          title: `Search on YouTube: "${query}"`,
          channel: 'Top Educational Creators on YouTube',
          videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
          topicRelevance: 'Direct link to curated YouTube search results for your study topic.',
          searchQuery: query,
        },
      ],
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to search YouTube.' });
  }
});

// Register Case Study Lab & Listen & Learn Podcast Routes
registerCaseStudyRoutes(app);
registerPodcastRoutes(app);

// Setup Vite middlewares for development or static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI StudyMate server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
