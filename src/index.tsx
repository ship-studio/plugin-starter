/**
 * Ship Studio Plugin Starter
 *
 * A working example that demonstrates every plugin SDK capability.
 * Delete what you don't need and build from here.
 */

import { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Plugin Context — inline the SDK's usePluginContext() pattern so we don't
// need @shipstudio/plugin-sdk as a build dependency.
// ---------------------------------------------------------------------------

interface PluginContextValue {
  pluginId: string;
  project: {
    name: string;
    path: string;
    currentBranch: string;
    hasUncommittedChanges: boolean;
  } | null;
  actions: {
    showToast: (message: string, type?: 'success' | 'error') => void;
    refreshGitStatus: () => void;
    refreshBranches: () => void;
    focusTerminal: () => void;
    openUrl: (url: string) => void;
  };
  shell: {
    exec: (command: string, args: string[], options?: { timeout?: number }) => Promise<{
      stdout: string;
      stderr: string;
      exit_code: number;
    }>;
  };
  storage: {
    read: () => Promise<Record<string, unknown>>;
    write: (data: Record<string, unknown>) => Promise<void>;
  };
  invoke: {
    call: <T = unknown>(command: string, args?: Record<string, unknown>) => Promise<T>;
  };
  theme: {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    accent: string;
    accentHover: string;
    action: string;
    actionHover: string;
    actionText: string;
    error: string;
    success: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _w = window as any;

/**
 * Access the per-plugin context via React.useContext.
 * Equivalent to the SDK's usePluginContext() hook.
 */
function usePluginContext(): PluginContextValue {
  const React = _w.__SHIPSTUDIO_REACT__;
  const CtxRef = _w.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__;

  if (CtxRef && React?.useContext) {
    const ctx = React.useContext(CtxRef) as PluginContextValue | null;
    if (ctx) return ctx;
  }

  throw new Error('Plugin context not available.');
}

// Convenience hooks (same as SDK)
function useProject() { return usePluginContext().project; }
function useShell() { return usePluginContext().shell; }
function useToast() { return usePluginContext().actions.showToast; }
function usePluginStorage() { return usePluginContext().storage; }
function useAppActions() { return usePluginContext().actions; }
function useTheme() { return usePluginContext().theme; }

// ---------------------------------------------------------------------------
// CSS injection helper
// ---------------------------------------------------------------------------

const STYLE_ID = 'my-plugin-styles';

const pluginCSS = `
.my-plugin-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.my-plugin-modal {
  width: 480px;
  max-height: 80vh;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.my-plugin-modal-header {
  padding: 16px 20px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.my-plugin-modal-body {
  padding: 20px;
  overflow-y: auto;
  font-size: 13px;
  line-height: 1.5;
}
.my-plugin-section {
  margin-bottom: 16px;
}
.my-plugin-section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.my-plugin-info-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 12px;
}
.my-plugin-pre {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  line-height: 1.5;
  padding: 12px;
  border-radius: 8px;
  overflow-x: auto;
  white-space: pre;
  max-height: 200px;
  overflow-y: auto;
}
.my-plugin-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: opacity 0.15s;
}
.my-plugin-btn:hover {
  opacity: 0.85;
}
.my-plugin-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;

function useInjectStyles() {
  useEffect(() => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = pluginCSS;
    document.head.appendChild(style);
    return () => {
      document.getElementById(STYLE_ID)?.remove();
    };
  }, []);
}

// ---------------------------------------------------------------------------
// Modal component
// ---------------------------------------------------------------------------

function PluginModal({ onClose }: { onClose: () => void }) {
  const project = useProject();
  const shell = useShell();
  const showToast = useToast();
  const storage = usePluginStorage();
  const actions = useAppActions();
  const theme = useTheme();
  const ctx = usePluginContext();

  const [gitLog, setGitLog] = useState<string | null>(null);
  const [loadingLog, setLoadingLog] = useState(false);
  const [clickCount, setClickCount] = useState<number>(0);
  const [storageLoaded, setStorageLoaded] = useState(false);

  // Load persisted click count on mount
  useEffect(() => {
    storage.read().then((data) => {
      setClickCount(typeof data.clickCount === 'number' ? data.clickCount : 0);
      setStorageLoaded(true);
    });
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleRunGitLog = useCallback(async () => {
    setLoadingLog(true);
    try {
      const result = await shell.exec('git', ['log', '--oneline', '-5']);
      if (result.exit_code === 0) {
        setGitLog(result.stdout);
      } else {
        setGitLog(`Error: ${result.stderr}`);
      }
    } catch (err) {
      setGitLog(`Failed: ${err}`);
    } finally {
      setLoadingLog(false);
    }
  }, [shell]);

  const handleIncrement = useCallback(async () => {
    const next = clickCount + 1;
    setClickCount(next);
    await storage.write({ clickCount: next });
    showToast(`Count saved: ${next}`, 'success');
  }, [clickCount, storage, showToast]);

  const handleRefreshGit = useCallback(() => {
    actions.refreshGitStatus();
    showToast('Git status refreshed', 'success');
  }, [actions, showToast]);

  return (
    <div className="my-plugin-modal-overlay" onClick={onClose}>
      <div
        className="my-plugin-modal"
        style={{ background: theme.bgPrimary, color: theme.textPrimary, border: `1px solid ${theme.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="my-plugin-modal-header" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <span>My Plugin</span>
          <button
            className="my-plugin-btn"
            onClick={onClose}
            style={{ background: theme.bgTertiary, color: theme.textSecondary }}
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="my-plugin-modal-body">
          {/* Plugin Info */}
          <div className="my-plugin-section">
            <div className="my-plugin-section-title" style={{ color: theme.textMuted }}>
              Plugin Info
            </div>
            <div className="my-plugin-info-row">
              <span style={{ color: theme.textSecondary }}>Plugin ID</span>
              <span style={{ fontFamily: 'monospace' }}>{ctx.pluginId}</span>
            </div>
          </div>

          {/* Project Info */}
          <div className="my-plugin-section">
            <div className="my-plugin-section-title" style={{ color: theme.textMuted }}>
              Project
            </div>
            {project ? (
              <>
                <div className="my-plugin-info-row">
                  <span style={{ color: theme.textSecondary }}>Name</span>
                  <span>{project.name}</span>
                </div>
                <div className="my-plugin-info-row">
                  <span style={{ color: theme.textSecondary }}>Branch</span>
                  <span style={{ color: theme.accent }}>{project.currentBranch}</span>
                </div>
                <div className="my-plugin-info-row">
                  <span style={{ color: theme.textSecondary }}>Uncommitted changes</span>
                  <span style={{ color: project.hasUncommittedChanges ? theme.error : theme.success }}>
                    {project.hasUncommittedChanges ? 'Yes' : 'No'}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ color: theme.textMuted, fontSize: 12 }}>No project open</div>
            )}
          </div>

          {/* Shell Demo */}
          <div className="my-plugin-section">
            <div className="my-plugin-section-title" style={{ color: theme.textMuted }}>
              Shell Command
            </div>
            <button
              className="my-plugin-btn"
              onClick={handleRunGitLog}
              disabled={loadingLog}
              style={{ background: theme.action, color: theme.actionText }}
            >
              {loadingLog ? 'Running...' : 'Run git log --oneline -5'}
            </button>
            {gitLog !== null && (
              <pre className="my-plugin-pre" style={{ background: theme.bgTertiary, color: theme.textPrimary, marginTop: 8 }}>
                {gitLog}
              </pre>
            )}
          </div>

          {/* Storage Demo */}
          <div className="my-plugin-section">
            <div className="my-plugin-section-title" style={{ color: theme.textMuted }}>
              Persistent Storage
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="my-plugin-btn"
                onClick={handleIncrement}
                disabled={!storageLoaded}
                style={{ background: theme.action, color: theme.actionText }}
              >
                Increment Counter
              </button>
              <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                Count: {storageLoaded ? clickCount : '...'}
              </span>
            </div>
          </div>

          {/* Actions Demo */}
          <div className="my-plugin-section">
            <div className="my-plugin-section-title" style={{ color: theme.textMuted }}>
              App Actions
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="my-plugin-btn"
                onClick={handleRefreshGit}
                style={{ background: theme.bgTertiary, color: theme.textPrimary }}
              >
                Refresh Git Status
              </button>
              <button
                className="my-plugin-btn"
                onClick={() => actions.openUrl('https://github.com/ship-studio')}
                style={{ background: theme.bgTertiary, color: theme.textPrimary }}
              >
                Open GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toolbar Button (the slot component)
// ---------------------------------------------------------------------------

function ToolbarButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const showToast = useToast();

  useInjectStyles();

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        onContextMenu={(e) => {
          e.preventDefault();
          showToast('Right-clicked the plugin button!', 'success');
        }}
        title="My Plugin"
        className="education-button"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18" /><path d="M5 10l7-7 7 7" />
        </svg>
      </button>
      {modalOpen && <PluginModal onClose={() => setModalOpen(false)} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Module exports (required by Ship Studio plugin loader)
// ---------------------------------------------------------------------------

export const name = 'My Plugin';

export const slots = {
  toolbar: ToolbarButton,
};

export function onActivate() {
  console.log('[my-plugin] Plugin activated');
}

export function onDeactivate() {
  console.log('[my-plugin] Plugin deactivated');
}
