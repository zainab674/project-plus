// controllers/aiLegalDocController.js
import catchAsyncError from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/errorHandler.js';
import mammoth from 'mammoth';
import JSZip from 'jszip';
// New centralized services
import { extractDocuments, parseCurrentTextMap } from '../services/documentExtractionService.js';
import { processDocuments, processDocumentComparison } from '../services/documentProcessorService.js';

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
    // Use new extraction service
    const extractedDocs = await extractDocuments([files.document1[0], files.document2[0]]);
    
    if (extractedDocs.length < 2) {
      const reasons = [];
      if (!extractedDocs[0]) reasons.push(`"${files.document1[0].originalname}"`);
      if (!extractedDocs[1]) reasons.push(`"${files.document2[0].originalname}"`);
      return next(new ErrorHandler(`Failed to extract text from: ${reasons.join(', ')}`, 400));
    }

    // Use new document processor service for comparison
    const comparisonResult = await processDocumentComparison(
      extractedDocs[0].name,
      extractedDocs[0].text,
      extractedDocs[1].name,
      extractedDocs[1].text,
      comparison_type
    );

    // Include HTML in response for styling preservation
    res.status(200).json({
      success: true,
      message: 'Documents compared successfully',
      files: [
        { name: extractedDocs[0].name, size: extractedDocs[0].size, type: extractedDocs[0].mimetype },
        { name: extractedDocs[1].name, size: extractedDocs[1].size, type: extractedDocs[1].mimetype }
      ],
      analysis: comparisonResult,
      html: {
        document1: extractedDocs[0].html || null,
        document2: extractedDocs[1].html || null
      }
    });
  } catch (err) {
    return next(new ErrorHandler(err.message || 'Failed to upload and compare documents', 500));
  }
});

// -------------------------------------------------
// Rephrase a single uploaded document with a custom prompt
// -------------------------------------------------
export const rephraseDocument = catchAsyncError(async (req, res, next) => {
  try {
    const file = req.file;
    const { prompt } = req.body;

    if (!file) {
      return next(new ErrorHandler('No file uploaded', 400));
    }

    // Use new extraction service
    const extractedDocs = await extractDocuments([file]);
    
    if (extractedDocs.length === 0 || !extractedDocs[0].text) {
      return next(new ErrorHandler('Failed to extract text from uploaded document', 400));
    }

    const userPrompt = (prompt && String(prompt).trim().length > 0)
      ? String(prompt).trim()
      : 'Rephrase this document for clarity and readability.';

    // Use new document processor service
    const result = await processDocuments({
      instruction: userPrompt,
      documents: extractedDocs,
      operationType: 'rephrase',
      useSchema: false
    });

    res.status(200).json({
      success: true,
      message: 'Document rephrased successfully',
      file: { name: extractedDocs[0].name, type: extractedDocs[0].mimetype, size: extractedDocs[0].size },
      prompt: userPrompt,
      rephrased_text: result.output_text || result.revised_text || '',
      original_text: result.original_text || extractedDocs[0].text
    });
  } catch (error) {
    return next(new ErrorHandler(error.message || 'Failed to rephrase document', 500));
  }
});

// -------------------------------------------------
// Generic instruction over one or more uploaded documents
// -------------------------------------------------
export const instructOnDocuments = catchAsyncError(async (req, res, next) => {
  try {
    const { prompt } = req.body;

    // Collect files from various sources
    const files = [];
    if (Array.isArray(req.files?.files)) {
      files.push(...req.files.files);
    }
    if (Array.isArray(req.files?.file)) {
      files.push(...req.files.file);
    }
    // Back-compat for document1/document2
    if (Array.isArray(req.files?.document1)) files.push(req.files.document1[0]);
    if (Array.isArray(req.files?.document2)) files.push(req.files.document2[0]);

    // Files are optional - allow prompts without files
    const hasFiles = files.length > 0;

    // Parse current_text overrides from frontend (previously modified documents)
    const currentTextsMap = parseCurrentTextMap(req.body);

    // Extract documents using new service
    let extracted = [];
    if (hasFiles) {
      try {
        extracted = await extractDocuments(files, currentTextsMap);
      } catch (error) {
        return next(new ErrorHandler(error.message || 'Failed to extract text from uploaded document(s)', 400));
      }
    }

    // Get instruction or default
    const instruction = (prompt && String(prompt).trim().length > 0)
      ? String(prompt).trim()
      : hasFiles ? 'Analyze the provided documents and respond helpfully.' : 'How can I help you?';

    // Use new document processor service (handles intent detection, prompt building, OpenAI calls, etc.)
    const result = await processDocuments({
      instruction,
      documents: extracted,
      operationType: 'instruct',
      useSchema: true // Use standardized schema for new flow
    });

    // Return response (already in frontend-compatible format)
    res.status(200).json(result);
  } catch (error) {
    return next(new ErrorHandler(error.message || 'Failed to process instruction', 500));
  }
});

// -------------------------------------------------
// Export native .docx with Track Changes (w:ins / w:del)
// -------------------------------------------------
export const exportDocxTrackChanges = catchAsyncError(async (req, res, next) => {
  try {
    const { original_text = '', revised_text = '', author = 'AI Assistant' } = req.body || {};
    if (!revised_text || !original_text) {
      return next(new ErrorHandler('original_text and revised_text are required', 400));
    }

    // Word-level diff
    const a = original_text.split(/\s+/);
    const b = revised_text.split(/\s+/);
    const n = a.length, m = b.length;
    const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    const parts = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) { parts.push({ t: 'same', v: a[i] }); i++; j++; }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { parts.push({ t: 'del', v: a[i++] }); }
      else { parts.push({ t: 'ins', v: b[j++] }); }
    }
    while (i < n) parts.push({ t: 'del', v: a[i++] });
    while (j < m) parts.push({ t: 'ins', v: b[j++] });

    const escXml = (s) => String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Group consecutive insertions and deletions together to reduce granularity
    const groupedParts = [];
    let currentGroup = null;
    
    for (const part of parts) {
      if (!part.v) continue;
      
      if (part.t === 'same') {
        // Flush any current group
        if (currentGroup) {
          groupedParts.push(currentGroup);
          currentGroup = null;
        }
        groupedParts.push(part);
      } else if (part.t === 'del') {
        if (currentGroup && currentGroup.t === 'del') {
          // Append to existing deletion group
          currentGroup.v += ' ' + part.v;
        } else {
          // Flush previous group if exists
          if (currentGroup) {
            groupedParts.push(currentGroup);
          }
          // Start new deletion group
          currentGroup = { t: 'del', v: part.v };
        }
      } else if (part.t === 'ins') {
        if (currentGroup && currentGroup.t === 'ins') {
          // Append to existing insertion group
          currentGroup.v += ' ' + part.v;
        } else {
          // Flush previous group if exists
          if (currentGroup) {
            groupedParts.push(currentGroup);
          }
          // Start new insertion group
          currentGroup = { t: 'ins', v: part.v };
        }
      }
    }
    // Flush any remaining group
    if (currentGroup) {
      groupedParts.push(currentGroup);
    }

    // Build WordprocessingML runs with revisions (each group becomes one tracked change entry)
    const now = new Date().toISOString();
    const runs = groupedParts.map((p, idx) => {
      const text = escXml(p.v);
      if (!text) return '';
      if (p.t === 'ins') {
        return `<w:ins w:id="${1000 + idx}" w:author="${escXml(author)}" w:date="${now}"><w:r><w:t>${text}</w:t></w:r></w:ins>`;
      }
      if (p.t === 'del') {
        return `<w:del w:id="${2000 + idx}" w:author="${escXml(author)}" w:date="${now}"><w:r><w:delText xml:space="preserve">${text} </w:delText></w:r></w:del>`;
      }
      return `<w:r><w:t xml:space="preserve">${text} </w:t></w:r>`;
    }).join('');

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 wp14">
  <w:body>
    <w:p><w:r><w:t>Tracked Changes</w:t></w:r></w:p>
    <w:p>${runs}</w:p>
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;

    const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:trackRevisions/>
</w:settings>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
</w:styles>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

    const relsRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;

    const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Tracked Changes</dc:title>
  <dc:creator>${escXml(author)}</dc:creator>
  <cp:lastModifiedBy>${escXml(author)}</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
  <dc:description>Auto-generated diff with w:ins/w:del</dc:description>
</cp:coreProperties>`;

    const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>AI Assistant</Application>
</Properties>`;

    const zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypes);
    const rels = zip.folder('_rels');
    rels.file('.rels', relsRels);
    const docProps = zip.folder('docProps');
    docProps.file('core.xml', coreXml);
    docProps.file('app.xml', appXml);
    const word = zip.folder('word');
    word.file('document.xml', documentXml);
    word.file('styles.xml', stylesXml);
    word.file('settings.xml', settingsXml);
    const wordrels = word.folder('_rels');
    wordrels.file('document.xml.rels', wordRels);

    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="track-changes.docx"');
    return res.status(200).send(buf);
  } catch (error) {
    return next(new ErrorHandler(error.message || 'Failed to export docx with track changes', 500));
  }
});

