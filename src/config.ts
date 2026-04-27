export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

if (!GOOGLE_MAPS_API_KEY) {
  throw new Error(
    'Missing VITE_GOOGLE_MAPS_API_KEY. Copy .env.local.example to .env.local and set your key.',
  )
}

export const ATHENS_CENTER = { lat: 37.9838, lng: 23.7275 } as const
