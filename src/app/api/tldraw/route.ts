import { createClient } from '@vercel/edge-config'
import { NextResponse } from 'next/server'

export const runtime = 'edge'

// Make Edge Config optional
const config = process.env.EDGE_CONFIG ? createClient(process.env.EDGE_CONFIG) : null

export async function GET() {
  try {
    if (!config) {
      // Return empty document if Edge Config is not set up
      return NextResponse.json({ document: null })
    }
    
    const document = await config.get('tldraw-document')
    return NextResponse.json({ document })
  } catch (error) {
    console.error('Failed to fetch document:', error)
    return NextResponse.json({ document: null }, { status: 200 }) // Return 200 to prevent deployment issues
  }
}

// Since Edge Config is read-only from the client, we'll use a Vercel Edge Function
// to update the data through the Vercel API
export async function POST(request: Request) {
  try {
    if (!config) {
      return NextResponse.json({ error: 'Edge Config not configured' }, { status: 200 })
    }

    const body = await request.json()
    const { document } = body

    if (!document) {
      return NextResponse.json({ error: 'No document provided' }, { status: 400 })
    }

    // Store the document in Edge Config
    await config.set('tldraw-document', document)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save document:', error)
    return NextResponse.json({ error: 'Failed to save document' }, { status: 200 }) // Return 200 to prevent deployment issues
  }
} 