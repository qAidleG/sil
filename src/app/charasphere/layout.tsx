'use client'

import { StarField } from '../components/StarField'
import Link from 'next/link'
import { Home } from 'lucide-react'

export default function CharaSphereLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <StarField />
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* Navigation */}
        <div className="mb-6 flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
            <Home size={20} />
            <span>Home</span>
          </Link>
          <span className="text-gray-600">/</span>
          <Link href="/charasphere" className="text-blue-400 hover:text-blue-300 transition-colors">
            CharaSphere
          </Link>
        </div>

        {children}
      </div>
    </main>
  )
} 