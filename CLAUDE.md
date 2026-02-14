# Ship Studio Plugin Development Guide

Everything you need to build a Ship Studio plugin from scratch.

## 1. Overview

Ship Studio plugins are **React components** that render inside the host app's UI. They share the host's React instance (no bundling React) and access app data through a context API.

**How plugins are loaded:**
1. The host reads `dist/index.js` from the plugin directory
2. It creates a Blob URL from the source and dynamically imports it
3. The module's exported `slots` components are rendered in the corresponding UI locations
4. Each plugin gets its own React Context with project data, shell access, storage, etc.

**Lifecycle:** install/link → load JS → `onActivate()` → render slot components → `onDeactivate()` → unload

## 2. Manifest Reference (`plugin.json`)

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "0.1.0",
  "description": "What the plugin does",
  "slots": ["toolbar"],
  "author": "Your Name",
  "repository": "https://github.com/you/your-plugin",
  "min_app_version": "0.3.53",
  "icon": "",
  "required_commands": [],
  "api_version": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | yes | Unique identifier (filesystem-safe, e.g. `my-plugin`) |
| `name` | string | yes | Display name shown in Plugin Manager |
| `version` | string | yes | Semver version (e.g. `0.1.0`) |
| `description` | string | yes | Short description |
| `slots` | string[] | yes | UI slots to render in. Currently only `"toolbar"` is available |
| `author` | string | no | Author name |
| `repository` | string | no | GitHub repo URL (used for installing from GitHub) |
| `min_app_version` | string | no | Minimum Ship Studio version required (semver) |
| `icon` | string | no | Path to icon file (relative to plugin root) |
| `required_commands` | string[] | no | Tauri commands the plugin needs to call via `invoke.call()` |
| `api_version` | number | yes | Must be `0` or `1`. Use `1` for new plugins |

## 3. Module Exports

Your `dist/index.js` must export these:

```typescript
// Required: display name
export const name: string = 'My Plugin';

// Required: map of slot name → React component
export const slots: Record<string, React.ComponentType> = {
  toolbar: MyToolbarButton,
};

// Optional: called after the plugin module is loaded
export function onActivate(): void {
  console.log('Plugin activated');
}

// Optional: called before the plugin module is unloaded
export function onDeactivate(): void {
  console.log('Plugin deactivated');
}
```

## 4. Plugin Context API

Every plugin component receives a context with project data, shell access, storage, and more. Access it via the `usePluginContext()` pattern:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _w = window as any;

function usePluginContext(): PluginContextValue {
  const React = _w.__SHIPSTUDIO_REACT__;
  const CtxRef = _w.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__;

  if (CtxRef && React?.useContext) {
    const ctx = React.useContext(CtxRef);
    if (ctx) return ctx;
  }

  throw new Error('Plugin context not available.');
}
```

This is equivalent to the SDK's `usePluginContext()` hook. It uses `React.useContext` with the shared context ref, so each plugin gets its own isolated context even when multiple plugins render simultaneously.

### Full `PluginContextValue` Interface

```typescript
interface PluginContextValue {
  /** This plugin's ID from plugin.json */
  pluginId: string;

  /** Current project data, or null if no project is open */
  project: {
    name: string;               // Project folder name
    path: string;               // Absolute path to project
    currentBranch: string;      // Current git branch
    hasUncommittedChanges: boolean;
  } | null;

  /** App actions the plugin can trigger */
  actions: {
    showToast: (message: string, type?: 'success' | 'error') => void;
    refreshGitStatus: () => void;   // Re-fetch git status in the UI
    refreshBranches: () => void;    // Re-fetch branch list
    focusTerminal: () => void;      // Focus the terminal tab
    openUrl: (url: string) => void; // Open URL in default browser
  };

  /** Execute shell commands in the project directory */
  shell: {
    exec: (
      command: string,
      args: string[],
      options?: { timeout?: number }  // Default: 120000ms (2 minutes)
    ) => Promise<{
      stdout: string;
      stderr: string;
      exit_code: number;
    }>;
  };

