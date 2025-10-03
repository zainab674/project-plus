// "use client"

// import React, { useState } from 'react';
// import { Plus, User, Calendar, FileText, ChevronRight, MoreVertical, UserPlus, Users, Mail, FileIcon, Image, Edit, Trash2, X, Send } from 'lucide-react';

// export const NotesModal = ({ isOpen, onClose, selectedCase, onAddNote }) => {
//     const [newNote, setNewNote] = useState('');
//     const [authorName, setAuthorName] = useState('');

//     if (!isOpen || !selectedCase) return null;

//     const handleAddNote = () => {
//         if (newNote.trim() && authorName.trim()) {
//             // Call the parent function to add the note
//             if (onAddNote) {
//                 onAddNote({
//                     name: authorName,
//                     note: newNote,
//                     timestamp: new Date().toISOString()
//                 });
//             }

//             // Clear the form
//             setNewNote('');
//             setAuthorName('');
//         }
//     };

//     const handleKeyPress = (e) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault();
//             handleAddNote();
//         }
//     };

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white text-sm rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
//                 <div className="flex justify-between items-center mb-4">
//                     <h3 className="text-xl font-semibold">Case Notes - {selectedCase.title}</h3>
//                     <button
//                         onClick={onClose}
//                         className="text-gray-800 hover:text-black"
//                     >
//                         <X className="w-6 h-6" />
//                     </button>
//                 </div>

//                 {/* Add New Note Section */}
//                 <div className="bg-white rounded-lg p-4 mb-6">
//                     <h4 className="text-sm font-medium text-black mb-3">Add New Note</h4>
//                     <div className="space-y-3">
//                         <div>
//                             <input
//                                 type="text"
//                                 placeholder="Your name"
//                                 value={authorName}
//                                 onChange={(e) => setAuthorName(e.target.value)}
//                                 className="w-full px-3 py-2  text-black rounded-md border border-gray-500 focus:border-purple-400 focus:outline-none text-sm"
//                             />
//                         </div>
//                         <div className="flex gap-2">
//                             <textarea
//                                 placeholder="Write your note here..."
//                                 value={newNote}
//                                 onChange={(e) => setNewNote(e.target.value)}
//                                 onKeyPress={handleKeyPress}
//                                 rows="3"
//                                 className="flex-1 px-2 py-1  text-black rounded-md border border-gray-500 focus:border-purple-400 focus:outline-none resize-none text-sm"
//                             />
//                             <button
//                                 onClick={handleAddNote}
//                                 disabled={!newNote.trim() || !authorName.trim()}
//                                 className=" bg-white hover:bg-gray-300 border border-gray-400  px-3  rounded-md text-sm font-medium flex items-center gap-2"
//                             >
//                                 <Send className="w-4 h-4" />

//                             </button>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Existing Notes */}
//                 <div className="space-y-4">
//                     {selectedCase.tasks && selectedCase.tasks.length > 0 ? (
//                         selectedCase.tasks.map((task, index) => (
//                             <div key={index} className="rounded-lg border border-gray-400 p-4">
//                                 <div className="flex justify-between items-start mb-2">
//                                     <div className="flex items-center gap-2">
//                                         <User className="w-4 h-4 text-black" />
//                                         <span className="font-medium text-black">{task.name}</span>
//                                         {task.timestamp && (
//                                             <span className="text-xs text-black">
//                                                 {new Date(task.timestamp).toLocaleString()}
//                                             </span>
//                                         )}
//                                     </div>

//                                 </div>
//                                 <p className="text-black">{task.note}</p>
//                             </div>
//                         ))
//                     ) : (
//                         <div className="text-center py-8">
//                             <FileText className="h-12 w-12 mx-auto mb-4 text-black" />
//                             <p className="text-gray-700">No notes available for this case</p>
//                         </div>
//                     )}
//                 </div>

//                 <div className="mt-6 flex justify-end">
//                     <button
//                         onClick={onClose}
//                         className=" hover:bg-gray-700 border border-gray-600 px-4 py-2 rounded text-sm font-medium"
//                     >
//                         Close
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };





"use client"

import React, { useState } from 'react';
import { Plus, User, Calendar, FileText, ChevronRight, MoreVertical, UserPlus, Users, Mail, Image, Edit, Trash2, X, Send, Scale } from 'lucide-react';

export const NotesModal = ({ isOpen, onClose, selectedCase, onAddNote }) => {
    const [newNote, setNewNote] = useState('');
    const [authorName, setAuthorName] = useState('');

    if (!isOpen || !selectedCase) return null;

    const handleAddNote = () => {
        if (newNote.trim() && authorName.trim()) {
            // Call the parent function to add the note
            if (onAddNote) {
                onAddNote({
                    name: authorName,
                    note: newNote,
                    timestamp: new Date().toISOString()
                });
            }

            // Clear the form
            setNewNote('');
            setAuthorName('');
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddNote();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-[95vw] max-w-7xl h-[90vh] flex flex-col m-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-8 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <Scale className="w-6 h-6 text-blue-600" />
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">Case Notes</h3>
                            <p className="text-sm text-gray-600 mt-1">{selectedCase.name || selectedCase.title}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Notes Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {/* Existing Notes */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Case History</h4>
                        {selectedCase.Tasks && selectedCase.Tasks.length > 0 ? (
                            selectedCase.Tasks.map((task, index) => (
                                <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <User className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-900 text-base">{task.name}</span>
                                                {task.created_at && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        <span className="text-sm text-gray-500">
                                                            {new Date(task.created_at).toLocaleString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                                        <p className="text-gray-800 leading-relaxed">{task.description || task.note}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                <h5 className="text-lg font-medium text-gray-600 mb-2">No Case Notes Available</h5>
                                <p className="text-gray-500">Add the first note to begin documenting this case.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Fixed Input Section at Bottom */}
                <div className="border-t border-gray-200 bg-white p-6">
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-blue-600" />
                            Add Case Note
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Attorney/Staff Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={authorName}
                                    onChange={(e) => setAuthorName(e.target.value)}
                                    className="w-full px-4 py-3 text-gray-900 bg-white rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Note Content
                                </label>
                                <div className="flex gap-3">
                                    <textarea
                                        placeholder="Enter case note details..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        rows="3"
                                        className="flex-1 px-4 py-3 text-gray-900 bg-white rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none transition-colors"
                                    />
                                    <button
                                        onClick={handleAddNote}
                                        disabled={!newNote.trim() || !authorName.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors min-w-[120px] justify-center self-end"
                                    >
                                        <Send className="w-4 h-4" />
                                        Add Note
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Close Button */}
                <div className="border-t border-gray-200 bg-white p-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};