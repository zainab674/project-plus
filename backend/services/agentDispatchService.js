import { AgentDispatchClient } from 'livekit-server-sdk';

class AgentDispatchService {
    constructor() {
        this.client = new AgentDispatchClient(
            process.env.LIVEKIT_URL,
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET
        );
    }

    /**
     * Dispatch an agent to a room via API
     * @param {string} roomName - The room name to dispatch to
     * @param {string} agentName - The agent name to dispatch (default: 'transcriber')
     * @param {Object} metadata - Additional metadata to pass to the agent
     * @returns {Promise<Object>} The dispatch result
     */
    async createDispatch(roomName, agentName = 'transcriber', metadata = {}) {
        try {
            console.log(`Dispatching agent '${agentName}' to room '${roomName}'`);
            
            const dispatch = await this.client.createDispatch(roomName, agentName, {
                metadata: JSON.stringify(metadata)
            });
            
            console.log(`Successfully dispatched agent:`, dispatch);
            return dispatch;
        } catch (error) {
            console.error('Error creating agent dispatch:', error);
            throw error;
        }
    }

    /**
     * List all dispatches for a specific room
     * @param {string} roomName - The room name to list dispatches for
     * @returns {Promise<Array>} Array of dispatches
     */
    async listDispatches(roomName) {
        try {
            const dispatches = await this.client.listDispatch(roomName);
            console.log(`Found ${dispatches.length} dispatches in room '${roomName}'`);
            return dispatches;
        } catch (error) {
            console.error('Error listing dispatches:', error);
            throw error;
        }
    }

    /**
     * Dispatch transcriber agent to a meeting room
     * @param {string} meetingId - The meeting ID
     * @param {Object} meetingData - Meeting information
     * @param {string} userId - User ID who initiated the dispatch
     * @returns {Promise<Object>} The dispatch result
     */
    async dispatchTranscriberToMeeting(meetingId, meetingData, userId) {
        const roomName = `meeting-${meetingId}`;
        const metadata = {
            meeting_id: meetingId,
            user_id: userId,
            source: 'api',
            meeting_title: meetingData.heading,
            meeting_description: meetingData.description,
            timestamp: new Date().toISOString()
        };

        return await this.createDispatch(roomName, 'transcriber', metadata);
    }

    /**
     * Check if an agent is already dispatched to a room
     * @param {string} roomName - The room name to check
     * @param {string} agentName - The agent name to check for
     * @returns {Promise<boolean>} True if agent is dispatched, false otherwise
     */
    async isAgentDispatched(roomName, agentName = 'transcriber') {
        try {
            const dispatches = await this.listDispatches(roomName);
            return dispatches.some(dispatch => dispatch.agent_name === agentName);
        } catch (error) {
            console.error('Error checking agent dispatch status:', error);
            return false;
        }
    }
}

export default new AgentDispatchService();
