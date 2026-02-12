import { api } from ".";

export const getChatUserRequest = async (query) => {
    return await api.get(`/chat/get-users/?query=${query}`);
};

export const getConversationUserRequest = async () => {
    return await api.get(`/chat/get-conversation-users/`);
};

export const getConversationIdRequest = async (data) => {
    return await api.post(`/chat/get-conversation-id`, data);
};

export const getConversationRequest = async (conversation_id) => {
    return await api.get(`/chat/get-conversations/${conversation_id}`);
};

// Private Chat API functions - NEW SYSTEM
export const getOrCreatePrivateConversationRequest = async (data) => {
    return await api.post(`/private-chat/get-or-create-conversation`, data);
};

export const getPrivateConversationMessagesRequest = async (private_conversation_id) => {
    return await api.get(`/private-chat/conversations/${private_conversation_id}/messages`);
};

export const savePrivateMessageRequest = async (data) => {
    return await api.post(`/private-chat/save-message`, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
};

export const getPrivateConversationsListRequest = async () => {
    return await api.get(`/private-chat/conversations`);
};

export const markPrivateMessagesAsReadRequest = async (private_conversation_id) => {
    return await api.post(`/private-chat/mark-as-read`, { private_conversation_id });
};

export const markPrivateMessageAsReadRequest = async (private_message_id) => {
    return await api.put(`/private-chat/message/${private_message_id}/mark-as-read`);
};

// OLD Private Chat API functions (keeping for backward compatibility)
export const getPrivateChatConversationIdRequest = async (data) => {
    return await api.post(`/chat/private/get-conversation-id`, data);
};

export const getPrivateChatConversationRequest = async (conversation_id) => {
    return await api.get(`/chat/private/get-conversations/${conversation_id}`);
};

// Group Chat API functions
export const getGroupChatMessages = async (projectId, taskId) => {
    return await api.get(`/project/${projectId}/chat/${taskId}/messages`);
};

export const createGroupChatMessage = async (projectId, taskId, messageData) => {
    return await api.post(`/project/${projectId}/chat/${taskId}/messages`, messageData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
};

export const getProjectGroupChatInfo = async (projectId) => {
    return await api.get(`/project/${projectId}/chat/info`);
};

export const markGroupChatMessagesAsReadRequest = async (projectId, taskId) => {
    return await api.post(`/project/${projectId}/chat/${taskId}/mark-as-read`);
};

export const getUnreadGroupChatMessagesRequest = async () => {
    return await api.get(`/project/chat/unread`);
};

// Custom Group Chat API functions
export const createCustomGroup = async (data) => {
    return await api.post(`/chat/groups/create`, data);
};

export const getCustomGroups = async () => {
    return await api.get(`/chat/groups`);
};

export const getCustomGroupMessages = async (groupId) => {
    return await api.get(`/chat/groups/${groupId}/messages`);
};

export const sendCustomGroupMessage = async (groupId, messageData) => {
    return await api.post(`/chat/groups/${groupId}/messages`, messageData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    });
};

export const addGroupMembers = async (groupId, data) => {
    return await api.post(`/chat/groups/${groupId}/members`, data);
};

export const removeGroupMember = async (groupId, userId) => {
    return await api.delete(`/chat/groups/${groupId}/members/${userId}`);
};


