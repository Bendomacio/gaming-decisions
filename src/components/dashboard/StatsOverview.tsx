import { BarChart3, Users, Gamepad2, Clock } from 'lucide-react'
import { Card } from '../ui/Card'
import { formatPlaytime } from '../../lib/utils'
import type { GameWithOwnership, Player, PlayerGame } from '../../types'

interface StatsOverviewProps {
  games: GameWithOwnership[]
  players: Player[]
  selectedPlayerIds: string[]
  allPlayerGames: PlayerGame[]
}

export function StatsOverview({ games, players, selectedPlayerIds, allPlayerGames }: StatsOverviewProps) {
  const totalGames = games.length
  const ownedByAll = games.filter(g => g.all_selected_own).length
  const freeGames = games.filter(g => g.is_free).length

  // Per-player stats
  const playerStats = players
    .filter(p => selectedPlayerIds.includes(p.id))
    .map(player => {
      const ownedGames = allPlayerGames.filter(pg => pg.player_id === player.id)
      const totalPlaytime = ownedGames.reduce((sum, pg) => sum + pg.playtime_hours, 0)
      return {
        player,
        ownedCount: ownedGames.length,
        totalPlaytime,
      }
    })

  const stats = [
    { label: 'Eligible Games', value: totalGames, icon: Gamepad2, color: 'text-accent' },
    { label: 'All Own', value: ownedByAll, icon: Users, color: 'text-success' },
    { label: 'Free to Play', value: freeGames, icon: BarChart3, color: 'text-info' },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 size={16} className="text-accent" />
        <h2 className="text-sm font-semibold text-text-primary">Library Stats</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map(stat => (
          <Card key={stat.label} hover={false} className="p-4 text-center">
            <stat.icon size={20} className={`${stat.color} mx-auto mb-1`} />
            <div className="text-2xl font-bold text-text-primary">{stat.value}</div>
            <div className="text-xs text-text-muted">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Per-player breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {playerStats.map(({ player, ownedCount, totalPlaytime }) => (
          <Card key={player.id} hover={false} className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-accent-dim flex items-center justify-center text-xs font-bold text-accent">
                {player.name[0]}
              </div>
              <span className="text-sm font-medium text-text-primary">{player.name}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Games</span>
                <span className="text-xs font-medium text-text-primary">{ownedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Clock size={10} />
                  Total
                </span>
                <span className="text-xs font-medium text-text-primary">{formatPlaytime(totalPlaytime)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
