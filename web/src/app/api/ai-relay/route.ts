import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createClient } from '@supabase/supabase-js';

// AI SDK Providers
const groqProvider = createOpenAI({
    apiKey: process.env.GROQ_API_KEY!,
    baseURL: 'https://api.groq.com/openai/v1',
});

const deepseekProvider = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY!,
    baseURL: 'https://api.deepseek.com',
});

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
        // 1. Intent Analysis (Keep blocking for now as it's fast)
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
        const intent = intentData.choices?.[0]?.message?.content?.trim().toUpperCase() || 'CHAT';
        const wantsCode = intent.includes('CODE') || execute_code;

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

        const model = wantsCode
            ? deepseekProvider('deepseek-reasoner')
            : groqProvider('llama-3.3-70b-versatile');

        const systemPrompt = wantsCode
            ? `You are a Data Scientist. ${schemaHint}\nUse pandas. Wrap code in \`\`\`python\`\`\`.`
            : `You are an AI Assistant. ${schemaHint}`;

        // Build messages with history
        const chatMessages = [
            ...messageHistory.map((m: { role: string; content: string }) => ({ role: m.role as "user" | "assistant", content: m.content })),
            { role: "user" as const, content: userMessage }
        ];

        const result = await streamText({
            model: model as any,
            system: systemPrompt,
            messages: chatMessages,
        });

        // Return streaming response
        return result.toTextStreamResponse();

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return new Response(JSON.stringify({ error: error.message || "Internal server error" }), { status: 500 });
    }
}
