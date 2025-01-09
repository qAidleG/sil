'use client'

import { Tldraw, Store, StoreSnapshot } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import Link from 'next/link'
import { useCallback } from 'react'

export default function TlDrawPage() {
  // Handle store changes
  const handlePersist = useCallback((store: Store) => {
    localStorage.setItem('tldraw', JSON.stringify(store.serialize()))
  }, [])

  // Load persisted state
  const loadInitialContent = useCallback(() => {
    if (typeof window === 'undefined') return undefined
    
    const persisted = localStorage.getItem('tldraw')
    if (persisted) {
      try {
        return JSON.parse(persisted)
      } catch (e) {
        console.error('Failed to parse persisted content', e)
      }
    }
    return undefined
  }, [])

  return (
    <main className="h-screen flex flex-col bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <Link 
          href="/" 
          className="text-white hover:text-blue-400 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Back to Hub
        </Link>
        <h1 className="text-white font-semibold">TlDraw</h1>
      </nav>

      {/* TlDraw Canvas */}
      <div className="flex-1">
        <Tldraw
          persistenceKey="sil-tldraw"
          store={loadInitialContent()}
          onMount={(editor) => {
            editor.store.listen(() => {
              handlePersist(editor.store)
            })
          }}
        />
      </div>
    </main>
  )
} 