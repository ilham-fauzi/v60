# ☕ BrewMaster AI: Premium Coffee Assistant

BrewMaster AI is a state-of-the-art web application designed for coffee enthusiasts who demand precision and insight in every cup. It combines hardware telemetry, sleek modern design, and AI-powered intelligence to elevate your daily brewing ritual.

---

## 🚀 Technology Stack

BrewMaster AI is built with a modern, high-performance stack:

- **Core Framework**: [Next.js 16](https://nextjs.org/) (App Router) for a seamless, server-side rendered experience.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for robust, type-safe development.
- **Database**: [SQLite](https://sqlite.org/) managed by [Prisma 7.0](https://www.prisma.io/) (using Driver Adapters) for persistent, local-first data storage.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) for lightweight and reactive application state.
- **Design System**: 
    - Custom **Cyber-Barista** Design System (Vanilla CSS).
    - [Framer Motion](https://www.framer.com/motion/) for fluid, high-fidelity animations.
    - [Lucide React](https://lucide.dev/) for precise, minimalist iconography.
- **Visualizations**: [Recharts](https://recharts.org/) for interactive radar flavor profiles and telemetry charts.
- **AI Intelligence**: [Google Gemini API](https://ai.google.dev/) for generating brewing insights and aroma optimizations.
- **Hardware Integration**: Web Bluetooth API for connecting with digital specialty scales (Acaia, Timemore, etc.).

---

## 🌊 Application Flow

BrewMaster AI follows a logical, high-performance workflow designed to minimize friction during the brewing process:

### 1. The Digital Library (Recipe Management)
- **Discover**: Browse through system-curated master presets (V60, AeroPress, etc.).
- **Create**: Design custom formulations with precise ratios, grind sizes, and temperature profiles.
- **Sync**: All recipes are synchronized with the local SQLite database for offline-ready persistence.

### 2. The Brew Dashboard (Real-time Execution)
- **Telemetry**: Real-time weight and flow-rate data from connected hardware scales.
- **Extraction Sequence**: A visual, stage-by-stage guide showing progress bars and target weights.
- **Focus Mode**: A minimalist, high-visibility UI optimized for deep focus during the pour.

### 3. Sensory Feedback & Journaling
- **Capture**: After every brew, record your sensory data (Aroma, Sweetness, Aciditiy, etc.) and personal notes.
- **History**: View your persistent "Dial-In Journal" to track how your recipes evolve over time.

### 4. AI Optimization
- **Insights**: The AI engine analyzes your sensory feedback and suggests adjustments to grind size, water temperature, or pouring technique for the next cup.

---

## 🛠️ Quick Start

### 1. Prerequisites
- Node.js >= 18.0.0
- A Web Bluetooth compatible browser (for hardware scales)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-repo/brewmaster-ai.git
cd brewmaster-ai

# Install dependencies
npm install --legacy-peer-deps
```

### 3. Database Setup
```bash
# Initialize the SQLite database and run migrations
npx prisma migrate dev --name init

# Seed the database with master recipes
npx prisma db seed
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start your brewing journey.

---

## 📜 License
This project is licensed under the MIT License.
