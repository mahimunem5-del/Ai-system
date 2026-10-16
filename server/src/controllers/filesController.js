import logger from '../utils/logger.js';

/**
 * Universal Server-Side File Extractor
 * Extracts plain text from PDF, DOCX, XLSX, CSV, Code, and Data files.
 */

async function parsePdfBuffer(buffer) {
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text || '';
  } catch (err) {
    logger.warn('PDFParse failed, attempting fallback text extraction', { error: err.message });
    const raw = buffer.toString('binary');
    const textMatches = [];
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match;
    while ((match = streamRegex.exec(raw)) !== null) {
      const chunk = match[1];
      const cleaned = chunk.replace(/[^\x20-\x7E\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleaned.length > 20) {
        textMatches.push(cleaned);
      }
    }
    if (textMatches.length > 0) {
      return textMatches.join('\n\n');
    }
    throw new Error(`Failed to parse PDF document: ${err.message}`);
  }
}

async function parseDocxBuffer(buffer) {
  try {
    const mammothModule = await import('mammoth');
    const mammoth = mammothModule.default || mammothModule;
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (err) {
    logger.warn('Mammoth docx extraction error', { error: err.message });
    throw new Error(`Failed to extract Word document content: ${err.message}`);
  }
}

async function parseExcelBuffer(buffer, fileName = '') {
  try {
    const xlsxModule = await import('xlsx');
    const XLSX = (xlsxModule && xlsxModule.read) ? xlsxModule : (xlsxModule.default || xlsxModule);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let fullText = '';
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      if (csv && csv.trim()) {
        fullText += `[Sheet: ${sheetName}]\n${csv.trim()}\n\n`;
      }
    });
    return fullText.trim();
  } catch (err) {
    logger.warn('XLSX spreadsheet extraction error', { error: err.message });
    throw new Error(`Failed to parse Excel spreadsheet: ${err.message}`);
  }
}

/**
 * Extracts raw text from a single file payload
 */
export async function extractSingleFile({ fileData, fileName = 'file.txt', fileType = '' }) {
  if (!fileData) {
    throw new Error('No fileData provided');
  }

  let buffer;
  if (typeof fileData === 'string' && fileData.startsWith('data:') && fileData.includes(';base64,')) {
    const base64 = fileData.split(';base64,')[1];
    buffer = Buffer.from(base64, 'base64');
  } else if (typeof fileData === 'string' && /^[A-Za-z0-9+/=]+$/.test(fileData.trim()) && fileData.length > 30) {
    buffer = Buffer.from(fileData.trim(), 'base64');
  } else if (typeof fileData === 'string') {
    buffer = Buffer.from(fileData, 'utf-8');
  } else if (Buffer.isBuffer(fileData)) {
    buffer = fileData;
  } else {
    throw new Error('Invalid fileData format');
  }

  const ext = (fileName.split('.').pop() || '').toLowerCase();
  let extractedText = '';

  if (ext === 'pdf' || fileType === 'application/pdf') {
    extractedText = await parsePdfBuffer(buffer);
  } else if (ext === 'docx' || ext === 'doc' || fileType.includes('word')) {
    extractedText = await parseDocxBuffer(buffer);
  } else if (ext === 'xlsx' || ext === 'xls' || fileType.includes('spreadsheet') || fileType.includes('excel')) {
    extractedText = await parseExcelBuffer(buffer, fileName);
  } else {
    // Plain text, code, CSV, JSON, Markdown, YAML, XML, etc.
    extractedText = buffer.toString('utf-8');
  }

  return {
    fileName,
    fileType: fileType || ext,
    extractedText: extractedText || ''
  };
}

/**
 * Controller endpoint: POST /api/files/extract
 */
export async function extractFileContent(req, res, next) {
  try {
    const { fileData, fileName, fileType, files } = req.body || {};

    if (Array.isArray(files) && files.length > 0) {
      const results = [];
      for (const f of files) {
        try {
          const extracted = await extractSingleFile(f);
          results.push({ success: true, ...extracted });
        } catch (err) {
          results.push({
            success: false,
            fileName: f.fileName || 'unknown',
            error: err.message
          });
        }
      }
      return res.json({ success: true, files: results });
    }

    if (!fileData) {
      return res.status(400).json({ success: false, error: 'Missing fileData field in request body' });
    }

    const result = await extractSingleFile({ fileData, fileName, fileType });
    return res.json({
      success: true,
      fileName: result.fileName,
      fileType: result.fileType,
      extractedContent: result.extractedText,
      text: result.extractedText
    });
  } catch (err) {
    logger.error('Error in extractFileContent endpoint', { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}

export default {
  extractFileContent,
  extractSingleFile
};
