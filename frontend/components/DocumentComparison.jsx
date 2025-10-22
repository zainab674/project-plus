'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, GitCompare, Download, Eye, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const DocumentComparison = () => {
    const [documents, setDocuments] = useState({
        document1: null,
        document2: null
    });
    const [isComparing, setIsComparing] = useState(false);
    const [comparisonResult, setComparisonResult] = useState(null);
    const [activeTab, setActiveTab] = useState('upload');
    const fileInputRef1 = useRef(null);
    const fileInputRef2 = useRef(null);

    const handleFileUpload = (file, documentNumber) => {
        if (!file) return;

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload PDF, Word, or text files only');
            return;
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setDocuments(prev => ({
            ...prev,
            [`document${documentNumber}`]: file
        }));

        toast.success(`Document ${documentNumber} uploaded successfully`);
    };

    const handleCompare = async () => {
        if (!documents.document1 || !documents.document2) {
            toast.error('Please upload both documents before comparing');
            return;
        }

        setIsComparing(true);
        setComparisonResult(null);

        try {
            const formData = new FormData();
            formData.append('document1', documents.document1);
            formData.append('document2', documents.document2);
            formData.append('comparison_type', 'detailed');

            console.log('📄 Frontend: Sending documents:', {
                document1: documents.document1?.name,
                document2: documents.document2?.name,
                document1Size: documents.document1?.size,
                document2Size: documents.document2?.size
            });

            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8978';
            const response = await fetch(`${API_URL}/api/v1/document-comparison/upload-and-compare`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: formData
            });

            console.log('📄 Frontend: Response status:', response.status);
            console.log('📄 Frontend: Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                const errorText = await response.text();
                console.error('📄 Frontend: Error response:', errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('📄 Frontend: Response data:', data);

            if (data.success) {
                setComparisonResult(data);
                toast.success('Documents compared successfully!');
                setActiveTab('results');
            } else {
                throw new Error(data.message || 'Comparison failed');
            }
        } catch (error) {
            console.error('Comparison error:', error);
            toast.error(`Failed to compare documents: ${error.message}`);
        } finally {
            setIsComparing(false);
        }
    };

    const clearDocuments = () => {
        setDocuments({ document1: null, document2: null });
        setComparisonResult(null);
        if (fileInputRef1.current) fileInputRef1.current.value = '';
        if (fileInputRef2.current) fileInputRef2.current.value = '';
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getSimilarityColor = (percentage) => {
        if (percentage >= 80) return 'text-green-600';
        if (percentage >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getSimilarityBgColor = (percentage) => {
        if (percentage >= 80) return 'bg-green-100';
        if (percentage >= 60) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    React.useEffect(() => {
        // Component mounted
    }, []);

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Comparison</h1>
                <p className="text-gray-600">Upload two documents and get AI-powered comparison analysis</p>
            </div>

            {/* Tabs */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('upload')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'upload'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Upload className="w-4 h-4 inline mr-2" />
                            Upload & Compare
                        </button>
                        <button
                            onClick={() => setActiveTab('results')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'results'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Eye className="w-4 h-4 inline mr-2" />
                            Results
                        </button>
                    </nav>
                </div>
            </div>

            {/* Upload Tab */}
            {activeTab === 'upload' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Document 1 */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                            <div className="text-center">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Document 1</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Upload PDF, Word, or text file
                                </p>
                                
                                <input
                                    ref={fileInputRef1}
                                    type="file"
                                    accept=".pdf,.doc,.docx,.txt"
                                    onChange={(e) => handleFileUpload(e.target.files[0], 1)}
                                    className="hidden"
                                />
                                
                                <button
                                    onClick={() => fileInputRef1.current?.click()}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Choose File
                                </button>
                                
                                {documents.document1 && (
                                    <div className="mt-4 p-3 bg-green-50 rounded-md">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-green-800">
                                                    {documents.document1.name}
                                                </p>
                                                <p className="text-xs text-green-600">
                                                    {formatFileSize(documents.document1.size)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setDocuments(prev => ({ ...prev, document1: null }));
                                                    if (fileInputRef1.current) fileInputRef1.current.value = '';
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Document 2 */}
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                            <div className="text-center">
                                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Document 2</h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Upload PDF, Word, or text file
                                </p>
                                
                                <input
                                    ref={fileInputRef2}
                                    type="file"
                                    accept=".pdf,.doc,.docx,.txt"
                                    onChange={(e) => handleFileUpload(e.target.files[0], 2)}
                                    className="hidden"
                                />
                                
                                <button
                                    onClick={() => fileInputRef2.current?.click()}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Choose File
                                </button>
                                
                                {documents.document2 && (
                                    <div className="mt-4 p-3 bg-green-50 rounded-md">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-green-800">
                                                    {documents.document2.name}
                                                </p>
                                                <p className="text-xs text-green-600">
                                                    {formatFileSize(documents.document2.size)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setDocuments(prev => ({ ...prev, document2: null }));
                                                    if (fileInputRef2.current) fileInputRef2.current.value = '';
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Compare Button */}
                    <div className="text-center">
                        <button
                            onClick={handleCompare}
                            disabled={!documents.document1 || !documents.document2 || isComparing}
                            className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                                documents.document1 && documents.document2 && !isComparing
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {isComparing ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                                    Comparing...
                                </>
                            ) : (
                                <>
                                    <GitCompare className="w-4 h-4 inline mr-2" />
                                    Compare Documents
                                </>
                            )}
                        </button>
                        
                        {(documents.document1 || documents.document2) && (
                            <button
                                onClick={clearDocuments}
                                className="ml-4 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && comparisonResult && (
                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Comparison Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="text-center">
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSimilarityBgColor(comparisonResult.analysis.similarity_percentage)} ${getSimilarityColor(comparisonResult.analysis.similarity_percentage)}`}>
                                    {comparisonResult.analysis.similarity_percentage}% Similar
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Overall Similarity</p>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-semibold text-gray-900">
                                    {comparisonResult.files[0].name}
                                </div>
                                <p className="text-xs text-gray-500">Document 1</p>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-semibold text-gray-900">
                                    {comparisonResult.files[1].name}
                                </div>
                                <p className="text-xs text-gray-500">Document 2</p>
                            </div>
                        </div>
                        <p className="text-gray-700">{comparisonResult.analysis.summary}</p>
                    </div>

                    {/* Similarities */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            Similarities
                        </h3>
                        <ul className="space-y-2">
                            {comparisonResult.analysis.similarities?.map((similarity, index) => (
                                <li key={index} className="flex items-start">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    <span className="text-gray-700">{similarity}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Differences */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                            Differences
                        </h3>
                        <ul className="space-y-2">
                            {comparisonResult.analysis.differences?.map((difference, index) => (
                                <li key={index} className="flex items-start">
                                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                    <span className="text-gray-700">{difference}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Key Findings */}
                    {comparisonResult.analysis.key_findings && (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Findings</h3>
                            <ul className="space-y-2">
                                {comparisonResult.analysis.key_findings.map((finding, index) => (
                                    <li key={index} className="flex items-start">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                        <span className="text-gray-700">{finding}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Recommendations */}
                    {comparisonResult.analysis.recommendations && (
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Recommendations</h3>
                            <ul className="space-y-2">
                                {comparisonResult.analysis.recommendations.map((recommendation, index) => (
                                    <li key={index} className="flex items-start">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                        <span className="text-gray-700">{recommendation}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default DocumentComparison;
