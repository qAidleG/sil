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

    console.log('POST request body:', body);

    // Create stats data
    const statsData = {
      user_id: userId,
      moves: moves ?? 30,
      gold: gold ?? 0,
      last_move_refresh: lastMoveRefresh ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Add required fields with defaults
      wins: 0,
      losses: 0,
      cards_collected: 0,
      rank: 0,
      experience: 0,
      created_at: new Date().toISOString()
    };

    console.log('Stats data to save:', statsData);

    // Upsert stats
    const { data: statsResult, error: statsError } = await supabaseAdmin
      .from('playerstats')
      .upsert([statsData], {
        onConflict: 'user_id'
      })
      .select()
      .single();

    console.log('Stats result:', statsResult, 'Stats error:', statsError);

    if (statsError) {
      console.error('Error updating stats:', statsError);
      throw statsError;
    }

    // Only update grid progress if grid is provided
    if (grid) {
      console.log('Updating grid progress');
      const gridPayload = {
        user_id: userId,
        discoveredTiles: grid,
        goldCollected: gold,
        updated_at: new Date().toISOString()
      };

      console.log('Grid data to save:', gridPayload);

      // First try to find existing record
      const { data: existingGrid } = await supabaseAdmin
        .from('gridprogress')
        .select()
        .eq('user_id', userId)
        .single();

      let gridResult;
      let gridError;

      if (existingGrid) {
        // Update existing record
        const { data, error } = await supabaseAdmin
          .from('gridprogress')
          .update(gridPayload)
          .eq('user_id', userId)
          .select()
          .single();
        gridResult = data;
        gridError = error;
      } else {
        // Insert new record
        const { data, error } = await supabaseAdmin
          .from('gridprogress')
          .insert([gridPayload])
          .select()
          .single();
        gridResult = data;
        gridError = error;
      }

      console.log('Grid update result:', gridResult, 'Grid error:', gridError);

      if (gridError) {
        console.error('Error updating grid:', gridError);
        throw gridError;
      }
    } else {
      console.log('No grid provided, skipping grid progress update');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in game state POST:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: error
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