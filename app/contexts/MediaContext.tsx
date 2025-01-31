'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Media = {
  id: string
  location: string
  type: string
  status: string
  startDate: string
  endDate: string
  client: string
}

type MediaContextType = {
  media: Media[]
  setMedia: React.Dispatch<React.SetStateAction<Media[]>>
  loading: boolean
  error: string | null
}

const MediaContext = createContext<MediaContextType | undefined>(undefined)

export const MediaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        // Replace this with actual API call
        const response = await fetch('/api/media')
        const data = await response.json()
        setMedia(data)
        setLoading(false)
      } catch (err) {
        setError('Failed to fetch media data')
        setLoading(false)
      }
    }

    fetchMedia()
  }, [])

  return (
    <MediaContext.Provider value={{ media, setMedia, loading, error }}>
      {children}
    </MediaContext.Provider>
  )
}

export const useMedia = () => {
  const context = useContext(MediaContext)
  if (context === undefined) {
    throw new Error('useMedia must be used within a MediaProvider')
  }
  return context
}

