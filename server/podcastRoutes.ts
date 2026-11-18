import express from 'express';
import {
  extractPcmFromWav,
  generateWithFallback,
  getGeminiClient,
  parseGeminiJson,
  wrapPcmInWav,
} from './geminiClient.ts';

function getDurationScriptGuidance(durationMinutes: number, isMultiSpeaker: boolean) {
  switch (durationMinutes) {
    case 3:
      return {
        wordTarget: '420 to 520 words',
        turnsTarget: isMultiSpeaker ? '10 to 12 conversational turns' : '4 to 6 cohesive segments',
        chaptersTarget: '3 chapters',
      };
    case 10:
      return {
        wordTarget: '1150 to 1400 words',
        turnsTarget: isMultiSpeaker ? '20 to 26 conversational turns' : '7 to 10 cohesive segments',
        chaptersTarget: '4 to 5 chapters',
      };
    case 15:
      return {
        wordTarget: '1650 to 1950 words',
        turnsTarget: isMultiSpeaker ? '26 to 32 conversational turns' : '9 to 12 cohesive segments',
        chaptersTarget: '5 to 6 chapters',
      };
    case 5:
    default:
      return {
        wordTarget: '680 to 820 words',
        turnsTarget: isMultiSpeaker ? '14 to 18 conversational turns' : '5 to 7 cohesive segments',
        chaptersTarget: '3 to 4 chapters',
      };
  }
}

