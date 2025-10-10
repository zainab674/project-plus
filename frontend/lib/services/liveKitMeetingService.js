// LiveKit Meeting Service
class LiveKitMeetingService {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL;
  }

  // Get auth token from localStorage
  getAuthToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  // Generate LiveKit token for a meeting
  async generateMeetingToken(meetingId) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch(`${this.baseURL}/api/v1/meeting/token/${meetingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get meeting token');
      }

      const data = await response.json();
      
      // Validate server URL in response
      if (!data.serverUrl) {
        throw new Error('Server URL is missing from meeting token response');
      }

      // Validate URL format
      try {
        new URL(data.serverUrl);
      } catch (urlError) {
        throw new Error(`Invalid server URL format: ${data.serverUrl}`);
      }

      console.log('🔗 LiveKit server URL validated:', data.serverUrl);
      return data;
    } catch (error) {
      console.error('Error generating meeting token:', error);
      throw error;
    }
  }

  // Get meeting details
  async getMeetingDetails(meetingId) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch(`${this.baseURL}/api/v1/meeting/get/${meetingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get meeting details');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting meeting details:', error);
      throw error;
    }
  }

  // Update meeting status
  async updateMeetingStatus(meetingId, status) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch(`${this.baseURL}/api/v1/meeting/status/${meetingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update meeting status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating meeting status:', error);
      throw error;
    }
  }

  // Validate meeting access
  async validateMeetingAccess(meetingId) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return { hasAccess: false, error: 'Authentication required' };
      }

      const response = await fetch(`${this.baseURL}/api/v1/meeting/get/${meetingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { hasAccess: false, error: 'Meeting not found or access denied' };
      }

      return { hasAccess: true, meeting: await response.json() };
    } catch (error) {
      console.error('Error validating meeting access:', error);
      return { hasAccess: false, error: error.message };
    }
  }

  // End meeting
  async endMeeting(meetingId) {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please log in.');
      }

      const response = await fetch(`${this.baseURL}/api/v1/meeting/end/${meetingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to end meeting');
      }

      return await response.json();
    } catch (error) {
      console.error('Error ending meeting:', error);
      throw error;
    }
  }
}

// Create singleton instance
const liveKitMeetingService = new LiveKitMeetingService();

export default liveKitMeetingService;
