'use client'

import Link from 'next/link'
import Image from 'next/image'

const Home = () => {
  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-12">Secretaries Infinite Library</h1>
        
        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* TlDraw Card */}
          <Link 
            href="/tldraw" 
            className="group block relative aspect-[4/3] border-2 border-gray-700 rounded-lg hover:border-blue-500 transition-all duration-300 overflow-hidden"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src="/tldraw-preview.png"
                alt="TlDraw Preview"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain object-center"
                priority={true}
                quality={90}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-gray-900/20" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 flex flex-col justify-end h-full">
              <h2 className="text-3xl font-semibold mb-3 text-white group-hover:text-blue-400 transition-colors">TLDraw</h2>
              <p className="text-gray-300 text-lg">Interactive drawing and diagramming tool</p>
            </div>
          </Link>
          
          {/* AI Assistant Card */}
          <Link 
            href="/chatbot" 
            className="group block relative aspect-[4/3] border-2 border-gray-700 rounded-lg hover:border-blue-500 transition-all duration-300 overflow-hidden"
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-purple-600/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 flex flex-col justify-end h-full">
              <h2 className="text-3xl font-semibold mb-3 text-white group-hover:text-blue-400 transition-colors">AI Assistant</h2>
              <p className="text-gray-300 text-lg">Chat with Grok and generate images with Flux</p>
            </div>
          </Link>

          {/* Coming Soon Cards */}
          {[...Array(2)].map((_, i) => (
            <div 
              key={i}
              className="block relative aspect-[4/3] border-2 border-gray-700 rounded-lg overflow-hidden bg-gray-800/50"
            >
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
              </div>
              <div className="relative z-10 p-6 flex flex-col justify-end h-full">
                <h2 className="text-3xl font-semibold mb-3 text-gray-400">Coming Soon</h2>
                <p className="text-gray-500 text-lg">More exciting features ahead...</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="border-t border-gray-800 pt-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Dev</h2>
          <a href="mailto:your-email@example.com" className="text-blue-400 hover:text-blue-300 text-lg">
            email
          </a>
        </div>
      </div>
    </main>
  )
}

export default Home 