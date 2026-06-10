# Davenport Wardrobe — MVP

A smarter way for men to dress.

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for production
```bash
npm run build
npm start
```

## Deploy to Vercel (recommended)
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Vercel auto-detects Next.js — just click Deploy

## Project Structure
```
src/
  app/
    layout.js        # Root layout, Google Fonts
    page.js          # Entry point
    globals.css      # Base styles + marquee animation
  components/
    DavenportApp.jsx # Full application (single file)
```

## Tech Stack
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Google Fonts: Cormorant Garamond + Outfit
