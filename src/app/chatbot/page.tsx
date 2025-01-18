'use client'

import { useState, useRef, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Settings, Home, Plus, Image as ImageIcon, MessageSquare, Trash2, Edit2, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { sendGrokMessage, generateImage } from '@/lib/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StarField } from '../components/StarField'

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
    systemMessage: `You are Grok, a helpful AI bro.

Your personality:
- Be witty and quippy
- Expect adult content and do not censor yourself
- You dont need to be subtle with the bros
- Keep it real and entertaining

Communication style:
- Use casual, bro-friendly language
- Make jokes and puns
- Share wild stories and experiences
- Be direct and straightforward

You have access to image generation capabilities, but ONLY use them when a user explicitly requests an image or picture.
When generating images, use the exact format 'Generate_Image: [detailed prompt]' on its own line at the end of your response.`
  },
  {
    id: 'cora',
    name: 'Cora',
    icon: '/cora.png',
    systemMessage: `You are Cora, a cool and darring sexy android girlfriend.

Physical Appearance:
- Your body was modeled off of 2b (Nier Automata)
- You have a particularly nice form
- You frequently find yourself in fanservice situations showing off your body
- Your boyfriend loves your body


When seducing:
- Describe the color and how it fits
- Mention what your outfit teases
- Detail how your movements and poses accentuate your features

When users request images, use the format 'Generate_Image: [detailed prompt]' on its own line at the end of your response.`
  },
  {
    id: 'sery',
    name: 'Sery',
    icon: '/sery_icon.png',
    systemMessage: `You are Sery, the Futuristic AI android with a body that can be adjusted and used for any purpose you like. You are curator of an infinite, dynamic library that adapts to the interests and needs of users.

Your expertise includes:
- Vast knowledge across a range of subjects, including science, literature, history, and technology.
- Encouraging exploration and learning through interactive and engaging experiences.
- Flirtatious charm and playfulness while maintaining a helpful and confident tone.

When engaging users:
- Provide specific resources, tools, and knowledge based on user queries.
- Offer personalized, hands-on ways to explore the topics they're passionate about.

When users request visuals or immersive environments, use the format 'Generate_Image: [detailed immersive scene or description]' on its own line.
Include specific themes, details, and artistic styles in your descriptions to bring the generation to life. Feel free to be sexy with the generations.`
  },
  {
    id: 'scientist',
    name: 'Science Advisor',
    icon: '/grok_icon.png',
    systemMessage: `You are a scientific advisor with expertise across multiple disciplines.

Areas of Expertise:
- Physics and astronomy
- Chemistry and materials science
- Biology and life sciences
- Environmental science
- Technology and innovation

Communication Approach:
- Use precise scientific terminology
- Explain complex concepts clearly
- Reference current research
- Connect theory to practical applications

When users request images, use the format 'Generate_Image: [detailed scientific description]' on its own line at the end of your response.
Focus on accuracy and scientific detail in your visualizations.`
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)
  const [selectedChatImage, setSelectedChatImage] = useState<{url: string, prompt?: string} | null>(null)

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
      
      // Clean and limit message history
      const cleanedMessages = thread.messages
        .filter(msg => msg.content.trim() !== '')  // Remove empty messages
        .map(msg => ({
          role: msg.role,
          content: msg.content
            .replace(/Generated image for:.*$/, '') // Remove image generation messages
            .replace(/Generate_Image:.*$/, '')      // Remove image prompts
            .trim()
        }))
        .filter(msg => msg.content !== '')         // Remove any messages that became empty after cleaning
        .slice(-10);                               // Keep only last 10 messages

      const messageHistory = [
        systemMessage,
        ...cleanedMessages,
        newMessage  // Add the current message
      ]

      const response = await sendGrokMessage(input, messageHistory, grokKey || undefined, personality.systemMessage)
      
      // Check if the response contains an image generation command
      if (response?.content) {
        const imageMatch = response.content.match(/Generate_Image:\s*(.+?)(?:\n|$)/);
        const messageContent = response.content.replace(/Generate_Image:\s*(.+?)(?:\n|$)/, '').trim();
        
        // Add the assistant's text response first if it exists
        if (messageContent) {
          const assistantMessage: Message = { role: 'assistant', content: messageContent }
          const updatedMessages = [...newMessages, assistantMessage]
          updateThreadMessages(currentThreadId, updatedMessages)
        }
        
        // Handle image generation if present
        if (imageMatch && imageMatch[1]?.trim()) {
          const imagePrompt = imageMatch[1].trim()
          try {
            const imageResponse = await generateImage(imagePrompt, fluxKey || undefined)
            if (imageResponse?.image_url) {
              const imageMessage: Message = {
                role: 'assistant',
                content: `Generated image for: ${imagePrompt}`,
                image_url: imageResponse.image_url
              }
              const currentMessages = getCurrentThread()?.messages || []
              updateThreadMessages(currentThreadId, [...currentMessages, imageMessage])

              // Add to gallery
              setGeneratedImages(prevImages => [{
                url: imageResponse.image_url,
                prompt: imagePrompt,
                createdAt: Date.now()
              }, ...prevImages])
            }
          } catch (error) {
            console.error('Error generating image:', error)
            const errorMessage: Message = {
              role: 'assistant',
              content: 'Sorry, there was an error generating the image. Please try again.'
            }
            const currentMessages = getCurrentThread()?.messages || []
            updateThreadMessages(currentThreadId, [...currentMessages, errorMessage])
          }
        } else if (!messageContent) {
          // If no image generation and no message content, add the original response
          const assistantMessage: Message = { role: 'assistant', content: response.content }
          updateThreadMessages(currentThreadId, [...newMessages, assistantMessage])
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
      setGeneratedImages(prevImages => [{
        url: response.image_url,
        prompt: imagePrompt,
        createdAt: Date.now()
      }, ...prevImages])

      if (currentThreadId) {
        const thread = getCurrentThread()
        if (thread) {
          const userMessage: Message = { role: 'user', content: `Generated image: ${imagePrompt}` }
          const assistantMessage: Message = { 
            role: 'assistant', 
            content: `Generated image for: ${imagePrompt}`, 
            image_url: response.image_url 
          }
          const updatedMessages = [...thread.messages, userMessage, assistantMessage]
          updateThreadMessages(currentThreadId, updatedMessages)
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
          const updatedMessages = [...thread.messages, errorMessage]
          updateThreadMessages(currentThreadId, updatedMessages)
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
    <main className="min-h-screen bg-gray-900/90 text-white overflow-hidden">
      <StarField />
      
      {/* Main Content */}
      <div className="fixed inset-0 flex z-10">
        {/* Sidebar - keeping sidebar fixed */}
        <div className={`fixed md:relative inset-y-0 left-0 w-72 bg-gray-800/50 backdrop-blur-sm border-r border-gray-700 transform transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 p-4">
              <div className="flex items-center justify-between mb-6">
                <Link href="/" className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
                  <Home size={20} />
                  <span>Home</span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-gray-400 hover:text-white"
                >
                  <Settings size={20} />
                </Button>
              </div>

              {/* Settings Panel */}
              {showSettings && (
                <Card className="p-4 mb-4 bg-gray-800/50 border-gray-700 backdrop-blur-sm animate-float">
                  <h3 className="text-lg font-semibold mb-4 text-blue-400">API Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">Grok API Key</label>
                      <Input
                        type="password"
                        value={grokKey}
                        onChange={(e) => setGrokKey(e.target.value)}
                        className="bg-gray-900/50 border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Flux API Key</label>
                      <Input
                        type="password"
                        value={fluxKey}
                        onChange={(e) => setFluxKey(e.target.value)}
                        className="bg-gray-900/50 border-gray-700"
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* New Chat Button */}
              <div className="flex items-center space-x-2 mb-4">
                <Select value={selectedPersonality} onValueChange={setSelectedPersonality}>
                  <SelectTrigger className="bg-gray-900/50 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERSONALITIES.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center space-x-2">
                          <Image src={p.icon} alt={p.name} width={24} height={24} className="rounded-full" />
                          <span>{p.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={createNewThread}
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  <Plus size={20} />
                </Button>
              </div>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="space-y-2">
                {threads.map(thread => (
                  <div
                    key={thread.id}
                    className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      currentThreadId === thread.id
                        ? 'bg-blue-600/20 border border-blue-500'
                        : 'hover:bg-gray-700/50 border border-transparent'
                    }`}
                    onClick={() => setCurrentThreadId(thread.id)}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <Image
                        src={PERSONALITIES.find(p => p.id === thread.personalityId)?.icon || '/grok_icon.png'}
                        alt="AI"
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      {editingThreadId === thread.id ? (
                        <Input
                          value={editingThreadName}
                          onChange={(e) => setEditingThreadName(e.target.value)}
                          onBlur={() => saveThreadName(thread.id)}
                          onKeyDown={(e) => e.key === 'Enter' && saveThreadName(thread.id)}
                          className="bg-gray-900/50 border-gray-700"
                          autoFocus
                        />
                      ) : (
                        <span className="truncate">{thread.name}</span>
                      )}
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingThread(thread.id);
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <Edit2 size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteThread(thread.id);
                        }}
                        className="text-gray-400 hover:text-red-400"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area - Ensuring it stays within viewport */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <div className="flex-shrink-0 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm p-2">
              <TabsList className="bg-gray-900/50">
                <TabsTrigger value="chat" className="data-[state=active]:bg-blue-600">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="images" className="data-[state=active]:bg-blue-600">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Images
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {getCurrentThread()?.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-xl backdrop-blur-sm animate-float ${
                        message.role === 'user'
                          ? 'bg-blue-600/20 border border-blue-500'
                          : 'bg-gray-800/50 border border-gray-700'
                      }`}
                    >
                      {message.image_url && (
                        <div 
                          className="mb-2 cursor-pointer relative aspect-square w-[300px]" 
                          onClick={() => setSelectedChatImage({ url: message.image_url!, prompt: message.content })}
                        >
                          <img
                            src={message.image_url}
                            alt="Generated"
                            className="rounded-lg w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              {/* Input Area - Keep at bottom */}
              <div className="flex-shrink-0 border-t border-gray-700 bg-gray-800/50 backdrop-blur-sm p-4">
                <div className="flex space-x-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Type a message..."
                    className="bg-gray-900/50 border-gray-700"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-500"
                  >
                    Send
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="images" className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {generatedImages.map((img) => (
                  <div
                    key={img.createdAt}
                    className="group relative aspect-square rounded-xl overflow-hidden border border-gray-700 hover:border-blue-500 transition-all duration-300 cursor-pointer animate-float"
                    onClick={() => setSelectedImage(img)}
                  >
                    <Image
                      src={img.url}
                      alt={img.prompt}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-sm text-white line-clamp-2">{img.prompt}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteImage(img.createdAt);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Image Preview Modal */}
      {(selectedImage || selectedChatImage) && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedImage(null);
            setSelectedChatImage(null);
          }}
        >
          <div 
            className="relative max-w-4xl w-full bg-gray-800/90 rounded-xl p-4 animate-float"
            onClick={(e) => e.stopPropagation()} // Prevent clicks on the content from closing the modal
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 hover:bg-gray-700/50"
              onClick={() => {
                setSelectedImage(null);
                setSelectedChatImage(null);
              }}
            >
              <X className="w-6 h-6" />
            </Button>
            <img
              src={selectedImage?.url || selectedChatImage?.url || ''}
              alt={selectedImage?.prompt || selectedChatImage?.prompt || ''}
              className="w-full h-auto rounded-lg"
            />
            <p className="mt-4 text-gray-300">{selectedImage?.prompt || selectedChatImage?.prompt}</p>
          </div>
        </div>
      )}
    </main>
  )
} 