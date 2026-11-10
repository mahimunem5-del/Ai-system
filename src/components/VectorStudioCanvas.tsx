import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImageAsset } from './ImageWorkspace';

export interface VectorStudioCanvasProps {
  asset: ImageAsset;
  onClose: () => void;
  onSave?: (updatedAsset: ImageAsset) => void;
}

// Color conversion helpers
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  const r = parseInt(clean.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(clean.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(clean.substring(4, 6), 16) / 255 || 0;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s, v };
}

function extractPaletteFromSvg(svgStr: string): string[] {
  if (!svgStr) return [];
  const counts: Record<string, number> = {};
  const regex = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
  let m;
  while ((m = regex.exec(svgStr)) !== null) {
    let hex = m[0].toUpperCase();
    if (hex.length === 4) {
      hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    counts[hex] = (counts[hex] || 0) + 1;
  }
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 10);
}

const DESIGNER_PALETTES = [
  ['#FF5E5B', '#D8D8D8', '#FFFFEA', '#00CECB', '#FFED66', '#2E4057'],
  ['#2B2D42', '#8D99AE', '#EDF2F4', '#EF233C', '#D90429', '#FFA69E'],
  ['#05668D', '#028090', '#00A896', '#02C39A', '#F0F3BD', '#355070'],
  ['#6B2D5C', '#F39237', '#E01A4F', '#0E79B2', '#F1FFE7', '#F9C80E'],
  ['#3D5A80', '#98C1D9', '#E0FBFC', '#EE6C4D', '#293241', '#FFB703'],
  ['#264653', '#2A9D8F', '#E76F51', '#F4A261', '#E9C46A', '#6D597A']
];

