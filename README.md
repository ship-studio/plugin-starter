# Ship Studio Plugin Starter

A ready-to-use template for building [Ship Studio](https://shipstudio.dev) plugins.

Includes a working example plugin that demonstrates the full plugin API: context access, shell commands, Tauri command invocation (`invoke.call`), persistent storage, toast notifications, theme-aware styling, app actions, and modals.

## Quick Start

1. **Create your plugin repo** from this template:

   Click **"Use this template"** above, or from the CLI:

   ```bash
   gh repo create my-plugin --template ship-studio/plugin-starter --clone
   cd my-plugin
   ```

2. **Update `plugin.json`** with your plugin's id, name, and description:

   ```json
   {
     "id": "my-plugin",
     "name": "My Plugin",
     "description": "What your plugin does"
   }
   ```

3. **Install dependencies and build:**

   ```bash
   npm install
   npm run build
   ```

4. **Link in Ship Studio:**

   Open a project → Plugin Manager (puzzle icon) → **Link Dev Plugin** → select this folder

5. **Edit `src/index.tsx`**, rebuild, and click **Reload** in Plugin Manager to see changes.

> **Important:** Ship Studio installs plugins by cloning the repo — it does **not** run `npm install` or `npm run build`. You must commit `dist/index.js` to your repo. Do not add `dist/` to `.gitignore`, or users will get a "Plugin bundle not found" error.

## Development

```bash
npm run build    # Build dist/index.js
npm run dev      # Watch mode — rebuilds on save
```

Open Ship Studio dev tools (`Cmd+Option+I`) to see console output and debug.

## Publishing

After building, **commit `dist/index.js`** before pushing:

```bash
npm run build
git add dist/index.js
git commit -m "Build plugin bundle"
git push
```

Ship Studio clones your repo directly and expects the built bundle to be there. If you skip this step, the plugin won't load.

## Building with AI

This repo includes a comprehensive `CLAUDE.md` with the full plugin API reference. Point Claude Code (or any LLM) at this repo and it can build plugins without any other documentation.

## TypeScript Types

This template inlines all types in `src/index.tsx`. If you prefer importing types from a package:

```bash
npm install -D @shipstudio/plugin-sdk
```

```typescript
import type { PluginContextValue } from '@shipstudio/plugin-sdk';
```

## Learn More

- [`CLAUDE.md`](./CLAUDE.md) — Full plugin API reference (build system, context API, Tauri commands, styling, patterns, CI/CD)
- [`src/index.tsx`](./src/index.tsx) — Example plugin source
