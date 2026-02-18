import type { ProtonFilter, ReleaseDateFilter, GameModeFilters, SortOption, AppTab } from '../types'

export interface TabDefaults {
  minReviewCount: number
  sortBy: SortOption
  gameModes: GameModeFilters
}

export interface AppConfig {
  // Global defaults
  defaultLinuxOnly: boolean
  defaultReleaseDateFilter: ReleaseDateFilter
  defaultExcludeTags: string[]
  defaultProtonFilter: ProtonFilter
  // Per-tab defaults
  tabs: Record<'all' | 'trending' | 'new', TabDefaults>
}

const STORAGE_KEY = 'gaming-decisions-config'

export const DEFAULT_CONFIG: AppConfig = {
  defaultLinuxOnly: false,
  defaultReleaseDateFilter: 'all',
  defaultExcludeTags: ['Massively Multiplayer'],
  defaultProtonFilter: 'all',
  tabs: {
    all: {
      minReviewCount: 150,
      sortBy: 'recommendation',
      gameModes: { multiplayer: true, coop: true, singlePlayer: false, localMultiplayer: false },
    },
    trending: {
      minReviewCount: 0,
      sortBy: 'current_players',
      gameModes: { multiplayer: true, coop: true, singlePlayer: true, localMultiplayer: true },
    },
    new: {
      minReviewCount: 0,
      sortBy: 'release_date',
      gameModes: { multiplayer: true, coop: true, singlePlayer: true, localMultiplayer: true },
    },
  },
}

export function loadConfig(): AppConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        tabs: {
          all: { ...DEFAULT_CONFIG.tabs.all, ...parsed.tabs?.all },
          trending: { ...DEFAULT_CONFIG.tabs.trending, ...parsed.tabs?.trending },
          new: { ...DEFAULT_CONFIG.tabs.new, ...parsed.tabs?.new },
        },
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_CONFIG
}

export function saveConfig(config: AppConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function getTabDefaults(tab: AppTab): TabDefaults {
  const config = loadConfig()
  if (tab === 'all' || tab === 'trending' || tab === 'new') {
    return config.tabs[tab]
  }
  // Shortlisted/excluded use 'all' tab defaults
  return config.tabs.all
}
