import type { ProtonFilter, ReleaseDateFilter, GameModeFilters, SortOption, AppTab } from '../types'

export interface TabDefaults {
  minReviewCount: number
  sortBy: SortOption[]
  gameModes: GameModeFilters
}

export interface AppConfig {
  // Global defaults
  defaultLinuxOnly: boolean
  defaultReleaseDateFilter: ReleaseDateFilter
  defaultExcludeTags: string[]
  defaultProtonFilter: ProtonFilter
  // Per-tab defaults
  tabs: Record<'all' | 'trending' | 'new' | 'coming_soon', TabDefaults>
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
      sortBy: ['recommendation'],
      gameModes: { multiplayer: true, coop: true, singlePlayer: false, localMultiplayer: false },
    },
    trending: {
      minReviewCount: 0,
      sortBy: ['current_players'],
      gameModes: { multiplayer: true, coop: true, singlePlayer: true, localMultiplayer: true },
    },
    new: {
      minReviewCount: 0,
      sortBy: ['release_date'],
      gameModes: { multiplayer: true, coop: true, singlePlayer: true, localMultiplayer: true },
    },
    coming_soon: {
      minReviewCount: 0,
      sortBy: ['release_date'],
      gameModes: { multiplayer: true, coop: true, singlePlayer: true, localMultiplayer: true },
    },
  },
}

function migrateTabDefaults(defaults: TabDefaults, saved: Record<string, unknown> | undefined): TabDefaults {
  if (!saved) return defaults
  const merged = { ...defaults, ...saved }
  // Migrate old string sortBy to array
  if (typeof merged.sortBy === 'string') {
    merged.sortBy = [merged.sortBy as SortOption]
  }
  return merged
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
          all: migrateTabDefaults(DEFAULT_CONFIG.tabs.all, parsed.tabs?.all),
          trending: migrateTabDefaults(DEFAULT_CONFIG.tabs.trending, parsed.tabs?.trending),
          new: migrateTabDefaults(DEFAULT_CONFIG.tabs.new, parsed.tabs?.new),
          coming_soon: migrateTabDefaults(DEFAULT_CONFIG.tabs.coming_soon, parsed.tabs?.coming_soon),
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
  if (tab === 'all' || tab === 'trending' || tab === 'new' || tab === 'coming_soon') {
    return config.tabs[tab]
  }
  // Shortlisted/excluded use 'all' tab defaults
  return config.tabs.all
}
