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
    BarChart3,
    Zap,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"

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
            title: "Business Analytics",
            url: "/dashboard/ba",
            icon: BarChart3,
        },
        {
            title: "Optimization",
            url: "/dashboard/optimization",
            icon: Zap,
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
        <Sidebar collapsible="icon" {...props} className="border-r border-border bg-sidebar transition-all duration-300">
            <SidebarHeader className="border-b border-border p-4 relative overflow-hidden bg-sidebar">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 font-bold text-xl text-foreground relative z-10"
                >
                    <div className="relative group">
                        <div className="h-9 w-9 rounded-lg bg-accent border border-border flex items-center justify-center">
                            <Brain className="h-5.5 w-5.5 text-primary" />
                        </div>
                    </div>
                    <span className="tracking-tight">
                        Insight Hub
                    </span>
                </motion.div>
                <div className="absolute top-4 right-4">
                    <ThemeToggle />
                </div>
            </SidebarHeader>
            <SidebarContent className="p-3 gap-2 sidebar-scrollbar-hidden">
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
                                            ? "bg-accent text-foreground"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                        }
                                    `}
                                >
                                    <a href={item.url} className="flex items-center gap-3 w-full px-3 py-2">
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                            />
                                        )}
                                        <div className={`
                                            p-1.5 rounded-lg transition-all duration-300
                                            ${isActive ? "text-primary" : "group-hover:text-primary"}
                                        `}>
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <span className="font-medium text-sm flex-1">{item.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    })}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-border bg-sidebar">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-accent border border-border group cursor-pointer"
                >
                    <div className="h-9 w-9 rounded-full bg-card border border-border flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate">Enterprise Hub</span>
                        <div className="flex items-center gap-1.5">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500" />
                            <span className="text-[10px] text-muted-foreground font-medium">v3.0.4 Online</span>
                        </div>
                    </div>
                </motion.div>
            </SidebarFooter>
            <SidebarRail className="hover:bg-primary/10 transition-colors" />
        </Sidebar>
    )
}
