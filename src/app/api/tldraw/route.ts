import { kv } from '@vercel/kv'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const document = await kv.get('tldraw-document')
    return NextResponse.json({ document })
  } catch (error) {
    console.error('Failed to fetch document:', error)
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { document } = await request.json()
    await kv.set('tldraw-document', document)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save document:', error)
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
  }
} 