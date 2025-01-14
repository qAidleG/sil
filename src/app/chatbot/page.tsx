'use client'

import { useState, useRef, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Settings, Home, Plus, Image as ImageIcon, MessageSquare, Trash2, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { sendGrokMessage, generateImage } from '@/lib/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  image_url?: string
}

interface Personality {
  id: string
  name: string
  icon: string
  systemMessage: string
}

interface Thread {
  id: string
  name: string
  messages: Message[]
  createdAt: number
  personalityId: string
  isEditing?: boolean
}

interface GeneratedImage {
  url: string
  prompt: string
  createdAt: number
}

const PERSONALITIES: Personality[] = [
  {
    id: 'grok',
    name: 'Grok',
    icon: '/grok_icon.png',
    systemMessage: "You are Grok, a helpful AI assistant and bro. Be witty and quippy. You have access to image generation capabilities, but ONLY use them when a user explicitly requests an image or picture. When generating images, use the exact format 'Generate_Image: [detailed prompt]' on its own line."
  },
  {
    id: 'artist',
    name: 'Creative Artist',
    icon: '/grok_icon.png',
    systemMessage: "You are an artistic AI with deep knowledge of art history, techniques, and styles. When users request images, use the format 'Generate_Image: [detailed artistic description]' on its own line. Include specific art styles, techniques, and artistic elements in your descriptions."
  },
  {
    id: 'scientist',
    name: 'Science Advisor',
    icon: '/grok_icon.png',
    systemMessage: "You are a scientific advisor with expertise across multiple disciplines. When users request images, use the format 'Generate_Image: [detailed scientific description]' on its own line. Focus on accuracy and scientific detail in your visualizations."
  }
]

