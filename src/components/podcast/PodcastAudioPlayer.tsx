import React, { useEffect, useRef, useState } from 'react';
import { PodcastChapter, PodcastEpisode } from '../../types/study';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface PodcastAudioPlayerProps {
  episode: PodcastEpisode;
  audioBlob: Blob | null;
  isSynthesizingAudio: boolean;
  audioSynthesisError: string | null;
  seekTrigger?: { timeSec: number; nonce: number } | null;
  onGenerateAudio: () => void;
  onProgressSave: (progressSec: number, isCompleted?: boolean) => void;
  onOpenSettings?: () => void;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export const PodcastAudioPlayer: React.FC<PodcastAudioPlayerProps> = ({
  episode,
  audioBlob,
  isSynthesizingAudio,
  audioSynthesisError,
  seekTrigger,
  onGenerateAudio,
  onProgressSave,
  onOpenSettings,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSavedRef = useRef<number>(episode.playbackProgressSec || 0);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(episode.playbackProgressSec || 0);
  const [duration, setDuration] = useState<number>(episode.audioDurationSec || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(episode.speakingSpeed || 1);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // Create & cleanup object URL when audioBlob changes
  useEffect(() => {
    setPlaybackError(null);
    setIsPlaying(false);
    if (!audioBlob) {
      setAudioUrl(null);
      return;
    }
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [audioBlob, episode.id]);

  // Apply saved resume position & rate when metadata loads
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate, audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted, audioUrl]);

  // External seek requests (e.g., clicking a chapter or transcript turn)
  useEffect(() => {
    if (!seekTrigger || !audioRef.current || !audioUrl) return;
    const target = Math.max(0, Math.min(seekTrigger.timeSec, duration || seekTrigger.timeSec));
    audioRef.current.currentTime = target;
    setCurrentTime(target);
    if (audioRef.current.paused) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    }
  }, [seekTrigger]);

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const realDuration = Number.isFinite(audio.duration) ? audio.duration : episode.audioDurationSec;
    setDuration(realDuration);
    const resumeAt = episode.playbackProgressSec || 0;
    if (resumeAt > 1 && resumeAt < realDuration - 2) {
      audio.currentTime = resumeAt;
      setCurrentTime(resumeAt);
    } else {
      setCurrentTime(0);
    }
    audio.playbackRate = playbackRate;
    lastSavedRef.current = resumeAt;
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const now = audio.currentTime;
    setCurrentTime(now);
    if (Math.abs(now - lastSavedRef.current) >= 4) {
      lastSavedRef.current = now;
      onProgressSave(now, false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    const total = duration || currentTime;
    setCurrentTime(total);
    lastSavedRef.current = total;
    onProgressSave(total, true);
  };

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    setPlaybackError(null);
    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err: any) {
        setPlaybackError(err?.message || 'Browser blocked audio playback. Try clicking Play again.');
      }
    } else {
      audio.pause();
      setIsPlaying(false);
      onProgressSave(audio.currentTime, false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value);
    setCurrentTime(next);
    if (audioRef.current) {
      audioRef.current.currentTime = next;
    }
    onProgressSave(next, false);
  };

  const jumpBy = (delta: number) => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    const next = Math.max(0, Math.min(duration || 0, audio.currentTime + delta));
    audio.currentTime = next;
    setCurrentTime(next);
    onProgressSave(next, false);
  };

  const handleReplayFromStart = () => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    lastSavedRef.current = 0;
    onProgressSave(0, false);
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {});
  };

  const handleDownloadWav = () => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (episode.title || episode.topic || 'podcast')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    link.download = `${safeName}.wav`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const activeChapter: PodcastChapter | undefined = [...(episode.chapters || [])]
    .reverse()
    .find((ch) => currentTime >= (ch.approxStartSec || 0));

  const progressPct = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;

  return (
    <div className="rounded-2xl bg-slate-900 dark:bg-slate-900 border border-slate-800 text-white p-5 sm:p-6 space-y-5">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onError={() => setPlaybackError('Unable to decode generated WAV audio stream.')}
        />
      )}

      {/* Episode Audio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-indigo-300 flex items-center gap-2 flex-wrap">
            <span>{episode.format.replace('_', ' ').toUpperCase()}</span>
            <span className="text-slate-600">·</span>
            <span>{episode.language}</span>
            <span className="text-slate-600">·</span>
            <span>{episode.level}</span>
            {activeChapter && (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-amber-300 truncate max-w-[240px]">
                  Now: {activeChapter.title}
                </span>
              </>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white mt-1 truncate">
            {episode.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {episode.isCompleted && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Completed</span>
            </span>
          )}
          {audioBlob && (
            <button
              type="button"
              onClick={handleDownloadWav}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Download episode as WAV audio"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download WAV</span>
            </button>
          )}
        </div>
      </div>

      {/* Audio Missing or Synthesizing State */}
      {isSynthesizingAudio ? (
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-3 text-xs sm:text-sm text-indigo-200">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
          <div>
            <p className="font-semibold text-white">Synthesizing real episode audio...</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Rendering natural speech voices via Gemini TTS. Longer episodes may take 15–35 seconds.
            </p>
          </div>
        </div>
      ) : audioSynthesisError ? (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5 text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white">Audio Service Not Ready</p>
              <p className="text-rose-200/90 mt-0.5">{audioSynthesisError}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer whitespace-nowrap"
              >
                Check Settings
              </button>
            )}
            <button
              type="button"
              onClick={onGenerateAudio}
              className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer whitespace-nowrap"
            >
              Retry Audio
            </button>
          </div>
        </div>
      ) : !audioBlob ? (
        <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-slate-300">
            <p className="font-semibold text-white">Audio not cached on this device yet</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Synthesize playable WAV audio from this episode script using Gemini TTS.
            </p>
          </div>
          <button
            type="button"
            onClick={onGenerateAudio}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Real Audio</span>
          </button>
        </div>
      ) : null}

      {playbackError && (
        <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800 text-xs text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{playbackError}</span>
        </div>
      )}

      {/* Timeline Scrubber */}
      <div className="space-y-2">
        <input
          type="range"
          min={0}
          max={Math.max(1, Math.floor(duration))}
          value={Math.min(Math.floor(currentTime), Math.max(1, Math.floor(duration)))}
          onChange={handleSeek}
          disabled={!audioUrl}
          aria-label="Seek audio timeline"
          className="w-full h-2 rounded-lg appearance-none bg-slate-700 accent-indigo-500 cursor-pointer disabled:opacity-40"
        />
        <div className="flex items-center justify-between text-xs text-slate-400 tabular-nums">
          <span>{formatTime(currentTime)}</span>
          <span className="text-slate-500">
            {progressPct}% listened
            {episode.playbackProgressSec > 5 && !isPlaying && currentTime > 5 ? ' · Resumed' : ''}
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Main Transport + Speed + Volume */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        {/* Left: Playback Transport */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleReplayFromStart}
            disabled={!audioUrl}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shrink-0"
            title="Replay from beginning"
            aria-label="Replay from start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => jumpBy(-15)}
            disabled={!audioUrl}
            className="px-2.5 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-40 cursor-pointer tabular-nums whitespace-nowrap shrink-0"
            title="Rewind 15 seconds"
          >
            -15s
          </button>

          <button
            type="button"
            onClick={togglePlayPause}
            disabled={!audioUrl || isSynthesizingAudio}
            className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-40 cursor-pointer shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => jumpBy(15)}
            disabled={!audioUrl}
            className="px-2.5 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors disabled:opacity-40 cursor-pointer tabular-nums whitespace-nowrap shrink-0"
            title="Forward 15 seconds"
          >
            +15s
          </button>
        </div>

        {/* Center: Speed Selector */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl w-fit">
          {SPEED_OPTIONS.map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => setPlaybackRate(spd)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold tabular-nums transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                playbackRate === spd
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Right: Volume Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              if (v > 0 && isMuted) setIsMuted(false);
            }}
            aria-label="Volume"
            className="w-24 h-1.5 rounded-lg appearance-none bg-slate-700 accent-indigo-400 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
