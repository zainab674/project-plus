"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Edit3, Download, CheckCircle, AlertCircle, Info, ChevronDown, ChevronUp } from "lucide-react"

const ClientSignatureGuide = () => {
  const [isExpanded, setIsExpanded] = useState(false)

  const steps = [
    {
      step: 1,
      title: "Review the Document",
      description: "Click 'View Original' to download and review the document that needs your signature.",
      icon: <Download className="h-5 w-5" />
    },
    {
      step: 2,
      title: "Click 'Sign Document'",
      description: "Click the 'Sign Document' button to open the signature editor.",
      icon: <Edit3 className="h-5 w-5" />
    },
    {
      step: 3,
      title: "Add Your Signature",
      description: "Use the signature tools in the editor to add your signature, initials, or other required information.",
      icon: <FileText className="h-5 w-5" />
    },
    {
      step: 4,
      title: "Save and Upload",
      description: "Click 'Upload' to save your signed document and send it back to your attorney.",
      icon: <CheckCircle className="h-5 w-5" />
    }
  ]

  const tips = [
    "Make sure you have a stable internet connection before starting",
    "You can use your mouse, touchpad, or touch screen to draw your signature",
    "If you make a mistake, you can undo and try again",
    "The signed document will be automatically sent to your attorney",
    "You can download a copy of the signed document for your records"
  ]

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Info className="h-5 w-5" />
          How to Sign Documents
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-auto p-1 h-6 w-6"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Steps */}
          <div>
            <h4 className="font-medium text-blue-900 mb-3">Step-by-Step Process</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {steps.map((step) => (
                <div key={step.step} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {step.icon}
                      <h5 className="font-medium text-gray-900">{step.title}</h5>
                    </div>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div>
            <h4 className="font-medium text-blue-900 mb-3">Helpful Tips</h4>
            <div className="bg-white rounded-lg border border-blue-200 p-4">
              <ul className="space-y-2">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Status Meanings */}
          <div>
            <h4 className="font-medium text-blue-900 mb-3">Understanding Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-2 bg-yellow-100 rounded-lg">
                <Badge className="bg-yellow-200 text-yellow-800">PENDING</Badge>
                <span className="text-sm text-gray-700">Awaiting your signature</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-green-100 rounded-lg">
                <Badge className="bg-green-200 text-green-800">APPROVED</Badge>
                <span className="text-sm text-gray-700">Document signed and approved</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-red-100 rounded-lg">
                <Badge className="bg-red-200 text-red-800">REJECTED</Badge>
                <span className="text-sm text-gray-700">Document rejected or declined</span>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-white rounded-lg border border-blue-200 p-4">
            <h4 className="font-medium text-blue-900 mb-2">Need Help?</h4>
            <p className="text-sm text-gray-700 mb-3">
              If you encounter any issues while signing documents, please contact your attorney or our support team.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-blue-300 text-blue-700">
                Contact Support
              </Button>
              <Button size="sm" variant="outline" className="border-blue-300 text-blue-700">
                View Tutorial
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default ClientSignatureGuide 