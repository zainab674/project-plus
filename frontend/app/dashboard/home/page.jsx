"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronDown, HelpCircle, Info, LayoutGrid, MessageCircle, Rocket, Star, Users, X } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export default function Page() {
  const [recentlyVisitedOpen, setRecentlyVisitedOpen] = React.useState(true)
  const [updateFeedOpen, setUpdateFeedOpen] = React.useState(true)
  const [workspacesOpen, setWorkspacesOpen] = React.useState(true)

  return (
    <div className="flex min-h-screen ">
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Welcome Message */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Good evening, User!</h1>
            <p className="text-sm text-gray-600">
              Quickly access your recent boards, inbox and workspaces
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">Give feedback</Button>
            <Button variant="outline">Quick Search</Button>
          </div>
        </div>

        {/* Recently Visited Section */}
        <Collapsible
          open={recentlyVisitedOpen}
          onOpenChange={setRecentlyVisitedOpen}
          className="mb-6"
        >
          <CollapsibleTrigger className="flex w-full items-center gap-2">
            <ChevronDown
              className={`h-5 w-5 transition-transform ${
                recentlyVisitedOpen ? "rotate-180" : ""
              }`}
            />
            <h2 className="text-lg font-semibold">Recently visited</h2>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Project Planning",
                  workspace: "Main workspace",
                  image: "https://cdn.monday.com/images/quick_search_recent_board.svg",
                },
                {
                  title: "Dashboard and reporting",
                  workspace: "Main workspace",
                  image: "https://cdn.monday.com/images/quick_search_recent_dashboard.svg",
                },
              ].map((item, index) => (
                <Card key={index} className="group cursor-pointer">
                  <CardContent className="p-4">
                    <div className="relative mb-2 aspect-video overflow-hidden rounded-lg">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-gray-600">
                          work management › {item.workspace}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Update Feed Section */}
        <Collapsible
          open={updateFeedOpen}
          onOpenChange={setUpdateFeedOpen}
          className="mb-6"
        >
          <CollapsibleTrigger className="flex w-full items-center gap-2">
            <ChevronDown
              className={`h-5 w-5 transition-transform ${
                updateFeedOpen ? "rotate-180" : ""
              }`}
            />
            <h2 className="text-lg font-semibold">Update feed (Inbox)</h2>
            <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-xs text-white">
              1
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>RM</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="font-medium">Roy Mann</span>
                        <span className="text-sm text-gray-600"> • 11d</span>
                      </div>
                      <p>Hi @User,</p>
                      <div className="mt-4 flex items-center gap-4">
                        <Button variant="outline" size="sm">
                          No thanks
                        </Button>
                        <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                          Invite
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* My Workspaces Section */}
        <Collapsible
          open={workspacesOpen}
          onOpenChange={setWorkspacesOpen}
          className="mb-6"
        >
          <CollapsibleTrigger className="flex w-full items-center gap-2">
            <ChevronDown
              className={`h-5 w-5 transition-transform ${
                workspacesOpen ? "rotate-180" : ""
              }`}
            />
            <h2 className="text-lg font-semibold">My workspaces</h2>
            <Info className="h-4 w-4 text-gray-400" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4">
              <Card className="cursor-pointer hover:bg-gray-50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-purple-600 text-white">
                    M
                  </div>
                  <div>
                    <h3 className="font-medium">Main workspace</h3>
                    <p className="text-sm text-gray-600">work management</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Right Sidebar */}
      <div className="hidden w-80 border-l bg-gray-50 p-6 lg:block">
        <div className="mb-8">
          <img
            src="https://cdn.monday.com/images/homepage-desktop/templates-banner.png"
            alt="Templates"
            className="mb-4 rounded-lg"
          />
          <h3 className="mb-2 text-center font-medium">
            Boost your workflow in minutes with ready-made templates
          </h3>
          <Button className="w-full" variant="outline">
            Explore templates
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Learn & get inspired</h3>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <Rocket className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <div className="font-medium">Getting started</div>
              <div className="text-sm text-gray-600">
                Learn how flexywexy.com works
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <HelpCircle className="h-5 w-5 text-purple-600" />
            <div className="text-left">
              <div className="font-medium">Help center</div>
              <div className="text-sm text-gray-600">
                Learn and get support
              </div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  )
}