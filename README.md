<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1DIBI4Iqo22WtlWbLJw_jwZItV2rJ5QRF

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## AI Brain (1-5)

The app now includes a local "brain" pipeline with five capabilities:

1. Perception: normalizes text commands from the new text interface.
2. Memory: stores short-term interaction history and long-term intent statistics.
3. Reasoning: maps intents to actions (`create_note`, `create_file`, `download_file`, `open_application`, `get_system_info`).
4. Learning: accepts positive/negative feedback per decision and tunes confidence weights.
5. Safety: blocks credential-exfiltration and dangerous command patterns.

Example commands in the "Text Neural Interface":
- `crea nota task di oggi`
- `crea file report.txt: stato sistema stabile`
- `scarica file report.txt`
- `apri app Dashboard Operativa`
- `info sistema`
