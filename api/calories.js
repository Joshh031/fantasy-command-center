const Anthropic = require("@anthropic-ai/sdk");

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { food } = req.body || {};
  if (!food || typeof food !== "string") {
    return res.status(400).json({ error: "Missing food name" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  try {
    const client = new Anthropic.default
      ? new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY })
      : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Estimate the calories and protein for this food item a child might eat: "${food}"

Respond ONLY with valid JSON, no other text, no markdown, no code fences:
{"name": "cleaned up food name", "cal": number, "protein": number, "serving": "brief serving description"}

Use typical kid-sized portions. Be reasonable and accurate. Round calories to nearest 5, protein to nearest 1g.`,
        },
      ],
    });

    let text = msg.content[0].text.trim();
    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
    const data = JSON.parse(text);
    return res.status(200).json(data);
  } catch (err) {
    console.error("Calorie estimation error:", err.message || err);
    return res.status(500).json({ error: err.message || "Failed to estimate calories" });
  }
};
