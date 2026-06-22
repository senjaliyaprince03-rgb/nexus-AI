import os

css_append = """
/* Custom Themes */
/* Olivia Rodrigo Theme */
[data-theme="olivia-rodrigo"] {
  --bg-primary: #fdfaeb;
  --bg-secondary: #f3e8ff;
  --bg-card: #ffffff;
  --text-primary: #4c1d95;
  --text-secondary: #7c3aed;
  --text-muted: #a78bfa;
  --accent-coral: #d946ef;
  --accent-green: #10b981;
  --accent-blue: #8b5cf6;
  --landing-bg: #fdfaeb;
  --landing-bg-muted: #f3e8ff;
}

/* Backrooms Theme */
[data-theme="backrooms"] {
  --bg-primary: #fef08a;
  --bg-secondary: #fde047;
  --bg-card: #fef9c3;
  --text-primary: #713f12;
  --text-secondary: #854d0e;
  --text-muted: #ca8a04;
  --accent-coral: #ea580c;
  --accent-green: #65a30d;
  --accent-blue: #0284c7;
  --landing-bg: #fef08a;
  --landing-bg-muted: #fde047;
}

/* Happy Graduation Theme */
[data-theme="happy-graduation"] {
  --bg-primary: #eff6ff;
  --bg-secondary: #dbeafe;
  --bg-card: #ffffff;
  --text-primary: #1e3a8a;
  --text-secondary: #1d4ed8;
  --text-muted: #60a5fa;
  --accent-coral: #fbbf24;
  --accent-green: #34d399;
  --accent-blue: #3b82f6;
  --landing-bg: #eff6ff;
  --landing-bg-muted: #dbeafe;
}

/* Deli Boys Theme */
[data-theme="deli-boys"] {
  --bg-primary: #fef2f2;
  --bg-secondary: #fee2e2;
  --bg-card: #ffffff;
  --text-primary: #7f1d1d;
  --text-secondary: #b91c1c;
  --text-muted: #f87171;
  --accent-coral: #ef4444;
  --accent-green: #10b981;
  --accent-blue: #3b82f6;
  --landing-bg: #fef2f2;
  --landing-bg-muted: #fee2e2;
}

/* Maluma Theme */
[data-theme="maluma"] {
  --bg-primary: #f0fdfa;
  --bg-secondary: #ccfbf1;
  --bg-card: #ffffff;
  --text-primary: #115e59;
  --text-secondary: #0f766e;
  --text-muted: #2dd4bf;
  --accent-coral: #ec4899;
  --accent-green: #14b8a6;
  --accent-blue: #06b6d4;
  --landing-bg: #f0fdfa;
  --landing-bg-muted: #ccfbf1;
}

/* The Mandalorian & Grogu Theme */
[data-theme="mandalorian-grogu"] {
  --bg-primary: #e5e7eb;
  --bg-secondary: #d1d5db;
  --bg-card: #f3f4f6;
  --text-primary: #1f2937;
  --text-secondary: #374151;
  --text-muted: #6b7280;
  --accent-coral: #f59e0b;
  --accent-green: #22c55e;
  --accent-blue: #64748b;
  --landing-bg: #e5e7eb;
  --landing-bg-muted: #d1d5db;
}

/* Mot Theme */
[data-theme="mot"] {
  --bg-primary: #171717;
  --bg-secondary: #262626;
  --bg-card: #1f1f1f;
  --text-primary: #f5f5f5;
  --text-secondary: #d4d4d4;
  --text-muted: #a3a3a3;
  --accent-coral: #dc2626;
  --accent-green: #16a34a;
  --accent-blue: #2563eb;
  --landing-bg: #171717;
  --landing-bg-muted: #262626;
}
"""

with open(r'c:\Users\Prince\Downloads\NexusAi\nexusai\frontend\src\app\globals.css', 'a', encoding='utf-8') as f:
    f.write(css_append)
