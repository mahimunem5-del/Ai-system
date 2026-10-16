import React, { useState, useMemo } from 'react';
import { AIModel, MODELS } from '../config/models';

export interface ComparePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModelIds: string[];
  onToggleModel: (modelId: string) => void;
  onResetModels?: () => void;
  maxModels?: number;
}

// Brand SVG Icon Helper with strict mapping
export const renderModelBrandIcon = (provider: string, iconName?: string, className: string = 'w-4 h-4') => {
  const p = (iconName || provider || '').toLowerCase();

  // 1. Claude / Anthropic terracotta asterisk logo (strictly isolated from zap)
  if (p.includes('claude') || p.includes('anthropic') || p.includes('haiku') || p.includes('sonnet') || p.includes('opus')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#CC785C">
        <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" />
      </svg>
    );
  }

  // 2. Mahi Engine platform: electric amber bolt accent (STRICTLY Mahi Engine Standard)
  if (p === 'mahi' || p === 'zap' || p === 'mahi-engine' || (p === 'custom' && (iconName === 'zap' || !iconName || iconName === 'mahi'))) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  }

  // 3. OpenAI rosette
  if (p.includes('openai') || p.includes('gpt') || p.includes('sol')) {
    return (
      <svg className={`${className} text-zinc-900 dark:text-zinc-100`} viewBox="60 60 392 392" fill="currentColor">
        <path fillRule="nonzero" d="M412.037 221.764a90.834 90.834 0 004.648-28.67 90.79 90.79 0 00-12.443-45.87c-16.37-28.496-46.738-46.089-79.605-46.089-6.466 0-12.943.683-19.264 2.04a90.765 90.765 0 00-67.881-30.515h-.576c-.059.002-.149.002-.216.002-39.807 0-75.108 25.686-87.346 63.554-25.626 5.239-47.748 21.31-60.682 44.03a91.873 91.873 0 00-12.407 46.077 91.833 91.833 0 0023.694 61.553 90.802 90.802 0 00-4.649 28.67 90.804 90.804 0 0012.442 45.87c16.369 28.504 46.74 46.087 79.61 46.087a91.81 91.81 0 0019.253-2.04 90.783 90.783 0 0067.887 30.516h.576l.234-.001c39.829 0 75.119-25.686 87.357-63.588 25.626-5.242 47.748-21.312 60.682-44.033a91.718 91.718 0 0012.383-46.035 91.83 91.83 0 00-23.693-61.553l-.004-.005zM275.102 413.161h-.094a68.146 68.146 0 01-43.611-15.8 56.936 56.936 0 002.155-1.221l72.54-41.901a11.799 11.799 0 005.962-10.251V241.651l30.661 17.704c.326.163.55.479.596.84v84.693c-.042 37.653-30.554 68.198-68.21 68.273h.001zm-146.689-62.649a68.128 68.128 0 01-9.152-34.085c0-3.904.341-7.817 1.005-11.663.539.323 1.48.897 2.155 1.285l72.54 41.901a11.832 11.832 0 0011.918-.002l88.563-51.137v35.408a1.1 1.1 0 01-.438.94l-73.33 42.339a68.43 68.43 0 01-34.11 9.12 68.359 68.359 0 01-59.15-34.11l-.001.004zm-19.083-158.36a68.044 68.044 0 0135.538-29.934c0 .625-.036 1.731-.036 2.5v83.801l-.001.07a11.79 11.79 0 005.954 10.242l88.564 51.13-30.661 17.704a1.096 1.096 0 01-1.034.093l-73.337-42.375a68.36 68.36 0 01-34.095-59.143 68.412 68.412 0 019.112-34.085l-.004-.003zm251.907 58.621l-88.563-51.137 30.661-17.697a1.097 1.097 0 011.034-.094l73.337 42.339c21.109 12.195 34.132 34.746 34.132 59.132 0 28.604-17.849 54.199-44.686 64.078v-86.308c.004-.032.004-.065.004-.096 0-4.219-2.261-8.119-5.919-10.217zm30.518-45.93c-.539-.331-1.48-.898-2.155-1.286l-72.54-41.901a11.842 11.842 0 00-5.958-1.611c-2.092 0-4.15.558-5.957 1.611l-88.564 51.137v-35.408l-.001-.061a1.1 1.1 0 01.44-.88l73.33-42.303a68.301 68.301 0 0134.108-9.129c37.704 0 68.281 30.577 68.281 68.281a68.69 68.69 0 01-.984 11.545v.005zm-191.843 63.109l-30.668-17.704a1.09 1.09 0 01-.596-.84v-84.692c.016-37.685 30.593-68.236 68.281-68.236a68.332 68.332 0 0143.689 15.804 63.09 63.09 0 00-2.155 1.222l-72.54 41.9a11.794 11.794 0 00-5.961 10.248v.068l-.05 102.23zm16.655-35.91l39.445-22.782 39.444 22.767v45.55l-39.444 22.767-39.445-22.767v-45.535z" />
      </svg>
    );
  }

  // 4. Google / Gemini soft blue sparkle
  if (p.includes('google') || p.includes('gemini')) {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <path d="M12 2C12 7.5 7.5 12 2 12c5.5 0 10 4.5 10 10 0-5.5 4.5-10 10-10-5.5 0-10-4.5-10-10z" fill="#2563EB" />
      </svg>
    );
  }

  // 5. xAI / Grok slash-orbit logo
  if (p.includes('xai') || p.includes('grok')) {
    return (
      <svg className={`${className} text-zinc-900 dark:text-zinc-100`} viewBox="0 0 512 492" fill="currentColor">
        <path fillRule="evenodd" clipRule="evenodd" d="m197.76 315.52 170.197-125.803c8.342-6.186 20.267-3.776 24.256 5.803 20.907 50.539 11.563 111.253-30.08 152.939-41.621 41.685-99.562 50.816-152.512 29.994l-57.834 26.816c82.965 56.768 183.701 42.731 246.656-20.33 49.941-50.006 65.408-118.166 50.944-179.627l.128.149c-20.971-90.282 5.162-126.378 58.666-200.17 1.28-1.75 2.56-3.499 3.819-5.291l-70.421 70.507v-.214l-243.883 245.27m-35.072 30.528c-59.563-56.96-49.28-145.088 1.515-195.926 37.568-37.61 99.136-52.97 152.874-30.4l57.707-26.666a166.6 166.6 0 0 0-39.019-21.334 191.47 191.47 0 0 0-208.042 41.942c-54.038 54.101-71.04 137.301-41.856 208.298 21.802 53.056-13.931 90.582-49.92 128.47C23.104 463.915 10.304 477.333 0 491.541l162.56-145.386" />
      </svg>
    );
  }

  // 6. DeepSeek whale mark
  if (p.includes('deepseek')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#0066FF">
        <path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" />
      </svg>
    );
  }

  // 7. Moonshot Kimi wavy striped sphere
  if (p.includes('kimi') || p.includes('moonshot')) {
    return (
      <svg className={`${className} text-zinc-900 dark:text-zinc-100`} viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  }

  // 8. Zhipu GLM bold stylized "Z"
  if (p.includes('glm') || p.includes('zhipu')) {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <rect width="22" height="22" x="1" y="1" rx="5" fill="#18181B" />
        <path d="M5.5 6.5h13v2.8l-8.6 7.7h8.6v2.8h-13v-2.8l8.6-7.7h-8.6z" fill="#FFFFFF" />
      </svg>
    );
  }

  // 9. Alibaba Qwen brand mark
  if (p.includes('qwen') || p.includes('alibaba')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#615CED">
        <path d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z" />
      </svg>
    );
  }

  // 10. Nvidia eye logo
  if (p.includes('nvidia') || p.includes('nemotron')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#76B900">
        <path d="M9.74 7.64c.26-.06.52-.09.78-.1 2.37-.1 4.53 1.05 5.8 2.87.87 1.25 1.34 2.76 1.34 4.31 0 .28-.02.56-.05.84l4.21 2.81c.73-1.15 1.18-2.48 1.18-3.92 0-2.47-1.13-4.69-2.9-6.18-1.57-1.32-3.6-2.12-5.83-2.17-.4-.01-.8.02-1.2.07l-3.33 1.48zm-1.89 2.22c.16-.04.32-.06.49-.07l-2.02.9c-.8.88-1.32 2-1.47 3.24h7.97c-.02-.85-.35-1.68-.93-2.31-.69-.76-1.67-1.2-2.73-1.23-.44-.01-.88.08-1.31.27v-.8zM4.85 14.73c.12 1.35.73 2.58 1.67 3.49l2.42-1.07c-.44-.45-.73-1.04-.83-1.69l-3.26-.73zm11.53 1.27c-.89 1.45-2.43 2.45-4.22 2.59-.3.02-.6 0-.89-.04l2.25 2.25c.6.1 1.22.15 1.84.15 3.33 0 6.3-1.74 7.94-4.38l-6.92-.57z" />
      </svg>
    );
  }

  // 11. Mistral pixelated M logo
  if (p.includes('mistral')) {
    return (
      <svg className={className} viewBox="0 0 24 24">
        <defs>
          <linearGradient id="mistral-react-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4500" />
            <stop offset="50%" stopColor="#FF7A00" />
            <stop offset="100%" stopColor="#FFB800" />
          </linearGradient>
        </defs>
        <rect x="2" y="3" width="3.8" height="3.5" rx="0.5" fill="url(#mistral-react-grad)" />
        <rect x="18.2" y="3" width="3.8" height="3.5" rx="0.5" fill="url(#mistral-react-grad)" />
        <rect x="2" y="7.5" width="7.8" height="3.5" rx="0.5" fill="url(#mistral-react-grad)" />
        <rect x="14.2" y="7.5" width="7.8" height="3.5" rx="0.5" fill="url(#mistral-react-grad)" />
        <rect x="2" y="12" width="20" height="3.5" rx="0.5" fill="url(#mistral-react-grad)" />
        <rect x="2" y="16.5" width="3.8" height="3.5" rx="0.5" fill="url(#mistral-react-grad)" />
        <rect x="10.1" y="16.5" width="3.8" height="3.5" rx="0.5" fill="url(#mistral-react-grad)" />
        <rect x="18.2" y="16.5" width="3.8" height="3.5" rx="0.5" fill="url(#mistral-react-grad)" />
      </svg>
    );
  }

  // 12. Meta ribbon
  if (p.includes('meta') || p.includes('llama')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="#0081FB">
        <path d="M16.992 4.004c-1.848 0-3.468.978-4.992 2.766-1.524-1.788-3.144-2.766-4.992-2.766-3.87 0-6.992 3.32-6.992 7.747 0 4.426 3.122 7.746 6.992 7.746 2.378 0 4.22-1.256 5.59-3.21.22-.315.424-.652.612-1.006.188.354.392.691.612 1.006 1.37 1.954 3.212 3.21 5.59 3.21 3.87 0 6.992-3.32 6.992-7.746 0-4.427-3.122-7.747-6.992-7.747zm-9.984 13.064c-2.58 0-4.664-2.383-4.664-5.317 0-2.935 2.084-5.318 4.664-5.318 1.63 0 3.013 1.01 4.188 2.828-1.572 2.836-2.97 7.807-4.188 7.807zm9.984 0c-1.218 0-2.616-4.971-4.188-7.807 1.175-1.818 2.558-2.828 4.188-2.828 2.58 0 4.664 2.383 4.664 5.318 0 2.934-2.084 5.317-4.664 5.317z" />
      </svg>
    );
  }

  // Neutral default fallback
  return (
    <svg className={`${className} text-zinc-500`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="12 6 15 12 12 18 9 12" />
    </svg>
  );
};

