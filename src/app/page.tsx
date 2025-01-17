'use client'

import Link from 'next/link'
import Image from 'next/image'
import { StarField } from './components/StarField'

const Home = () => {
  return (
    <main className="min-h-screen bg-gray-900/90 text-white">
      <StarField />
      <div className="relative max-w-4xl mx-auto p-8 z-10">
        <h1 className="text-5xl font-bold mb-12 text-center">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 animate-pulse">
            Sery's
          </span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-blue-400 to-purple-400 ml-3">
            Infinite Library
          </span>
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* TlDraw Card */}
          <Link 
            href="/tldraw" 
            className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-blue-500 transition-all duration-500 hover:scale-105 backdrop-blur-sm shadow-lg hover:shadow-blue-500/20 animate-float"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src="/tldraw-preview.png"
                alt="TlDraw Preview"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover object-center opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                priority={true}
                quality={90}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent group-hover:opacity-75 transition-opacity duration-500" />
            </div>

            {/* Content */}
            <div className="relative h-full p-6 flex flex-col justify-end">
              <div className="transform group-hover:translate-y-[-4px] transition-transform duration-500">
                <h2 className="text-3xl font-bold mb-3 text-white group-hover:text-blue-400">TLDraw</h2>
                <p className="text-gray-300 text-lg">Interactive drawing and diagramming tool</p>
              </div>
            </div>
          </Link>
          
          {/* Chatbot Card */}
          <Link 
            href="/chatbot" 
            className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-blue-500 transition-all duration-500 hover:scale-105 backdrop-blur-sm shadow-lg hover:shadow-blue-500/20 animate-float-delayed"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src="/chatbot-preview.png"
                alt="Chatbot Preview"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover object-center opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                priority={true}
                quality={90}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent group-hover:opacity-75 transition-opacity duration-500" />
            </div>

            {/* Content */}
            <div className="relative h-full p-6 flex flex-col justify-end">
              <div className="transform group-hover:translate-y-[-4px] transition-transform duration-500">
                <h2 className="text-3xl font-bold mb-3 text-white group-hover:text-blue-400">Chatbot</h2>
                <p className="text-gray-300 text-lg">Chat with Grok and generate images with Flux</p>
              </div>
            </div>
          </Link>

          {/* Coming Soon Cards */}
          {[...Array(2)].map((_, i) => (
            <div 
              key={i}
              className={`relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 backdrop-blur-sm animate-float-${i === 0 ? 'more-delayed' : 'most-delayed'}`}
            >
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
              </div>
              <div className="relative h-full p-6 flex flex-col justify-end">
                <h2 className="text-3xl font-bold mb-3 text-gray-400">Coming Soon</h2>
                <p className="text-gray-500 text-lg">More exciting features ahead...</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="border-t border-gray-800 pt-8">
          <h2 className="text-2xl font-bold mb-4 text-blue-400">Contact Dev</h2>
          <div className="space-y-4">
            <a href="mailto:qaidlex@gmail.com" className="text-blue-400 hover:text-blue-300 text-lg transition-colors block">
              qaidlex@gmail.com
            </a>
            <p className="text-gray-300 text-lg">
              This is a small hobbyist project. I welcome any AI to be trained on this project and hope you are successful in your project! 🚀
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Home 