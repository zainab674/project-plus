"use client"

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Download, Edit3 } from "lucide-react"
import Link from "next/link"
import moment from "moment"

const ClientSignatureCard = ({ signatures, projectClientId }) => {
  const [expandedSignatures, setExpandedSignatures] = useState(new Set())

  const toggleSignature = useCallback((signatureId) => {
    setExpandedSignatures(prev => {
      const newSet = new Set(prev)
      if (newSet.has(signatureId)) {
        newSet.delete(signatureId)
      } else {
        newSet.add(signatureId)
      }
      return newSet
    })
  }, [])

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />
      case "REJECTED":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
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
                      {signature.file_url && (
                        <a 
                          href={signature.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          View Original
                        </a>
                      )}
                    </div>
                                         <div className="flex gap-2">
                       <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                         <Link href={`/dashboard/signature/${signature.signed_id}?file=${signature.file_url}&type=${signature.mimeType}`}>
                           <Edit3 className="h-4 w-4 mr-1" />
                           Sign Document
                         </Link>
                       </Button>
                       <Button 
                         size="sm" 
                         variant="outline"
                         onClick={() => toggleSignature(signature.signed_id)}
                       >
                         View Details
                       </Button>
                     </div>
                    {expandedSignatures.has(signature.signed_id) && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <div className="text-xs text-gray-600 space-y-1">
                          <p><strong>Document ID:</strong> {signature.signed_id}</p>
                          <p><strong>File Size:</strong> {signature.size ? `${(signature.size / 1024).toFixed(1)} KB` : 'N/A'}</p>
                          <p><strong>File Type:</strong> {signature.mimeType || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Signatures */}
          {otherSignatures.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Other Signatures</h4>
              <div className="space-y-2">
                {otherSignatures.map((signature) => (
                  <div key={signature.signed_id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">{signature.name}</h5>
                      <Badge className={getStatusColor(signature.status)}>
                        {signature.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{signature.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Updated: {moment(signature.sign_date || signature.created_at).format('MMM DD, YYYY')}</span>
                      {signature.sign_file_url && (
                        <a 
                          href={signature.sign_file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          View Signed
                        </a>
                      )}
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

export default ClientSignatureCard 