'use client'

import React from 'react'
import { Home } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-red-400">Something went wrong</h2>
            <p className="text-gray-400">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 text-gray-300"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white flex items-center space-x-2"
              >
                <Home size={18} />
                <span>Return Home</span>
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
} 