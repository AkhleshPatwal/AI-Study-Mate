import express from 'express';
import {
  generateWithFallback,
  getGeminiClient,
  parseGeminiJson,
} from './geminiClient.ts';

export function registerCaseStudyRoutes(app: express.Express) {
  // 1. Generate Realistic Interactive Case Study
  app.post('/api/case-study/generate', async (req, res) => {
    try {
      const {
        topic,
        subject,
        difficulty = 'Intermediate',
        caseType = 'Business',
        length = 'Medium',
        learningObjective,
        studyPackContext,
      } = req.body;

      if (!topic || !String(topic).trim()) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a topic or concept for the case study.',
        });
      }

      const ai = getGeminiClient(req);

      const lengthGuidance =
        length === 'Short'
          ? 'Concise, focused scenario (~300 words total narrative, 3 data points, 2–3 stakeholders, 2 complications, 3 decision paths).'
          : length === 'Detailed'
          ? 'Rich executive-grade narrative (~700 words total narrative, 5–6 data points with nuanced constraints, 4 stakeholders with conflicting incentives, 4 complications, 3–4 strategic decision paths).'
          : 'Balanced realistic scenario (~450 words total narrative, 4–5 data points, 3 stakeholders, 3 complications, 3 decision paths).';

      const systemInstruction = `You are a senior academic case-method professor and industry strategist (Harvard Business School / MBA / university STEM & management pedagogy).
Design an original, realistic, engaging decision-making case study where a student acts as the decision-maker.
Do NOT reveal solutions, recommended answers, or grading rubrics in the case prompt itself.

CRITICAL DATA INTEGRITY RULE:
- Realistic business figures, budgets, conversion rates, unit economics, operational capacities, or customer feedback make cases compelling.
- You MUST clearly distinguish fictional illustrative scenario figures ("dataType": "illustrative") from established historical/published facts or theoretical benchmarks ("dataType": "verified_context").
- Never present invented company financials as real-world historical data.

Return STRICT valid JSON matching this schema:
{
  "title": "Engaging case title (e.g. 'Pricing Crossroads at Nimbus Cloud Retail')",
  "roleTitle": "Role the student assumes (e.g. 'VP of Growth Strategy')",
  "companyBackground": "Detailed background of the organization, founding context, current products/operations",
  "industryAndContext": "Macro industry conditions, competitive dynamics, regulatory or market pressures",
  "mainProblem": "Neutral framing of the core dilemma without giving away the answer",
  "factsAndData": [
    {
      "label": "Metric or Fact Name (e.g. Customer Acquisition Cost)",
      "value": "Concrete number or constraint (e.g. $142, up 28% YoY)",
      "dataType": "illustrative" | "verified_context",
      "sourceNote": "e.g. Illustrative company operational figure for this scenario"
    }
  ],
  "dataDisclaimer": "One clear sentence explaining which figures are illustrative for this case exercise versus real-world context.",
  "stakeholders": [
    {
      "name": "Stakeholder Name & Title",
      "role": "Department or Interest Group",
      "priority": "Their competing goal, concern, or constraint"
    }
  ],
  "complications": ["Concrete competing priority or constraint 1", "Complication 2", "Complication 3"],
  "decisionSituation": "Clear statement of the immediate decision the student must make right now and under what constraints",
  "decisionOptions": [
    {
      "id": "opt-1",
      "title": "Short decisive option label",
      "summary": "What this strategic option entails",
      "strategicTradeoff": "What is gained vs what is sacrificed",
      "consequencePreview": "Immediate realistic consequence that unfolds in the simulation once chosen (without declaring it 'right' or 'wrong')",
      "stakeholderImpact": "How key stakeholders react to this move",
      "nextDilemma": "Secondary tension or execution hurdle triggered by this choice that the student should address in their written plan",
      "scoreAlignment": "strong" | "mixed" | "risky"
    }
  ],
  "guidingQuestions": [
    "Analytical prompt 1 (e.g. Which core theoretical framework applies here and why?)",
    "Analytical prompt 2",
    "Analytical prompt 3"
  ]
}`;

      let userPrompt = `Generate a ${difficulty}-level ${caseType} case study of ${length} length.
Length Guidance: ${lengthGuidance}
Core Topic / Concept to Apply: "${topic}"
Academic Subject: "${subject || caseType}"`;

      if (learningObjective && String(learningObjective).trim()) {
        userPrompt += `\nTarget Learning Objective: "${learningObjective.trim()}"`;
      }

      if (studyPackContext && String(studyPackContext).trim()) {
        userPrompt += `\n\nConnect organically to the student's active study material:\n"""\n${String(studyPackContext).slice(0, 6000)}\n"""`;
      }

      userPrompt += `\n\nEnsure 3 distinct, plausible decisionOptions so none are obviously silly traps. Each option must have realistic tradeoffs and an evolving consequencePreview + nextDilemma.`;

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

      const caseStudy = {
        id: `case-${Date.now()}`,
        topic: String(topic).trim(),
        subject: String(subject || caseType || 'General').trim(),
        difficulty,
        caseType,
        length,
        learningObjective: learningObjective ? String(learningObjective).trim() : '',
        title: parsed.title || `Case Analysis: ${topic}`,
        roleTitle: parsed.roleTitle || 'Lead Strategist',
        companyBackground: parsed.companyBackground || '',
        industryAndContext: parsed.industryAndContext || '',
        mainProblem: parsed.mainProblem || '',
        factsAndData: Array.isArray(parsed.factsAndData) ? parsed.factsAndData : [],
        dataDisclaimer:
          parsed.dataDisclaimer ||
          'Scenario figures marked as illustrative are realistic fictional data created for this decision exercise.',
        stakeholders: Array.isArray(parsed.stakeholders) ? parsed.stakeholders : [],
        complications: Array.isArray(parsed.complications) ? parsed.complications : [],
        decisionSituation: parsed.decisionSituation || '',
        decisionOptions: Array.isArray(parsed.decisionOptions) ? parsed.decisionOptions : [],
        guidingQuestions: Array.isArray(parsed.guidingQuestions) ? parsed.guidingQuestions : [],
        status: 'not_started',
        isSaved: true,
        isBookmarked: false,
        attempts: [],
        followUpQuestions: [],
        createdAt: now,
        updatedAt: now,
      };

      res.json({ success: true, caseStudy });
    } catch (error: any) {
      console.error('Case study generation error:', error?.message);
      if (error?.message === 'NO_API_KEY') {
        return res.status(400).json({
          success: false,
          error: 'No Gemini API key detected. Please configure your Gemini API key in Settings.',
        });
      }
      res.status(500).json({
        success: false,
        error: 'Failed to generate case study. Please verify your Gemini connection and try again.',
        details: error?.message,
      });
    }
  });

  // 2. AI Case Study Evaluation + Adaptive Follow-Up Challenge Generator
  app.post('/api/case-study/evaluate', async (req, res) => {
    try {
      const {
        caseStudy,
        selectedDecisionId,
        identifiedProblem,
        studentSolution,
        reasoning,
      } = req.body;

      if (!caseStudy || !studentSolution || !String(studentSolution).trim()) {
        return res.status(400).json({
          success: false,
          error: 'Case context and your written solution are required for evaluation.',
        });
      }

      const ai = getGeminiClient(req);

      const chosenOption = (caseStudy.decisionOptions || []).find(
        (opt: any) => opt.id === selectedDecisionId
      );

      const systemInstruction = `You are a university case-study examiner evaluating a student's strategic decision and written analysis.
IMPORTANT GRADING PHILOSOPHY:
- NEVER grade merely by keyword matching.
- Accept diverse valid strategic approaches when supported by coherent logic, evidence from the case facts, and sound application of concepts.
- Score honestly out of 100 based on the weighted quality across 9 dimensions (each scored 0-100, and overallScore is a holistic 0-100 synthesis).
- Be constructive, rigorous, and specific to what the student actually wrote.
- Also generate 3–4 adaptive Follow-Up Challenge "what-if" questions tailored directly to the student's chosen decision, blind spots, and difficulty level (${caseStudy.difficulty}).

Return STRICT valid JSON matching this schema:
{
  "evaluation": {
    "overallScore": number (0 to 100),
    "criteriaScores": {
      "problemIdentification": number (0 to 100),
      "conceptualUnderstanding": number (0 to 100),
      "analyticalThinking": number (0 to 100),
      "logicalReasoning": number (0 to 100),
      "theoreticalApplication": number (0 to 100),
      "creativity": number (0 to 100),
      "practicalFeasibility": number (0 to 100),
      "decisionQuality": number (0 to 100),
      "justification": number (0 to 100)
    },
    "overallEvaluation": "2-4 sentence substantive synthesis of the student's submission",
    "strengths": ["Specific strength 1", "Specific strength 2"],
    "missingConsiderations": ["Important stakeholder, constraint, or data point overlooked"],
    "weakReasoning": ["Logical leap, assumption, or flaw (or state 'No major logical flaws detected' if strong)"],
    "areasForImprovement": ["Concrete actionable improvement 1", "Improvement 2"],
    "recommendedSolution": "Comprehensive recommended executive action plan grounded in the case numbers and topic theory",
    "excellentAnswerExample": "An exemplar 100-level student response demonstrating how to structure problem diagnosis, framework application, tradeoffs, and execution",
    "lessonsLearned": ["Key transferable takeaway 1", "Takeaway 2", "Takeaway 3"]
  },
  "followUpQuestions": [
    {
      "id": "fu-1",
      "scenarioTwist": "e.g. Budget Cut (-30%)",
      "question": "What if the CFO cuts your project budget by 30% tomorrow—how would your proposed plan adapt?",
      "hint": "Think about fixed vs variable commitments or phased rollout"
    }
  ]
}`;

      const prompt = `CASE STUDY CONTEXT:
Title: ${caseStudy.title}
Topic: ${caseStudy.topic} (${caseStudy.subject}, Difficulty: ${caseStudy.difficulty})
Company & Industry: ${caseStudy.companyBackground}\n${caseStudy.industryAndContext}
Main Problem: ${caseStudy.mainProblem}
Facts & Constraints: ${JSON.stringify(caseStudy.factsAndData || [])}
Complications: ${JSON.stringify(caseStudy.complications || [])}
Decision Dilemma: ${caseStudy.decisionSituation}

STUDENT SUBMISSION:
Selected Decision Path: ${chosenOption ? `${chosenOption.title} — ${chosenOption.summary}` : 'Custom / Not specified'}
Problem Identified by Student: """${identifiedProblem || ''}"""
Proposed Solution: """${studentSolution}"""
Reasoning & Justification: """${reasoning || ''}"""

Evaluate the submission fairly and generate adaptive follow-up questions now.`;

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

      const parsed = parseGeminiJson<any>(response.text || '{}');

      const evalData = parsed.evaluation || {};
      const clamp = (n: any) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

      const evaluation = {
        overallScore: clamp(evalData.overallScore),
        criteriaScores: {
          problemIdentification: clamp(evalData.criteriaScores?.problemIdentification),
          conceptualUnderstanding: clamp(evalData.criteriaScores?.conceptualUnderstanding),
          analyticalThinking: clamp(evalData.criteriaScores?.analyticalThinking),
          logicalReasoning: clamp(evalData.criteriaScores?.logicalReasoning),
          theoreticalApplication: clamp(evalData.criteriaScores?.theoreticalApplication),
          creativity: clamp(evalData.criteriaScores?.creativity),
          practicalFeasibility: clamp(evalData.criteriaScores?.practicalFeasibility),
          decisionQuality: clamp(evalData.criteriaScores?.decisionQuality),
          justification: clamp(evalData.criteriaScores?.justification),
        },
        overallEvaluation: evalData.overallEvaluation || '',
        strengths: Array.isArray(evalData.strengths) ? evalData.strengths : [],
        missingConsiderations: Array.isArray(evalData.missingConsiderations)
          ? evalData.missingConsiderations
          : [],
        weakReasoning: Array.isArray(evalData.weakReasoning) ? evalData.weakReasoning : [],
        areasForImprovement: Array.isArray(evalData.areasForImprovement)
          ? evalData.areasForImprovement
          : [],
        recommendedSolution: evalData.recommendedSolution || '',
        excellentAnswerExample: evalData.excellentAnswerExample || '',
        lessonsLearned: Array.isArray(evalData.lessonsLearned) ? evalData.lessonsLearned : [],
      };

      const followUpQuestions = Array.isArray(parsed.followUpQuestions)
        ? parsed.followUpQuestions.map((fq: any, idx: number) => ({
            id: fq.id || `fu-${idx + 1}`,
            scenarioTwist: fq.scenarioTwist || 'Adaptive Challenge',
            question: fq.question || '',
            hint: fq.hint || '',
          }))
        : [];

      res.json({ success: true, evaluation, followUpQuestions });
    } catch (error: any) {
      console.error('Case study evaluation error:', error?.message);
      if (error?.message === 'NO_API_KEY') {
        return res.status(400).json({
          success: false,
          error: 'No Gemini API key detected. Please configure your Gemini API key in Settings.',
        });
      }
      res.status(500).json({
        success: false,
        error: 'Failed to evaluate case study submission. Please try again.',
        details: error?.message,
      });
    }
  });

  // 3. Adaptive Follow-Up Response Evaluator
  app.post('/api/case-study/follow-up-evaluate', async (req, res) => {
    try {
      const {
        caseTitle,
        topic,
        difficulty,
        scenarioTwist,
        question,
        studentSolution,
        followUpAnswer,
      } = req.body;

      if (!question || !followUpAnswer || !String(followUpAnswer).trim()) {
        return res.status(400).json({
          success: false,
          error: 'Please write your response to the follow-up challenge.',
        });
      }

      const ai = getGeminiClient(req);

      const response = await generateWithFallback(
        ai,
        ['gemini-4-hydrogen', 'gemini-3.1-flash-lite', 'gemini-4-argon'],
        (model) => ({
          model,
          contents: `Case: ${caseTitle} (Topic: ${topic}, Level: ${difficulty})
Twist: ${scenarioTwist}
Follow-Up Question: ${question}
Student's Original Solution: """${String(studentSolution || '').slice(0, 1500)}"""
Student's Follow-Up Answer: """${followUpAnswer}"""

Return strict JSON:
{
  "followUpScore": number (0 to 100),
  "feedback": "2-4 sentence specific coaching feedback evaluating adaptability, tradeoff awareness, and practical execution under this new constraint."
}`,
          config: {
            responseMimeType: 'application/json',
          },
        })
      );

      const parsed = parseGeminiJson<any>(response.text || '{}');
      res.json({
        success: true,
        followUpScore: Math.max(0, Math.min(100, Math.round(Number(parsed.followUpScore) || 75))),
        feedback: parsed.feedback || 'Thoughtful adaptation recorded.',
      });
    } catch (error: any) {
      console.error('Follow-up evaluation error:', error?.message);
      if (error?.message === 'NO_API_KEY') {
        return res.status(400).json({
          success: false,
          error: 'No Gemini API key detected. Please configure your Gemini API key in Settings.',
        });
      }
      res.status(500).json({
        success: false,
        error: 'Failed to evaluate follow-up answer.',
      });
    }
  });
}
