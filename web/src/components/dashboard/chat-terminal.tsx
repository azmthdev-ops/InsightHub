"use client"

import {
    Card,
    CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Wand2, Paperclip, Image as ImageIcon, History, RefreshCw, Copy, Loader2, CheckCircle2, Circle, Brain, Terminal, Cpu, Play } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Message, ChatResponse, RelayStatus } from "@/types/chat"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { API_URL } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { useDataset } from "@/providers/dataset-provider"
import ReactMarkdown from 'react-markdown'

const StatusStepper = ({ status }: { status: RelayStatus }) => {
    const steps = [
        { id: 'groq', label: 'Processing Intent', sub: 'Groq Llama 3', icon: Brain },
        { id: 'deepseek', label: 'Architecting Logic', sub: 'DeepSeek R1', icon: Terminal },
        { id: 'fastapi', label: 'Executing Pipeline', sub: 'FastAPI Engine', icon: Cpu },
    ]

    const getStepState = (stepId: string) => {
        const order = ['groq', 'deepseek', 'fastapi']
        const currentIndex = order.indexOf(status)
        const stepIndex = order.indexOf(stepId)

        if (status === 'complete') return 'completed'
        if (status === 'error') return 'error'
        if (currentIndex > stepIndex) return 'completed'
        if (currentIndex === stepIndex) return 'active'
        return 'pending'
    }

    return (
        <div className="flex items-center gap-8 px-4 py-3 bg-white/[0.02] border-y border-white/5 backdrop-blur-md">
            {steps.map((step, i) => {
                const state = getStepState(step.id)
                const Icon = step.icon

                return (
                    <div key={step.id} className="flex items-center gap-3 relative">
                        <div className={`
                            relative z-10 w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-500
                            ${state === 'active' ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' :
                                state === 'completed' ? 'bg-green-500/10 border-green-500/50' : 'bg-zinc-900 border-white/5'}
                        `}>
                            {state === 'completed' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                                <Icon className={`h-5 w-5 ${state === 'active' ? 'text-blue-400' : 'text-zinc-600'}`} />
                            )}
                            {state === 'active' && (
                                <motion.div
                                    layoutId="pulse"
                                    className="absolute inset-0 rounded-xl bg-blue-500/20 animate-pulse"
                                />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${state === 'active' ? 'text-white' : 'text-zinc-500'}`}>
                                {step.label}
                            </span>
                            <span className="text-[9px] text-zinc-600 font-mono">{step.sub}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className="ml-4 w-8 h-[1px] bg-white/5" />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

export function ChatTerminal() {
    const { activeDatasetId, datasets, setActiveDatasetById } = useDataset()
    const { toast } = useToast()
    const [status, setStatus] = useState<RelayStatus>('idle')
    const [historyLoading, setHistoryLoading] = useState(true)
    const [mounted, setMounted] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    const [localInput, setLocalInput] = useState("")
    const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([])
    const [isLoading, setIsLoading] = useState(false)

    // Prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    // Fetch Chat History on mount
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    const { data: turns, error } = await supabase
                        .from('chats')
                        .select('*')
                        .order('created_at', { ascending: true })
                        .limit(20)

                    if (turns && !error) {
                        setMessages(turns.map((t: any) => ({
                            id: t.id,
                            role: t.role as 'user' | 'assistant',
                            content: t.content
                        })))
                    }
                }
            } catch (error) {
                console.log("No chat history or not authenticated")
            } finally {
                setHistoryLoading(false)
            }
        }
        fetchHistory()
    }, [])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSend = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        const content = localInput?.trim()
        if (!content || isLoading) return

        setIsLoading(true)
        setStatus('groq')
        setLocalInput("")

        // Add user message immediately
        const userMessageId = Date.now().toString()
        setMessages(prev => [...prev, { id: userMessageId, role: 'user', content }])

        try {
            // Call the AI relay API
            const response = await fetch('/api/ai-relay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', content }],
                    dataset_id: activeDatasetId,
                    execute_code: false
                })
            })

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`)
            }

            setStatus('complete')

            // Read the streaming response
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break
                    const chunk = decoder.decode(value, { stream: true })

                    // Update the last message (or create one)
                    setMessages(prev => {
                        const lastMsg = prev[prev.length - 1]
                        if (lastMsg?.role === 'assistant') {
                            return prev.map((m, i) =>
                                i === prev.length - 1 ? { ...m, content: m.content + chunk } : m
                            )
                        } else {
                            return [...prev, { id: Date.now().toString(), role: 'assistant' as const, content: chunk }]
                        }
                    })
                }
            }

            // Log activity if user is authenticated
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    await supabase.from('user_logs').insert({
                        user_id: user.id,
                        activity_type: 'AI_QUERY',
                        description: `Asked AI: ${content.substring(0, 50)}...`,
                        metadata: { query: content, dataset_id: activeDatasetId }
                    })
                }
            } catch (e) {
                // Silently fail logging
            }

        } catch (error: any) {
            console.error("Chat error:", error)
            setStatus('error')
            toast({
                title: "Transmission Failed",
                description: error.message || "The AI Relay was unable to establish a stable connection.",
                variant: "destructive"
            })

            // Add error message
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Error: ${error.message}`
            }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col h-full bg-[#e8e8e8] overflow-hidden relative">
            {/* Header / Nav */}
            <header className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-violet-50 border border-violet-200">
                        <Wand2 className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">AI Business Consultant</h2>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Strategy • Analysis • Problem Solving</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {mounted && (
                        <Select value={activeDatasetId || ""} onValueChange={setActiveDatasetById}>
                            <SelectTrigger className="w-[220px] bg-white border-gray-200 text-[11px] h-9 rounded-lg">
                                <SelectValue placeholder="Target Dataset" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-200">
                                {datasets.map(ds => (
                                    <SelectItem key={ds.id} value={ds.id} className="text-[11px]">
                                        {ds.filename}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white rounded-xl">
                        <History className="h-5 w-5" />
                    </Button>
                </div>
            </header>

            {/* Status Stepper */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <StatusStepper status={status} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Area */}
            <ScrollArea viewportRef={scrollRef} className="flex-1 min-h-0 p-6">
                <div className="max-w-4xl mx-auto space-y-8">
                    {historyLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12 space-y-6">
                            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-200">
                                <Wand2 className="h-8 w-8 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-gray-700 text-lg font-semibold mb-2">AI Business Consultant Ready</p>
                                <p className="text-gray-500 text-sm max-w-md mx-auto">
                                    I can help you with business strategy, data analysis, problem-solving, and actionable insights.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto mt-6">
                                {[
                                    "Analyze my business metrics",
                                    "Create a growth strategy",
                                    "Identify cost optimization opportunities",
                                    "Forecast revenue trends"
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setLocalInput(suggestion)}
                                        className="p-3 text-left text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={message.id}
                                className={`flex flex-col gap-3 ${message.role === 'user' ? 'items-end' : ''}`}
                            >
                                <div className={`
                                    max-w-[85%] rounded-2xl px-6 py-4 border transition-all duration-300
                                    ${message.role === 'assistant'
                                        ? 'bg-white border-gray-200 rounded-tl-none shadow-sm'
                                        : 'bg-blue-600 text-white border-blue-600 rounded-tr-none'}
                                `}>
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown
                                            components={{
                                                code({ node, inline, className, children, ...props }: any) {
                                                    const match = /language-(\w+)/.exec(className || '')
                                                    const code = String(children).replace(/\n$/, '')
                                                    const isPython = match?.[1] === 'python'

                                                    if (!inline && isPython) {
                                                        return (
                                                            <div className="relative group/code my-4">
                                                                <div className="absolute top-3 right-3 opacity-0 group-hover/code:opacity-100 transition-opacity">
                                                                    <Button
                                                                        size="sm"
                                                                        className="bg-blue-600/80 hover:bg-blue-500 text-[10px] h-7 px-3 rounded-lg font-bold uppercase tracking-wider backdrop-blur-md"
                                                                        onClick={async () => {
                                                                            try {
                                                                                const res = await fetch(`${API_URL}/execute`, {
                                                                                    method: 'POST',
                                                                                    headers: { 'Content-Type': 'application/json' },
                                                                                    body: JSON.stringify({ code, dataset_id: activeDatasetId })
                                                                                })
                                                                                const data = await res.json()
                                                                                toast({ title: "Logic Executed", description: "The AI agent's logic was processed successfully." })
                                                                            } catch (e) {
                                                                                toast({ title: "Execution Error", variant: "destructive", description: "Failed to transmit logic to engine." })
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Play className="h-3 w-3 mr-1.5" />
                                                                        Run Logic
                                                                    </Button>
                                                                </div>
                                                                <pre className="!bg-black/60 !p-6 rounded-2xl border border-white/5 overflow-x-auto">
                                                                    <code className={className} {...props}>
                                                                        {children}
                                                                    </code>
                                                                </pre>
                                                            </div>
                                                        )
                                                    }
                                                    return <code className={className} {...props}>{children}</code>
                                                }
                                            }}
                                        >
                                            {message.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                                <span className="text-[10px] text-zinc-600 font-medium px-2 uppercase tracking-widest">
                                    {message.role === 'assistant' ? 'Silicon Brain' : 'Commander'}
                                </span>
                            </motion.div>
                        ))
                    )}
                    {isLoading && status !== 'error' && (
                        <div className="flex items-center gap-3 animate-pulse px-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            <span className="text-xs text-blue-400 font-medium tracking-tight">AI Reasoning in progress...</span>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Container */}
            <form onSubmit={handleSend} className="flex-shrink-0 p-6 bg-gray-50 border-t border-gray-200">
                <div className="max-w-4xl mx-auto relative group">
                    <Card className={`relative bg-white border-gray-300 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-all shadow-md ${isLoading ? 'border-blue-500 ring-2 ring-blue-200' : ''}`}>
                        <textarea
                            className="w-full bg-transparent border-none focus:ring-0 text-sm p-6 text-gray-900 placeholder-gray-400 resize-none min-h-[120px] outline-none"
                            placeholder="Ask me anything: Business strategy, data analysis, problem-solving, financial planning..."
                            value={localInput}
                            onChange={(e) => setLocalInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            disabled={isLoading}
                        />
                        <div className="px-6 pb-4 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" type="button" className="hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600">
                                    <Paperclip className="h-4.5 w-4.5" />
                                </Button>
                                <Button variant="ghost" size="icon" type="button" className="hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600">
                                    <ImageIcon className="h-4.5 w-4.5" />
                                </Button>
                                <Button variant="ghost" size="icon" type="button" className="hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600">
                                    <RefreshCw className="h-4.5 w-4.5" />
                                </Button>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || !localInput?.trim()}
                                className="bg-blue-600 text-white hover:bg-blue-700 px-8 rounded-2xl font-bold h-11 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                                Transmit
                            </Button>
                        </div>
                    </Card>
                </div>
                <div className="mt-4 flex justify-center">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-blue-500" />
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Groq Llama 3.3</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-violet-500" />
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">DeepSeek R1 Reasoning</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-green-500" />
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Business Intelligence</span>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
