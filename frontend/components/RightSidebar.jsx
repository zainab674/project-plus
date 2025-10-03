
import * as React from "react"
import { Mail, Upload, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const emails = [
    {
      id: 1,
      subject: "Transcbtions 1",
      sender: "sarah@example.com",
      preview: "Here's the latest update on the project timeline...",
      date: "2023-11-28",
      unread: true,
    },
    {
      id: 2,
      subject: "Transcbtions 2",
      sender: "john@example.com",
      preview: "Summary of our discussion regarding the new features...",
      date: "2023-11-27",
      unread: false,
    },
    {
      id: 3,
      subject: "Transcbtions 3",
      sender: "lisa@example.com",
      preview: "I've reviewed the latest designs and here are my thoughts...",
      date: "2023-11-26",
      unread: true,
    }
  ]

export function RightSidebar({ task, onClose }) {
    const [selectedEmail, setSelectedEmail] = React.useState(null)

    return (
        <Sheet open={!!task} onOpenChange={onClose}>
            <SheetContent className="w-[400px] sm:w-[540px] pt-14" side="right">
                <SheetHeader className="space-y-4">
                    <SheetTitle className="flex items-center justify-between">
                        Transcibtion
                        <Button variant="outline" size="icon">
                            <Upload className="h-4 w-4" />
                            <span className="sr-only">Upload file</span>
                        </Button>
                    </SheetTitle>
                </SheetHeader>
                <div className="grid grid-cols-1 gap-4 py-4">
                    {selectedEmail ? (
                        <div className="space-y-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedEmail(null)}
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Close email</span>
                            </Button>
                            <div className="space-y-2">
                                <h3 className="font-semibold">{selectedEmail.subject}</h3>
                                <p className="text-sm text-muted-foreground">
                                    From: {selectedEmail.sender}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Date: {selectedEmail.date}
                                </p>
                                <div className="pt-4">
                                    <p>{selectedEmail.preview}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <ScrollArea className="h-[calc(100vh-8rem)]">
                            <div className="space-y-10">
                                {emails.map((email) => (
                                    <Button
                                        key={email.id}
                                        variant="ghost"
                                        className="w-full justify-start space-y-1 border-b"
                                        onClick={() => setSelectedEmail(email)}
                                    >
                                        <div className="flex flex-row justify-between w-full">
                                                <span className="font-medium">{email.subject}</span>
                                            
                                            <span className="font-medium">{email.date}</span>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </SheetContent>
        </Sheet>

    )
}

