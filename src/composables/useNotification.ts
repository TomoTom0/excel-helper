import { ref } from 'vue'

export function useNotification() {
  const notificationMessage = ref('')
  const notificationType = ref<'success' | 'error'>('success')
  const showNotificationFlag = ref(false)

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    notificationMessage.value = message
    notificationType.value = type
    showNotificationFlag.value = true
    setTimeout(() => {
      showNotificationFlag.value = false
    }, 2000)
  }

  return {
    notificationMessage,
    notificationType,
    showNotificationFlag,
    showNotification,
  }
}
