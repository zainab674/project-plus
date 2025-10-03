"use client"

import { useEffect, useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Info,
} from "lucide-react"

import { getAllProjectRequest } from "@/lib/http/project"
import BigDialog from "@/components/Dialogs/BigDialog"
import CreateTask from "@/components/Dialogs/CreateTask"

import { Badge } from "@/components/ui/badge"
// import RenderProject from "@/components/RenderProject"
import Loader from "@/components/Loader"


const statusColors = {
    "Not Started": "bg-gray-100 text-gray-800",
    "Working": "bg-blue-100 text-blue-800",
    "Stuck": "bg-red-100 text-red-800",
    "Done": "bg-green-100 text-green-800",
}
const statuses = ["Not Started", "Working", "Stuck", "Done"]

export default function Page({ params }) {
    const [projects, setProjects] = useState(null);
    const [isLoading, setLoading] = useState(false);
    const [collabrationProjectCount, setCollabrationProjectCount] = useState(0);
    const [ProjectCount, setProjectCount] = useState(0);
    const [selectedProject, setSelectedProject] = useState(undefined);


    const getProjectAllProject = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAllProjectRequest();
            const { projects, collaboratedProjects } = res.data;
            setCollabrationProjectCount(collaboratedProjects.length);
            setProjectCount(projects.length);
            setProjects([...projects, ...collaboratedProjects]);
        } catch (error) {
            setProjects(null);
            console.log(error?.response?.data?.meesage || error?.meesage);
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        getProjectAllProject();
    }, []);


    if (isLoading) {
        return <>
            <div className=" h-screen bg-white m-2 rounded-md flex items-center justify-center">

                <Loader />
            </div>
        </>
    }



    return (
        <>
            <div className="flex h-screen flex-col bg-white m-2 rounded-md overflow-auto">
                <div className="flex flex-col gap-4 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h1 className="text-4xl font-semibold">My Project</h1>
                            <Info className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={'bg-yellow-500 py-2 px-4'}>
                                My Project - {ProjectCount}
                            </Badge>
                            <Badge className={'bg-blue-500 py-2 px-4'}>
                                My Collabration - {collabrationProjectCount}
                            </Badge>
                            <Badge className={'bg-purple-500 py-2 px-4'}>
                                Total - {projects?.length || 0}
                            </Badge>
                        </div>
                    </div>
                </div>


                <div className="px-2 py-5 space-y-10 mt-10">
                    {
                        // projects?.map((project, index) => (<RenderProject project={project} index={index} setSelectedProject={setSelectedProject} reloadProject={getProjectAllProject}/>))
                    }
                </div>
            </div>


            <BigDialog open={!!selectedProject} onClose={() => setSelectedProject(undefined)} width={70}>
                <CreateTask project={selectedProject} onClose={() => setSelectedProject(undefined)} getProjectDetails={getProjectAllProject} />
            </BigDialog>



        </>
    )
}