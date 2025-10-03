'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const VoteSuccessPage = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [vote, setVote] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const voteParam = searchParams.get('vote')
    setVote(voteParam)
    setIsLoading(false)
  }, [searchParams])

  const getVoteInfo = () => {
    switch (vote) {
      case 'ACCEPTED':
        return {
          title: 'Meeting Accepted!',
          message: 'You have successfully accepted the meeting invitation. You will receive a reminder before the meeting starts.',
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'REJECTED':
        return {
          title: 'Meeting Declined',
          message: 'You have declined the meeting invitation. The meeting organizer will be notified.',
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      default:
        return {
          title: 'Processing...',
          message: 'Please wait while we process your response.',
          icon: <Clock className="h-16 w-16 text-blue-500 animate-spin" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
    }
  }

  const voteInfo = getVoteInfo()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className={`w-full max-w-md ${voteInfo.bgColor} ${voteInfo.borderColor} border-2`}>
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            {voteInfo.icon}
          </div>
          
          <h1 className={`text-2xl font-bold mb-4 ${voteInfo.color}`}>
            {voteInfo.title}
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            {voteInfo.message}
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/dashboard/schedule-meet')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              View My Meetings
            </Button>
            
            <Button 
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VoteSuccessPage