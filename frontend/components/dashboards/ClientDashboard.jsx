


"use client"

import * as React from "react"
import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, DollarSign, Clock, AlertCircle, CheckCircle, XCircle, MessageSquare, Upload, User, Briefcase, TrendingUp, Activity } from "lucide-react"
import { getClientProjectsRequest } from "@/lib/http/client"
import { useUser } from "@/providers/UserProvider"
import Loader from "@/components/Loader"
import Link from "next/link"
import moment from "moment"
import ClientSignatureCardSimple from "./ClientSignatureCardSimple"

const ClientDashboard = () => {
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
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "APPROVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-200"
      case "UNPAID":
        return "bg-orange-50 text-orange-700 border-orange-200"
      case "OVERDUE":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-50 text-red-700 border-red-200"
      case "MEDIUM":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "LOW":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const totalDocuments = projects.reduce((total, project) => total + project.Documents.length, 0)
  const totalSignatures = projects.reduce((total, project) => total + project.signed.length, 0)
  const totalBills = projects.reduce((total, project) => total + project.Billing.length, 0)
  const totalForms = projects.reduce((total, project) => total + project.Filled.length, 0)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader />
          <p className="text-gray-600 mt-4">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}

        <div className="px-6 py-8">
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-blue-900">Total Cases</CardTitle>
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-900">{projects.length}</div>
                <p className="text-sm text-blue-700 mt-1">Active legal cases</p>
                <div className="flex items-center mt-2 text-xs text-blue-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>All cases tracked</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-amber-900">Pending Documents</CardTitle>
                <div className="p-2 bg-amber-600 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-900">{totalDocuments}</div>
                <p className="text-sm text-amber-700 mt-1">Require your attention</p>
                <div className="flex items-center mt-2 text-xs text-amber-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  <span>Action needed</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-purple-900">Pending Signatures</CardTitle>
                <div className="p-2 bg-purple-600 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-900">{totalSignatures}</div>
                <p className="text-sm text-purple-700 mt-1">Awaiting your signature</p>
                <div className="flex items-center mt-2 text-xs text-purple-600">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Time sensitive</span>
                </div>
              </CardContent>
            </Card>


          </div>

          {/* Priority Signatures Section */}
          {projects.some(project => project.signed.length > 0) && (
            <div className="mb-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Priority Signatures</h2>
                    <p className="text-gray-600">Documents requiring immediate attention</p>
                  </div>
                </div>
                <Badge className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1">
                  {totalSignatures} pending
                </Badge>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {projects.map((projectClient) => (
                  projectClient.signed.length > 0 && (
                    <ClientSignatureCardSimple
                      key={projectClient.project_client_id}
                      signatures={projectClient.signed}
                      projectClientId={projectClient.project_client_id}
                    />
                  )
                ))}
              </div>
            </div>
          )}

          {/* Cases Overview Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your Legal Cases</h2>
                  <p className="text-gray-600">Detailed view of all your active cases</p>
                </div>
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {projects.map((projectClient) => (
                <Card key={projectClient.project_client_id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                          {projectClient.project.name}
                        </CardTitle>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span className="font-medium">Attorney: {projectClient.project.user.name}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {projectClient.project.priority && (
                          <Badge className={`${getPriorityColor(projectClient.project.priority)} border font-medium`}>
                            {projectClient.project.priority} Priority
                          </Badge>
                        )}
                        {projectClient.project.status && (
                          <Badge className={`${getStatusColor(projectClient.project.status)} border font-medium`}>
                            {projectClient.project.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {/* Project Description */}
                      {projectClient.project.description && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-700 leading-relaxed">{projectClient.project.description}</p>
                        </div>
                      )}

                      {/* Project Metadata */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-xs font-medium text-blue-900 uppercase tracking-wide">Created</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {moment(projectClient.project.created_at).format('MMM DD, YYYY')}
                            </p>
                          </div>
                        </div>
                        {projectClient.project.budget && (
                          <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg">
                            <DollarSign className="h-5 w-5 text-emerald-600" />
                            <div>
                              <p className="text-xs font-medium text-emerald-900 uppercase tracking-wide">Budget</p>
                              <p className="text-sm font-semibold text-gray-900">
                                ${projectClient.project.budget.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Activity Summary */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Case Activity</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                            <div className="text-2xl font-bold text-blue-600">{projectClient.Documents.length}</div>
                            <div className="text-xs font-medium text-gray-600 mt-1">Documents</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                            <div className="text-2xl font-bold text-emerald-600">{projectClient.Filled.length}</div>
                            <div className="text-xs font-medium text-gray-600 mt-1">Forms</div>
                          </div>
                          <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                            <div className="text-2xl font-bold text-purple-600">{projectClient.signed.length}</div>
                            <div className="text-xs font-medium text-gray-600 mt-1">Signatures</div>
                          </div>

                        </div>
                      </div>

                      {/* Recent Updates */}
                      {projectClient.Updates.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            <span className="uppercase tracking-wide">Recent Updates</span>
                          </h4>
                          <div className="space-y-3">
                            {projectClient.Updates.slice(0, 2).map((update) => (
                              <div key={update.update_id} className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                                <p className="text-sm text-gray-800 leading-relaxed line-clamp-2">{update.message}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs font-medium text-blue-700">
                                    {moment(update.created_at).format('MMM DD, YYYY [at] h:mm A')}
                                  </p>
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">New</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t">
                        <Button asChild className="flex-1 bg-blue-600 hover:bg-blue-700">
                          <Link href={`/dashboard/${projectClient.project.project_id}?client_id=${projectClient.project_client_id}`}>
                            <Briefcase className="h-4 w-4 mr-2" />
                            View Case Details
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="border-gray-300 hover:bg-gray-50">
                          <Link href={`/dashboard/clients/${projectClient.project_client_id}`}>
                            <FileText className="h-4 w-4 mr-2" />
                            My Files
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Enhanced Empty State */}
          {projects.length === 0 && (
            <Card className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 border-0 shadow-md">
              <CardContent>
                <div className="max-w-md mx-auto">
                  <div className="flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6">
                    <Briefcase className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No Active Cases</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    You haven't been added to any legal cases yet. Once your attorney creates a case and adds you as a client, it will appear here with all relevant documents and updates.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 font-medium">
                      Need help? Contact your attorney to get started with your first case.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClientDashboard