# Fantasy Command Center — IAMFBL League

PWA for draft management, lineup optimization, trade analysis, and AI-powered player intel.

## Deploy to Vercel (2 minutes)

1. **Create GitHub repo:**
   - Go to github.com → New Repository → name it `fantasy-command-center`
   - Push this folder:
     ```
     cd C:\Users\joshh\OneDrive\Desktop\fantasy-command-center
     git init
     git add .
     git commit -m "Fantasy Command Center v1"
     git remote add origin https://github.com/YOUR_USERNAME/fantasy-command-center.git
     git branch -M main
     git push -u origin main
     ```

2. **Deploy on Vercel:**
   - Go to vercel.com → New Project → Import the repo
   - Framework Preset: **Other**
   - Root Directory: **./`**
   - Output Directory: **public**
   - Add Environment Variable:
     - `ANTHROPIC_API_KEY` = your Anthropic API key (for Intel Search feature)
   - Deploy

3. **Add to phone home screen:**
   - Open the Vercel URL on your phone in Safari/Chrome
   - Safari: Share → Add to Home Screen
   - Chrome: Menu → Add to Home Screen

## Features
- **My Team** — Weekly lineup with START/SIT, 2-start SP tracking
- **Keepers** — Locked keepers + watchlist, March 15 deadline countdown
- **Draft HQ** — Snake draft calculator, bulk import, optimizer by positional need
- **Roster** — Full roster view with keeper badges
- **FA Analyzer** — Drop/add comparison with projection diff
- **Trade Eval** — Symmetric trade builder with verdict system
- **Intel Feed** — AI-powered player search with sentiment dashboard + role security

## Environment Variables
- `ANTHROPIC_API_KEY` — Required for Intel Search (player analysis via Claude)
