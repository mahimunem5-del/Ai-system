import React, { useState, useEffect, useRef, useCallback } from 'react';
import VectorStudioCanvas from './VectorStudioCanvas';

export interface ImageAsset {
  id: string;
  url: string;
  prompt: string;
  originalPrompt?: string;
  model?: string;
  modelName?: string;
  aspectRatio?: string;
  isPreciseEdit?: boolean;
  isVector?: boolean;
  isVectorize?: boolean;
  svg?: string;
  svgCode?: string;
  palette?: string[];
  detailLevel?: string;
  variations?: number;
  time?: string;
  createdAt?: string | number;
}

export type WorkflowTool = 'generate-image' | 'remove-background' | 'precise-edit' | 'upscale-image' | 'image-to-image' | 'vector-illustration';

export interface WorkflowToolConfig {
  id: WorkflowTool;
  label: string;
  subtitle: string;
  badge?: string;
  icon: React.ReactNode;
}

const WORKFLOW_TOOLS_CONFIG: { id: WorkflowTool; label: string; subtitle: string; badge?: string }[] = [
  { id: 'generate-image', label: 'Generate Image', subtitle: 'Prompt to high-fidelity image' },
  { id: 'remove-background', label: 'Remove Background', subtitle: 'Instant transparent cutout' },
  { id: 'precise-edit', label: 'Precise Edit', subtitle: 'Selective inpaint & remixing' },
  { id: 'upscale-image', label: 'Upscale Image', subtitle: 'Enhance resolution & clarity' },
  { id: 'image-to-image', label: 'Image to Image', subtitle: 'Transform with visual guide' },
  { id: 'vector-illustration', label: 'Vector Illustration', subtitle: 'Flat graphic, SVG-ready art', badge: 'NEW' }
];

export interface ImageWorkspaceProps {
  initialMode?: 'generate' | 'edit';
  initialView?: 'home' | 'workspace';
  onGenerate?: (params: {
    prompt: string;
    model: string;
    aspectRatio: string;
    count: number;
    referenceImage?: string;
    referenceImages?: string[];
    quality?: string;
    tool?: string;
    seed?: string;
  }) => void;
  onApplyEdit?: (params: { sourceImage: string; referenceImages?: string[]; prompt: string; count: number; quality?: string }) => void;
  assets?: ImageAsset[];
  className?: string;
  isGenerating?: boolean;
}

const IDEOGRAM_ROTATING_PLACEHOLDERS = [
  "An origami crane made of world-map paper, clean studio lighting.",
  "A cartoon mascot of a hot chili pepper wearing a chef hat.",
  "Packaging for organic granola in kraft paper box with botanical illustration.",
  "A 35mm film photo of friends laughing around a campfire at dusk.",
  "A simple infographic showing the water cycle with labeled arrows.",
  "Retro-futuristic sci-fi cityscape with floating monorails, sunset glow.",
  "A cozy ceramic mug of matcha latte with delicate leaf foam art.",
  "Minimalist line-art poster of a Bauhaus architectural chair."
];

const getErrorMessage = (err: any): string => {
  if (!err) return 'An error occurred';
  if (typeof err === 'string') return err;
  if (err?.error?.message && typeof err.error.message === 'string') return err.error.message;
  if (err?.error && typeof err.error === 'string') return err.error;
  if (err?.message && typeof err.message === 'string') return err.message;
  try {
    return JSON.stringify(err);
  } catch (_) {
    return String(err);
  }
};

