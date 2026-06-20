/**
 * clarityAgent.js
 * Evaluates prompt clarity using Google Gemini 2.0 Flash (free tier).
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM = `You are a prompt clarity evaluator for a prompt engineering marketplace.
Evaluate the given prompt on a scale of 0-100 based on:
- Does it have a clear, specific goal?
- Is it unambiguous — would any AI model understand exactly what to do?
- Is the intent immediately obvious?
- Are there any vague or unclear parts?

Be strict but fair. A score of 70+ means the prompt is production-quality clear.

You MUST respond with valid JSON only, no markdown, no other text:
{ "score": <number 0-100>, "feedback": ["<point 1>", "<point 2>", "<point 3>"] }`;

async function evaluateClarity(promptText) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM,
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 512 },
    });

    const result = await model.generateContent(promptText);
    const text   = result.response.text();
    const parsed = JSON.parse(text);

    return {
      score:    Math.max(0, Math.min(100, Number(parsed.score) || 50)),
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback : [parsed.feedback],
    };
  } catch (err) {
    console.error('[ClarityAgent] Error:', err.message);
    return { score: 50, feedback: ['Clarity evaluation failed — default score assigned'] };
  }
}

module.exports = { evaluateClarity };
