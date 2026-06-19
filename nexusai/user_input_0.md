<USER_REQUEST>
You are a world-class frontend engineer and UI/UX designer specializing in 
award-winning web experiences. I have a NexusAI project (Next.js 14 + 
FastAPI) and I need you to completely redesign the entire frontend to be 
a stunning, 100x better website with professional animations, 3D effects, 
and scroll-driven interactions — the kind of website that wins design awards.

═══════════════════════════════════════════════════════════════════════════
DESIGN VISION
═══════════════════════════════════════════════════════════════════════════

Overall aesthetic: Dark, premium, futuristic AI product
Color palette:
  - Background:     #020617 (near black)
  - Primary:        #f59e0b (amber gold)
  - Secondary:      #8b5cf6 (violet purple)  
  - Accent:         #06b6d4 (cyan)
  - Surface:        #0f172a (dark navy)
  - Border:         rgba(255,255,255,0.08)
  - Text primary:   #f1f5f9
  - Text secondary: #94a3b8

Typography:
  - Headings: Syne (bold, futuristic)
  - Body:     DM Sans (clean, readable)
  - Mono:     DM Mono (code/data)

Design inspiration: Linear.app + Vercel + Stripe + Lusion.co

═══════════════════════════════════════════════════════════════════════════
TASK 1 — INSTALL ANIMATION LIBRARIES
═══════════════════════════════════════════════════════════════════════════

Add these to frontend/package.json dependencies and run npm install:

```json
"framer-motion": "^11.0.0",
"@react-three/fiber": "^8.15.0
<truncated 37977 bytes>
════════════════════════════
IMPORTANT RULES
═══════════════════════════════════════════════════════════════════════════

- Every animation must be smooth (60fps) — use transform and opacity only,
  never animate width, height, or margin directly
- All Three.js / Canvas code must be in "use client" components only
- Wrap Canvas in <Suspense fallback={null}> always
- All scroll animations use react-intersection-observer with triggerOnce: true
  so they only play once (not on scroll back up)
- Keep dark background #020617 everywhere — never white or light gray
- Amber (#f59e0b) is the primary accent — use consistently
- Do all 9 tasks in order and confirm each one is done

The user wants me to create a stunning 100x better website for NexusAI with:
Down scrolling animations
3D website animations throughout
Proper, complete website

make full 3d animations working website.

and website is not work means 
PowerShell 7.6.2
PS C:\Users\Prince\Downloads\NexusAi> npm run dev

> dev
> npm --prefix nexusai/frontend run dev


> nexusai-frontend@0.1.0 dev
> next dev

  ▲ Next.js 14.2.4
  - Local:        http://localhost:3000

 ✓ Starting...
 ✓ Ready in 3.8s
 ○ Compiling / ...
 ✓ Compiled / in 10.3s (2670 modules)
 GET / 200 in 11908ms
 ✓ Compiled in 1871ms (1341 modules)
 ○ Compiling /auth/login ...
 ✓ Compiled /auth/login in 1722ms (2681 modules)
this is not go to next step of the login so fix this. 
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-05-25T03:18:12+05:30.
</ADDITIONAL_METADATA>
<USER_SETTINGS_CHANGE>
The user changed setting `Model Selection` from None to Gemini 3.5 Flash (Medium). No need to comment on this change if the user doesn't ask about it. If reporting what model you are, please use a human readable name instead of the exact string.
</USER_SETTINGS_CHANGE>