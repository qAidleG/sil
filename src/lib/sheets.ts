import { google } from 'googleapis'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Initialize Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS!),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!
const RANGE = 'Roster!A2:M' // Updated to match the Roster table name

interface CharacterRow {
  characterid: number
  name: string
  bio: string
  rarity: number
  seriesid: number
  dialogs: string[]
  image1url: string | null
  image2url: string | null
  image3url: string | null
  image4url: string | null
  image5url: string | null
  image6url: string | null
  claimed: boolean
}

// Convert sheet row to character object
function rowToCharacter(row: (string | number)[]): CharacterRow {
  return {
    characterid: parseInt(row[0] as string),
    name: row[1] as string,
    bio: row[2] as string,
    rarity: parseInt(row[3] as string),
    seriesid: parseInt(row[4] as string),
    dialogs: row[5] ? JSON.parse(row[5] as string) : [],
    image1url: row[6] as string || null,
    image2url: row[7] as string || null,
    image3url: row[8] as string || null,
    image4url: row[9] as string || null,
    image5url: row[10] as string || null,
    image6url: row[11] as string || null,
    claimed: row[12] === 'true'
  }
}

// Convert character object to sheet row
function characterToRow(char: CharacterRow): any[] {
  return [
    char.characterid.toString(),
    char.name,
    char.bio,
    char.rarity.toString(),
    char.seriesid.toString(),
    JSON.stringify(char.dialogs),
    char.image1url || '',
    char.image2url || '',
    char.image3url || '',
    char.image4url || '',
    char.image5url || '',
    char.image6url || '',
    char.claimed.toString()
  ]
}

export async function syncFromSheets() {
  try {
    // Read from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    })

    const rows = response.data.values
    if (!rows) {
      throw new Error('No data found in sheets')
    }

    // Convert rows to character objects
    const characters = rows.map(row => rowToCharacter(row))

    // Upsert to Supabase
    const { data, error } = await supabase
      .from('Roster')  // Updated to use Roster table
      .upsert(characters, { onConflict: 'characterid' })

    if (error) throw error

    return { success: true, message: `Synced ${characters.length} characters from sheets` }
  } catch (error) {
    console.error('Error syncing from sheets:', error)
    throw error
  }
}

export async function syncToSheets() {
  try {
    // Get all characters from Supabase
    const { data: characters, error } = await supabase
      .from('Roster')  // Updated to use Roster table
      .select('*')
      .order('characterid')

    if (error) throw error
    if (!characters) throw new Error('No characters found in database')

    // Convert to sheet rows
    const rows = characters.map(char => characterToRow(char))

    // Update Google Sheets
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
      valueInputOption: 'RAW',
      requestBody: {
        values: rows,
      },
    })

    return { success: true, message: `Synced ${rows.length} characters to sheets` }
  } catch (error) {
    console.error('Error syncing to sheets:', error)
    throw error
  }
}

// Check if character is claimed
export async function updateCharacterClaimed(characterId: string, claimed: boolean) {
  try {
    // Update in Supabase
    const { error: supabaseError } = await supabase
      .from('Roster')  // Updated from 'Character' to 'Roster'
      .update({ claimed })
      .eq('characterid', characterId)

    if (supabaseError) throw supabaseError

    // Sync changes to sheets
    await syncToSheets()

    return { success: true }
  } catch (error) {
    console.error('Error updating character claimed status:', error)
    return { success: false, error }
  }
} 
