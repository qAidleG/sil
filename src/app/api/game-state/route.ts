import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get player stats
    const { data: playerStats, error: statsError } = await supabaseAdmin
      .from('PlayerStats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError) {
      // If stats don't exist, return default values
      return NextResponse.json({
        moves: 30,
        gold: 0,
        last_move_refresh: new Date().toISOString()
      });
    }

    return NextResponse.json(playerStats);
  } catch (error) {
    console.error('Error in game state route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, moves, gold, lastMoveRefresh, grid } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Saving game state for user:', userId);

    // Update player stats
    const { error: statsError } = await supabaseAdmin
      .from('playerstats')  // lowercase
      .upsert({
        user_id: userId,
        moves,
        gold,
        last_move_refresh: lastMoveRefresh
      });

    if (statsError) {
      console.error('Error saving player stats:', statsError);
      throw statsError;
    }

    // Update grid progress if provided
    if (grid) {
      console.log('Saving grid progress:', grid.length, 'tiles');
      const { error: gridError } = await supabaseAdmin
        .from('gridprogress')  // lowercase
        .upsert({
          user_id: userId,
          discoveredTiles: JSON.stringify(grid),
          goldCollected: gold
        });

      if (gridError) {
        console.error('Error saving grid progress:', gridError);
        throw gridError;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in game state route:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Delete grid progress
    const { error: gridError } = await supabaseAdmin
      .from('GridProgress')
      .delete()
      .eq('user_id', userId);

    if (gridError) {
      throw gridError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in game state route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 