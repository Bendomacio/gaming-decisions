import { Gamepad2, TrendingUp, Sparkles, Star } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { AppTab } from '../../types'

interface TabNavProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
  counts?: { all: number; trending: number; new: number; shortlisted: number }
}

const tabs: { id: AppTab; label: string; icon: typeof Gamepad2 }[] = [
  { id: 'all', label: 'All Games', icon: Gamepad2 },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'new', label: 'New Games', icon: Sparkles },
  { id: 'shortlisted', label: 'Shortlisted', icon: Star },
]

export function TabNav({ activeTab, onTabChange, counts }: TabNavProps) {
  return (
    <div className="flex items-center gap-1 bg-bg-secondary border border-border rounded-xl p-1">
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        const count = counts?.[tab.id]

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
              isActive
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
            )}
          >
            <Icon size={14} />
            {tab.label}
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
