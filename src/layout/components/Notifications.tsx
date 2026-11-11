import { useWorkbenchStore } from '../../store/workbench-store'

export function Notifications() {
  const notifications = useWorkbenchStore((state) => state.notifications)
  const dismiss = useWorkbenchStore((state) => state.dismissNotification)

  if (notifications.length === 0) return null

  return (
    <div className="notifications" role="status" aria-live="polite">
      {notifications.map((notification) => (
        <div key={notification.id} className={`notification notification--${notification.kind}`}>
          <vscode-icon
            name={
              notification.kind === 'success'
                ? 'pass-filled'
                : notification.kind === 'error'
                  ? 'error'
                  : notification.kind === 'warning'
                    ? 'warning'
                    : 'info'
            }
            size={16}
          />
          <span className="notification-message">{notification.message}</span>
          <button
            type="button"
            className="notification-close"
            aria-label="Dismiss notification"
            onClick={() => dismiss(notification.id)}
          >
            <vscode-icon name="close" size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
