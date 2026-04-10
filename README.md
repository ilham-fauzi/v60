# ☕ V60: Premium Coffee Assistant

V60 is a state-of-the-art web application designed for coffee enthusiasts who demand precision and insight in every cup. It combines high-fidelity telemetry, a hybrid local-first architecture, and a revolutionary stateless sharing engine to elevate your brewing ritual.

---

## 🚀 Technology Stack

V60 is built with a cutting-edge technical stack optimized for performance and portability:

- **Core Framework**: [Next.js 16](https://nextjs.org/) (App Router) for a seamless, sub-second response experience.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for robust, type-safe development.
- **Architecture**: **Hybrid Local-First**
    - Browser-side persistence via **Zustand 5** (localStorage) for offline-ready workflows.
    - Server-side synchronization using **SQLite** managed by **Prisma 7.0**.
- **Sharing Engine**: **Stateless Protocol** using Base64 URL compression for zero-database recipe sharing.
- **Design System**: 
    - Custom **Cyber-Barista** Design System (Vanilla CSS + Tailwind 4).
    - [Framer Motion](https://www.framer.com/motion/) for fluid, premium animations.
    - [Lucide React](https://lucide.dev/) for precise, minimalist iconography.
- **Hardware Integration**: Web Bluetooth API for connecting with professional digital scales (Acaia, Timemore, etc.).
- **Visualizations**: [Recharts](https://recharts.org/) for real-time telemetry and extraction analysis.

---

## 🌊 Application Flow (V2)

The application follows a logical, high-performance workflow designed to minimize friction during the brewing process:

### 1. The Kinetic Dashboard
- **Telemetry Focused**: Real-time weight and flow-rate data from connected hardware scales.
- **Formula Database**: A quick-access side panel for browsing and searching all available recipes (Presets & Local).
- **One-Click Activation**: Instantly switch between extraction profiles directly from the sidebar.
- **Focus Mode**: A minimalist, high-visibility UI optimized for deep focus during the pour.

### 2. Stateless Recipe Sharing
- **Zero-DB Sharing**: Generate a unique, time-hashed link that encodes the entire recipe data. 
- **Universal Portability**: Share your formulas anywhere (WhatsApp, Discord, etc.) without requiring a server account.
- **Shared Bridge**: Incoming shared links are automatically decoded and can be instantly saved to your local library.

### 3. Local-First Library
- **Offline Persistence**: Your custom recipes are stored in your browser's local storage.
- **Hybrid Sync**: Official presets are synced from the master database to your local library.
- **Cloud Readiness**: (Architecture ready for account-based sync in future updates).

### 4. Hardware Interaction
- **Precision Extraction**: Stage-by-stage guide with progress bars and dynamic target weights for complex multi-pour recipes.
- **Dual Telemetry**: Monitor weight and flow rate simultaneously for "Dialing-In" perfection.

---

## 🛠️ Quick Start

### 1. Prerequisites
- Node.js >= 18.0.0
- A Web Bluetooth compatible browser (Chrome/Edge recommended for scale connectivity)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-repo/v60.git
cd v60

# Install dependencies
npm install --legacy-peer-deps
```

### 3. Database Setup
```bash
# Initialize the SQLite database and run migrations
npx prisma migrate dev --name init

# Seed the database with master presets
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
