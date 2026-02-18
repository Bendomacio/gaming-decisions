import type { ProtonFilter, ReleaseDateFilter, GameModeFilters, SortOption } from '../types'

export interface AppConfig {
  minReviewCount: number
  defaultLinuxOnly: boolean
  defaultReleaseDateFilter: ReleaseDateFilter
  defaultGameModes: GameModeFilters
  defaultExcludeTags: string[]
  defaultSortBy: SortOption
  defaultProtonFilter: ProtonFilter
}

const STORAGE_KEY = 'gaming-decisions-config'

export const DEFAULT_CONFIG: AppConfig = {
  minReviewCount: 150,
  defaultLinuxOnly: false,
  defaultReleaseDateFilter: 'all',
  defaultGameModes: {
    multiplayer: true,
    coop: true,
    singlePlayer: false,
    localMultiplayer: false,
  },
  defaultExcludeTags: ['Massively Multiplayer'],
  defaultSortBy: 'recommendation',
  defaultProtonFilter: 'all',
}

export function loadConfig(): AppConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
    }
  } catch { /* ignore */ }
  return DEFAULT_CONFIG
}

export function saveConfig(config: AppConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}
