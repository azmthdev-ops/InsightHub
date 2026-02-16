import Groq from "groq-sdk";

export const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function queryGroq(prompt: string) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not set");
    }
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
        });
        return chatCompletion.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Error querying Groq:", error);
        throw error;
    }
}
