'use client'

import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { GachaPull } from '@/components/GachaPull'
import { PullResult } from '@/types/game'
import { PlayerStats } from '@/types/database'

export default function GachaPage() {
  const { user } = useUser()
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)

  const handlePull = async (): Promise<PullResult> => {
    if (!user?.id) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const response = await fetch('/api/pull', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userid: user.id
        })
      })

      if (!response.ok) {
        throw new Error('Pull failed')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Pull error:', error)
      return { 
        success: false, 
        error: 'Failed to perform pull' 
      }
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-8">Character Gacha</h1>
      
      <div className="max-w-md mx-auto">
        <GachaPull 
          onPull={handlePull}
          disabled={!user}
        />
      </div>
    </div>
  )
} 