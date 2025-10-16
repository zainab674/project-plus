import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, Calendar, User, Clock, ChevronRight, Eye, AlertCircle } from 'lucide-react';
import { getAllProjectRequest } from '@/lib/http/project';
import { useUser } from '@/providers/UserProvider';
import Link from 'next/link';
import moment from 'moment';

const RecentCases = () => {
    const [recentCases, setRecentCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();

    const fetchRecentCases = useCallback(async () => {
        setLoading(true);
        try {
            const response = await getAllProjectRequest();
            let cases = [];
            
            if (response?.data?.projects && Array.isArray(response.data.projects)) {
                cases = response.data.projects;
            } else if (response?.projects && Array.isArray(response.projects)) {
                cases = response.projects;
            } else if (Array.isArray(response)) {
                cases = response;
            }

            // Sort by creation date (most recent first) and take only 4
            const sortedCases = cases
                .filter(caseItem => caseItem && caseItem.project_id)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 4);

            setRecentCases(sortedCases);
        } catch (err) {
            console.error('Error fetching recent cases:', err);
            setRecentCases([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchRecentCases();
        }
    }, [user, fetchRecentCases]);

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'COMPLETED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'ON_HOLD':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'CLOSED':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return moment(date).format('MMM DD, YYYY');
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                        Recent Cases
                    </h3>
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    Recent Cases
                </h3>
                <Link 
                    href="/dashboard/projects" 
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                    View All
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </div>

            {recentCases.length === 0 ? (
                <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No recent cases found</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {recentCases.map((caseItem) => (
                        <Link 
                            key={caseItem.project_id} 
                            href={`/dashboard/project/${caseItem.project_id}`}
                            className="block p-4 border border-gray-100 rounded-lg hover:border-blue-200 hover:shadow-sm transition-all duration-200"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                                        {caseItem.title || caseItem.name || 'Untitled Case'}
                                    </h4>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(caseItem.created_at)}
                                        </div>
                                        {caseItem.client_name && (
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {caseItem.client_name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(caseItem.status)}`}>
                                        {caseItem.status || 'Active'}
                                    </span>
                                    <Eye className="h-4 w-4 text-gray-400" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentCases;
