/**
 * outputQualityAgent.js
 *
 * Evaluates prompt output quality using Google Gemini (free tier):
 *   Call 1 — gemini-2.5-flash : run the prompt as a real user request → get generated output
 *   Call 2 — gemini-2.5-flash : judge the output quality on 0-100 scale
 *
 * Both calls use gemini-2.5-flash — reliable free tier, 1M token context.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const JUDGE_SYSTEM = `You are an output quality judge for a prompt engineering marketplace.
You are given a prompt and the AI-generated output it produced.
Evaluate the output on a scale of 0-100 based on:
- Is the output useful and actionable?
- Is it complete — does it fully address the prompt?
- Is it high quality — well-written, accurate, professional?
- Would someone pay money for this prompt based on the output quality?

Be strict. A score of 70+ means the output is commercially viable.

You MUST respond with valid JSON only, no markdown, no other text:
{ "score": <number 0-100>, "feedback": ["<point 1>", "<point 2>", "<point 3>"] }`;

async function evaluateOutputQuality(promptText) {
  try {
    // ── Call 1: Run the prompt as a real user request ─────────────────────────
    const runnerModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { maxOutputTokens: 1024 },
    });
    const runResult     = await runnerModel.generateContent(promptText);
    const generatedOutput = runResult.response.text();

    // ── Call 2: Judge the output quality ─────────────────────────────────────
    const judgeModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: JUDGE_SYSTEM,
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 512 },
    });

    const judgePrompt = `PROMPT:\n${promptText}\n\nGENERATED OUTPUT:\n${generatedOutput}`;
    const judgeResult = await judgeModel.generateContent(judgePrompt);
    const parsed      = JSON.parse(judgeResult.response.text());

    return {
      score:          Math.max(0, Math.min(100, Number(parsed.score) || 50)),
      feedback:       Array.isArray(parsed.feedback) ? parsed.feedback : [parsed.feedback],
      generatedOutput,
    };
  } catch (err) {
    console.error('[OutputQualityAgent] Error:', err.message);
    return {
      score:          50,
      feedback:       ['Output quality evaluation failed — default score assigned'],
      generatedOutput: '',
    };
  }
}

module.exports = { evaluateOutputQuality };
