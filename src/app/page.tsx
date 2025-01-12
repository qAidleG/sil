'use client'

import Link from 'next/link'
import Image from 'next/image'

const Home = () => {
  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-12">Secretaries Infinite Library</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* TlDraw Card */}
          <Link 
            href="/tldraw" 
            className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/20"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src="/tldraw-preview.png"
                alt="TlDraw Preview"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover object-center opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                priority={true}
                quality={90}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative h-full p-6 flex flex-col justify-end">
              <div className="transform group-hover:translate-y-[-4px] transition-transform duration-300">
                <h2 className="text-3xl font-bold mb-3 text-white group-hover:text-blue-400">TLDraw</h2>
                <p className="text-gray-300 text-lg">Interactive drawing and diagramming tool</p>
              </div>
            </div>
          </Link>
          
          {/* Chatbot Card */}
          <Link 
            href="/chatbot" 
            className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/20"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src="/chatbot-preview.png"
                alt="Chatbot Preview"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover object-center opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                priority={true}
                quality={90}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative h-full p-6 flex flex-col justify-end">
              <div className="transform group-hover:translate-y-[-4px] transition-transform duration-300">
                <h2 className="text-3xl font-bold mb-3 text-white group-hover:text-blue-400">Chatbot</h2>
                <p className="text-gray-300 text-lg">Chat with Grok and generate images with Flux</p>
              </div>
            </div>
          </Link>

          {/* Coming Soon Cards */}
          {[...Array(2)].map((_, i) => (
            <div 
              key={i}
              className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700"
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
          <h2 className="text-2xl font-bold mb-4">Contact Dev</h2>
          <a href="mailto:your-email@example.com" className="text-blue-400 hover:text-blue-300 text-lg transition-colors">
            email
          </a>
        </div>
      </div>
    </main>
  )
}

export default Home 