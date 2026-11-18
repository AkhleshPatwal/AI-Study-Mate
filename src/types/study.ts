export interface DefinitionItem {
  id: string;
  term: string;
  definition: string;
  example: string;
  category?: string;
}

export interface ConceptItem {
  id: string;
  concept: string;
  simpleExplanation: string;
  example: string;
  whyItMatters: string;
  relatedConcepts: string[];
}

export interface HandwrittenNoteSection {
  id: string;
  heading: string;
  subheading?: string;
  content: string; // bullet points, highlighted terms, student annotations
  keyFormulasOrRules?: string[];
  examTip?: string;
  diagramDescription?: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  children?: MindMapNode[];
  collapsed?: boolean;
}

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer' | 'case_based';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options?: string[]; // for mcq or true_false
  correctAnswer: string;
  explanation: string;
  topicTag: string;
  caseScenario?: string;
}

export interface VivaQuestionItem {
  id: string;
  question: string;
  topic: string;
  sampleAnswer: string;
  keyPointsExpected: string[];
}

export interface VivaEvaluation {
  accuracyScore: number; // 0-10
  clarityScore: number;  // 0-10
  completenessScore: number; // 0-10
  totalScore: number;    // 0-10
  whatYouDidWell: string[];
  whatYouCanImprove: string[];
  betterAnswer: string;
}

export interface StudyPlanDay {
  dayNumber: number;
  dateStr?: string;
  topic: string;
  studyTimeMinutes: number;
  revisionTasks: string[];
  quizAction: string;
  completed?: boolean;
}

export interface YouTubeResource {
  id: string;
  title: string;
  channel: string;
  duration?: string;
  topicRelevance: string;
  searchQuery: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface ExamImportantTopic {
  topic: string;
  importance: 'High' | 'Medium' | 'Critical';
  expectedQuestionTypes: string[];
  keyFocusAreas: string;
  previousExamFrequency?: string;
}

export interface StudyPack {
  id: string;
  title: string;
  subject?: string;
  createdAt: string;
  isDemo?: boolean;
  isFavorite?: boolean;
  sourceType: 'topic' | 'document' | 'image';
  sourceName?: string;
  
