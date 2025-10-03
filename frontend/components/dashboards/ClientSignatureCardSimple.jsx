"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Download, Edit3 } from "lucide-react"
import Link from "next/link"
import moment from "moment"

const ClientSignatureCardSimple = ({ signatures, projectClientId }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (!signatures || signatures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pending Signatures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No pending signatures</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const pendingSignatures = signatures.filter(sig => sig.status === "PENDING")
  const otherSignatures = signatures.filter(sig => sig.status !== "PENDING")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Signatures ({signatures.length})
          {pendingSignatures.length > 0 && (
            <Badge className="bg-red-100 text-red-800">
              {pendingSignatures.length} Pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Pending Signatures */}
          {pendingSignatures.length > 0 && (
            <div>
              <h4 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Requires Your Signature
              </h4>
              <div className="space-y-3">
                {pendingSignatures.map((signature) => (
                  <div key={signature.signed_id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{signature.name}</h5>
                      <Badge className={getStatusColor(signature.status)}>
                        {signature.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{signature.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>Requested: {moment(signature.created_at).format('MMM DD, YYYY')}</span>

                    </div>
                    <div className="flex gap-2">

                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/sign/${projectClientId}`}>
                          Sign Document
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      </CardContent>
    </Card>
  )
}

export default ClientSignatureCardSimple 