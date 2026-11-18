import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStudy } from '../context/StudyContext';
import {
  ConceptExplainerItem,
  GeminiVoiceName,
  MindMapNode,
  PodcastDuration,
  PodcastEpisode,
  PodcastFormat,
  PodcastLanguage,
  PodcastLevel,
  PodcastSourceType,
  PodcastTone,
} from '../types/study';
import {
  explainPodcastConceptApi,
  generatePodcastAudioApi,
  generatePodcastScriptApi,
} from '../services/api';
import {
  base64ToWavBlob,
  loadPodcastAudioBlob,
  savePodcastAudioBlob,
} from '../services/audioCache';
import { PodcastAudioPlayer, formatTime } from '../components/podcast/PodcastAudioPlayer';
import {
  Headphones,
  Sparkles,
  Bookmark,
  Trash2,
  Play,
  Loader2,
  AlertCircle,
  BookOpen,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Upload,
  Briefcase,
  Clock,
  Globe,
  Mic,
} from 'lucide-react';

const FORMAT_OPTIONS: { id: PodcastFormat; label: string; desc: string }[] = [
  { id: 'two_host', label: 'Two-Host Conversation', desc: 'Curious learner + expert educator' },
  { id: 'solo', label: 'Solo AI Teacher', desc: 'Focused classroom walkthrough' },
  { id: 'interview', label: 'Interview Format', desc: 'Host probing an industry specialist' },
  { id: 'storytelling', label: 'Storytelling Format', desc: 'Narrative-driven real-life arc' },
  { id: 'exam_revision', label: 'Exam Revision Podcast', desc: 'High-yield definitions & pitfalls' },
];

const DURATION_OPTIONS: { value: PodcastDuration; label: string; sub: string }[] = [
  { value: 3, label: '3 min', sub: 'Quick Revision' },
  { value: 5, label: '5 min', sub: 'Short Lesson' },
  { value: 10, label: '10 min', sub: 'Detailed Lesson' },
  { value: 15, label: '15 min', sub: 'Deep Dive' },
];

const LANGUAGES: PodcastLanguage[] = ['English', 'Hindi', 'Hinglish'];
const LEVELS: PodcastLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
const TONES: PodcastTone[] = [
  'Friendly and engaging',
  'Classroom teacher',
  'Casual conversation',
  'Professional',
  'Storytelling',
];

const VOICES: { id: GeminiVoiceName; label: string; vibe: string }[] = [
  { id: 'Puck', label: 'Puck', vibe: 'Bright & curious' },
  { id: 'Kore', label: 'Kore', vibe: 'Warm & articulate' },
  { id: 'Charon', label: 'Charon', vibe: 'Deep & authoritative' },
  { id: 'Zephyr', label: 'Zephyr', vibe: 'Calm & encouraging' },
  { id: 'Fenrir', label: 'Fenrir', vibe: 'Crisp & energetic' },
];

const SOURCE_OPTIONS: { id: PodcastSourceType; label: string }[] = [
  { id: 'topic', label: 'Any Topic' },
  { id: 'pack_notes', label: 'Study Pack Notes' },
  { id: 'handwritten_notes', label: 'Handwritten Notes' },
  { id: 'mindmap', label: 'Mind Map Branch' },
  { id: 'document_text', label: 'Pasted Notes / Doc' },
  { id: 'weak_topics', label: 'Weak Quiz Topics' },
];

function collectMindMapBranches(node: MindMapNode, prefix = ''): { label: string; content: string }[] {
  const path = prefix ? `${prefix} > ${node.label}` : node.label;
  const childrenSummary = (node.children || [])
    .map((c) => `- ${c.label}${c.description ? `: ${c.description}` : ''}`)
    .join('\n');
  const ownContent = `${node.label}${node.description ? `: ${node.description}` : ''}\n${childrenSummary}`;
  const results = [{ label: path, content: ownContent.trim() }];
  for (const child of node.children || []) {
    results.push(...collectMindMapBranches(child, path));
  }
  return results;
}

