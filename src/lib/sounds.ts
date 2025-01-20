import { Howl } from 'howler'

class SoundManager {
  private static instance: SoundManager
  private sounds: { [key: string]: Howl } = {}
  private isMuted: boolean = false
  private lastResetSound: 'a' | 'b' = 'a'

  // Sound durations in seconds
  public readonly durations = {
    move: 0.5,
    flip: 0.5,
    hover: 0.5,
    reset: 1.0
  }

  private constructor() {
    this.initializeSounds()
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager()
    }
    return SoundManager.instance
  }

  private initializeSounds() {
    this.sounds = {
      move: new Howl({
        src: ['/sounds/card-move.mp3'],
        volume: 0.5,
        html5: true
      }),
      flip: new Howl({
        src: ['/sounds/card-flip.mp3'],
        volume: 0.4,
        html5: true
      }),
      hover: new Howl({
        src: ['/sounds/card-hover.mp3'],
        volume: 0.2,
        html5: true
      }),
      'reset-a': new Howl({
        src: ['/sounds/card-reset-a.mp3'],
        volume: 0.4,
        html5: true
      }),
      'reset-b': new Howl({
        src: ['/sounds/card-reset-b.mp3'],
        volume: 0.4,
        html5: true
      })
    }
  }

  public play(soundName: Exclude<keyof typeof this.sounds, 'reset-a' | 'reset-b'> | 'reset') {
    if (this.isMuted) return

    if (soundName === 'reset') {
      // Alternate between reset sounds
      this.lastResetSound = this.lastResetSound === 'a' ? 'b' : 'a'
      this.sounds[`reset-${this.lastResetSound}`].play()
    } else {
      this.sounds[soundName]?.play()
    }
  }

  public toggleMute() {
    this.isMuted = !this.isMuted
    return this.isMuted
  }

  public setMute(mute: boolean) {
    this.isMuted = mute
    return this.isMuted
  }
}

export const soundManager = SoundManager.getInstance() 