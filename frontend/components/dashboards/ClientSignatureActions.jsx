"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { updateSignedStatusRequest } from "@/lib/http/client"
import { toast } from "react-toastify"

const ClientSignatureActions = ({ signature, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusUpdate = async (status) => {
    setIsUpdating(true)
    try {
      const formdata = {
        status,
        signed_id: signature.signed_id
      }
      const res = await updateSignedStatusRequest(formdata)
      toast.success(res.data.message)
      if (onStatusUpdate) {
        onStatusUpdate(signature.signed_id, status)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setIsUpdating(false)
    }
  }

  if (signature.status !== "PENDING") {
    return (
      <Badge className={
        signature.status === "APPROVED" 
          ? "bg-green-100 text-green-800" 
          : "bg-red-100 text-red-800"
      }>
        {signature.status}
      </Badge>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700"
        onClick={() => handleStatusUpdate("APPROVED")}
        disabled={isUpdating}
      >
        <CheckCircle className="h-4 w-4 mr-1" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="border-red-300 text-red-700 hover:bg-red-50"
        onClick={() => handleStatusUpdate("REJECTED")}
        disabled={isUpdating}
      >
        <XCircle className="h-4 w-4 mr-1" />
        Reject
      </Button>
    </div>
  )
}

export default ClientSignatureActions 