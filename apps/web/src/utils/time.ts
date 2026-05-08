
export function generateCurrentTimestampTz() {
  return ((new Date()).toISOString()).toLocaleString()
}