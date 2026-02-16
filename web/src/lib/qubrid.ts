import OpenAI from "openai";

export const qubrid = new OpenAI({
    baseURL: 'https://platform.qubrid.com/v1',
    apiKey: process.env.QUBRID_API_KEY
});

export async function queryQubrid(prompt: string) {
    if (!process.env.QUBRID_API_KEY) {
        throw new Error("QUBRID_API_KEY is not set");
    }
    try {
        const completion = await qubrid.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "GPT-OSS-120B",
        });

        return completion.choices[0].message.content || "";
    } catch (error) {
        console.error("Error querying Qubrid:", error);
        throw error;
    }
}
