// controllers/documentComparisonController.js
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import mammoth from 'mammoth';

// ---------------------------------------------
// 1) Polyfills MUST exist before loading pdfjs
// ---------------------------------------------
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor(init) {
      this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
      this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
      this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
      this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
      if (init) {
        if (typeof init === 'string') {
          const values = init.match(/-?[\d.]+/g);
          if (values && values.length >= 6) {
            this.m11 = parseFloat(values[0]); this.m12 = parseFloat(values[1]);
            this.m21 = parseFloat(values[2]); this.m22 = parseFloat(values[3]);
            this.m41 = parseFloat(values[4]); this.m42 = parseFloat(values[5]);
          }
        } else if (Array.isArray(init)) {
          if (init.length >= 6) {
            this.m11 = init[0]; this.m12 = init[1];
            this.m21 = init[2]; this.m22 = init[3];
            this.m41 = init[4]; this.m42 = init[5];
          }
        }
      }
    }
    static fromMatrix(other) { return new DOMMatrix(other); }
    static fromFloat32Array(a) { return new DOMMatrix(a); }
    static fromFloat64Array(a) { return new DOMMatrix(a); }
    translate(tx, ty) { return new DOMMatrix([this.m11, this.m12, this.m21, this.m22, this.m41 + tx, this.m42 + ty]); }
    scale(sx, sy) { return new DOMMatrix([this.m11 * sx, this.m12 * sy, this.m21 * sx, this.m22 * sy, this.m41, this.m42]); }
    rotate(angle) {
      const c = Math.cos(angle); const s = Math.sin(angle);
      return new DOMMatrix([this.m11 * c - this.m12 * s, this.m11 * s + this.m12 * c, this.m21 * c - this.m22 * s, this.m21 * s + this.m22 * c, this.m41, this.m42]);
    }
    rotateFromVector(x, y) { return this.rotate(Math.atan2(y, x)); }
    flipX() { return new DOMMatrix([-this.m11, -this.m12, this.m21, this.m22, this.m41, this.m42]); }
    flipY() { return new DOMMatrix([this.m11, this.m12, -this.m21, -this.m22, this.m41, this.m42]); }
    skewX(sx) { return new DOMMatrix([this.m11, this.m12, this.m21 + this.m11 * sx, this.m22 + this.m12 * sx, this.m41, this.m42]); }
    skewY(sy) { return new DOMMatrix([this.m11 + this.m21 * sy, this.m12 + this.m22 * sy, this.m21, this.m22, this.m41, this.m42]); }
    multiply(o) {
      return new DOMMatrix([
        this.m11 * o.m11 + this.m12 * o.m21, this.m11 * o.m12 + this.m12 * o.m22,
        this.m21 * o.m11 + this.m22 * o.m21, this.m21 * o.m12 + this.m22 * o.m22,
        this.m41 * o.m11 + this.m42 * o.m21 + o.m41, this.m41 * o.m12 + this.m42 * o.m22 + o.m42
      ]);
    }
    inverse() {
      const det = this.m11 * this.m22 - this.m12 * this.m21;
      if (Math.abs(det) < 1e-10) throw new Error('Matrix is not invertible');
      return new DOMMatrix([
        this.m22 / det, -this.m12 / det,
        -this.m21 / det, this.m11 / det,
        (this.m21 * this.m42 - this.m22 * this.m41) / det, (this.m12 * this.m41 - this.m11 * this.m42) / det
      ]);
    }
    transformPoint(p) {
      return { x: this.m11 * p.x + this.m21 * p.y + this.m41, y: this.m12 * p.x + this.m22 * p.y + this.m42 };
    }
    toFloat32Array() { return new Float32Array([this.m11, this.m12, this.m21, this.m22, this.m41, this.m42, 0, 0]); }
    toFloat64Array() { return new Float64Array([this.m11, this.m12, this.m21, this.m22, this.m41, this.m42, 0, 0]); }
    toString() { return `matrix(${this.m11}, ${this.m12}, ${this.m21}, ${this.m22}, ${this.m41}, ${this.m42})`; }
  };
}

if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class ImageData {
    constructor(dataOrWidth, heightOrSw, sh) {
      if (typeof dataOrWidth === 'number') {
        this.width = dataOrWidth;
        this.height = heightOrSw;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      } else {
        this.data = dataOrWidth;
        this.width = heightOrSw;
        this.height = sh;
      }
    }
  };
}

