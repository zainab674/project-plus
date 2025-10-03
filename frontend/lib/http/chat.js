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


