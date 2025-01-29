import { NextResponse } from 'next/server'
import { syncFromSheets, syncToSheets } from '@/lib/sheets'

export async function POST(request: Request) {
  try {
    const { direction } = await request.json()
    
    if (direction === 'from_sheets') {
      const result = await syncFromSheets()
      return NextResponse.json(result)
    } else if (direction === 'to_sheets') {
      const result = await syncToSheets()
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid sync direction' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in sync route:', error)
    return NextResponse.json(
      { success: false, error: 'Sync failed' },
      { status: 500 }
    )
  }
} 