// -------------------------------------------------
// Export .docx by injecting changes into original .docx (best-effort styles preservation)
// Expects multipart/form-data with fields: original_docx (file), revised_text (string)
// -------------------------------------------------
export const exportDocxTrackChangesInplace = catchAsyncError(async (req, res, next) => {
  try {
    const file = req.file; // original .docx
    const { revised_text = '', author = 'AI Assistant' } = req.body || {};
    if (!file || !revised_text) {
      return next(new ErrorHandler('original_docx file and revised_text are required', 400));
    }
    if (!file.mimetype.includes('officedocument.wordprocessingml.document')) {
      return next(new ErrorHandler('original_docx must be a .docx file', 400));
    }

    // Load original .docx
    const zip = await JSZip.loadAsync(file.buffer);
    const docXmlPath = 'word/document.xml';
    const settingsPath = 'word/settings.xml';
    if (!zip.file(docXmlPath)) return next(new ErrorHandler('Invalid docx: word/document.xml missing', 400));
    const xml = await zip.file(docXmlPath).async('string');

    // Enable track revisions in settings, and force Word to visibly show them
    let settingsXml = zip.file(settingsPath) ? await zip.file(settingsPath).async('string') : null;
    if (!settingsXml) {
      settingsXml =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<w:settings xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
        'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        '</w:settings>';
    }

    // Inject revision settings to force visible insertions/deletions
    if (!settingsXml.includes('<w:rsids')) {
      const rsidBlock =
        `<w:rsids>` +
          `<w:rsidRoot w:val="00ABCDEF"/>` +
          `<w:rsid w:val="00ABCDEF"/>` +
          `<w:rsid w:val="00FEDCBA"/>` +
          `<w:rsid w:val="00A1B2C3"/>` +
          `<w:rsid w:val="00112233"/>` +
          `<w:rsid w:val="00FFEECC"/>` +
        `</w:rsids>`;
      settingsXml = settingsXml.replace('</w:settings>', rsidBlock + '</w:settings>');
    }

    // Enable track revisions
    if (!settingsXml.includes('<w:trackRevisions')) {
      settingsXml = settingsXml.replace(
        '</w:settings>',
        '<w:trackRevisions/></w:settings>'
      );
    }

    // Show markup visibly
    if (!settingsXml.includes('<w:revisionView')) {
      const revisionViewTag =
        '<w:revisionView ' +
          'w:markup="true" ' +
          'w:comments="true" ' +
          'w:insDel="true" ' +
          'w:insDelInk="true" ' +
          'w:formatting="true" ' +
          'w:inkAnnotations="true"' +
        '/>';

      settingsXml = settingsXml.replace('</w:settings>', revisionViewTag + '</w:settings>');
    }

    // Improve visibility in balloon mode
    if (!settingsXml.includes('<w:displayBackgroundShape')) {
      settingsXml = settingsXml.replace(
        '</w:settings>',
        '<w:displayBackgroundShape/></w:settings>'
      );
    }

    // Collect all rsids used in the document to register them in settings
    const usedRsids = new Set(['00ABCDEF', '00FEDCBA', '00A1B2C3', '00112233', '00FFEECC']); // Start with defaults

    zip.file(settingsPath, settingsXml);

    // Word-level diff helper
    const wordDiff = (oldText, newText) => {
      const a = (oldText || '').split(/\s+/).filter(w => w);
      const b = (newText || '').split(/\s+/).filter(w => w);
      const n = a.length, m = b.length;
      const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
      for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
          dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
      const parts = [];
      let i = 0, j = 0;
      while (i < n && j < m) {
        if (a[i] === b[j]) { parts.push({ t: 'same', v: a[i] }); i++; j++; }
        else if (dp[i + 1][j] >= dp[i][j + 1]) { parts.push({ t: 'del', v: a[i++] }); }
        else { parts.push({ t: 'ins', v: b[j++] }); }
      }
      while (i < n) parts.push({ t: 'del', v: a[i++] });
      while (j < m) parts.push({ t: 'ins', v: b[j++] });
      return parts;
    };

    // Step 1: Extract paragraphs from original XML with run formatting preserved
    function extractParagraphsFromXml(xml) {
      const paragraphs = [];
      const paraRegex = /<w:p[\s\S]*?<\/w:p>/g;
      const matches = xml.match(paraRegex) || [];
      
      for (const pXml of matches) {
        // Extract runs with their text and formatting (w:rPr)
        const runs = [];
        const runRegex = /<w:r[\s\S]*?<\/w:r>/g;
        const runMatches = pXml.match(runRegex) || [];
        
        for (const runXml of runMatches) {
          // Extract text from <w:t> tags in this run
          const textMatches = [...runXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)];
          const texts = textMatches.map(m => m[1]);
          const runText = texts.join('').replace(/\s+/g, ' ').trim();
          
          if (runText) {
            // Extract w:rPr (run properties/formatting)
            const rPrMatch = runXml.match(/<w:rPr[\s\S]*?<\/w:rPr>/);
            const rPr = rPrMatch ? rPrMatch[0] : '';
            
            // Extract rsid from run if present
            const rsidMatch = runXml.match(/w:rsidR="([^"]+)"/);
            const rsid = rsidMatch ? rsidMatch[1] : '';
            
            runs.push({
              text: runText,
              rPr: rPr,
              rsid: rsid,
              xml: runXml
            });
          }
        }
        
        // Build plain text version (for diffing)
        const textRuns = runs.map(r => r.text).join(' ').replace(/\s+/g, ' ').trim();
        
        paragraphs.push({
          xml: pXml,        // Keep full paragraph XML (styles, rsid, pPr etc.)
          text: textRuns,   // Plain text version
          runs: runs        // Array of runs with formatting preserved
        });
      }
      
      return paragraphs;
    }

    // Step 2: Split revised text into paragraphs (match frontend: double newlines only)
    function splitRevisedText(text) {
      return text
        .replace(/\r/g, '')
        .split(/\n{2,}/)  // Only split on double newlines (matches frontend)
        .map(p => p.trim())
        .filter(p => p.length > 0);
    }

    // Helper: Map words to original runs for formatting preservation
    function buildWordToRunMapping(originalRuns) {
      const mapping = []; // Array of { word, rPr, rsid, runIndex }
      if (!originalRuns || originalRuns.length === 0) return mapping;
      
      for (let runIdx = 0; runIdx < originalRuns.length; runIdx++) {
        const run = originalRuns[runIdx];
        const words = run.text.split(/\s+/).filter(w => w);
        for (const word of words) {
          mapping.push({
            word: word,
            rPr: run.rPr,
            rsid: run.rsid,
            runIndex: runIdx
          });
        }
      }
      return mapping;
    }

    // Step 3: Build tracked paragraph from diff parts with formatting preserved
    function buildTrackedParagraph(originalPXml, diffParts, author, now, runIdBase = 0, usedRsidsSet = null, originalRuns = null) {
      // Helper to escape XML
      function escapeXml(s) {
        return String(s || '')
          .replace(/&/g,'&amp;')
          .replace(/</g,'&lt;')
          .replace(/>/g,'&gt;');
      }

      // Build word-to-run mapping for formatting preservation
      const wordMapping = originalRuns ? buildWordToRunMapping(originalRuns) : [];
      let wordIndex = 0; // Track position in original word sequence

      // Pull <w:p ...attrs...> from original if available
      let pAttrsMatch = originalPXml.match(/^<w:p([^>]*)>/);
      let pAttrs = pAttrsMatch ? pAttrsMatch[1] : '';

      // Pull any <w:pPr>...</w:pPr> block
      let pPrMatch = originalPXml.match(/<w:pPr[\s\S]*?<\/w:pPr>/);
      let pPr = pPrMatch ? pPrMatch[0] : null;

      // If there's no pPr at all, make a base one
      if (!pPr) {
        pPr =
          `<w:pPr>` +
            // Tell Word "this paragraph has been edited"
            `<w14:paraChange w:id="${Math.floor(Math.random()*100000)}" ` +
              `w:author="${escapeXml(author)}" ` +
              `w:date="${now}"/>` +
          `</w:pPr>`;
      } else {
        // Inject <w14:paraChange .../> inside existing <w:pPr> if not already present
        if (!pPr.includes('<w14:paraChange')) {
          pPr = pPr.replace(
            '</w:pPr>',
            `<w14:paraChange w:id="${Math.floor(Math.random()*100000)}" ` +
              `w:author="${escapeXml(author)}" ` +
              `w:date="${now}"/>` +
            `</w:pPr>`
          );
        }
      }

      // Ensure paragraph has IDs/rsids to avoid Word thinking it's 100% new
      // If attrs from original are empty (new para), synthesize them
      if (!pAttrs || !/w14:paraId=/.test(pAttrs)) {
        const hexPart1 = (Math.random().toString(16).slice(2,8)).toUpperCase().padStart(6, '0');
        const hexPart2 = (Math.random().toString(16).slice(2,8)).toUpperCase().padStart(6, '0');
        const hexPart3 = (Math.random().toString(16).slice(2,8)).toUpperCase().padStart(6, '0');
        const paraId = '00' + hexPart1;
        const textId = '00' + hexPart2;
        const rsid   = '00' + hexPart3;
        if (usedRsidsSet) {
          usedRsidsSet.add(rsid);
        }

        // NOTE: we add xmlns:w14 here in case it wasn't present in the header
        pAttrs =
          ` w14:paraId="${paraId}"` +
          ` w14:textId="${textId}"` +
          ` w:rsidR="${rsid}"` +
          ` w:rsidRDefault="${rsid}"` +
          ` xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"` +
          (pAttrs ? ` ${pAttrs.trim()}` : '');
      } else {
        // Make sure we have rsidR/rsidRDefault so Word thinks it's tracked
        if (!/w:rsidR=/.test(pAttrs)) {
          const hexPart = (Math.random().toString(16).slice(2,8)).toUpperCase().padStart(6, '0');
          const rsid = '00' + hexPart;
          if (usedRsidsSet) {
            usedRsidsSet.add(rsid);
          }
          pAttrs += ` w:rsidR="${rsid}" w:rsidRDefault="${rsid}"`;
        } else {
          // Extract and register existing rsid from paragraph
          const existingRsidMatch = pAttrs.match(/w:rsidR="([^"]+)"/);
          if (existingRsidMatch && usedRsidsSet) {
            usedRsidsSet.add(existingRsidMatch[1]);
          }
        }
      }

      // Extract rsid from paragraph attributes for use in runs
      let paraRsid = '';
      if (pAttrs) {
        const rsidMatch = pAttrs.match(/w:rsidR="([^"]+)"/);
        if (rsidMatch) {
          paraRsid = rsidMatch[1];
        }
      }
      // If no rsid found, generate one for the runs (Word format: 8 hex chars, typically starts with "00")
      if (!paraRsid) {
        const hexPart = (Math.random().toString(16).slice(2,8)).toUpperCase().padStart(6, '0');
        paraRsid = '00' + hexPart;
      }
      // Register paragraph rsid
      if (usedRsidsSet) {
        usedRsidsSet.add(paraRsid);
      }

      // Group consecutive insertions and deletions together to reduce granularity
      // This matches how the frontend groups changes, so Word document will show fewer change entries
      const groupedParts = [];
      let currentGroup = null;
      
      for (const part of diffParts) {
        if (!part.v) continue;
        
        if (part.t === 'same') {
          // Flush any current group
          if (currentGroup) {
            groupedParts.push(currentGroup);
            currentGroup = null;
          }
          groupedParts.push(part);
        } else if (part.t === 'del') {
          if (currentGroup && currentGroup.t === 'del') {
            // Append to existing deletion group
            currentGroup.v += ' ' + part.v;
          } else {
            // Flush previous group if exists
            if (currentGroup) {
              groupedParts.push(currentGroup);
            }
            // Start new deletion group
            currentGroup = { t: 'del', v: part.v };
          }
        } else if (part.t === 'ins') {
          if (currentGroup && currentGroup.t === 'ins') {
            // Append to existing insertion group
            currentGroup.v += ' ' + part.v;
          } else {
            // Flush previous group if exists
            if (currentGroup) {
              groupedParts.push(currentGroup);
            }
            // Start new insertion group
            currentGroup = { t: 'ins', v: part.v };
          }
        }
      }
      // Flush any remaining group
      if (currentGroup) {
        groupedParts.push(currentGroup);
      }

      // Build runs from grouped parts (each group becomes one tracked change entry)
      // Apply formatting from original runs when available
      let runId = runIdBase;
      let builtRuns = groupedParts.map(part => {
        if (!part.v) return '';
        const safe = escapeXml(part.v) + ' ';

        if (part.t === 'same') {
          // For unchanged text, preserve formatting from original runs
          const words = part.v.split(/\s+/).filter(w => w);
          let rPr = '';
          let runRsid = paraRsid;
          
          // Get formatting from first word in this part (use its run formatting)
          if (wordMapping.length > 0 && wordIndex < wordMapping.length) {
            const firstWordMapping = wordMapping[wordIndex];
            rPr = firstWordMapping.rPr || '';
            runRsid = firstWordMapping.rsid || paraRsid;
            wordIndex += words.length; // Advance word index (these words matched)
          }
          
          // Build run with formatting
          const rPrXml = rPr ? rPr : '';
          return `<w:r w:rsidR="${runRsid}">${rPrXml}<w:t xml:space="preserve">${safe}</w:t></w:r>`;
        } else if (part.t === 'del') {
          // For deletions, preserve original formatting
          const words = part.v.split(/\s+/).filter(w => w);
          let rPr = '';
          let delRsidForRun = paraRsid;
          
          if (wordMapping.length > 0 && wordIndex < wordMapping.length) {
            const firstWordMapping = wordMapping[wordIndex];
            rPr = firstWordMapping.rPr || '';
            delRsidForRun = firstWordMapping.rsid || paraRsid;
            wordIndex += words.length; // Advance (these words were deleted from original)
          }
          
          const currentRunId = runId;
          runId++;
          const delHexPart = (Math.random().toString(16).slice(2,8)).toUpperCase().padStart(6, '0');
          const delRsid = '00' + delHexPart;
          if (usedRsidsSet) {
            usedRsidsSet.add(delRsid);
            usedRsidsSet.add(paraRsid); // Ensure paraRsid is also registered
          }
          
          const rPrXml = rPr ? rPr : '';
          return (
            `<w:del w:id="${2000 + currentRunId}" ` +
                  `w:author="${escapeXml(author)}" ` +
                  `w:date="${now}">` +
              `<w:r w:rsidR="${delRsid}" w:rsidDel="${delRsidForRun}">${rPrXml}<w:delText xml:space="preserve">${safe}</w:delText></w:r>` +
            `</w:del>`
          );
        } else if (part.t === 'ins') {
          // For insertions, try to inherit formatting from adjacent text
          // Look at previous or next word in mapping for context
          let rPr = '';
          if (wordMapping.length > 0) {
            // Try to get formatting from the word just before or after the insertion
            if (wordIndex > 0 && wordIndex - 1 < wordMapping.length) {
              rPr = wordMapping[wordIndex - 1].rPr || '';
            } else if (wordIndex < wordMapping.length) {
              rPr = wordMapping[wordIndex].rPr || '';
            } else if (wordMapping.length > 0) {
              // Use formatting from last available run
              rPr = wordMapping[wordMapping.length - 1].rPr || '';
            }
          }
          
          const currentRunId = runId;
          runId++;
          // Use a variation of paraRsid for insertions - Word needs them related
          // Generate a new rsid but ensure paraRsid is registered
          const insHexPart = (Math.random().toString(16).slice(2,8)).toUpperCase().padStart(6, '0');
          const insRsid = '00' + insHexPart;
          if (usedRsidsSet) {
            usedRsidsSet.add(insRsid);
            usedRsidsSet.add(paraRsid); // Ensure paraRsid is also registered
          }
          // Format date to match Word's expected format (ISO 8601 with Z)
          const wordDate = now.replace(/\.\d{3}Z$/, 'Z'); // Remove milliseconds if present
          
          const rPrXml = rPr ? rPr : '';
          return (
            `<w:ins w:id="${1000 + currentRunId}" ` +
                  `w:author="${escapeXml(author)}" ` +
                  `w:date="${wordDate}" ` +
                  `w:rsidR="${insRsid}" ` +
                  `w:rsidRPr="${insRsid}">` +
              `<w:r w:rsidR="${insRsid}">${rPrXml}<w:t xml:space="preserve">${safe}</w:t></w:r>` +
            `</w:ins>`
          );
        }
        return '';
      }).filter(x => x);

      // Handle "only insertions" paragraphs:
      // We still prepend one unchanged dummy run so Word knows it's not 'brand new paragraph'
      const onlyIns = diffParts.length > 0 && diffParts.every(p => p.t === 'ins' || !p.v);
      if (onlyIns) {
        builtRuns.unshift(
          `<w:r w:rsidR="${paraRsid}"><w:t xml:space="preserve"> </w:t></w:r>`
        );
      }

      const runsXml = builtRuns.join('');

      return {
        xml: `<w:p${pAttrs}>${pPr}${runsXml}</w:p>`,
        nextRunId: runId,
      };
    }

    // Extract original paragraphs
    const originalParas = extractParagraphsFromXml(xml);
    
    // Split revised text into paragraphs
    const revisedParas = splitRevisedText(revised_text);

    // Step 4: Diff each paragraph and rebuild
    const now = new Date().toISOString();
    let globalRunId = 0;
    const rebuiltParas = [];
    
    const maxLen = Math.max(originalParas.length, revisedParas.length);
    for (let i = 0; i < maxLen; i++) {
      const origPara = originalParas[i];
      const revisedParaText = revisedParas[i] || '';
      const origText = origPara ? origPara.text : '';
      const origPXml = origPara ? origPara.xml : '<w:p></w:p>';

      // Diff this paragraph
      const diffParts = wordDiff(origText, revisedParaText);
      
      // Check if paragraph actually changed
      const hasChanges = diffParts.some(p => p.t === 'del' || p.t === 'ins');
      
      if (hasChanges && origPara) {
        // Build tracked paragraph with formatting preserved
        const originalRuns = origPara.runs || null;
        const result = buildTrackedParagraph(origPXml, diffParts, author, now, globalRunId, usedRsids, originalRuns);
        rebuiltParas.push(result.xml);
        globalRunId = result.nextRunId;
      } else if (origPara) {
        // Unchanged: keep original paragraph
        rebuiltParas.push(origPXml);
      } else if (revisedParaText) {
        // New paragraph: create with insertions only (no original runs to preserve)
        const newDiffParts = wordDiff('', revisedParaText);
        const result = buildTrackedParagraph('<w:p></w:p>', newDiffParts, author, now, globalRunId, usedRsids, null);
        rebuiltParas.push(result.xml);
        globalRunId = result.nextRunId;
      }
    }

    // Step 5: Reconstruct the whole document.xml
    // Find first paragraph index
    const firstParaIdx = xml.indexOf('<w:p');
    
    let header = '';
    let footer = '';
    
    if (firstParaIdx >= 0) {
      // Extract header (everything before first paragraph)
      header = xml.substring(0, firstParaIdx);
      
      // Ensure w14 namespace is present for Word 2010+ track changes
      if (header && !header.includes('xmlns:w14=')) {
        // Find the w:document tag and add w14 namespace
        const docTagMatch = header.match(/(<w:document[^>]*>)/);
        if (docTagMatch) {
          let docTag = docTagMatch[1];
          if (!docTag.includes('xmlns:w14=')) {
            // Add w14 namespace before the closing >
            docTag = docTag.replace(/>$/, ' xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">');
            header = header.replace(docTagMatch[1], docTag);
          }
          // Also ensure mc:Ignorable includes w14
          if (!header.includes('mc:Ignorable=')) {
            const docTag2Match = header.match(/(<w:document[^>]*>)/);
            if (docTag2Match) {
              let docTag2 = docTag2Match[1];
              // Add mc namespace if not present
              if (!docTag2.includes('xmlns:mc=')) {
                docTag2 = docTag2.replace(/>$/, ' xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"');
              }
              // Add mc:Ignorable
              docTag2 = docTag2.replace(/>$/, ' mc:Ignorable="w14 wp14">');
              header = header.replace(docTag2Match[1], docTag2);
            }
          } else if (!header.includes('w14')) {
            // Update existing mc:Ignorable to include w14
            header = header.replace(/mc:Ignorable="([^"]+)"/, (match, val) => {
              return val.includes('w14') ? match : `mc:Ignorable="${val} w14 wp14"`;
            });
          }
        }
      }
      
      // Find the end of the last paragraph
      const lastParaEndIdx = xml.lastIndexOf('</w:p>');
      if (lastParaEndIdx >= 0) {
        // Extract footer (everything after last paragraph)
        footer = xml.substring(lastParaEndIdx + 7); // 7 = '</w:p>'.length
      } else {
        // No closing tags found: try to find </w:body>
        const bodyEndIdx = xml.lastIndexOf('</w:body>');
        if (bodyEndIdx >= 0) {
          footer = xml.substring(bodyEndIdx);
        }
      }
    } else {
      // No paragraphs found: use whole XML as header
      header = xml;
    }

    // Rebuild document with tracked paragraphs
    const newBodyContent = rebuiltParas.join('');
    const newXml = header + newBodyContent + footer;
    zip.file(docXmlPath, newXml);

    // Update settings.xml to include all used rsids
    let finalSettingsXml = await zip.file(settingsPath).async('string');
    if (usedRsids.size > 0) {
      const rsidEntries = Array.from(usedRsids).map(rsid => `<w:rsid w:val="${rsid}"/>`).join('\n          ');
      const rsidBlock = 
        `<w:rsids>` +
          `<w:rsidRoot w:val="${Array.from(usedRsids)[0]}"/>` +
          `\n          ${rsidEntries}` +
        `\n        </w:rsids>`;
      
      if (finalSettingsXml.includes('<w:rsids')) {
        // Replace existing rsids block
        finalSettingsXml = finalSettingsXml.replace(/<w:rsids[\s\S]*?<\/w:rsids>/, rsidBlock);
      } else {
        // Insert before closing settings tag
        finalSettingsXml = finalSettingsXml.replace('</w:settings>', rsidBlock + '\n      </w:settings>');
      }
      zip.file(settingsPath, finalSettingsXml);
    }
    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="track-changes-preserved.docx"');
    return res.status(200).send(buf);
  } catch (error) {
    return next(new ErrorHandler(error.message || 'Failed to export docx with preserved styles', 500));
  }
});

