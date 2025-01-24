import { useState } from 'react'
import { PullResult } from '@/types/game'
import { Button } from './ui/button'
import { Card } from './ui/card'

interface GachaPullProps {
  onPull: () => Promise<PullResult>
  disabled?: boolean
}

export function GachaPull({ onPull, disabled = false }: GachaPullProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<PullResult | null>(null)

  const handlePull = async () => {
    setIsLoading(true)
    try {
      const pullResult = await onPull()
      setResult(pullResult)
    } catch (error) {
      console.error('Pull failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Button 
        onClick={handlePull} 
        disabled={disabled || isLoading}
      >
        {isLoading ? 'Pulling...' : 'Pull Character'}
      </Button>

      {result && (
        <Card className="p-4 w-full max-w-sm">
          {result.success ? (
            <div className="text-center">
              <h3 className="text-lg font-bold">{result.character?.name}</h3>
              {result.character?.image1url && (
                <img 
                  src={result.character.image1url} 
                  alt={result.character.name}
                  className="w-full h-48 object-cover rounded mt-2"
                />
              )}
              <p className="mt-2 text-sm text-gray-600">
                Series: {result.character?.Series?.name}
              </p>
            </div>
          ) : (
            <p className="text-red-500 text-center">{result.error}</p>
          )}
        </Card>
      )}
    </div>
  )
} 