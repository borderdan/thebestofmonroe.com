"use client"

import { useEffect } from "react"

export function PwaRegistry() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.serwist !== undefined) {
      window.serwist.register().then((registration: ServiceWorkerRegistration) => {
        console.log("Serwist service worker registered:", registration)
      })
    }
  }, [])

  return null
}

declare global {
  interface Window {
    serwist: { register: () => Promise<ServiceWorkerRegistration> }
  }
}