// -------------------------------------------------
// Export .docx by applying revised text to original DOCX without tracked changes markup
// Similar to exportDocxTrackChangesInplace but applies text directly without w:ins/w:del
// Expects multipart/form-data with fields: original_docx (file), revised_text (string)
// -------------------------------------------------
export const exportDocxFinal = catchAsyncError(async (req, res, next) => {
  try {
    const file = req.file; // original .docx
    const { revised_text = '' } = req.body || {};
    if (!file || !revised_text) {
      return next(new ErrorHandler('original_docx file and revised_text are required', 400));
    }
    if (!file.mimetype.includes('officedocument.wordprocessingml.document')) {
      return next(new ErrorHandler('original_docx must be a .docx file', 400));
    }

    // Load original .docx
    const zip = await JSZip.loadAsync(file.buffer);
    const docXmlPath = 'word/document.xml';
    if (!zip.file(docXmlPath)) return next(new ErrorHandler('Invalid docx: word/document.xml missing', 400));
    const xml = await zip.file(docXmlPath).async('string');

    // Helper to escape XML
    function escapeXml(s) {
      return String(s || '')
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;');
    }

    // Extract paragraphs from original XML
    function extractParagraphsFromXml(xml) {
      const paragraphs = [];
      const paraRegex = /<w:p[\s\S]*?<\/w:p>/g;
      const matches = xml.match(paraRegex) || [];
      
      for (const pXml of matches) {
        // Extract display text from this paragraph
        const textRuns = [...pXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
          .map(m => m[1])
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        paragraphs.push({
          xml: pXml,        // Keep full paragraph XML (styles, rsid, pPr etc.)
          text: textRuns    // Plain text version
        });
      }
      
      return paragraphs;
    }

    // Split revised text into paragraphs - handle paragraphs, lists, bullet points, etc.
    function splitRevisedText(text) {
      if (!text || text.trim().length === 0) return [];
      
      // Clean up text
      let cleanText = text.replace(/\r/g, '');
      
      // Strategy 1: Split by double newlines (standard paragraph breaks)
      let paras = cleanText.split(/\n\s*\n+/).map(p => p.trim()).filter(p => p.length > 0);
      console.log(`[splitRevisedText] Strategy 1 (double newlines): ${paras.length} paragraphs`);
      
      // Strategy 2: If we have few paragraphs but text has many newlines, split by single newlines
      // This handles cases where content is separated by single line breaks (lists, bullet points, etc.)
      if (paras.length <= 5 && cleanText.includes('\n') && text.length > 200) {
        const singleNewlineParas = cleanText.split(/\n/).map(p => p.trim()).filter(p => p.length > 0);
        console.log(`[splitRevisedText] Strategy 2 (single newlines): ${singleNewlineParas.length} paragraphs`);
        // Use single newline split if it gives us significantly more paragraphs (at least 3x more)
        // This handles lists, bullet points, numbered lists, etc.
        if (singleNewlineParas.length >= paras.length * 3 || singleNewlineParas.length > 10) {
          paras = singleNewlineParas;
          console.log(`[splitRevisedText] Using single newline split (${paras.length} paragraphs) - likely lists/bullet points`);
        }
      }
      
      // Strategy 3: Handle bullet points and numbered lists explicitly
      // Look for lines starting with bullets, numbers, dashes, etc.
      if (paras.length > 1) {
        const bulletPattern = /^[\s]*[•\-\*\+]\s+|^[\s]*\d+[\.\)]\s+|^[\s]*[a-zA-Z][\.\)]\s+/;
        const hasBulletPoints = paras.some(p => bulletPattern.test(p));
        if (hasBulletPoints && cleanText.split(/\n/).filter(l => l.trim().length > 0).length > paras.length) {
          // Text has bullet points - split by single newlines to preserve list items
          const listItems = cleanText.split(/\n/).map(p => p.trim()).filter(p => p.length > 0);
          if (listItems.length > paras.length) {
            paras = listItems;
            console.log(`[splitRevisedText] Detected bullet points/lists - split into ${paras.length} items`);
          }
        }
      }
      
      // Strategy 4: If text is long but still few paragraphs, split by single newlines
      // This ensures we don't miss content that's formatted with single line breaks
      if (paras.length <= 3 && text.length > 1000 && cleanText.split(/\n/).filter(l => l.trim().length > 0).length > paras.length * 2) {
        const forcedParas = cleanText.split(/\n/).map(p => p.trim()).filter(p => p.length > 0);
        if (forcedParas.length > paras.length * 2) {
          paras = forcedParas;
          console.log(`[splitRevisedText] Force splitting long text by single newlines: ${paras.length} paragraphs`);
        }
      }
      
      console.log(`[splitRevisedText] FINAL: Split ${text.length} chars into ${paras.length} paragraphs/items`);
      if (paras.length > 0 && paras.length <= 5) {
        console.log(`[splitRevisedText] Sample paragraphs: ${paras.slice(0, 3).map(p => p.substring(0, 50)).join(' | ')}`);
      }
      return paras;
    }

    // Build paragraph with revised text but preserving original structure (no tracked changes)
    function buildFinalParagraph(originalPXml, revisedText) {
      // Pull <w:p ...attrs...> from original
      let pAttrsMatch = originalPXml.match(/^<w:p([^>]*)>/);
      let pAttrs = pAttrsMatch ? pAttrsMatch[1] : '';

      // Pull any <w:pPr>...</w:pPr> block
      let pPrMatch = originalPXml.match(/<w:pPr[\s\S]*?<\/w:pPr>/);
      let pPr = pPrMatch ? pPrMatch[0] : '';

      // Extract rsid from paragraph attributes for use in runs
      let paraRsid = '';
      if (pAttrs) {
        const rsidMatch = pAttrs.match(/w:rsidR="([^"]+)"/);
        if (rsidMatch) {
          paraRsid = rsidMatch[1];
        }
      }
      // If no rsid found, generate one (Word requires rsid for proper document structure)
      if (!paraRsid) {
        const hexPart = (Math.random().toString(16).slice(2,8)).toUpperCase().padStart(6, '0');
        paraRsid = '00' + hexPart;
        // Ensure pAttrs has proper spacing
        if (pAttrs.trim().length === 0) {
          pAttrs = ` w:rsidR="${paraRsid}"`;
        } else if (!pAttrs.includes('w:rsidR')) {
          pAttrs = pAttrs.trim() + ` w:rsidR="${paraRsid}"`;
        }
      }

      // Try to extract formatting from first run in original paragraph to preserve style
      let firstRunFormatting = '';
      const firstRunMatch = originalPXml.match(/<w:r[^>]*>[\s\S]*?<\/w:r>/);
      if (firstRunMatch) {
        const runContent = firstRunMatch[0];
        const rPrMatch = runContent.match(/<w:rPr[\s\S]*?<\/w:rPr>/);
        if (rPrMatch) {
          firstRunFormatting = rPrMatch[0];
        }
      }

      // Simple: one run with the paragraph text
      // Since we already split by paragraphs, each revisedText is a single paragraph
      const rPrXml = firstRunFormatting ? firstRunFormatting : '';
      const escapedText = escapeXml(revisedText || ' ');
      const runsXml = `<w:r w:rsidR="${paraRsid}">${rPrXml}<w:t>${escapedText}</w:t></w:r>`;

      return `<w:p${pAttrs}>${pPr}${runsXml}</w:p>`;
    }

    // Extract original paragraphs
    const originalParas = extractParagraphsFromXml(xml);
    
    // Split revised text into paragraphs
    const revisedParas = splitRevisedText(revised_text);

    // Debug logging with detailed info
    console.log(`[exportDocxFinal] ========== PARAGRAPH PROCESSING ==========`);
    console.log(`[exportDocxFinal] Original paragraphs: ${originalParas.length}`);
    console.log(`[exportDocxFinal] Revised paragraphs: ${revisedParas.length}`);
    console.log(`[exportDocxFinal] Revised text length: ${revised_text.length} chars`);
    console.log(`[exportDocxFinal] First 200 chars of revised text: ${revised_text.substring(0, 200)}...`);
    if (revisedParas.length > 0) {
      console.log(`[exportDocxFinal] First revised para (${revisedParas[0].length} chars): ${revisedParas[0].substring(0, 100)}...`);
      if (revisedParas.length > 1) {
        console.log(`[exportDocxFinal] Second revised para (${revisedParas[1].length} chars): ${revisedParas[1].substring(0, 100)}...`);
      }
      if (revisedParas.length > 2) {
        console.log(`[exportDocxFinal] Third revised para (${revisedParas[2].length} chars): ${revisedParas[2].substring(0, 100)}...`);
      }
      if (revisedParas.length > 3) {
        console.log(`[exportDocxFinal] ... and ${revisedParas.length - 3} more paragraphs`);
      }
    }

    // Build final paragraphs - ONLY include revised content, don't add empty original paragraphs
    const rebuiltParas = [];
    
    // Strategy: Use ONLY the revised paragraphs
    // - Map first N revised paragraphs to first N original paragraphs (preserve structure if original exists)
    // - Add remaining revised paragraphs as new paragraphs
    // - DO NOT add empty original paragraphs after revised content
    
    const origCount = originalParas.length;
    const revisedCount = revisedParas.length;
    
    console.log(`[exportDocxFinal] Processing ${revisedCount} revised paragraphs (original has ${origCount} paragraphs, but only using revised content)`);
    
    // Map revised paragraphs to original paragraphs (1:1 up to minimum) - preserve structure
    // But ONLY if we have corresponding revised content
    const minLen = Math.min(origCount, revisedCount);
    for (let i = 0; i < minLen; i++) {
      const origPara = originalParas[i];
      const revisedParaText = revisedParas[i];
      if (origPara && revisedParaText !== undefined && revisedParaText !== null && revisedParaText.trim().length > 0) {
        // Clean: replace multiple spaces/newlines with single space, then trim
        const cleanText = revisedParaText.replace(/\s+/g, ' ').trim();
        const builtPara = buildFinalParagraph(origPara.xml, cleanText);
        // Verify the paragraph was built correctly
        if (builtPara && builtPara.includes('<w:p') && builtPara.includes('</w:p>')) {
          rebuiltParas.push(builtPara);
          console.log(`[exportDocxFinal] Mapped revised para ${i+1} to original para ${i+1} (${revisedParaText.trim().length} chars)`);
        } else {
          console.error(`[exportDocxFinal] ERROR: Failed to build paragraph ${i+1}, result: ${builtPara?.substring(0, 100)}`);
        }
      } else if (revisedParaText && revisedParaText.trim().length > 0) {
        // Revised has content but no original - add as new paragraph
        const cleanText = revisedParaText.replace(/\s+/g, ' ').trim();
        const builtPara = buildFinalParagraph('<w:p></w:p>', cleanText);
        if (builtPara && builtPara.includes('<w:p') && builtPara.includes('</w:p>')) {
          rebuiltParas.push(builtPara);
          console.log(`[exportDocxFinal] Added revised para ${i+1} as new paragraph (${revisedParaText.trim().length} chars)`);
        } else {
          console.error(`[exportDocxFinal] ERROR: Failed to build new paragraph ${i+1}`);
        }
      }
      // Skip empty revised paragraphs - don't add empty original paragraphs
    }
    
    // CRITICAL: Add ALL remaining revised paragraphs as new paragraphs (don't stop at original count)
    if (revisedCount > origCount) {
      const remainingCount = revisedCount - origCount;
      console.log(`[exportDocxFinal] Adding ${remainingCount} additional revised paragraphs as new paragraphs`);
      for (let i = origCount; i < revisedCount; i++) {
        const revisedParaText = revisedParas[i];
        if (revisedParaText && revisedParaText.trim().length > 0) {
          const cleanText = revisedParaText.replace(/\s+/g, ' ').trim();
          const builtPara = buildFinalParagraph('<w:p></w:p>', cleanText);
          if (builtPara && builtPara.includes('<w:p') && builtPara.includes('</w:p>')) {
            rebuiltParas.push(builtPara);
            console.log(`[exportDocxFinal] Added new paragraph ${i - origCount + 1}/${remainingCount} (${revisedParaText.trim().length} chars)`);
          } else {
            console.error(`[exportDocxFinal] ERROR: Failed to build additional paragraph ${i - origCount + 1}`);
          }
        } else {
          console.log(`[exportDocxFinal] Skipping empty paragraph at index ${i}`);
        }
      }
    }
    
    // IMPORTANT: DO NOT add empty original paragraphs - only use what's in the revised text
    // The template might have 592 paragraphs, but if revised only has 68, we only want those 68
    
    console.log(`[exportDocxFinal] FINAL RESULT: Built ${rebuiltParas.length} paragraphs from ${revisedCount} revised paragraphs`);
    console.log(`[exportDocxFinal] ==========================================`);

    // Reconstruct the whole document.xml
    const firstParaIdx = xml.indexOf('<w:p');
    
    let header = '';
    let footer = '';
    
    if (firstParaIdx >= 0) {
      // Extract header (everything before first paragraph)
      header = xml.substring(0, firstParaIdx);
      
      // CRITICAL: Find </w:body> tag to properly close the document
      // Don't use last paragraph's position - use body closing tag
      const bodyEndIdx = xml.lastIndexOf('</w:body>');
      if (bodyEndIdx >= 0) {
        // Extract footer from body end - this includes </w:body> and </w:document>
        footer = xml.substring(bodyEndIdx);
        console.log(`[exportDocxFinal] Footer extracted from body end (${footer.length} chars)`);
        console.log(`[exportDocxFinal] Footer preview: ${footer.substring(0, 200)}...`);
      } else {
        // Fallback: Find the end of the last paragraph
        const lastParaEndIdx = xml.lastIndexOf('</w:p>');
        if (lastParaEndIdx >= 0) {
          // Extract footer (everything after last paragraph)
          footer = xml.substring(lastParaEndIdx + 7); // 7 = '</w:p>'.length
          console.log(`[exportDocxFinal] Footer extracted from last paragraph (${footer.length} chars)`);
          // Ensure footer has closing tags
          if (!footer.includes('</w:body>')) {
            footer = footer + '</w:body></w:document>';
            console.log(`[exportDocxFinal] Added missing closing tags to footer`);
          }
        } else {
          // Last resort: create minimal footer
          footer = '</w:body></w:document>';
          console.log(`[exportDocxFinal] Created minimal footer`);
        }
      }
    } else {
      // No paragraphs found: use whole XML as header
      header = xml;
      footer = '';
    }
    
    // Verify footer contains closing tags
    if (!footer.includes('</w:body>') && !footer.includes('</w:document>')) {
      // Footer is missing closing tags - add them
      footer = footer + '</w:body></w:document>';
      console.log(`[exportDocxFinal] Added missing closing tags to footer`);
    }

    // Validate all paragraphs before joining
    for (let i = 0; i < rebuiltParas.length; i++) {
      const para = rebuiltParas[i];
      if (!para || typeof para !== 'string') {
        console.error(`[exportDocxFinal] ERROR: Paragraph ${i+1} is invalid: ${typeof para}`);
        continue;
      }
      if (!para.includes('<w:p') || !para.includes('</w:p>')) {
        console.error(`[exportDocxFinal] ERROR: Paragraph ${i+1} is missing opening/closing tags`);
        console.error(`[exportDocxFinal] Paragraph content (first 200 chars): ${para.substring(0, 200)}`);
      }
    }
    
    // Rebuild document with final paragraphs (no tracked changes)
    const newBodyContent = rebuiltParas.join('');
    
    // Debug: Verify all paragraphs are being included
    const paraCountInBody = (newBodyContent.match(/<w:p[\s\S]*?<\/w:p>/g) || []).length;
    console.log(`[exportDocxFinal] Paragraphs in rebuilt XML: ${paraCountInBody}`);
    console.log(`[exportDocxFinal] Footer contains: ${footer.substring(0, 200)}...`);
    console.log(`[exportDocxFinal] New body content length: ${newBodyContent.length} chars`);
    
    // Verify header contains <w:body> tag
    if (!header.includes('<w:body')) {
      console.error(`[exportDocxFinal] WARNING: Header missing <w:body> tag!`);
      console.error(`[exportDocxFinal] Header preview: ${header.substring(0, 300)}`);
    }
    
    const newXml = header + newBodyContent + footer;
    
    // Final verification
    const finalParaCount = (newXml.match(/<w:p[\s\S]*?<\/w:p>/g) || []).length;
    console.log(`[exportDocxFinal] FINAL VERIFICATION: ${finalParaCount} paragraphs in complete XML`);
    console.log(`[exportDocxFinal] Expected: ${rebuiltParas.length} paragraphs`);
    if (finalParaCount !== rebuiltParas.length) {
      console.error(`[exportDocxFinal] ERROR: Paragraph count mismatch! Expected ${rebuiltParas.length}, found ${finalParaCount}`);
      // Log sample of actual XML to debug
      const sampleXml = newXml.substring(0, Math.min(2000, newXml.length));
      console.error(`[exportDocxFinal] Sample XML (first 2000 chars): ${sampleXml}`);
    } else {
      console.log(`[exportDocxFinal] SUCCESS: All ${rebuiltParas.length} paragraphs are present in final XML`);
    }
    
    zip.file(docXmlPath, newXml);

    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="final-document.docx"');
    return res.status(200).send(buf);
  } catch (error) {
    return next(new ErrorHandler(error.message || 'Failed to export final docx', 500));
  }
});








