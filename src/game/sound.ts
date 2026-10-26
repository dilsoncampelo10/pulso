/**
 * Efeitos sonoros sintetizados com Web Audio — sem arquivos de áudio externos,
 * então o jogo funciona offline desde o primeiro carregamento.
 *
 * Navegadores só liberam áudio após um gesto do usuário: chame `unlock()`
 * dentro de um clique/toque (ex.: botão "Jogar").
 */

export type SoundKind = 'switch' | 'collect' | 'crash' | 'start'

const MASTER_VOLUME = 0.35

class SoundFx {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  enabled = true

  unlock(): void {
    if (typeof window === 'undefined') return
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!Ctor) return
        this.ctx = new Ctor()
        this.master = this.ctx.createGain()
        this.master.gain.value = MASTER_VOLUME
        this.master.connect(this.ctx.destination)
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume()
    } catch {
      // Áudio indisponível: o jogo segue em silêncio.
      this.ctx = null
    }
  }

  play(kind: SoundKind): void {
    if (!this.enabled || !this.ctx || !this.master || this.ctx.state !== 'running') return
    const t = this.ctx.currentTime
    switch (kind) {
      case 'switch':
        this.tone(t, 'square', 520, 680, 0.05, 0.08)
        break
      case 'collect':
        this.tone(t, 'triangle', 880, 1320, 0.09, 0.22)
        this.tone(t + 0.06, 'triangle', 1320, 1760, 0.08, 0.16)
        break
      case 'start':
        this.tone(t, 'sine', 330, 660, 0.18, 0.18)
        break
      case 'crash':
        this.tone(t, 'sawtooth', 220, 40, 0.35, 0.3)
        this.burst(t, 0.25, 0.35)
        break
    }
  }

  private tone(start: number, type: OscillatorType, from: number, to: number, dur: number, vol: number): void {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(from, start)
    osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), start + dur)
    gain.gain.setValueAtTime(vol, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(gain).connect(this.master!)
    osc.start(start)
    osc.stop(start + dur + 0.02)
  }

  private burst(start: number, dur: number, vol: number): void {
    const ctx = this.ctx!
    if (!this.noise) {
      const len = Math.floor(ctx.sampleRate * 0.4)
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate)
      const data = this.noise.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    }
    const src = ctx.createBufferSource()
    const gain = ctx.createGain()
    src.buffer = this.noise
    gain.gain.setValueAtTime(vol, start)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    src.connect(gain).connect(this.master!)
    src.start(start)
    src.stop(start + dur)
  }
}

/** Instância única compartilhada pela interface e pela cena. */
export const sfx = new SoundFx()
