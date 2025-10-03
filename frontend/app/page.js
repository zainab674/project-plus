'use client'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

const page = () => {
  const router = useRouter();
  useEffect(() => {
    router.push('/sign-in')
  },[])
  return (
    <div className="h-screen w-screen bg-primary">

    </div>
  )
}

export default page