// -------------------------------------------------
// Convert HTML to WordprocessingML with styling preserved
// -------------------------------------------------
function convertHtmlToWordprocessingML(html) {
  const escXml = (s) => String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  // Simple HTML parser - extract paragraphs and formatting
  // Remove script and style tags for safety
  // For tracked changes HTML: remove <del> tags (deletions) and unwrap <ins> tags (keep insertions)
  // If this is original HTML (with styling), we'll preserve all formatting tags
  let cleanHtml = html.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  
  // Only remove tracked changes markup if present (for final document download)
  // If original HTML is provided, it shouldn't have these tags, but remove them just in case
  cleanHtml = cleanHtml
    .replace(/<del[^>]*>[\s\S]*?<\/del>/gi, '') // Remove deleted content
    .replace(/<ins[^>]*>/gi, '') // Remove opening <ins> tags
    .replace(/<\/ins>/gi, ''); // Remove closing </ins> tags

  // Split by block-level elements (p, div, h1-h6, li, etc.)
  // For simplicity, we'll treat <p>, <div>, <h1>-<h6>, <li> as paragraphs
  const paraRegex = /<(?:p|div|h[1-6]|li|blockquote)[^>]*>(.*?)<\/(?:p|div|h[1-6]|li|blockquote)>/gis;
  const paragraphs = [];
  let lastIndex = 0;
  let match;

  while ((match = paraRegex.exec(cleanHtml)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = cleanHtml.substring(lastIndex, match.index).trim();
      if (textBefore) {
        paragraphs.push({ html: textBefore, tag: 'p' });
      }
    }
    const tagMatch = match[0].match(/^<(\w+)/);
    const tag = tagMatch ? tagMatch[1].toLowerCase() : 'p';
    paragraphs.push({ html: match[1], tag });
    lastIndex = paraRegex.lastIndex || match.index + match[0].length;
  }

  if (lastIndex < cleanHtml.length) {
    const remaining = cleanHtml.substring(lastIndex).trim();
    if (remaining) {
      paragraphs.push({ html: remaining, tag: 'p' });
    }
  }

  // If no paragraphs found, treat entire HTML as one paragraph
  if (paragraphs.length === 0) {
    paragraphs.push({ html: cleanHtml, tag: 'p' });
  }

  // Convert each paragraph to WordprocessingML
  return paragraphs.map(({ html: paraHtml, tag }) => {
    // Determine heading level
    const headingLevel = tag.match(/^h(\d)$/) ? parseInt(tag.match(/^h(\d)$/)[1]) : null;
    
    // Build paragraph properties for headings
    let pPr = '';
    if (headingLevel) {
      pPr = `<w:pPr><w:pStyle w:val="Heading${headingLevel}"/></w:pPr>`;
    }

    // Parse inline formatting (bold, italic, underline, etc.)
    const runs = parseInlineFormatting(paraHtml);
    const runsXml = runs.map(run => {
      let runProps = '';
      const runTags = [];

      if (run.bold) runTags.push('<w:b/>');
      if (run.italic) runTags.push('<w:i/>');
      if (run.underline) runTags.push('<w:u w:val="single"/>');

      if (runTags.length > 0) {
        runProps = `<w:rPr>${runTags.join('')}</w:rPr>`;
      }

      const text = escXml(run.text);
      if (text.trim()) {
        return `<w:r>${runProps}<w:t xml:space="preserve">${text}</w:t></w:r>`;
      }
      return '';
    }).filter(r => r).join('');

    // If no runs, add empty run to ensure paragraph exists
    if (!runsXml) {
      return `<w:p>${pPr}<w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>`;
    }

    return `<w:p>${pPr}${runsXml}</w:p>`;
  }).join('');
}

