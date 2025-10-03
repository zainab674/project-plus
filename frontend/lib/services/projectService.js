// Project Service
// This service handles fetching user projects and project-related data

import { getUserWithProjectsRequest } from '@/lib/http/auth';

class ProjectService {
    constructor() {
        this.userProjects = null;
        this.lastFetchTime = null;
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    // Get user projects with caching
    async getUserProjects(forceRefresh = false) {
        try {
            const now = Date.now();

            // Return cached data if still valid
            if (!forceRefresh && this.userProjects && this.lastFetchTime && (now - this.lastFetchTime) < this.cacheExpiry) {
                return this.userProjects;
            }

            // Fetch fresh data
            const response = await getUserWithProjectsRequest();

            if (response.data && response.data.user && response.data.user.Projects) {
                this.userProjects = response.data.user.Projects;
                this.lastFetchTime = now;
                return this.userProjects;
            } else {

                // Check if user exists but has no projects
                if (response.data && response.data.user) {
                    return [];
                } else {
                    throw new Error('Invalid response structure from API');
                }
            }
        } catch (error) {
            console.error('🔍 ProjectService: Error fetching user projects:', error);
            return [];
        }
    }

    // Get project by name (fuzzy search)
    async getProjectByName(projectName) {
        const projects = await this.getUserProjects();
        const lowerProjectName = projectName.toLowerCase();

        // Exact match first
        let exactMatch = projects.find(project =>
            project.name.toLowerCase() === lowerProjectName
        );

        if (exactMatch) return exactMatch;

        // Partial match
        let partialMatch = projects.find(project =>
            project.name.toLowerCase().includes(lowerProjectName) ||
            lowerProjectName.includes(project.name.toLowerCase())
        );

        if (partialMatch) return partialMatch;

        // Fuzzy match using similarity
        let bestMatch = null;
        let bestScore = 0;

        projects.forEach(project => {
            const score = this.calculateSimilarity(lowerProjectName, project.name.toLowerCase());
            if (score > bestScore && score > 0.3) { // Threshold for similarity
                bestScore = score;
                bestMatch = project;
            }
        });

        return bestMatch;
    }

    // Get project by ID
    async getProjectById(projectId) {
        const projects = await this.getUserProjects();
        return projects.find(project => project.project_id === projectId);
    }

    // Get all project names for suggestions
    async getProjectNames() {
        const projects = await this.getUserProjects();
        return projects.map(project => project.name);
    }

    // Get project summary for AI context
    async getProjectSummary(projectId) {
        const project = await this.getProjectById(projectId);
        if (!project) return null;

        return {
            id: project.project_id,
            name: project.name,
            description: project.description,
            status: project.status,
            priority: project.priority,
            client: project.client_name,
            opposing: project.opposing,
            phases: project.phases || [],
            taskCount: project.Tasks?.length || 0,
            memberCount: project.Members?.length || 0,
            clientCount: project.Clients?.length || 0
        };
    }

    // Search projects by various criteria
    async searchProjects(query) {
        const projects = await this.getUserProjects();
        const lowerQuery = query.toLowerCase();

        return projects.filter(project => {
            return (
                project.name.toLowerCase().includes(lowerQuery) ||
                project.description?.toLowerCase().includes(lowerQuery) ||
                project.client_name?.toLowerCase().includes(lowerQuery) ||
                project.opposing?.toLowerCase().includes(lowerQuery) ||
                project.status?.toLowerCase().includes(lowerQuery)
            );
        });
    }

    // Get projects for task creation context
    async getProjectsForTaskCreation() {
        const projects = await this.getUserProjects();
        return projects.map(project => ({
            id: project.project_id,
            name: project.name,
            description: project.description,
            status: project.status,
            phases: project.phases || [],
            members: project.Members || [],
            tasks: project.Tasks || []
        }));
    }

    // Calculate string similarity (simple Jaccard similarity)
    calculateSimilarity(str1, str2) {
        if (str1 === str2) return 1.0;
        if (str1.length === 0 || str2.length === 0) return 0.0;

        const set1 = new Set(str1.split(''));
        const set2 = new Set(str2.split(''));

        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return intersection.size / union.size;
    }

    // Clear cache
    clearCache() {
        this.userProjects = null;
        this.lastFetchTime = null;
    }

    // Refresh cache
    async refreshCache() {
        return await this.getUserProjects(true);
    }
}

// Create and export a singleton instance
const projectService = new ProjectService();
export default projectService;
