// Reusable Toggle Switch Component
// Consistent design across the entire application

export default function ToggleSwitch({ 
  enabled, 
  onToggle, 
  size = 'md', // 'sm', 'md', 'lg'
  color = 'emerald', // 'emerald', 'blue', 'purple', 'amber'
  showIcon = false,
  disabled = false 
}) {
  const sizes = {
    sm: {
      track: 'w-9 h-5',
      thumb: 'w-4 h-4',
      thumbOn: 'translate-x-4',
      thumbOff: 'translate-x-0.5',
      icon: 12
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      thumbOn: 'translate-x-5',
      thumbOff: 'translate-x-0.5',
      icon: 14
    },
    lg: {
      track: 'w-14 h-8',
      thumb: 'w-6 h-6',
      thumbOn: 'translate-x-7',
      thumbOff: 'translate-x-1',
      icon: 16
    }
  }

  const colors = {
    emerald: {
      on: 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/30',
      icon: 'text-emerald-500'
    },
    blue: {
      on: 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/30',
      icon: 'text-blue-500'
    },
    purple: {
      on: 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-500/30',
      icon: 'text-purple-500'
    },
    amber: {
      on: 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30',
      icon: 'text-amber-500'
    }
  }

  const { track, thumb, thumbOn, thumbOff, icon } = sizes[size]
  const { on, icon: iconColor } = colors[color]

  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`
        ${track} 
        rounded-full 
        transition-all 
        duration-300 
        relative 
        ${enabled ? `${on} shadow-lg` : 'bg-slate-200 dark:bg-slate-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500
      `}
      role="switch"
      aria-checked={enabled}
    >
      <span 
        className={`
          absolute 
          top-0.5 
          ${thumb} 
          bg-white 
          rounded-full 
          shadow-md 
          transition-all 
          duration-300 
          flex 
          items-center 
          justify-center
          ${enabled ? thumbOn : thumbOff}
        `}
      >
        {showIcon && enabled && (
          <svg 
            className={iconColor} 
            style={{ width: icon, height: icon }} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
    </button>
  )
}

// Compact toggle for inline use
export function ToggleInline({ enabled, onToggle, label, disabled = false }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <ToggleSwitch enabled={enabled} onToggle={onToggle} size="sm" disabled={disabled} />
      {label && <span className="text-sm text-slate-600">{label}</span>}
    </label>
  )
}

// Toggle with label and description
export function ToggleCard({ 
  enabled, 
  onToggle, 
  label, 
  description, 
  icon,
  iconBg = 'bg-slate-100',
  iconColor = 'text-slate-600',
  size = 'md',
  color = 'emerald'
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <span className={iconColor}>{icon}</span>
          </div>
        )}
        <div className="min-w-0">
          <div className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{label}</div>
          {description && <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{description}</div>}
        </div>
      </div>
      <ToggleSwitch enabled={enabled} onToggle={onToggle} size={size} color={color} showIcon />
    </div>
  )
}
