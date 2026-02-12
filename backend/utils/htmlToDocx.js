import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import TurndownService from 'turndown';

/**
 * Converts HTML content to a DOCX file buffer
 * @param {string} htmlContent - The HTML content to convert
 * @returns {Promise<Buffer>} - The DOCX file as a buffer
 */
export async function htmlToDocx(htmlContent) {
    try {
        // Initialize Turndown to convert HTML to Markdown
        const turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced'
        });

        // Convert HTML to Markdown
        const markdown = turndownService.turndown(htmlContent);

        // Parse the markdown and create document paragraphs
        const paragraphs = [];
        const lines = markdown.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Skip empty lines
            if (!line.trim()) {
                paragraphs.push(new Paragraph({ text: '' }));
                continue;
            }

            // Handle headings
            if (line.startsWith('# ')) {
                paragraphs.push(new Paragraph({
                    text: line.substring(2),
                    heading: HeadingLevel.HEADING_1
                }));
            } else if (line.startsWith('## ')) {
                paragraphs.push(new Paragraph({
                    text: line.substring(3),
                    heading: HeadingLevel.HEADING_2
                }));
            } else if (line.startsWith('### ')) {
                paragraphs.push(new Paragraph({
                    text: line.substring(4),
                    heading: HeadingLevel.HEADING_3
                }));
            } else if (line.startsWith('#### ')) {
                paragraphs.push(new Paragraph({
                    text: line.substring(5),
                    heading: HeadingLevel.HEADING_4
                }));
            } else {
                // Handle regular text with formatting
                const textRuns = parseFormattedText(line);
                paragraphs.push(new Paragraph({
                    children: textRuns
                }));
            }
        }

        // Create the document
        const doc = new Document({
            sections: [{
                properties: {},
                children: paragraphs
            }]
        });

        // Generate buffer
        const buffer = await Packer.toBuffer(doc);
        return buffer;
    } catch (error) {
        console.error('Error converting HTML to DOCX:', error);
        throw new Error('Failed to convert HTML to DOCX: ' + error.message);
    }
}

/**
 * Parse text with markdown formatting (bold, italic, etc.)
 * @param {string} text - The text to parse
 * @returns {Array} - Array of TextRun objects
 */
function parseFormattedText(text) {
    const textRuns = [];

    // Simple regex patterns for bold, italic, and bold+italic
    const boldItalicRegex = /\*\*\*(.+?)\*\*\*/g;
    const boldRegex = /\*\*(.+?)\*\*/g;
    const italicRegex = /\*(.+?)\*/g;
    const underlineRegex = /__(.+?)__/g;

    let lastIndex = 0;
    let match;

    // First, handle bold+italic (***text***)
    const segments = [];
    let currentText = text;

    // Process bold+italic
    while ((match = boldItalicRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ text: text.substring(lastIndex, match.index), bold: false, italic: false });
        }
        segments.push({ text: match[1], bold: true, italic: true });
        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        segments.push({ text: text.substring(lastIndex), bold: false, italic: false });
    }

    // If no special formatting found, return plain text
    if (segments.length === 0) {
        // Check for bold
        if (text.includes('**')) {
            return parseWithPattern(text, boldRegex, { bold: true });
        }
        // Check for italic
        if (text.includes('*')) {
            return parseWithPattern(text, italicRegex, { italics: true });
        }
        // Check for underline
        if (text.includes('__')) {
            return parseWithPattern(text, underlineRegex, { underline: {} });
        }

        return [new TextRun({ text })];
    }

    // Convert segments to TextRuns
    for (const segment of segments) {
        const options = { text: segment.text };
        if (segment.bold) options.bold = true;
        if (segment.italic) options.italics = true;
        textRuns.push(new TextRun(options));
    }

    return textRuns.length > 0 ? textRuns : [new TextRun({ text })];
}

/**
 * Parse text with a specific pattern
 * @param {string} text - The text to parse
 * @param {RegExp} pattern - The regex pattern
 * @param {Object} formatting - The formatting to apply
 * @returns {Array} - Array of TextRun objects
 */
function parseWithPattern(text, pattern, formatting) {
    const textRuns = [];
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            textRuns.push(new TextRun({ text: text.substring(lastIndex, match.index) }));
        }
        // Add formatted text
        textRuns.push(new TextRun({ text: match[1], ...formatting }));
        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        textRuns.push(new TextRun({ text: text.substring(lastIndex) }));
    }

    return textRuns.length > 0 ? textRuns : [new TextRun({ text })];
}
