import {
  CaseStudy,
  CaseStudyCategory,
  CaseStudyDifficulty,
  CaseStudyEvaluation,
  CaseStudyFollowUpQuestion,
  CaseStudyLength,
  ConceptExplainerItem,
  GeminiVoiceName,
  LearningRecommendation,
  PodcastDuration,
  PodcastEpisode,
  PodcastFormat,
  PodcastLanguage,
  PodcastLevel,
  PodcastScriptTurn,
  PodcastSourceType,
  PodcastTone,
  StudyPack,
  StudyPlanDay,
  VivaEvaluation,
  YouTubeResource,
} from '../types/study';

const STORAGE_KEYS = {
  GEMINI_KEY: 'ai_studymate_gemini_api_key',
  YOUTUBE_KEY: 'ai_studymate_youtube_api_key',
  SETTINGS: 'ai_studymate_settings',
};

export function getStoredGeminiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredGeminiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.GEMINI_KEY);
    }
  } catch (e) {
    console.error('Failed to save Gemini key to localStorage', e);
  }
}

export function removeStoredGeminiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.GEMINI_KEY);
  } catch (e) {
    console.error('Failed to remove Gemini key', e);
  }
}

export function getStoredYouTubeKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.YOUTUBE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveStoredYouTubeKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEYS.YOUTUBE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.YOUTUBE_KEY);
    }
  } catch (e) {
    console.error('Failed to save YouTube key', e);
  }
}

export function removeStoredYouTubeKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.YOUTUBE_KEY);
  } catch (e) {
    console.error('Failed to remove YouTube key', e);
  }
}

function getRequestHeaders(keyOverride?: string): Record<string, string> {
  const key = keyOverride !== undefined ? keyOverride : getStoredGeminiKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (key && key.trim()) {
    headers['x-gemini-api-key'] = key.trim();
  }
  return headers;
}

export async function getGeminiStatusApi(): Promise<{ hasEnvKey: boolean; provider: string; model: string }> {
  try {
    const res = await fetch('/api/gemini/status');
    if (!res.ok) return { hasEnvKey: false, provider: 'Google Gemini', model: 'gemini-3.8-flash' };
    return await res.json();
  } catch {
    return { hasEnvKey: false, provider: 'Google Gemini', model: 'gemini-3.8-flash' };
  }
}

export async function testGeminiConnection(keyOverride?: string): Promise<{ success: boolean; message: string; model?: string }> {
  try {
    const res = await fetch('/api/gemini/test-connection', {
      method: 'POST',
      headers: getRequestHeaders(keyOverride),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to authenticate with Gemini API');
    }

    return {
      success: true,
      message: 'Connected to ' + (data.model || 'Gemini 3.8 Flash'),
      model: data.model,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Connection test failed',
    };
  }
}

export async function generateStudyPackApi(params: {
  topic?: string;
  text?: string;
  image?: { mimeType: string; data: string };
  modules?: string[];
}): Promise<{ success: boolean; studyPack?: StudyPack; error?: string }> {
  try {
    const res = await fetch('/api/study/generate', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to generate study pack');
    }

    return { success: true, studyPack: data.studyPack };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Something went wrong while generating your study pack. Please check your Gemini API connection and try again.',
    };
  }
}

export async function evaluateVivaAnswerApi(params: {
  question: string;
  studentAnswer: string;
  topic?: string;
  keyPointsExpected?: string[];
}): Promise<{ success: boolean; evaluation?: VivaEvaluation; error?: string }> {
  try {
    const res = await fetch('/api/study/viva-evaluate', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to evaluate viva response');
    }

    return { success: true, evaluation: data.evaluation };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to evaluate viva answer',
    };
  }
}

export async function generateStudyPlanApi(params: {
  subject: string;
  examDate: string;
  availableHoursPerDay: number;
  chapters: string;
}): Promise<{ success: boolean; plan?: StudyPlanDay[]; error?: string }> {
  try {
    const res = await fetch('/api/study/study-plan', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to generate study plan');
    }

    return { success: true, plan: data.plan };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to generate study plan',
    };
  }
}

export async function searchYouTubeApi(query: string): Promise<{ success: boolean; videos: YouTubeResource[] }> {
  try {
    const ytKey = getStoredYouTubeKey();
    const res = await fetch('/api/youtube/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, apiKey: ytKey }),
    });

    const data = await res.json();
    return { success: true, videos: data.videos || [] };
  } catch (err) {
    return {
      success: false,
      videos: [
        {
          id: 'q-fallback',
          title: `Search on YouTube: "${query}"`,
          channel: 'YouTube Video Search',
          videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
          topicRelevance: 'Search directly on YouTube for educational tutorials',
          searchQuery: query,
        },
      ],
    };
  }
}

