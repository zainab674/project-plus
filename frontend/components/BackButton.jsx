'use client'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const BackButton = ({ 
  destination = '/dashboard', 
  label = 'Back',
  className = '',
  variant = 'outline',
  size = 'sm'
}) => {
  const router = useRouter()

  const handleBack = () => {
    router.push(destination)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={`flex items-center gap-2 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}

export default BackButton
