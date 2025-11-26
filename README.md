# ARC Raiders Loadout Planner

A React-based web application for planning loadouts in **ARC Raiders**. It helps players calculate total loadout costs, weight, and visualize crafting requirements using community-sourced data.

## Features

- **Item Archive**: Browse all game items (Weapons, Ammo, Armor, Gadgets) sourced directly from GitHub JSON data.
- **Loadout Builder**: Drag-and-drop interface to configure weapons, attachments, shields, and backpacks.
- **Stats Dashboard**: Real-time calculation of total currency value and weight.
- **Crafting Trees**: Recursive breakdown of crafting recipes, including handling of upgrade costs (e.g., Anvil II requiring Anvil I).
- **Loot Sourcing**: Automatically identifies which recyclable items ("junk") can be scavenged to provide the raw materials needed for your loadout.

## Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

## Local Development

1.  **Install Dependencies**
    ```bash
    npm install
    ```
    *Note: Ensure you have `react`, `react-dom`, `lucide-react`, `vite`, `typescript` and `@types/react` in your `package.json`.*

2.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open your browser to the local URL provided (usually `http://localhost:5173`).

## Building for Production

To create a production-ready build:

```bash
npm run build
```

This will generate a `dist` folder containing the compiled assets.

## Deployment on Vercel

This project is optimized for deployment on Vercel using Vite.

### **Fixing "Blank Page" on Build**
If you see a blank page after deploying, ensure your `index.html` contains the following script tag in the `<body>`:
```html
<script type="module" src="/index.tsx"></script>
```
*This has already been configured in the provided `index.html`.*

### **Steps to Deploy**

1.  Push your code to a Git repository (GitHub, GitLab, or Bitbucket).
2.  Log in to [Vercel](https://vercel.com/) and click **"Add New..."** > **"Project"**.
3.  Import your repository.
4.  **Framework Preset**: Vercel should automatically detect **Vite**. If not, select **Vite** from the dropdown.
5.  **Root Directory**: Keep as `./` (unless you moved files into a subfolder).
6.  Click **Deploy**.

## Data Source

Item data is fetched dynamically from the [RaidTheory/arcraiders-data](https://github.com/RaidTheory/arcraiders-data) repository. If the API rate limit is reached, the app gracefully falls back to a limited set of mock data.
