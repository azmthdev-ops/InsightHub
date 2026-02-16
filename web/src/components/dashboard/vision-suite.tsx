"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Upload, Play, Loader2, Target, Cpu, Activity, Info,
    BarChart3, Shield, Eye, Zap, Crosshair, Radar
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { API_URL } from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"
import {
    ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
    ZAxis, Tooltip, Legend, RadarChart, PolarGrid,
    PolarAngleAxis, PolarRadiusAxis, Radar as ReRadar
} from "recharts"

const MODELS = [
    { id: "yolov8", name: "YOLOv8n", type: "Ultralytics", color: "#60a5fa" },
    { id: "yolov9", name: "YOLOv9-c", type: "HuggingFace", color: "#f472b6" },
    { id: "yolov11", name: "YOLOv11n", type: "Ultralytics", color: "#34d399" },
    { id: "rf-detr", name: "RF-DETR", type: "HuggingFace", color: "#a78bfa" },
    { id: "yolov12", name: "YOLOv12n", type: "Ultralytics", color: "#fbbf24" },
];

export function VisionSuite() {
    const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [selectedModels, setSelectedModels] = useState<string[]>(["yolov8"]);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [scanPosition, setScanPosition] = useState(0);

    useEffect(() => {
        if (analyzing) {
            const interval = setInterval(() => {
                setScanPosition(prev => (prev + 1) % 100);
            }, 30);
            return () => clearInterval(interval);
        }
    }, [analyzing]);

    const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedVideo(file);
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    const [telemetry, setTelemetry] = useState<any>(null);
    const canvasRef = useCallback((node: HTMLCanvasElement | null) => {
        if (node !== null) {
            setCanvas(node);
        }
    }, []);
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
    const [streamImage, setStreamImage] = useState<string | null>(null);

    const toggleModel = (modelId: string) => {
        setSelectedModels(prev =>
            prev.includes(modelId)
                ? prev.filter(id => id !== modelId)
                : [...prev, modelId]
        );
    };

    const startAnalysis = async () => {
        if (!selectedVideo) return;
        setAnalyzing(true);
        setResults(null);
        setStreamImage(null);

        try {
            const formData = new FormData();
            formData.append("file", selectedVideo);
            formData.append("models", selectedModels.join(","));

            const response = await fetch(`${API_URL}/vision/analyze`, {
                method: "POST",
                body: formData,
            });

            if (!response || !response.body) throw new Error("Connection failed");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = new Uint8Array(0);

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const newBuffer = new Uint8Array(buffer.length + value.length);
                newBuffer.set(buffer);
                newBuffer.set(value, buffer.length);
                buffer = newBuffer;

                // Simple multipart parser
                let boundaryIdx = -1;
                while ((boundaryIdx = indexOf(buffer, new TextEncoder().encode("--frame"))) !== -1) {
                    const nextBoundaryIdx = indexOf(buffer, new TextEncoder().encode("--frame"), boundaryIdx + 7);
                    if (nextBoundaryIdx === -1) break;

                    const chunk = buffer.slice(boundaryIdx, nextBoundaryIdx);
                    buffer = buffer.slice(nextBoundaryIdx);

                    // Extract Telemetry
                    const telemetryHeader = "X-Telemetry: ";
                    const telemetryIdx = indexOf(chunk, new TextEncoder().encode(telemetryHeader));
                    if (telemetryIdx !== -1) {
                        const endOfTelemetry = indexOf(chunk, new TextEncoder().encode("\r\n"), telemetryIdx);
                        const telemetryStr = decoder.decode(chunk.slice(telemetryIdx + telemetryHeader.length, endOfTelemetry));
                        try {
                            const tele = JSON.parse(telemetryStr);
                            setTelemetry(tele);
                            setResults((prev: any) => ({
                                ...prev,
                                performance: {
                                    ...prev?.performance,
                                    ...Object.fromEntries(Object.entries(tele.layers).map(([k, v]: any) => [k, v.metrics]))
                                }
                            }));
                        } catch (e) { }
                    }

                    // Extract Image
                    const imgStart = indexOf(chunk, new TextEncoder().encode("\r\n\r\n")) + 4;
                    const imgEnd = indexOf(chunk, new TextEncoder().encode("\r\n"), imgStart);
                    if (imgStart > 3 && imgEnd !== -1) {
                        const imgBlob = new Blob([chunk.slice(imgStart, imgEnd)], { type: "image/jpeg" });
                        if (streamImage) URL.revokeObjectURL(streamImage);
                        setStreamImage(URL.createObjectURL(imgBlob));
                    }
                }
            }
        } catch (error) {
            console.error("Vision uplink failed:", error);
        } finally {
            setAnalyzing(false);
        }
    };

    // Helper for finding subsequence in Uint8Array
    function indexOf(source: Uint8Array, search: Uint8Array, start = 0) {
        for (let i = start; i <= source.length - search.length; i++) {
            let found = true;
            for (let j = 0; j < search.length; j++) {
                if (source[i + j] !== search[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return i;
        }
        return -1;
    }

    useEffect(() => {
        if (!canvas || !telemetry) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        selectedModels.forEach(modelId => {
            const layer = telemetry.layers[modelId];
            if (!layer) return;
            const modelColor = MODELS.find(m => m.id === modelId)?.color || "#fff";

            // Draw Detections
            layer.detections.forEach((det: any) => {
                const [x1, y1, x2, y2] = det.bbox;
                ctx.strokeStyle = modelColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

                ctx.fillStyle = modelColor;
                ctx.font = "bold 10px Inter";
                ctx.fillText(`${det.class_name} ${(det.confidence * 100).toFixed(0)}%`, x1, y1 - 5);
            });

            // Draw Trajectories
            Object.values(layer.predictions).forEach((pred: any) => {
                pred.trajectories.forEach((traj: any, idx: number) => {
                    ctx.beginPath();
                    ctx.strokeStyle = modelColor;
                    ctx.globalAlpha = pred.confidences[idx] * 0.6;
                    ctx.setLineDash([5, 5]);
                    traj.forEach((p: any, i: number) => {
                        if (i === 0) ctx.moveTo(p[0], p[1]);
                        else ctx.lineTo(p[0], p[1]);
                    });
                    ctx.stroke();
                });
            });
            ctx.globalAlpha = 1.0;
            ctx.setLineDash([]);
        });
    }, [canvas, telemetry, selectedModels]);

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-950 overflow-hidden">
            {/* HUD Header */}
            <header className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        <Radar className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Vision HUD</h2>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Real-time Telemetry Control</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Core Sync: {analyzing ? 'STREAMING' : 'READY'}</span>
                    </div>
                    {selectedVideo && (
                        <Button
                            onClick={startAnalysis}
                            disabled={analyzing}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-6 h-10 font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        >
                            {analyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                            Initialize Uplink
                        </Button>
                    )}
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden p-6 gap-6">
                {/* Left Telemetry Panel */}
                <div className="w-80 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-2xl rounded-3xl overflow-hidden flex-shrink-0 shadow-2xl">
                        <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
                            <CardTitle className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                                <Target className="h-4 w-4 text-blue-400" />
                                Model Selection
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {MODELS.map(model => (
                                <button
                                    key={model.id}
                                    onClick={() => toggleModel(model.id)}
                                    className={`
                                        w-full p-4 rounded-2xl border transition-all duration-300 text-left
                                        ${selectedModels.includes(model.id)
                                            ? 'bg-blue-600 border-blue-500 shadow-lg'
                                            : 'bg-white/[0.02] border-white/5 hover:border-white/10 opacity-60'}
                                    `}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-[11px] font-bold ${selectedModels.includes(model.id) ? 'text-white' : 'text-zinc-400'}`}>
                                            {model.name}
                                        </span>
                                        <div className="h-3 w-3 rounded-full shadow-inner" style={{ backgroundColor: model.color }} />
                                    </div>
                                    <p className={`text-[9px] font-mono ${selectedModels.includes(model.id) ? 'text-blue-200' : 'text-zinc-600'}`}>
                                        {model.type.toUpperCase()} // LATENCY: 12ms
                                    </p>
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-2xl rounded-3xl h-64 flex-shrink-0 shadow-2xl overflow-hidden">
                        <div className="p-6 h-full flex flex-col">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Network Status</h3>
                            <div className="flex-1 flex items-center justify-center">
                                <div className="h-32 w-32 rounded-full border border-emerald-500/20 flex items-center justify-center relative">
                                    <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin duration-[4s]" />
                                    <div className="absolute inset-4 border border-blue-500/20 rounded-full" />
                                    <Zap className="h-8 w-8 text-emerald-400 animate-pulse" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                                <div>
                                    <p className="text-[8px] text-zinc-600 font-bold uppercase">Packet Loss</p>
                                    <p className="text-xs font-mono text-zinc-300">0.02%</p>
                                </div>
                                <div>
                                    <p className="text-[8px] text-zinc-600 font-bold uppercase">Uplink Speed</p>
                                    <p className="text-xs font-mono text-zinc-300">4.2 GB/S</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Main Viewport */}
                <div className="flex-1 flex flex-col gap-6 min-w-0">
                    <div className="flex-1 relative rounded-[40px] border border-white/5 bg-black bg-grid-white/[0.02] overflow-hidden shadow-2xl">
                        {/* Corner Accents */}
                        <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-white/20 rounded-tl-lg pointer-events-none z-20" />
                        <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-white/20 rounded-tr-lg pointer-events-none z-20" />
                        <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-white/20 rounded-bl-lg pointer-events-none z-20" />
                        <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-white/20 rounded-br-lg pointer-events-none z-20" />

                        {streamImage || videoPreview ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                {streamImage ? (
                                    <img src={streamImage} className="w-full h-full object-contain" />
                                ) : (
                                    <video src={videoPreview!} className="w-full h-full object-contain opacity-40" />
                                )}

                                <canvas
                                    ref={canvasRef}
                                    width={1280}
                                    height={720}
                                    className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                                />

                                {analyzing && (
                                    <>
                                        <motion.div
                                            className="absolute left-0 w-full h-[2px] bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] z-30"
                                            animate={{ top: [`${scanPosition}%`] }}
                                        />
                                        <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-[1px] pointer-events-none z-20" />
                                        <div className="absolute top-12 left-12 p-3 rounded-lg bg-black/60 border border-emerald-500/50 backdrop-blur-xl z-30">
                                            <div className="flex items-center gap-2 text-emerald-400">
                                                <Eye className="h-4 w-4 animate-pulse" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Neural Link: {telemetry?.id || 0}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-white/[0.02] transition-all group">
                                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                                <div className="h-24 w-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-600/10 group-hover:border-blue-500/50 transition-all duration-500">
                                    <Upload className="h-10 w-10 text-zinc-600 group-hover:text-blue-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white tracking-tight">Establish Visual Link</h3>
                                <p className="text-zinc-500 text-sm mt-2">Transmit MP4 / MOV for neural processing</p>
                            </label>
                        )}
                    </div>

                    {/* Bottom Data Row */}
                    <div className="h-64 grid grid-cols-3 gap-6">
                        <Card className="bg-zinc-900/40 border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Activity className="h-24 w-24" />
                            </div>
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Processing Latency</h3>
                            {results ? (
                                <div className="flex-1 space-y-4">
                                    {selectedModels.map(id => (
                                        <div key={id} className="space-y-1">
                                            <div className="flex justify-between text-[10px]">
                                                <span className="text-zinc-400">{MODELS.find(m => m.id === id)?.name}</span>
                                                <span className="text-blue-400">{results.performance?.[id]?.fps.toFixed(1) || 0} FPS</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-blue-500"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${((results.performance?.[id]?.fps || 0) / 60) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-zinc-700 italic text-xs">Waiting for data link...</div>
                            )}
                        </Card>

                        <Card className="bg-zinc-900/40 border-white/5 rounded-3xl p-6 flex flex-col">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Geometric Deviation</h3>
                            {results ? (
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={selectedModels.map(id => ({
                                            subject: MODELS.find(m => m.id === id)?.name,
                                            A: (results.performance?.[id]?.avg_ade || 0) * 10,
                                            fullMark: 100,
                                        }))}>
                                            <PolarGrid stroke="#333" />
                                            <PolarAngleAxis dataKey="subject" fontSize={8} tick={{ fill: '#666' }} />
                                            <ReRadar name="ADE" dataKey="A" stroke="#10b821" fill="#10b821" fillOpacity={0.4} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-zinc-700 italic text-xs underline decoration-zinc-800">Uplink Required</div>
                            )}
                        </Card>

                        <Card className="bg-zinc-900/40 border-white/5 rounded-3xl p-6 flex flex-col">
                            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Neural Accuracy Map</h3>
                            {results ? (
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart>
                                            <XAxis type="number" dataKey="fps" name="speed" unit="fps" stroke="#444" fontSize={8} />
                                            <YAxis type="number" dataKey="accuracy" name="acc" unit="%" stroke="#444" fontSize={8} />
                                            <ZAxis type="number" range={[60, 200]} />
                                            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#09090b', borderColor: '#222' }} />
                                            <Scatter name="Models" data={selectedModels.map(id => ({
                                                fps: results.performance?.[id]?.fps || 0,
                                                accuracy: 100 - (results.performance?.[id]?.avg_ade || 0),
                                                fill: MODELS.find(m => m.id === id)?.color
                                            }))} fill="#8884d8" />
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-zinc-700 italic text-xs">Awaiting calibration...</div>
                            )}
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    )
}
