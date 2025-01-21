import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Getting game state for user:', userId);

    // Get player stats
    const { data: playerStats, error: statsError } = await supabaseAdmin
      .from('playerstats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (statsError) {
      console.log('No existing stats, returning defaults');
      // If stats don't exist, return default values
      return NextResponse.json({
        moves: 30,
        gold: 0,
        last_move_refresh: new Date().toISOString()
      });
    }

    return NextResponse.json(playerStats);
  } catch (error) {
    console.error('Error in game state GET:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, moves, gold, lastMoveRefresh, grid } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Saving game state for user:', userId, {
      moves,
      gold,
      lastMoveRefresh,
      gridTiles: grid?.length
    });

    // Update player stats
    const { data: statsData, error: statsError } = await supabaseAdmin
      .from('playerstats')
      .upsert({
        user_id: userId,
        moves,
        gold,
        last_move_refresh: lastMoveRefresh
      })
      .select()
      .single();

    if (statsError) {
      console.error('Error saving player stats:', statsError);
      throw statsError;
    }

    console.log('Successfully saved player stats:', statsData);

    // Update grid progress if provided
    if (grid) {
      console.log('Saving grid progress:', grid.length, 'tiles');
      const { data: gridData, error: gridError } = await supabaseAdmin
        .from('gridprogress')
        .upsert({
          user_id: userId,
          discoveredTiles: grid,  // Don't stringify, Supabase handles JSONB
          goldCollected: gold
        })
        .select()
        .single();

      if (gridError) {
        console.error('Error saving grid progress:', gridError);
        throw gridError;
      }

      console.log('Successfully saved grid progress:', gridData);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in game state POST:', error);
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

    console.log('Deleting game state for user:', userId);

    // Delete grid progress
    const { error: gridError } = await supabaseAdmin
      .from('gridprogress')
      .delete()
      .eq('user_id', userId);

    if (gridError) {
      console.error('Error deleting grid progress:', gridError);
      throw gridError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in game state DELETE:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 