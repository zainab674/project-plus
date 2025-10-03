// super-small, safe-ish converter for a limited Markdown subset
const escapeHtml = (s) =>
    s.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

export const miniMarkdownToHtml = (md) => {
    if (!md) return '';

    // Normalize newlines
    md = md.replace(/\r\n?/g, '\n').trim();

    // Escape HTML first
    md = escapeHtml(md);

    // Code fences (optional): render as pre/code without syntax highlighting
    md = md.replace(/```([\s\S]*?)```/g, (_m, code) => `<pre><code>${code.replace(/\n/g, '<br>')}</code></pre>`);

    // Headings
    md = md
        .replace(/^###\s+(.*)$/gm, '<h3>$1</h3>')
        .replace(/^##\s+(.*)$/gm, '<h2>$1</h2>')
        .replace(/^#\s+(.*)$/gm, '<h1>$1</h1>');

    // Bold
    md = md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Numbered lists: group consecutive "1. / 2. / ..." lines into one <ol>
    md = md.replace(
        /(?:^|\n)(\d+\.\s.+(?:\n\d+\.\s.+)*)/g,
        (block) => {
            const items = block.trim().split('\n').map(l => l.replace(/^\d+\.\s+/, '').trim());
            const li = items.map(i => `<li>${i}</li>`).join('');
            return `\n<ol>${li}</ol>`;
        }
    );

    // Bullet lists: lines starting with "- " or "• "
    md = md.replace(
        /(?:^|\n)((?:[-|•]\s.+(?:\n[-|•]\s.+)*))/g,
        (block) => {
            const items = block.trim().split('\n').map(l => l.replace(/^[-|•]\s+/, '').trim());
            // If it was actually a heading/ordered list block, ignore
            if (items.length === 1 && (items[0].startsWith('<h1') || items[0].startsWith('<h2') || items[0].startsWith('<h3'))) {
                return block;
            }
            const li = items.map(i => `<li>${i}</li>`).join('');
            return `\n<ul>${li}</ul>`;
        }
    );

    // Split paragraphs around blank lines (but not inside lists or headings)
    // First, temporarily mark block tags to protect them
    md = md.replace(/<(h1|h2|h3|ul|ol|pre|table)[\s>][\s\S]*?<\/\1>/g, (m) => `\u0000${m}\u0000`);
    const parts = md.split(/\n{2,}/).map(p => {
        if (p.includes('\u0000')) return p.replace(/\u0000/g, '');
        // If it already contains list/heading tags in-line, just return
        if (/<(h1|h2|h3|ul|ol|pre|table)/.test(p)) return p;
        // Convert single newlines to <br> within a paragraph
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    });
    return parts.join('\n');
};
