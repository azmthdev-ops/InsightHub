"use strict"

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Play, Copy, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MLStudio() {
    return (
        <div className="flex flex-col h-full gap-6">
            <Card className="flex-1 flex flex-col bg-zinc-900/50 backdrop-blur-md border-white/5 overflow-hidden">
                <div className="bg-[#0d1117]/50 border-b border-white/5 p-3 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40" />
                        </div>
                        <span className="ml-4 text-xs font-mono text-zinc-500">inference_engine.py</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" className="h-6 gap-1.5 text-xs text-zinc-400 hover:text-white">
                            <Copy className="h-3 w-3" /> Copy
                        </Button>
                        <Button size="sm" className="h-6 gap-1.5 bg-blue-500/20 text-blue-500 text-xs font-bold border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-all">
                            <Play className="h-3 w-3" /> RUN MODEL
                        </Button>
                    </div>
                </div>
                <CardContent className="flex-1 bg-[#0d1117] p-4 font-mono text-sm overflow-y-auto">
                    <div className="flex gap-4">
                        <div className="text-zinc-600 text-right select-none w-6 text-xs leading-relaxed">
                            1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9<br />10
                        </div>
                        <div className="text-zinc-300 text-xs leading-relaxed">
                            <span className="text-purple-400">import</span> torch<br />
                            <span className="text-purple-400">from</span> ultralytics <span className="text-purple-400">import</span> YOLO<br /><br />
                            <span className="text-zinc-500"># Load pre-trained model</span><br />
                            model = YOLO(<span className="text-yellow-200">'yolov8n.pt'</span>)<br /><br />
                            <span className="text-purple-400">def</span> <span className="text-blue-400">run_inference</span>(source_id):<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;results = model.predict(source=source_id, conf=<span className="text-orange-300">0.25</span>)<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">for</span> result <span className="text-purple-400">in</span> results:<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;boxes = result.boxes<br />
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">return</span> boxes.data.cpu().numpy()<br /><br />
                            <span className="text-blue-400">run_inference</span>(<span className="text-yellow-200">"rtsp://edge-node-04/stream"</span>)
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
