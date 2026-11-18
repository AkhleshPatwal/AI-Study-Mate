import React, { useState, useRef } from 'react';
import { useStudy } from '../../context/StudyContext';
import { generateStudyPackApi } from '../../services/api';
import {
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Layers,
  ArrowRight,
  Settings,
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
}

const AVAILABLE_MODULES = [
  { id: 'notes', label: 'Handwritten Notes', default: true },
  { id: 'summary', label: 'Summary', default: true },
  { id: 'mindmap', label: 'Mind Map', default: true },
  { id: 'definitions', label: 'Definitions', default: true },
  { id: 'concepts', label: 'Important Concepts', default: true },
  { id: 'quiz', label: 'Quiz', default: true },
  { id: 'viva', label: 'Viva Questions', default: true },
  { id: 'exam', label: 'Exam Questions', default: true },
  { id: 'youtube', label: 'YouTube Videos', default: true },
  { id: 'studyplan', label: 'Study Plan', default: true },
];

const LOADING_STEPS = [
  'Reading content',
  'Identifying important concepts',
  'Creating summary',
  'Preparing notes',
  'Building mind map',
  'Creating quiz',
  'Finding learning resources',
];

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, initialTopic = '' }) => {
  const {
    savePack,
    setActiveTab,
    settings,
    user,
    setIsAuthModalOpen,
  } = useStudy();

  const [activeTab, setModalTab] = useState<'topic' | 'file'>('topic');
  const [topic, setTopic] = useState(initialTopic);
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    name: string;
    sizeFormatted: string;
    type: string;
    textPreview?: string;
    base64Data?: string;
    mimeType?: string;
  } | null>(null);

  const [uploadProgress, setUploadProgress] = useState(100);
  const [selectedModules, setSelectedModules] = useState<string[]>(
    AVAILABLE_MODULES.map((m) => m.id)
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const toggleModule = (id: string) => {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 25MB
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File is too large. Please select a file under 25MB.');
      return;
    }

    setErrorMessage(null);
    setUploadProgress(0);

    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();

    reader.onprogress = (progressEvent) => {
      if (progressEvent.lengthComputable) {
        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
        setUploadProgress(percent);
      }
    };

    if (isImage) {
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        setSelectedFile({
          file,
          name: file.name,
          sizeFormatted: formatFileSize(file.size),
          type: file.type || 'Image',
          base64Data: base64,
          mimeType: file.type,
        });
        setUploadProgress(100);
      };
      reader.readAsDataURL(file);
    } else {
      // Text or other document formats
      reader.onload = () => {
        const text = reader.result as string;
        setSelectedFile({
          file,
          name: file.name,
          sizeFormatted: formatFileSize(file.size),
          type: file.name.split('.').pop()?.toUpperCase() || 'Document',
          textPreview: text,
        });
        setUploadProgress(100);
      };
      reader.readAsText(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    setErrorMessage(null);

    const hasTopic = topic.trim().length > 0;
    const hasFile = selectedFile !== null;

    if (!hasTopic && !hasFile) {
      setErrorMessage('Please enter a study topic or upload a study file.');
      return;
    }

    setIsGenerating(true);
    setCurrentStepIndex(0);

    // Animate progress steps
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 1800);

    try {
      const payload: any = {
        modules: selectedModules,
      };

      if (hasTopic) {
        payload.topic = topic.trim();
      }

      if (selectedFile) {
        if (selectedFile.base64Data && selectedFile.mimeType) {
          payload.image = {
            mimeType: selectedFile.mimeType,
            data: selectedFile.base64Data,
          };
        } else if (selectedFile.textPreview) {
          payload.text = selectedFile.textPreview;
        } else {
          payload.topic = payload.topic || selectedFile.name;
        }
      }

      const result = await generateStudyPackApi(payload);

      clearInterval(stepInterval);

      if (result.success && result.studyPack) {
        savePack(result.studyPack);
        setIsGenerating(false);
        onClose();
        setActiveTab('notes');
      } else {
        setIsGenerating(false);
        setErrorMessage(
          result.error ||
            'Something went wrong while generating your study pack. Please check your Gemini API connection and try again.'
        );
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      setIsGenerating(false);
      setErrorMessage(
        err.message ||
          'Something went wrong while generating your study pack. Please check your Gemini API connection and try again.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Generate AI Study Pack
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Turn your topic or syllabus materials into complete study resources
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading Overlay */}
        {isGenerating ? (
          <div className="p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 animate-pulse">
              <BookOpen className="w-8 h-8 animate-bounce" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Analyzing material...
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Gemini is synthesizing notes, quizzes, mind maps, and exam questions
              </p>
            </div>

            {/* Step list */}
            <div className="max-w-md mx-auto space-y-2.5 text-left bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              {LOADING_STEPS.map((step, idx) => {
                const isDone = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-3 text-xs transition-colors ${
                      isDone
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : isCurrent
                        ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
                    )}
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* API Key Missing Banner Alert */}
            {!settings.geminiConnected && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-amber-900 dark:text-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs flex-1">
                  <span className="font-bold">Gemini API Key Required: </span>
                  Please add your Gemini API key in Settings to generate custom study packs.
                </div>
                <button
                  onClick={() => {
                    onClose();
                    setActiveTab('settings');
                  }}
                  className="px-2.5 py-1 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors shrink-0"
                >
                  Open Settings
                </button>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>{errorMessage}</div>
              </div>
            )}

            {/* Input Selection Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalTab('topic')}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'topic'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                1. Enter Topic Name
              </button>
              <button
                type="button"
                onClick={() => setModalTab('file')}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'file'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                2. Upload Study Material
              </button>
            </div>

            {/* Tab 1: Topic Input */}
            {activeTab === 'topic' ? (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Topic or Syllabus Concept
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Porter's Five Forces, Keynesian Economics, Neural Networks, STP Marketing..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">Popular examples:</span>
                  {[
                    'BCG Matrix',
                    'Cost of Capital (WACC)',
                    'Maslow Hierarchy of Needs',
                    'Agile Scrum Framework',
                  ].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setTopic(example)}
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Tab 2: File Upload */
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/20"
                  >
                    <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Click to upload study material
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Supports PDF, PPT/PPTX, DOC/DOCX, TXT, and Images (JPG/PNG) up to 25MB
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                          {selectedFile.mimeType?.startsWith('image/') ? (
                            <ImageIcon className="w-5 h-5" />
                          ) : (
                            <FileText className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-xs">
                            {selectedFile.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {selectedFile.sizeFormatted} • {selectedFile.type}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveFile}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {uploadProgress < 100 && (
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Material ready for analysis.</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Module Selection Checkboxes */}
            <div className="space-y-2.5 pt-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Select Study Pack Components:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_MODULES.map((mod) => {
                  const isChecked = selectedModules.includes(mod.id);
                  return (
                    <button
                      type="button"
                      key={mod.id}
                      onClick={() => toggleModule(mod.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border text-left transition-colors cursor-pointer ${
                        isChecked
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="truncate">{mod.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                {user ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Auto-syncing to Google account ({user.email})
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <span>💡 Sign in with Google to backup packs</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Study Pack</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
