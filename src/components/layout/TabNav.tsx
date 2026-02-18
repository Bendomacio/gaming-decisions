import { Gamepad2, TrendingUp, Sparkles, Clock, Star, EyeOff } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { AppTab } from '../../types'

interface TabNavProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  counts?: { all: number; trending: number; new: number; coming_soon: number; shortlisted: number; excluded: number }
}

const tabs: { id: AppTab; label: string; shortLabel: string; icon: typeof Gamepad2 }[] = [
  { id: 'all', label: 'All Games', shortLabel: 'All', icon: Gamepad2 },
  { id: 'trending', label: 'Trending', shortLabel: 'Hot', icon: TrendingUp },
  { id: 'new', label: 'New Games', shortLabel: 'New', icon: Sparkles },
  { id: 'coming_soon', label: 'Coming Soon', shortLabel: 'Soon', icon: Clock },
  { id: 'shortlisted', label: 'Shortlisted', shortLabel: 'Saved', icon: Star },
  { id: 'excluded', label: 'Excluded', shortLabel: 'Out', icon: EyeOff },
]

export function TabNav({ activeTab, onTabChange, counts }: TabNavProps) {
  return (
    <div className="flex items-center gap-1 bg-bg-secondary border border-border rounded-xl p-1 overflow-x-auto scrollbar-none">
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        const count = counts?.[tab.id]

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer whitespace-nowrap shrink-0',
              isActive
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
            )}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
            {count !== undefined && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full',
                isActive ? 'bg-white/20' : 'bg-white/5'
              )}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
