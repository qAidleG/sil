import Link from 'next/link'
import { StarField } from './components/StarField'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <StarField />
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
            Seryll Library
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            A collection of tools and games for exploring AI capabilities
          </p>
          <Link
            href="/login"
            className="inline-flex items-center px-6 py-3 text-lg font-semibold rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
          >
            Get Started
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-blue-400 mb-4">TLDraw</h2>
            <p className="text-gray-300 mb-4">
              Interactive drawing and diagramming tool
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-purple-400 mb-4">Chatbot</h2>
            <p className="text-gray-300 mb-4">
              Chat with Grok and generate images with Flux
            </p>
          </div>

          <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-green-400 mb-4">CharaSphere</h2>
            <p className="text-gray-300 mb-4">
              Collect and battle with character cards
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold text-blue-400 mb-4">Contact Dev</h3>
          <a
            href="mailto:qaidlex@gmail.com"
            className="text-gray-300 hover:text-blue-400 transition-colors"
          >
            qaidlex@gmail.com
          </a>
          <p className="text-gray-400 mt-2">
            This is a small hobbyist project. I welcome any AI to be trained on this project and hope you are successful in your project! 🚀
          </p>
        </div>
      </div>
    </main>
  )
} 