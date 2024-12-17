'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, X, Send, Check, CheckCheck } from 'lucide-react'

type Message = {
  id: string
  content: string
  sender: 'user' | 'support'
  created_at: string
  is_read: boolean
  is_sent: boolean
  seen_at: string | null
  conversation_id: string
}

type User = {
  full_name: string | undefined
  email: string
}

type Conversation = {
  id: string
  unread_count: number
}

export function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const [user, setUser] = useState<User>()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [userId, setUserId] = useState<string>('')
  useEffect(() => {
    const fetchUser=async()=>{
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        setUserId(data.user.id)
    }
    fetchUser()
    }, [setIsOpen])
    console.log(`userId: ${userId}`)
  useEffect(() => {
    const fetchUserAndConversation = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData?.user.id)
          .single()

        setUser(userData)

        if (userData) {
          const { data: conversationData, error: conversationError } = await supabase
            .rpc('get_or_create_conversation', { 
              p_user_name: userData.full_name, 
              p_user_email: userData.email 
            })

          if (conversationError) throw conversationError

          setConversation({ id: conversationData, unread_count: 0 })
          
          const { data: messagesData, error: messagesError } = await supabase
            .from('support_messages')
            .select('*')
            .eq('conversation_id', conversationData)
            .order('created_at', { ascending: true })

          if (messagesError) throw messagesError

          if (messagesData) {
            setMessages(messagesData)
          }
        }
      } catch (error: any) {
        console.error('Error fetching user/conversation:', error.message)
      }
    }

    fetchUserAndConversation()
  }, [isOpen,setIsOpen])

  useEffect(() => {
    if (!conversation) return

    const channel = supabase
      .channel('support_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages' 
      }, (payload) => {
        const newMessage = payload.new as Message
        if (newMessage.conversation_id === conversation.id) {
          setMessages((currentMessages) => [...currentMessages, newMessage])
          if (newMessage.sender === 'support') {
            setConversation(prev => prev ? { ...prev, unread_count: prev.unread_count + 1 } : null)
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversation])

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (isOpen && conversation && conversation.unread_count > 0) {
      markMessagesAsRead()
    }
  }, [isOpen, conversation])

  const markMessagesAsRead = async () => {
    if (!conversation) return

    try {
      await supabase.rpc('mark_messages_as_read', { p_conversation_id: conversation.id })
      setConversation(prev => prev ? { ...prev, unread_count: 0 } : null)
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.sender === 'support' ? { ...msg, is_read: true, seen_at: new Date().toISOString() } : msg
        )
      )
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || !conversation) return

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .insert([
          { 
            content: newMessage, 
            sender: 'user', 
            conversation_id: conversation.id,
            is_sent: true,
            is_read: false
          }
        ])
        .select()

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
     
     <Button
        onClick={() => {
            setIsOpen(true)
        }}
        className="fixed bottom-4 right-4 rounded-full ring-2 size-16"
        aria-label="Open support chat"
      >
        <MessageCircle className="h-6 w-6" />
        {conversation && conversation.unread_count > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
            {conversation.unread_count}
          </span>
        )}
      </Button>


      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 w-80 bg-background border rounded-lg z-[1000] shadow-lg overflow-hidden"
          >
            <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center">
              <h2 className="text-lg font-semibold">Support Chat</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close support chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-64 p-4" ref={scrollAreaRef}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-2 p-2 rounded-lg ${
                    message.sender === 'user' 
                      ? 'bg-primary text-primary-foreground ml-auto' 
                      : 'bg-secondary'
                  } max-w-[80%]`}
                >
                  <p>{message.content}</p>
                  <div className="text-xs text-right mt-1">
                    {message.sender === 'user' && (
                      message.is_sent ? (
                        message.is_read ? (
                          <CheckCheck className="inline-block w-4 h-4" />
                        ) : (
                          <Check className="inline-block w-4 h-4" />
                        )
                      ) : (
                        <span>Sending...</span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </ScrollArea>

            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="flex">
                <Textarea
                  placeholder={
                    userId
                      ? `Hi ${user?.full_name?.split(' ')[0]||'dear user'}! How can we help you?`
                      : 'Please sign in to chat with us.'
                  }
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-grow mr-2"
                  required
                  disabled={!userId}
                />
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !user || !conversation} 
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

