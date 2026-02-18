import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, hover = true, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-bg-card border border-border rounded-xl shadow-card',
        hover && 'transition-all duration-200 hover:bg-bg-card-hover hover:border-border-hover hover:shadow-glow hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
