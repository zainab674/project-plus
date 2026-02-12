'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, GitCompare, Download, Eye, Trash2, AlertCircle, CheckCircle, Send, ChevronDown, ChevronUp, X } from 'lucide-react';
import { toast } from 'react-toastify';
import DOMPurify from 'dompurify';

const AILegalDoc = () => {
    const [documents, setDocuments] = useState({
        document1: null,
        document2: null
    });
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonResult, setComparisonResult] = useState(null);
    const [activeTab, setActiveTab] = useState('upload');
    const fileInputRef1 = useRef(null);
    const fileInputRef2 = useRef(null);
    const [rephrasePrompt, setRephrasePrompt] = useState('');
    const [rephraseDocSelection, setRephraseDocSelection] = useState('1');
    const [isRephrasing, setIsRephrasing] = useState(false);
    const [rephraseResult, setRephraseResult] = useState(null);
    const [uploadedFiles, setUploadedFiles] = useState([]); // files managed in sidebar
    const [selectedFileIndexes, setSelectedFileIndexes] = useState([]); // choose up to 2
    const sidebarUploadRef = useRef(null);
    const [chatMessages, setChatMessages] = useState([]); // chat-like transcript
    const [trackOriginal, setTrackOriginal] = useState('');
    const [trackRevised, setTrackRevised] = useState('');
    const [trackParts, setTrackParts] = useState([]);
    const [showTrackPanel, setShowTrackPanel] = useState(false);
    const [trackedChangesHtml, setTrackedChangesHtml] = useState(null);
    const [isLoadingTrackedChanges, setIsLoadingTrackedChanges] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const chatEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    // New state for file-based tracked changes
    const [trackedChangesByFile, setTrackedChangesByFile] = useState({}); // {fileIndex: {original, revised, html, parts}}
    const [selectedFileForChanges, setSelectedFileForChanges] = useState(null); // fileIndex of currently displayed tracked changes
    const [filesWithChangesExpanded, setFilesWithChangesExpanded] = useState(true);
    // State for new documents (created from scratch, no original)
    const [newDocuments, setNewDocuments] = useState([]); // Array of {text, filename, timestamp}
    const [selectedNewDocument, setSelectedNewDocument] = useState(null); // Index of currently selected new document
    // State for tracking individual change acceptance/rejection
    const [changeStates, setChangeStates] = useState({}); // {changeId: 'accepted' | 'rejected' | null}

 

   
    const clearDocuments = () => {
        setDocuments({ document1: null, document2: null });
        setComparisonResult(null);
        setRephraseResult(null);
        setChatMessages([]);
        setTrackedChangesHtml(null);
        setTrackOriginal('');
        setTrackRevised('');
        setTrackParts([]);
        setTrackedChangesByFile({});
        setSelectedFileForChanges(null);
        if (fileInputRef1.current) fileInputRef1.current.value = '';
        if (fileInputRef2.current) fileInputRef2.current.value = '';
    };

  

 

    const computeWordDiff = (oldText, newText) => {
        const a = (oldText || '').split(/\s+/);
        const b = (newText || '').split(/\s+/);
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
            if (a[i] === b[j]) {
                parts.push({ type: 'same', text: a[i] });
                i++; j++;
            } else if (dp[i + 1][j] >= dp[i][j + 1]) {
                parts.push({ type: 'removed', text: a[i] });
                i++;
            } else {
                parts.push({ type: 'added', text: b[j] });
                j++;
            }
        }
        while (i < n) { parts.push({ type: 'removed', text: a[i++] }); }
        while (j < m) { parts.push({ type: 'added', text: b[j++] }); }
        const additions = parts.filter(p => p.type === 'added').map(p => p.text);
        const removals = parts.filter(p => p.type === 'removed').map(p => p.text);
        return { parts, additions, removals };
    };

    // Break text into paragraphs by blank line / newlines
    function splitParas(txt) {
        return (txt || '')
            .replace(/\r/g, '')
            .split(/\n{2,}|\n/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
    }

    // Escape text so it's safe in HTML
    function escapeHtml(str = '') {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    // Word-level LCS diff -> but returns HTML with <del>/<ins>
    function buildTrackedHtml(oldText, newText) {
        const a = (oldText || '').split(/\s+/);
        const b = (newText || '').split(/\s+/);

        const n = a.length, m = b.length;
        const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
        for (let i = n - 1; i >= 0; i--) {
            for (let j = m - 1; j >= 0; j--) {
                dp[i][j] = a[i] === b[j]
                    ? dp[i + 1][j + 1] + 1
                    : Math.max(dp[i + 1][j], dp[i][j + 1]);
            }
        }

        let i = 0, j = 0;
        let htmlParts = [];

        function pushDel(text) {
            if (!text.trim()) return;
            htmlParts.push(`<del class="fx-del">${escapeHtml(text)} </del>`);
        }

        function pushIns(text) {
            if (!text.trim()) return;
            htmlParts.push(`<ins class="fx-ins">${escapeHtml(text)} </ins>`);
        }

        function pushSame(text) {
            if (!text.trim()) return;
            htmlParts.push(`${escapeHtml(text)} `);
        }

        // Buffer so we group consecutive added words into one <ins>...</ins>
        let addBuf = [];
        let delBuf = [];

        function flushAdds() {
            if (addBuf.length) {
                pushIns(addBuf.join(' '));
                addBuf = [];
            }
        }
        function flushDels() {
            if (delBuf.length) {
                pushDel(delBuf.join(' '));
                delBuf = [];
            }
        }
        function flushAll() {
            flushAdds();
            flushDels();
        }

        while (i < n && j < m) {
            if (a[i] === b[j]) {
                // Same word
                flushAll();
                pushSame(a[i]);
                i++; j++;
            } else if (dp[i + 1][j] >= dp[i][j + 1]) {
                // Deletion
                delBuf.push(a[i]);
                i++;
            } else {
                // Insertion
                addBuf.push(b[j]);
                j++;
            }
        }
        while (i < n) {
            delBuf.push(a[i]);
            i++;
        }
        while (j < m) {
            addBuf.push(b[j]);
            j++;
        }
        flushAll();

        return htmlParts.join('').trim();
    }

    /**
     * Take original full doc + revised full doc,
     * do paragraph-by-paragraph diff,
     * return big HTML string that looks like Word redline.
     */
    function makeRedlineHtml(originalDoc, revisedDoc) {
        const oldParas = splitParas(originalDoc);
        const newParas = splitParas(revisedDoc);

        const maxLen = Math.max(oldParas.length, newParas.length);
        let out = '';

        for (let idx = 0; idx < maxLen; idx++) {
            const oldP = oldParas[idx] || '';
            const newP = newParas[idx] || '';

            // buildTrackedHtml does word-level compare for that paragraph
            const diffHtml = buildTrackedHtml(oldP, newP);

            // Wrap like Word paragraph
            out += `<p class="fx-para">${diffHtml}</p>`;
        }

        return out;
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Convert markdown table to HTML table
    const renderMarkdownTable = (text) => {
        if (!text || typeof text !== 'string') return null;

        // Match markdown tables: header row, separator row, data rows
        // Pattern: | col1 | col2 | ... followed by |---|---|... followed by | data | data | ...
        const lines = text.split('\n');
        const parts = [];
        let currentText = '';
        let i = 0;

        while (i < lines.length) {
            const line = lines[i].trim();
            
            // Check if this line looks like a table row (starts and ends with |)
            if (line.startsWith('|') && line.endsWith('|') && line.includes('|')) {
                // Found potential table start
                const tableRows = [];
                let j = i;
                
                // Collect consecutive table rows
                while (j < lines.length) {
                    const rowLine = lines[j].trim();
                    if (rowLine.startsWith('|') && rowLine.endsWith('|') && rowLine.includes('|')) {
                        tableRows.push(rowLine);
                        j++;
                    } else {
                        break;
                    }
                }
                
                // Check if we have a valid table (header + separator + at least one data row)
                if (tableRows.length >= 3) {
                    // Check if second row is a separator (contains only dashes, colons, spaces, and pipes)
                    const separatorRow = tableRows[1];
                    if (/^[\|\s\-:]+$/.test(separatorRow)) {
                        // Valid table found!
                        
                        // Add text before table
                        if (currentText.trim()) {
                            parts.push({ type: 'text', content: currentText.trim() });
                            currentText = '';
                        }
                        
                        // Parse table
                        const headerRow = tableRows[0].split('|').map(cell => cell.trim()).filter(cell => cell);
                        const dataRows = tableRows.slice(2).map(row => 
                            row.split('|').map(cell => cell.trim()).filter(cell => cell)
                        );

                        let tableHtml = '<div class="overflow-x-auto my-4"><table class="min-w-full border-collapse border border-gray-300 bg-white">';
                        
                        // Header
                        if (headerRow.length > 0) {
                            tableHtml += '<thead><tr class="bg-gray-50">';
                            headerRow.forEach(cell => {
                                // Escape HTML in cell content
                                const escapedCell = cell.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                tableHtml += `<th class="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900">${escapedCell}</th>`;
                            });
                            tableHtml += '</tr></thead>';
                        }
                        
                        // Body
                        tableHtml += '<tbody>';
                        dataRows.forEach((row, rowIdx) => {
                            tableHtml += `<tr class="${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`;
                            headerRow.forEach((_, idx) => {
                                const cellContent = row[idx] || '';
                                // Escape HTML in cell content
                                const escapedCell = cellContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                                tableHtml += `<td class="border border-gray-300 px-4 py-2 text-gray-800">${escapedCell}</td>`;
                            });
                            tableHtml += '</tr>';
                        });
                        tableHtml += '</tbody></table></div>';
                        
                        parts.push({ type: 'html', content: tableHtml });
                        
                        i = j; // Skip processed table rows
                        continue;
                    }
                }
            }
            
            // Not a table row, add to current text
            if (i > 0) currentText += '\n';
            currentText += lines[i];
            i++;
        }
        
        // Add remaining text
        if (currentText.trim()) {
            parts.push({ type: 'text', content: currentText.trim() });
        }

        return parts.length > 0 ? parts : null;
    };

    // Render message content (with table support and HTML document styling)
    const renderMessageContent = (content, messageData = null) => {
        // Check if this message contains HTML documents
        if (messageData?.hasHtml && messageData?.htmlDocuments) {
            return (
                <div className="text-sm leading-relaxed">
                    {/* Render text content */}
                    <div className="whitespace-pre-wrap mb-4">{content}</div>
                    
                    {/* Render HTML documents with styling preserved */}
                    <div className="document-comparison-container space-y-4 mt-4">
                        {messageData.htmlDocuments.document1 && (
                            <div className="document-preview-wrapper border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                                <h4 className="font-semibold text-sm mb-3 text-gray-700">
                                    Document 1: {comparisonResult?.files?.[0]?.name || 'Document 1'}
                                </h4>
                                <div 
                                    className="document-preview doc1-preview prose prose-sm max-w-none"
                                    style={{
                                        fontFamily: 'inherit',
                                        lineHeight: '1.6'
                                    }}
                                    dangerouslySetInnerHTML={{ 
                                        __html: DOMPurify.sanitize(messageData.htmlDocuments.document1, {
                                            ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 'b', 'i', 'span', 'div', 'br', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'blockquote', 'pre', 'code'],
                                            ALLOWED_ATTR: ['class', 'style', 'align', 'colspan', 'rowspan'],
                                            ALLOW_DATA_ATTR: false
                                        })
                                    }}
                                />
                            </div>
                        )}
                        
                        {messageData.htmlDocuments.document2 && (
                            <div className="document-preview-wrapper border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                                <h4 className="font-semibold text-sm mb-3 text-gray-700">
                                    Document 2: {comparisonResult?.files?.[1]?.name || 'Document 2'}
                                </h4>
                                <div 
                                    className="document-preview doc2-preview prose prose-sm max-w-none"
                                    style={{
                                        fontFamily: 'inherit',
                                        lineHeight: '1.6'
                                    }}
                                    dangerouslySetInnerHTML={{ 
                                        __html: DOMPurify.sanitize(messageData.htmlDocuments.document2, {
                                            ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 'b', 'i', 'span', 'div', 'br', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'blockquote', 'pre', 'code'],
                                            ALLOWED_ATTR: ['class', 'style', 'align', 'colspan', 'rowspan'],
                                            ALLOW_DATA_ATTR: false
                                        })
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        
        // Original table and text rendering
        const tableParts = renderMarkdownTable(content);
        
        if (!tableParts) {
            // No table, render as plain text
            return <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>;
        }

        // Render mixed content (text + tables)
        return (
            <div className="text-sm leading-relaxed">
                {tableParts.map((part, idx) => {
                    if (part.type === 'html') {
                        return <div key={idx} dangerouslySetInnerHTML={{ __html: part.content }} />;
                    } else {
                        return <div key={idx} className="whitespace-pre-wrap mb-2">{part.content}</div>;
                    }
                })}
            </div>
        );
    };



   

    React.useEffect(() => {
        // Scroll to bottom when messages change
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatMessages]);

    const openLocalFileInNewTab = (file) => {
        try {
            if (!file) return;
            const url = URL.createObjectURL(file);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 5000);
        } catch {}
    };

    // Sidebar file management
    const handleSidebarUpload = (fileList) => {
        if (!fileList || fileList.length === 0) return;
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        const next = [];
        Array.from(fileList).forEach((file) => {
            if (file.size > 10 * 1024 * 1024) return; // skip >10MB
            if (!allowedTypes.includes(file.type)) return;
            next.push(file);
        });
        if (next.length === 0) return;
        setUploadedFiles((prev) => [...prev, ...next].slice(0, 10));
    };

    const toggleSelectFile = (index) => {
        setSelectedFileIndexes((prev) => {
            let out;
            if (prev.includes(index)) {
                out = prev.filter((i) => i !== index);
            } else {
                if (prev.length >= 2) {
                    out = [prev[1] ?? prev[0], index].slice(-2); // keep most recent two
                } else {
                    out = [...prev, index];
                }
            }
            // sync to documents for existing handlers
            const doc1 = out[0] != null ? uploadedFiles[out[0]] : null;
            const doc2 = out[1] != null ? uploadedFiles[out[1]] : null;
            setDocuments({ document1: doc1 || null, document2: doc2 || null });
            return out;
        });
    };

    const removeUploadedFile = (index) => {
        setUploadedFiles((prev) => {
            const copy = [...prev];
            copy.splice(index, 1);
            return copy;
        });
        setSelectedFileIndexes((prev) => prev.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)));
    };

    const filesList = uploadedFiles.map((file, idx) => ({ idx, file }));

    const numDifferences = comparisonResult?.analysis?.differences?.length || 0;

    // Get files that have tracked changes
    const filesWithTrackedChanges = Object.keys(trackedChangesByFile).map(idx => ({
        index: parseInt(idx),
        file: uploadedFiles[parseInt(idx)],
        changeCount: trackedChangesByFile[idx].parts?.filter(p => p.type !== 'same').length || 0
    })).filter(item => item.file);

    // Handle clicking on a file from "Files with changes" dropdown
    const handleFileWithChangesClick = (fileIndex) => {
        const fileChanges = trackedChangesByFile[fileIndex];
        if (fileChanges) {
            setTrackedChangesHtml(fileChanges.html);
            setTrackOriginal(fileChanges.original);
            setTrackRevised(fileChanges.revised);
            setTrackParts(fileChanges.parts);
            setSelectedFileForChanges(fileIndex);
            
            // Add message to chat about showing tracked changes
            const fileName = uploadedFiles[fileIndex]?.name || 'document';
            const changeCount = fileChanges.parts?.filter(p => p.type !== 'same').length || 0;
            const changeMessage = `Showing tracked changes for "${fileName}" (${changeCount} change${changeCount !== 1 ? 's' : ''}).`;
            setChatMessages(prev => [...prev, { role: 'assistant', content: changeMessage }]);
            
            toast.success(`Showing tracked changes for ${uploadedFiles[fileIndex]?.name}`);
        }
    };

    // Group trackParts into individual changes (consecutive added/removed parts grouped together)
    const groupIntoIndividualChanges = (parts) => {
        if (!parts || parts.length === 0) return [];
        
        const changes = [];
        let currentChange = null;
        
        parts.forEach((part, index) => {
            if (part.type === 'same') {
                // Close current change if exists
                if (currentChange) {
                    changes.push(currentChange);
                    currentChange = null;
                }
            } else {
                // Start new change or add to current
                if (!currentChange || currentChange.type !== part.type) {
                    // Close previous change
                    if (currentChange) {
                        changes.push(currentChange);
                    }
                    // Start new change
                    currentChange = {
                        id: `change-${index}`,
                        type: part.type, // 'added' or 'removed'
                        text: part.text,
                        startIndex: index,
                        endIndex: index,
                        parts: [part]
                    };
                } else {
                    // Add to current change
                    currentChange.text += ' ' + part.text;
                    currentChange.endIndex = index;
                    currentChange.parts.push(part);
                }
            }
        });
        
        // Don't forget the last change
        if (currentChange) {
            changes.push(currentChange);
        }
        
        return changes;
    };

    // Calculate dynamic grid columns based on tracked changes visibility
    // When tracked changes are visible: Chat (3) | Tracked (6) | Changes Review (3)
    // When tracked changes are hidden: Chat (9) | Tracked (hidden) | Files (3)
    const chatColSpan = trackedChangesHtml ? 'lg:col-span-3' : 'lg:col-span-9';
    const trackedColSpan = trackedChangesHtml ? 'lg:col-span-6' : 'hidden';
    const rightColSpan = 'lg:col-span-3'; // Shows Changes Review when tracked changes visible, Files when hidden

    // Get individual changes for current tracked changes
    const individualChanges = trackedChangesHtml && trackParts ? groupIntoIndividualChanges(trackParts) : [];

    return (
        <>
        <div className="max-w-[95vw] mx-auto p-6">
            {/* Single 3-column responsive grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Column 1: ChatGPT-style Chat Interface */}
                <div className={`${chatColSpan} flex flex-col bg-white rounded-lg border border-gray-200`} style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
                    {/* Chat Messages Section */}
                    <div 
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4"
                        style={{ minHeight: 0, overflowY: 'auto' }}
                    >
                        {chatMessages.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <p className="text-gray-500 text-sm mb-2">Start a conversation</p>
                                    <p className="text-gray-400 text-xs">Select files and send a message to begin</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {chatMessages.map((msg, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] rounded-lg px-4 py-2.5 ${
                                            msg.role === 'user' 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-gray-100 text-gray-900'
                                        }`}>
                                            {renderMessageContent(msg.content, msg)}
                                        </div>
                                    </div>
                                ))}
                                {isProcessing && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 rounded-lg px-4 py-2.5">
                                            <div className="flex items-center gap-1">
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </>
                        )}
                    </div>

                    {/* Selected Files Display */}
                    {selectedFileIndexes.length > 0 && (
                        <div className="flex-shrink-0 px-4 py-2 border-t border-gray-200 bg-gray-50">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-600 font-medium">Selected:</span>
                                {selectedFileIndexes.map((i) => (
                                    <span 
                                        key={i} 
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs"
                                    >
                                        <FileText className="w-3 h-3" />
                                        {uploadedFiles[i]?.name || `File`}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Section at Bottom */}
                    <div className="flex-shrink-0 border-t border-gray-200 p-4 bg-white rounded-b-lg">
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const selected = selectedFileIndexes.map((i) => uploadedFiles[i]).filter(Boolean);
                                const selectedNames = selected.map((f) => f.name).join(', ');
                                if (!rephrasePrompt.trim()) {
                                    toast.error('Please enter a message.');
                                    return;
                                }

                                // Add user message
                                const userMessage = `${rephrasePrompt}${selectedNames ? `\n\nFiles: ${selectedNames}` : ''}`;
                                setChatMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
                                const currentPrompt = rephrasePrompt;
                                setRephrasePrompt('');
                                setIsProcessing(true);

                                try {
                                    const formData = new FormData();
                                    selected.forEach((file) => formData.append('files', file));
                                    formData.append('prompt', currentPrompt || '');
                                    
                                    // Always check if files have been previously modified
                                    // If so, send the current revised text as current_text so backend uses modified version
                                    // This applies to all operations (compare, modify, analyze, etc.)
                                    if (selectedFileIndexes.length > 0) {
                                        // Check each selected file for previously modified versions
                                        for (const fileIndex of selectedFileIndexes) {
                                            const fileChanges = trackedChangesByFile[fileIndex];
                                            if (fileChanges && fileChanges.revised) {
                                                // Found a previously modified version - send it as current_text
                                                // Backend will use this instead of extracting from the original file
                                                const fileName = uploadedFiles[fileIndex]?.name || '';
                                                formData.append(`current_text_${fileIndex}`, fileChanges.revised);
                                                formData.append(`current_text_filename_${fileIndex}`, fileName);
                                                console.log(`Using previously modified version for ${fileName}`);
                                            }
                                        }
                                    }
                                    
                                    // Also check if modifying a file that has been previously modified
                                    // Additional check for modification-specific behavior
                                    const lowerPrompt = (currentPrompt || '').toLowerCase();
                                    const isModifyingAgain = (lowerPrompt.includes('modify') || 
                                                             lowerPrompt.includes('edit') || 
                                                             lowerPrompt.includes('update') ||
                                                             lowerPrompt.includes('change') ||
                                                             lowerPrompt.includes('add') ||
                                                             lowerPrompt.includes('remove')) &&
                                                             !lowerPrompt.includes('create') &&
                                                             !lowerPrompt.includes('generate') &&
                                                             !lowerPrompt.includes('new');
                                    
                                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8978';
                                    const response = await fetch(`${API_URL}/api/v1/ai-legal-doc/instruct`, {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
                                        body: formData
                                    });
                                    if (!response.ok) {
                                        const errorText = await response.text();
                                        throw new Error(`Server error: ${response.status} - ${errorText}`);
                                    }

                                    // Handle JSON response
                                    const data = await response.json();
                                    
                                    // Extract the appropriate text to display in chat
                                    // Priority: revised_text (modified content) > output_text > final_answer > fallback message
                                    let assistantText = '';
                                    if (data?.revised_text) {
                                        // For modifications, use final_answer as the chat message, not the full revised text
                                        assistantText = data?.ai_final_answer || data?.final_answer || data?.message || 'Document has been modified. Review the changes in the tracked changes panel.';
                                    } else if (data?.output_text) {
                                        assistantText = data.output_text;
                                    } else if (data?.ai_final_answer) {
                                        assistantText = data.ai_final_answer;
                                    } else if (data?.final_answer) {
                                        assistantText = data.final_answer;
                                    } else if (data?.message) {
                                        assistantText = data.message;
                                    } else {
                                        // Fallback: construct a helpful message
                                        if (data?.is_modification) {
                                            assistantText = 'Document has been modified. Review the changes in the tracked changes panel.';
                                        } else if (data?.ai_decision?.create?.length > 0) {
                                            assistantText = `Created new document: ${data.ai_decision.create[0]}`;
                                        } else {
                                            assistantText = 'Processing complete.';
                                        }
                                    }
                                    
                                    setChatMessages((prev) => [...prev, { role: 'assistant', content: assistantText }]);

                                    // Check if this is a new document creation (not a modification)
                                    const isNewDocument = !data?.is_modification && 
                                        (lowerPrompt.includes('create') || 
                                         lowerPrompt.includes('new document') || 
                                         lowerPrompt.includes('generate document') ||
                                         lowerPrompt.includes('make a new document'));
                                    
                                    // Store new document and show it in tracked changes panel
                                    if (isNewDocument && assistantText) {
                                        // Extract a filename from the prompt or use a default
                                        let docFilename = 'document.docx';
                                        if (lowerPrompt.includes('about') || lowerPrompt.includes('regarding')) {
                                            // Try to extract subject from prompt
                                            const match = lowerPrompt.match(/(?:about|regarding|for)\s+([^,\.]+)/i);
                                            if (match && match[1]) {
                                                docFilename = `${match[1].trim().replace(/\s+/g, '_')}.docx`;
                                            }
                                        }
                                        
                                        // If user specifically mentions the document topic in their message, use it
                                        if (currentPrompt.toLowerCase().includes('zainab sarwar') || 
                                            currentPrompt.toLowerCase().includes('accepting the offer')) {
                                            docFilename = 'Zainab_Sarwar_Acceptance_Letter.docx';
                                        }
                                        
                                        // Add to new documents array
                                        const newDoc = {
                                            text: assistantText,
                                            filename: docFilename,
                                            timestamp: new Date().toISOString()
                                        };
                                        setNewDocuments(prev => {
                                            const updated = [...prev, newDoc];
                                            setSelectedNewDocument(updated.length - 1); // Select the newly created document
                                            return updated;
                                        });
                                        
                                        // Show in tracked changes panel (as new content, no original)
                                        setTrackOriginal(''); // No original for new documents
                                        setTrackRevised(assistantText);
                                        setTrackParts([]); // No diff parts for new documents
                                        
                                        // Generate HTML for display (treat as all new content)
                                        try {
                                            // Split by double newlines for paragraphs, then handle single newlines within paragraphs
                                            const paragraphs = assistantText.split(/\n\s*\n/).filter(p => p.trim());
                                            if (paragraphs.length === 0) {
                                                paragraphs.push(assistantText.trim() || '');
                                            }
                                            
                                            const newDocHtml = paragraphs.map(para => {
                                                const lines = para.split(/\n/).filter(l => l.trim() || para.includes('\n'));
                                                if (lines.length > 1) {
                                                    return lines.map(line => 
                                                        line.trim() ? `<div class="fx-para" style="margin: 12px 0;"><p style="margin: 8px 0;">${line.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p></div>` : ''
                                                    ).filter(Boolean).join('');
                                                } else {
                                                    return `<div class="fx-para" style="margin: 12px 0;"><p style="margin: 8px 0;">${para.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p></div>`;
                                                }
                                            }).join('');
                                            
                                            setTrackedChangesHtml(newDocHtml);
                                            
                                            // Add message to chat about new document creation
                                            const newDocMessage = `New document "${docFilename}" has been created. Review it in the tracked changes panel.`;
                                            setChatMessages(prev => [...prev, { role: 'assistant', content: newDocMessage }]);
                                            
                                            setIsLoadingTrackedChanges(false);
                                            toast.success(`New document "${docFilename}" created! Review it in the tracked changes panel.`);
                                        } catch (err) {
                                            console.error('Error generating new document HTML:', err);
                                            setIsLoadingTrackedChanges(false);
                                        }
                                    }

                                    // If this is a document modification response, show tracked changes in middle
                                    if (data?.is_modification) {
                                        // Get revised text - priority: revised_text > output_text > doc output from ai_docs
                                        let revised = data.revised_text;
                                        if (!revised && data.output_text) {
                                            revised = data.output_text;
                                        }
                                        // If still empty, try to get from ai_docs structure
                                        if (!revised && data.ai_docs && data.modified_file) {
                                            const docInfo = data.ai_docs[data.modified_file];
                                            if (docInfo && docInfo.output) {
                                                revised = docInfo.output;
                                            }
                                        }
                                        // Last resort: use assistantText (but this should be final_answer, not the full content)
                                        if (!revised) {
                                            revised = assistantText;
                                        }
                                        
                                        // Find the file index for the modified document first
                                        const modifiedFileName = data.modified_file;
                                        let targetFileIndex = -1;
                                        
                                        // Normalize the modified filename for matching (remove extension, normalize spaces/underscores)
                                        const normalizedModifiedName = modifiedFileName?.toLowerCase()
                                            .replace(/\.(docx|doc|pdf|txt)$/, '')
                                            .replace(/_/g, ' ')
                                            .replace(/\s+/g, ' ')
                                            .trim() || '';
                                        
                                        // Try to find exact or close match
                                        if (normalizedModifiedName) {
                                            // First try exact match after normalization
                                            targetFileIndex = selectedFileIndexes.find(idx => {
                                                const fileName = uploadedFiles[idx]?.name.toLowerCase()
                                                    .replace(/\.(docx|doc|pdf|txt)$/, '')
                                                    .replace(/_/g, ' ')
                                                    .replace(/\s+/g, ' ')
                                                    .trim();
                                                return fileName === normalizedModifiedName;
                                            });
                                            
                    
                                            // If no exact match, try contains match
                                            if (targetFileIndex === -1 || targetFileIndex === undefined) {
                                                targetFileIndex = selectedFileIndexes.find(idx => {
                                                    const fileName = uploadedFiles[idx]?.name.toLowerCase()
                                                        .replace(/\.(docx|doc|pdf|txt)$/, '')
                                                        .replace(/_/g, ' ')
                                                        .replace(/\s+/g, ' ')
                                                        .trim();
                                                    return fileName.includes(normalizedModifiedName) || 
                                                           normalizedModifiedName.includes(fileName);
                                                });
                                            }
                                        }
                                        
                                        // If still no match found, don't default to first file - log error instead
                                        if ((targetFileIndex === -1 || targetFileIndex === undefined) && selectedFileIndexes.length > 0) {
                                            console.error('Could not match modified file:', modifiedFileName, 'Available files:', selectedFileIndexes.map(idx => uploadedFiles[idx]?.name));
                                            // Only use first file as last resort, but log the issue
                                            targetFileIndex = selectedFileIndexes[0];
                                        } else if (targetFileIndex === -1 || targetFileIndex === undefined) {
                                            targetFileIndex = 0;
                                        }
                                        
                                        // Get original text - check if this file has been previously modified
                                        // If so, use the ORIGINAL text from the first modification for cumulative tracking
                                        // If not, use the current original_text from the API response
                                        const previousChanges = trackedChangesByFile[targetFileIndex];
                                        let original = previousChanges?.original || data.original_text;
                                        
                                        // Fallback: if original is still missing, try to get it from uploaded files
                                        if (!original && targetFileIndex >= 0 && uploadedFiles[targetFileIndex]) {
                                            const file = uploadedFiles[targetFileIndex];
                                            if (file.text) {
                                                original = file.text;
                                            }
                                        }
                                        
                                        // Only proceed if we have both original and revised
                                        if (original && revised) {
                                        
                                        // Compute word diff for tracked changes - always against the original file text
                                        const diff = computeWordDiff(original, revised);
                                        setTrackOriginal(original);
                                        setTrackRevised(revised);
                                        setTrackParts(diff.parts);

                                        // Generate redline HTML client-side (Word-style tracked changes)
                                        setIsLoadingTrackedChanges(true);
                                        try {
                                            const redlineHtml = makeRedlineHtml(original || '', revised || '');
                                            setTrackedChangesHtml(redlineHtml);
                                            
                                            // Store tracked changes for this file
                                            // Always preserve the original text (from first modification) for cumulative tracking
                                            // Also preserve original HTML with styling if available (for final document download)
                                            setTrackedChangesByFile(prev => {
                                                const originalStyledHtml = data?.original_html || prev[targetFileIndex]?.originalStyledHtml || null;
                                                return {
                                                    ...prev,
                                                    [targetFileIndex]: {
                                                        original: original, // Always use the first original, not the incremental one
                                                        revised: revised, // Latest revised text
                                                        html: redlineHtml, // Redline HTML for tracked changes display
                                                        originalStyledHtml: originalStyledHtml, // Original HTML with styling (for final download)
                                                        parts: diff.parts
                                                    }
                                                };
                                            });
                                            setSelectedFileForChanges(targetFileIndex);
                                            
                                            // Add message to chat about file change
                                            const fileName = uploadedFiles[targetFileIndex]?.name || modifiedFileName || 'document';
                                            const changeCount = diff.parts.filter(p => p.type !== 'same').length;
                                            const changeMessage = `File "${fileName}" has been modified with ${changeCount} change${changeCount !== 1 ? 's' : ''}. Review the tracked changes in the right panel.`;
                                            setChatMessages(prev => [...prev, { role: 'assistant', content: changeMessage }]);
                                            
                                            setIsLoadingTrackedChanges(false);
                                            toast.success('Document modified! Tracked changes are shown in the middle panel.');
                                        } catch (err) {
                                            console.error('Failed to generate tracked changes HTML:', err);
                                            setIsLoadingTrackedChanges(false);
                                            toast.error(`Error generating tracked changes: ${err.message}`);
                                        }
                                        } else {
                                            // Missing required data for modification
                                            console.error('Missing required data for modification:', { 
                                                hasOriginal: !!original, 
                                                hasRevised: !!revised,
                                                data: data 
                                            });
                                            const errorMsg = 'Document modification was requested, but the response is missing required data. Please try again.';
                                            setChatMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
                                            toast.error('Error: Missing modification data');
                                        }
                                    } else if (selected.length === 1) {
                                        // If single-file transform (not modification), compute change tracking
                                        const fileIndex = selectedFileIndexes[0];
                                        const original = data?.original_text || rephraseResult?.original_text || '';
                                        
                                        // Compute word diff for tracked changes
                                        if (original) {
                                            const diff = computeWordDiff(original, assistantText);
                                            setTrackOriginal(original);
                                            setTrackRevised(assistantText);
                                            setTrackParts(diff.parts);

                                            // Generate redline HTML client-side (Word-style tracked changes)
                                            setIsLoadingTrackedChanges(true);
                                            try {
                                                const redlineHtml = makeRedlineHtml(original || '', assistantText || '');
                                                setTrackedChangesHtml(redlineHtml);
                                                
                                                // Store tracked changes for this file
                                                setTrackedChangesByFile(prev => ({
                                                    ...prev,
                                                    [fileIndex]: {
                                                        original,
                                                        revised: assistantText,
                                                        html: redlineHtml,
                                                        parts: diff.parts
                                                    }
                                                }));
                                                setSelectedFileForChanges(fileIndex);
                                                
                                                // Add message to chat about file change
                                                const fileName = uploadedFiles[fileIndex]?.name || 'document';
                                                const changeCount = diff.parts.filter(p => p.type !== 'same').length;
                                                const changeMessage = `File "${fileName}" has been modified with ${changeCount} change${changeCount !== 1 ? 's' : ''}. Review the tracked changes in the right panel.`;
                                                setChatMessages(prev => [...prev, { role: 'assistant', content: changeMessage }]);
                                                
                                                setIsLoadingTrackedChanges(false);
                                                toast.success('Tracked changes generated');
                                            } catch (err) {
                                                console.error('Failed to generate tracked changes HTML:', err);
                                                setIsLoadingTrackedChanges(false);
                                                toast.error(`Error generating tracked changes: ${err.message}`);
                                            }
                                        }
                                    }
                                } catch (err) {
                                    console.error('Instruct error:', err);
                                    toast.error(`Failed: ${err.message}`);
                                    setChatMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
                                } finally {
                                    setIsProcessing(false);
                                }
                            }}
                            className="flex items-end gap-2"
                        >
                            <div className="flex-1 relative">
                                <textarea
                                    value={rephrasePrompt}
                                    onChange={(e) => {
                                        setRephrasePrompt(e.target.value);
                                        // Auto-resize
                                        const textarea = e.target;
                                        textarea.style.height = 'auto';
                                        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            e.currentTarget.form?.requestSubmit();
                                        }
                                    }}
                                    rows={1}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    placeholder="Type your message..."
                                    style={{ minHeight: '44px', maxHeight: '120px', overflowY: 'auto' }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isProcessing || selectedFileIndexes.length === 0}
                                className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                                title={selectedFileIndexes.length === 0 ? 'Select files first' : 'Send message'}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                        <div className="mt-2 flex gap-2">
                            <button
                                onClick={clearDocuments}
                                className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>

                {/* Column 2: Tracked Changes Preview / Redline Doc */}
                <div className={`${trackedColSpan} flex flex-col gap-4`}>
                    {/* Tracked Changes Summary */}
                    {trackedChangesHtml && !isLoadingTrackedChanges && (
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {selectedNewDocument !== null && newDocuments[selectedNewDocument] ? 'New Document' : 'Tracked Changes'}
                                    </h3>
                                    {selectedNewDocument === null || !newDocuments[selectedNewDocument] ? (
                                        <p className="text-xs text-gray-600 mt-1">
                                            <span className="inline-block mr-3">
                                                <span className="inline-block w-3 h-0.5 bg-green-600 mr-1"></span>
                                                <span className="text-green-700">Added</span>
                                            </span>
                                            <span className="inline-block">
                                                <span className="inline-block w-3 h-0.5 bg-red-600 mr-1"></span>
                                                <span className="text-red-700">Deleted</span>
                                            </span>
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-600 mt-1">
                                            <span className="text-gray-500">New document: {newDocuments[selectedNewDocument].filename}</span>
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedNewDocument !== null && newDocuments[selectedNewDocument] ? (
                                        // Download button for new documents
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const doc = newDocuments[selectedNewDocument];
                                                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8978';
                                                    const response = await fetch(`${API_URL}/api/v1/ai-legal-doc/create-docx-from-text`, {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                                        },
                                                        body: JSON.stringify({
                                                            text: doc.text,
                                                            filename: doc.filename
                                                        })
                                                    });
                                                    
                                                    if (!response.ok) {
                                                        const errorText = await response.text();
                                                        throw new Error(`Server error ${response.status}: ${errorText}`);
                                                    }
                                                    
                                                    const blob = await response.blob();
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = doc.filename;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    document.body.removeChild(a);
                                                    window.URL.revokeObjectURL(url);
                                                    toast.success(`Document "${doc.filename}" downloaded successfully!`);
                                                } catch (e) {
                                                    toast.error(`Failed to download: ${e.message}`);
                                                }
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 flex items-center gap-1"
                                            title="Download document as DOCX"
                                        >
                                            <Download className="w-3 h-3" />
                                            Download
                                        </button>
                                    ) : (
                                        // Download button for modified documents
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const selected = selectedFileIndexes.map(i => uploadedFiles[i]).filter(Boolean);
                                                    if (selected.length === 0) {
                                                        toast.error('Select the original .docx file first');
                                                        return;
                                                    }
                                                    const docx = selected[0];
                                                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8978';
                                                    const form = new FormData();
                                                    form.append('original_docx', docx);
                                                    form.append('revised_text', trackRevised || '');
                                                    const resp = await fetch(`${API_URL}/api/v1/ai-legal-doc/export-docx-track-changes-inplace`, {
                                                        method: 'POST',
                                                        headers: { 'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}` },
                                                        body: form
                                                    });
                                                    if (!resp.ok) {
                                                        const t = await resp.text();
                                                        throw new Error(`Server error ${resp.status}: ${t}`);
                                                    }
                                                    const blob = await resp.blob();
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = 'track-changes-preserved.docx';
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    document.body.removeChild(a);
                                                    URL.revokeObjectURL(url);
                                                    toast.success('Document downloaded successfully');
                                                } catch (e) {
                                                    toast.error(e.message);
                                                }
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-300 rounded hover:bg-blue-50 flex items-center gap-1"
                                            title="Download with preserved styles"
                                        >
                                            <Download className="w-3 h-3" />
                                            Download
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setTrackedChangesHtml(null);
                                            setSelectedFileForChanges(null);
                                            setSelectedNewDocument(null);
                                        }}
                                        className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1 border border-gray-300 rounded"
                                    >
                                        Hide
                                    </button>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500">
                                {selectedNewDocument !== null && newDocuments[selectedNewDocument] ? (
                                    <>
                                        {new Date(newDocuments[selectedNewDocument].timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-600 text-white text-xs" title="New Document">
                                            NEW
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-700 text-white text-xs">
                                            N
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Redline Document */}
                    {isLoadingTrackedChanges && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="text-center text-gray-500 text-sm py-4">Generating tracked changes from document...</div>
                        </div>
                    )}
                    {trackedChangesHtml && !isLoadingTrackedChanges && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6 flex-1 overflow-auto">
                            <div 
                                className="tracked-changes-container bg-white"
                                dangerouslySetInnerHTML={{ __html: trackedChangesHtml }}
                            />
                            <style>{`
                                .tracked-changes-container {
                                    font-family: "Times New Roman", Georgia, serif;
                                    font-size: 16px;
                                    line-height: 1.8;
                                    color: #111;
                                    white-space: normal;
                                }
                                .tracked-changes-container .fx-para {
                                    margin: 12px 0 16px 0;
                                }
                                .tracked-changes-container ins,
                                .tracked-changes-container .fx-ins {
                                    color: #065f46 !important;
                                    text-decoration: underline !important;
                                    text-decoration-color: #065f46 !important;
                                    text-decoration-thickness: 2px !important;
                                    background: transparent !important;
                                    font-weight: inherit !important;
                                }
                                .tracked-changes-container del,
                                .tracked-changes-container .fx-del {
                                    color: #991b1b !important;
                                    text-decoration: line-through !important;
                                    text-decoration-color: #991b1b !important;
                                    text-decoration-thickness: 2px !important;
                                    background: transparent !important;
                                    font-weight: inherit !important;
                                }
                            `}</style>
                        </div>
                    )}
                    {!trackedChangesHtml && !isLoadingTrackedChanges && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6 flex-1">
                            {filesWithTrackedChanges.length > 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 text-sm mb-4">
                                        Tracked changes are hidden. Select a file from "Files with changes" to view tracked changes.
                                    </p>
                                    <div className="space-y-2">
                                        {filesWithTrackedChanges.map(({ index, file, changeCount }) => (
                                            <button
                                                key={index}
                                                onClick={() => handleFileWithChangesClick(index)}
                                                className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                            >
                                                Show changes for {file.name} ({changeCount} changes)
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : trackOriginal && trackRevised ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 text-sm mb-4">
                                        Tracked changes are hidden. Click below to show them again.
                                    </p>
                                    <button
                                        onClick={() => {
                                            setIsLoadingTrackedChanges(true);
                                            try {
                                                const redlineHtml = makeRedlineHtml(trackOriginal, trackRevised);
                                                setTrackedChangesHtml(redlineHtml);
                                                setIsLoadingTrackedChanges(false);
                                                toast.success('Tracked changes restored');
                                            } catch (err) {
                                                console.error('Failed to regenerate tracked changes HTML:', err);
                                                setIsLoadingTrackedChanges(false);
                                                toast.error(`Error regenerating tracked changes: ${err.message}`);
                                            }
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                                    >
                                        Show Tracked Changes
                                    </button>
                                </div>
                            ) : (
                                <div className="text-gray-500 text-sm text-center py-8">
                                    {chatMessages.length === 0 
                                        ? 'Your document with tracked changes will appear here after processing.' 
                                        : 'Process a document to see tracked changes here.'}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Column 3: Changes Review Panel (when tracked changes visible) OR Files (when tracked changes hidden) */}
                <div className={rightColSpan}>
                    <div className={trackedChangesHtml ? '' : 'sticky top-24 space-y-4'}>
                        {/* Changes Review Panel - shown when tracked changes are visible */}
                        {trackedChangesHtml && (() => {
                            const totalChanges = individualChanges.length;
                            
                            // Check if all changes are accepted
                            const allAccepted = individualChanges.length > 0 && individualChanges.every(change => changeStates[change.id] === 'accepted');
                            
                            const handleAcceptAll = () => {
                                const newStates = {};
                                individualChanges.forEach(change => {
                                    newStates[change.id] = 'accepted';
                                });
                                setChangeStates(prev => ({ ...prev, ...newStates }));
                                toast.success('All changes accepted');
                            };
                            
                            const handleRejectAll = () => {
                                const newStates = {};
                                individualChanges.forEach(change => {
                                    newStates[change.id] = 'rejected';
                                });
                                setChangeStates(prev => ({ ...prev, ...newStates }));
                                toast.success('All changes rejected');
                            };
                            
                            const handleAcceptChange = (changeId) => {
                                setChangeStates(prev => ({ ...prev, [changeId]: 'accepted' }));
                            };
                            
                            const handleRejectChange = (changeId) => {
                                setChangeStates(prev => ({ ...prev, [changeId]: 'rejected' }));
                            };
                            
                            const handleDownloadFinal = async () => {
                                try {
                                    // Get the full revised text - prefer from trackedChangesByFile if available for completeness
                                    let revisedTextToUse = trackRevised;
                                    if (selectedFileForChanges !== null && trackedChangesByFile[selectedFileForChanges]) {
                                        const fileChanges = trackedChangesByFile[selectedFileForChanges];
                                        if (fileChanges.revised && fileChanges.revised.length > (revisedTextToUse?.length || 0)) {
                                            // Use the longer version to ensure we have all content
                                            revisedTextToUse = fileChanges.revised;
                                        } else if (fileChanges.revised) {
                                            revisedTextToUse = fileChanges.revised;
                                        }
                                    }
                                    
                                    if (!revisedTextToUse || revisedTextToUse.trim().length === 0) {
                                        toast.error('No revised text available');
                                        return;
                                    }
                                    
                                    const fileName = selectedFileForChanges !== null && uploadedFiles[selectedFileForChanges] 
                                        ? uploadedFiles[selectedFileForChanges].name.replace(/\.(docx|doc|pdf|txt)$/i, '') + '_final.docx'
                                        : 'document_final.docx';
                                    
                                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8978';
                                    
                                    // Check if we have the original DOCX file to use for structure preservation
                                    // Use selectedFileForChanges to get the file that was modified
                                    const originalFile = selectedFileForChanges !== null && uploadedFiles[selectedFileForChanges] 
                                        ? uploadedFiles[selectedFileForChanges] 
                                        : (selectedFileIndexes.length > 0 ? uploadedFiles[selectedFileIndexes[0]] : null);
                                    
                                    if (originalFile && originalFile.type?.includes('officedocument.wordprocessingml.document')) {
                                        // Use the new endpoint that preserves original DOCX structure
                                        const form = new FormData();
                                        form.append('original_docx', originalFile);
                                        form.append('revised_text', revisedTextToUse || '');
                                        
                                        const response = await fetch(`${API_URL}/api/v1/ai-legal-doc/export-docx-final`, {
                                            method: 'POST',
                                            headers: {
                                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                            },
                                            body: form
                                        });
                                        
                                        if (!response.ok) {
                                            const errorText = await response.text();
                                            throw new Error(`Server error ${response.status}: ${errorText}`);
                                        }
                                        
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = fileName;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                        toast.success(`Document "${fileName}" downloaded successfully!`);
                                    } else {
                                        // Fallback to create-docx-from-text if original DOCX is not available
                                        // Get HTML version if available (for styling preservation)
                                        let htmlContent = null;
                                        if (selectedFileForChanges !== null && trackedChangesByFile[selectedFileForChanges]) {
                                            const fileChanges = trackedChangesByFile[selectedFileForChanges];
                                            if (fileChanges.originalStyledHtml) {
                                                htmlContent = fileChanges.originalStyledHtml;
                                            } else if (fileChanges.html) {
                                                htmlContent = fileChanges.html;
                                            }
                                        }
                                        if (!htmlContent && trackedChangesHtml) {
                                            htmlContent = trackedChangesHtml;
                                        }
                                        
                                        const response = await fetch(`${API_URL}/api/v1/ai-legal-doc/create-docx-from-text`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                                            },
                                            body: JSON.stringify({
                                                text: revisedTextToUse || trackRevised,
                                                html: htmlContent || undefined,
                                                filename: fileName
                                            })
                                        });
                                        
                                        if (!response.ok) {
                                            const errorText = await response.text();
                                            throw new Error(`Server error ${response.status}: ${errorText}`);
                                        }
                                        
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = fileName;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        window.URL.revokeObjectURL(url);
                                        toast.success(`Document "${fileName}" downloaded successfully!`);
                                    }
                                } catch (e) {
                                    toast.error(`Failed to download: ${e.message}`);
                                }
                            };
                            
                            return (
                                <div className="bg-white rounded-lg border border-gray-200" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
                                    <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    className="text-xs text-gray-600 hover:text-gray-800"
                                                    title="Toggle show/hide accepted/rejected"
                                                >
                                                    Show ✓ / X
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-sm font-semibold text-gray-900">
                                                Made {totalChanges} change{totalChanges !== 1 ? 's' : ''}
                                            </div>
                                            {allAccepted && (
                                                <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                                    <CheckCircle className="w-3 h-3" />
                                                    <span>All Accepted</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-600 mb-3">
                                            The agreement was comprehensively rephrased for plain-English readability while meticulously...
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleAcceptAll}
                                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                                                title="Accept all changes"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Accept All</span>
                                            </button>
                                            <button
                                                onClick={handleRejectAll}
                                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                                                title="Reject all changes"
                                            >
                                                <X className="w-4 h-4" />
                                                <span>Reject All</span>
                                            </button>
                                        </div>
                                        {allAccepted && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <button
                                                    onClick={handleDownloadFinal}
                                                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                                                    title="Download final document without tracked changes"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    <span>Download Final Document</span>
                                                </button>
                                                <p className="text-xs text-gray-500 mt-2 text-center">
                                                    Download the document with all accepted changes applied (no tracked changes)
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
                                        {individualChanges.length === 0 ? (
                                            <div className="text-center text-gray-500 text-sm py-8">
                                                No changes to review
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {individualChanges.map((change, idx) => {
                                                    const changeState = changeStates[change.id] || null;
                                                    const isAccepted = changeState === 'accepted';
                                                    const isRejected = changeState === 'rejected';
                                                    
                                                    // Generate a description for the change
                                                    const changeDescription = change.type === 'added' 
                                                        ? `Added: "${change.text.length > 50 ? change.text.substring(0, 50) + '...' : change.text}"`
                                                        : `Removed: "${change.text.length > 50 ? change.text.substring(0, 50) + '...' : change.text}"`;
                                                    
                                                    return (
                                                        <div 
                                                            key={change.id}
                                                            className={`border rounded-lg p-3 ${
                                                                isAccepted ? 'bg-green-50 border-green-200' : 
                                                                isRejected ? 'bg-red-50 border-red-200' : 
                                                                'bg-white border-gray-200'
                                                            }`}
                                                        >
                                                            <div className="text-xs text-gray-600 mb-2">
                                                                {changeDescription}
                                                            </div>
                                                            {change.text.length > 50 && (
                                                                <div className={`text-xs mb-2 px-2 py-1 rounded ${
                                                                    change.type === 'added' 
                                                                        ? 'bg-green-100 text-green-800' 
                                                                        : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                    {change.text}
                                                                </div>
                                                            )}
                                                            <div className="flex gap-2 mt-2">
                                                                <button
                                                                    onClick={() => handleAcceptChange(change.id)}
                                                                    disabled={isAccepted}
                                                                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                                                                        isAccepted 
                                                                            ? 'bg-green-600 text-white cursor-not-allowed' 
                                                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                    }`}
                                                                >
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectChange(change.id)}
                                                                    disabled={isRejected}
                                                                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                                                                        isRejected 
                                                                            ? 'bg-red-600 text-white cursor-not-allowed' 
                                                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                                    }`}
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                        
                        {/* Files list - shown when tracked changes are NOT visible */}
                        {!trackedChangesHtml && (
                            
                            <>
                            {/* Files list */}
                            <div className="bg-white rounded-lg border border-gray-200">
                            <div className="px-4 py-3 border-b border-gray-200 font-semibold text-sm">Files {filesList.length > 0 && <span className="text-gray-500 ml-1 text-xs">{filesList.length}</span>}</div>
                            <div className="divide-y divide-gray-100">
                                <div className="px-4 py-3">
                                    <input
                                        ref={sidebarUploadRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => { handleSidebarUpload(e.target.files); if (sidebarUploadRef.current) sidebarUploadRef.current.value = ''; }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => sidebarUploadRef.current?.click()}
                                        className="w-full px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                                    >
                                        Add files
                                    </button>
                                </div>
                                {filesList.length === 0 && (
                                    <div className="px-4 py-3 text-sm text-gray-500">No files uploaded yet</div>
                                )}
                                {filesList.map(({ idx, file }) => (
                                    <div key={idx} className="px-4 py-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    className="mt-1 flex-shrink-0"
                                                    checked={selectedFileIndexes.includes(idx)}
                                                    onChange={() => toggleSelectFile(idx)}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm font-medium text-gray-800 truncate">{file.name}</div>
                                                    <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                                                    <div className="mt-1 flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openLocalFileInNewTab(file)}
                                                            className="text-blue-600 text-xs hover:underline"
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeUploadedFile(idx)}
                                                            className="text-red-600 text-xs hover:underline"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedFileIndexes.includes(idx) && (
                                                <span className="text-xs text-green-600 flex-shrink-0">Selected</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Files with changes summary */}
                        <div className="bg-white rounded-lg border border-gray-200">
                            <div 
                                className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => setFilesWithChangesExpanded(!filesWithChangesExpanded)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {filesWithChangesExpanded ? (
                                            <ChevronUp className="w-4 h-4 text-gray-500" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                        )}
                                        <div className="text-sm font-medium text-gray-800">
                                            {filesWithTrackedChanges.length > 0 
                                                ? `${filesWithTrackedChanges.length} files with changes` 
                                                : 'No file changes detected'}
                                        </div>
                                    </div>
                                </div>
                                {filesWithTrackedChanges.length > 0 && (
                                    <div className="mt-2 text-xs text-gray-600 ml-6">
                                        {filesWithTrackedChanges.reduce((sum, f) => sum + f.changeCount, 0)} changes to review
                                    </div>
                                )}
                            </div>
                            {filesWithChangesExpanded && filesWithTrackedChanges.length > 0 && (
                                <div className="divide-y divide-gray-100 border-t border-gray-200">
                                    {filesWithTrackedChanges.map(({ index, file, changeCount }) => (
                                        <div 
                                            key={index}
                                            className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                                                selectedFileForChanges === index ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                                            }`}
                                            onClick={() => handleFileWithChangesClick(index)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-medium text-gray-800 truncate">{file.name}</div>
                                                        <div className="text-xs text-gray-500">{changeCount} changes</div>
                                                    </div>
                                                </div>
                                                {selectedFileForChanges === index && (
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Focus on section */}
                        {selectedFileForChanges !== null && uploadedFiles[selectedFileForChanges] && (
                            <div className="bg-white rounded-lg border border-gray-200">
                                <div className="px-4 py-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-sm font-medium text-gray-800">Focus on</div>
                                        <button
                                            onClick={() => {
                                                setTrackedChangesHtml(null);
                                                setSelectedFileForChanges(null);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-700">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                        <span className="truncate">{uploadedFiles[selectedFileForChanges]?.name}</span>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        Edit and discuss the files in this project
                                    </div>
                                </div>
                            </div>
                        )}
                        </>
                        )}
                    </div>
                </div>
            </div>
        </div>
        {showTrackPanel && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <div className="font-semibold">Track Changes</div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={async () => {
                                    try {
                                        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8978';
                                        const resp = await fetch(`${API_URL}/api/v1/ai-legal-doc/export-docx-track-changes`, {
                                            method: 'POST',
                                            headers: {
                                                'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}`,
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({ original_text: trackOriginal, revised_text: trackRevised })
                                        });
                                        if (!resp.ok) {
                                            const t = await resp.text();
                                            throw new Error(`Server error ${resp.status}: ${t}`);
                                        }
                                        const blob = await resp.blob();
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = 'track-changes.docx';
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                    } catch (e) {
                                        toast.error(e.message);
                                    }
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Download .docx (Track Changes)
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const selected = selectedFileIndexes.map(i => uploadedFiles[i]).filter(Boolean);
                                        if (selected.length === 0) {
                                            toast.error('Select the original .docx file first');
                                            return;
                                        }
                                        const docx = selected[0];
                                        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8978';
                                        const form = new FormData();
                                        form.append('original_docx', docx);
                                        form.append('revised_text', trackRevised || '');
                                        const resp = await fetch(`${API_URL}/api/v1/ai-legal-doc/export-docx-track-changes-inplace`, {
                                            method: 'POST',
                                            headers: { 'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('authToken') : ''}` },
                                            body: form
                                        });
                                        if (!resp.ok) {
                                            const t = await resp.text();
                                            throw new Error(`Server error ${resp.status}: ${t}`);
                                        }
                                        const blob = await resp.blob();
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = 'track-changes-preserved.docx';
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                    } catch (e) {
                                        toast.error(e.message);
                                    }
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                Download .docx (Preserve styles - beta)
                            </button>
                            <button onClick={() => setShowTrackPanel(false)} className="text-sm text-gray-600 hover:text-gray-800">Close</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-0">
                        <div className="flex min-h-full">
                            <div className="w-1/2 border-r border-gray-200 p-4 whitespace-pre-wrap">{trackOriginal}</div>
                            <div className="w-1/2 p-4 whitespace-pre-wrap">
                                {trackParts.map((p, i) => (
                                    <span key={i} className={`${p.type === 'added' ? 'bg-green-50 text-green-800 underline' : p.type === 'removed' ? 'bg-red-50 text-red-800 line-through' : ''}`}>{p.text}{' '}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        
        </>
    );
};

export default AILegalDoc;
