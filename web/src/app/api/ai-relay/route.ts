import { groq } from "@/lib/groq";
import { deepseek } from "@/lib/deepseek";
import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const createSupabaseServer = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
};

export async function POST(req: Request) {
    let body: {
        messages?: Array<{ role: string; content: string }>;
        message?: string;
        dataset_id?: string;
        execute_code?: boolean
    };

    try {
        body = await req.json();
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
    }

    const { messages, message, dataset_id, execute_code } = body;

    // Support both messages array and single message
    const userMessage = message || (messages?.[messages.length - 1]?.content || "");
    const messageHistory = messages?.slice(0, -1) || [];

    if (!userMessage) {
        return new Response(JSON.stringify({ error: "Message is required" }), { status: 400 });
    }

    const supabase = createSupabaseServer();

    try {
        // 1. Intent Analysis
        let intent = 'CHAT';
        try {
            const intentRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: `Classify: "${userMessage}". Reply CHAT or CODE only.` }]
                })
            });
            const intentData = await intentRes.json();
            intent = intentData.choices?.[0]?.message?.content?.trim().toUpperCase() || 'CHAT';
        } catch (e) {
            console.error("Intent analysis failed:", e);
        }

        const wantsCode = intent.includes('CODE') || execute_code;
        console.log(`Intent: ${intent}, Wants Code: ${wantsCode}`);

        // Get dataset schema
        let schemaHint = '';
        if (dataset_id) {
            try {
                const { data: ds } = await supabase.from('datasets').select('columns, schema').eq('id', dataset_id).single();
                if (ds) schemaHint = `\n\nDataset columns: ${JSON.stringify(ds.columns)}`;
            } catch (e) {
                console.log("Dataset not accessible");
            }
        }

        const systemPrompt = wantsCode
            ? `You are a Data Scientist. ${schemaHint}\nUse pandas. Wrap code in \`\`\`python\`\`\`.`
            : `You are an AI Assistant. ${schemaHint}`;

        // Build messages with history
        const chatMessages = [
            { role: 'system', content: systemPrompt },
            ...messageHistory.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
            { role: "user", content: userMessage }
        ];

        let stream;
        if (wantsCode) {
            stream = await (deepseek as any).chat.completions.create({
                model: 'deepseek-reasoner',
                messages: chatMessages,
                stream: true,
            });
        } else {
            stream = await groq.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: chatMessages,
                stream: true,
            } as any);
        }

        const encoder = new TextEncoder();
        const readableStream = new ReadableStream({
            async start(controller) {
                console.log("Starting direct stream relay...");
                try {
                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        // Also handle DeepSeek reasoning content if present
                        const reasoning = (chunk.choices[0]?.delta as any)?.reasoning_content || "";

                        if (reasoning) {
                            controller.enqueue(encoder.encode(reasoning));
                        } else if (content) {
                            controller.enqueue(encoder.encode(content));
                        }
                    }
                } catch (e) {
                    console.error("Direct stream error:", e);
                } finally {
                    controller.close();
                    console.log("Direct stream relay finished.");
                }
            }
        });

        return new Response(readableStream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return new Response(JSON.stringify({ error: error.message || "Internal server error" }), { status: 500 });
    }
}