// Parse inline formatting from HTML
function parseInlineFormatting(html) {
  const runs = [];
  const stack = [];
  let currentText = '';

  // Remove all HTML tags except formatting tags and extract text with formatting info
  // Process text node by node, tracking formatting state
  let i = 0;
  let inTag = false;
  let tagContent = '';
  
  while (i < html.length) {
    if (html[i] === '<' && html.substring(i).match(/^<\/?[a-z]/i)) {
      // We're entering a tag
      inTag = true;
      tagContent = '';
      i++;
      continue;
    }
    
    if (inTag) {
      if (html[i] === '>') {
        // End of tag
        const fullTag = '<' + tagContent + '>';
        const isClosing = tagContent.startsWith('/');
        const tagName = tagContent.replace(/[\/\s>].*$/, '').toLowerCase();
        
        // Save current run before tag boundary
        if (currentText.trim()) {
          runs.push({ 
            text: currentText, 
            bold: stack.includes('b') || stack.includes('strong'), 
            italic: stack.includes('i') || stack.includes('em'), 
            underline: stack.includes('u') 
          });
          currentText = '';
        }
        
        // Update formatting stack
        if (isClosing) {
          if (tagName === 'strong') {
            const idx = stack.indexOf('b');
            if (idx >= 0) stack.splice(idx, 1);
          } else if (tagName === 'em') {
            const idx = stack.indexOf('i');
            if (idx >= 0) stack.splice(idx, 1);
          } else {
            const idx = stack.indexOf(tagName);
            if (idx >= 0) stack.splice(idx, 1);
          }
        } else {
          if (tagName === 'strong') stack.push('b');
          else if (tagName === 'em') stack.push('i');
          else if (['b', 'i', 'u'].includes(tagName)) stack.push(tagName);
        }
        
        inTag = false;
        tagContent = '';
        i++;
        continue;
      }
      tagContent += html[i];
      i++;
      continue;
    }
    
    // Regular text character
    currentText += html[i];
    i++;
  }
  
  // Save any remaining text
  if (currentText.trim()) {
    runs.push({ 
      text: currentText, 
      bold: stack.includes('b') || stack.includes('strong'), 
      italic: stack.includes('i') || stack.includes('em'), 
      underline: stack.includes('u') 
    });
  }

  // If no runs found, extract plain text
  if (runs.length === 0 && html.trim()) {
    const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return plainText ? [{ text: plainText, bold: false, italic: false, underline: false }] : [];
  }

  return runs.length > 0 ? runs : [{ text: html.replace(/<[^>]+>/g, ' ').trim() || ' ', bold: false, italic: false, underline: false }];
}

