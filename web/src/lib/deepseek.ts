import OpenAI from "openai";

export const deepseek = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});

export async function queryDeepSeek(prompt: string): Promise<string> {
    if (!process.env.DEEPSEEK_API_KEY) {
        throw new Error("DEEPSEEK_API_KEY is not set");
    }
    try {
        const completion = await deepseek.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "deepseek-reasoner", // FREE DeepSeek R1 model
        });

        return completion.choices[0].message.content || "";
    } catch (error) {
        console.error("Error querying DeepSeek:", error);
        throw error;
    }
}