export const ComparePickerModal: React.FC<ComparePickerModalProps> = ({
  isOpen,
  onClose,
  selectedModelIds,
  onToggleModel,
  onResetModels,
  maxModels = 4,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Strictly deduplicate selectedModelIds
  const uniqueSelected = useMemo(() => {
    return Array.from(new Set(selectedModelIds));
  }, [selectedModelIds]);

  const filteredModels = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return MODELS;
    return MODELS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white dark:bg-[#1A1A1A] rounded-2xl border border-neutral-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Select Models to Compare
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">
              {uniqueSelected.length} of {maxModels} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onResetModels && (
              <button
                type="button"
                onClick={onResetModels}
                className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-gray-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 shrink-0">
          <div className="relative flex items-center">
            <svg
              className="absolute left-3 w-4 h-4 text-zinc-400 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search models..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500"
            />
          </div>
        </div>

        {/* Model Options List */}
        <div className="p-3 overflow-y-auto space-y-1.5 flex-1">
          {filteredModels.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400 italic">No matching models found</div>
          ) : (
            filteredModels.map((model) => {
              const isChecked = uniqueSelected.includes(model.id);
              const isDisabled = !isChecked && uniqueSelected.length >= maxModels;

              return (
                <div
                  key={model.id}
                  onClick={() => {
                    if (!isDisabled) {
                      onToggleModel(model.id);
                    }
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-zinc-50 dark:bg-zinc-800/80 border-gray-200/90 dark:border-zinc-700'
                      : isDisabled
                      ? 'opacity-40 cursor-not-allowed bg-transparent border-transparent'
                      : 'bg-white dark:bg-[#1A1A1A] border-transparent hover:bg-gray-50/70 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 h-5 shrink-0 flex items-center justify-center">
                      {renderModelBrandIcon(model.provider, model.icon, 'w-4 h-4')}
                    </span>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 leading-tight">
                          {model.name}
                        </span>
                        {model.isLocked && (
                          <span className="text-[10px] text-zinc-400" title="Premium Model">
                            🔒
                          </span>
                        )}
                      </div>
                      {model.description && (
                        <div className="text-[11px] text-zinc-400 truncate mt-0.5">{model.description}</div>
                      )}
                    </div>
                  </div>

                  {/* Checkbox indicator */}
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ml-2 transition-colors ${
                      isChecked
                        ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900'
                        : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800'
                    }`}
                  >
                    {isChecked && (
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/20 flex items-center justify-between text-xs text-zinc-500 shrink-0">
          <span>Minimum 2 models required</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium text-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
export default ComparePickerModal;
