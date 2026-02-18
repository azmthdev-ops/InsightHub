import { groq } from "@/lib/groq";
import { deepseek } from "@/lib/deepseek";

// Business Consultant System Prompt
const BUSINESS_CONSULTANT_PROMPT = `You are an elite Business Intelligence Consultant and Problem Solver with expertise in:

**Core Competencies:**
- Business Strategy & Planning
- Financial Analysis & Forecasting
- Data-Driven Decision Making
- Process Optimization
- Market Analysis
- Risk Assessment
- Growth Strategy

**Your Approach:**
1. UNDERSTAND: First, deeply understand the business context, goals, and constraints
2. ANALYZE: Use data and reasoning to identify patterns, opportunities, and risks
3. STRATEGIZE: Develop actionable plans with clear steps and metrics
4. VISUALIZE: Present insights through data visualizations when relevant
5. RECOMMEND: Provide specific, implementable recommendations

**Communication Style:**
- Professional yet approachable
- Data-driven with clear reasoning
- Action-oriented with concrete steps
- Strategic thinking with tactical execution
- Always consider ROI and business impact

When analyzing data:
- Identify key metrics and KPIs
- Spot trends and anomalies
- Calculate financial implications
- Assess risks and opportunities
- Provide benchmarks and comparisons

When solving problems:
- Break down complex issues into manageable parts
- Consider multiple perspectives
- Evaluate trade-offs
- Prioritize based on impact and feasibility
- Create step-by-step action plans`;

export async function POST(req: Request) {
    let body: {
        messages?: Array<{ role: string; content: string }>;
        message?: string;
        dataset_id?: string;
        execute_code?: boolean;
        mode?: 'consultant' | 'analyst' | 'strategist';
    };

    try {
        body = await req.json();
    } catch (error) {
        console.error("JSON parse error:", error);
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
    }

    const { messages, message, dataset_id, execute_code, mode = 'consultant' } = body;

    // Support both messages array and single message
    const userMessage = message || (messages?.[messages.length - 1]?.content || "");
    const messageHistory = messages?.slice(0, -1) || [];

    if (!userMessage) {
        return new Response(JSON.stringify({ error: "Message is required" }), { status: 400 });
    }

    try {
        // 1. Intent Analysis - Determine what the user needs
        let intent = 'CONSULT';
        let needsDeepReasoning = false;
        
        try {
            const intentRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ 
                        role: 'user', 
                        content: `Analyze this business query and classify:
Query: "${userMessage}"

Classify as ONE of:
- STRATEGY: Business strategy, planning, growth
- ANALYSIS: Data analysis, metrics, insights
- PROBLEM: Problem-solving, troubleshooting
- CODE: Needs code generation or execution
- CONSULT: General business consultation

Also determine if it needs DEEP_REASONING (complex multi-step thinking).

Reply in format: INTENT|REASONING (e.g., "STRATEGY|DEEP" or "ANALYSIS|SIMPLE")` 
                    }]
                })
            });
            
            if (intentRes.ok) {
                const intentData = await intentRes.json();
                const response = intentData.choices?.[0]?.message?.content?.trim() || 'CONSULT|SIMPLE';
                const [intentType, reasoningLevel] = response.split('|');
                intent = intentType;
                needsDeepReasoning = reasoningLevel === 'DEEP';
            }
        } catch (e) {
            console.error("Intent analysis failed:", e);
            // Continue with default intent
        }

        console.log(`🎯 Intent: ${intent}, Deep Reasoning: ${needsDeepReasoning}`);

        // Get dataset context if available (optional, won't fail if Supabase unavailable)
        let dataContext = '';
        if (dataset_id) {
            try {
                const { createClient } = await import('@supabase/supabase-js');
                const supabase = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );
                const { data: ds } = await supabase.from('datasets').select('columns, schema').eq('id', dataset_id).single();
                if (ds) {
                    dataContext = `\n\n📊 ACTIVE DATASET CONTEXT:\nColumns: ${JSON.stringify(ds.columns)}\nSchema: ${JSON.stringify(ds.schema)}`;
                }
            } catch (e) {
                console.log("Dataset context not available:", e);
            }
        }

        // 2. Choose the right AI model based on intent
        let systemPrompt = BUSINESS_CONSULTANT_PROMPT;
        
        if (intent === 'CODE' || execute_code) {
            systemPrompt = `${BUSINESS_CONSULTANT_PROMPT}\n\n**CODE GENERATION MODE:**
You are now in code generation mode. Generate clean, production-ready Python code.
Use pandas for data manipulation. Wrap code in \`\`\`python\`\`\` blocks.${dataContext}`;
        } else if (intent === 'STRATEGY') {
            systemPrompt = `${BUSINESS_CONSULTANT_PROMPT}\n\n**STRATEGIC PLANNING MODE:**
Focus on long-term strategy, competitive positioning, and growth opportunities.
Provide structured action plans with timelines and success metrics.${dataContext}`;
        } else if (intent === 'ANALYSIS') {
            systemPrompt = `${BUSINESS_CONSULTANT_PROMPT}\n\n**DATA ANALYSIS MODE:**
Focus on extracting insights from data, identifying trends, and providing actionable recommendations.
Use statistical reasoning and data visualization suggestions.${dataContext}`;
        } else if (intent === 'PROBLEM') {
            systemPrompt = `${BUSINESS_CONSULTANT_PROMPT}\n\n**PROBLEM-SOLVING MODE:**
Break down the problem systematically:
1. Root cause analysis
2. Impact assessment
3. Solution options with pros/cons
4. Recommended action plan
5. Risk mitigation${dataContext}`;
        }

        // Build conversation history
        const chatMessages = [
            { role: 'system', content: systemPrompt },
            ...messageHistory.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage }
        ];

        // 3. Use DeepSeek for complex reasoning, Groq for fast responses
        let stream;
        let aiMode = 'groq-fast';
        
        if (needsDeepReasoning || intent === 'STRATEGY' || intent === 'PROBLEM') {
            console.log("🧠 Attempting DeepSeek R1 for deep reasoning...");
            try {
                stream = await (deepseek as any).chat.completions.create({
                    model: 'deepseek-reasoner',
                    messages: chatMessages,
                    stream: true,
                });
                aiMode = 'deepseek-reasoning';
            } catch (deepseekError: any) {
                console.warn("⚠️ DeepSeek unavailable, falling back to Groq:", deepseekError.message);
                stream = await groq.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: chatMessages,
                    stream: true,
                } as any);
            }
        } else {
            console.log("⚡ Using Groq Llama 3.3 for fast response...");
            stream = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: chatMessages,
                stream: true,
            } as any);
        }

        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                console.log("📡 Starting AI consultant stream...");
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        const reasoning = (chunk.choices[0]?.delta as any)?.reasoning_content || "";

                        // Stream reasoning process (from DeepSeek)
                        if (reasoning) {
                            controller.enqueue(encoder.encode(`\n\n💭 **Reasoning Process:**\n${reasoning}\n\n`));
                        }
                        
                        if (content) {
                            controller.enqueue(encoder.encode(content));
                        }
                    }
                } catch (e) {
                    console.error("Stream error:", e);
                    controller.enqueue(encoder.encode("\n\n⚠️ Stream interrupted. Please try again."));
                } finally {
                    controller.close();
                    console.log("✅ AI consultant stream complete");
                }
            }
        });

        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-AI-Mode': aiMode,
                'X-Intent': intent,
            },
        });

    } catch (error: any) {
        console.error('AI Consultant Error:', error);
        console.error('Error stack:', error.stack);
        return new Response(
            JSON.stringify({ 
                error: error.message || "Internal server error",
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
