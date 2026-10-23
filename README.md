# Eventura AI

> **Your Vision. Your Budget. Your Perfect Event.**

Eventura AI is a GenAI-powered event-planning assistant that helps you plan weddings, birthdays, and community events with personalised plans, smart budgets, and adaptive recommendations.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Features

| Feature | Description |
|---|---|
| **Smart Budget Breakdown** | AI-generated budget allocations with real-time tracking — every cost clearly labelled as an estimate. |
| **Planning Timeline** | Deadline-driven task lists from first booking to final check. |
| **Vendor Checklist** | Organised vendor categories with status tracking (research → contact → book → confirm). |
| **Personalised Ideas** | Theme suggestions, activity ideas, and creative inspiration tailored to your style. |
| **Risk & Contingency** | Proactive risk assessment with mitigation strategies. |
| **Adaptive Planning** | Change your budget, guest count, or priorities and watch the plan update instantly. |

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Installation

```bash
git clone https://github.com/bharath0757/Eventura-AI.git
cd Eventura-AI
npm install
```

### Environment Variables

Copy the example file and add your API key:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | No* | Google Gemini API key for AI features. The app provides a fully interactive demo fallback when this is not set. |

\*The application is fully functional without an API key using deterministic demo data.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Validation | Zod |
| AI Provider | Google Gemini API (server-side only) |
| Persistence | localStorage (client-side) |
| Deployment | Vercel-ready |

## Architecture

```
src/
├── app/                  # Next.js App Router pages & layouts
│   ├── globals.css       # Global styles & design tokens
│   ├── layout.tsx        # Root layout with fonts & metadata
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # Reusable UI primitives (Button, Card, …)
│   ├── layout/           # Navbar, Footer
│   └── landing/          # Landing page sections
├── lib/
│   ├── constants.ts      # Brand, colour tokens, event categories
│   └── utils.ts          # Shared utility helpers
└── types/
    └── index.ts          # Core TypeScript type definitions
```

### Design Principles

- **UI components are separated from business logic.**
- **Deterministic code handles arithmetic and state** — AI provides contextual recommendations only.
- **API keys are server-side only** — never exposed to the client.
- **Demo fallback is fully interactive** and clearly identified; it is never presented as a live AI response.
- **Estimated costs are always labelled as estimates.**

### Visual Direction

| Token | Colour | Usage |
|---|---|---|
| Primary | `#1e2a4a` (Midnight blue) | Navigation, headings |
| Ivory | `#faf7f2` (Warm ivory) | Backgrounds |
| Coral | `#e8735a` (Coral) | Primary actions, CTAs |
| Emerald | `#2d9f6f` (Emerald green) | Completed tasks, positive budget |
| Lavender | `#b8a9d4` (Soft lavender) | AI insights |

## Deployment

This project is configured for one-click deployment on **Vercel**:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/bharath0757/Eventura-AI)

1. Connect your GitHub repository on Vercel.
2. Set the `GEMINI_API_KEY` environment variable in the Vercel dashboard (optional).
3. Deploy.

## License

This project is built for demonstration and competition purposes.

---

Built with ❤ by the Eventura AI team.