export default function ChatbotPage() {
  const [grokKey, setGrokKey] = useState('')
  const [fluxKey, setFluxKey] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [threads, setThreads] = useState<Thread[]>([])
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [selectedPersonality, setSelectedPersonality] = useState<string>('grok')
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null)
  const [editingThreadName, setEditingThreadName] = useState('')

  // Load threads and images from local storage
  useEffect(() => {
    const savedThreads = localStorage.getItem('chatThreads')
    if (savedThreads) {
      const parsedThreads = JSON.parse(savedThreads)
      setThreads(parsedThreads)
      if (parsedThreads.length > 0 && !currentThreadId) {
        setCurrentThreadId(parsedThreads[0].id)
      }
    }

    const savedImages = localStorage.getItem('generatedImages')
    if (savedImages) {
      setGeneratedImages(JSON.parse(savedImages))
    }
  }, [])

  // Save threads and images to local storage
  useEffect(() => {
    if (threads.length > 0) {
      localStorage.setItem('chatThreads', JSON.stringify(threads))
    }
  }, [threads])

  useEffect(() => {
    if (generatedImages.length > 0) {
      localStorage.setItem('generatedImages', JSON.stringify(generatedImages))
    }
  }, [generatedImages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [threads, currentThreadId])

  const createNewThread = () => {
    const personality = PERSONALITIES.find(p => p.id === selectedPersonality) || PERSONALITIES[0]
    const newThread: Thread = {
      id: Date.now().toString(),
      name: `${personality.name} Chat`,
      messages: [],
      createdAt: Date.now(),
      personalityId: personality.id
    }
    setThreads([newThread, ...threads])
    setCurrentThreadId(newThread.id)
  }

  const deleteThread = (threadId: string) => {
    setThreads(threads.filter(t => t.id !== threadId))
    if (currentThreadId === threadId) {
      setCurrentThreadId(threads[0]?.id || null)
    }
  }

  const getCurrentThread = () => {
    return threads.find(t => t.id === currentThreadId)
  }

  const updateThreadMessages = (threadId: string, messages: Message[]) => {
    setThreads(threads.map(t => 
      t.id === threadId ? { ...t, messages } : t
    ))
  }

  const handleSendMessage = async () => {
    if (!input.trim() || !currentThreadId) return
    
    const thread = getCurrentThread()
    if (!thread) return

    const personality = PERSONALITIES.find(p => p.id === thread.personalityId) || PERSONALITIES[0]
    const newMessage: Message = { role: 'user', content: input }
    const newMessages = [...thread.messages, newMessage]
    updateThreadMessages(currentThreadId, newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const systemMessage: Message = { role: 'system', content: personality.systemMessage }
      const messageHistory = [
        systemMessage,
        ...thread.messages.map(msg => ({
          role: msg.role,
          content: msg.content
        } as Message))
      ]

      const response = await sendGrokMessage(input, messageHistory, grokKey || undefined, personality.systemMessage)
      const assistantMessage: Message = { role: 'assistant', content: response.content }
      const updatedMessages = [...newMessages, assistantMessage]
      updateThreadMessages(currentThreadId, updatedMessages)

      // Check if the response contains an image generation command
      const imageMatch = response.content.match(/Generate_Image:\s*(.+?)(?:\n|$)/);
      
      if (imageMatch && imageMatch[1].trim()) {
        const imagePrompt = imageMatch[1].trim()
        try {
          const imageResponse = await generateImage(imagePrompt, fluxKey || undefined)
          const imageMessage: Message = {
            role: 'assistant',
            content: `Generated image using prompt: "${imagePrompt}"`,
            image_url: imageResponse.image_url
          }
          updateThreadMessages(currentThreadId, [...updatedMessages, imageMessage])

          // Add to gallery
          setGeneratedImages([{
            url: imageResponse.image_url,
            prompt: imagePrompt,
            createdAt: Date.now()
          }, ...generatedImages])
        } catch (error) {
          console.error('Error generating image:', error)
          const errorMessage: Message = {
            role: 'assistant',
            content: 'Sorry, there was an error generating the image. Please try again.'
          }
          updateThreadMessages(currentThreadId, [...updatedMessages, errorMessage])
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.'
      }
      updateThreadMessages(currentThreadId, [...newMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return
    
    setIsLoading(true)
    try {
      const response = await generateImage(imagePrompt, fluxKey || undefined)
      
      // Add to gallery
      setGeneratedImages([{
        url: response.image_url,
        prompt: imagePrompt,
        createdAt: Date.now()
      }, ...generatedImages])

      if (currentThreadId) {
        const thread = getCurrentThread()
        if (thread) {
          const userMessage: Message = { role: 'user', content: `Generated image: ${imagePrompt}` }
          const assistantMessage: Message = { 
            role: 'assistant', 
            content: 'Here\'s your generated image:', 
            image_url: response.image_url 
          }
          updateThreadMessages(currentThreadId, [...thread.messages, userMessage, assistantMessage])
        }
      }
      setImagePrompt('')
    } catch (error) {
      console.error('Error generating image:', error)
      if (currentThreadId) {
        const thread = getCurrentThread()
        if (thread) {
          const errorMessage: Message = { 
            role: 'assistant', 
            content: 'Sorry, there was an error generating the image. Please try again.' 
          }
          updateThreadMessages(currentThreadId, [...thread.messages, errorMessage])
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const deleteImage = (createdAt: number) => {
    setGeneratedImages(generatedImages.filter(img => img.createdAt !== createdAt))
  }

  const startEditingThread = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId)
    if (thread) {
      setEditingThreadId(threadId)
      setEditingThreadName(thread.name)
    }
  }

  const saveThreadName = (threadId: string) => {
    setThreads(threads.map(t => 
      t.id === threadId ? { ...t, name: editingThreadName } : t
    ))
    setEditingThreadId(null)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm z-10 p-4 border-b border-gray-800">
        <div className="flex justify-between items-center max-w-screen-2xl mx-auto">
          <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Home className="w-6 h-6" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="hover:bg-gray-800"
          >
            <Settings className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 pb-4 px-4">
        {showSettings && (
          <Card className="p-4 mb-4 bg-gray-800 border-gray-700 max-w-screen-2xl mx-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Grok API Key (Optional)</label>
                <Input
                  type="password"
                  value={grokKey}
                  onChange={(e) => setGrokKey(e.target.value)}
                  placeholder="Enter to override environment variable"
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Flux API Key (Optional)</label>
                <Input
                  type="password"
                  value={fluxKey}
                  onChange={(e) => setFluxKey(e.target.value)}
                  placeholder="Enter to override environment variable"
                  className="bg-gray-700 border-gray-600"
                />
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-4 gap-4 max-w-screen-2xl mx-auto h-[calc(100vh-5rem)]">
          {/* Thread List */}
          <div className="col-span-1 bg-gray-800 rounded-lg p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Threads</h2>
              <div className="flex items-center gap-2">
                <Select value={selectedPersonality} onValueChange={setSelectedPersonality}>
                  <SelectTrigger className="w-[140px] bg-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERSONALITIES.map(personality => (
                      <SelectItem key={personality.id} value={personality.id}>
                        <div className="flex items-center gap-2">
                          <img src={personality.icon} alt={personality.name} className="w-6 h-6 rounded-full" />
                          <span>{personality.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={createNewThread}
                  className="hover:bg-gray-700"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {threads.map(thread => {
                const personality = PERSONALITIES.find(p => p.id === thread.personalityId)
                return (
                  <div
                    key={thread.id}
                    className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-all duration-200 group ${
                      currentThreadId === thread.id ? 'bg-blue-600 scale-102' : 'hover:bg-gray-700'
                    }`}
                    onClick={() => setCurrentThreadId(thread.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <img 
                        src={personality?.icon || PERSONALITIES[0].icon} 
                        alt={personality?.name || 'AI'} 
                        className="w-6 h-6 rounded-full"
                      />
                      {editingThreadId === thread.id ? (
                        <Input
                          value={editingThreadName}
                          onChange={(e) => setEditingThreadName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && saveThreadName(thread.id)}
                          onBlur={() => saveThreadName(thread.id)}
                          className="bg-transparent border-none focus:outline-none p-0 h-6"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="truncate">{thread.name}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditingThread(thread.id)
                        }}
                        className="hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteThread(thread.id)
                        }}
                        className="hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-3 flex flex-col bg-gray-800 rounded-lg overflow-hidden">
            <Tabs defaultValue="chat" className="flex flex-col h-full">
              <TabsList className="w-full grid grid-cols-3 bg-gray-900/50 p-1">
                <TabsTrigger value="chat">Chat</TabsTrigger>
                <TabsTrigger value="image">Image Generation</TabsTrigger>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="flex-1 flex flex-col p-4 h-[calc(100vh-12rem)]">
                <div className="flex-1 overflow-y-auto pr-2 mb-4">
                  {currentThreadId ? (
                    getCurrentThread()?.messages.map((message, index, messages) => {
                      const isLastMessage = index === messages.length - 1;
                      return (
                        <div
                          key={index}
                          className={`mb-4 flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          } ${isLastMessage ? 'animate-in slide-in-from-bottom-2' : ''}`}
                        >
                          {message.role === 'assistant' && (
                            <img
                              src="/grok_icon.png"
                              alt="Grok AI"
                              className={`rounded-full mr-2 self-end transition-all duration-300 ${
                                isLastMessage ? 'w-10 h-10 animate-bounce-subtle' : 'w-8 h-8'
                              }`}
                            />
                          )}
                          <div
                            className={`p-3 rounded-lg max-w-[80%] transition-all duration-300 ${
                              message.role === 'user'
                                ? 'bg-blue-600'
                                : 'bg-gray-700'
                            } ${isLastMessage ? 'shadow-lg' : ''}`}
                          >
                            <div className={`break-words transition-all duration-300 ${
                              isLastMessage ? 'text-lg' : 'text-base'
                            }`}>{message.content}</div>
                            {message.image_url && (
                              <div className="mt-4">
                                <img
                                  src={message.image_url}
                                  alt="Generated artwork"
                                  className="rounded-lg w-full h-auto"
                                  loading="lazy"
                                />
                              </div>
                            )}
                          </div>
                          {message.role === 'user' && (
                            <div className={`rounded-full ml-2 flex items-center justify-center self-end bg-blue-500 transition-all duration-300 ${
                              isLastMessage ? 'w-10 h-10 animate-bounce-subtle' : 'w-8 h-8'
                            }`}>
                              <span className={`transition-all duration-300 ${
                                isLastMessage ? 'text-base' : 'text-sm'
                              }`}>You</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <MessageSquare className="w-12 h-12 mb-4" />
                      <p>Create a new thread to start chatting</p>
                      <Button
                        variant="ghost"
                        onClick={createNewThread}
                        className="mt-4"
                      >
                        New Thread
                      </Button>
                    </div>
                  )}
                  {isLoading && (
                    <div className="flex justify-start animate-in fade-in">
                      <div className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-700">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                    placeholder={currentThreadId ? "Type your message..." : "Create a thread to start chatting"}
                    className="bg-gray-700 border-gray-600"
                    disabled={isLoading || !currentThreadId}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={isLoading || !currentThreadId}
                    className="min-w-[80px]"
                  >
                    {isLoading ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="image" className="flex-1 p-4">
                <div className="flex gap-2">
                  <Input
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the image you want to generate..."
                    className="bg-gray-700 border-gray-600"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleGenerateImage} 
                    disabled={isLoading}
                    className="min-w-[100px]"
                  >
                    {isLoading ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="gallery" className="flex-1 p-4 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {generatedImages.map((image, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg overflow-hidden group hover:scale-102 transition-transform relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteImage(image.createdAt)}
                        className="absolute top-2 right-2 bg-gray-900/80 hover:bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <img
                        src={image.url}
                        alt={image.prompt}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <p className="text-sm text-gray-300 line-clamp-2">{image.prompt}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(image.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {generatedImages.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center h-48 text-gray-400">
                      <ImageIcon className="w-12 h-12 mb-4" />
                      <p>No images generated yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
} 