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

    console.log('POST request body:', JSON.stringify(body, null, 2));

    try {
      // First check if stats exist
      const { data: existingStats, error: checkError } = await supabaseAdmin
        .from('playerstats')
        .select()
        .eq('user_id', userId)
        .single();

      let statsResult;
      if (existingStats) {
        // Update only necessary fields for existing stats
        const { data, error: updateError } = await supabaseAdmin
          .from('playerstats')
          .update({
            moves: moves ?? existingStats.moves,
            gold: gold ?? existingStats.gold,
            last_move_refresh: lastMoveRefresh ?? existingStats.last_move_refresh
          })
          .eq('user_id', userId)
          .select();

        if (updateError) {
          console.error('Error updating stats:', updateError);
          return NextResponse.json({ 
            error: 'Failed to update stats',
            details: updateError
          }, { status: 500 });
        }
        statsResult = data;
      } else {
        // Create new stats with minimal required fields
        const { data, error: insertError } = await supabaseAdmin
          .from('playerstats')
          .insert({
            user_id: userId,
            moves: moves ?? 30,
            gold: gold ?? 0,
            last_move_refresh: lastMoveRefresh ?? new Date().toISOString(),
            wins: 0,
            losses: 0,
            cards_collected: 0,
            rank: 0,
            experience: 0
          })
          .select();

        if (insertError) {
          console.error('Error inserting stats:', insertError);
          return NextResponse.json({ 
            error: 'Failed to insert stats',
            details: insertError
          }, { status: 500 });
        }
        statsResult = data;
      }

      console.log('Stats operation result:', statsResult);

      // Only update grid progress if grid is provided
      if (grid) {
        console.log('Updating grid progress');
        const gridPayload = {
          user_id: userId,
          discoveredTiles: grid,
          goldCollected: gold
        };

        const { data: gridResult, error: gridError } = await supabaseAdmin
          .from('gridprogress')
          .upsert(gridPayload)
          .eq('user_id', userId);

        if (gridError) {
          console.error('Error updating grid:', gridError);
          return NextResponse.json({ 
            error: 'Failed to update grid progress',
            details: gridError
          }, { status: 500 });
        }

        console.log('Grid operation result:', gridResult);
      } else {
        console.log('No grid provided, skipping grid progress update');
      }

      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      return NextResponse.json({ 
        error: 'Database operation failed',
        details: dbError
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in game state POST:', error);
    return NextResponse.json({ 
      error: 'Request processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
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