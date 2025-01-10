'use client'

import { Tldraw, Editor } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import Link from 'next/link'
import { useCallback } from 'react'

export default function TlDrawPage() {
  // Handle store changes
  const handleChange = useCallback((editor: Editor) => {
    const document = editor.store.serialize()
    try {
      localStorage.setItem('tldraw-document', JSON.stringify(document))
    } catch (err) {
      console.error('Failed to save document', err)
    }
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
          persistenceKey="tldraw-document"
          onMount={(editor) => {
            try {
              const savedDocument = localStorage.getItem('tldraw-document')
              if (savedDocument) {
                const document = JSON.parse(savedDocument)
                editor.store.loadSnapshot(document)
              }
            } catch (err) {
              console.error('Failed to load document', err)
            }

            const handleStoreChange = () => handleChange(editor)
            editor.store.listen(handleStoreChange, { source: 'user', scope: 'document' })
          }}
        />
      </div>
    </main>
  )
} 