export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { playerName, playerContext } = req.body;
    if (!playerName) {
      return res.status(400).json({ error: 'playerName required' });
    }

    // Build context hint if local player data was provided
    let contextHint = "";
    if (playerContext && playerContext.pos && playerContext.team) {
      contextHint = `\n\nIMPORTANT PLAYER IDENTITY: This is ${playerContext.name || playerName}, who plays ${playerContext.pos} for ${playerContext.team}${playerContext.age ? ` (age ${playerContext.age})` : ""}. Make sure your analysis is specifically about THIS player at THIS position on THIS team. Do not confuse with other players who share a similar name.`;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: "You are an elite fantasy baseball analyst with deep expertise in points leagues. You must respond ONLY with valid JSON, no other text. Current date is " + new Date().toISOString().split('T')[0] + ".",
        messages: [{
          role: "user",
          content: `Provide a comprehensive 2026 fantasy baseball analysis for "${playerName}".${contextHint}

IMPORTANT: Use CBS Sports positional eligibility for the "pos" field — this means the position the player qualifies for on CBSSports.com fantasy baseball. If a player has multi-position eligibility on CBS, list all separated by slashes.

Respond with ONLY this JSON structure, no markdown, no backticks, no preamble:
{
  "name": "Full Player Name",
  "team": "MLB Team Abbreviation",
  "pos": "CBS Sports fantasy eligible position(s)",
  "age": 25,
  "strategic": "3-4 paragraph strategic analysis covering: current status heading into 2026, key 2025 stats/trends, strengths and risks for fantasy, and points league value (HR=4, K=-1 batters; W=10, QS=4, K=1, L=-5, ER=-1 pitchers). Be specific with numbers.",
  "sentiment_3day": "positive OR neutral OR negative",
  "sentiment_3day_reason": "One sentence explaining the 3-day sentiment",
  "sentiment_week": "positive OR neutral OR negative",
  "sentiment_week_reason": "One sentence explaining the weekly sentiment",
  "role_security": "green OR yellow OR red",
  "role_security_reason": "One sentence explaining role security rating",
  "verdict": "RISER or FALLER or HOLD",
  "proj_points": 350,
  "key_risk": "Single biggest risk in one sentence",
  "key_upside": "Single biggest upside in one sentence"
}`
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    let text = "";
    if (data.content && Array.isArray(data.content)) {
      text = data.content.filter(item => item.type === "text" && item.text).map(item => item.text).join("");
    }

    // Try to parse JSON
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    try {
      const parsed = JSON.parse(cleaned);
      return res.status(200).json({ parsed });
    } catch {
      return res.status(200).json({ rawText: text });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
