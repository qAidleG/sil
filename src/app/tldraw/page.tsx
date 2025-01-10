'use client'

import { Tldraw, Editor } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import Link from 'next/link'
import { useCallback, useState, useEffect } from 'react'

export default function TlDrawPage() {
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editor, setEditor] = useState<Editor | null>(null)

  // Load document on mount
  useEffect(() => {
    if (!editor) return

    const loadDocument = async () => {
      try {
        // Try to load from server first
        const response = await fetch('/api/tldraw')
        if (response.ok) {
          const { document } = await response.json()
          if (document) {
            editor.store.loadSnapshot(document)
            return
          }
        }

        // Fall back to localStorage if server fails
        const savedDocument = localStorage.getItem('tldraw-document')
        if (savedDocument) {
          const document = JSON.parse(savedDocument)
          editor.store.loadSnapshot(document)
        }
      } catch (err) {
        console.error('Failed to load document:', err)
        setSaveError('Failed to load from server, using local backup if available.')
      }
    }

    loadDocument()
  }, [editor])

  // Handle store changes with debounce
  const handleChange = useCallback(
    async (editor: Editor) => {
      if (isSaving) return
      setIsSaving(true)
      setSaveError(null)

      try {
        const document = editor.store.serialize()
        
        // Save to localStorage as backup
        localStorage.setItem('tldraw-document', JSON.stringify(document))
        
        // Save to server
        const response = await fetch('/api/tldraw', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ document }),
        })

        if (!response.ok) {
          throw new Error('Failed to save to server')
        }
      } catch (err) {
        console.error('Failed to save document:', err)
        setSaveError('Failed to save changes. Your work is backed up locally.')
      } finally {
        setIsSaving(false)
      }
    },
    [isSaving]
  )

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
        <div className="flex items-center gap-4">
          {isSaving && (
            <span className="text-gray-400 text-sm">Saving...</span>
          )}
          {saveError && (
            <span className="text-red-400 text-sm">{saveError}</span>
          )}
          <h1 className="text-white font-semibold">TlDraw</h1>
        </div>
      </nav>

      {/* TlDraw Canvas */}
      <div className="flex-1">
        <Tldraw
          persistenceKey="tldraw-document"
          onMount={(editor) => {
            setEditor(editor)
            const handleStoreChange = () => handleChange(editor)
            editor.store.listen(handleStoreChange, { source: 'user', scope: 'document' })
          }}
        />
      </div>
    </main>
  )
} 