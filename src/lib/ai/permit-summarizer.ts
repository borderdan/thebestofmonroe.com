import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function summarizePermit(permitData: unknown) {
  const prompt = `
    Summarize this Monroe building permit for a resident. 
    Use the following data: ${JSON.stringify(permitData)}
    
    Translate government "bureaucratese" into plain English.
    Tell them exactly: 
    1. What is being built? 
    2. Where is it? 
    3. Does it increase traffic or affect the neighborhood? 
    4. What is the estimated completion date (if detectable)?
    
    Keep it under 3 bullet points. Be concise and helpful.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Permit Summarization failed:", error);
    return "Summary unavailable. Review official permit details for more information.";
  }
}
