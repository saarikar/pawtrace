// Shared helper functions

export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function generatePassportId(dogId) {
  // Generate a passport ID from dog_id, e.g. SD-001 -> PT-SD001
  if (!dogId) return 'PT-UNKNOWN'
  return 'PT-' + dogId.replace('-', '')
}