// -------------------------------------------------
// Create a DOCX file from plain text or HTML (with styling preserved)
// Expects JSON body with fields: text (string), html (optional string), filename (optional string)
// Returns a downloadable DOCX file with styling preserved if HTML is provided
// -------------------------------------------------
export const createDocxFromText = catchAsyncError(async (req, res, next) => {
  try {
    const { text = '', html = '', filename = 'document.docx' } = req.body || {};
    if (!text && !html) {
      return next(new ErrorHandler('text or html is required', 400));
    }

    // If HTML is provided, use it to preserve styling; otherwise use plain text
    const useHtml = html && html.trim().length > 0;

    const escXml = (s) => String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

    let paragraphXml = '';

    if (useHtml) {
      // Convert HTML to WordprocessingML with styling preserved
      paragraphXml = convertHtmlToWordprocessingML(html);
    } else {
      // Split text into paragraphs (by double newlines or single newlines)
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
      const textToUse = paragraphs.length === 0 ? (text.trim() || '') : paragraphs;

      // Convert each paragraph to WordprocessingML format
      paragraphXml = (Array.isArray(textToUse) ? textToUse : [textToUse]).map(para => {
        // Split by single newlines within paragraphs to preserve line breaks
        const lines = para.split(/\n/).filter(l => l.trim() || para.includes('\n'));
        
        if (lines.length > 1) {
          // Multiple lines - create separate paragraphs
          return lines.map(line => {
            const escapedLine = escXml(line.trim());
            return `<w:p><w:r><w:t xml:space="preserve">${escapedLine}</w:t></w:r></w:p>`;
          }).join('');
        } else {
          // Single paragraph
          const escapedPara = escXml(para.trim());
          return `<w:p><w:r><w:t xml:space="preserve">${escapedPara}</w:t></w:r></w:p>`;
        }
      }).join('');
    }

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:w10="urn:schemas-microsoft-com:office:word" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" mc:Ignorable="w14 wp14">
  <w:body>
    ${paragraphXml}
    <w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;

    const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
</w:settings>`;

    // Enhanced styles to support headings when HTML is converted
    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="480" w:after="0"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:bCs/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="0"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:bCs/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="Heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="0"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading4"><w:name w:val="Heading 4"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="0"/><w:outlineLvl w:val="3"/></w:pPr><w:rPr><w:b/><w:bCs/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading5"><w:name w:val="Heading 5"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="0"/><w:outlineLvl w:val="4"/></w:pPr><w:rPr><w:b/><w:bCs/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:style>
  <w:style w:type="paragraph" w:styleId="Heading6"><w:name w:val="Heading 6"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="0"/><w:outlineLvl w:val="5"/></w:pPr><w:rPr><w:b/><w:bCs/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:style>
</w:styles>`;

    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

    const relsRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;

    const now = new Date().toISOString();
    const safeFilename = filename.replace(/\.docx$/i, '') || 'document';
    
    const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escXml(safeFilename)}</dc:title>
  <dc:creator>Document Generator</dc:creator>
  <cp:lastModifiedBy>Document Generator</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;

    const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Document Generator</Application>
</Properties>`;

    const zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypes);
    const rels = zip.folder('_rels');
    rels.file('.rels', relsRels);
    const docProps = zip.folder('docProps');
    docProps.file('core.xml', coreXml);
    docProps.file('app.xml', appXml);
    const word = zip.folder('word');
    word.file('document.xml', documentXml);
    word.file('styles.xml', stylesXml);
    word.file('settings.xml', settingsXml);
    const wordrels = word.folder('_rels');
    wordrels.file('document.xml.rels', wordRels);

    const buf = await zip.generateAsync({ type: 'nodebuffer' });
    const finalFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${finalFilename}"`);
    return res.status(200).send(buf);
  } catch (error) {
    return next(new ErrorHandler(error.message || 'Failed to create DOCX from text', 500));
  }
});

