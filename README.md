# Muhammad Afnan AI — Website first, Android next

A starter four-language translator for English, Turkish, Urdu script, and Roman Urdu.

## Features
- Responsive React website with translator, AI chat tab, language swapping, copy/share, and local translation history
- Free online translation via MyMemory (internet required; the service receives submitted text)
- Optional Ollama mode for local-model translation and chat
- PWA manifest included
- Android share/selection integration roadmap below

## Requirements
- Node.js 20+ recommended
- npm
- For local AI: install Ollama and run `ollama pull qwen2.5:3b`

## Run locally
```bash
npm install
npm run dev
```
Open the local URL Vite prints, usually `http://localhost:5173`.

## Build
```bash
npm run build
npm run preview
```
The static production website is generated in `dist/`.

## Deploy
**Vercel:** Import this repository. Select Vite, build command `npm run build`, output directory `dist`.

**Netlify:** Import this repository. Build command `npm run build`, publish directory `dist`.

## Local Ollama mode
1. On the computer running the browser, install Ollama and run:
   ```bash
   ollama pull qwen2.5:3b
   ollama serve
   ```
2. Open Settings in the website and select **Local Ollama AI**, then use `http://localhost:11434`.
3. Browser CORS may block requests. Configure Ollama's `OLLAMA_ORIGINS` for the exact trusted origin according to Ollama's official documentation.
4. On a hosted site, `localhost` refers to each visitor's own device. Never expose Ollama openly to the public internet; a remote deployment needs a secured backend proxy, authentication, rate limits, and HTTPS.

## Important limitations and privacy
- The free translation endpoint has usage limits and no production SLA. Do not submit passwords, private chats, or sensitive data.
- Roman Urdu is transliteration; the free service may return Urdu script. Local model output can also be imperfect.
- Free-mode chat is only a limited helper; real AI chat requires a reachable Ollama instance.
- Translation history is saved in browser localStorage on that device.
- This starter does not automatically read WhatsApp/Instagram screens.

## Android APK — next phase
A separate native Android project is still needed for a true APK. Recommended features:
- `ACTION_SEND` intent filter for `text/plain` so a user can choose Share → Muhammad Afnan AI from another app.
- `ACTION_PROCESS_TEXT` for apps that support selected-text actions.
- Call a protected backend or translation provider; never hardcode secret API keys in the APK.
- Optional floating bubble requires `SYSTEM_ALERT_WINDOW` and user approval in Android Settings. Overlay permission alone does not grant access to read arbitrary screen text; use explicit Share/Process Text input.
- In Android Studio, build via **Build → Build Bundle(s) / APK(s) → Build APK(s)** and test on a real device.

Example intent filters:
```xml
<activity android:name=".ShareReceiverActivity" android:exported="true">
  <intent-filter>
    <action android:name="android.intent.action.SEND" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="text/plain" />
  </intent-filter>
  <intent-filter>
    <action android:name="android.intent.action.PROCESS_TEXT" />
    <category android:name="android.intent.category.DEFAULT" />
    <data android:mimeType="text/plain" />
  </intent-filter>
</activity>
```
