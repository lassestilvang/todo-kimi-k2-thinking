/**
 * Client-safe utility functions - no database dependencies
 * These functions can be safely imported in client components
 */

export function formatTimeHHMM(minutes: number | null): string {
  if (minutes === null) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

export function formatDateForInput(timestamp: number | null): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toISOString().split('T')[0]
}

export function parseTimeHHMM(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

export function parseISO8601(dateStr: string): number {
  return new Date(dateStr).getTime()
}