// -------------------------------------------------
// Convert DOCX with tracked changes to HTML
// Expects multipart/form-data with fields: original_docx (file), revised_text (string)
// Returns HTML with inline tracked changes (red strikethrough for deletions, green underline for additions)
// -------------------------------------------------
export const convertDocxTrackChangesToHtml = catchAsyncError(async (req, res, next) => {
  try {
    const file = req.file; // original .docx
    const { revised_text = '', author = 'AI Assistant' } = req.body || {};
    if (!file || !revised_text) {
      return next(new ErrorHandler('original_docx file and revised_text are required', 400));
    }
    if (!file.mimetype.includes('officedocument.wordprocessingml.document')) {
      return next(new ErrorHandler('original_docx must be a .docx file', 400));
    }

    // Load original .docx
    const zip = await JSZip.loadAsync(file.buffer);
    const docXmlPath = 'word/document.xml';
    const settingsPath = 'word/settings.xml';
    if (!zip.file(docXmlPath)) return next(new ErrorHandler('Invalid docx: word/document.xml missing', 400));
    const xml = await zip.file(docXmlPath).async('string');

    // Enable track revisions in settings
    let settingsXml = zip.file(settingsPath) ? await zip.file(settingsPath).async('string') : null;
    if (!settingsXml) {
      settingsXml =
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<w:settings xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
        'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
        '</w:settings>';
    }

    // Inject revision settings
    if (!settingsXml.includes('<w:rsids')) {
      const rsidBlock =
        `<w:rsids>` +
          `<w:rsidRoot w:val="00ABCDEF"/>` +
          `<w:rsid w:val="00ABCDEF"/>` +
          `<w:rsid w:val="00FEDCBA"/>` +
          `<w:rsid w:val="00A1B2C3"/>` +
          `<w:rsid w:val="00112233"/>` +
          `<w:rsid w:val="00FFEECC"/>` +
        `</w:rsids>`;
      settingsXml = settingsXml.replace('</w:settings>', rsidBlock + '</w:settings>');
    }

    if (!settingsXml.includes('<w:trackRevisions')) {
      settingsXml = settingsXml.replace('</w:settings>', '<w:trackRevisions/></w:settings>');
    }

    if (!settingsXml.includes('<w:revisionView')) {
      const revisionViewTag =
        '<w:revisionView ' +
          'w:markup="true" ' +
          'w:comments="true" ' +
          'w:insDel="true" ' +
          'w:insDelInk="true" ' +
          'w:formatting="true" ' +
          'w:inkAnnotations="true"' +
        '/>';
      settingsXml = settingsXml.replace('</w:settings>', revisionViewTag + '</w:settings>');
    }

    const usedRsids = new Set(['00ABCDEF', '00FEDCBA', '00A1B2C3', '00112233', '00FFEECC']);
    zip.file(settingsPath, settingsXml);

    // Word-level diff helper (reuse from exportDocxTrackChangesInplace)
    const wordDiff = (oldText, newText) => {
      const a = (oldText || '').split(/\s+/).filter(w => w);
      const b = (newText || '').split(/\s+/).filter(w => w);
      const n = a.length, m = b.length;
      const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
      for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
          dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
      }
      const parts = [];
      let i = 0, j = 0;
      while (i < n && j < m) {
        if (a[i] === b[j]) { parts.push({ t: 'same', v: a[i] }); i++; j++; }
        else if (dp[i + 1][j] >= dp[i][j + 1]) { parts.push({ t: 'del', v: a[i++] }); }
        else { parts.push({ t: 'ins', v: b[j++] }); }
      }
      while (i < n) parts.push({ t: 'del', v: a[i++] });
      while (j < m) parts.push({ t: 'ins', v: b[j++] });
      return parts;
    };

    // Extract paragraphs from original XML
    function extractParagraphsFromXml(xml) {
      const paragraphs = [];
      const paraRegex = /<w:p[\s\S]*?<\/w:p>/g;
      const matches = xml.match(paraRegex) || [];
      for (const pXml of matches) {
        const textRuns = [...pXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)]
          .map(m => m[1])
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        paragraphs.push({ xml: pXml, text: textRuns });
      }
      return paragraphs;
    }

    // Split revised text into paragraphs (match frontend: double newlines only)
    function splitRevisedText(text) {
      return text
        .replace(/\r/g, '')
        .split(/\n{2,}/)  // Only split on double newlines (matches frontend)
        .map(p => p.trim())
        .filter(p => p.length > 0);
    }

    // Build tracked paragraph (reuse logic from exportDocxTrackChangesInplace)
    function buildTrackedParagraph(originalPXml, diffParts, author, now, runIdBase = 0, usedRsidsSet = null) {
      function escapeXml(s) {
        return String(s || '')
          .replace(/&/g,'&amp;')
          .replace(/</g,'&lt;')
          .replace(/>/g,'&gt;');
      }

      let pAttrsMatch = originalPXml.match(/^<w:p([^>]*)>/);
      let pAttrs = pAttrsMatch ? pAttrsMatch[1] : '';

      let pPrMatch = originalPXml.match(/<w:pPr[\s\S]*?<\/w:pPr>/);
      let pPr = pPrMatch ? pPrMatch[0] : null;

      if (!pPr) {
        pPr = `<w:pPr><w14:paraChange w:id="${Math.floor(Math.random()*100000)}" w:author="${escapeXml(author)}" w:date="${now}"/></w:pPr>`;
      } else {
        if (!pPr.includes('<w14:paraChange')) {
          pPr = pPr.replace('</w:pPr>', `<w14:paraChange w:id="${Math.floor(Math.random()*100000)}" w:author="${escapeXml(author)}" w:date="${now}"/></w:pPr>`);
        }
      }

      if (!pAttrs || !/w14:paraId=/.test(pAttrs)) {
        const hexPart1 = (Math.random().toString(16).slice(2,8)).toUpperCase().padStart(6, '0');
        const hexPart2 = (Math.random().toString(16).slice(2,8)).toUpperCase().padStart(6, '0');
        const hexPart3 = (Math.random().toString(16).slice(2,8)).toUpperCase().padStart(6, '0');
        const paraId = '00' + hexPart1;
        const textId = '00' + hexPart2;
        const rsid   = '00' + hexPart3;
        if (usedRsidsSet) usedRsidsSet.add(rsid);
        pAttrs = ` w14:paraId="${paraId}" w14:textId="${textId}" w:rsidR="${rsid}" w:rsidRDefault="${rsid}" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"${pAttrs ? ` ${pAttrs.trim()}` : ''}`;
      } else {
        if (!/w:rsidR=/.test(pAttrs)) {
          const hexPart = (Math.random().toString(16).slice(2,8)).toUpperCase().padStart(6, '0');
          const rsid = '00' + hexPart;
          if (usedRsidsSet) usedRsidsSet.add(rsid);
          pAttrs += ` w:rsidR="${rsid}" w:rsidRDefault="${rsid}"`;
        } else {
          const existingRsidMatch = pAttrs.match(/w:rsidR="([^"]+)"/);
          if (existingRsidMatch && usedRsidsSet) usedRsidsSet.add(existingRsidMatch[1]);
        }
      }

      let paraRsid = '';
      if (pAttrs) {
        const rsidMatch = pAttrs.match(/w:rsidR="([^"]+)"/);
        if (rsidMatch) paraRsid = rsidMatch[1];
      }
      if (!paraRsid) {
        const hexPart = (Math.random().toString(16).slice(2,8)).toUpperCase().padStart(6, '0');
        paraRsid = '00' + hexPart;
      }
      if (usedRsidsSet) usedRsidsSet.add(paraRsid);

      let runId = runIdBase;
      let builtRuns = diffParts.map(part => {
        if (!part.v) return '';
        const safe = escapeXml(part.v) + ' ';

        if (part.t === 'same') {
          return `<w:r w:rsidR="${paraRsid}"><w:t xml:space="preserve">${safe}</w:t></w:r>`;
        } else if (part.t === 'del') {
          const currentRunId = runId++;
          const delHexPart = (Math.random().toString(16).slice(2,8)).toUpperCase().padStart(6, '0');
          const delRsid = '00' + delHexPart;
          if (usedRsidsSet) {
            usedRsidsSet.add(delRsid);
            usedRsidsSet.add(paraRsid);
          }
          return `<w:del w:id="${2000 + currentRunId}" w:author="${escapeXml(author)}" w:date="${now}"><w:r w:rsidR="${delRsid}" w:rsidDel="${paraRsid}"><w:delText xml:space="preserve">${safe}</w:delText></w:r></w:del>`;
        } else if (part.t === 'ins') {
          const currentRunId = runId++;
          const insHexPart = (Math.random().toString(16).slice(2,8)).toUpperCase().padStart(6, '0');
          const insRsid = '00' + insHexPart;
          if (usedRsidsSet) {
            usedRsidsSet.add(insRsid);
            usedRsidsSet.add(paraRsid);
          }
          const wordDate = now.replace(/\.\d{3}Z$/, 'Z');
          return `<w:ins w:id="${1000 + currentRunId}" w:author="${escapeXml(author)}" w:date="${wordDate}" w:rsidR="${insRsid}" w:rsidRPr="${insRsid}"><w:r w:rsidR="${insRsid}"><w:t xml:space="preserve">${safe}</w:t></w:r></w:ins>`;
        }
        return '';
      }).filter(x => x);

      const onlyIns = diffParts.length > 0 && diffParts.every(p => p.t === 'ins' || !p.v);
      if (onlyIns) {
        builtRuns.unshift(`<w:r w:rsidR="${paraRsid}"><w:t xml:space="preserve"> </w:t></w:r>`);
      }

      const runsXml = builtRuns.join('');
      return { xml: `<w:p${pAttrs}>${pPr}${runsXml}</w:p>`, nextRunId: runId };
    }

    // Extract original paragraphs
    const originalParas = extractParagraphsFromXml(xml);
    const revisedParas = splitRevisedText(revised_text);

    // Diff each paragraph and rebuild
    const now = new Date().toISOString();
    let globalRunId = 0;
    const rebuiltParas = [];
    
    const maxLen = Math.max(originalParas.length, revisedParas.length);
    for (let i = 0; i < maxLen; i++) {
      const origPara = originalParas[i];
      const revisedParaText = revisedParas[i] || '';
      const origText = origPara ? origPara.text : '';
      const origPXml = origPara ? origPara.xml : '<w:p></w:p>';

      const diffParts = wordDiff(origText, revisedParaText);
      const hasChanges = diffParts.some(p => p.t === 'del' || p.t === 'ins');
      
      if (hasChanges && origPara) {
        const result = buildTrackedParagraph(origPXml, diffParts, author, now, globalRunId, usedRsids);
        rebuiltParas.push(result.xml);
        globalRunId = result.nextRunId;
      } else if (origPara) {
        rebuiltParas.push(origPXml);
      } else if (revisedParaText) {
        const newDiffParts = wordDiff('', revisedParaText);
        const result = buildTrackedParagraph('<w:p></w:p>', newDiffParts, author, now, globalRunId, usedRsids);
        rebuiltParas.push(result.xml);
        globalRunId = result.nextRunId;
      }
    }

    // Reconstruct document.xml
    const firstParaIdx = xml.indexOf('<w:p');
    let header = '';
    let footer = '';
    
    if (firstParaIdx >= 0) {
      header = xml.substring(0, firstParaIdx);
      if (header && !header.includes('xmlns:w14=')) {
        const docTagMatch = header.match(/(<w:document[^>]*>)/);
        if (docTagMatch) {
          let docTag = docTagMatch[1];
          if (!docTag.includes('xmlns:w14=')) {
            docTag = docTag.replace(/>$/, ' xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">');
            header = header.replace(docTagMatch[1], docTag);
          }
          if (!header.includes('mc:Ignorable=')) {
            const docTag2Match = header.match(/(<w:document[^>]*>)/);
            if (docTag2Match) {
              let docTag2 = docTag2Match[1];
              if (!docTag2.includes('xmlns:mc=')) {
                docTag2 = docTag2.replace(/>$/, ' xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"');
              }
              docTag2 = docTag2.replace(/>$/, ' mc:Ignorable="w14 wp14">');
              header = header.replace(docTag2Match[1], docTag2);
            }
          } else if (!header.includes('w14')) {
            header = header.replace(/mc:Ignorable="([^"]+)"/, (match, val) => {
              return val.includes('w14') ? match : `mc:Ignorable="${val} w14 wp14"`;
            });
          }
        }
      }
      
      const lastParaEndIdx = xml.lastIndexOf('</w:p>');
      if (lastParaEndIdx >= 0) {
        footer = xml.substring(lastParaEndIdx + 7);
      } else {
        const bodyEndIdx = xml.lastIndexOf('</w:body>');
        if (bodyEndIdx >= 0) footer = xml.substring(bodyEndIdx);
      }
    } else {
      header = xml;
    }

    const newBodyContent = rebuiltParas.join('');
    const newXml = header + newBodyContent + footer;
    zip.file(docXmlPath, newXml);

    // Update settings.xml with rsids
    let finalSettingsXml = await zip.file(settingsPath).async('string');
    if (usedRsids.size > 0) {
      const rsidEntries = Array.from(usedRsids).map(rsid => `<w:rsid w:val="${rsid}"/>`).join('\n          ');
      const rsidBlock = `<w:rsids><w:rsidRoot w:val="${Array.from(usedRsids)[0]}"/>\n          ${rsidEntries}\n        </w:rsids>`;
      if (finalSettingsXml.includes('<w:rsids')) {
        finalSettingsXml = finalSettingsXml.replace(/<w:rsids[\s\S]*?<\/w:rsids>/, rsidBlock);
      } else {
        finalSettingsXml = finalSettingsXml.replace('</w:settings>', rsidBlock + '\n      </w:settings>');
      }
      zip.file(settingsPath, finalSettingsXml);
    }

    // Generate DOCX buffer
    const docxBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Convert DOCX to HTML using mammoth
    // Mammoth automatically handles w:ins and w:del elements and converts them to <ins> and <del> tags
    const result = await mammoth.convertToHtml({ buffer: docxBuffer }, {
      styleMap: [
        // Ensure tracked changes are preserved
        "w:del[type='deletion'] => del.deletion",
        "w:ins[type='insertion'] => ins.insertion"
      ]
    });

    // Log any messages from mammoth for debugging
    if (result.messages && result.messages.length > 0) {
      console.log('Mammoth conversion messages:', result.messages);
    }

    // Add CSS for tracked changes styling (red strikethrough for deletions, green underline for additions)
    // Enhanced styles to ensure changes are visible
    const htmlWithStyles = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Times New Roman', serif;
            line-height: 1.8;
            color: #000 !important;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
          }
          /* Ensure all text is black by default */
          body * {
            color: #000 !important;
          }
          p, div, span, h1, h2, h3, h4, h5, h6 {
            color: #000 !important;
          }
          /* Green underline for insertions - MUST be visible */
          ins, .insertion {
            color: #006400 !important;
            text-decoration: underline !important;
            text-decoration-color: #006400 !important;
            text-decoration-thickness: 2px !important;
            text-underline-offset: 2px !important;
            background-color: transparent !important;
          }
          /* Red strikethrough for deletions - MUST be visible */
          del, .deletion {
            color: #8B0000 !important;
            text-decoration: line-through !important;
            text-decoration-color: #8B0000 !important;
            text-decoration-thickness: 2px !important;
            background-color: transparent !important;
          }
          p {
            margin: 12px 0;
            color: #000 !important;
          }
          /* Ensure nested elements maintain styles */
          ins *, .insertion * {
            color: inherit !important;
            text-decoration: inherit !important;
          }
          del *, .deletion * {
            color: inherit !important;
            text-decoration: inherit !important;
          }
          /* Override any inline styles that might set red color */
          [style*="color: red"],
          [style*="color:red"],
          [style*="color: #f00"],
          [style*="color:#f00"],
          [style*="color: #ff0000"],
          [style*="color:#ff0000"],
          [style*="color: rgb(255, 0, 0)"],
          [style*="color:rgb(255, 0, 0)"] {
            color: #000 !important;
          }
        </style>
      </head>
      <body>
        ${result.value}
      </body>
      </html>
    `;

    res.status(200).json({
      success: true,
      html: htmlWithStyles,
      messages: result.messages || []
    });
  } catch (error) {
    return next(new ErrorHandler(error.message || 'Failed to convert DOCX to HTML', 500));
  }
});