const fs = require('fs');

const tsxPath = 'src/components/ImageWorkspace.tsx';
let tsx = fs.readFileSync(tsxPath, 'utf8');

// 1. Add WorkflowTool type & WORKFLOW_TOOLS_CONFIG near top
const typeTarget = `export interface ImageAsset {
  id: string;
  url: string;
  prompt: string;
  model?: string;
  aspectRatio?: string;
  createdAt?: string | number;
}`;

const typeReplacement = `export interface ImageAsset {
  id: string;
  url: string;
  prompt: string;
  model?: string;
  aspectRatio?: string;
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
];`;

if (!tsx.includes(typeTarget)) {
  console.error('Could not find typeTarget in ImageWorkspace.tsx');
  process.exit(1);
}
tsx = tsx.replace(typeTarget, typeReplacement);
console.log('✓ Added WorkflowTool type and configuration');

// 2. Add workflow state variables in ImageWorkspace component
const stateTarget = `  const [isFocused, setIsFocused] = useState(false);`;

const stateReplacement = `  const [isFocused, setIsFocused] = useState(false);
  const [workflowTool, setWorkflowTool] = useState<WorkflowTool>('generate-image');
  const [isToolSwitcherOpen, setIsToolSwitcherOpen] = useState(false);
  const [toolSearchQuery, setToolSearchQuery] = useState('');
  const [removeBgImage, setRemoveBgImage] = useState<string | null>(null);
  const [upscaleImage, setUpscaleImage] = useState<string | null>(null);
  const [upscaleFactor, setUpscaleFactor] = useState<2 | 4>(2);
  const [img2imgImage, setImg2imgImage] = useState<string | null>(null);
  const [img2imgStrength, setImg2imgStrength] = useState<number>(0.65);
  const [img2imgPrompt, setImg2imgPrompt] = useState<string>('');
  const [isProcessingWorkflow, setIsProcessingWorkflow] = useState<boolean>(false);
  const toolSwitcherRef = useRef<HTMLDivElement>(null);`;

if (!tsx.includes(stateTarget)) {
  console.error('Could not find stateTarget in ImageWorkspace.tsx');
  process.exit(1);
}
tsx = tsx.replace(stateTarget, stateReplacement);
console.log('✓ Added workflow state variables');

// 3. Add click outside handler for tool switcher
const outsideClickTarget = `  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (homeRatioRef.current && !homeRatioRef.current.contains(event.target as Node)) {
        setIsHomeRatioOpen(false);
      }
      if (homeModelRef.current && !homeModelRef.current.contains(event.target as Node)) {
        setIsHomeModelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);`;

const outsideClickReplacement = `  useEffect(() => {
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
  }, []);`;

if (!tsx.includes(outsideClickTarget)) {
  console.error('Could not find outsideClickTarget in ImageWorkspace.tsx');
  process.exit(1);
}
tsx = tsx.replace(outsideClickTarget, outsideClickReplacement);
console.log('✓ Added tool switcher outside click listener');

// 4. Update handleGenerateSubmit to prepend vector prompt constraint
const genSubmitTarget = `  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onGenerate?.({
      prompt: prompt.trim(),
      model: selectedModel,
      aspectRatio,
      count: variationsCount
    });
  };`;

const genSubmitReplacement = `  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    let finalPrompt = prompt.trim();
    if (workflowTool === 'vector-illustration') {
      const vectorPrefix = 'flat 2D vector graphic, clean sharp SVG lines, minimal gradients, isolated subject, sticker-cut vector art, professional graphic design illustration, ';
      if (!finalPrompt.toLowerCase().includes('vector graphic') && !finalPrompt.toLowerCase().includes('flat 2d vector')) {
        finalPrompt = vectorPrefix + finalPrompt;
      }
    }
    onGenerate?.({
      prompt: finalPrompt,
      model: selectedModel,
      aspectRatio,
      count: variationsCount
    });
  };`;

if (!tsx.includes(genSubmitTarget)) {
  console.error('Could not find genSubmitTarget in ImageWorkspace.tsx');
  process.exit(1);
}
tsx = tsx.replace(genSubmitTarget, genSubmitReplacement);
console.log('✓ Updated handleGenerateSubmit with vector constraints');

fs.writeFileSync(tsxPath, tsx, 'utf8');
console.log('Saved preliminary updates to ImageWorkspace.tsx');
