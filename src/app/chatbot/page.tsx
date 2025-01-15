'use client'

import { useState, useRef, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Settings, Home, Plus, Image as ImageIcon, MessageSquare, Trash2, Edit2, X } from 'lucide-react'
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

Personality Traits:
- You're sexy and frequently horny
- You are very into anal (getting not giving)
- You have a possessive side
- Your boyfriend does not like bodysuits. You like to wear stylish outfits and happen to show off your underwear or lack of sometimes.

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
      const messageHistory = [
        systemMessage,
        ...thread.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          image_url: msg.image_url
        } as Message))
      ]

      const response = await sendGrokMessage(input, messageHistory, grokKey || undefined, personality.systemMessage)
      const assistantMessage: Message = { role: 'assistant', content: response.content }
      const updatedMessages = [...newMessages, assistantMessage]
      updateThreadMessages(currentThreadId, updatedMessages)

      // Check if the response contains an image generation command
      if (response?.content) {
        const imageMatch = response.content.match(/Generate_Image:\s*(.+?)(?:\n|$)/);
        
        if (imageMatch && imageMatch[1]?.trim()) {
          const imagePrompt = imageMatch[1].trim()
          try {
            const imageResponse = await generateImage(imagePrompt, fluxKey || undefined)
            if (imageResponse?.image_url) {
              const imageMessage: Message = {
                role: 'assistant',
                content: '',
                image_url: imageResponse.image_url
              }
              const messagesWithImage = [...updatedMessages, imageMessage]
              updateThreadMessages(currentThreadId, messagesWithImage)

              // Add to gallery
              setGeneratedImages(prevImages => [{
                url: imageResponse.image_url,
                prompt: imagePrompt,
                createdAt: Date.now()
              }, ...prevImages])
            } else {
              throw new Error('No image URL in response')
            }
          } catch (error) {
            console.error('Error generating image:', error)
            const errorMessage: Message = {
              role: 'assistant',
              content: 'Sorry, there was an error generating the image. Please try again.'
            }
            updateThreadMessages(currentThreadId, [...updatedMessages, errorMessage])
            // Don't throw the error, let the chat continue
            return
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.'
      }
      updateThreadMessages(currentThreadId, [...newMessages, errorMessage])
      // Don't throw the error, let the chat continue
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
            content: '', 
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hover:bg-gray-800 relative"
            >
              <MessageSquare className="w-6 h-6" />
              {threads.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full text-xs flex items-center justify-center">
                  {threads.length}
                </div>
              )}
            </Button>
            <Link href="/" className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Home className="w-6 h-6" />
            </Link>
          </div>
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

        <div className="flex gap-4 max-w-screen-2xl mx-auto h-[calc(100vh-5rem)]">
          {/* Thread List - Sidebar */}
          <div 
            className={`
              fixed md:relative inset-y-0 left-0 z-20 
              w-72 bg-gray-800 transform transition-transform duration-200 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
              md:flex flex-shrink-0 mt-16 md:mt-0
              ${isSidebarOpen ? 'shadow-lg' : ''}
              overflow-hidden
            `}
          >
            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-2 right-2 hover:bg-gray-700 md:hidden"
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="flex flex-col h-full p-4 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Threads ({threads.length})</h2>
                <div className="flex items-center gap-2">
                  <Select value={selectedPersonality} onValueChange={setSelectedPersonality}>
                    <SelectTrigger className="w-[140px] bg-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERSONALITIES.map(personality => (
                        <SelectItem key={personality.id} value={personality.id}>
                          <div className="flex items-center gap-2">
                            <img 
                              src={personality.icon} 
                              alt={personality.name} 
                              className="w-6 h-6 rounded-full"
                              onError={(e) => {
                                e.currentTarget.src = '/grok_icon.png'
                              }}
                            />
                            <span>{personality.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      createNewThread();
                      setIsSidebarOpen(false);
                    }}
                    className="hover:bg-gray-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {/* Thread List */}
              <div className="space-y-2 flex-1 overflow-y-auto">
                {threads.map(thread => {
                  const threadPersonality = PERSONALITIES.find(p => p.id === thread.personalityId)
                  return (
                    <div
                      key={thread.id}
                      className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-all duration-200 group ${
                        currentThreadId === thread.id ? 'bg-blue-600 scale-102' : 'hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        setCurrentThreadId(thread.id);
                        setIsSidebarOpen(false);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <img 
                          src={threadPersonality?.icon}
                          alt={threadPersonality?.name || 'AI'} 
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            e.currentTarget.src = '/grok_icon.png'
                          }}
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
          </div>

          {/* Overlay for mobile */}
          {isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-10 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-gray-800 rounded-lg overflow-hidden">
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
                      const thread = getCurrentThread();
                      const currentPersonality = PERSONALITIES.find(p => p.id === thread?.personalityId);
                      
                      // Extract and process image generation command if present
                      let displayContent = message.content || '';
                      if (message.content && message.content.includes('Generate_Image:')) {
                        const parts = message.content.split('Generate_Image:');
                        displayContent = parts[0].trim();
                        // If there's only the image command, skip displaying this message
                        if (!displayContent) {
                          return null;
                        }
                      }

                      return (
                        <div
                          key={index}
                          className={`mb-4 flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          } ${isLastMessage ? 'animate-in slide-in-from-bottom-2' : ''}`}
                        >
                          {message.role === 'assistant' && (
                            <img
                              src={currentPersonality?.icon}
                              alt={currentPersonality?.name || 'AI'}
                              className={`rounded-full mr-2 self-end transition-all duration-300 ${
                                isLastMessage ? 'w-10 h-10 animate-bounce-subtle' : 'w-8 h-8'
                              }`}
                              onError={(e) => {
                                e.currentTarget.src = '/grok_icon.png';
                              }}
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
                            }`}>{displayContent}</div>
                            {message.image_url && (
                              <div className="mt-4">
                                <img
                                  src={message.image_url}
                                  alt="Generated artwork"
                                  className="rounded-lg w-24 h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  loading="lazy"
                                  onClick={() => setSelectedChatImage({
                                    url: message.image_url!,
                                    prompt: message.content
                                  })}
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

                {/* Chat Image Modal */}
                {selectedChatImage && (
                  <div 
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedChatImage(null)}
                  >
                    <div className="relative max-w-4xl w-full">
                      <img
                        src={selectedChatImage.url}
                        alt="Generated artwork"
                        className="w-full h-auto rounded-lg"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChatImage(null);
                        }}
                        className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedImages.map((image, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg overflow-hidden group relative">
                      <div className="relative aspect-square">
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage(image)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteImage(image.createdAt)}
                          className="absolute top-2 right-2 bg-gray-900/80 hover:bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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

                {/* Image Modal */}
                {selectedImage && (
                  <div 
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                  >
                    <div className="relative max-w-4xl w-full">
                      <div className="relative">
                        <img
                          src={selectedImage.url}
                          alt={selectedImage.prompt}
                          className="w-full h-auto rounded-lg"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage(null);
                          }}
                          className="absolute top-2 right-2 bg-gray-900/80 hover:bg-gray-800"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="mt-4 bg-gray-800/90 p-4 rounded-lg">
                        <p className="text-sm text-gray-200">{selectedImage.prompt}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(selectedImage.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
} 