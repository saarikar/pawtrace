import { useState, useEffect, useRef } from 'react'

const BACKEND_URL = 'http://localhost:5001' // fallback for dev

export default function useNetworkStatus(pollInterval = 15000) {
  const [isOnline, setIsOnline] = useState(true)
  const timer = useRef(null)

  useEffect(() => {
    const check = async () => {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000)

        // Try local backend first (dev mode)
        try {
          const res = await fetch(`${BACKEND_URL}/status`, {
            method: 'GET',
            signal: controller.signal,
          })
          clearTimeout(timeout)
          setIsOnline(res.ok)
          return
        } catch {
          // Fallback to Google connectivity check
          const res = await fetch('https://clients3.google.com/generate_204', {
            method: 'HEAD',
            signal: controller.signal,
          })
          clearTimeout(timeout)
          setIsOnline(res.ok || res.status === 204)
        }
      } catch {
        setIsOnline(false)
      }
    }

    check()
    timer.current = setInterval(check, pollInterval)
    return () => clearInterval(timer.current)
  }, [pollInterval])

  return isOnline
}
