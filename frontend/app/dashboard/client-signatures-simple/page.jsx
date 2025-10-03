"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Download, Edit3 } from "lucide-react"
import { getClientProjectsRequest } from "@/lib/http/client"
import { useUser } from "@/providers/UserProvider"
import Loader from "@/components/Loader"
import Link from "next/link"
import moment from "moment"

const ClientSignaturesSimplePage = () => {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()

  const getClientProjects = useCallback(async () => {
    try {
      const res = await getClientProjectsRequest()
      setProjects(res.data.projects)
    } catch (error) {
      console.error("Error fetching client projects:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      getClientProjects()
    }
  }, [user, getClientProjects])

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

  // Collect all signatures from all projects
  const allSignatures = projects.flatMap(project =>
    project.signed.map(signature => ({
      ...signature,
      projectName: project.project.name,
      projectId: project.project.project_id,
      attorneyName: project.project.user.name,
      projectClientId: project.project_client_id
    }))
  )

  const pendingSignatures = allSignatures.filter(sig => sig.status === "PENDING")
  const approvedSignatures = allSignatures.filter(sig => sig.status === "APPROVED")
  const otherSignatures = allSignatures.filter(sig => sig.status !== "PENDING")

  if (isLoading) {
    return (
      <div className="h-screen bg-white m-2 rounded-md flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Signatures</h1>
          <p className="text-gray-600 mt-2">Manage and sign your documents</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href={`/dashboard/sign/${projects[0]?.project_client_id}`}>


            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Signatures</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{allSignatures.length}</div>
                <p className="text-xs text-muted-foreground">All documents</p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingSignatures.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting signature</p>
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {approvedSignatures.length}
              </div>
              <p className="text-xs text-muted-foreground">Signed documents</p>
            </CardContent>
          </Card> */}
        </div>

        {/* Pending Signatures */}
        {pendingSignatures.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Pending Signatures ({pendingSignatures.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingSignatures.map((signature) => (
                <Card key={signature.signed_id} className="border-red-200 bg-red-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{signature.name}</CardTitle>
                      <Badge className={getStatusColor(signature.status)}>
                        {signature.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">Case: {signature.projectName}</p>
                    <p className="text-sm text-gray-600">Attorney: {signature.attorneyName}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-4">{signature.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>Requested: {moment(signature.created_at).format('MMM DD, YYYY')}</span>

                    </div>
                    <div className="flex gap-2">

                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/sign/${signature.projectClientId}`}>
                          Sign Document
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other Signatures */}
        {otherSignatures.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Other Signatures</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {otherSignatures.map((signature) => (
                <Card key={signature.signed_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{signature.name}</CardTitle>
                      <Badge className={getStatusColor(signature.status)}>
                        {signature.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">Case: {signature.projectName}</p>
                    <p className="text-sm text-gray-600">Attorney: {signature.attorneyName}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-4">{signature.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
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
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/dashboard/sign/${signature.projectClientId}`}>
                          View All Case Signatures
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {allSignatures.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No signatures found</h3>
              <p className="text-gray-600 mb-4">
                You don't have any signature requests yet.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        {pendingSignatures.length > 0 && (
          <Card className="mt-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">How to Sign Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-blue-900">
                <p>1. Click "Sign " to go to document signing</p>
                <p>2. Click "Sign " to open the signature editor</p>
                <p>3. Use the signature tools to add your signature, initials, or other required information</p>
                <p>4. Click "Upload" to save your signed document and send it back to your attorney</p>
                <p className="text-xs text-blue-700 mt-4">
                  <strong>Note:</strong> Make sure you have a stable internet connection before starting the signing process.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ClientSignaturesSimplePage 