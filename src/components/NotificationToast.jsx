
import { useNotifications } from '../context/NotificationContext'
import CloseIcon from '@mui/icons-material/Close'
import WarningIcon from '@mui/icons-material/Warning'
import ErrorIcon from '@mui/icons-material/Error'
import InfoIcon from '@mui/icons-material/Info'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

const typeStyles = {
  info: {
    bg: 'bg-blue-500',
    icon: InfoIcon,
    border: 'border-blue-600'
  },
  success: {
    bg: 'bg-green-500',
    icon: CheckCircleIcon,
    border: 'border-green-600'
  },
  warning: {
    bg: 'bg-orange-500',
    icon: WarningIcon,
    border: 'border-orange-600'
  },
  error: {
    bg: 'bg-red-500',
    icon: ErrorIcon,
    border: 'border-red-600'
  }
}

export default function NotificationToast() {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 max-w-sm">
      {notifications.map((notification) => {
        const style = typeStyles[notification.type] || typeStyles.info
        const Icon = style.icon

        return (
          <div
            key={notification.id}
            className={`${style.bg} text-white px-4 py-3 rounded-xl shadow-2xl border-l-4 ${style.border} animate-slide-in flex items-start gap-3 transform transition-all duration-300 hover:scale-105`}
            style={{
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <Icon className="flex-shrink-0 mt-0.5" style={{ fontSize: 22 }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug">{notification.message}</p>
              <p className="text-xs opacity-75 mt-1">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <CloseIcon style={{ fontSize: 18 }} />
            </button>
          </div>
        )
      })}
      
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}