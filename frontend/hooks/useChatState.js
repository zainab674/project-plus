import { useState, useRef } from 'react';
import useChatHook from './useChatHook';

// Custom hook for chat functionality
export const useChatState = () => {
  const [chatMessages, setChatMessages] = useState([]);
  const [chatConversationId, setChatConversationId] = useState('');
  const [chatMessageValue, setChatMessageValue] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);
  const [chatSelectedFile, setChatSelectedFile] = useState(null);
  const [chatSelectedInternalDoc, setChatSelectedInternalDoc] = useState(null);
  const [showChatInternalDocSelector, setShowChatInternalDocSelector] = useState(false);
  const [selectedChatType, setSelectedChatType] = useState('');
  const [selectedChatRecipient, setSelectedChatRecipient] = useState(null);

  const chatContainerRef = useRef(null);
  const { handleSendMessage, socketRef } = useChatHook();

  return {
    chatMessages,
    setChatMessages,
    chatConversationId,
    setChatConversationId,
    chatMessageValue,
    setChatMessageValue,
    chatLoading,
    setChatLoading,
    chatSending,
    setChatSending,
    chatSelectedFile,
    setChatSelectedFile,
    chatSelectedInternalDoc,
    setChatSelectedInternalDoc,
    showChatInternalDocSelector,
    setShowChatInternalDocSelector,
    selectedChatType,
    setSelectedChatType,
    selectedChatRecipient,
    setSelectedChatRecipient,
    chatContainerRef,
    handleSendMessage,
    socketRef,
  };
};