// ==========================================
// CASE STUDY LAB API
// ==========================================

export async function generateCaseStudyApi(params: {
  topic: string;
  subject: string;
  difficulty: CaseStudyDifficulty;
  caseType: CaseStudyCategory;
  length: CaseStudyLength;
  learningObjective?: string;
  studyPackContext?: string;
}): Promise<{ success: boolean; caseStudy?: CaseStudy; error?: string }> {
  try {
    const res = await fetch('/api/case-study/generate', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to generate case study');
    }
    return { success: true, caseStudy: data.caseStudy };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to generate case study. Check Gemini connection and try again.',
    };
  }
}

export async function evaluateCaseStudyApi(params: {
  caseStudy: CaseStudy;
  selectedDecisionId: string;
  identifiedProblem: string;
  studentSolution: string;
  reasoning: string;
}): Promise<{
  success: boolean;
  evaluation?: CaseStudyEvaluation;
  followUpQuestions?: CaseStudyFollowUpQuestion[];
  error?: string;
}> {
  try {
    const res = await fetch('/api/case-study/evaluate', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to evaluate case study');
    }
    return {
      success: true,
      evaluation: data.evaluation,
      followUpQuestions: data.followUpQuestions || [],
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to evaluate case study response.',
    };
  }
}

export async function evaluateCaseFollowUpApi(params: {
  caseTitle: string;
  topic: string;
  difficulty: CaseStudyDifficulty;
  scenarioTwist: string;
  question: string;
  studentSolution: string;
  followUpAnswer: string;
}): Promise<{ success: boolean; followUpScore?: number; feedback?: string; error?: string }> {
  try {
    const res = await fetch('/api/case-study/follow-up-evaluate', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to evaluate follow-up answer');
    }
    return {
      success: true,
      followUpScore: data.followUpScore,
      feedback: data.feedback,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to evaluate follow-up answer.',
    };
  }
}

// ==========================================
// LISTEN & LEARN (AI PODCAST) API
// ==========================================

export async function generatePodcastScriptApi(params: {
  topic: string;
  subject?: string;
  sourceType: PodcastSourceType;
  sourceContent?: string;
  sourceBranchLabel?: string;
  format: PodcastFormat;
  durationMinutes: PodcastDuration;
  language: PodcastLanguage;
  level: PodcastLevel;
  tone: PodcastTone;
  host1Name: string;
  host2Name?: string;
  host1Voice: GeminiVoiceName;
  host2Voice?: GeminiVoiceName;
  speakingSpeed: number;
}): Promise<{ success: boolean; episode?: PodcastEpisode; code?: string; error?: string }> {
  try {
    const res = await fetch('/api/podcast/generate', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        code: data.code,
        error: data.error || 'Failed to generate podcast script.',
      };
    }
    return { success: true, episode: data.episode };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Failed to generate podcast script.',
    };
  }
}

export async function generatePodcastAudioApi(params: {
  script: PodcastScriptTurn[];
  format: PodcastFormat;
  tone: PodcastTone;
  language: PodcastLanguage;
  host1Name: string;
  host2Name?: string;
  host1Voice: GeminiVoiceName;
  host2Voice?: GeminiVoiceName;
}): Promise<{
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  durationSec?: number;
  turnTimestamps?: Record<string, number>;
  code?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/podcast/audio', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        code: data.code,
        error: data.error || 'Audio generation service could not synthesize audio.',
      };
    }
    return {
      success: true,
      audioBase64: data.audioBase64,
      mimeType: data.mimeType || 'audio/wav',
      durationSec: data.durationSec,
      turnTimestamps: data.turnTimestamps,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Audio synthesis request failed.',
    };
  }
}

export async function explainPodcastConceptApi(params: {
  concept: string;
  episodeTitle: string;
  topic: string;
  language: PodcastLanguage;
  level: PodcastLevel;
}): Promise<{ success: boolean; explanation?: ConceptExplainerItem; error?: string }> {
  try {
    const res = await fetch('/api/podcast/explain-concept', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Could not explain concept');
    }
    return { success: true, explanation: data.explanation };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Could not explain concept.',
    };
  }
}

export async function getLearningRecommendationsApi(params: {
  currentTopic: string;
  stats: any;
  packs: { title: string; subject?: string }[];
  caseStudies: { title: string; topic: string; status: string; latestScore?: number }[];
  podcasts: { title: string; topic: string; isCompleted: boolean; targetDurationMinutes: number }[];
}): Promise<{ success: boolean; recommendations: LearningRecommendation[] }> {
  try {
    const res = await fetch('/api/learning/recommendations', {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, recommendations: [] };
    }
    return { success: true, recommendations: data.recommendations || [] };
  } catch {
    return { success: false, recommendations: [] };
  }
}
