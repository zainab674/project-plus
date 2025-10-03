"use client"

import * as React from "react"
import { ArrowLeft, Send, X } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useUser } from "@/providers/UserProvider"
import { getNameAvatar } from "@/utils/getNameAvatar"



const users = [
  {
    id: "1",
    name: "Alice Johnson",
    avatar: "/placeholder.svg?height=40&width=40&text=AJ",
    status: "online",
    lastMessage: "Hey, how's it going?",
  },
  {
    id: "2",
    name: "Bob Smith",
    avatar: "/placeholder.svg?height=40&width=40&text=BS",
    status: "offline",
    lastMessage: "Can we schedule a meeting?",
  },
  {
    id: "3",
    name: "Carol Williams",
    avatar: "/placeholder.svg?height=40&width=40&text=CW",
    status: "online",
    lastMessage: "I've sent you the files.",
  },
]

export function ChatSidebar({ isOpen, onClose }) {
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [newMessage, setNewMessage] = React.useState("");
  const {user} = useUser();

  const handleUserSelect = (user) => {
    setSelectedUser(user)
    // In a real app, you'd fetch messages for this user here
    setMessages([
      {
        id: "1",
        content: `Hi, this is ${user.name}. How can I help you?`,
        sender: "other",
        timestamp: "10:00 AM",
      },
    ])
  }

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      const message = {
        id: Date.now().toString(),
        content: newMessage,
        sender: "user",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages([...messages, message])
      setNewMessage("")
    }
  }

  const handleBack = () => {
    setSelectedUser(null)
    setMessages([])
  }

  if (!isOpen) return null

  return (
    <Card className="fixed right-0 top-0 h-screen w-80 flex flex-col border-l shadow-lg z-20">
      <div className="flex items-center justify-between p-4 border-b">
        {selectedUser ? (
          <>
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to user list</span>
            </Button>
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                <AvatarFallback>{selectedUser.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-sm font-semibold">{selectedUser.name}</h2>
                <p className="text-xs text-muted-foreground">{selectedUser.status}</p>
              </div>
            </div>
          </>
        ) : (
          <h2 className="text-sm font-semibold">Project Groups</h2>
        )}
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close chat</span>
        </Button>
      </div>
      {selectedUser ? (
        <>
          <ScrollArea className="flex-1 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg p-2 max-w-[80%] ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </ScrollArea>
          <Separator />
          <div className="p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex space-x-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
                <span className="sr-only">Send message</span>
              </Button>
            </form>
          </div>
        </>
      ) : (
        <ScrollArea className="flex-1">
          {user?.Projects.map((project) => (
            <Button
              key={project.project_id}
              variant="ghost"
              className="w-full justify-start px-4 py-2 my-2"
              onClick={() => handleUserSelect(user)}
            >
              <div className="flex items-center w-full">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={project.avatar} alt={project.name} />
                  <AvatarFallback>{getNameAvatar(project?.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{project.createAt}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${project.status === 'online' ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
            </Button>
          ))}
        </ScrollArea>
      )}
    </Card>
  )
}

