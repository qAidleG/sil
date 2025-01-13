'use client'

import { useState, useRef, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Settings, Home, Plus, Image as ImageIcon, MessageSquare, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { sendGrokMessage, generateImage } from '@/lib/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
  image_url?: string
}

interface Thread {
  id: string
  name: string
  messages: Message[]
  createdAt: number
}

interface GeneratedImage {
  url: string
  prompt: string
  createdAt: number
}

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
    const newThread: Thread = {
      id: Date.now().toString(),
      name: `Chat ${threads.length + 1}`,
      messages: [],
      createdAt: Date.now()
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

    const newMessage: Message = { role: 'user', content: input }
    const newMessages = [...thread.messages, newMessage]
    updateThreadMessages(currentThreadId, newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const messageHistory = thread.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const response = await sendGrokMessage(input, messageHistory, grokKey || undefined)
      const assistantMessage: Message = { role: 'assistant', content: response.content }
      const updatedMessages = [...newMessages, assistantMessage]
      updateThreadMessages(currentThreadId, updatedMessages)

      if (response.content.toLowerCase().includes('generate') && response.content.toLowerCase().includes('image')) {
        try {
          // Extract the image description from Grok's response
          const description = response.content.match(/generate image:?\s*([^.!?\n]+)/i)?.[1] ||
                            response.content.match(/generating:?\s*([^.!?\n]+)/i)?.[1] ||
                            input;
          
          const imageResponse = await generateImage(description, fluxKey || undefined)
          const imageMessage: Message = {
            role: 'assistant',
            content: `I've generated an image based on this description: "${description}"`,
            image_url: imageResponse.image_url
          }
          const finalMessages = [...updatedMessages, imageMessage]
          updateThreadMessages(currentThreadId, finalMessages)

          // Add to gallery
          setGeneratedImages([{
            url: imageResponse.image_url,
            prompt: description,
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="flex justify-between items-center mb-4">
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

      {showSettings && (
        <Card className="p-4 mb-4 bg-gray-800 border-gray-700">
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

      <div className="grid grid-cols-4 gap-4 h-[calc(100vh-8rem)]">
        {/* Thread List */}
        <div className="col-span-1 bg-gray-800 rounded-lg p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Threads</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={createNewThread}
              className="hover:bg-gray-700"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {threads.map(thread => (
              <div
                key={thread.id}
                className={`flex justify-between items-center p-2 rounded-lg cursor-pointer ${
                  currentThreadId === thread.id ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
                onClick={() => setCurrentThreadId(thread.id)}
              >
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="truncate">{thread.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteThread(thread.id)
                  }}
                  className="hover:bg-gray-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-3 flex flex-col h-full">
          <Tabs defaultValue="chat" className="w-full h-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="image">Image Generation</TabsTrigger>
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex-1 mt-4">
              <div className="h-[calc(100vh-16rem)] bg-gray-800 rounded-lg p-4 mb-4 overflow-y-auto">
                {currentThreadId ? (
                  getCurrentThread()?.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`mb-4 flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <img
                          src="/grok_icon.png"
                          alt="Grok AI"
                          className="w-8 h-8 rounded-full mr-2 self-end"
                        />
                      )}
                      <div
                        className={`p-3 rounded-lg max-w-[80%] ${
                          message.role === 'user'
                            ? 'bg-blue-600'
                            : 'bg-gray-700'
                        }`}
                      >
                        <div className="break-words">{message.content}</div>
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
                        <div className="w-8 h-8 rounded-full bg-blue-500 ml-2 flex items-center justify-center self-end">
                          <span className="text-sm">You</span>
                        </div>
                      )}
                    </div>
                  ))
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
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                  placeholder={currentThreadId ? "Type your message..." : "Create a thread to start chatting"}
                  className="bg-gray-800 border-gray-700"
                  disabled={isLoading || !currentThreadId}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isLoading || !currentThreadId}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="image" className="mt-4">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Describe the image you want to generate..."
                    className="bg-gray-800 border-gray-700"
                    disabled={isLoading}
                  />
                  <Button onClick={handleGenerateImage} disabled={isLoading}>
                    {isLoading ? 'Generating...' : 'Generate'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {generatedImages.map((image, index) => (
                  <div key={index} className="bg-gray-800 rounded-lg overflow-hidden">
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
  )
} 