if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = class Path2D {
    constructor(path) {
      this.commands = [];
      if (path && typeof path === 'string') {
        const commands = path.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
        this.commands = commands.map(c => c.trim());
      }
    }
    addPath(path, transform) { this.commands.push(...path.commands); }
    closePath() { this.commands.push('Z'); }
    moveTo(x, y) { this.commands.push(`M ${x} ${y}`); }
    lineTo(x, y) { this.commands.push(`L ${x} ${y}`); }
    quadraticCurveTo(cpx, cpy, x, y) { this.commands.push(`Q ${cpx} ${cpy} ${x} ${y}`); }
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) { this.commands.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x} ${y}`); }
    arc(x, y, r, start, end, anti) { this.commands.push(`A ${r} ${r} 0 ${anti ? 1 : 0} ${end > start ? 1 : 0} ${x} ${y}`); }
    arcTo(x1, y1, x2, y2, r) { this.commands.push(`A ${r} ${r} 0 0 1 ${x2} ${y2}`); }
    ellipse(x, y, rx, ry, rot, start, end, anti) { this.commands.push(`A ${rx} ${ry} ${rot} ${anti ? 1 : 0} ${end > start ? 1 : 0} ${x} ${y}`); }
    rect(x, y, w, h) { this.commands.push(`M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`); }
    toString() { return this.commands.join(' '); }
  };
}

// -------------------------------------------------
// 2) Lazy-load pdfjs AFTER polyfills
// -------------------------------------------------
let _pdfjs = null;
async function getPdfjs() {
  if (_pdfjs) return _pdfjs;
  _pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  return _pdfjs;
}

// -------------------------------------------------
// Compare by IDs (not implemented with your storage)
// -------------------------------------------------
export const compareDocuments = catchAsyncError(async (req, res, next) => {
  const { document1_id, document2_id } = req.body;
  if (!document1_id || !document2_id) {
    return next(new ErrorHandler('Both document IDs are required', 400));
  }
  return next(new ErrorHandler('Document comparison by ID not implemented yet. Please use file upload.', 400));
});

// -------------------------------------------------
// Upload and compare two documents
// -------------------------------------------------
export const uploadAndCompareDocuments = catchAsyncError(async (req, res, next) => {
  console.log('📄 Document comparison request received');
  console.log('📄 Files received:', req.files ? Object.keys(req.files) : 'No files');

  const files = req.files;
  const { comparison_type = 'detailed' } = req.body;

  if (!files) return next(new ErrorHandler('No files uploaded', 400));
  if (!files.document1 || !files.document2) {
    return next(new ErrorHandler('Two documents (document1 and document2) are required for comparison', 400));
  }
  if (!files.document1[0] || !files.document2[0]) {
    return next(new ErrorHandler('Document files are empty', 400));
  }

  try {
    console.log('📄 Starting text extraction for both documents...');
    const [text1, text2] = await Promise.all([
      extractTextFromFile(files.document1[0]),
      extractTextFromFile(files.document2[0])
    ]);

    console.log('📄 Text extraction results:', {
      document1: { name: files.document1[0].originalname, textLength: text1?.length || 0, success: !!text1 },
      document2: { name: files.document2[0].originalname, textLength: text2?.length || 0, success: !!text2 }
    });

    if (!text1 || !text2) {
      const reasons = [];
      if (!text1) reasons.push(`"${files.document1[0].originalname}"`);
      if (!text2) reasons.push(`"${files.document2[0].originalname}"`);
      return next(new ErrorHandler(`Failed to extract text from: ${reasons.join(', ')}`, 400));
    }

    const comparisonResult = await compareWithGemini(
      text1, text2,
      files.document1[0].originalname,
      files.document2[0].originalname,
      comparison_type
    );

    res.status(200).json({
      success: true,
      message: 'Documents compared successfully',
      files: [
        { name: files.document1[0].originalname, size: files.document1[0].size, type: files.document1[0].mimetype },
        { name: files.document2[0].originalname, size: files.document2[0].size, type: files.document2[0].mimetype }
      ],
      analysis: comparisonResult
    });
  } catch (err) {
    console.error('Upload and compare error:', err);
    return next(new ErrorHandler('Failed to upload and compare documents', 500));
  }
});

// -------------------------------------------------
// PDF text extraction (via pdfjs-dist, lazy-loaded)
// -------------------------------------------------
async function extractTextFromPdfBuffer(buffer) {
  const pdfjs = await getPdfjs?.() || (await import('pdfjs-dist/legacy/build/pdf.mjs')); // supports both lazy + static

  // Convert Node Buffer to Uint8Array (pdfjs requirement)
  const data = new Uint8Array(buffer);

  const loadingTask = pdfjs.getDocument({
    data,
    disableWorker: true,      // ✅ important for Node
    isEvalSupported: false,
    useWorkerFetch: false,
    disableFontFace: true
  });

  const pdf = await loadingTask.promise;
  let out = '';

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent({ includeMarkedContent: false });

    const pageText = content.items
      .map(item => (item && item.str ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (pageText) out += pageText + '\n';
  }

  return out.trim();
}

// -------------------------------------------------
// Dispatcher: pick extractor by mimetype
// -------------------------------------------------
async function extractTextFromFile(file) {
  try {
    console.log('📄 Extracting text from file:', { name: file.originalname, mimetype: file.mimetype, size: file.size });

    if (!file.buffer || file.buffer.length === 0) throw new Error('File buffer is empty');
    const mimeType = (file.mimetype || '').toLowerCase();

    if (mimeType.includes('pdf')) {
      console.log('📄 Processing PDF via pdfjs-dist');
      try {
        const text = await extractTextFromPdfBuffer(file.buffer);
        if (!text) throw new Error('Empty text from pdfjs');
        console.log('📄 PDF text extracted, length:', text.length);
        return text;
      } catch (e) {
        console.error('❌ pdfjs-dist failed:', e.message);
        // very rough fallback
        const raw = file.buffer.toString('utf-8');
        const matches = raw.match(/BT\s+.*?ET/gs);
        if (matches?.length) {
          const fallback = matches.join(' ').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
          if (fallback.length > 10) return fallback;
        }
        throw new Error('All PDF extraction methods failed');
      }
    }

    if (mimeType.includes('word') || mimeType.includes('docx') || mimeType.includes('doc')) {
      console.log('📄 Processing Word document');
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value || '';
    }

    if (mimeType.includes('text') || mimeType.includes('plain')) {
      console.log('📄 Processing text file');
      return file.buffer.toString('utf-8');
    }

    throw new Error(`Unsupported document type: ${mimeType}`);
  } catch (error) {
    console.error('❌ Text extraction error:', error);
    console.error('❌ File details:', {
      name: file?.originalname, mimetype: file?.mimetype, size: file?.size, hasBuffer: !!file?.buffer
    });
    return null;
  }
}

// -------------------------------------------------
// Gemini comparison (unchanged logic, with fetch fallback)
// -------------------------------------------------
async function compareWithGemini(text1, text2, doc1Name, doc2Name, comparisonType) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyD2cD5oHKpZUgiZGX05aiHLJsFMJc1uRKg'; // consider removing fallback
    const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    const prompt = `
