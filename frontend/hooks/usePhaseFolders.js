import { useState, useEffect } from 'react'
import { checkPhaseHasFoldersRequest } from '@/lib/http/project'

export const usePhaseFolders = (projectId, phase) => {
  const [hasFolders, setHasFolders] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!projectId || !phase) {
      setHasFolders(false)
      return
    }

    const checkPhaseFolders = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await checkPhaseHasFoldersRequest(projectId, phase)
        if (response.data.success) {
          setHasFolders(response.data.hasFolders)
        } else {
          setError('Failed to check phase folders')
          setHasFolders(false)
        }
      } catch (err) {
        console.error('Error checking phase folders:', err)
        setError(err.message || 'Failed to check phase folders')
        setHasFolders(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkPhaseFolders()
  }, [projectId, phase])

  return { hasFolders, isLoading, error }
}