  /** Per-plugin, per-project JSON storage */
  storage: {
    read: () => Promise<Record<string, unknown>>;
    write: (data: Record<string, unknown>) => Promise<void>;
  };

  /** Call Tauri commands (must be listed in manifest's required_commands) */
  invoke: {
    call: <T = unknown>(
      command: string,
      args?: Record<string, unknown>
    ) => Promise<T>;
  };

  /** Theme color tokens (CSS variable values) */
  theme: {
    bgPrimary: string;      // Main background
    bgSecondary: string;    // Secondary background (cards, sidebars)
    bgTertiary: string;     // Tertiary background (inputs, code blocks)
    textPrimary: string;    // Primary text color
    textSecondary: string;  // Secondary text color
    textMuted: string;      // Muted/disabled text
    border: string;         // Border color
    accent: string;         // Accent color (links, highlights)
    accentHover: string;    // Accent hover state
    action: string;         // Action button background
    actionHover: string;    // Action button hover
    actionText: string;     // Action button text color
    error: string;          // Error/destructive color
    success: string;        // Success/positive color
  };
}
```

### Convenience Hooks

You can define thin wrappers (same as what the SDK exports):

```typescript
function useProject()       { return usePluginContext().project; }
function useShell()         { return usePluginContext().shell; }
function useToast()         { return usePluginContext().actions.showToast; }
function usePluginStorage() { return usePluginContext().storage; }
function useAppActions()    { return usePluginContext().actions; }
function useTheme()         { return usePluginContext().theme; }
function useInvoke()        { return usePluginContext().invoke; }
```

## 5. Available Tauri Commands (for `invoke.call()`)

To use `invoke.call()`, you must list the commands in your manifest's `required_commands` array. Only these commands are available to plugins:

### Git Read Operations
| Command | Description |
|---------|-------------|
| `check_git_has_changes` | Check if working tree has uncommitted changes |
| `get_changed_files` | List files that have been modified |
| `get_file_diff` | Get diff for a specific file |
| `get_branch_status` | Get ahead/behind status relative to remote |
| `list_branches` | List all local and remote branches |
| `get_current_branch` | Get the current branch name |
| `get_stash_info` | Get stash entries |

### Project Read Operations
| Command | Description |
|---------|-------------|
| `list_projects` | List all Ship Studio projects |
| `list_pages` | List pages/files in the project |
| `read_project_metadata` | Read `.shipstudio/project.json` metadata |
| `get_branch_prefix_preference` | Get configured branch prefix |
| `get_auto_accept_mode` | Get auto-accept mode setting |

### Git Write Operations
| Command | Description |
|---------|-------------|
| `commit_changes` | Create a git commit |
| `create_branch` | Create a new branch |
| `switch_branch` | Switch to a different branch |
| `fetch_all_branches` | Fetch from all remotes |
| `git_pull` | Pull from remote |

### IDE Operations
| Command | Description |
|---------|-------------|
| `check_ide_availability` | Check if VS Code/Cursor is installed |
| `open_in_ide` | Open project in an IDE |
| `open_url_in_browser` | Open a URL in the default browser |

### Plugin Self-Management
| Command | Description |
|---------|-------------|
| `read_plugin_storage` | Read this plugin's storage (prefer `storage.read()`) |
| `write_plugin_storage` | Write this plugin's storage (prefer `storage.write()`) |
| `read_plugin_manifest` | Read this plugin's manifest |

## 6. Build System

The Vite config handles the trickiest part of plugin development: sharing React with the host app.

**Why data: URLs?** Vite's standard `rollupOptions.external` + `output.globals` pattern doesn't work with ES module output. Instead, we alias `react`, `react-dom`, and `react/jsx-runtime` to `data:text/javascript,` URLs that re-export from `window.__SHIPSTUDIO_REACT__` and `window.__SHIPSTUDIO_REACT_DOM__` globals.

**Key settings:**
- `formats: ['es']` — output is an ES module (required for dynamic import)
- `minify: false` — keep source readable for debugging
- `emptyOutDir: true` — clean dist/ on each build

**Commands:**
```bash
npm run build   # Build dist/index.js
npm run dev     # Watch mode — rebuilds on file changes
```

## 7. Development Workflow

1. **Build the plugin:**
   ```bash
   npm run build
   ```

2. **Link in Ship Studio:**
   Open a project → Plugin Manager (puzzle icon in header) → "Link Dev Plugin" → select this folder

3. **Iterate:**
   - Edit `src/index.tsx`
   - Run `npm run build` (or use `npm run dev` for watch mode)
   - In Plugin Manager, click "Reload" on your plugin

4. **Debug:**
   - Open Ship Studio dev tools: `Cmd + Option + I`
   - Console errors from your plugin will appear there
   - `console.log` from your plugin works normally

## 8. Styling Guide

### Theme Tokens (Inline Styles)
Use `useTheme()` for dynamic styling that follows the app's theme:

```tsx
const theme = useTheme();
return <div style={{ background: theme.bgSecondary, color: theme.textPrimary }}>...</div>;
```

### CSS Variables (Stylesheets)
Use CSS variables from the host app in injected stylesheets:

```css
.my-component {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}
```

Available CSS variables: `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border`, `--accent`, `--accent-hover`, `--action`, `--action-hover`, `--action-text`, `--error`, `--success`

### CSS Injection Pattern
Inject styles via `useEffect` and clean up on unmount:

```tsx
const STYLE_ID = 'my-plugin-styles';

function useInjectStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `/* your CSS here */`;
    document.head.appendChild(style);
    return () => { document.getElementById(STYLE_ID)?.remove(); };
  }, []);
}
```

### Toolbar Button Sizing
Use `className="workspace-tab icon-only"` for toolbar buttons to match the host app's sizing:

```tsx
<button className="workspace-tab icon-only" style={{ fontSize: 11, fontWeight: 600, padding: '0 6px', minWidth: 'auto' }}>
  MP
</button>
```

## 9. Patterns & Best Practices

### Always clean up effects
```tsx
useEffect(() => {
  const interval = setInterval(doSomething, 5000);
  return () => clearInterval(interval);
}, []);
```

### Use shell.exec() for CLI operations
```tsx
const shell = useShell();
const result = await shell.exec('git', ['status', '--porcelain']);
// result: { stdout, stderr, exit_code }
```

### Persist state in plugin storage
```tsx
const storage = usePluginStorage();

// Read on mount
useEffect(() => {
  storage.read().then(data => setMyState(data.myKey));
}, []);

// Write on change
await storage.write({ myKey: newValue });
```

### Show user feedback with toasts
```tsx
const showToast = useToast();
showToast('Operation completed!', 'success');
showToast('Something went wrong', 'error');
```

### Modal pattern with Escape to close
```tsx
useEffect(() => {
  const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [onClose]);
```

### Click-outside to close
```tsx
<div className="overlay" onClick={onClose}>
  <div className="modal" onClick={e => e.stopPropagation()}>
    ...
  </div>
</div>
```

## 10. Constraints & Limitations

- **Only `toolbar` slot** is currently available. Plugins render as buttons in the workspace toolbar.
- **No direct filesystem access.** Use `shell.exec` with `cat`, `ls`, etc. to read files.
- **No network requests from plugin code.** Use `shell.exec` with `curl` for HTTP requests.
- **10-second load timeout.** Don't do heavy work at module scope — keep `onActivate` fast.
- **120-second default shell timeout.** Pass `{ timeout: ms }` to `shell.exec` for longer operations.
- **Plugin storage is project-scoped.** Each plugin gets separate storage per project (no global storage).
- **`invoke.call()` is permission-gated.** Only commands listed in `required_commands` will work. All others are rejected.
- **Don't bundle React.** The Vite config externalizes it. Bundling your own copy will break hooks.
- **Keep bundles small.** The JS is loaded as a string over IPC, then imported via Blob URL.
- **Plugin crashes are caught** by error boundaries, but show an ugly "!" indicator in the toolbar. Handle errors gracefully.
