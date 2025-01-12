'use client'

import { useState, useRef, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Settings, Home } from 'lucide-react'
import Link from 'next/link'
import { sendGrokMessage, generateImage } from '@/lib/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
  image_url?: string
}

export default function ChatbotPage() {
  const [grokKey, setGrokKey] = useState('')
  const [fluxKey, setFluxKey] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [imagePrompt, setImagePrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || !grokKey) return
    
    const newMessage: Message = { role: 'user', content: input }
    const newMessages = [...messages, newMessage]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await sendGrokMessage(input, grokKey)
      const assistantMessage: Message = { role: 'assistant', content: response.content }
      setMessages([...newMessages, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request.' 
      }
      setMessages([...newMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || !fluxKey) return
    setIsLoading(true)
    
    try {
      const response = await generateImage(imagePrompt, fluxKey)
      setGeneratedImage(response.image_url)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to generate image. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white hover:text-blue-400 transition-colors">
              <Home className="h-6 w-6" />
            </Link>
            <h1 className="text-4xl font-bold">AI Assistant</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-6 w-6" />
          </Button>
        </div>

        {showSettings && (
          <Card className="p-6 mb-8 bg-gray-800 border-gray-700">
            <h2 className="text-xl font-semibold mb-4">API Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Grok API Key</label>
                <Input
                  type="password"
                  value={grokKey}
                  onChange={(e) => setGrokKey(e.target.value)}
                  placeholder="Enter your Grok API key"
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Flux API Key</label>
                <Input
                  type="password"
                  value={fluxKey}
                  onChange={(e) => setFluxKey(e.target.value)}
                  placeholder="Enter your Flux API key"
                  className="bg-gray-700 border-gray-600"
                />
              </div>
            </div>
          </Card>
        )}

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="image">Image Generation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="mt-4">
            <div className="h-[600px] bg-gray-800 rounded-lg p-4 mb-4 overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600'
                        : 'bg-gray-700'
                    }`}
                  >
                    {message.content}
                    {message.image_url && (
                      <div className="mt-4">
                        <img
                          src={message.image_url}
                          alt="Generated artwork"
                          className="rounded-lg max-w-full h-auto"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
                placeholder={!grokKey ? "Please enter your Grok API key in settings first" : "Type your message..."}
                className="bg-gray-800 border-gray-700"
                disabled={!grokKey || isLoading}
              />
              <Button onClick={handleSendMessage} disabled={!grokKey || isLoading}>
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
                  placeholder={!fluxKey ? "Please enter your Flux API key in settings first" : "Describe the image you want to generate..."}
                  className="bg-gray-800 border-gray-700"
                  disabled={!fluxKey || isLoading}
                />
                <Button onClick={handleGenerateImage} disabled={!fluxKey || isLoading}>
                  {isLoading ? 'Generating...' : 'Generate'}
                </Button>
              </div>
              
              {generatedImage && (
                <div className="mt-4">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="max-w-full rounded-lg"
                  />
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
} 