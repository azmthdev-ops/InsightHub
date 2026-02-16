"use client"

import * as React from "react"
import {
    Brain,
    Code2,
    Database,
    Frame,
    LayoutDashboard,
    PieChart,
    Settings2,
    SquareTerminal,
    Video,
    Sparkles,
    ChevronRight,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

const data = {
    user: {
        name: "Dr. A.I.",
        email: "ai@insight-hub.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
            isActive: true,
        },
        {
            title: "Data Profiler",
            url: "/dashboard/profiler",
            icon: PieChart,
        },
        {
            title: "Data Preparation",
            url: "/dashboard/data-prep",
            icon: Settings2,
        },
        {
            title: "Data Center",
            url: "/dashboard/data",
            icon: Database,
        },
        {
            title: "ML Studio",
            url: "/dashboard/ml-studio",
            icon: Brain,
        },
        {
            title: "Visualizations",
            url: "/dashboard/visualizations",
            icon: Frame,
        },
        {
            title: "Notebook",
            url: "/dashboard/notebook",
            icon: Code2,
        },
        {
            title: "Vision Suite",
            url: "/dashboard/vision",
            icon: Video,
        },
        {
            title: "Chat Terminal",
            url: "/dashboard/chat",
            icon: SquareTerminal,
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()

    return (
        <Sidebar collapsible="icon" {...props} className="border-r border-white/5 bg-zinc-950/80 backdrop-blur-2xl transition-all duration-300">
            <SidebarHeader className="border-b border-white/5 p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-violet-500/5 opacity-50 pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 font-bold text-xl text-white relative z-10"
                >
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-violet-600 rounded-lg blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative h-9 w-9 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl">
                            <Brain className="h-5.5 w-5.5 text-blue-400 group-hover:text-white transition-colors" />
                        </div>
                    </div>
                    <span className="tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        DataSynth
                    </span>
                </motion.div>
            </SidebarHeader>
            <SidebarContent className="p-3 gap-2">
                <SidebarMenu>
                    {data.navMain.map((item, index) => {
                        const isActive = pathname === item.url
                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={item.title}
                                    isActive={isActive}
                                    className={`
                                        relative group h-11 w-full transition-all duration-300 rounded-xl overflow-hidden
                                        ${isActive
                                            ? "bg-white/5 text-white"
                                            : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                                        }
                                    `}
                                >
                                    <a href={item.url} className="flex items-center gap-3 w-full px-3 py-2">
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="absolute left-0 w-1 h-6 bg-gradient-to-b from-blue-500 to-violet-600 rounded-r-full shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                                            />
                                        )}
                                        <div className={`
                                            p-1.5 rounded-lg transition-all duration-300
                                            ${isActive ? "text-blue-400" : "group-hover:text-blue-400"}
                                        `}>
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <span className="font-medium text-sm flex-1">{item.title}</span>
                                        {isActive && (
                                            <motion.div
                                                initial={{ opacity: 0, x: -5 }}
                                                animate={{ opacity: 1, x: 0 }}
                                            >
                                                <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
                                            </motion.div>
                                        )}
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-sm">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-zinc-900 to-black border border-white/5 shadow-xl group cursor-pointer"
                >
                    <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-tr from-blue-500 to-violet-600 rounded-full blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
                        <div className="relative h-9 w-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden">
                            <Sparkles className="h-4 w-4 text-blue-400" />
                        </div>
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-zinc-100 truncate">Enterprise Hub</span>
                        <div className="flex items-center gap-1.5">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] text-zinc-500 font-medium">v3.0.4 Online</span>
                        </div>
                    </div>
                </motion.div>
            </SidebarFooter>
            <SidebarRail className="hover:bg-blue-500/10 transition-colors" />
        </Sidebar>
    )
}