export const VectorStudioCanvas: React.FC<VectorStudioCanvasProps> = ({ asset, onClose, onSave }) => {
  // Extract initial SVG text
  const initialSvg = React.useMemo(() => {
    let raw = (asset as any).svg || (asset as any).svgCode || '';
    if (!raw && asset.url && asset.url.startsWith('data:image/svg+xml')) {
      if (asset.url.startsWith('data:image/svg+xml;utf8,')) {
        raw = decodeURIComponent(asset.url.replace('data:image/svg+xml;utf8,', ''));
      } else if (asset.url.startsWith('data:image/svg+xml;base64,')) {
        try { raw = atob(asset.url.replace('data:image/svg+xml;base64,', '')); } catch (_) {}
      }
    }
    return raw;
  }, [asset]);

  const [svgContent, setSvgContent] = useState<string>(initialSvg);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [zoom, setZoom] = useState<number>(1.0);
  const [palette, setPalette] = useState<string[]>(() => {
    return (asset as any).palette?.length ? (asset as any).palette : extractPaletteFromSvg(initialSvg);
  });
  const [designerPaletteIdx, setDesignerPaletteIdx] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Popover state (Smart Single-Card Color Picker)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; arrowX: number }>({ top: 0, left: 0, arrowX: 120 });
  const [popoverMode, setPopoverMode] = useState<'palette' | 'element'>('palette');
  const [activeOldHex, setActiveOldHex] = useState<string>('#000000');
  const [currentHex, setCurrentHex] = useState<string>('#000000');
  const [h, setH] = useState<number>(0);
  const [s, setS] = useState<number>(1);
  const [v, setV] = useState<number>(1);
  const [activeSwatchEl, setActiveSwatchEl] = useState<HTMLElement | null>(null);

  // Color hover isolation
  const [isHoverIsolating, setIsHoverIsolating] = useState(false);

  // Sub-element selection & transformation state
  const [selectedEl, setSelectedEl] = useState<SVGElement | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  // References
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const sbSquareRef = useRef<HTMLDivElement>(null);
  const hueSliderRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Push to Undo Stack
  const pushUndo = useCallback((prevSvg: string) => {
    setUndoStack(prev => [...prev, prevSvg]);
  }, []);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(u => u.slice(0, -1));
    setSvgContent(prev);
    setPalette(extractPaletteFromSvg(prev));
    setSelectedEl(null);
    setSelectionBox(null);
    setIsPopoverOpen(false);
    showToast('Undone previous change');
  };

  // Keyboard shortcut Ctrl+Z
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'Escape') {
        setIsPopoverOpen(false);
        setSelectedEl(null);
        setSelectionBox(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack]);

  // Recalculate selection bounding box on viewport changes
  const updateSelectionBoundingBox = useCallback(() => {
    if (!selectedEl || !viewportRef.current) {
      setSelectionBox(null);
      return;
    }
    try {
      const vpRect = viewportRef.current.getBoundingClientRect();
      const elRect = selectedEl.getBoundingClientRect();
      const left = (elRect.left - vpRect.left) / zoom;
      const top = (elRect.top - vpRect.top) / zoom;
      const width = elRect.width / zoom;
      const height = elRect.height / zoom;
      setSelectionBox({ left, top, width, height });
    } catch (_) {
      setSelectionBox(null);
    }
  }, [selectedEl, zoom]);

  useEffect(() => {
    updateSelectionBoundingBox();
  }, [updateSelectionBoundingBox, svgContent, zoom]);

  // ─────────────────────────────────────────────────────────────────────────────
  // PART 2: COLOR HOVER ISOLATION (SWATCH HOVER PREVIEW)
  // ─────────────────────────────────────────────────────────────────────────────
  const handleSwatchMouseEnter = (targetHex: string) => {
    setIsHoverIsolating(true);
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;
    const norm = targetHex.toUpperCase();
    const allPaths = svg.querySelectorAll('path, polygon, rect, circle, ellipse, line, polyline');
    allPaths.forEach(p => {
      const fill = (p.getAttribute('fill') || (p as HTMLElement).style.fill || '').toUpperCase();
      const stroke = (p.getAttribute('stroke') || (p as HTMLElement).style.stroke || '').toUpperCase();
      if (fill === norm || stroke === norm) {
        (p as HTMLElement).style.opacity = '1';
      } else {
        (p as HTMLElement).style.opacity = '0.15';
        (p as HTMLElement).style.transition = 'opacity 0.15s ease';
      }
    });
  };

  const handleSwatchMouseLeave = () => {
    setIsHoverIsolating(false);
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;
    const allPaths = svg.querySelectorAll('path, polygon, rect, circle, ellipse, line, polyline');
    allPaths.forEach(p => {
      (p as HTMLElement).style.opacity = '1';
      (p as HTMLElement).style.transition = '';
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PART 1: SMART SINGLE-CARD COLOR PICKER (SINGLE-CLICK DIRECT OPEN)
  // ─────────────────────────────────────────────────────────────────────────────
  const openPopoverForSwatch = (dotEl: HTMLElement, hexColor: string) => {
    setActiveSwatchEl(dotEl);
    setPopoverMode('palette');
    setActiveOldHex(hexColor.toUpperCase());
    setCurrentHex(hexColor.toUpperCase());

    const hsv = hexToHsv(hexColor);
    setH(hsv.h);
    setS(hsv.s);
    setV(hsv.v);

    const swatchRect = dotEl.getBoundingClientRect();
    const popWidth = 240;
    const popHeight = 260;

    // Anchor strictly ABOVE the clicked color circle
    let top = swatchRect.top - popHeight - 12;
    if (top < 10) top = 10;
    let left = (swatchRect.left + swatchRect.width / 2) - (popWidth / 2);
    if (left < 16) left = 16;
    if (left + popWidth > window.innerWidth - 16) {
      left = window.innerWidth - popWidth - 16;
    }
    const arrowX = Math.max(16, Math.min(popWidth - 16, (swatchRect.left + swatchRect.width / 2) - left));

    setPopoverPos({ top, left, arrowX });
    setIsPopoverOpen(true);
  };

  const openPopoverForSelectedElement = () => {
    if (!selectedEl || !selectionBox || !viewportRef.current) return;
    const fill = selectedEl.getAttribute('fill') || (selectedEl as HTMLElement).style.fill || '#3B82F6';
    setPopoverMode('element');
    setActiveOldHex(fill.toUpperCase());
    setCurrentHex(fill.toUpperCase());

    const hsv = hexToHsv(fill);
    setH(hsv.h);
    setS(hsv.s);
    setV(hsv.v);

    const vpRect = viewportRef.current.getBoundingClientRect();
    const popWidth = 240;
    const popHeight = 260;

    const elScreenLeft = vpRect.left + selectionBox.left * zoom;
    const elScreenTop = vpRect.top + selectionBox.top * zoom;

    let top = elScreenTop - popHeight - 48;
    if (top < 10) top = elScreenTop + selectionBox.height * zoom + 12;
    let left = elScreenLeft + (selectionBox.width * zoom) / 2 - popWidth / 2;
    if (left < 16) left = 16;
    if (left + popWidth > window.innerWidth - 16) {
      left = window.innerWidth - popWidth - 16;
    }
    const arrowX = popWidth / 2;

    setPopoverPos({ top, left, arrowX });
    setIsPopoverOpen(true);
  };

  // Direct 60 FPS live DOM recolor
  const applyLiveColorToDom = (newHex: string) => {
    setCurrentHex(newHex);
    if (popoverMode === 'element' && selectedEl) {
      selectedEl.setAttribute('fill', newHex);
      (selectedEl as HTMLElement).style.fill = newHex;
      return;
    }

    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    const normOld = activeOldHex.toUpperCase();
    const normNew = newHex.toUpperCase();

    const allNodes = svg.querySelectorAll('*');
    for (let i = 0; i < allNodes.length; i++) {
      const node = allNodes[i] as HTMLElement;
      const fill = node.getAttribute('fill');
      if (fill && fill.toUpperCase() === normOld) {
        node.setAttribute('fill', normNew);
      }
      const stroke = node.getAttribute('stroke');
      if (stroke && stroke.toUpperCase() === normOld) {
        node.setAttribute('stroke', normNew);
      }
      if (node.style && node.style.fill && node.style.fill.toUpperCase() === normOld) {
        node.style.fill = normNew;
      }
      if (node.style && node.style.stroke && node.style.stroke.toUpperCase() === normOld) {
        node.style.stroke = normNew;
      }
    }

    if (activeSwatchEl) {
      activeSwatchEl.style.backgroundColor = normNew;
    }
  };

  const commitActiveColor = () => {
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;
    const updatedSvg = svg.outerHTML;
    if (updatedSvg !== svgContent) {
      pushUndo(svgContent);
      setSvgContent(updatedSvg);
      setPalette(extractPaletteFromSvg(updatedSvg));
      setActiveOldHex(currentHex);
    }
  };

  // 2D Saturation / Brightness Box Drag Handler
  const handleSbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const updateFromMouse = (moveEvent: MouseEvent) => {
      if (!sbSquareRef.current) return;
      const rect = sbSquareRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, moveEvent.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, moveEvent.clientY - rect.top));
      const newS = x / rect.width;
      const newV = 1 - (y / rect.height);
      setS(newS);
      setV(newV);
      const [r, g, b] = hsvToRgb(h / 360, newS, newV);
      const newHex = rgbToHex(r, g, b);
      applyLiveColorToDom(newHex);
    };
    updateFromMouse(e.nativeEvent);

    const onMouseMove = (moveEvent: MouseEvent) => updateFromMouse(moveEvent);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      commitActiveColor();
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Hue Slider Drag Handler
  const handleHueMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const updateFromMouse = (moveEvent: MouseEvent) => {
      if (!hueSliderRef.current) return;
      const rect = hueSliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, moveEvent.clientX - rect.left));
      const newH = (x / rect.width) * 360;
      setH(newH);
      const [r, g, b] = hsvToRgb(newH / 360, s, v);
      const newHex = rgbToHex(r, g, b);
      applyLiveColorToDom(newHex);
    };
    updateFromMouse(e.nativeEvent);

    const onMouseMove = (moveEvent: MouseEvent) => updateFromMouse(moveEvent);
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      commitActiveColor();
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Eyedropper API
  const handleEyedropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const res = await eyeDropper.open();
        if (res?.sRGBHex) {
          const picked = res.sRGBHex.toUpperCase();
          const hsv = hexToHsv(picked);
          setH(hsv.h);
          setS(hsv.s);
          setV(hsv.v);
          applyLiveColorToDom(picked);
          commitActiveColor();
        }
      } catch (_) {}
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PART 3: SUB-ELEMENT HOVER, CLICK SELECTION & DRAG-TO-MOVE
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    svg.style.maxWidth = '100%';
    svg.style.maxHeight = '65vh';
    svg.style.width = 'auto';
    svg.style.height = 'auto';
    svg.style.display = 'block';

    const visualElements = svg.querySelectorAll('path, polygon, rect, circle, ellipse, line, polyline');

    const onMouseEnter = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      if (target !== selectedEl) {
        target.style.outline = '1.5px solid #3B82F6';
        target.style.outlineOffset = '1px';
        target.style.cursor = 'pointer';
      }
    };

    const onMouseLeave = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      if (target !== selectedEl) {
        target.style.outline = '';
        target.style.outlineOffset = '';
      }
    };

    const onClick = (e: Event) => {
      e.stopPropagation();
      const target = e.currentTarget as SVGElement;
      if (selectedEl && selectedEl !== target) {
        (selectedEl as HTMLElement).style.outline = '';
      }
      setSelectedEl(target);
      (target as HTMLElement).style.outline = '1.5px solid #3B82F6';
    };

    visualElements.forEach(el => {
      el.addEventListener('mouseenter', onMouseEnter);
      el.addEventListener('mouseleave', onMouseLeave);
      el.addEventListener('click', onClick);
    });

    return () => {
      visualElements.forEach(el => {
        el.removeEventListener('mouseenter', onMouseEnter);
        el.removeEventListener('mouseleave', onMouseLeave);
        el.removeEventListener('click', onClick);
      });
    };
  }, [svgContent, selectedEl]);

  // Dragging the selected element to move
  const handleDragElementMouseDown = (e: React.MouseEvent) => {
    if (!selectedEl || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const startClientX = e.clientX;
    const startClientY = e.clientY;

    // Parse existing transform="translate(x, y)"
    let curX = 0;
    let curY = 0;
    const curTransform = selectedEl.getAttribute('transform') || '';
    const matchTranslate = /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/.exec(curTransform);
    if (matchTranslate) {
      curX = parseFloat(matchTranslate[1]) || 0;
      curY = parseFloat(matchTranslate[2]) || 0;
    }

    const onMouseMove = (moveEv: MouseEvent) => {
      const dx = (moveEv.clientX - startClientX) / zoom;
      const dy = (moveEv.clientY - startClientY) / zoom;
      const newX = curX + dx;
      const newY = curY + dy;

      let newTransform = curTransform.replace(/translate\([^)]*\)/, '').trim();
      newTransform = `translate(${newX.toFixed(2)}, ${newY.toFixed(2)}) ${newTransform}`.trim();
      selectedEl.setAttribute('transform', newTransform);
      updateSelectionBoundingBox();
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      commitActiveColor();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Corner handle scaling
  const handleScaleCornerMouseDown = (e: React.MouseEvent, corner: 'tl' | 'tr' | 'bl' | 'br') => {
    if (!selectedEl) return;
    e.stopPropagation();
    e.preventDefault();

    const startClientX = e.clientX;
    const startScale = 1.0;
    const curTransform = selectedEl.getAttribute('transform') || '';
    const matchScale = /scale\(\s*([-\d.]+)\s*\)/.exec(curTransform);
    const baseScale = matchScale ? parseFloat(matchScale[1]) || 1.0 : startScale;

    const onMouseMove = (moveEv: MouseEvent) => {
      const deltaX = (moveEv.clientX - startClientX) / zoom;
      const factor = corner.includes('r') ? 1 : -1;
      const newScale = Math.max(0.2, baseScale + (deltaX * factor * 0.005));

      let newTransform = curTransform.replace(/scale\([^)]*\)/, '').trim();
      newTransform = `${newTransform} scale(${newScale.toFixed(2)})`.trim();
      selectedEl.setAttribute('transform', newTransform);
      updateSelectionBoundingBox();
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      commitActiveColor();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Bring to Front / Send to Back
  const handleArrangeLayer = (action: 'front' | 'back') => {
    if (!selectedEl || !selectedEl.parentNode) return;
    pushUndo(svgContent);
    if (action === 'front') {
      selectedEl.parentNode.appendChild(selectedEl);
      showToast('Moved element to front');
    } else {
      selectedEl.parentNode.insertBefore(selectedEl, selectedEl.parentNode.firstChild);
      showToast('Moved element to back');
    }
    commitActiveColor();
  };

  // Isolated Download
  const handleDownloadIsolatedElement = () => {
    if (!selectedEl) return;
    try {
      const bbox = (selectedEl as any).getBBox();
      const pad = 12;
      const minX = (bbox.x || 0) - pad;
      const minY = (bbox.y || 0) - pad;
      const width = (bbox.width || 100) + pad * 2;
      const height = (bbox.height || 100) + pad * 2;

      const cloned = selectedEl.cloneNode(true) as SVGElement;
      cloned.removeAttribute('style');

      const isolatedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">
  ${cloned.outerHTML}
</svg>`;

      const blob = new Blob([isolatedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `isolated-vector-element-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Downloaded isolated element as SVG (.svg)');
    } catch (_) {
      showToast('Could not extract isolated vector path');
    }
  };

  // Delete element
  const handleDeleteElement = () => {
    if (!selectedEl) return;
    pushUndo(svgContent);
    selectedEl.remove();
    setSelectedEl(null);
    setSelectionBox(null);
    setIsPopoverOpen(false);
    commitActiveColor();
    showToast('Deleted selected vector element');
  };

  // Shuffle designer themes
  const handleShuffleTheme = () => {
    const nextIdx = (designerPaletteIdx + 1) % DESIGNER_PALETTES.length;
    setDesignerPaletteIdx(nextIdx);
    const theme = DESIGNER_PALETTES[nextIdx];

    pushUndo(svgContent);
    let workingSvg = svgContent;
    const newPal: string[] = [];

    palette.forEach((oldColor, i) => {
      const rep = theme[i % theme.length];
      newPal.push(rep);
      const re = new RegExp(oldColor, 'gi');
      workingSvg = workingSvg.replace(re, rep);
    });

    setSvgContent(workingSvg);
    setPalette(newPal);
    showToast('Shuffled to harmonious designer theme (⇄)');
  };

  // Download entire SVG
  const handleDownloadFullSvg = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vector-studio-artwork-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded SVG file (.svg)');
  };

  // Save changes
  const handleSave = () => {
    commitActiveColor();
    const updated: ImageAsset = {
      ...asset,
      url: `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`,
      ...( { svg: svgContent, svgCode: svgContent, palette } as any )
    };
    onSave?.(updated);
    showToast('Vector Studio artwork and palette changes saved!');
  };

  return (
    <div
      className="absolute inset-0 z-40 bg-white dark:bg-[#191919] flex flex-col overflow-hidden select-none"
      onClick={() => {
        setIsPopoverOpen(false);
        if (selectedEl) {
          (selectedEl as HTMLElement).style.outline = '';
          setSelectedEl(null);
          setSelectionBox(null);
        }
      }}
    >
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-2xl backdrop-blur-md animate-in fade-in duration-200">
          {toastMessage}
        </div>
      )}

      {/* Top Bar */}
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-slate-100 dark:border-white/10 shrink-0 bg-white dark:bg-[#191919]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Vector Studio"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Vector Studio</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
              Interactive Canvas
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo Button */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
            <span className="hidden sm:inline">Undo</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer"
            title="Save changes"
          >
            <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            <span className="hidden sm:inline">Save</span>
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownloadFullSvg}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 active:scale-95 text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download SVG</span>
          </button>
        </div>
      </div>

      {/* Center Canvas Area */}
      <div className={`flex-1 w-full min-h-0 relative overflow-hidden flex items-center justify-center p-4 sm:p-8 bg-slate-50/70 dark:bg-[#121212] ${isHoverIsolating ? 'vector-canvas-dotted-grid' : 'transparent-checkerboard-bg'}`}>
        <div
          ref={viewportRef}
          id="vector-canvas-viewport"
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-100 ease-out origin-center"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* Live Injected SVG Container */}
          <div
            ref={containerRef}
            id="vector-svg-container"
            className="max-w-[85vw] max-h-[65vh] flex items-center justify-center drop-shadow-xl select-none"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />

          {/* PART 3: Active Selection Bounding Box & Floating Action Toolbar */}
          {selectionBox && selectedEl && (
            <div
              id="vector-element-selection-box"
              className="absolute z-30 pointer-events-auto border-1.5 border-blue-500"
              style={{
                left: `${selectionBox.left}px`,
                top: `${selectionBox.top}px`,
                width: `${selectionBox.width}px`,
                height: `${selectionBox.height}px`,
                cursor: 'move'
              }}
              onMouseDown={handleDragElementMouseDown}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 4 Corner Scaling Brackets */}
              <div
                className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-blue-500 bg-white dark:bg-neutral-900 cursor-nwse-resize"
                onMouseDown={(e) => handleScaleCornerMouseDown(e, 'tl')}
              />
              <div
                className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-blue-500 bg-white dark:bg-neutral-900 cursor-nesw-resize"
                onMouseDown={(e) => handleScaleCornerMouseDown(e, 'tr')}
              />
              <div
                className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-blue-500 bg-white dark:bg-neutral-900 cursor-nesw-resize"
                onMouseDown={(e) => handleScaleCornerMouseDown(e, 'bl')}
              />
              <div
                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-blue-500 bg-white dark:bg-neutral-900 cursor-nwse-resize"
                onMouseDown={(e) => handleScaleCornerMouseDown(e, 'br')}
              />

              {/* Floating Action Bar Centered Directly Above Bounding Box */}
              <div
                className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white dark:bg-[#1a1f29] border border-slate-200 dark:border-white/10 shadow-2xl text-xs select-none"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Element Color Swatch Dot */}
                <button
                  type="button"
                  onClick={openPopoverForSelectedElement}
                  className="w-4 h-4 rounded-full border border-black/15 shadow-2xs hover:scale-110 active:scale-95 transition-transform"
                  style={{
                    backgroundColor: selectedEl.getAttribute('fill') || (selectedEl as HTMLElement).style.fill || '#3B82F6'
                  }}
                  title="Change this element color"
                />

                <div className="w-px h-3.5 bg-slate-200 dark:bg-white/10 mx-0.5" />

                {/* Layer Arrangement Button (☰) */}
                <button
                  type="button"
                  onClick={() => handleArrangeLayer('front')}
                  className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  title="Bring to Front (☰)"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" x2="20" y1="12" y2="12" />
                    <line x1="4" x2="20" y1="6" y2="6" />
                    <line x1="4" x2="20" y1="18" y2="18" />
                  </svg>
                </button>

                <div className="w-px h-3.5 bg-slate-200 dark:bg-white/10 mx-0.5" />

                {/* Isolated Download Button (⤓) */}
                <button
                  type="button"
                  onClick={handleDownloadIsolatedElement}
                  className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  title="Download isolated element as SVG (⤓)"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </button>

                <div className="w-px h-3.5 bg-slate-200 dark:bg-white/10 mx-0.5" />

                {/* Delete Button (🗑) */}
                <button
                  type="button"
                  onClick={handleDeleteElement}
                  className="p-1 rounded text-slate-600 dark:text-slate-300 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  title="Delete element (🗑)"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Zoom Controls (- 100% +) */}
        <div className="absolute bottom-6 right-6 z-30 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/90 dark:bg-[#1e232d]/90 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-lg text-xs font-mono text-slate-700 dark:text-slate-200">
          <button
            type="button"
            onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
            className="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition cursor-pointer font-bold"
            title="Zoom out"
          >
            -
          </button>
          <span className="px-2 text-[11px] font-semibold select-none min-w-[42px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom(z => Math.min(3.0, z + 0.25))}
            className="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition cursor-pointer font-bold"
            title="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom(1.0)}
            className="ml-1 px-1.5 py-0.5 rounded text-[10px] uppercase font-sans text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            title="Reset zoom"
          >
            Reset
          </button>
        </div>

        {/* Floating Bottom Color Swatches Bar */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#1e232d]/95 backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200 dark:border-white/10 text-xs font-medium text-slate-500 dark:text-slate-400">
            <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
              <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
              <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
              <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
            </svg>
            <span className="hidden sm:inline">Palette</span>
          </div>

          {/* Swatches List */}
          <div className="flex items-center gap-2 max-w-[260px] sm:max-w-[420px] overflow-x-auto ideogram-custom-scroll px-1 py-0.5">
            {palette.map((hexColor, idx) => (
              <button
                key={`${hexColor}_${idx}`}
                type="button"
                className="w-6 h-6 rounded-full border-2 border-white dark:border-neutral-800 shadow-xs cursor-pointer hover:scale-115 active:scale-95 transition-all ring-1 ring-black/10 shrink-0"
                style={{ backgroundColor: hexColor }}
                title={`Color: ${hexColor} (Click to edit)`}
                onClick={(e) => {
                  e.stopPropagation();
                  openPopoverForSwatch(e.currentTarget, hexColor);
                }}
                onMouseEnter={() => handleSwatchMouseEnter(hexColor)}
                onMouseLeave={handleSwatchMouseLeave}
              />
            ))}
          </div>

          {/* Vertical Separator (|) */}
          <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-0.5" />

          {/* Shuffle Button (⇄) */}
          <button
            type="button"
            onClick={handleShuffleTheme}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Shuffle theme palette (⇄)"
          >
            <svg className="w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m16 3 4 4-4 4" />
              <path d="M20 7H4" />
              <path d="m8 21-4-4 4-4" />
              <path d="M4 17h16" />
            </svg>
          </button>
        </div>

        {/* PART 1: SMART SINGLE-CARD COLOR PICKER POPOVER */}
        {isPopoverOpen && (
          <div
            ref={popoverRef}
            id="vector-color-popover"
            className="fixed z-50 w-60 rounded-2xl bg-white dark:bg-[#1a1f29] border border-slate-200/90 dark:border-white/10 shadow-2xl p-3 select-none"
            style={{
              top: `${popoverPos.top}px`,
              left: `${popoverPos.left}px`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. Top: 2D Saturation / Brightness Square Canvas with Draggable Pointer */}
            <div
              ref={sbSquareRef}
              className="relative w-full h-28 rounded-xl overflow-hidden cursor-crosshair mb-2.5 shadow-inner"
              style={{
                backgroundColor: `hsl(${h}, 100%, 50%)`,
                backgroundImage: 'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)'
              }}
              onMouseDown={handleSbMouseDown}
            >
              <div
                className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none ring-1 ring-black/40"
                style={{
                  left: `${s * 100}%`,
                  top: `${(1 - v) * 100}%`,
                  backgroundColor: currentHex
                }}
              />
            </div>

            {/* 2. Middle: Horizontal Hue Rainbow Slider + Eyedropper + Current Color Preview */}
            <div className="flex items-center gap-2 mb-2.5">
              <div
                ref={hueSliderRef}
                className="relative flex-1 h-3 rounded-full cursor-pointer shadow-inner"
                style={{
                  background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)'
                }}
                onMouseDown={handleHueMouseDown}
              >
                <div
                  className="absolute top-1/2 w-3.5 h-3.5 rounded-full bg-white border border-slate-300 shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `${(h / 360) * 100}%` }}
                />
              </div>

              {/* Eyedropper */}
              {'EyeDropper' in window && (
                <button
                  type="button"
                  onClick={handleEyedropper}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                  title="Sample color from screen"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m2 22 1-1h3l9-9" />
                    <path d="M19 11l-7-7" />
                    <path d="m15 3 6 6" />
                  </svg>
                </button>
              )}

              {/* Current Color Circle Preview */}
              <div
                className="w-5 h-5 rounded-full border border-black/15 shadow-2xs shrink-0"
                style={{ backgroundColor: currentHex }}
                title={`Current: ${currentHex}`}
              />
            </div>

            {/* 3. Bottom: Compact Hex Input Row (Hex ▾ #XXXXXX) */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0 select-none">
                <span>Hex</span>
                <svg className="w-2.5 h-2.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              <div className="w-px h-3.5 bg-slate-200 dark:bg-white/10" />
              <div className="flex items-center gap-1 flex-1 min-w-0 font-mono text-xs text-slate-800 dark:text-slate-100">
                <span className="text-slate-400">#</span>
                <input
                  type="text"
                  maxLength={6}
                  value={currentHex.replace('#', '')}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
                    if (raw.length === 6) {
                      const newHex = '#' + raw;
                      const hsv = hexToHsv(newHex);
                      setH(hsv.h);
                      setS(hsv.s);
                      setV(hsv.v);
                      applyLiveColorToDom(newHex);
                      commitActiveColor();
                    }
                  }}
                  className="w-full bg-transparent focus:outline-none uppercase font-semibold text-xs tracking-wider"
                  placeholder="FFFFFF"
                />
              </div>
            </div>

            {/* Downward Pointer Arrow */}
            <div
              className="absolute -bottom-1.5 w-3 h-3 bg-white dark:bg-[#1a1f29] border-r border-b border-slate-200/90 dark:border-white/10 rotate-45 pointer-events-none -translate-x-1/2"
              style={{ left: `${popoverPos.arrowX}px` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default VectorStudioCanvas;

