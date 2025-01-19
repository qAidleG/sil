'use client'

import React from 'react'
import Link from 'next/link'
import { StarField } from '../components/StarField'
import { Home, LayoutGrid, Swords, Trophy, User } from 'lucide-react'

export default function CharaSpherePage() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <StarField />
      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/" className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors w-fit">
            <Home size={20} />
            <span>Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            CharaSphere
          </h1>
          <p className="mt-4 text-xl text-gray-300">
            Collect, build decks, and battle with your favorite characters
          </p>
        </div>

        {/* Main Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Collection Link */}
          <Link 
            href="/collections" 
            className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 hover:border-blue-500 transition-all duration-500 hover:scale-105 backdrop-blur-sm"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <LayoutGrid className="w-16 h-16 text-blue-400 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 text-center">
              <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">Collection</h2>
              <p className="text-sm text-gray-400">View and manage your cards</p>
            </div>
          </Link>

          {/* Deck Builder Link - Coming Soon */}
          <div className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 backdrop-blur-sm">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <LayoutGrid className="w-16 h-16 text-gray-600" />
              <span className="mt-4 text-gray-500 font-semibold">Coming Soon</span>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 text-center">
              <h2 className="text-xl font-bold text-gray-600">Deck Builder</h2>
              <p className="text-sm text-gray-500">Create and customize decks</p>
            </div>
          </div>

          {/* Battle Arena Link - Coming Soon */}
          <div className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 backdrop-blur-sm">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Swords className="w-16 h-16 text-gray-600" />
              <span className="mt-4 text-gray-500 font-semibold">Coming Soon</span>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 text-center">
              <h2 className="text-xl font-bold text-gray-600">Battle Arena</h2>
              <p className="text-sm text-gray-500">Challenge other players</p>
            </div>
          </div>

          {/* Rankings Link - Coming Soon */}
          <div className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 backdrop-blur-sm">
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Trophy className="w-16 h-16 text-gray-600" />
              <span className="mt-4 text-gray-500 font-semibold">Coming Soon</span>
            </div>
            <div className="absolute bottom-0 inset-x-0 p-4 text-center">
              <h2 className="text-xl font-bold text-gray-600">Rankings</h2>
              <p className="text-sm text-gray-500">Global leaderboards</p>
            </div>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="mt-12 p-6 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <h3 className="text-xl font-bold text-blue-400 mb-2">🎮 Game Features Coming Soon</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Deck building with strategy guides</li>
            <li>Real-time battles with other players</li>
            <li>Character abilities and special moves</li>
            <li>Seasonal rankings and rewards</li>
            <li>Character evolution and power-ups</li>
          </ul>
        </div>
      </div>
    </main>
  )
} 