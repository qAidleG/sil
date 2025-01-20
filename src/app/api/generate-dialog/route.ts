import { NextResponse } from 'next/server'

interface Character {
  name: string
  series?: string
}

interface DialogRequest {
  outgoingCharacter: Character
  incomingCharacter: Character
}

export async function POST(request: Request) {
  try {
    const body: DialogRequest = await request.json()
    const { outgoingCharacter, incomingCharacter } = body

    // Generate contextual dialog based on characters and their series
    const outgoingContext = outgoingCharacter.series ? 
      `from ${outgoingCharacter.series}` : ''
    const incomingContext = incomingCharacter.series ?
      `from ${incomingCharacter.series}` : ''

    // Generate dialog options based on context
    const dialogOptions = [
      {
        outgoing: `Take care of our friends here, ${incomingCharacter.name}!`,
        incoming: `Leave it to me, ${outgoingCharacter.name}! I'll make sure to discover every tile!`
      },
      {
        outgoing: `Time for me to rest. Show them what you've got, ${incomingCharacter.name}!`,
        incoming: `Thanks ${outgoingCharacter.name}! I'll make the most of these moves!`
      },
      {
        outgoing: `${incomingCharacter.name}, the adventure is yours now. Make it count!`,
        incoming: `I won't let you down, ${outgoingCharacter.name}! Let's find some treasure!`
      }
    ]

    // Randomly select a dialog pair
    const selectedDialog = dialogOptions[Math.floor(Math.random() * dialogOptions.length)]

    return NextResponse.json(selectedDialog)
  } catch (error) {
    console.error('Error generating dialog:', error)
    return NextResponse.json(
      { error: 'Failed to generate dialog' },
      { status: 500 }
    )
  }
} 