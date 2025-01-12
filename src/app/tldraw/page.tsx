'use client'

import { Tldraw, Editor } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import Link from 'next/link'
import { Home } from 'lucide-react'
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
    <div className="h-screen w-screen flex flex-col">
      {/* Navigation Header */}
      <div className="flex items-center gap-4 p-4 bg-gray-900">
        <Link href="/" className="text-white hover:text-blue-400 transition-colors">
          <Home className="h-6 w-6" />
        </Link>
        <h1 className="text-xl font-bold text-white">TLDraw</h1>
        {saveError && (
          <div className="text-red-500 ml-4">{saveError}</div>
        )}
        {isSaving && (
          <div className="text-gray-400 ml-4">Saving...</div>
        )}
      </div>

      {/* TLDraw Editor */}
      <div className="flex-1">
        <Tldraw
          onMount={setEditor}
        />
      </div>
    </div>
  )
} 