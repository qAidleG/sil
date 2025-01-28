import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { Card } from './ui/card'
import { Coins, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PlayerStatsProps {
  className?: string
}

export function PlayerStats({ className = '' }: PlayerStatsProps) {
  const { user } = useUser()
  const [stats, setStats] = useState<{
    gold: number
    moves: number
    lastRefresh: string
  } | null>(null)
  const [showAnimation, setShowAnimation] = useState(false)

  // Refresh moves every minute
  useEffect(() => {
    const refreshMoves = async () => {
      if (!user?.id) return

      try {
        const response = await fetch('/api/refresh-moves', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id })
        })

        if (!response.ok) throw new Error('Failed to refresh moves')
        
        const data = await response.json()
        if (data.moves !== stats?.moves) {
          setShowAnimation(true)
          setTimeout(() => setShowAnimation(false), 1000)
        }
        setStats(prev => prev ? { ...prev, moves: data.moves, lastRefresh: data.lastRefresh } : null)
      } catch (error) {
        console.error('Error refreshing moves:', error)
      }
    }

    // Initial load
    refreshMoves()

    // Set up interval
    const interval = setInterval(refreshMoves, 60000) // Every minute

    return () => clearInterval(interval)
  }, [user?.id, stats?.moves])

  // Initial stats load
  useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return

      try {
        const response = await fetch(`/api/player-stats?userId=${user.id}`)
        if (!response.ok) throw new Error('Failed to load stats')
        
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    }

    loadStats()
  }, [user?.id])

  if (!stats) return null

  return (
    <Card className={`p-4 flex gap-4 ${className}`}>
      <motion.div 
        className="flex items-center gap-2"
        animate={showAnimation ? { scale: [1, 1.2, 1] } : {}}
      >
        <Coins className="w-5 h-5 text-yellow-500" />
        <AnimatePresence mode="wait">
          <motion.span
            key={stats.gold}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="font-bold"
          >
            {stats.gold}
          </motion.span>
        </AnimatePresence>
      </motion.div>
      <motion.div 
        className="flex items-center gap-2"
        animate={showAnimation ? { scale: [1, 1.2, 1] } : {}}
      >
        <Clock className="w-5 h-5 text-blue-500" />
        <AnimatePresence mode="wait">
          <motion.span
            key={stats.moves}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="font-bold"
          >
            {stats.moves}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </Card>
  )
} 