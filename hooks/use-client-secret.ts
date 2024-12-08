import { useState, useEffect } from 'react'

export function useClientSecret(priceId: string) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClientSecret = async () => {
      try {
        const response = await fetch('/api/get-client-secret', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ priceId }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch client secret')
        }

        const data = await response.json()
        setClientSecret(data.clientSecret)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchClientSecret()
  }, [priceId])

  return { clientSecret, error, loading }
}

