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

    // For default user, first check if stats exist
    const { data: existingStats, error: checkError } = await supabaseAdmin
      .from('playerstats')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('Existing stats:', existingStats, 'Check error:', checkError);

    const statsData = {
      user_id: userId,
      moves: moves ?? 30,
      gold: gold ?? 0,
      last_move_refresh: lastMoveRefresh ?? new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Stats data to save:', statsData);

    // If no stats exist, create them
    if (!existingStats) {
      console.log('Creating initial stats');
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('playerstats')
        .insert([statsData])
        .select()
        .single();

      console.log('Insert result:', insertData, 'Insert error:', insertError);

      if (insertError) {
        console.error('Error creating stats:', insertError);
        throw insertError;
      }
    } else {
      console.log('Updating existing stats');
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('playerstats')
        .update(statsData)
        .eq('user_id', userId)
        .select()
        .single();

      console.log('Update result:', updateData, 'Update error:', updateError);

      if (updateError) {
        console.error('Error updating stats:', updateError);
        throw updateError;
      }
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

      const { data: gridResult, error: gridError } = await supabaseAdmin
        .from('gridprogress')
        .upsert([gridPayload], {
          onConflict: 'user_id'
        })
        .select()
        .single();

      console.log('Grid update result:', gridResult, 'Grid error:', gridError);

      if (gridError) {
        console.error('Error updating grid:', gridError);
        throw gridError;
      }
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