'use client'

import Link from 'next/link'
import Image from 'next/image'
import { StarField } from './components/StarField'
import { useAuth } from './providers'
import { Loader2, Coins, Clock, PlayCircle, Gift } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'

const Home = () => {
  const { user, loading, signIn, signOut } = useAuth()
  const [playerStats, setPlayerStats] = useState<{
    gold: number;
    moves: number;
  } | null>(null)
  const [hasCards, setHasCards] = useState(false)
  const [loadingStarterPack, setLoadingStarterPack] = useState(false)

  // Load player stats
  useEffect(() => {
    if (!user) {
      setPlayerStats(null)
      setHasCards(false)
      return
    }

    const loadStats = async () => {
      const { data, error } = await supabase
        .from('playerstats')
        .select('gold, moves')
        .eq('userid', user.id)
        .single()

      if (error) {
        console.error('Error loading stats:', error)
        return
      }

      setPlayerStats(data)

      // Check if user has any cards (for starter pack)
      const { count } = await supabase
        .from('UserCollection')
        .select('*', { count: 'exact', head: true })
        .eq('userid', user.id)

      setHasCards(!!count)
    }

    loadStats()
  }, [user])

  // Handle starter pack claim
  const handleStarterPack = async () => {
    if (!user?.id) return
    setLoadingStarterPack(true)
    try {
      const response = await fetch('/api/starter-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      
      if (!response.ok) throw new Error('Failed to claim starter pack')
      
      const result = await response.json()
      if (result.success) {
        toast.success('Starter pack claimed! Check your collection.')
        // Refresh stats and card status
        const { data } = await supabase
          .from('playerstats')
          .select('gold, moves')
          .eq('userid', user.id)
          .single()
        
        setPlayerStats(data)
        setHasCards(true)
      }
    } catch (err) {
      console.error('Error claiming starter pack:', err)
      toast.error('Failed to claim starter pack')
    } finally {
      setLoadingStarterPack(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-900/90 text-white">
      <StarField />
      
      {/* Auth Status Bar */}
      <div className="fixed top-0 right-0 p-4 z-20">
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        ) : user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">
              Welcome, {user.email?.split('@')[0]}
            </span>
            <button
              onClick={signOut}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={signIn}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium transition-colors"
          >
            Sign In
          </button>
        )}
      </div>

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
            href={user ? "/tldraw" : "#"}
            onClick={e => !user && e.preventDefault()}
            className={`group relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 transition-all duration-500 backdrop-blur-sm shadow-lg ${
              user ? 'hover:border-blue-500 hover:scale-105 hover:shadow-blue-500/20' : 'opacity-75 cursor-not-allowed'
            } animate-float`}
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
            href={user ? "/chatbot" : "#"}
            onClick={e => !user && e.preventDefault()}
            className={`group relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 transition-all duration-500 backdrop-blur-sm shadow-lg ${
              user ? 'hover:border-blue-500 hover:scale-105 hover:shadow-blue-500/20' : 'opacity-75 cursor-not-allowed'
            } animate-float-delayed`}
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

          {/* CharaSphere Card */}
          <Link 
            href={user ? "/charasphere" : "#"}
            onClick={e => !user && e.preventDefault()}
            className={`group relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 transition-all duration-500 backdrop-blur-sm shadow-lg ${
              user ? 'hover:border-blue-500 hover:scale-105 hover:shadow-blue-500/20' : 'opacity-75 cursor-not-allowed'
            } animate-float-more-delayed`}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-gray-900/70">
                {/* Card Grid Preview */}
                <div className="absolute inset-0 grid grid-cols-5 gap-1 p-4 opacity-30">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="aspect-[2.5/3.5] rounded-md border border-blue-500/50" />
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="relative h-full p-6 flex flex-col justify-between">
              {/* Title and Description */}
              <div>
                <h2 className="text-3xl font-bold mb-3 text-white group-hover:text-blue-400">CharaSphere</h2>
                <p className="text-gray-300 text-lg">Collect and battle with character cards</p>
              </div>

              {user && playerStats && (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="text-yellow-100">{playerStats.gold} Gold</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-100">{playerStats.moves} Moves</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href="/charasphere/game"
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 rounded-lg text-sm hover:bg-blue-500 transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <PlayCircle className="w-4 h-4" />
                      Play
                    </Link>
                    {!hasCards && (
                      <button
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleStarterPack()
                        }}
                        disabled={loadingStarterPack}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 rounded-lg text-sm hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingStarterPack ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Claiming...</span>
                          </>
                        ) : (
                          <>
                            <Gift className="w-4 h-4" />
                            <span>Claim Starter Pack</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!user && (
                <div className="mt-4 p-3 bg-gray-800/80 rounded-lg">
                  <p className="text-gray-400 text-sm">Sign in to start your collection!</p>
                </div>
              )}
            </div>
          </Link>

          {/* Collections Card */}
          <Link 
            href={user ? "/collections" : "#"}
            onClick={e => !user && e.preventDefault()}
            className={`group relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 transition-all duration-500 backdrop-blur-sm shadow-lg ${
              user ? 'hover:border-blue-500 hover:scale-105 hover:shadow-blue-500/20' : 'opacity-75 cursor-not-allowed'
            } animate-float-most-delayed`}
          >
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent group-hover:opacity-75 transition-opacity duration-500" />
            </div>
            <div className="relative h-full p-6 flex flex-col justify-end">
              <div className="transform group-hover:translate-y-[-4px] transition-transform duration-500">
                <h2 className="text-3xl font-bold mb-3 text-white group-hover:text-blue-400">Collections</h2>
                <p className="text-gray-300 text-lg">Browse and explore character collections</p>
              </div>
            </div>
          </Link>
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