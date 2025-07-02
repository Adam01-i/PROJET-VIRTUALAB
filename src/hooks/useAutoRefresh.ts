"use client"

import { useEffect, useRef } from "react"

interface UseAutoRefreshOptions {
  onRefresh: () => void
  interval?: number // en millisecondes
  enabled?: boolean
}

export function useAutoRefresh({ onRefresh, interval = 5000, enabled = true }: UseAutoRefreshOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onRefreshRef = useRef(onRefresh)

  // Mettre à jour la référence de la fonction
  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      onRefreshRef.current()
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [interval, enabled])

  // Fonction pour forcer un rafraîchissement immédiat
  const forceRefresh = () => {
    onRefreshRef.current()
  }

  return { forceRefresh }
}
