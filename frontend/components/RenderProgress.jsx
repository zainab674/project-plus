import React from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

const RenderProgress = ({ progress,handleOpenSelectedMail,handleOpenSelectedComments,handleOpenSelectedTranscibtion }) => {
    return (
        <>
            <Table className="border-collapse border rounded-md">
                <TableHeader className="border-b">
                    <TableRow>

                        <TableHead className="border-r last:border-r-0">Date</TableHead>
                        <TableHead className="border-r last:border-r-0">Transcribtions</TableHead>
                        <TableHead className="border-r last:border-r-0">Comments</TableHead>
                        <TableHead className="border-r last:border-r-0">Mails</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                    {
                        progress?.map((prog) => (
                            <TableRow key={prog?.date}>
                              

                                
                                
                                <TableCell className={`border-r last:border-r-0 text-center text-gray-600`}>{prog?.date}</TableCell>
                                <TableCell className={`border-r last:border-r-0 text-center text-gray-600`} onClick={() => handleOpenSelectedTranscibtion(prog?.transcriptions)}>{prog?.transcriptions?.length}</TableCell>
                                <TableCell className={`border-r last:border-r-0 text-center text-gray-600`} onClick={() => handleOpenSelectedComments(prog?.comments)}>{prog?.comments?.length}</TableCell>
                                <TableCell className={`border-r last:border-r-0 text-center text-gray-600`} onClick={() => handleOpenSelectedMail(prog?.emails)}>{prog?.emails?.length}</TableCell>
                                
                    
                            </TableRow>
                        ))
                    }

                </TableBody>
            </Table>
        </>
    )
}

export default RenderProgress