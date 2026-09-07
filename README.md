# MooTracker Landing Page & Command Center

## Project Overview
This landing page and interactive command center replicates the exact UI/UX design from the Replit application ([Mastitis-Early-Warning](https://b03689c3-bc24-4811-8d51-483cb2c4208f-00-iptztbrat8aa.pike.replit.dev/)) and integrates the Figma mobile app design system ([MooTracker Mobile App Design](https://www.figma.com/make/TEwg9UH9OtGABvCOR3kszj/MooTracker-Mobile-App-Design?p=f&t=m2I9Uw1O3PQlXKM1-0)).

---

## 🎨 Design & Visual Language

### 1. Typography & Aesthetic
- **Display Serif Font:** Fraunces (Warm, authoritative editorial serif)
- **Body Sans:** DM Sans (Crisp, clean agro-industrial sans-serif)
- **Monospace Code/Data:** IBM Plex Mono (Field telemetry and metrics)

### 2. Warm Agro-Earth Palette
| Token | Role | Hex / HSL |
|---|---|---|
| `--primary` | Forest Emerald (Headers, Active badges) | `hsl(160 31% 22%)` / `#27483e` |
| `--secondary` | Amber Gold (Orbit core, Highlight badges) | `hsl(37 85% 49%)` / `#e79813` |
| `--accent` | Terracotta Rust (Urgent warnings & feature card) | `hsl(18 57% 42%)` / `#a8502f` |
| `--background` | Warm Cream/Sand (Background canvas) | `hsl(40 37% 94%)` / `#f7f4ec` |
| `--card` | Crisp White Card (Elevated surface) | `hsl(42 40% 97%)` / `#fcfbf8` |

---

## 🚀 Key Sections & Features

1. **Header & Navigation:**
   - Brand mark with Waves icon and dual-line typography (`Mastitis Early Warning` / `herd intelligence / भारत`).
   - Sticky top navigation (`How it reads`, `Command center`, `Field principles`).
   - Live bilingual toggle (**EN** / **हिं**) dynamically switching all page text between English and Hindi.
   - Quick "Open demo" button taking users straight to the Command Center.

2. **Hero Section:**
   - Kicker with pulsing golden dot indicator: `FIELD INTELLIGENCE FOR HEALTHIER HERDS`.
   - Title: *"Notice the change before the udder does."*
   - CTA group with *"See the command center"* (with diagonal arrow) and *"How it reads the herd"*.
   - Signal Orbit illustration featuring converging animated telemetry paths, floating tags (`temperature`, `milk pattern`, `movement`, `context`), and central pulsing `7–14 day window` core.

3. **01 / The Signal Field (`#how-it-works`):**
   - 4-column signal strip exploring **Milk pattern**, **Movement**, **Temperature**, and **Farm context**.

4. **02 / From Noise to Action (Forest Emerald Story Band):**
   - 3-step timeline: `01 — notice` (Signals converge), `02 — explain` (Risk surfaces early), `03 — respond` (Teams choose the next step).

5. **03 / Live Prototype Command Center (`#dashboard`):**
   - **Farm Console Sidebar:** Overview, Active Alerts counter, Signal health, Field guide, and Demo farm card.
   - **Toolbar:** Real-time IST clock, live status indicator, and risk filter dropdown (*All, Elevated, Watch, Low*).
   - **Summary Stats Cards:** Animals tracked (48), Needs attention (02), Watch (06), Last sync (04m).
   - **Herd Animals List:** Searchable & filterable cattle list (Ganga, Kaveri, Moti, Narmada + dataset entries).
   - **Interactive Detail Panel:** Dynamic risk score gauge (0-100), contributing physiological signals, and *"Next sensible step"* recommendations.
   - **Alerts Stream:** Active alert notifications with one-click *"Acknowledge"* action.
   - **Figma Integration Bar:** Direct button linking to Figma Make URL and an in-page interactive Mobile App Simulator modal.

6. **04 / Built for the Field (`#field-principles`):**
   - Principles cards: *Explain before you escalate* (Terracotta hero card), *Made for prevention*, *One herd, many hands*.

---

## 💻 How to Run Locally

```bash
# Start the local server
node server.js
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.
