import React, { useState } from 'react'
import { Card, CardContent } from './ui/card'
import TableView from './TableView'
import { Button } from './ui/button'
import {
    ArrowUpDown,
    CircleUser,
    Ellipsis,
    FileText,
    FilterIcon,
    SearchIcon,
} from "lucide-react"
import AvatarCompoment from './AvatarCompoment'
import { getColor } from '@/utils/getRandomColor';
import InviteComponet from './InviteComponet';
import RenderMembers from './RenderMembers'
import ProjectChatButton from './ProjectChatButton'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link'




const RenderProject = ({ project, setSelectedProject, index, reloadProject }) => {
    const [inviteOpen, setInviteOpen] = useState(false);
    return (
        <>
            {/* <Card className='shadow-sm p-0 !px-0 border border-gray-200'>
                <CardContent className='p-0'>
                    <div className="mb-8  flex items-center justify-between  text-white rounded-sm py-1 px-2" style={{ background: getColor(index) }}>
                        <h1 className="text-3xl font-semibold text-white">{project?.name}</h1>
                        <div className="flex items-center gap-4">

                            <RenderMembers members={project?.Members || []} />

                            <ProjectChatButton 
                                project={project} 
                                variant="outline" 
                                size="sm"
                                className="bg-transparent border-white text-white hover:bg-gray-200"
                            />

                            <Button className='bg-transparent border border-white text-white hover:bg-gray-200 ' onClick={() => setInviteOpen(true)}>
                                Invite/{project?.Members?.length}
                            </Button>

                            <button className='bg-transparent hover:bg-gray-200 text-white p-2 rounded-sm'>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild className='hover:bg-transparent'>
                                        <Ellipsis size={25} />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56 mr-2 mt-2">
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem className="cursor-pointer">
                                               <Link href={`/dashboard/projects/media/${project.project_id}`} className='flex items-center justify-start gap-2 w-full'>
                                                    <FileText />
                                                    <span className='text-black/70'>Media Box</span>
                                               </Link>
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                            </button>
                        </div>
                    </div>

                    <div className='px-2'>
                        <div className='my-4  font-light' dangerouslySetInnerHTML={{ __html: project.description }}></div>
                        <div className="flex items-center justify-start my-4 gap-4 bg-neutral-100">
                            <Button className="text-white bg-blue-500 hover:bg-blue-600" onClick={() => setSelectedProject(project)}>
                                New Task
                            </Button>

                            <Button variant="ghost" className="text-black/70">
                                <SearchIcon />
                                Search
                            </Button>
                            <Button variant="ghost" className="text-black/70">
                                <CircleUser />
                                Person
                            </Button>
                            <Button variant="ghost" className="text-black/70">
                                <FilterIcon />
                                Filter
                            </Button>
                            <Button variant="ghost" className="text-black/70">
                                <ArrowUpDown />
                                Sort
                            </Button>
                            <Button variant="ghost" className="text-black/70">
                                <Ellipsis />
                            </Button>
                        </div>
                    </div>
                    <TableView project={project} reloadProject={reloadProject} />
                </CardContent>
            </Card>
            <InviteComponet open={inviteOpen} onClose={() => setInviteOpen(false)} project={project} /> */}


        </>
    )
}

export default RenderProject