  // 13 core modules
  summary: {
    quickRevision: string[]; // Max 10 points
    examNotes: string;       // Academic exam ready
    deepLearning: string;    // Deep explanation with industry use-cases
    easyLanguageVersion: string; // Plain-English student friendly version
  };
  keyPoints: string[];
  definitions: DefinitionItem[];
  concepts: ConceptItem[];
  handwrittenNotes: HandwrittenNoteSection[];
  mindMap: MindMapNode;
  quiz: QuizQuestion[];
  shortQuestions: { question: string; answer: string; marks: number }[];
  caseQuestions: { caseText: string; question: string; modelAnswer: string }[];
  vivaQuestions: VivaQuestionItem[];
  examImportantTopics: ExamImportantTopic[];
  youtubeResources: YouTubeResource[];
  studyPlan: StudyPlanDay[];
}

export interface RecentActivityItem {
  id: string;
  type: 'study_pack' | 'notes' | 'podcast' | 'case_study' | 'quiz' | 'viva';
  title: string;
  detail: string;
  timestamp: string;
}

export interface UserStats {
  packsCreated: number;
  quizzesCompleted: number;
  totalQuizScoreSum: number;
  totalQuizQuestionsSum: number;
  topicsStudied: string[];
  weakTopics: string[];
  studyStreakDays: number;
  lastStudyDate: string;
  caseStudiesAttempted?: number;
  caseStudiesCompleted?: number;
  caseStudyScoreSum?: number;
  podcastsCreated?: number;
  podcastsCompleted?: number;
  strongTopics?: string[];
  pendingRevisions?: string[];
  recentActivities?: RecentActivityItem[];
}

export interface AppSettings {
  geminiApiKey: string;
  youtubeApiKey: string;
  theme: 'light' | 'dark';
  geminiConnected: boolean | null;
  youtubeConnected: boolean | null;
  hasServerGeminiKey?: boolean;
}

// ==========================================
// CASE STUDY LAB TYPES
// ==========================================

export type CaseStudyDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export type CaseStudyCategory =
  | 'Business'
  | 'Marketing'
  | 'Finance'
  | 'HR'
  | 'Retail'
  | 'Operations'
  | 'Entrepreneurship'
  | 'Technology'
  | 'Economics'
  | 'General';

export type CaseStudyLength = 'Short' | 'Medium' | 'Detailed';

export type CaseStudyStatus = 'not_started' | 'in_progress' | 'completed';

export interface CaseStudyDataPoint {
  label: string;
  value: string;
  dataType: 'illustrative' | 'verified_context';
  sourceNote?: string;
}

export interface CaseStudyStakeholder {
  name: string;
  role: string;
  priority: string;
}

export interface CaseStudyDecisionOption {
  id: string;
  title: string;
  summary: string;
  strategicTradeoff: string;
  consequencePreview: string;
  stakeholderImpact: string;
  nextDilemma: string;
  scoreAlignment: 'strong' | 'mixed' | 'risky';
}

export interface CaseStudyCriteriaScores {
  problemIdentification: number;
  conceptualUnderstanding: number;
  analyticalThinking: number;
  logicalReasoning: number;
  theoreticalApplication: number;
  creativity: number;
  practicalFeasibility: number;
  decisionQuality: number;
  justification: number;
}

export interface CaseStudyEvaluation {
  overallScore: number; // 0-100
  criteriaScores: CaseStudyCriteriaScores;
  overallEvaluation: string;
  strengths: string[];
  missingConsiderations: string[];
  weakReasoning: string[];
  areasForImprovement: string[];
  recommendedSolution: string;
  excellentAnswerExample: string;
  lessonsLearned: string[];
}

export interface CaseStudyFollowUpQuestion {
  id: string;
  scenarioTwist: string;
  question: string;
  hint?: string;
  studentResponse?: string;
  feedback?: string;
  followUpScore?: number;
  evaluatedAt?: string;
}

export interface CaseStudyAttempt {
  id: string;
  submittedAt: string;
  selectedDecisionId: string;
  selectedDecisionTitle: string;
  identifiedProblem: string;
  studentSolution: string;
  reasoning: string;
  evaluation: CaseStudyEvaluation;
}

export interface CaseStudy {
  id: string;
  ownerId?: string;
  studyPackId?: string;
  topic: string;
  subject: string;
  difficulty: CaseStudyDifficulty;
  caseType: CaseStudyCategory;
  length: CaseStudyLength;
  learningObjective?: string;
  title: string;
  roleTitle: string;
  companyBackground: string;
  industryAndContext: string;
  mainProblem: string;
  factsAndData: CaseStudyDataPoint[];
  dataDisclaimer: string;
  stakeholders: CaseStudyStakeholder[];
  complications: string[];
  decisionSituation: string;
  decisionOptions: CaseStudyDecisionOption[];
  guidingQuestions: string[];
  status: CaseStudyStatus;
  isSaved: boolean;
  isBookmarked: boolean;
  draftSelectedDecisionId?: string;
  draftIdentifiedProblem?: string;
  draftSolution?: string;
  draftReasoning?: string;
  attempts: CaseStudyAttempt[];
  latestScore?: number;
  followUpQuestions: CaseStudyFollowUpQuestion[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// LISTEN & LEARN (AI PODCAST) TYPES
// ==========================================

export type PodcastSourceType =
  | 'topic'
  | 'pack_notes'
  | 'handwritten_notes'
  | 'mindmap'
  | 'document_text'
  | 'weak_topics';

export type PodcastFormat =
  | 'solo'
  | 'two_host'
  | 'interview'
  | 'storytelling'
  | 'exam_revision';

export type PodcastDuration = 3 | 5 | 10 | 15;

export type PodcastLanguage = 'English' | 'Hindi' | 'Hinglish';

export type PodcastLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type PodcastTone =
  | 'Friendly and engaging'
  | 'Classroom teacher'
  | 'Casual conversation'
  | 'Professional'
  | 'Storytelling';

export type GeminiVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export interface PodcastScriptTurn {
  id: string;
  speaker: string;
  speakerRole: 'host1' | 'host2';
  text: string;
  cueStyle?: string;
  chapterTitle?: string;
  approxStartSec?: number;
}

export interface PodcastChapter {
  id: string;
  title: string;
  summary: string;
  approxStartSec: number;
}

export interface PodcastRecapQuestion {
  question: string;
  suggestedAnswer: string;
}

export interface PodcastMiniQuizItem {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ConceptExplainerItem {
  concept: string;
  simpleExplanation: string;
  analogy: string;
  example: string;
  createdAt: string;
}

export interface PodcastEpisode {
  id: string;
  ownerId?: string;
  studyPackId?: string;
  sourceType: PodcastSourceType;
  sourceBranchLabel?: string;
  topic: string;
  subject?: string;
  title: string;
  description: string;
  format: PodcastFormat;
  targetDurationMinutes: PodcastDuration;
  language: PodcastLanguage;
  level: PodcastLevel;
  tone: PodcastTone;
  host1Name: string;
  host2Name?: string;
  host1Voice: GeminiVoiceName;
  host2Voice?: GeminiVoiceName;
  speakingSpeed: number;
  script: PodcastScriptTurn[];
  chapters: PodcastChapter[];
  keyTakeaways: string[];
  importantTerms: { term: string; definition: string }[];
  summary: string;
  recapQuestions: PodcastRecapQuestion[];
  miniQuiz: PodcastMiniQuizItem[];
  conceptExplanations?: ConceptExplainerItem[];
  audioGenerated: boolean;
  audioDurationSec: number;
  audioError?: string;
  playbackProgressSec: number;
  isCompleted: boolean;
  isSaved: boolean;
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// LEARNING LOOP & RECOMMENDATIONS
// ==========================================

export type LearningLoopStage =
  | 'learn'
  | 'listen'
  | 'apply'
  | 'test'
  | 'improve'
  | 'revise';

export interface LearningRecommendation {
  id: string;
  stage: LearningLoopStage;
  title: string;
  reason: string;
  actionLabel: string;
  targetTab:
    | 'notes'
    | 'mindmap'
    | 'podcast'
    | 'casestudy'
    | 'quiz'
    | 'viva'
    | 'youtube'
    | 'summary';
  topic?: string;
  priority: 'high' | 'medium' | 'normal';
}

