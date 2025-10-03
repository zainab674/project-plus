'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, MessageCircle, Moon, PenSquare, Search, Users } from 'lucide-react'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { getChatUserRequest, getConversationUserRequest } from "@/lib/http/chat"
import { useUser } from "@/providers/UserProvider"
import RenderUserComponent from "@/components/chat/RenderUserComponent"
import RenderChats from "@/components/chat/RenderChats"
import useChatHook from "@/hooks/useChatHook"
import { toast } from "react-toastify"
import { ON_CALL, ON_MESSAGE, ON_PRIVATE_MESSAGE } from "@/contstant/chatEventConstant"
import CallDialog from "@/components/Dialogs/CallDialog"

export default function Page() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [users, setUser] = useState([]);
  const [searchUser, setSearchUser] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectTask] = useState({ task_id: -1, name: "Common Chat" });
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState('');
  const { handleSendMessage, handleCall, handleCallAnswer, handleSendSignal, handleCallEnd, handelNoResponse, socketRef } = useChatHook();
  const [currentCallUser, setCurrentCallUser] = useState(null);
  const [isCallByMe, setIsCallByMe] = useState(true);
  const [callMessageId, setCallMessageId] = useState(null);
  const audioRef = useRef();
  const currentCallUserRef = useRef(null);
  const debounceRef = useRef();
  const conversationIdRef = useRef('');
  const selectedChatRef = useRef(null);

  const handleQueryUser = useCallback(async () => {
    setSearchLoading(true);
    try {
      const res = await getChatUserRequest(query);
      setSearchUser(res.data.users);
    } catch (error) {
    } finally {
      setSearchLoading(false)
    }
  }, [query]);

  useEffect(() => {
    if (!query) return;

    debounceRef.current = setTimeout(handleQueryUser, 1000);
    return () => {
      clearTimeout(debounceRef.current)
    }
  }, [query]);

  // Update refs when values change
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  useEffect(() => {
    currentCallUserRef.current = currentCallUser;
  }, [currentCallUser]);

  const handleSetCall = useCallback((user) => {
    setCurrentCallUser(user);
    setIsCallByMe(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new window.Audio('/ding.mp3');
    }
  }, [])

  useEffect(() => {
    if (user) {
      // Check if we have Projects data, if not load it
      if (!user.Projects) {
        loadUserWithProjects().then(fullUser => {
          if (fullUser?.Projects?.length > 0) {
            const firstTask = fullUser.Projects[0]?.Tasks[0];
            setSelectTask(firstTask);
          }
        });
      } else {
        const firstTask = user.Projects[0]?.Tasks[0];
        setSelectTask(firstTask);
      }
    }
  }, [user, loadUserWithProjects]);

  const getAllChatUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getConversationUserRequest();
      setUser(res.data.users);
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }, []);

  useEffect(() => {
    getAllChatUser();
  }, []);

  const handleSelectChat = useCallback((user) => {
    setSelectedChat(user);
  }, []);

  const handleMessageRecive = useCallback((data) => {

    const currentConversationId = conversationIdRef.current;
    const currentSelectedChat = selectedChatRef.current;

    // Helper function to compare IDs (handle both string and number types)
    const compareIds = (id1, id2) => {
      if (!id1 || !id2) return false;
      return id1.toString() === id2.toString();
    };

    // Check if this message is for the currently selected chat
    const isForCurrentChat = currentSelectedChat && (
      (compareIds(data.sender_id, currentSelectedChat.user_id) && compareIds(data.reciever_id, user?.user_id)) ||
      (compareIds(data.reciever_id, currentSelectedChat.user_id) && compareIds(data.sender_id, user?.user_id))
    );

    // Check if conversation IDs match (handle both string and number types)
    const conversationMatches = data.conversation_id && currentConversationId &&
      compareIds(data.conversation_id, currentConversationId);



    if (conversationMatches || isForCurrentChat) {


      // Play ding sound for new message in current chat
      audioRef.current?.play();

      setMessages(prev => {
        const newMessages = [...prev, data];
        return newMessages;
      });
    } else {
      // Additional fallback: if no conversation ID is set yet but we have a selected chat,
      // and this message is clearly for the current user, add it to the chat
      const isMessageForCurrentUser = compareIds(data.reciever_id, user?.user_id) || compareIds(data.sender_id, user?.user_id);
      const hasSelectedChat = currentSelectedChat !== null;
      const noConversationId = !currentConversationId;

      if (isMessageForCurrentUser && hasSelectedChat && noConversationId) {
        setMessages(prev => [...prev, data]);
      } else {
        audioRef.current?.play();
        toast.info(`${data.sender_name}: ${data.content} \n task: ${data.task_name}`);
      }
    }
  }, [user?.user_id]);

  // Handle private chat messages
  const handlePrivateMessageReceive = useCallback((data) => {


    const currentConversationId = conversationIdRef.current;
    const currentSelectedChat = selectedChatRef.current;

    // Helper function to compare IDs (handle both string and number types)
    const compareIds = (id1, id2) => {
      if (!id1 || !id2) return false;
      return id1.toString() === id2.toString();
    };

    // Check if this private message is for the currently selected chat
    const isForCurrentChat = currentSelectedChat && (
      (compareIds(data.sender_id, currentSelectedChat.user_id) && compareIds(data.receiver_id, user?.user_id)) ||
      (compareIds(data.receiver_id, currentSelectedChat.user_id) && compareIds(data.sender_id, user?.user_id))
    );

    // Check if private conversation IDs match
    const conversationMatches = data.private_conversation_id && currentConversationId &&
      compareIds(data.private_conversation_id, currentConversationId);



    if (conversationMatches || isForCurrentChat) {

      // Play ding sound for new private message in current chat
      audioRef.current?.play();

      setMessages(prev => {
        // Handle attachment updates
        if (data.is_update) {
          return prev.map(msg => {
            // Update existing message with real attachment URL
            if (msg.content === data.content && 
                msg.sender_id === data.sender_id && 
                msg.attachment_url === 'uploading...') {
              return {
                ...msg,
                private_message_id: data.private_message_id,
                attachment_url: data.attachment_url,
                attachment_name: data.attachment_name,
                attachment_size: data.attachment_size,
                attachment_mime_type: data.attachment_mime_type
              };
            }
            return msg;
          });
        }

        // Check if this message already exists to prevent duplicates
        const messageExists = prev.some(msg =>
          msg.private_message_id === data.private_message_id ||
          (msg.message_id === data.message_id && msg.content === data.content && msg.sender_id === data.sender_id)
        );

        if (messageExists) {
          return prev;
        }

        return [...prev, data];
      });
    } else {
      audioRef.current?.play();
      toast.info(`${data.sender?.name || data.sender_name}: ${data.content} \n task: ${data.task_name}`);
    }
  }, [user?.user_id]);

  const handleRecieveCall = useCallback((data) => {
    if (currentCallUserRef.current) {
      const callData = {
        message_id: data.message_id,
        picked_up: false,
        sender_id: user.user_id,
        reciever_id: data.sender_id,
        line_busy: true
      }
      handleCallAnswer(callData);
      return
    }

    const callUser = {
      name: data.sender_name,
      user_id: data.sender_id,
      conversation_id: data.conversation_id
    }

    setCallMessageId(data.message_id);
    setCurrentCallUser(callUser);
    setMessages(prev => [...prev, data]);
    setIsCallByMe(false);
  }, [user?.user_id, handleCallAnswer]);

  // Subscribe to socket events
  useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;

    socket.on(ON_MESSAGE, handleMessageRecive);
    socket.on(ON_PRIVATE_MESSAGE, handlePrivateMessageReceive);
    socket.on(ON_CALL, handleRecieveCall);

    // Add connection status logging
    socket.on('connect', () => {
    });

    socket.on('disconnect', () => {
    });

    return () => {
      socket.off(ON_MESSAGE, handleMessageRecive);
      socket.off('on:private_message', handlePrivateMessageReceive);
      socket.off(ON_CALL, handleRecieveCall);
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socketRef, handleMessageRecive, handlePrivateMessageReceive, handleRecieveCall]);

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-5rem)] md:flex-row bg-white m-2 rounded-md relative">
        {/* Sidebar */}
        <div className="w-full md:w-80 bg-white p-4 border-r border-primary">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-black">Users</h1>
          </div>
          <div className="relative mb-4">
            <Search className="absolute left-2 top-3 h-4 w-4 text-black" />
            <Input
              className="pl-8 focus:ring-accent-hover border-gray-300 rounded focus:border-accent"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2 overflow-auto h-[85%]">
            {
              loading &&
              [1, 2, 3, 4, 5, 6, 7].map((_, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-white-hover rounded-lg py-10 px-2">
                </div>
              ))
            }
            <RenderUserComponent
              searchLoading={searchLoading}
              users={users}
              searchUser={searchUser}
              handleSelectChat={handleSelectChat}
              query={query}
              setUser={setUser}
              setQuery={setQuery}
            />
          </div>
        </div>

        {/* Main Chat */}
        {
          selectedChat &&
          <RenderChats
            selectedChat={selectedChat}
            setSelectTask={setSelectTask}
            selectedTask={selectedTask}
            handleSendMessage={handleSendMessage}
            socketRef={socketRef}
            messages={messages}
            setMessages={setMessages}
            conversationId={conversationId}
            setConversationId={setConversationId}
            handleCall={handleSetCall}
          />
        }

        {
          !selectedChat &&
          <div className="flex-1 flex items-center justify-center bg-white-hover">
            <img src="/assets/Internet-Chat-Rooms.svg" alt="Chat illustration" />
          </div>
        }
      </div>

      {
        currentCallUser &&
        <CallDialog
          setCurrentCallUser={setCurrentCallUser}
          handelNoResponse={handelNoResponse}
          setIsCallByMe={setIsCallByMe}
          setCallMessageId={setCallMessageId}
          callMessageId={callMessageId}
          handleCallAnswer={handleCallAnswer}
          currentCallUser={currentCallUser}
          isCallByMe={isCallByMe}
          conversationId={conversationId}
          socketRef={socketRef}
          handleCall={handleCall}
          selectedTask={selectedTask}
          setMessages={setMessages}
          handleSendSignal={handleSendSignal}
          handleCallEnd={handleCallEnd}
        />
      }
    </>
  )
}
