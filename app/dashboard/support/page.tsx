'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

type Message = {
  id: string
  content: string
  sender: 'user' | 'support'
  name: string
  email: string
  created_at: string
  conversation_id: string
}

type Conversation = {
  id: string
  user_name: string
  user_email: string
  last_message: string
  updated_at: string
}

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reply, setReply] = useState('')
  const [isMobileConversationView, setIsMobileConversationView] = useState(true);
  const supabase = createClient()
 

    const handleBackToConversations = () => {
        setSelectedConversation(null)
        setIsMobileConversationView(true);
    }


  useEffect(() => {
    fetchConversations()

    const channel = supabase
      .channel('realtime_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (payload) => {
        const newMessage = payload.new as Message
        setMessages((currentMessages) => [...currentMessages, newMessage])
        updateConversationLastMessage(newMessage)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('support_conversations')
      .select('*')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
    } else {
      setConversations(data || [])
    }
  }

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
    } else {
      setMessages(data || [])
    }
  }

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId)
    fetchMessages(conversationId)
    // On mobile, switch to message view
    if (window.innerWidth < 768) {
      setIsMobileConversationView(false);
    }
  }

  const handleReply = async () => {
    if (!reply.trim() || !selectedConversation) return

    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert([
          { 
            content: reply, 
            sender: 'support', 
            name: 'Support Team', 
            email: 'support@example.com',
            conversation_id: selectedConversation,
            created_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) throw error

      if (data) {
        setMessages((currentMessages) => [...currentMessages, data[0]])
        updateConversationLastMessage(data[0])
      }

      setReply('')
    } catch (error) {
      console.error('Error sending reply:', error)
    }
  }

  const updateConversationLastMessage = (message: Message) => {
    setConversations((currentConversations) => 
      currentConversations.map((conv) => 
        conv.id === message.conversation_id 
          ? { ...conv, last_message: message.content, updated_at: message.created_at }
          : conv
      )
    )
  }

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col md:flex-row">
    {/* Conversations List - Mobile & Desktop */}
    <div className={`
      ${isMobileConversationView ? 'block' : 'hidden'} 
      md:block md:w-1/3 md:pr-4 md:border-r
      ${!isMobileConversationView ? 'w-full' : 'w-full md:w-1/3'}
    `}>
      <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-4">Conversations</h2>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        {conversations.map((conversation, i) => (
          <Card 
            key={i} 
            className={`mb-2 cursor-pointer ${selectedConversation === conversation.id ? 'bg-secondary' : ''}`}
            onClick={() => handleConversationSelect(conversation.id)}
          >
            <CardHeader className="flex flex-row items-center space-x-4 p-4">
              <Avatar>
                <AvatarImage src={`https://avatar.vercel.sh/${conversation.user_email}`} alt={conversation.user_name} />
                <AvatarFallback>{conversation.user_email.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{conversation.user_name}</CardTitle>
                <p className="text-sm text-muted-foreground">{conversation.user_email}</p>
              </div>
            </CardHeader>
            <CardContent>
              <p className="truncate">{conversation.last_message}</p>
              <p className={cn("text-xs text-muted-foreground mt-1")}>
                {format(new Date(conversation.updated_at), 'MMM d, yyyy HH:mm')}
              </p>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
    </div>

    {/* Messages View - Mobile & Desktop */}
    <div className={`
      ${isMobileConversationView ? 'hidden' : 'block'} 
      md:block md:w-2/3 md:pl-4 flex flex-col w-full
    `}>
      {/* Back button for mobile */}
      {!isMobileConversationView && (
        <Button 
          variant="outline" 
          className="mb-4 md:hidden" 
          onClick={handleBackToConversations}
        >
          ← Back to Conversations
        </Button>
      )}

      <h2 className="text-xl md:text-2xl font-bold mb-4">Chat</h2>
      <ScrollArea className="flex-grow mb-4 h-[calc(100vh-10rem)]">
        {messages.map((message, i) => (
          <Card 
            key={i} 
            className={`mb-2 ${
              message.sender === 'support' 
                ? 'ml-auto bg-primary text-primary-foreground' 
                : ''
            }`}
          >
            <CardHeader className="flex flex-row items-center space-x-4 p-4">
              <Avatar>
                <AvatarImage 
                  src={
                    message.sender === 'user' 
                      ? `https://avatar.vercel.sh/${message.email}` 
                      : '/ahmad.jpeg'
                  } 
                  alt={message.name} 
                />
                <AvatarFallback>{message.sender.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className='mb-2'>
                  {message.sender === 'user' ? message.name : 'Support Team'}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(message.created_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <p>{message.content}</p>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
      <div className="flex">
        <Input
          type="text"
          placeholder="Type your reply..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="flex-grow mr-2"
        />
        <Button onClick={handleReply} disabled={!selectedConversation}>
          Send Reply
        </Button>
      </div>
    </div>
  </div>
  )
}

