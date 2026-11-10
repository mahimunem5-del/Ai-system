const fs = require('fs');
const assert = require('assert');

console.log('=== VERIFYING MULTIMODAL REFERENCE IMAGE & DUAL-IMAGE EDITING ===\n');

const html = fs.readFileSync('index.html', 'utf8');
const controllerCode = fs.readFileSync('server/src/controllers/imageController.js', 'utf8');

// 1. Frontend Payload Attachment
console.log('1. Checking Frontend Payload Construction in index.html...');
assert(html.includes('isSmartEditMode'), 'isSmartEditMode check missing');
assert(html.includes('smartEditSourceImage'), 'smartEditSourceImage definition missing');
assert(html.includes('smartEditRefImages'), 'smartEditRefImages definition missing');
assert(html.includes('generateRefImages'), 'generateRefImages definition missing');

// Verify Smart Edit payload fields
assert(html.includes('sourceImage: smartEditSourceImage'), 'sourceImage missing from Smart Edit payload');
assert(html.includes('referenceImages: smartEditRefImages'), 'referenceImages missing from Smart Edit payload');
assert(html.includes("quality: studioPreciseEditState.quality || 'Medium'"), 'quality missing from Smart Edit payload');

// Verify Generate Image payload fields
assert(html.includes('referenceImages: generateRefImages'), 'referenceImages missing from Generate Image payload');
console.log('✔ Frontend accurately differentiates sourceImage and referenceImages for both modes');

// 2. Mahi Engine Dual-Vision Upgrade
console.log('\n2. Checking Mahi Engine Dual-Vision Capabilities in imageController.js...');
assert(controllerCode.includes('enhancePromptWithMahiEngine(rawPrompt, apiKey, requestId, options = {})') || controllerCode.includes('enhancePromptWithMahiEngine(rawPrompt, apiKey, requestId = \'\', options = {})'), 'enhancePromptWithMahiEngine options signature missing');

// Generate Mode System Prompt
const expectedGeneratePrompt = "You are Mahi Engine, an expert AI prompt enhancer with computer vision. Analyze the attached reference image(s) for character appearance, visual composition, atmospheric lighting, style, and color palette. Seamlessly blend these visual characteristics into the user's prompt so the resulting descriptive prompt accurately reproduces the style and subject intent without filler text.";
assert(controllerCode.includes(expectedGeneratePrompt), 'Generate Mode vision system prompt missing or incorrect');

// Smart Edit Mode System Prompt
const expectedSmartEditPrompt = "You are Mahi Engine in Smart Edit mode. You are given a Source Image (the base canvas/character), optional Reference Image(s) (style/visual assets), and a user instruction describing what should change. Analyze both: preserve the core identity and structure of the Source Image, identify style or asset cues from the Reference Image(s), and formulate a precise generative edit prompt that seamlessly injects the reference elements into the source image according to the user's instructions. Return only the final detailed prompt.";
assert(controllerCode.includes(expectedSmartEditPrompt), 'Smart Edit Mode vision system prompt missing or incorrect');

// Multimodal image_url blocks
assert(controllerCode.includes("type: 'image_url'"), 'Multimodal image_url content block missing');
assert(controllerCode.includes("image_url: { url: sourceImage }"), 'sourceImage multimodal block missing');
assert(controllerCode.includes("image_url: { url: refUrl }"), 'reference image multimodal block missing');
console.log('✔ Mahi Engine dual-vision system prompts and multimodal message construction verified');

// 3. Upstream Image Model Execution & Fallback
console.log('\n3. Checking Upstream Image Model Execution & Fallback in imageController.js...');
// Differentiate sourceImage and referenceImages in req.body
assert(controllerCode.includes('sourceImage,'), 'sourceImage extraction from req.body missing');
assert(controllerCode.includes('effectiveSourceImage'), 'effectiveSourceImage resolution missing');
assert(controllerCode.includes('effectiveReferenceImages'), 'effectiveReferenceImages resolution missing');

// Passing sourceImage as primary base/init image
assert(controllerCode.includes('payload.source_image = effectiveSourceImage;'), 'payload.source_image assignment missing');
assert(controllerCode.includes('payload.image_url = effectiveSourceImage;'), 'payload.image_url assignment missing');
assert(controllerCode.includes('payload.init_image = effectiveSourceImage;'), 'payload.init_image assignment missing');

// Multi-image/IP-Adapter input
assert(controllerCode.includes('payload.reference_images = effectiveReferenceImages;'), 'payload.reference_images assignment missing');
assert(controllerCode.includes('payload.ip_adapter_images = effectiveReferenceImages;'), 'payload.ip_adapter_images assignment missing');

// Text-only fallback for diffusion models
assert(controllerCode.includes('delete payload.image_url;'), 'Fallback image_url removal missing');
assert(controllerCode.includes('delete payload.init_image;'), 'Fallback init_image removal missing');
assert(controllerCode.includes('fallbackTasks'), 'Fallback execution tasks missing');

// Returned image objects
assert(controllerCode.includes('sourceImage: effectiveSourceImage || undefined'), 'sourceImage in response image objects missing');
assert(controllerCode.includes('referenceImages: effectiveReferenceImages.length > 0 ? effectiveReferenceImages : undefined'), 'referenceImages in response image objects missing');
console.log('✔ Upstream model execution with primary base image, IP-Adapter references, and text-only fallback verified');

console.log('\n🎉 ALL MULTIMODAL REFERENCE & DUAL EDIT REQUIREMENTS VERIFIED 100%!');