You are a professional document analysis AI. Please compare these two documents and provide a comprehensive analysis.

Document 1: "${doc1Name}"
Content: ${text1.substring(0, 8000)} ${text1.length > 8000 ? '...[truncated]' : ''}

Document 2: "${doc2Name}"
Content: ${text2.substring(0, 8000)} ${text2.length > 8000 ? '...[truncated]' : ''}

Please provide a detailed comparison analysis in the following JSON format:

{
  "summary": "Brief overview of the comparison (2-3 sentences)",
  "similarity_percentage": 85,
  "similarities": ["..."],
  "differences": ["..."],
  "key_findings": ["..."],
  "recommendations": ["..."]
}

Respond ONLY with valid JSON. No markdown formatting or additional text.
    `;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, topK: 40, topP: 0.95, maxOutputTokens: 4096 }
    };

    let _fetch = globalThis.fetch;
    if (!_fetch) {
      const { default: nodeFetch } = await import('node-fetch');
      _fetch = nodeFetch;
    }

    const resp = await _fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
      body: JSON.stringify(body)
    });

    if (!resp.ok) throw new Error(`Gemini API error: ${resp.status} ${resp.statusText}`);
    const data = await resp.json();

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Invalid response format from Gemini API');

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON found in response');
      return JSON.parse(jsonMatch[0]);
    } catch {
      return generateFallbackComparison(text1, text2, doc1Name, doc2Name);
    }
  } catch (error) {
    console.error('Gemini comparison error:', error);
    return generateFallbackComparison(text1, text2, doc1Name, doc2Name);
  }
}

// -------------------------------------------------
// Fallback comparison (simple heuristic)
// -------------------------------------------------
function generateFallbackComparison(text1, text2, doc1Name, doc2Name) {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const inter = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  const similarity = Math.round((inter.size / union.size) * 100);

  return {
    summary: `Basic comparison between "${doc1Name}" and "${doc2Name}". Documents show ${similarity}% similarity based on word overlap.`,
    similarity_percentage: similarity,
    similarities: [`Both documents contain ${inter.size} common words`],
    differences: [
      `Document 1 has ${set1.size - inter.size} unique words`,
      `Document 2 has ${set2.size - inter.size} unique words`
    ],
    key_findings: ['Basic text similarity analysis completed'],
    recommendations: ['Manual review recommended for detailed analysis']
  };
}