export const ImageWorkspace: React.FC<ImageWorkspaceProps> = ({
  initialMode = 'generate',
  initialView = 'workspace',
  onGenerate,
  onApplyEdit,
  assets = [],
  className = '',
  isGenerating = false
}) => {
  // View state: 'home' | 'workspace'
  const [view, setView] = useState<'home' | 'workspace'>(initialView);
  // Mode state: 'generate' | 'edit' (Smart Edit)
  const [mode, setMode] = useState<'generate' | 'edit'>(initialMode);
  const [prompt, setPrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [aspectRatio, setAspectRatio] = useState('auto');
  const [variationsCount, setVariationsCount] = useState(1);
  const [quality, setQuality] = useState<'speed' | 'medium' | 'high'>('medium');
  const [preciseLoadingStep, setPreciseLoadingStep] = useState<'idle' | 'refining' | 'generating'>('idle');
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [homeRefImage, setHomeRefImage] = useState<string | null>(null);
  const [isHomeRatioOpen, setIsHomeRatioOpen] = useState(false);
  const [isHomeModelOpen, setIsHomeModelOpen] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isTabVisible, setIsTabVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [workflowTool, setWorkflowTool] = useState<WorkflowTool>('generate-image');
  const [isToolSwitcherOpen, setIsToolSwitcherOpen] = useState(false);
  const [toolSearchQuery, setToolSearchQuery] = useState('');
  const [removeBgImage, setRemoveBgImage] = useState<string | null>(null);
  const [removeBgFile, setRemoveBgFile] = useState<File | null>(null);
  const [isRemoveBgDragging, setIsRemoveBgDragging] = useState(false);
  const removeBgInputRef = useRef<HTMLInputElement>(null);
  const [isPreciseDragging, setIsPreciseDragging] = useState(false);
  const preciseInputRef = useRef<HTMLInputElement>(null);
  const [preciseCount, setPreciseCount] = useState<number>(1);
  const [isPreciseCountOpen, setIsPreciseCountOpen] = useState(false);
  const [preciseRefImages, setPreciseRefImages] = useState<string[]>([]);
  const preciseRefInputRef = useRef<HTMLInputElement>(null);
  const [previewModalAsset, setPreviewModalAsset] = useState<ImageAsset | null>(null);
  const [upscaleImage, setUpscaleImage] = useState<string | null>(null);
  const upscaleInputRef = useRef<HTMLInputElement>(null);
  const [isUpscaleDragging, setIsUpscaleDragging] = useState(false);
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 4>(2);
  const [img2imgImage, setImg2imgImage] = useState<string | null>(null);
  const [img2imgStrength, setImg2imgStrength] = useState<number>(0.65);
  const [img2imgPrompt, setImg2imgPrompt] = useState<string>('');
  const [isProcessingWorkflow, setIsProcessingWorkflow] = useState<boolean>(false);
  const toolSwitcherRef = useRef<HTMLDivElement>(null);

  // Vector Illustration Custom States
  const [vectorQuality, setVectorQuality] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [isVectorQualityOpen, setIsVectorQualityOpen] = useState(false);
  const [vectorCount, setVectorCount] = useState<number>(1);
  const [isVectorCountOpen, setIsVectorCountOpen] = useState(false);
  const [vectorRatio, setVectorRatio] = useState<string>('auto');
  const [isVectorAdvancedOpen, setIsVectorAdvancedOpen] = useState(false);
  const [vectorSeed, setVectorSeed] = useState<string>('');
  const [vectorRefImages, setVectorRefImages] = useState<string[]>([]);
  const vectorRefInputRef = useRef<HTMLInputElement>(null);
  const [activeVectorStudioAsset, setActiveVectorStudioAsset] = useState<ImageAsset | null>(null);

  useEffect(() => {
    // Only pause or clear rotation if the user has typed text
    if (view !== 'home' || prompt.trim().length > 0) return;
    let wordTimer: NodeJS.Timeout | null = null;
    let holdTimer: NodeJS.Timeout | null = null;
    let fadeTimer: NodeJS.Timeout | null = null;

    const phrase = IDEOGRAM_ROTATING_PLACEHOLDERS[placeholderIndex] || '';
    const words = phrase.split(' ');
    let currentWord = 0;

    setDisplayedPlaceholder('');
    setIsTabVisible(false);
    setIsFadingOut(false);

    const streamNext = () => {
      if (currentWord < words.length) {
        currentWord++;
        setDisplayedPlaceholder(words.slice(0, currentWord).join(' '));
        wordTimer = setTimeout(streamNext, 48);
      } else {
        setIsTabVisible(true);
        holdTimer = setTimeout(() => {
          setIsFadingOut(true);
          fadeTimer = setTimeout(() => {
            setPlaceholderIndex((prev) => (prev + 1) % IDEOGRAM_ROTATING_PLACEHOLDERS.length);
          }, 260);
        }, 4000);
      }
    };

    streamNext();

    return () => {
      if (wordTimer) clearTimeout(wordTimer);
      if (holdTimer) clearTimeout(holdTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [view, placeholderIndex, Boolean(prompt.trim())]);
  const homeRatioRef = useRef<HTMLDivElement>(null);
  const homeModelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (homeRatioRef.current && !homeRatioRef.current.contains(event.target as Node)) {
        setIsHomeRatioOpen(false);
      }
      if (homeModelRef.current && !homeModelRef.current.contains(event.target as Node)) {
        setIsHomeModelOpen(false);
      }
      if (toolSwitcherRef.current && !toolSwitcherRef.current.contains(event.target as Node)) {
        setIsToolSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Dynamic Panel Width State (min: 340px, max: 620px, default: 380px)
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ideogram_panel_width') || localStorage.getItem('image_workspace_panel_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 340 && parsed <= 620) {
          return parsed;
        }
      }
    }
    return 380;
  });

  const [isResizing, setIsResizing] = useState(false);
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  // Persist panel width to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ideogram_panel_width', panelWidth.toString());
      localStorage.setItem('image_workspace_panel_width', panelWidth.toString());
      localStorage.setItem('ideogram_sidebar_width', panelWidth.toString());
    }
  }, [panelWidth]);

  // 2. Smooth Mouse Drag Mechanics
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!workspaceRef.current) return;
      const rect = workspaceRef.current.getBoundingClientRect();
      const newWidth = Math.min(Math.max(e.clientX - rect.left, 340), 620);
      setPanelWidth(newWidth);
      if (workspaceRef.current) {
        workspaceRef.current.style.setProperty('--sidebar-width', `${newWidth}px`);
      }
      window.dispatchEvent(new Event('resize'));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.dispatchEvent(new Event('resize'));
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    let finalPrompt = prompt.trim();
    if (workflowTool === 'vector-illustration') {
      const vectorPrefix = 'flat 2D vector graphic, clean sharp SVG lines, minimal gradients, isolated subject, sticker-cut vector art, professional graphic design illustration, ';
      if (!finalPrompt.toLowerCase().includes('vector graphic') && !finalPrompt.toLowerCase().includes('flat 2d vector')) {
        finalPrompt = vectorPrefix + finalPrompt;
      }
      onGenerate?.({
        prompt: finalPrompt,
        model: 'recraft/recraft-v3',
        aspectRatio: vectorRatio,
        count: vectorCount,
        quality: vectorQuality,
        referenceImages: vectorRefImages,
        tool: 'vector-illustration',
        seed: vectorSeed
      });
      return;
    }
    onGenerate?.({
      prompt: finalPrompt,
      model: selectedModel,
      aspectRatio,
      count: variationsCount
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceImage || !editPrompt.trim() || preciseLoadingStep !== 'idle') return;

    setPreciseLoadingStep('refining');
    const stageTimer = setTimeout(() => {
      setPreciseLoadingStep('generating');
    }, 1800);

    try {
      if (onApplyEdit) {
        await onApplyEdit({
          sourceImage,
          referenceImages: preciseRefImages,
          prompt: editPrompt.trim(),
          count: preciseCount,
          quality
        });
      } else {
        const host = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : 'localhost';
        const isPort5001 = typeof window !== 'undefined' && window.location.port === '5001';
        const endpoint = isPort5001 ? '/api/images/precise-edit' : `http://${host}:5001/api/images/precise-edit`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceImage,
            referenceImages: preciseRefImages,
            instructionPrompt: editPrompt.trim(),
            prompt: editPrompt.trim(),
            variations: preciseCount,
            count: preciseCount,
            quality,
            aspectRatio: '1:1',
            isPreciseEdit: true,
            workflowTool: 'precise-edit'
          })
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.images) && data.images.length > 0) {
          data.images.forEach((img: any, idx: number) => {
            assets.unshift({
              id: img.id || `pe_${Date.now()}_${idx}`,
              url: img.url,
              prompt: img.prompt || editPrompt.trim(),
              originalPrompt: editPrompt.trim(),
              model: img.model || data.model || 'black-forest-labs/flux.2-flex',
              modelName: img.modelName || data.modelName || 'FLUX.2 Flex',
              aspectRatio: '1:1',
              isPreciseEdit: true,
              variations: preciseCount,
              time: 'Just now'
            });
          });
        } else {
          const errMsg = getErrorMessage(data) || 'FLUX.2 generation failed';
          console.error('Precise edit error:', errMsg);
          alert(errMsg);
        }
      }
    } catch (err: any) {
      console.error('Precise edit error:', err);
      alert(getErrorMessage(err));
    } finally {
      clearTimeout(stageTimer);
      setPreciseLoadingStep('idle');
    }
  };

  if (view === 'home') {
    return (
      <div
        id="image-home-view"
        className={`flex-1 flex flex-col h-full w-full overflow-y-auto bg-white dark:bg-[#191919] text-slate-900 dark:text-slate-100 select-none relative font-sans ideogram-custom-scroll ${className}`}
      >
        {/* Soft Ambient Radial Glow Aura behind Hero */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[460px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.13),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(59,130,246,0.18),rgba(25,25,25,0))] blur-2xl -z-0"></div>

        {/* Scrollable Content */}
        <div className="flex-1 w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-10 sm:pt-14 pb-16 flex flex-col gap-10 relative z-10">
          {/* Hero Section */}
          <div className="w-full max-w-[780px] mx-auto flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center text-slate-900 dark:text-white mb-6 select-none">
              What will you design?
            </h1>

            {/* Pure Ideogram-Style Prompt Box */}
            <div className="w-full bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md rounded-3xl border border-neutral-200/60 dark:border-neutral-800/60 shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] p-5 sm:p-6 transition-all duration-200 focus-within:border-neutral-300 dark:focus-within:border-neutral-700 relative z-10 flex flex-col justify-between min-h-[220px]">
              
              {/* Top-Left: Reference Image Slots (Frosted Glass with Periodic Shimmer Glow) */}
              <div className="flex items-center gap-2.5 shrink-0">
                <input
                  type="file"
                  id="react-home-file-input"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setHomeRefImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <div
                  onClick={() => document.getElementById('react-home-file-input')?.click()}
                  className="relative w-11 h-11 rounded-2xl bg-neutral-100/60 dark:bg-neutral-800/40 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50 flex items-center justify-center cursor-pointer transition-all duration-300 group/ref overflow-hidden animate-ref-shimmer"
                  title="Add reference image"
                >
                  {homeRefImage ? (
                    <div className="relative w-full h-full rounded-2xl overflow-hidden">
                      <img src={homeRefImage} alt="Ref" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setHomeRefImage(null);
                        }}
                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/75 text-white flex items-center justify-center text-[10px] hover:bg-black transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <svg className="w-4 h-4 text-slate-400 dark:text-neutral-400 group-hover/ref:text-slate-700 dark:group-hover/ref:text-white group-hover/ref:scale-110 transition-all duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  )}
                </div>

                {/* Ghost Slot */}
                <div
                  onClick={() => document.getElementById('react-home-file-input')?.click()}
                  className="w-11 h-11 rounded-2xl bg-neutral-100/30 dark:bg-neutral-800/20 backdrop-blur-sm border border-dashed border-neutral-200/40 dark:border-neutral-700/30 flex items-center justify-center transition-all cursor-pointer opacity-60 hover:opacity-100"
                  title="Add reference image"
                >
                  <svg className="w-3.5 h-3.5 text-slate-300 dark:text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
              </div>

              {/* Row 2: Prompt Input Container (Middle - Centered with flexible growth) */}
              <div className="relative flex-1 flex items-center w-full min-h-[68px] cursor-text">
                {/* 1. Synchronized Rotating Placeholder (Sits directly underneath with exact identical CSS & vertical alignment) */}
                <div
                  className={`pointer-events-none absolute left-0 top-0 w-full h-full flex items-center select-none text-sm sm:text-[15px] font-normal leading-relaxed text-slate-400 dark:text-neutral-500 m-0 p-0 transition-opacity duration-200 z-0 ${
                    prompt.trim().length > 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                >
                  <span>{displayedPlaceholder}</span>
                  <span
                    className={`inline-flex items-center ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-neutral-400 shrink-0 select-none uppercase tracking-wider transition-opacity duration-300 align-baseline ${
                      isTabVisible ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    Tab
                  </span>
                </div>

                {/* 2. Active Textarea (Sits directly on top with identical font, padding, margin, line-height) */}
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab' && !prompt.trim()) {
                      e.preventDefault();
                      setPrompt(IDEOGRAM_ROTATING_PLACEHOLDERS[placeholderIndex]);
                    } else if (e.key === 'Enter' && !e.shiftKey && prompt.trim()) {
                      e.preventDefault();
                      setView('workspace');
                      onGenerate?.({ prompt: prompt.trim(), model: selectedModel, aspectRatio, count: variationsCount, referenceImage: homeRefImage || undefined });
                    }
                  }}
                  rows={1}
                  className="w-full bg-transparent resize-none border-0 p-0 m-0 text-sm sm:text-[15px] font-normal text-slate-900 dark:text-white placeholder-transparent focus:outline-none focus:ring-0 leading-relaxed block overflow-hidden relative z-10"
                  spellCheck={false}
                />
              </div>

              {/* Bottom Row */}
              <div className="flex items-center justify-between pt-3 mt-auto">
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  {/* 1. Aspect Ratio Trigger & Popover */}
                  <div className="relative" ref={homeRatioRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsHomeRatioOpen(!isHomeRatioOpen);
                        setIsHomeModelOpen(false);
                      }}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center group ${
                        isHomeRatioOpen
                          ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                      title={aspectRatio === 'auto' ? 'Aspect Ratio: Auto (AI decides)' : `Aspect Ratio: ${aspectRatio}`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center">
                        {aspectRatio === 'auto' ? (
                          <svg className="w-4 h-4 transition-transform group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                            <circle cx="9" cy="9" r="2"/>
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                          </svg>
                        ) : (
                          <div className={`transition-transform group-hover:scale-105 ${
                            aspectRatio === '1:1' ? 'w-3.5 h-3.5' :
                            aspectRatio === '2:3' ? 'w-[11px] h-[16px]' :
                            aspectRatio === '3:4' ? 'w-[12px] h-[16px]' :
                            aspectRatio === '9:16' ? 'w-[9px] h-[16px]' :
                            aspectRatio === '3:2' ? 'w-[16px] h-[11px]' :
                            aspectRatio === '4:3' ? 'w-[16px] h-[12px]' :
                            aspectRatio === '16:9' ? 'w-[16px] h-[9px]' : 'w-3.5 h-3.5'
                          } border-[1.5px] border-current rounded-xs shrink-0`} />
                        )}
                      </span>
                    </button>

                    {isHomeRatioOpen && (
                      <div className="absolute left-0 top-full mt-2 w-60 bg-white dark:bg-[#1e1e1e] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-2xl text-slate-700 dark:text-slate-200 max-h-64 overflow-y-auto ideogram-custom-scroll">
                        <div className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase px-2.5 py-1.5 border-b border-slate-100 dark:border-white/10 mb-1">
                          Aspect Ratio
                        </div>
                        <div className="space-y-0.5">
                          {[
                            { id: 'auto', label: 'Auto (AI decides)', isAuto: true },
                            { id: '1:1', label: '1:1 (Square)', w: 'w-3.5', h: 'h-3.5' },
                            { id: '2:3', label: '2:3 (Portrait)', w: 'w-[11px]', h: 'h-[16px]' },
                            { id: '3:4', label: '3:4 (Portrait)', w: 'w-[12px]', h: 'h-[16px]' },
                            { id: '9:16', label: '9:16 (Mobile)', w: 'w-[9px]', h: 'h-[16px]' },
                            { id: '3:2', label: '3:2 (Landscape)', w: 'w-[16px]', h: 'h-[11px]' },
                            { id: '4:3', label: '4:3 (Landscape)', w: 'w-[16px]', h: 'h-[12px]' },
                            { id: '16:9', label: '16:9 (Widescreen)', w: 'w-[16px]', h: 'h-[9px]' }
                          ].map((item) => {
                            const isSelected = (aspectRatio === item.id) || (item.id === 'auto' && !aspectRatio);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setAspectRatio(item.id);
                                  setIsHomeRatioOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors text-left group ${
                                  isSelected
                                    ? 'bg-slate-100 dark:bg-white/10 font-semibold text-slate-900 dark:text-white'
                                    : 'hover:bg-slate-50 dark:hover:bg-white/5 font-medium text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                    {item.isAuto ? (
                                      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>
                                      </svg>
                                    ) : (
                                      <div className={`${item.w} ${item.h} border-[1.5px] border-current rounded-xs shrink-0`} />
                                    )}
                                  </div>
                                  <span className="truncate">{item.label}</span>
                                </div>
                                {isSelected && (
                                  <svg className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Model Selection Trigger & Popover */}
                  <div className="relative" ref={homeModelRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsHomeModelOpen(!isHomeModelOpen);
                        setIsHomeRatioOpen(false);
                      }}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center group ${
                        isHomeModelOpen
                          ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                          : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                      title={
                        selectedModel === 'auto'
                          ? 'Model: Auto'
                          : `Model: ${
                              [
                                { id: 'auto', name: 'Auto' },
                                { id: 'openai/gpt-image-2.5-sunburst', name: 'GPT Image 2.5 Sunburst' },
                                { id: 'google/gemini-3-pro-image', name: 'Nano Banana Pro (Gemini 3 Pro Image)' },
                                { id: 'black-forest-labs/flux.2-pro', name: 'FLUX.2 Pro' },
                                { id: 'bytedance-seed/seedream-5.0-pro', name: 'Seedream 5.0 Pro' },
                                { id: 'meta/muse-image', name: 'Meta: Muse Image' },
                                { id: 'google/gemini-3.1-flash-image-preview', name: 'Nano Banana 2 (Gemini 3.1 Flash Image)' }
                              ].find(m => m.id === selectedModel)?.name || selectedModel
                            }`
                      }
                    >
                      <span className="w-4 h-4 flex items-center justify-center">
                        {selectedModel === 'auto' ? (
                          <svg className="w-4 h-4 transition-transform group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="14" height="14" x="5" y="5" rx="2"/>
                            <path d="M9 9h6v6H9z"/>
                            <path d="M9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4M19 9h4m-4 6h4"/>
                          </svg>
                        ) : selectedModel.includes('openai') ? (
                          <svg className="w-4 h-4 shrink-0 text-zinc-900 dark:text-white" viewBox="60 60 392 392" fill="currentColor">
                            <path fillRule="nonzero" d="M412.037 221.764a90.834 90.834 0 004.648-28.67 90.79 90.79 0 00-12.443-45.87c-16.37-28.496-46.738-46.089-79.605-46.089-6.466 0-12.943.683-19.264 2.04a90.765 90.765 0 00-67.881-30.515h-.576c-.059.002-.149.002-.216.002-39.807 0-75.108 25.686-87.346 63.554-25.626 5.239-47.748 21.31-60.682 44.03a91.873 91.873 0 00-12.407 46.077 91.833 91.833 0 0023.694 61.553 90.802 90.802 0 00-4.649 28.67 90.804 90.804 0 0012.442 45.87c16.369 28.504 46.74 46.087 79.61 46.087a91.81 91.81 0 0019.253-2.04 90.783 90.783 0 0067.887 30.516h.576l.234-.001c39.829 0 75.119-25.686 87.357-63.588 25.626-5.242 47.748-21.312 60.682-44.033a91.718 91.718 0 0012.383-46.035 91.83 91.83 0 00-23.693-61.553l-.004-.005zM275.102 413.161h-.094a68.146 68.146 0 01-43.611-15.8 56.936 56.936 0 002.155-1.221l72.54-41.901a11.799 11.799 0 005.962-10.251V241.651l30.661 17.704c.326.163.55.479.596.84v84.693c-.042 37.653-30.554 68.198-68.21 68.273h.001zm-146.689-62.649a68.128 68.128 0 01-9.152-34.085c0-3.904.341-7.817 1.005-11.663.539.323 1.48.897 2.155 1.285l72.54 41.901a11.832 11.832 0 0011.918-.002l88.563-51.137v35.408a1.1 1.1 0 01-.438.94l-73.33 42.339a68.43 68.43 0 01-34.11 9.12 68.359 68.359 0 01-59.15-34.11l-.001.004zm-19.083-158.36a68.044 68.044 0 0135.538-29.934c0 .625-.036 1.731-.036 2.5v83.801l-.001.07a11.79 11.79 0 005.954 10.242l88.564 51.13-30.661 17.704a1.096 1.096 0 01-1.034.093l-73.337-42.375a68.36 68.36 0 01-34.095-59.143 68.412 68.412 0 019.112-34.085l-.004-.003zm251.907 58.621l-88.563-51.137 30.661-17.697a1.097 1.097 0 011.034-.094l73.337 42.339c21.109 12.195 34.132 34.746 34.132 59.132 0 28.604-17.849 54.199-44.686 64.078v-86.308c.004-.032.004-.065.004-.096 0-4.219-2.261-8.119-5.919-10.217zm30.518-45.93c-.539-.331-1.48-.898-2.155-1.286l-72.54-41.901a11.842 11.842 0 00-5.958-1.611c-2.092 0-4.15.558-5.957 1.611l-88.564 51.137v-35.408l-.001-.061a1.1 1.1 0 01.44-.88l73.33-42.303a68.301 68.301 0 0134.108-9.129c37.704 0 68.281 30.577 68.281 68.281a68.69 68.69 0 01-.984 11.545v.005zm-191.843 63.109l-30.668-17.704a1.09 1.09 0 01-.596-.84v-84.692c.016-37.685 30.593-68.236 68.281-68.236a68.332 68.332 0 0143.689 15.804 63.09 63.09 0 00-2.155 1.222l-72.54 41.9a11.794 11.794 0 00-5.961 10.248v.068l-.05 102.23zm16.655-35.91l39.445-22.782 39.444 22.767v45.55l-39.444 22.767-39.445-22.767v-45.535z"/>
                          </svg>
                        ) : selectedModel.includes('flux') ? (
                          <svg className="w-4 h-4 shrink-0 text-zinc-900 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2L2 7.5v9L12 22l10-5.5v-9L12 2zm0 2.2l7.5 4.1L12 12.4 4.5 8.3 12 4.2zM4 9.8l7 3.8v7.6l-7-3.8V9.8zm16 7.6l-7 3.8v-7.6l7-3.8v7.6z"/>
                          </svg>
                        ) : selectedModel.includes('seedream') ? (
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                            <rect x="2.5" y="6" width="3.2" height="12" rx="1.6" fill="#3B82F6"/>
                            <rect x="7.8" y="3" width="3.2" height="18" rx="1.6" fill="#06B6D4"/>
                            <rect x="13.1" y="6" width="3.2" height="15" rx="1.6" fill="#3B82F6"/>
                            <rect x="18.4" y="8" width="3.2" height="10" rx="1.6" fill="#06B6D4"/>
                          </svg>
                        ) : selectedModel.includes('muse') ? (
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#0081FB">
                            <path d="M16.995 3C14.636 3 12.748 4.316 12 5.864 11.252 4.316 9.364 3 7.005 3 3.136 3 0 6.136 0 10.005c0 3.869 3.136 7.005 7.005 7.005 2.359 0 4.247-1.316 4.995-2.864.748 1.548 2.636 2.864 4.995 2.864 3.869 0 7.005-3.136 7.005-7.005C24 6.136 20.864 3 16.995 3zm0 11.96c-1.898 0-3.568-1.074-4.39-2.73a.873.873 0 0 0-1.21 0c-.822 1.656-2.492 2.73-4.39 2.73-2.732 0-4.955-2.223-4.955-4.955s2.223-4.955 4.955-4.955c1.898 0 3.568 1.074 4.39 2.73a.873.873 0 0 0 1.21 0c.822-1.656 2.492-2.73 4.39-2.73 2.732 0 4.955 2.223 4.955 4.955s-2.223 4.955-4.955 4.955z"/>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path d="M12 2C12 7.5 7.5 12 2 12c5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z" fill="#2563EB" />
                          </svg>
                        )}
                      </span>
                    </button>

                    {isHomeModelOpen && (
                      <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-[#1e1e1e] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-2xl text-slate-700 dark:text-slate-200 max-h-72 overflow-y-auto ideogram-custom-scroll">
                        <div className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase px-2.5 py-1.5 border-b border-slate-100 dark:border-white/10 mb-1">
                          Generation Model
                        </div>
                        <div className="space-y-0.5">
                          {[
                            { id: 'auto', name: 'Auto' },
                            { id: 'openai/gpt-image-2.5-sunburst', name: 'GPT Image 2.5 Sunburst' },
                            { id: 'google/gemini-3-pro-image', name: 'Nano Banana Pro (Gemini 3 Pro Image)' },
                            { id: 'black-forest-labs/flux.2-pro', name: 'FLUX.2 Pro' },
                            { id: 'bytedance-seed/seedream-5.0-pro', name: 'Seedream 5.0 Pro' },
                            { id: 'meta/muse-image', name: 'Meta: Muse Image' },
                            { id: 'google/gemini-3.1-flash-image-preview', name: 'Nano Banana 2 (Gemini 3.1 Flash Image)' }
                          ].map((model) => {
                            const isSelected = selectedModel === model.id;
                            return (
                              <button
                                key={model.id}
                                type="button"
                                onClick={() => {
                                  setSelectedModel(model.id);
                                  setIsHomeModelOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors text-left group ${
                                  isSelected
                                    ? 'bg-slate-100 dark:bg-white/10 font-semibold text-slate-900 dark:text-white'
                                    : 'hover:bg-slate-50 dark:hover:bg-white/5 font-medium text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {model.id === 'auto' ? (
                                    <svg className="w-4 h-4 shrink-0 text-slate-900 dark:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>
                                    </svg>
                                  ) : model.id.includes('openai') ? (
                                    <svg className="w-4 h-4 shrink-0 text-zinc-900 dark:text-white" viewBox="60 60 392 392" fill="currentColor">
                                      <path fillRule="nonzero" d="M412.037 221.764a90.834 90.834 0 004.648-28.67 90.79 90.79 0 00-12.443-45.87c-16.37-28.496-46.738-46.089-79.605-46.089-6.466 0-12.943.683-19.264 2.04a90.765 90.765 0 00-67.881-30.515h-.576c-.059.002-.149.002-.216.002-39.807 0-75.108 25.686-87.346 63.554-25.626 5.239-47.748 21.31-60.682 44.03a91.873 91.873 0 00-12.407 46.077 91.833 91.833 0 0023.694 61.553 90.802 90.802 0 00-4.649 28.67 90.804 90.804 0 0012.442 45.87c16.369 28.504 46.74 46.087 79.61 46.087a91.81 91.81 0 0019.253-2.04 90.783 90.783 0 0067.887 30.516h.576l.234-.001c39.829 0 75.119-25.686 87.357-63.588 25.626-5.242 47.748-21.312 60.682-44.033a91.718 91.718 0 0012.383-46.035 91.83 91.83 0 00-23.693-61.553l-.004-.005zM275.102 413.161h-.094a68.146 68.146 0 01-43.611-15.8 56.936 56.936 0 002.155-1.221l72.54-41.901a11.799 11.799 0 005.962-10.251V241.651l30.661 17.704c.326.163.55.479.596.84v84.693c-.042 37.653-30.554 68.198-68.21 68.273h.001zm-146.689-62.649a68.128 68.128 0 01-9.152-34.085c0-3.904.341-7.817 1.005-11.663.539.323 1.48.897 2.155 1.285l72.54 41.901a11.832 11.832 0 0011.918-.002l88.563-51.137v35.408a1.1 1.1 0 01-.438.94l-73.33 42.339a68.43 68.43 0 01-34.11 9.12 68.359 68.359 0 01-59.15-34.11l-.001.004zm-19.083-158.36a68.044 68.044 0 0135.538-29.934c0 .625-.036 1.731-.036 2.5v83.801l-.001.07a11.79 11.79 0 005.954 10.242l88.564 51.13-30.661 17.704a1.096 1.096 0 01-1.034.093l-73.337-42.375a68.36 68.36 0 01-34.095-59.143 68.412 68.412 0 019.112-34.085l-.004-.003zm251.907 58.621l-88.563-51.137 30.661-17.697a1.097 1.097 0 011.034-.094l73.337 42.339c21.109 12.195 34.132 34.746 34.132 59.132 0 28.604-17.849 54.199-44.686 64.078v-86.308c.004-.032.004-.065.004-.096 0-4.219-2.261-8.119-5.919-10.217zm30.518-45.93c-.539-.331-1.48-.898-2.155-1.286l-72.54-41.901a11.842 11.842 0 00-5.958-1.611c-2.092 0-4.15.558-5.957 1.611l-88.564 51.137v-35.408l-.001-.061a1.1 1.1 0 01.44-.88l73.33-42.303a68.301 68.301 0 0134.108-9.129c37.704 0 68.281 30.577 68.281 68.281a68.69 68.69 0 01-.984 11.545v.005zm-191.843 63.109l-30.668-17.704a1.09 1.09 0 01-.596-.84v-84.692c.016-37.685 30.593-68.236 68.281-68.236a68.332 68.332 0 0143.689 15.804 63.09 63.09 0 00-2.155 1.222l-72.54 41.9a11.794 11.794 0 00-5.961 10.248v.068l-.05 102.23zm16.655-35.91l39.445-22.782 39.444 22.767v45.55l-39.444 22.767-39.445-22.767v-45.535z"/>
                                    </svg>
                                  ) : model.id.includes('flux') ? (
                                    <svg className="w-4 h-4 shrink-0 text-zinc-900 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M12 2L2 7.5v9L12 22l10-5.5v-9L12 2zm0 2.2l7.5 4.1L12 12.4 4.5 8.3 12 4.2zM4 9.8l7 3.8v7.6l-7-3.8V9.8zm16 7.6l-7 3.8v-7.6l7-3.8v7.6z"/>
                                    </svg>
                                  ) : model.id.includes('seedream') ? (
                                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                                      <rect x="2.5" y="6" width="3.2" height="12" rx="1.6" fill="#3B82F6"/>
                                      <rect x="7.8" y="3" width="3.2" height="18" rx="1.6" fill="#06B6D4"/>
                                      <rect x="13.1" y="6" width="3.2" height="15" rx="1.6" fill="#3B82F6"/>
                                      <rect x="18.4" y="8" width="3.2" height="10" rx="1.6" fill="#06B6D4"/>
                                    </svg>
                                  ) : model.id.includes('muse') ? (
                                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#0081FB">
                                      <path d="M16.995 3C14.636 3 12.748 4.316 12 5.864 11.252 4.316 9.364 3 7.005 3 3.136 3 0 6.136 0 10.005c0 3.869 3.136 7.005 7.005 7.005 2.359 0 4.247-1.316 4.995-2.864.748 1.548 2.636 2.864 4.995 2.864 3.869 0 7.005-3.136 7.005-7.005C24 6.136 20.864 3 16.995 3zm0 11.96c-1.898 0-3.568-1.074-4.39-2.73a.873.873 0 0 0-1.21 0c-.822 1.656-2.492 2.73-4.39 2.73-2.732 0-4.955-2.223-4.955-4.955s2.223-4.955 4.955-4.955c1.898 0 3.568 1.074 4.39 2.73a.873.873 0 0 0 1.21 0c.822-1.656 2.492-2.73 4.39-2.73 2.732 0 4.955 2.223 4.955 4.955s-2.223 4.955-4.955 4.955z"/>
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                      <path d="M12 2C12 7.5 7.5 12 2 12c5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z" fill="#2563EB" />
                                    </svg>
                                  )}
                                  <span className="truncate">{model.name}</span>
                                </div>
                                {isSelected && (
                                  <svg className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Circular Send Button */}
                <button
                  type="button"
                  disabled={!prompt.trim()}
                  onClick={() => {
                    setView('workspace');
                    onGenerate?.({ prompt: prompt.trim(), model: selectedModel, aspectRatio, count: variationsCount, referenceImage: homeRefImage || undefined });
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-xs active:scale-95 ${
                    prompt.trim()
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 cursor-pointer'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500 opacity-40 cursor-not-allowed'
                  }`}
                  title="Generate"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                </button>
              </div>

            </div>
          </div>

          {/* Creative Workflows Carousel */}
          <div className="w-full flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">Creative Workflows</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">6 Tools</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="workflow-scroll-left"
                  onClick={() => {
                    document.getElementById('creative-workflows-carousel')?.scrollBy({ left: -300, behavior: 'smooth' });
                  }}
                  className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-slate-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer select-none"
                  title="Scroll left"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  id="workflow-scroll-right"
                  onClick={() => {
                    document.getElementById('creative-workflows-carousel')?.scrollBy({ left: 300, behavior: 'smooth' });
                  }}
                  className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-slate-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer select-none"
                  title="Scroll right"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Horizontal Scroll Carousel (285px width, 180px height, scrollbar-free) */}
            <div id="creative-workflows-carousel" className="flex gap-4 sm:gap-5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden no-scrollbar scroll-smooth py-1 select-none">
              
              {/* Card 1: Generate Image */}
              <div
                className="workflow-carousel-card flex flex-col shrink-0 group cursor-pointer select-none"
                onClick={() => {
                  setWorkflowTool('generate-image');
                  setMode('generate');
                  setView('workspace');
                }}
              >
                <div className="w-[285px] min-w-[285px] max-w-[285px] h-[180px] rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" alt="Generate Image" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 left-3 right-3 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md text-white text-[11px] flex items-center justify-between border border-white/10 shadow-xs">
                    <span className="truncate font-medium">Psychedelic neon portrait, cosmic swirls</span>
                    <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center ml-1.5 shrink-0 text-[10px] font-bold">↑</span>
                  </div>
                  <div className="absolute bottom-3 left-3 w-9 h-9 flex items-center justify-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md rounded-xl text-neutral-800 dark:text-neutral-200">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                  </div>
                </div>
                <span className="mt-2.5 px-0.5 text-[13.5px] font-medium tracking-tight text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Generate Image</span>
              </div>

              {/* Card 2: Remove Background */}
              <div
                className="workflow-carousel-card flex flex-col shrink-0 group cursor-pointer select-none"
                onClick={() => {
                  setWorkflowTool('remove-background');
                  setMode('generate');
                  setView('workspace');
                }}
              >
                <div className="w-[285px] min-w-[285px] max-w-[285px] h-[180px] rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                  <div className="absolute inset-0 grid grid-cols-2">
                    <div className="relative overflow-hidden bg-slate-800">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" alt="Original Subject" className="absolute inset-0 w-[285px] h-[180px] object-cover" />
                    </div>
                    <div className="relative overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:8px_8px] bg-slate-100 dark:bg-neutral-900">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80" alt="Cutout Preview" className="absolute -left-[142.5px] inset-y-0 w-[285px] h-[180px] object-cover" style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' }} />
                    </div>
                  </div>
                  <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10" />
                  <div className="absolute bottom-3 left-3 w-9 h-9 flex items-center justify-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md rounded-xl text-neutral-800 dark:text-neutral-200 z-20">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/>
                      <path d="M22 21H7"/>
                      <path d="m5 11 9 9"/>
                    </svg>
                  </div>
                </div>
                <span className="mt-2.5 px-0.5 text-[13.5px] font-medium tracking-tight text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Remove Background</span>
              </div>

              {/* Card 3: Precise Edit */}
              <div
                className="workflow-carousel-card flex flex-col shrink-0 group cursor-pointer select-none"
                onClick={() => {
                  setWorkflowTool('precise-edit');
                  setMode('edit');
                  setSourceImage(null);
                  setPreciseRefImages([]);
                  setEditPrompt('');
                  setView('workspace');
                }}
              >
                <div className="w-[285px] min-w-[285px] max-w-[285px] h-[180px] rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                  <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80" alt="Precise Edit" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-6 left-12 right-12 bottom-8 rounded-xl border-2 border-dashed border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.4)] flex items-center justify-center pointer-events-none">
                    <span className="px-2 py-0.5 rounded bg-black/60 text-cyan-300 text-[10px] font-mono tracking-wider backdrop-blur-sm">MARQUEE EDIT</span>
                  </div>
                  <div className="absolute bottom-3 left-3 w-9 h-9 flex items-center justify-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md rounded-xl text-neutral-800 dark:text-neutral-200 z-20">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" strokeDasharray="3 3"/>
                      <path d="m14 14 3 3m0-3-3 3"/>
                      <circle cx="9" cy="9" r="2"/>
                    </svg>
                  </div>
                </div>
                <span className="mt-2.5 px-0.5 text-[13.5px] font-medium tracking-tight text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Precise Edit</span>
              </div>

              {/* Card 4: Upscale Image */}
              <div
                className="workflow-carousel-card flex flex-col shrink-0 group cursor-pointer select-none"
                onClick={() => {
                  setWorkflowTool('upscale-image');
                  setMode('generate');
                  setView('workspace');
                }}
              >
                <div className="w-[285px] min-w-[285px] max-w-[285px] h-[180px] rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                  <div className="absolute inset-0 grid grid-cols-2">
                    <div className="relative overflow-hidden bg-slate-800">
                      <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=40" alt="Standard Res" className="absolute inset-0 w-[285px] h-[180px] object-cover blur-[2px] opacity-80" />
                      <div className="absolute top-2.5 left-2.5 px-1.5 py-0.5 rounded bg-black/60 text-neutral-300 text-[9px] font-mono">1X</div>
                    </div>
                    <div className="relative overflow-hidden bg-slate-900">
                      <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=100" alt="Super Res" className="absolute -left-[142.5px] inset-y-0 w-[285px] h-[180px] object-cover saturate-110 contrast-105" />
                      <div className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-mono font-bold">4K UHD</div>
                    </div>
                  </div>
                  <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10" />
                  <div className="absolute bottom-3 left-3 w-9 h-9 flex items-center justify-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md rounded-xl text-neutral-800 dark:text-neutral-200 z-20">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m7 15 5-5 5 5"/><path d="m7 9 5-5 5 5"/>
                    </svg>
                  </div>
                </div>
                <span className="mt-2.5 px-0.5 text-[13.5px] font-medium tracking-tight text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Upscale Image</span>
              </div>

              {/* Card 5: Vectorize Image */}
              <div
                className="workflow-carousel-card flex flex-col shrink-0 group cursor-pointer select-none"
                onClick={() => {
                  setWorkflowTool('image-to-image');
                  setMode('generate');
                  setView('workspace');
                }}
              >
                <div className="w-[285px] min-w-[285px] max-w-[285px] h-[180px] rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                  <img src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80" alt="Vectorize Image" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute bottom-3 left-3 w-9 h-9 flex items-center justify-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md rounded-xl text-neutral-800 dark:text-neutral-200 z-20">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m12 19 7-7 3 3-7 7-3-3z"/>
                      <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                      <circle cx="11" cy="11" r="2"/>
                    </svg>
                  </div>
                </div>
                <span className="mt-2.5 px-0.5 text-[13.5px] font-medium tracking-tight text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Vectorize Image</span>
              </div>

              {/* Card 6: Vector Illustration */}
              <div
                className="workflow-carousel-card flex flex-col shrink-0 group cursor-pointer select-none"
                onClick={() => {
                  setWorkflowTool('vector-illustration');
                  setMode('generate');
                  setView('workspace');
                }}
              >
                <div className="w-[285px] min-w-[285px] max-w-[285px] h-[180px] rounded-2xl overflow-hidden border border-neutral-200/50 dark:border-neutral-800/50 relative transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl bg-slate-900">
                  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" alt="Vector Art" className="w-full h-full object-cover saturate-150 transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-md">
                    NEW
                  </div>
                  <div className="absolute bottom-3 left-3 w-9 h-9 flex items-center justify-center bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-md rounded-xl text-neutral-800 dark:text-neutral-200 shadow-xs z-20">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 19 21 12 17 5 21 12 2"/>
                    </svg>
                  </div>
                </div>
                <span className="mt-2.5 px-0.5 text-[13.5px] font-medium tracking-tight text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Vector Illustration</span>
              </div>

            </div>
          </div>
</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={workspaceRef}
      id="image-studio-workspace"
      className={`flex-1 flex flex-col md:flex-row h-full w-full overflow-hidden min-w-0 bg-white dark:bg-[#0c1017] text-slate-900 dark:text-slate-100 select-none relative font-sans ${className}`}
    >
      {/* ============================================================ */}
      {/* LEFT PARAMETER PANEL (Generate Image & Smart Edit Views)     */}
      {/* ============================================================ */}
      <aside
        id="ideogram-left-panel"
        className="w-full shrink-0 h-full flex flex-col bg-white dark:bg-[#0c1017] z-20 overflow-hidden"
        style={{ width: `${panelWidth}px`, minWidth: '340px', maxWidth: '620px' }}
      >
        {/* Panel Header */}
        <div className="px-4 py-3 flex items-center justify-between shrink-0 bg-transparent border-b border-gray-100 dark:border-neutral-800/60">
          <div id="ideogram-header-generate" className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white relative">
            <button
              type="button"
              id="ideogram-back-to-home-btn"
              onClick={() => {
                setView('home');
                setSourceImage(null);
                setPreciseRefImages([]);
                setEditPrompt('');
              }}
              className="p-1 -ml-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center gap-1"
              title="Back to Image Home"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            {/* Ideogram-Style Breadcrumb App Switcher Dropdown */}
            <div className="relative" id="workspace-tool-switcher-wrapper" ref={toolSwitcherRef}>
              <button
                type="button"
                id="workspace-tool-switcher-btn"
                onClick={() => setIsToolSwitcherOpen(!isToolSwitcherOpen)}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800/80 px-2 py-1.5 rounded-lg transition cursor-pointer select-none"
              >
                <span className="text-neutral-400 dark:text-neutral-500 font-normal hidden sm:inline">Creative Workflows /</span>
                <span id="workspace-active-tool-label">
                  {WORKFLOW_TOOLS_CONFIG.find(t => t.id === workflowTool)?.label || 'Generate Image'}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isToolSwitcherOpen ? 'rotate-180' : ''}`}
                  id="workspace-tool-switcher-chevron"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>

              {/* Searchable Popup Menu (Flyout) */}
              {isToolSwitcherOpen && (
                <div
                  id="workspace-tool-flyout"
                  className="absolute left-0 top-full mt-2 w-72 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md shadow-2xl p-1.5 z-50"
                >
                  {/* Header Search Input */}
                  <div className="relative mb-1.5 px-1 pt-1">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200/50 dark:border-neutral-700/50 text-slate-800 dark:text-neutral-200">
                      <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                      </svg>
                      <input
                        type="text"
                        value={toolSearchQuery}
                        onChange={(e) => setToolSearchQuery(e.target.value)}
                        placeholder="Search workflows..."
                        autoFocus
                        className="w-full bg-transparent text-xs placeholder:text-neutral-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Tool List */}
                  <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto ideogram-custom-scroll" id="workspace-tool-list">
                    {WORKFLOW_TOOLS_CONFIG
                      .filter(tool => !toolSearchQuery.trim() || tool.label.toLowerCase().includes(toolSearchQuery.toLowerCase()) || tool.subtitle.toLowerCase().includes(toolSearchQuery.toLowerCase()))
                      .map(tool => {
                        const isSelected = tool.id === workflowTool;
                        return (
                          <button
                            key={tool.id}
                            type="button"
                            onClick={() => {
                              setWorkflowTool(tool.id);
                              if (tool.id === 'precise-edit') {
                                setMode('edit');
                              } else {
                                setMode('generate');
                              }
                              setIsToolSwitcherOpen(false);
                            }}
                            className={`w-full px-2.5 py-2 rounded-lg text-left flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50/70 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60 text-slate-700 dark:text-neutral-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                              }`}>
                                {tool.id === 'generate-image' && (
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                )}
                                {tool.id === 'remove-background' && (
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
                                )}
                                {tool.id === 'precise-edit' && (
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" strokeDasharray="3 3"/><path d="m14 14 3 3m0-3-3 3"/><circle cx="9" cy="9" r="2"/></svg>
                                )}
                                {tool.id === 'upscale-image' && (
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7 15 5-5 5 5"/><path d="m7 9 5-5 5 5"/></svg>
                                )}
                                {tool.id === 'image-to-image' && (
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="2" y="2" rx="2"/><rect width="14" height="14" x="8" y="8" rx="2"/></svg>
                                )}
                                {tool.id === 'vector-illustration' && (
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
                                )}
                              </div>
                              <div className="min-w-0 flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs truncate font-medium">{tool.label}</span>
                                  {tool.badge && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                                      {tool.badge}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">{tool.subtitle}</span>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="shrink-0 ml-2 text-blue-600 dark:text-blue-400">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPrompt('');
                setEditPrompt('');
              }}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Clear all"
            >
              Clear all
            </button>
          </div>
        </div>

        {/* Scrollable Parameter Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 ideogram-custom-scroll">
          {/* Tool-specific workflows */}
          {workflowTool === 'remove-background' ? (
            <div id="ideogram-remove-bg-controls" className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500 block mb-2">Source image</label>
                
                {/* Hidden File Input */}
                <input
                  ref={removeBgInputRef}
                  type="file"
                  id="remove-bg-file-input"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      setRemoveBgFile(file);
                      const reader = new FileReader();
                      reader.onload = (ev) => setRemoveBgImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />

                {!removeBgImage ? (
                  /* Ideogram Minimalist Dropzone (Empty State) */
                  <div
                    id="remove-bg-upload-zone"
                    onClick={() => removeBgInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsRemoveBgDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsRemoveBgDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsRemoveBgDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        setRemoveBgFile(file);
                        const reader = new FileReader();
                        reader.onload = (ev) => setRemoveBgImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className={`relative w-full aspect-[4/3] max-h-[380px] rounded-2xl border-2 border-dashed bg-transparent transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none ${
                      isRemoveBgDragging
                        ? 'border-neutral-400 dark:border-neutral-500'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                    }`}
                  >
                    <span className="text-sm text-neutral-600 dark:text-neutral-400 font-normal">Upload or choose an image</span>
                    <button
                      type="button"
                      id="remove-bg-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBgInputRef.current?.click();
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <span>+ Add</span>
                    </button>
                  </div>
                ) : (
                  /* Uploaded Image Preview (Filled State) */
                  <div
                    id="remove-bg-preview-wrapper"
                    className="relative w-full aspect-[4/3] max-h-[380px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:8px_8px] flex items-center justify-center p-2"
                  >
                    <img id="remove-bg-preview-img" src={removeBgImage} alt="Source preview" className="w-full h-full object-contain rounded-xl" />
                    <button
                      type="button"
                      id="remove-bg-remove-file-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRemoveBgImage(null);
                        setRemoveBgFile(null);
                        if (removeBgInputRef.current) removeBgInputRef.current.value = '';
                      }}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xs transition cursor-pointer z-20 shadow-md"
                      title="Change image"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                type="button"
                id="btn-do-remove-bg"
                disabled={!removeBgImage || isProcessingWorkflow}
                onClick={async () => {
                  if (!removeBgImage && !removeBgFile) return;
                  setIsProcessingWorkflow(true);
                  try {
                    const sourceInput = removeBgFile || removeBgImage;
                    const config = {
                      publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.5.6/dist/',
                      debug: false
                    };
                    const imgly = await import('https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.6/+esm' as string);
                    const removeBackground = (imgly as any).removeBackground || (imgly as any).default;
                    const blob = await removeBackground(sourceInput, config);
                    if (!blob || blob.size === 0) throw new Error('Empty blob');
                    const transparentImageUrl = URL.createObjectURL(blob);

                    const tmpImg = new Image();
                    await new Promise((res) => {
                      tmpImg.onload = res;
                      tmpImg.onerror = res;
                      tmpImg.src = transparentImageUrl;
                    });
                    const outW = tmpImg.naturalWidth || 1024;
                    const outH = tmpImg.naturalHeight || 1024;

                    assets.unshift({
                      id: 'bg-removed-' + Date.now(),
                      url: transparentImageUrl,
                      prompt: 'Background Removed (Transparent Cutout)',
                      model: 'Transparent Cutout',
                      aspectRatio: `${outW}:${outH}`
                    });
                  } catch (err) {
                    console.error('BG removal error:', err);
                  } finally {
                    setIsProcessingWorkflow(false);
                  }
                }}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                  removeBgImage && !isProcessingWorkflow
                    ? 'cursor-pointer active:scale-98 shadow-sm bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100'
                    : 'bg-neutral-100 dark:bg-white/10 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                }`}
              >
                <span id="btn-do-remove-bg-text">{isProcessingWorkflow ? 'Removing background...' : 'Remove background'}</span>
              </button>
            </div>
          ) : workflowTool === 'upscale-image' ? (
            <div id="ideogram-upscale-controls" className="space-y-4">
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-neutral-500 mb-2">Source image</div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  id="upscaleFileInput"
                  ref={upscaleInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setUpscaleImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />

                {!upscaleImage ? (
                  /* Proportional Dropzone (Empty State) */
                  <div
                    id="upscale-upload-zone"
                    onClick={() => upscaleInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsUpscaleDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsUpscaleDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsUpscaleDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setUpscaleImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className={`relative w-full aspect-[4/3] rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-transparent transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none ${
                      isUpscaleDragging ? 'border-neutral-400 dark:border-neutral-500' : ''
                    }`}
                    style={{ aspectRatio: '4 / 3', width: '100%' }}
                  >
                    <span className="text-sm font-normal text-neutral-500 dark:text-neutral-400">
                      Upload or choose an image
                    </span>
                    <button
                      type="button"
                      id="upscale-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        upscaleInputRef.current?.click();
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shadow-sm cursor-pointer"
                    >
                      <span>+ Add</span>
                    </button>
                  </div>
                ) : (
                  /* Uploaded Image Preview (Populated State) */
                  <div
                    id="upscale-preview-wrapper"
                    className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-300 dark:border-neutral-800 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:8px_8px] flex items-center justify-center p-2"
                    style={{ aspectRatio: '4 / 3', width: '100%' }}
                  >
                    <img
                      id="upscale-preview-img"
                      src={upscaleImage}
                      alt="Source preview"
                      className="w-full h-full object-contain rounded-xl"
                    />
                    <button
                      type="button"
                      id="upscale-remove-file-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUpscaleImage(null);
                        if (upscaleInputRef.current) upscaleInputRef.current.value = '';
                      }}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xs transition cursor-pointer z-20 shadow-md"
                      title="Change image"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Target Scale Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300 block">Target Scale</label>
                <div className="grid grid-cols-2 gap-2">
                  {([2, 4] as const).map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      data-scale={scale}
                      data-upscale-factor={scale}
                      onClick={() => setUpscaleFactor(scale)}
                      className={`upscale-factor-btn btn-upscale-factor py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                        upscaleFactor === scale
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'border-neutral-200 dark:border-neutral-800 bg-transparent text-neutral-600 dark:text-neutral-400 font-medium hover:border-neutral-300'
                      }`}
                    >
                      <span>{scale}x</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer Action Button: Single Solid High-Contrast Button */}
              <button
                type="button"
                id="upscaleSubmitBtn"
                disabled={!upscaleImage || isProcessingWorkflow}
                onClick={async () => {
                  const upscaleSourceImage = upscaleImage;
                  if (!upscaleSourceImage || typeof upscaleSourceImage !== 'string' || !upscaleSourceImage.startsWith('data:image')) {
                    console.error('[Upscale] Invalid or missing source image!');
                    showToast?.('Please upload a valid source image first.');
                    return;
                  }
                  if (isProcessingWorkflow) return;
                  setIsProcessingWorkflow(true);
                  console.log('[Upscale Frontend] Sending image with length:', upscaleSourceImage.length);

                  try {
                    const host = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
                    const isPort5001 = typeof window !== 'undefined' && window.location.port === '5001';
                    const endpoint = isPort5001 ? '/api/images/upscale' : `http://${host}:5001/api/images/upscale`;
                    const scaleStr = `${upscaleFactor}x`;

                    let response;
                    try {
                      response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                          sourceImage: upscaleSourceImage,
                          image: upscaleSourceImage,
                          scale: scaleStr
                        })
                      });
                    } catch (netErr) {
                      console.warn('[Upscale] Primary endpoint failed, attempting relative fallback...', netErr);
                      response = await fetch('/api/images/upscale', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                          sourceImage: upscaleSourceImage,
                          image: upscaleSourceImage,
                          scale: scaleStr
                        })
                      });
                    }

                    const result = await response.json();
                    if (!response.ok || !result.success) {
                      throw new Error(result.error || result.message || 'Failed to upscale image');
                    }

                    const images = result.images || [];
                    if (images.length === 0) {
                      throw new Error('No upscaled image returned from server');
                    }

                    images.forEach((img: any) => {
                      assets.unshift({
                        id: img.id || `upscale_${Date.now()}`,
                        url: img.url,
                        prompt: img.prompt || `Upscaled ${scaleStr}`,
                        model: img.model || 'qwen/qwen-image-2.1-pro',
                        modelName: img.modelName || 'Qwen Image 2.1 Pro',
                        aspectRatio: img.aspectRatio || 'Original',
                        isUpscale: true,
                        sourceImage: upscaleImage
                      });
                    });

                    showToast?.(`Image upscaled to ${scaleStr} successfully!`);
                  } catch (err: any) {
                    console.error('Upscale error:', err);
                    showToast?.(err.message || 'Failed to upscale image.');
                  } finally {
                    setIsProcessingWorkflow(false);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                {isProcessingWorkflow ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Upscaling...</span>
                  </>
                ) : (
                  <span id="upscaleSubmitBtnText">Upscale</span>
                )}
              </button>
            </div>
          ) : workflowTool === 'image-to-image' ? (
            <div id="ideogram-img2img-controls" className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Source Image Guide</label>
                {!img2imgImage ? (
                  <label
                    id="img2img-upload-zone"
                    className="border-2 border-dashed border-slate-200 dark:border-neutral-800 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-white/[0.02]"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setImg2imgImage(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Drop reference image here</span>
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800 p-2">
                    <img src={img2imgImage} alt="Img2Img Source" className="w-full max-h-[220px] object-contain rounded-xl" />
                    <button
                      type="button"
                      onClick={() => setImg2imgImage(null)}
                      className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xs cursor-pointer shadow-md"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Transformation Strength</span>
                  <span className="text-blue-600 dark:text-blue-400 font-mono">{Math.round(img2imgStrength * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={img2imgStrength}
                  onChange={(e) => setImg2imgStrength(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Variation Prompt</label>
                <div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3">
                  <textarea
                    value={img2imgPrompt}
                    onChange={(e) => setImg2imgPrompt(e.target.value)}
                    placeholder="Describe how to remix this image..."
                    rows={3}
                    className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!img2imgImage || !img2imgPrompt.trim()}
                onClick={() => {
                  if (!img2imgImage || !img2imgPrompt.trim()) return;
                  onGenerate?.({
                    prompt: img2imgPrompt.trim(),
                    model: selectedModel,
                    aspectRatio: '1:1',
                    count: 1,
                    referenceImage: img2imgImage
                  });
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                <span>Generate Variations</span>
              </button>
            </div>
          ) : workflowTool === 'vector-illustration' ? (
            /* VECTOR ILLUSTRATION CONTROLS (CLEAN STUDIO LAYOUT) */
            <form
              id="ideogram-vector-illustration-controls"
              onSubmit={(e) => {
                e.preventDefault();
                if (!prompt.trim()) return;
                let finalPrompt = prompt.trim();
                const vectorPrefix = 'flat 2D vector graphic, clean sharp SVG lines, minimal gradients, isolated subject, sticker-cut vector art, professional graphic design illustration, ';
                if (!finalPrompt.toLowerCase().includes('vector graphic') && !finalPrompt.toLowerCase().includes('flat 2d vector')) {
                  finalPrompt = vectorPrefix + finalPrompt;
                }
                if ((vectorQuality === 'High' as any || (vectorQuality as string) === 'Detailed') && !finalPrompt.toLowerCase().includes('detailed')) {
                  finalPrompt += ', highly detailed, ultra crisp scalable vector curves';
                }
                onGenerate?.({
                  prompt: finalPrompt,
                  model: 'recraft/recraft-v3',
                  aspectRatio: vectorRatio,
                  count: vectorCount,
                  quality: vectorQuality,
                  referenceImages: vectorRefImages,
                  tool: 'vector-illustration',
                  seed: vectorSeed
                });
              }}
              className="space-y-4"
            >
              {/* 1. Reference images directly below header */}
              <div id="vector-ref-section" className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Reference images</label>
                  <span className="text-[11px] text-slate-400 font-mono">{vectorRefImages.length}/10</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {vectorRefImages.map((img, idx) => (
                    <div key={idx} className="w-16 h-16 rounded-xl relative group overflow-hidden border border-slate-200 dark:border-white/10 shrink-0 bg-slate-100 dark:bg-white/5 shadow-2xs">
                      <img src={img} alt="Reference" className="object-cover w-full h-full rounded-lg" />
                      <button
                        type="button"
                        onClick={() => setVectorRefImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/75 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-bold shadow-xs z-10"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {vectorRefImages.length < 10 && (
                    <div
                      onClick={() => vectorRefInputRef.current?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-all cursor-pointer group shrink-0"
                      title="Upload reference image"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14m-7-7h14" />
                      </svg>
                    </div>
                  )}
                  {Array.from({ length: Math.max(0, 3 - vectorRefImages.length - (vectorRefImages.length < 10 ? 1 : 0)) }).map((_, i) => (
                    <div key={i} className="w-16 h-16 rounded-xl border border-dashed border-slate-200 dark:border-white/5 bg-transparent shrink-0" />
                  ))}
                </div>
                <input
                  type="file"
                  ref={vectorRefInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        if (ev.target?.result) {
                          setVectorRefImages(prev => [...prev, ev.target!.result as string].slice(0, 10));
                        }
                      };
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              {/* 2. Aspect Ratio Selector (All 8 standard ratios) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Aspect Ratio</label>
                  <span className="text-[11px] text-slate-400 font-mono capitalize">{vectorRatio}</span>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 text-xs overflow-x-auto ideogram-custom-scroll">
                  {(['auto', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'] as const).map(ratio => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setVectorRatio(ratio)}
                      className={`shrink-0 flex-1 min-w-[34px] py-1 px-1.5 rounded-lg text-[11px] text-center transition-all cursor-pointer ${
                        vectorRatio === ratio
                          ? 'active font-semibold bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-2xs'
                          : 'font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Prompt Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Prompt</label>
                <div className="w-full bg-white dark:bg-[#161f2b] rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-xs p-3 relative transition-all focus-within:border-slate-400 dark:focus-within:border-white/20 focus-within:ring-1 focus-within:ring-blue-500/20">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the image you want to create..."
                    rows={5}
                    className="w-full min-h-[140px] resize-none border-none outline-none focus:outline-none focus:ring-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-[13.5px] bg-transparent leading-relaxed"
                  />
                </div>
              </div>

              {/* 4. Dual-Card Bottom Controls: Left Pill (Quality/Detail: Low/Medium/High), Right Pill (Quantity showing ONLY number) */}
              <div className="grid grid-cols-2 gap-2">
                {/* Left Pill: Quality / Detail */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVectorQualityOpen(!isVectorQualityOpen);
                      setIsVectorCountOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 shrink-0 flex items-center justify-center text-slate-600 dark:text-slate-400">
                        {/* Lucide Sliders Icon */}
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="4" x2="4" y1="21" y2="14"/>
                          <line x1="4" x2="4" y1="10" y2="3"/>
                          <line x1="12" x2="12" y1="21" y2="12"/>
                          <line x1="12" x2="12" y1="8" y2="3"/>
                          <line x1="20" x2="20" y1="21" y2="16"/>
                          <line x1="20" x2="20" y1="12" y2="3"/>
                          <line x1="1" x2="7" y1="14" y2="14"/>
                          <line x1="9" x2="15" y1="8" y2="8"/>
                          <line x1="17" x2="23" y1="16" y2="16"/>
                        </svg>
                      </span>
                      <span className="font-medium truncate">{vectorQuality}</span>
                    </div>
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {isVectorQualityOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#0c141c] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-2xl text-slate-700 dark:text-slate-200">
                      <div className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase px-2 py-1 border-b border-slate-100 dark:border-white/10 mb-1">
                        Detail Level
                      </div>
                      <div className="space-y-0.5">
                        {(['Low', 'Medium', 'High'] as const).map(q => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => {
                              setVectorQuality(q);
                              setIsVectorQualityOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left ${
                              vectorQuality === q ? 'bg-gray-100 dark:bg-neutral-800' : 'hover:bg-slate-100 dark:hover:bg-white/10'
                            }`}
                          >
                            <span className={vectorQuality === q ? 'font-semibold text-slate-800 dark:text-slate-100' : ''}>{q}</span>
                            {vectorQuality === q && (
                              <svg className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Pill: Quantity (ONLY number, e.g. "1") */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVectorCountOpen(!isVectorCountOpen);
                      setIsVectorQualityOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 h-4 shrink-0 flex items-center justify-center text-slate-600 dark:text-slate-400">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                          <circle cx="9" cy="9" r="2"/>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                        </svg>
                      </span>
                      <span className="font-semibold truncate">{vectorCount}</span>
                    </div>
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>

                  {isVectorCountOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#0c141c] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-2xl text-slate-700 dark:text-slate-200">
                      <div className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase px-2 py-1 border-b border-slate-100 dark:border-white/10 mb-1">
                        Quantity
                      </div>
                      <div className="space-y-0.5">
                        {[1, 2, 3, 4].map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setVectorCount(c);
                              setIsVectorCountOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left ${
                              vectorCount === c ? 'bg-gray-100 dark:bg-neutral-800' : 'hover:bg-slate-100 dark:hover:bg-white/10'
                            }`}
                          >
                            <span className={vectorCount === c ? 'font-semibold text-slate-800 dark:text-slate-100' : ''}>{c}</span>
                            {vectorCount === c && (
                              <svg className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Collapsible Advanced settings (Seed control) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsVectorAdvancedOpen(!isVectorAdvancedOpen)}
                  className="w-full flex items-center justify-between py-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer group"
                >
                  <span className="text-xs font-semibold">Advanced settings</span>
                  <svg className={`w-3.5 h-3.5 transition-transform duration-200 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white ${isVectorAdvancedOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {isVectorAdvancedOpen && (
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block">Seed</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={vectorSeed}
                          onChange={(e) => setVectorSeed(e.target.value)}
                          placeholder="Random seed"
                          className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setVectorSeed(String(Math.floor(Math.random() * 999999999)))}
                          className="px-2 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                          title="Generate random seed"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Primary Full-Width Generate Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!prompt.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                    <path d="M5 3v4"/>
                    <path d="M19 17v4"/>
                    <path d="M3 5h4"/>
                    <path d="M17 19h4"/>
                  </svg>
                  <span>Generate</span>
                </button>
              </div>
            </form>
          ) : (mode === 'generate' && workflowTool !== 'precise-edit') ? (
            /* GENERATE CONTROLS */
            <form id="ideogram-generate-controls" onSubmit={handleGenerateSubmit} className="space-y-4">
              {/* Model Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="auto">Auto (Mestrio Dynamic)</option>
                  <option value="openai/gpt-image-2.5-sunburst">GPT Image 2.5 Sunburst</option>
                  <option value="google/gemini-3-pro-image">Nano Banana Pro (Gemini 3 Pro Image)</option>
                  <option value="black-forest-labs/flux.2-pro">FLUX.2 Pro</option>
                  <option value="bytedance-seed/seedream-5.0-pro">Seedream 5.0 Pro</option>
                  <option value="meta/muse-image">Meta: Muse Image</option>
                  <option value="google/gemini-3.1-flash-image-preview">Nano Banana 2 (Gemini 3.1 Flash Image)</option>
                </select>
              </div>

              {/* Prompt Input Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Prompt</label>
                <div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3 focus-within:border-blue-500/70 focus-within:ring-1 focus-within:ring-blue-500/70 transition-all">
                  <textarea
                    id="ideogram-prompt-input"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to generate in detail..."
                    rows={4}
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none"
                  />
                </div>
              </div>

              {/* Aspect Ratio Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Aspect Ratio</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {['auto', '1:1', '2:3', '3:4', '9:16', '3:2', '4:3', '16:9'].map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                        aspectRatio === ratio
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variations Count */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Variations</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {[1, 2, 3, 4].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setVariationsCount(count)}
                      className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                        variationsCount === count
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      {count} {count === 1 ? 'img' : 'imgs'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  id="studio-generate-btn"
                  type="submit"
                  disabled={!prompt.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs sm:text-sm shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg id="studio-generate-icon" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                    <path d="M5 3v4"/>
                    <path d="M19 17v4"/>
                    <path d="M3 5h4"/>
                    <path d="M17 19h4"/>
                  </svg>
                  <span>Generate</span>
                </button>
              </div>
            </form>
          ) : (
            /* SMART EDIT / PRECISE EDIT CONTROLS (IDEOGRAM MATCH) */
            <form id="ideogram-precise-edit-controls" onSubmit={handleEditSubmit} className="space-y-4">
              <!-- 1. SOURCE IMAGE (IDEOGRAM MINIMALIST DROPZONE & PROPORTIONAL PREVIEW) -->
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-500 block mb-2">Image</label>

                <input
                  type="file"
                  ref={preciseInputRef}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setSourceImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />

                {!sourceImage ? (
                  /* Empty State Dropzone */
                  <div
                    id="studio-precise-edit-dropzone"
                    onClick={() => preciseInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsPreciseDragging(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsPreciseDragging(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsPreciseDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setSourceImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className={`relative w-full aspect-[4/3] max-h-[380px] rounded-2xl border-2 border-dashed bg-transparent transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none ${
                      isPreciseDragging
                        ? 'border-neutral-400 dark:border-neutral-500'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600'
                    }`}
                  >
                    <span className="text-sm text-neutral-600 dark:text-neutral-400 font-normal">Upload or choose an image</span>
                    <button
                      type="button"
                      id="studio-precise-edit-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        preciseInputRef.current?.click();
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                    >
                      <span>+ Add</span>
                    </button>
                  </div>
                ) : (
                  /* Uploaded Image Preview (Filled State) */
                  <div
                    id="studio-precise-edit-preview-wrap"
                    className="relative w-full aspect-[4/3] max-h-[380px] rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 flex items-center justify-center p-2 group"
                  >
                    <img id="studio-precise-edit-thumb" src={sourceImage} alt="Source for Precise Edit" className="w-full h-full object-contain rounded-xl transition-all" />
                    <button
                      type="button"
                      id="studio-precise-edit-remove-src-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSourceImage(null);
                        if (preciseInputRef.current) preciseInputRef.current.value = '';
                      }}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xs transition cursor-pointer z-20 shadow-md"
                      title="Change image"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Edit Prompt Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">What should change?</label>
                <div className="relative rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-3 focus-within:border-blue-500/70 focus-within:ring-1 focus-within:ring-blue-500/70 transition-all">
                  <textarea
                    id="studio-precise-edit-input"
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="Describe the change you want..."
                    rows={4}
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none"
                  />
                </div>
              </div>

              {/* 3. Reference Images Upload Grid (up to 10 references) */}
              <div id="studio-precise-edit-ref-section" className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 text-xs">Reference images</label>
                  <span id="studio-precise-edit-ref-status" className="text-[11px] text-slate-400 font-mono">
                    {preciseRefImages.length}/10
                  </span>
                </div>
                <div id="studio-precise-edit-ref-slots" className="flex items-center gap-2 flex-wrap">
                  {preciseRefImages.map((refImg, idx) => (
                    <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 group shrink-0">
                      <img src={refImg} alt={`Reference ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPreciseRefImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center text-[9px] hover:bg-black transition cursor-pointer"
                        title="Remove reference"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {preciseRefImages.length < 10 && (
                    <div
                      id="studio-precise-edit-ref-dropzone"
                      onClick={() => preciseRefInputRef.current?.click()}
                      className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/15 hover:border-slate-400 dark:hover:border-white/30 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-all cursor-pointer group shrink-0"
                      title="Upload reference image"
                    >
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14m-7-7h14" />
                      </svg>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={preciseRefInputRef}
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    const remaining = 10 - preciseRefImages.length;
                    const toProcess = files.slice(0, remaining);
                    toProcess.forEach(file => {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const res = ev.target?.result as string;
                        if (res) {
                          setPreciseRefImages(prev => prev.length < 10 ? [...prev, res] : prev);
                        }
                      };
                      reader.readAsDataURL(file);
                    });
                    e.target.value = '';
                  }}
                />
              </div>

              {/* 4. Quality & Variations Dropdown Row */}
              <div className="grid grid-cols-2 gap-2">
                {/* Quality Dropdown */}
                <div className="relative" id="studio-precise-weight-wrapper">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Quality</label>
                  <button
                    id="studio-precise-edit-weight-btn"
                    type="button"
                    onClick={() => {
                      setIsQualityOpen(!isQualityOpen);
                      setIsPreciseCountOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span id="studio-precise-edit-weight-icon" className="shrink-0 flex items-center justify-center text-blue-500">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                        </svg>
                      </span>
                      <span id="studio-precise-edit-weight-label" className="font-medium truncate capitalize">{quality === 'speed' ? 'Speed' : quality === 'medium' ? 'Medium' : 'High'}</span>
                    </div>
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>

                  {isQualityOpen && (
                    <div
                      id="studio-precise-edit-weight-dropdown"
                      className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#0c141c] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-2xl text-slate-700 dark:text-slate-200 max-h-64 overflow-y-auto ideogram-custom-scroll"
                    >
                      <div className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase px-2 py-1 border-b border-slate-100 dark:border-white/10 mb-1">Quality</div>
                      <div className="space-y-0.5">
                        {(['speed', 'medium', 'high'] as const).map((q) => (
                          <button
                            key={q}
                            type="button"
                            data-weight={q}
                            onClick={() => {
                              setQuality(q);
                              setIsQualityOpen(false);
                            }}
                            className={`studio-precise-weight-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left group ${
                              quality === q ? 'bg-slate-100/70 dark:bg-white/10 font-semibold text-slate-800 dark:text-slate-100' : 'hover:bg-slate-100 dark:hover:bg-white/10'
                            }`}
                          >
                            <span className="capitalize">{q === 'speed' ? 'Speed' : q === 'medium' ? 'Medium' : 'High'}</span>
                            {quality === q && (
                              <svg className="studio-precise-weight-check w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Variations Dropdown */}
                <div className="relative" id="studio-precise-count-wrapper">
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">Variations</label>
                  <button
                    id="studio-precise-edit-count-btn"
                    type="button"
                    onClick={() => {
                      setIsPreciseCountOpen(!isPreciseCountOpen);
                      setIsQualityOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:bg-slate-50 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/20 transition-all cursor-pointer text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span id="studio-precise-edit-count-icon" className="shrink-0 flex items-center justify-center text-slate-700 dark:text-slate-300">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                          <circle cx="9" cy="9" r="2"/>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                        </svg>
                      </span>
                      <span id="studio-precise-edit-count-label" className="font-medium truncate">{preciseCount} ({preciseCount} image{preciseCount > 1 ? 's' : ''})</span>
                    </div>
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </button>

                  {isPreciseCountOpen && (
                    <div
                      id="studio-precise-edit-count-dropdown"
                      className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#0c141c] rounded-xl border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 z-50 backdrop-blur-2xl text-slate-700 dark:text-slate-200 max-h-64 overflow-y-auto ideogram-custom-scroll"
                    >
                      <div className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase px-2 py-1 border-b border-slate-100 dark:border-white/10 mb-1">Variations</div>
                      <div className="space-y-0.5">
                        {[1, 2, 3, 4].map((cnt) => (
                          <button
                            key={cnt}
                            type="button"
                            onClick={() => {
                              setPreciseCount(cnt);
                              setIsPreciseCountOpen(false);
                            }}
                            className={`studio-precise-count-option w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors text-left group ${
                              preciseCount === cnt ? 'bg-slate-100/70 dark:bg-white/10 font-semibold text-slate-800 dark:text-slate-100' : 'hover:bg-slate-100 dark:hover:bg-white/10'
                            }`}
                          >
                            <span>{cnt} ({cnt} image{cnt > 1 ? 's' : ''})</span>
                            {preciseCount === cnt && (
                              <svg className="studio-precise-count-check w-3.5 h-3.5 text-slate-700 dark:text-slate-200 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Apply Edit Action Button */}
              <div className="pt-2">
                <button
                  id="studio-apply-precise-edit-btn"
                  type="submit"
                  disabled={!sourceImage || preciseLoadingStep !== 'idle'}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                    sourceImage && preciseLoadingStep === 'idle'
                      ? 'cursor-pointer active:scale-98 shadow-sm bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100'
                      : 'bg-neutral-100 dark:bg-white/10 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  {preciseLoadingStep !== 'idle' && (
                    <span id="studio-apply-precise-edit-spinner">
                      <svg className="animate-spin -ml-1 mr-1 h-3.5 w-3.5 text-current inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  )}
                  <span id="studio-apply-precise-edit-text">
                    {preciseLoadingStep === 'refining'
                      ? 'Mahi Engine refining...'
                      : preciseLoadingStep === 'generating'
                      ? 'Generating with FLUX.2...'
                      : 'Apply edit'}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* DRAGGABLE DIVIDER / RESIZER HANDLE (Ideogram Style)          */}
      {/* ============================================================ */}
      <div
        id="ideogram-sidebar-resizer"
        className="w-1.5 h-full cursor-col-resize bg-transparent border-r border-gray-200 dark:border-neutral-800 hover:bg-gray-300/40 dark:hover:bg-neutral-700/40 transition-colors select-none z-10 shrink-0 relative"
        onMouseDown={startResizing}
      />

      {/* ============================================================ */}
      {/* RIGHT IMAGE FEED CANVAS                                      */}
      {/* ============================================================ */}
      <main
        id="ideogram-right-panel"
        className="flex-1 w-full h-full min-w-0 overflow-y-auto flex flex-col bg-white dark:bg-[#0c1017] relative"
      >
        {activeVectorStudioAsset && (
          <VectorStudioCanvas
            asset={activeVectorStudioAsset}
            onClose={() => setActiveVectorStudioAsset(null)}
            onSave={(updated) => {
              setActiveVectorStudioAsset(updated);
            }}
          />
        )}
        <div
          id="ideogram-assets-viewport"
          className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 space-y-6 ideogram-custom-scroll bg-white dark:bg-[#0c1017]"
        >
          {/* Loading Skeleton In-Progress Asset Group (Ideogram / Midjourney Premium Style) */}
          {isGenerating && (
            <div id="ideogram-in-progress-card" className="w-full space-y-3 transition-all animate-in fade-in duration-300">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-1">
                <div className="flex items-start gap-2.5 flex-1 min-w-0 pr-2">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 id="ideogram-progress-prompt-text" className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-snug truncate select-text">
                      {mode === 'edit' ? editPrompt || prompt : prompt}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5 font-sans font-medium text-blue-600 dark:text-blue-400">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <span id="ideogram-progress-status-text">Generating...</span>
                      </span>
                      <span>•</span>
                      <span id="ideogram-progress-model-badge" className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-sans font-medium">
                        {selectedModel}
                      </span>
                      <span>•</span>
                      <span id="ideogram-progress-ratio-badge" className="px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                        {aspectRatio}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-1 overflow-hidden">
                <div id="ideogram-progress-bar-fill" className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-full transition-all duration-700 w-1/3 animate-pulse"></div>
              </div>

              <div id="ideogram-progress-skeletons" className="variations-grid w-full max-w-[420px]">
                <div className="aspect-square max-h-[520px] rounded-xl overflow-hidden bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 animate-pulse border border-slate-200/50 dark:border-white/5 shadow-inner flex flex-col items-center justify-center relative w-full">
                  <div className="flex flex-col items-center justify-center gap-2.5 p-4 select-none">
                    <div className="w-11 h-11 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md flex items-center justify-center shadow-xs border border-white/60 dark:border-white/10 text-blue-500 dark:text-blue-400">
                      <svg className="w-5 h-5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                        <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
                      </svg>
                    </div>
                    <span className="text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400">Generating...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {assets.length === 0 && !isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-neutral-500">
              <svg className="w-12 h-12 mb-3 text-slate-300 dark:text-neutral-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No generated images yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Enter a descriptive prompt on the left and click Generate to synthesize images.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className={`rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 ${
                    asset.model === 'Transparent Cutout' || asset.prompt.includes('Transparent Cutout')
                      ? 'transparent-checkerboard-bg bg-white dark:bg-[#141414]'
                      : 'bg-slate-50 dark:bg-neutral-900'
                  } group relative shadow-xs hover:shadow-md transition-shadow flex flex-col`}
                >
                  <div
                    className="relative cursor-pointer overflow-hidden aspect-square flex items-center justify-center bg-black/5 dark:bg-white/5"
                    onClick={() => {
                      if (asset.isVector || (asset as any).isVectorIllustration || asset.url?.startsWith('data:image/svg+xml') || (asset as any).svg) {
                        setActiveVectorStudioAsset(asset);
                      } else {
                        setPreviewModalAsset(asset);
                      }
                    }}
                    title="Click to view and edit in Vector Studio"
                  >
                    <img
                      src={asset.url}
                      alt={asset.prompt}
                      className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${
                        asset.model === 'Transparent Cutout' || asset.prompt.includes('Transparent Cutout')
                          ? 'object-contain p-2'
                          : 'object-cover'
                      }`}
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-medium backdrop-blur-xs flex items-center gap-1.5 shadow-md">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/></svg>
                        High-Res Preview
                      </span>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      {Boolean(asset.isVector || asset.isVectorize || asset.model === 'recraft/recraft-v3' || asset.modelName === 'Recraft V3 Vectorizer') && (
                        <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          <span className="font-sans font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Vectorize Image
                          </span>
                          <span>•</span>
                          <span>{asset.time || 'Just now'}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-sans font-medium">
                            Recraft V3
                          </span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-medium">
                            {asset.detailLevel || 'Detailed'}
                          </span>
                        </div>
                      )}
                      {asset.isPreciseEdit && (
                        <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          <span className="font-sans font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            Precise Edit
                          </span>
                          <span>•</span>
                          <span>{asset.time || 'Just now'}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-sans font-medium">
                            {asset.modelName || 'FLUX.2 Flex'}
                          </span>
                          <span>•</span>
                          <span>{asset.variations || 1} variation{(asset.variations || 1) > 1 ? 's' : ''}</span>
                        </div>
                      )}
                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">{asset.prompt}</p>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{asset.aspectRatio || '1:1'}</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={asset.url}
                          download={`mestrio_${asset.id}.${asset.isVector ? 'svg' : (asset.model === 'Transparent Cutout' || asset.prompt.includes('Transparent Cutout') ? 'png' : 'jpg')}`}
                          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium cursor-pointer"
                        >
                          Download
                        </a>
                        {Boolean(asset.isVector || (asset as any).isVectorIllustration || asset.url?.startsWith('data:image/svg+xml') || (asset as any).svg) ? (
                          <button
                            type="button"
                            onClick={() => setActiveVectorStudioAsset(asset)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-semibold cursor-pointer"
                          >
                            Vector Studio
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSourceImage(asset.url);
                              setWorkflowTool('precise-edit');
                              setMode('edit');
                            }}
                            className="text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
                          >
                            Precise Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* High-res Preview Modal */}
      {previewModalAsset && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setPreviewModalAsset(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full bg-white dark:bg-[#121820] rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-white">
                {previewModalAsset.isPreciseEdit ? (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium">
                    Precise Edit • FLUX.2 Flex
                  </span>
                ) : (
                  <span>{previewModalAsset.modelName || previewModalAsset.model || 'Image Preview'}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewModalAsset.url}
                  download={`mestrio_${previewModalAsset.id}.${previewModalAsset.isVector ? 'svg' : 'jpg'}`}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition cursor-pointer"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewModalAsset(null)}
                  className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 flex items-center justify-center text-xs transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[72vh] flex items-center justify-center p-3 bg-neutral-900/80">
              <img src={previewModalAsset.url} alt={previewModalAsset.prompt} className="max-w-full max-h-[68vh] object-contain rounded-lg shadow-lg" />
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/10">
              <p className="text-xs text-slate-700 dark:text-slate-300 select-text leading-relaxed">{previewModalAsset.prompt}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageWorkspace;

