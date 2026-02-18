import { useState, useRef, useEffect } from 'react'
import type { Player } from '../../types'
import type { ShortlistEntry } from '../../hooks/useShortlist'

interface ShortlistStarProps {
  gameId: string
  isShortlisted: boolean
  entry: ShortlistEntry | null
  players: Player[]
  onToggle: (gameId: string) => void
  onTogglePlayer: (gameId: string, playerName: string) => void
  onSetReason: (gameId: string, reason: string) => void
}

function SmileyStarSVG({ active, size = 28 }: { active: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={`transition-all duration-200 ${active ? 'drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]' : ''}`}
    >
      {/* Star shape */}
      <path
        d="M24 2 L29.5 17.5 L46 17.5 L32.5 27.5 L37 44 L24 34 L11 44 L15.5 27.5 L2 17.5 L18.5 17.5 Z"
        fill={active ? '#FBBF24' : 'transparent'}
        stroke={active ? '#F59E0B' : '#4B5563'}
        strokeWidth={active ? 1.5 : 1.5}
        strokeLinejoin="round"
        className="transition-all duration-200"
      />
      {/* Eyes */}
      {active && (
        <>
          <circle cx="18" cy="22" r="2" fill="#78350F" />
          <circle cx="30" cy="22" r="2" fill="#78350F" />
          {/* Smile */}
          <path
            d="M19 28 Q24 33 29 28"
            fill="none"
            stroke="#78350F"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  )
}

export function ShortlistStar({
  gameId,
  isShortlisted,
  entry,
  players,
  onToggle,
  onTogglePlayer,
  onSetReason,
}: ShortlistStarProps) {
  const [showPopover, setShowPopover] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close popover on outside click
  useEffect(() => {
    if (!showPopover) return
    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setShowPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPopover])

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isShortlisted) {
      onToggle(gameId)
      setShowPopover(true)
    } else {
      setShowPopover(!showPopover)
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleStarClick}
        className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
        title={isShortlisted ? 'Shortlisted - click to edit' : 'Add to shortlist'}
      >
        <SmileyStarSVG active={isShortlisted} size={24} />
      </button>

      {showPopover && isShortlisted && (
        <div
          ref={popoverRef}
          className="absolute left-8 top-0 z-50 bg-bg-secondary border border-border rounded-lg shadow-xl p-3 w-56"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-primary">Shortlisted by</span>
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(gameId); setShowPopover(false) }}
              className="text-[10px] text-error hover:text-error/80 cursor-pointer"
            >
              Remove
            </button>
          </div>

          {/* Player toggles */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {players.map(p => {
              const selected = entry?.players.includes(p.name) ?? false
              return (
                <button
                  key={p.id}
                  onClick={() => onTogglePlayer(gameId, p.name)}
                  className={`px-2 py-0.5 rounded-md text-[11px] border transition-all cursor-pointer ${
                    selected
                      ? 'bg-accent-dim text-accent-hover border-border-accent'
                      : 'bg-bg-card text-text-muted border-border hover:border-border-hover'
                  }`}
                >
                  {p.name}
                </button>
              )
            })}
          </div>

          {/* Reason */}
          <input
            type="text"
            placeholder="Why shortlisted..."
            value={entry?.reason ?? ''}
            onChange={e => onSetReason(gameId, e.target.value)}
            className="w-full bg-bg-input border border-border rounded-md px-2 py-1 text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-border-accent transition-colors"
            maxLength={100}
          />
        </div>
      )}
    </div>
  )
}