export const ListenLearnView: React.FC = () => {
  const {
    currentPack,
    stats,
    podcasts,
    activePodcast,
    setActivePodcast,
    savePodcast,
    deletePodcast,
    togglePodcastBookmark,
    updatePodcastProgress,
    podcastPrefill,
    clearPodcastPrefill,
    openCaseStudyForContext,
    setActiveTab,
    settings,
  } = useStudy();

  const [subView, setSubView] = useState<'studio' | 'player' | 'library'>(() =>
    activePodcast ? 'player' : 'studio'
  );

  // Studio Form State
  const [sourceType, setSourceType] = useState<PodcastSourceType>('pack_notes');
  const [topic, setTopic] = useState(currentPack.title || '');
  const [customNotesText, setCustomNotesText] = useState('');
  const [selectedBranchIdx, setSelectedBranchIdx] = useState(0);
  const [format, setFormat] = useState<PodcastFormat>('two_host');
  const [durationMinutes, setDurationMinutes] = useState<PodcastDuration>(5);
  const [language, setLanguage] = useState<PodcastLanguage>('English');
  const [level, setLevel] = useState<PodcastLevel>('Intermediate');
  const [tone, setTone] = useState<PodcastTone>('Friendly and engaging');
  const [host1Name, setHost1Name] = useState('Rohan');
  const [host2Name, setHost2Name] = useState('Dr. Meera');
  const [host1Voice, setHost1Voice] = useState<GeminiVoiceName>('Puck');
  const [host2Voice, setHost2Voice] = useState<GeminiVoiceName>('Kore');
  const [speakingSpeed, setSpeakingSpeed] = useState<number>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generation State
  const [generationStage, setGenerationStage] = useState<
    'idle' | 'scripting' | 'synthesizing_audio'
  >('idle');
  const [genError, setGenError] = useState<string | null>(null);

  // Active Episode Audio Blob & Tools State
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState(false);
  const [audioSynthesisError, setAudioSynthesisError] = useState<string | null>(null);
  const [seekTrigger, setSeekTrigger] = useState<{ timeSec: number; nonce: number } | null>(null);
  const [toolTab, setToolTab] = useState<
    'script' | 'takeaways' | 'terms' | 'quiz' | 'explainer'
  >('script');

  // Mini Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [revealedRecap, setRevealedRecap] = useState<Record<number, boolean>>({});

  // Explain This Concept State
  const [conceptInput, setConceptInput] = useState('');
  const [isExplainingConcept, setIsExplainingConcept] = useState(false);
  const [conceptError, setConceptError] = useState<string | null>(null);

  // Library Filter State
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'bookmarked' | 'in_progress' | 'completed'>(
    'all'
  );

  const mindMapBranches = useMemo(
    () => (currentPack.mindMap ? collectMindMapBranches(currentPack.mindMap) : []),
    [currentPack.mindMap]
  );

  // Consume cross-tool prefill
  useEffect(() => {
    if (podcastPrefill) {
      if (podcastPrefill.sourceType) setSourceType(podcastPrefill.sourceType);
      if (podcastPrefill.topic) setTopic(podcastPrefill.topic);
      if (podcastPrefill.sourceContent) setCustomNotesText(podcastPrefill.sourceContent);
      if (podcastPrefill.sourceBranchLabel && mindMapBranches.length > 0) {
        const idx = mindMapBranches.findIndex((b) =>
          b.label.toLowerCase().includes(podcastPrefill.sourceBranchLabel!.toLowerCase())
        );
        if (idx >= 0) setSelectedBranchIdx(idx);
      }
      setSubView('studio');
      clearPodcastPrefill();
    }
  }, [podcastPrefill, clearPodcastPrefill, mindMapBranches]);

  // Load cached WAV Blob from IndexedDB when activePodcast changes
  useEffect(() => {
    let cancelled = false;
    setAudioBlob(null);
    setAudioSynthesisError(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setRevealedRecap({});

    if (!activePodcast) return;
    loadPodcastAudioBlob(activePodcast.id).then((blob) => {
      if (!cancelled && blob) {
        setAudioBlob(blob);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activePodcast?.id]);

  const resolveSourcePayload = (): {
    resolvedTopic: string;
    resolvedContent: string;
    branchLabel?: string;
  } => {
    if (sourceType === 'pack_notes') {
      const content = [
        currentPack.summary?.examNotes || '',
        currentPack.summary?.deepLearning || '',
        ...(currentPack.keyPoints || []).map((k) => `- ${k}`),
      ]
        .filter(Boolean)
        .join('\n\n');
      return { resolvedTopic: topic.trim() || currentPack.title, resolvedContent: content };
    }

    if (sourceType === 'handwritten_notes') {
      const content = (currentPack.handwrittenNotes || [])
        .map(
          (n) =>
            `${n.heading} (${n.subheading || ''})\n${n.content}\n${
              n.examTip ? `Exam tip: ${n.examTip}` : ''
            }`
        )
        .join('\n\n');
      return {
        resolvedTopic: topic.trim() || `${currentPack.title} Handwritten Notes`,
        resolvedContent: content,
      };
    }

    if (sourceType === 'mindmap') {
      const chosen = mindMapBranches[selectedBranchIdx] || mindMapBranches[0];
      return {
        resolvedTopic: chosen ? chosen.label : topic.trim() || currentPack.title,
        resolvedContent: chosen?.content || '',
        branchLabel: chosen?.label,
      };
    }

    if (sourceType === 'weak_topics') {
      const weakList = stats.weakTopics || [];
      const content =
        weakList.length > 0
          ? `Weak quiz areas needing targeted explanation:\n${weakList
              .map((w) => `- ${w}`)
              .join('\n')}\n\nReference summary:\n${currentPack.summary?.examNotes || ''}`
          : customNotesText;
      return {
        resolvedTopic:
          topic.trim() || (weakList.length > 0 ? `Revision: ${weakList.slice(0, 2).join(' & ')}` : currentPack.title),
        resolvedContent: content,
      };
    }

    if (sourceType === 'document_text') {
      return {
        resolvedTopic: topic.trim() || 'Uploaded Study Material',
        resolvedContent: customNotesText.trim(),
      };
    }

    return {
      resolvedTopic: topic.trim() || currentPack.title,
      resolvedContent: '',
    };
  };

  const handleUploadTextDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setCustomNotesText(text.slice(0, 25000));
      if (!topic.trim()) {
        setTopic(file.name.replace(/\.[^.]+$/, ''));
      }
    };
    reader.readAsText(file);
  };

  const synthesizeEpisodeAudio = async (episode: PodcastEpisode) => {
    setIsSynthesizingAudio(true);
    setAudioSynthesisError(null);

    const audioRes = await generatePodcastAudioApi({
      script: episode.script,
      format: episode.format,
      tone: episode.tone,
      language: episode.language,
      host1Name: episode.host1Name,
      host2Name: episode.host2Name,
      host1Voice: episode.host1Voice,
      host2Voice: episode.host2Voice,
    });

    setIsSynthesizingAudio(false);

    if (audioRes.success && audioRes.audioBase64) {
      const blob = base64ToWavBlob(audioRes.audioBase64, audioRes.mimeType || 'audio/wav');
      await savePodcastAudioBlob(episode.id, blob);
      setAudioBlob(blob);

      const timestamps = audioRes.turnTimestamps || {};
      const updatedScript = episode.script.map((t) => ({
        ...t,
        approxStartSec: timestamps[t.id] ?? t.approxStartSec ?? 0,
      }));
      const chapterStartLookup: Record<string, number> = {};
      for (const t of updatedScript) {
        if (t.chapterTitle && chapterStartLookup[t.chapterTitle] === undefined) {
          chapterStartLookup[t.chapterTitle] = t.approxStartSec || 0;
        }
      }
      const updatedChapters = episode.chapters.map((ch) => ({
        ...ch,
        approxStartSec: chapterStartLookup[ch.title] ?? ch.approxStartSec ?? 0,
      }));

      const updatedEp: PodcastEpisode = {
        ...episode,
        script: updatedScript,
        chapters: updatedChapters,
        audioGenerated: true,
        audioDurationSec: audioRes.durationSec || episode.audioDurationSec,
        audioError: undefined,
      };
      savePodcast(updatedEp);
      setActivePodcast(updatedEp);
    } else {
      const errMsg =
        audioRes.error ||
        'Real audio synthesis failed. Please configure your Gemini API key in Settings.';
      setAudioSynthesisError(errMsg);
      const updatedEp: PodcastEpisode = {
        ...episode,
        audioGenerated: false,
        audioError: errMsg,
      };
      savePodcast(updatedEp);
      setActivePodcast(updatedEp);
    }
  };

  const runEpisodeCreation = async (overrides?: {
    format?: PodcastFormat;
    durationMinutes?: PodcastDuration;
    language?: PodcastLanguage;
    topic?: string;
    sourceContent?: string;
    sourceType?: PodcastSourceType;
  }) => {
    setGenError(null);
    const { resolvedTopic, resolvedContent, branchLabel } = resolveSourcePayload();
    const finalTopic = overrides?.topic || resolvedTopic;
    const finalContent = overrides?.sourceContent ?? resolvedContent;

    if (!finalTopic && !finalContent) {
      setGenError('Please provide a topic or study notes to create a podcast.');
      return;
    }

    const useFormat = overrides?.format || format;
    const useDuration = overrides?.durationMinutes || durationMinutes;
    const useLanguage = overrides?.language || language;
    const useSourceType = overrides?.sourceType || sourceType;

    setGenerationStage('scripting');
    const scriptRes = await generatePodcastScriptApi({
      topic: finalTopic,
      subject: currentPack.subject,
      sourceType: useSourceType,
      sourceContent: finalContent || undefined,
      sourceBranchLabel: branchLabel,
      format: useFormat,
      durationMinutes: useDuration,
      language: useLanguage,
      level,
      tone,
      host1Name,
      host2Name,
      host1Voice,
      host2Voice,
      speakingSpeed,
    });

    if (!scriptRes.success || !scriptRes.episode) {
      setGenerationStage('idle');
      setGenError(scriptRes.error || 'Could not generate podcast script.');
      return;
    }

    const ep: PodcastEpisode = {
      ...scriptRes.episode,
      studyPackId: useSourceType !== 'topic' && useSourceType !== 'document_text' ? currentPack.id : undefined,
    };

    savePodcast(ep, { countAsCreated: true });
    setActivePodcast(ep);
    setSubView('player');
    setToolTab('script');

    setGenerationStage('synthesizing_audio');
    await synthesizeEpisodeAudio(ep);
    setGenerationStage('idle');
  };

  const handleGenerateEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    await runEpisodeCreation();
  };

  const handleExplainConcept = async (conceptText?: string) => {
    if (!activePodcast) return;
    const targetConcept = (conceptText ?? conceptInput).trim();
    if (!targetConcept) return;

    setToolTab('explainer');
    setConceptInput(targetConcept);
    setConceptError(null);
    setIsExplainingConcept(true);

    const res = await explainPodcastConceptApi({
      concept: targetConcept,
      episodeTitle: activePodcast.title,
      topic: activePodcast.topic,
      language: activePodcast.language,
      level: activePodcast.level,
    });

    setIsExplainingConcept(false);

    if (res.success && res.explanation) {
      const updated: PodcastEpisode = {
        ...activePodcast,
        conceptExplanations: [res.explanation, ...(activePodcast.conceptExplanations || [])],
      };
      savePodcast(updated);
      setActivePodcast(updated);
      setConceptInput('');
    } else {
      setConceptError(res.error || 'Failed to explain concept.');
    }
  };

  const seekToTime = (sec: number) => {
    setSeekTrigger({ timeSec: sec, nonce: Date.now() });
  };

  const filteredPodcasts = useMemo(() => {
    return podcasts.filter((p) => {
      if (libraryFilter === 'bookmarked') return p.isBookmarked;
      if (libraryFilter === 'completed') return p.isCompleted;
      if (libraryFilter === 'in_progress') return !p.isCompleted && p.playbackProgressSec > 0;
      return true;
    });
  }, [podcasts, libraryFilter]);

  const isMultiSpeakerSelected = format === 'two_host' || format === 'interview';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Headphones className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Listen & Learn · AI Podcast Studio</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Transform any topic, study notes, mind map branch, or weak quiz area into real multi-voice audio episodes
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setSubView('studio')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              subView === 'studio'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            + Create Episode
          </button>
          <button
            type="button"
            onClick={() => setSubView('player')}
            disabled={!activePodcast}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-40 ${
              subView === 'player'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Active Player
          </button>
          <button
            type="button"
            onClick={() => setSubView('library')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
              subView === 'library'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Podcast Library ({podcasts.length})
          </button>
        </div>
      </div>

      {/* 1. EPISODE GENERATOR STUDIO */}
      {subView === 'studio' && (
        <form
          onSubmit={handleGenerateEpisode}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6"
        >
          {!settings.geminiConnected && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Gemini API key required for script writing and real TTS voice synthesis.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-semibold cursor-pointer whitespace-nowrap"
              >
                Open Settings
              </button>
            </div>
          )}

          {genError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{genError}</span>
            </div>
          )}

          {/* Content Source Picker */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              1. Choose Content Source
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {SOURCE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSourceType(opt.id)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer text-center ${
                    sourceType === opt.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Source-Specific Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Episode Topic / Focus
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={`e.g. ${currentPack.title}`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {sourceType === 'mindmap' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Mind Map Topic or Branch ({currentPack.title})
                  </label>
                  <select
                    value={selectedBranchIdx}
                    onChange={(e) => setSelectedBranchIdx(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    {mindMapBranches.map((br, idx) => (
                      <option key={idx} value={idx}>
                        {br.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {sourceType === 'weak_topics' && (
                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-bold block mb-1">Detected Weak Quiz Areas:</span>
                  {stats.weakTopics.length > 0 ? (
                    <span>{stats.weakTopics.join(' · ')}</span>
                  ) : (
                    <span>No missed quiz topics recorded yet — will revise active pack highlights.</span>
                  )}
                </div>
              )}
            </div>

            {sourceType === 'document_text' && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Paste Personal Notes or Upload Text Document (.txt, .md, .csv)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.csv,.json"
                    onChange={handleUploadTextDoc}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Load Text File</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={customNotesText}
                  onChange={(e) => setCustomNotesText(e.target.value)}
                  placeholder="Paste lecture transcript, syllabus outline, or personal notes here..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Podcast Format */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              2. Podcast Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    format === f.id
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-800 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold">{f.label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {f.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration, Language, Level, Tone */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Duration
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDurationMinutes(d.value)}
                    className={`p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                      durationMinutes === d.value
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold tabular-nums">{d.label}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{d.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Language
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      language === lang
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Learning Level
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={`py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      level === lvl
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Tone & Style
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as PodcastTone)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-white"
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Voice Customization */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-indigo-500" />
              <span>Voice Preferences & Speaking Speed</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {isMultiSpeakerSelected ? 'Host 1 Name (Learner/Interviewer)' : 'Speaker Name'}
                </label>
                <input
                  type="text"
                  value={host1Name}
                  onChange={(e) => setHost1Name(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Host 1 Voice
                </label>
                <select
                  value={host1Voice}
                  onChange={(e) => setHost1Voice(e.target.value as GeminiVoiceName)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                >
                  {VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label} · {v.vibe}
                    </option>
                  ))}
                </select>
              </div>

              {isMultiSpeakerSelected && (
                <>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Host 2 Name (Educator/Expert)
                    </label>
                    <input
                      type="text"
                      value={host2Name}
                      onChange={(e) => setHost2Name(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Host 2 Voice (Distinct)
                    </label>
                    <select
                      value={host2Voice}
                      onChange={(e) => setHost2Voice(e.target.value as GeminiVoiceName)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    >
                      {VOICES.filter((v) => v.id !== host1Voice).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label} · {v.vibe}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Initial Playback Speed
                </label>
                <select
                  value={speakingSpeed}
                  onChange={(e) => setSpeakingSpeed(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white tabular-nums"
                >
                  {[0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <option key={s} value={s}>
                      {s}x
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={generationStage !== 'idle'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors disabled:opacity-60 cursor-pointer"
          >
            {generationStage === 'scripting' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Writing Conversational Script & Study Tools...</span>
              </>
            ) : generationStage === 'synthesizing_audio' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing Real Podcast Audio...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Script & Real Audio Episode</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* 2. ACTIVE EPISODE PLAYER & LEARNING TOOLS */}
      {subView === 'player' && activePodcast && (
        <div className="space-y-6">
          {/* Audio Player */}
          <PodcastAudioPlayer
            episode={activePodcast}
            audioBlob={audioBlob}
            isSynthesizingAudio={isSynthesizingAudio}
            audioSynthesisError={audioSynthesisError || activePodcast.audioError || null}
            seekTrigger={seekTrigger}
            onGenerateAudio={() => synthesizeEpisodeAudio(activePodcast)}
            onProgressSave={(sec, completed) =>
              updatePodcastProgress(activePodcast.id, sec, completed)
            }
            onOpenSettings={() => setActiveTab('settings')}
          />

          {/* Quick Episode Actions & Conversions */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
              {activePodcast.description}
            </p>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => togglePodcastBookmark(activePodcast.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                  activePodcast.isBookmarked
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Bookmark
                  className={`w-3.5 h-3.5 ${
                    activePodcast.isBookmarked ? 'fill-amber-500 text-amber-500' : ''
                  }`}
                />
                <span>{activePodcast.isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
              </button>

              <button
                type="button"
                disabled={generationStage !== 'idle'}
                onClick={() =>
                  runEpisodeCreation({
                    format: 'exam_revision',
                    durationMinutes: 3,
                    topic: activePodcast.topic,
                    sourceType: 'document_text',
                    sourceContent: activePodcast.summary,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                <span>Convert to 3-Min Revision</span>
              </button>

              <select
                aria-label="Regenerate in another language"
                value=""
                disabled={generationStage !== 'idle'}
                onChange={(e) => {
                  const nextLang = e.target.value as PodcastLanguage;
                  if (!nextLang) return;
                  setLanguage(nextLang);
                  runEpisodeCreation({
                    language: nextLang,
                    topic: activePodcast.topic,
                    sourceType: 'document_text',
                    sourceContent: activePodcast.summary,
                  });
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <option value="">Change Language...</option>
                {LANGUAGES.filter((l) => l !== activePodcast.language).map((l) => (
                  <option key={l} value={l}>
                    Regenerate in {l}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() =>
                  openCaseStudyForContext({
                    topic: activePodcast.topic,
                    subject: activePodcast.subject,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Apply in Case Study</span>
              </button>
            </div>
          </div>

          {/* Learning Tools Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto">
            {[
              { id: 'script', label: 'Chapters & Transcript' },
              { id: 'takeaways', label: 'Takeaways & Summary' },
              { id: 'terms', label: `Important Terms (${activePodcast.importantTerms?.length || 0})` },
              { id: 'quiz', label: 'Recap & Mini Quiz' },
              { id: 'explainer', label: 'Explain This Concept' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setToolTab(t.id as any)}
                className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  toolTab === t.id
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tool Panel: Script & Chapters */}
          {toolTab === 'script' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Chapters Sidebar */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Episode Chapters
                </h4>
                <div className="space-y-2">
                  {(activePodcast.chapters || []).map((ch, idx) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => seekToTime(ch.approxStartSec || 0)}
                      className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700/80 text-left transition-colors cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                        <span className="truncate">
                          {idx + 1}. {ch.title}
                        </span>
                        <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 tabular-nums shrink-0 ml-2">
                          {formatTime(ch.approxStartSec || 0)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{ch.summary}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversational Transcript */}
              <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Conversational Script · Click any turn to jump audio
                  </h4>
                </div>
                <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
                  {activePodcast.script.map((turn) => (
                    <button
                      key={turn.id}
                      type="button"
                      onClick={() => seekToTime(turn.approxStartSec || 0)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                        turn.speakerRole === 'host2'
                          ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200/70 dark:border-indigo-900/60 hover:border-indigo-400'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {turn.speaker}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                          {formatTime(turn.approxStartSec || 0)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {turn.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tool Panel: Key Takeaways & Summary */}
          {toolTab === 'takeaways' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Key Takeaways
                </h4>
                <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300">
                  {activePodcast.keyTakeaways.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Episode Summary
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {activePodcast.summary}
                </p>
              </div>
            </div>
          )}

          {/* Tool Panel: Important Terms */}
          {toolTab === 'terms' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePodcast.importantTerms.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.term}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.definition}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExplainConcept(item.term)}
                    className="self-start inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Explain This Simply</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tool Panel: Recap Questions & Mini Quiz */}
          {toolTab === 'quiz' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Recap Questions */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Recap Questions (3–5 Checkpoints)
                </h4>
                <div className="space-y-3">
                  {activePodcast.recapQuestions.map((rq, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2"
                    >
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                        {idx + 1}. {rq.question}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedRecap((p) => ({ ...p, [idx]: !p[idx] }))
                        }
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {revealedRecap[idx] ? 'Hide Suggested Answer' : 'Reveal Suggested Answer'}
                      </button>
                      {revealedRecap[idx] && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1 border-t border-slate-200 dark:border-slate-700">
                          {rq.suggestedAnswer}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Episode Mini Quiz */}
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-500" />
                    <span>Episode Mini Quiz</span>
                  </h4>
                  {quizSubmitted && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      Score:{' '}
                      {
                        activePodcast.miniQuiz.filter(
                          (q) => quizAnswers[q.id] === q.correctAnswer
                        ).length
                      }
                      /{activePodcast.miniQuiz.length}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {activePodcast.miniQuiz.map((q, qIdx) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5"
                    >
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                        {qIdx + 1}. {q.question}
                      </p>
                      <div className="space-y-1.5">
                        {q.options.map((opt) => {
                          const isSelected = quizAnswers[q.id] === opt;
                          const isRight = opt === q.correctAnswer;
                          let style =
                            'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200';
                          if (quizSubmitted) {
                            if (isRight) {
                              style =
                                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200';
                            } else if (isSelected) {
                              style =
                                'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                            }
                          } else if (isSelected) {
                            style =
                              'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-200 font-semibold';
                          }
                          return (
                            <button
                              key={opt}
                              type="button"
                              disabled={quizSubmitted}
                              onClick={() =>
                                setQuizAnswers((p) => ({ ...p, [q.id]: opt }))
                              }
                              className={`w-full text-left px-3 py-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer ${style}`}
                            >
                              <span>{opt}</span>
                              {quizSubmitted && isRight && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                              )}
                              {quizSubmitted && isSelected && !isRight && (
                                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {quizSubmitted && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {activePodcast.miniQuiz.length > 0 && (
                  <div className="flex items-center gap-2">
                    {!quizSubmitted ? (
                      <button
                        type="button"
                        onClick={() => setQuizSubmitted(true)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
                      >
                        Check Mini Quiz
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setQuizAnswers({});
                          setQuizSubmitted(false);
                        }}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        Reset Quiz
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tool Panel: "Explain This Concept" */}
          {toolTab === 'explainer' && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <span>Explain This Concept (Instant Micro-Explainer)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Heard something confusing in the episode? Select a term or type any concept below for a simpler breakdown, analogy, and example without regenerating the podcast.
                </p>
              </div>

              {activePodcast.importantTerms?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activePodcast.importantTerms.map((t, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleExplainConcept(t.term)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      {t.term}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={conceptInput}
                  onChange={(e) => setConceptInput(e.target.value)}
                  placeholder="Type any tricky concept or phrase from this episode..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  disabled={isExplainingConcept || !conceptInput.trim()}
                  onClick={() => handleExplainConcept()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {isExplainingConcept ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Simplifying...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Explain Simply</span>
                    </>
                  )}
                </button>
              </div>

              {conceptError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-200">
                  {conceptError}
                </div>
              )}

              <div className="space-y-3">
                {(activePodcast.conceptExplanations || []).map((ex: ConceptExplainerItem, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2 text-xs sm:text-sm"
                  >
                    <div className="font-bold text-indigo-700 dark:text-indigo-300">
                      {ex.concept}
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                      <span className="font-semibold">Simple Explanation: </span>
                      {ex.simpleExplanation}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="font-semibold">Analogy: </span>
                      {ex.analogy}
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="font-semibold">Example: </span>
                      {ex.example}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. PODCAST LIBRARY */}
      {subView === 'library' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: `All (${podcasts.length})` },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'completed', label: 'Completed' },
              { id: 'bookmarked', label: 'Bookmarked' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setLibraryFilter(f.id as any)}
                className={`px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer ${
                  libraryFilter === f.id
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredPodcasts.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
              <Headphones className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No saved podcast episodes yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Turn your active study pack, handwritten notes, mind map branches, or weak quiz topics into an interactive audio podcast.
              </p>
              <button
                type="button"
                onClick={() => setSubView('studio')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create First Episode</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPodcasts.map((ep) => {
                const pct =
                  ep.audioDurationSec > 0
                    ? Math.min(100, Math.round((ep.playbackProgressSec / ep.audioDurationSec) * 100))
                    : 0;
                return (
                  <div
                    key={ep.id}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 flex-wrap">
                          <span>{ep.format.replace('_', ' ')}</span>
                          <span className="text-slate-400">·</span>
                          <span>{ep.language}</span>
                          <span className="text-slate-400">·</span>
                          <span className="tabular-nums">{ep.targetDurationMinutes} min</span>
                          <span className="text-slate-400">·</span>
                          <span>{new Date(ep.createdAt).toLocaleDateString()}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => togglePodcastBookmark(ep.id)}
                          className="p-1 text-slate-400 hover:text-amber-500 cursor-pointer shrink-0"
                          title="Bookmark episode"
                        >
                          <Bookmark
                            className={`w-4 h-4 ${
                              ep.isBookmarked ? 'fill-amber-400 text-amber-400' : ''
                            }`}
                          />
                        </button>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                        {ep.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        Topic: {ep.topic}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                          <span>
                            {ep.isCompleted
                              ? 'Completed'
                              : ep.playbackProgressSec > 0
                              ? `Paused at ${formatTime(ep.playbackProgressSec)}`
                              : 'Not started'}
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              ep.isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => deletePodcast(ep.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          title="Delete episode"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActivePodcast(ep);
                            setSubView('player');
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>
                            {ep.playbackProgressSec > 0 && !ep.isCompleted
                              ? 'Continue Listening'
                              : 'Open Player'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
