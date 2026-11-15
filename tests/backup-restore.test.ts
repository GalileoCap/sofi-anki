import { beforeEach, describe, expect, it, vi } from 'vitest'
import { importAllData, loadDecks, saveDecks } from '@/lib/storage'
import type { Deck } from '@/types'

const deck: Deck = { id: 'd1', title: 'Kept', tags: [], cards: [], createdAt: 1 }

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
  })
  saveDecks([deck])
})

describe('restoring a file that is not a backup', () => {
  it('refuses in replace mode and keeps every deck', () => {
    const deckExport = JSON.stringify({ title: 'A shared deck', cards: [] })
    expect(() => importAllData(deckExport, 'replace')).toThrow()
    expect(loadDecks()).toEqual([deck])
  })
})