export function registerPodcastRoutes(app: express.Express) {
  // 1. Generate Educational Podcast Episode Script + Learning Tools
  app.post('/api/podcast/generate', async (req, res) => {
    try {
      const {
        topic,
        subject,
        sourceType = 'topic',
        sourceContent,
        sourceBranchLabel,
        format = 'two_host',
        durationMinutes = 5,
        language = 'English',
        level = 'Intermediate',
        tone = 'Friendly and engaging',
        host1Name = 'Alex',
        host2Name = 'Maya',
        host1Voice = 'Puck',
        host2Voice = 'Kore',
        speakingSpeed = 1.0,
      } = req.body;

      if (!topic && !sourceContent) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a topic or provide study material for the podcast.',
        });
      }

      const ai = getGeminiClient(req);
      const isMultiSpeaker = format === 'two_host' || format === 'interview';
      const guidance = getDurationScriptGuidance(Number(durationMinutes), isMultiSpeaker);

      const cleanHost1 = String(host1Name || 'Alex').trim();
      const cleanHost2 = String(host2Name || 'Maya').trim();

      const formatPrompt =
        format === 'two_host'
          ? `Format: Two-Host Educational Podcast between "${cleanHost1}" (curious learner asking genuine, smart follow-up questions) and "${cleanHost2}" (knowledgeable educator explaining clearly with analogies and real-world applications). Sound like two real humans thinking through ideas together—NOT alternating textbook blocks.`
          : format === 'interview'
          ? `Format: Expert Interview Podcast where "${cleanHost1}" (curious interviewer/host) interviews "${cleanHost2}" (subject-matter expert) with sharp probing follow-ups, real-world stories, and practical takeaways.`
          : format === 'storytelling'
          ? `Format: Narrative Storytelling Lesson hosted by "${cleanHost1}". Teach concepts through a vivid narrative arc, real-world scenarios, and clear conceptual bridges.`
          : format === 'exam_revision'
          ? `Format: High-Yield Exam Revision Podcast hosted by "${cleanHost1}". Prioritize critical definitions, core concepts, key formulas/frameworks, illustrative examples, and high-relevance exam pitfalls WITHOUT inventing fake exam leaks or predictions.`
          : `Format: Solo AI Teacher Lesson hosted by "${cleanHost1}". Warm, structured, interactive explanation that anticipates student confusion and uses vivid analogies.`;

      const languagePrompt =
        language === 'Hindi'
          ? 'Language: Natural, clear conversational Hindi written in clean Devanagari script mixed naturally with standard English academic terms where Indian university students expect them.'
          : language === 'Hinglish'
          ? 'Language: Natural, authentic Hinglish (conversational Hindi and English written in clean Roman script, e.g., "Bilkul sahi sawaal hai — iska simple logic yeh hai ki...") just like top Indian EdTech podcasts. Avoid clunky literal translations.'
          : 'Language: Natural, vivid spoken English.';

      const systemInstruction = `You are an elite educational podcast producer and pedagogy scriptwriter.
Create an engaging, factually accurate, deeply educational podcast episode tailored to the student's learning preferences.

${formatPrompt}
${languagePrompt}
Learning Level: ${level}
Tone: ${tone}
Target Length: ${guidance.wordTarget} across ${guidance.turnsTarget}, organized into ${guidance.chaptersTarget}.

SPOKEN SCRIPT QUALITY RULES (CRITICAL FOR AUDIO GENERATION):
- Write clean spoken prose ONLY. Do NOT include markdown bold (**), bullet symbols (* or -), URLs, emojis, or bracketed sound effects like [music plays] in the "text" field of script turns.
- Explain difficult terminology in plain language with relatable analogies and real-life applications.
- Use natural spoken transitions and finish with a crisp spoken recap.
- In two-host / interview episodes, you may occasionally include subtle natural conversational cues like "|mhm|" or "|yeah|" or "<breath>" sparingly when it makes banter feel authentic, and vary turn lengths naturally.
- Every script turn must include its "chapterTitle" matching one of the items in "chapters".

Return STRICT valid JSON matching this schema:
{
  "title": "Compelling podcast episode title",
  "description": "2-sentence episode overview",
  "chapters": [
    {
      "id": "ch-1",
      "title": "Chapter title",
      "summary": "1-sentence summary of what this chapter covers"
    }
  ],
  "script": [
    {
      "id": "turn-1",
      "speaker": "${cleanHost1}",
      "speakerRole": "host1" | "host2",
      "chapterTitle": "Matching chapter title",
      "cueStyle": "Short voice delivery direction (e.g. Curious and warm, Clear and encouraging)",
      "text": "Spoken dialogue text without markdown"
    }
  ],
  "keyTakeaways": ["4 to 6 crisp key takeaways"],
  "importantTerms": [
    {
      "term": "Key Term",
      "definition": "Clear, memorable definition"
    }
  ],
  "summary": "Well-structured 1-2 paragraph written recap of the episode",
  "recapQuestions": [
    {
      "question": "Recap question 1",
      "suggestedAnswer": "Concise high-value answer"
    }
  ],
  "miniQuiz": [
    {
      "id": "pq-1",
      "question": "Multiple-choice comprehension question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Exact matching option text",
      "explanation": "Why this option is right"
    }
  ]
}`;

      let userPrompt = `Topic: "${topic || 'Study Material Podcast'}"
Subject Area: "${subject || 'General Studies'}"
Source Type: ${sourceType}`;

      if (sourceBranchLabel) {
        userPrompt += `\nSpecific Mind Map Branch / Focus: "${sourceBranchLabel}"`;
      }

      if (sourceContent && String(sourceContent).trim()) {
        userPrompt += `\n\nGrounded Study Source Material:\n"""\n${String(sourceContent).slice(0, 18000)}\n"""`;
      }

      userPrompt += `\n\nEnsure 3-5 recapQuestions and 4-5 miniQuiz questions. Ensure all script turns alternate naturally (${
        isMultiSpeaker
          ? `using speakers "${cleanHost1}" (host1) and "${cleanHost2}" (host2)`
          : `using speaker "${cleanHost1}" (host1)`
      }).`;

      const response = await generateWithFallback(
        ai,
        ['gemini-4-hydrogen', 'gemini-3.1-flash-lite', 'gemini-4-argon'],
        (model) => ({
          model,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        })
      );

      const parsed = parseGeminiJson<any>(response.text || '{}');
      const now = new Date().toISOString();

      const rawChapters = Array.isArray(parsed.chapters) ? parsed.chapters : [];
      const rawScript = Array.isArray(parsed.script) ? parsed.script : [];

      // Estimate baseline timestamps (~145 words per min) before real WAV audio refines them
      let cumulativeSec = 0;
      const chapterStartMap: Record<string, number> = {};
      const script = rawScript.map((turn: any, idx: number) => {
        const text = String(turn.text || '').trim();
        const words = text.split(/\s+/).filter(Boolean).length;
        const estDur = Math.max(3, Math.round((words / 145) * 60));
        const chapterTitle = turn.chapterTitle || rawChapters[0]?.title || 'Overview';
        if (chapterStartMap[chapterTitle] === undefined) {
          chapterStartMap[chapterTitle] = cumulativeSec;
        }
        const item = {
          id: turn.id || `turn-${idx + 1}`,
          speaker: isMultiSpeaker
            ? turn.speakerRole === 'host2' || turn.speaker === cleanHost2
              ? cleanHost2
              : cleanHost1
            : cleanHost1,
          speakerRole: (isMultiSpeaker &&
          (turn.speakerRole === 'host2' || turn.speaker === cleanHost2)
            ? 'host2'
            : 'host1') as 'host1' | 'host2',
          text,
          cueStyle: turn.cueStyle || tone,
          chapterTitle,
          approxStartSec: cumulativeSec,
        };
        cumulativeSec += estDur;
        return item;
      });

      const chapters = rawChapters.map((ch: any, idx: number) => ({
        id: ch.id || `ch-${idx + 1}`,
        title: ch.title || `Part ${idx + 1}`,
        summary: ch.summary || '',
        approxStartSec: chapterStartMap[ch.title] ?? Math.round((cumulativeSec / Math.max(1, rawChapters.length)) * idx),
      }));

      const episode = {
        id: `pod-${Date.now()}`,
        topic: String(topic || parsed.title || 'Academic Episode').trim(),
        subject: String(subject || 'General').trim(),
        sourceType,
        sourceBranchLabel: sourceBranchLabel || undefined,
        title: parsed.title || `${topic} — Study Podcast`,
        description: parsed.description || '',
        format,
        targetDurationMinutes: Number(durationMinutes) || 5,
        language,
        level,
        tone,
        host1Name: cleanHost1,
        host2Name: isMultiSpeaker ? cleanHost2 : undefined,
        host1Voice,
        host2Voice: isMultiSpeaker ? host2Voice : undefined,
        speakingSpeed: Number(speakingSpeed) || 1.0,
        script,
        chapters,
        keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
        importantTerms: Array.isArray(parsed.importantTerms) ? parsed.importantTerms : [],
        summary: parsed.summary || '',
        recapQuestions: Array.isArray(parsed.recapQuestions) ? parsed.recapQuestions : [],
        miniQuiz: Array.isArray(parsed.miniQuiz) ? parsed.miniQuiz : [],
        conceptExplanations: [],
        audioGenerated: false,
        audioDurationSec: cumulativeSec,
        playbackProgressSec: 0,
        isCompleted: false,
        isSaved: true,
        isBookmarked: false,
        createdAt: now,
        updatedAt: now,
      };

      res.json({ success: true, episode });
    } catch (error: any) {
      console.error('Podcast script generation error:', error?.message);
      if (error?.message === 'NO_API_KEY') {
        return res.status(400).json({
          success: false,
          code: 'NO_API_KEY',
          error: 'No Gemini API key detected. Configure your Gemini API key in Settings to generate podcasts.',
        });
      }
      res.status(500).json({
        success: false,
        error: 'Failed to generate podcast script. Please try again.',
        details: error?.message,
      });
    }
  });

  // 2. REAL Audio Generation via Gemini 3.8 TTS (Unary WAV -> PCM Stitch -> Complete RIFF WAV)
  app.post('/api/podcast/audio', async (req, res) => {
    try {
      const {
        script,
        format = 'two_host',
        tone = 'Friendly and engaging',
        language = 'English',
        host1Name = 'Alex',
        host2Name = 'Maya',
        host1Voice = 'Puck',
        host2Voice = 'Kore',
      } = req.body;

      if (!Array.isArray(script) || script.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'A generated podcast script is required before synthesizing audio.',
        });
      }

      const aiBeta = getGeminiClient(req, 'v1beta');
      const aiAlpha = getGeminiClient(req, 'v1alpha');
      const isMultiSpeaker = format === 'two_host' || format === 'interview';
      const cleanHost1 = String(host1Name || 'Alex').trim();
      const cleanHost2 = String(host2Name || 'Maya').trim();
      const primaryVoice = host1Voice || 'Puck';
      const secondaryVoice =
        host2Voice && host2Voice !== primaryVoice
          ? host2Voice
          : primaryVoice === 'Kore'
          ? 'Puck'
          : 'Kore';

      // Group turns into manageable chunks (~1600 chars each) so long 5-15 min episodes synthesize reliably
      const chunks: any[][] = [];
      let currentChunk: any[] = [];
      let currentCharCount = 0;

      for (const turn of script) {
        const text = String(turn.text || '').trim();
        if (!text) continue;
        if (currentChunk.length > 0 && (currentCharCount + text.length > 1600 || currentChunk.length >= 10)) {
          chunks.push(currentChunk);
          currentChunk = [];
          currentCharCount = 0;
        }
        currentChunk.push(turn);
        currentCharCount += text.length;
      }
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }

      const pcmBuffers: Buffer[] = [];
      const turnTimestamps: Record<string, number> = {};
      let elapsedSec = 0;

      for (const chunkTurns of chunks) {
        const chunkStartSec = elapsedSec;
        let response: any;

        if (isMultiSpeaker) {
          const parts = chunkTurns.map((turn: any) => {
            const speaker = turn.speakerRole === 'host2' ? cleanHost2 : cleanHost1;
            const cleanText = String(turn.text || '').replace(/[\*_`#]/g, '').trim();
            return {
              text: `${speaker}: ${cleanText}`,
              speechMetadata: {
                speaker,
                style: `${turn.cueStyle || tone}, natural ${language} podcast conversation`,
              },
            };
          });

          const buildMultiSpeakerReq = (includeMetadata: boolean) => ({
            model: 'gemini-3.8-flash-tts',
            contents: [
              {
                role: 'user',
                parts: includeMetadata
                  ? parts
                  : parts.map((p: any) => ({ text: p.text })),
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                multiSpeakerVoiceConfig: {
                  speakerVoiceConfigs: [
                    {
                      speaker: cleanHost1,
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: primaryVoice },
                      },
                    },
                    {
                      speaker: cleanHost2,
                      voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: secondaryVoice },
                      },
                    },
                  ],
                },
              },
            },
          });

          try {
            response = await generateWithFallback(
              aiAlpha,
              ['gemini-3.8-flash-tts'],
              () => buildMultiSpeakerReq(true)
            );
          } catch (alphaErr: any) {
            try {
              response = await generateWithFallback(
                aiBeta,
                ['gemini-3.8-flash-tts'],
                () => buildMultiSpeakerReq(true)
              );
            } catch {
              response = await generateWithFallback(
                aiBeta,
                ['gemini-3.8-flash-tts'],
                () => buildMultiSpeakerReq(false)
              );
            }
          }
        } else {
          const combinedText = chunkTurns
            .map((turn: any) => String(turn.text || '').replace(/[\*_`#]/g, '').trim())
            .join('\n\n');

          const buildSingleSpeakerReq = (model: string, includeMetadata: boolean) => ({
            model,
            contents: [
              {
                role: 'user',
                parts: [
                  includeMetadata
                    ? {
                        text: combinedText,
                        speechMetadata: {
                          style: `${tone}, engaging ${language} educational podcast narrator`,
                        },
                      }
                    : { text: combinedText },
                ],
              },
            ],
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: primaryVoice },
                },
              },
            },
          });

          try {
            response = await generateWithFallback(
              aiAlpha,
              ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'],
              (model) => buildSingleSpeakerReq(model, true)
            );
          } catch {
            try {
              response = await generateWithFallback(
                aiBeta,
                ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'],
                (model) => buildSingleSpeakerReq(model, true)
              );
            } catch {
              response = await generateWithFallback(
                aiBeta,
                ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'],
                (model) => buildSingleSpeakerReq(model, false)
              );
            }
          }
        }

        // Collect all audio parts from candidate
        const candidateParts = response?.candidates?.[0]?.content?.parts || [];
        const chunkPcms: Buffer[] = [];
        for (const p of candidateParts) {
          if (p?.inlineData?.data) {
            const wavOrPcm = Buffer.from(p.inlineData.data, 'base64');
            chunkPcms.push(extractPcmFromWav(wavOrPcm));
          }
        }

        if (chunkPcms.length === 0) {
          throw new Error('Audio model returned an empty audio payload for this section.');
        }

        const chunkPcm = Buffer.concat(chunkPcms);
        pcmBuffers.push(chunkPcm);

        // 24kHz * 1 channel * 2 bytes = 48000 bytes/sec
        const chunkDurationSec = chunkPcm.length / 48000;
        const totalChars = chunkTurns.reduce(
          (sum: number, t: any) => sum + String(t.text || '').length,
          0
        ) || 1;

        let localCharOffset = 0;
        for (const t of chunkTurns) {
          const turnId = t.id;
          if (turnId) {
            turnTimestamps[turnId] = Math.round(
              chunkStartSec + (localCharOffset / totalChars) * chunkDurationSec
            );
          }
          localCharOffset += String(t.text || '').length;
        }

        elapsedSec += chunkDurationSec;
      }

      if (pcmBuffers.length === 0) {
        return res.status(500).json({
          success: false,
          error: 'Could not synthesize audio for this podcast script.',
        });
      }

      const finalPcm = Buffer.concat(pcmBuffers);
      const finalWav = wrapPcmInWav(finalPcm, 24000, 1, 16);
      const exactDurationSec = Math.round(finalPcm.length / 48000);

      res.json({
        success: true,
        mimeType: 'audio/wav',
        audioBase64: finalWav.toString('base64'),
        durationSec: exactDurationSec,
        turnTimestamps,
      });
    } catch (error: any) {
      console.error('Podcast audio synthesis error:', error?.message);
      if (error?.message === 'NO_API_KEY') {
        return res.status(400).json({
          success: false,
          code: 'NO_API_KEY',
          error:
            'Audio generation requires a configured Gemini API key. Add your key in Settings or set GEMINI_API_KEY on the server.',
        });
      }
      res.status(500).json({
        success: false,
        code: 'TTS_FAILED',
        error:
          error?.message ||
          'Real audio synthesis failed. Check your Gemini API key permissions for gemini-3.8-flash-tts and try again.',
      });
    }
  });

  // 3. "Explain This Concept" Micro-Explainer within an Episode
  app.post('/api/podcast/explain-concept', async (req, res) => {
    try {
      const { concept, episodeTitle, topic, language = 'English', level = 'Intermediate' } =
        req.body;

      if (!concept || !String(concept).trim()) {
        return res.status(400).json({
          success: false,
          error: 'Please enter or select a concept to explain.',
        });
      }

      const ai = getGeminiClient(req);

      const response = await generateWithFallback(
        ai,
        ['gemini-4-hydrogen', 'gemini-3.1-flash-lite', 'gemini-4-argon'],
        (model) => ({
          model,
          contents: `Episode: "${episodeTitle || topic}"
Concept selected by student: "${concept}"
Target Language: ${language}
Student Level: ${level}

Provide an immediate, crystal-clear breakdown without unnecessary jargon.
Return strict JSON:
{
  "simpleExplanation": "2-3 sentence intuitive explanation in ${language}",
  "analogy": "1 vivid everyday analogy that makes it click immediately",
  "example": "1 concrete academic or real-world example"
}`,
          config: {
            responseMimeType: 'application/json',
          },
        })
      );

      const parsed = parseGeminiJson<any>(response.text || '{}');
      res.json({
        success: true,
        explanation: {
          concept: String(concept).trim(),
          simpleExplanation: parsed.simpleExplanation || '',
          analogy: parsed.analogy || '',
          example: parsed.example || '',
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('Explain concept error:', error?.message);
      if (error?.message === 'NO_API_KEY') {
        return res.status(400).json({
          success: false,
          error: 'No Gemini API key detected. Please configure it in Settings.',
        });
      }
      res.status(500).json({
        success: false,
        error: 'Could not explain this concept right now. Please try again.',
      });
    }
  });

  // 4. Grounded AI Learning Recommendations
  app.post('/api/learning/recommendations', async (req, res) => {
    try {
      const { currentTopic, stats, packs, caseStudies, podcasts } = req.body;
      const ai = getGeminiClient(req);

      const systemInstruction = `You are a personalized academic study coach inside AI StudyMate.
The learning loop has 6 stages:
1. learn (Handwritten Notes, Summaries, Mind Maps, YouTube)
2. listen (Listen & Learn AI Podcast)
3. apply (Case Study Lab)
4. test (Interactive Quiz & Viva)
5. improve (Analyze weak topics / case gaps)
6. revise (Short revision podcast, quick revision notes, exam prep)

CRITICAL GROUNDING RULE:
- Base EVERY recommendation STRICTLY on the real student data provided below.
- Never invent scores, completed items, or weak topics that are not in the data.
- Return 3 to 4 crisp, high-value next actions.

Return strict JSON array:
[
  {
    "id": "rec-1",
    "stage": "learn" | "listen" | "apply" | "test" | "improve" | "revise",
    "title": "Actionable recommendation title",
    "reason": "Specific reason grounded in the student's actual data",
    "actionLabel": "Short CTA button text (2-4 words)",
    "targetTab": "notes" | "mindmap" | "podcast" | "casestudy" | "quiz" | "viva" | "youtube" | "summary",
    "topic": "Specific topic name",
    "priority": "high" | "medium" | "normal"
  }
]`;

      const prompt = `Current Active Study Pack Topic: "${currentTopic || 'None'}"
Real Student Metrics: ${JSON.stringify(stats || {})}
Study Packs Summary: ${JSON.stringify(packs || [])}
Case Studies History: ${JSON.stringify(caseStudies || [])}
Podcasts History: ${JSON.stringify(podcasts || [])}

Recommend the smartest next steps along the learning loop now.`;

      const response = await generateWithFallback(
        ai,
        ['gemini-3.1-flash-lite', 'gemini-4-hydrogen', 'gemini-4-argon'],
        (model) => ({
          model,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        })
      );

      const parsed = parseGeminiJson<any[]>(response.text || '[]', '[]');
      res.json({
        success: true,
        recommendations: Array.isArray(parsed) ? parsed.slice(0, 4) : [],
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error?.message || 'Could not compute AI recommendations.',
      });
    }
  });
}
