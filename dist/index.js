import { jsxs, Fragment, jsx } from "data:text/javascript,export const jsx=window.__SHIPSTUDIO_REACT__.createElement;export const jsxs=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;";
import { useState, useEffect, useCallback } from "data:text/javascript,export default window.__SHIPSTUDIO_REACT__;export const useState=window.__SHIPSTUDIO_REACT__.useState;export const useEffect=window.__SHIPSTUDIO_REACT__.useEffect;export const useCallback=window.__SHIPSTUDIO_REACT__.useCallback;export const useMemo=window.__SHIPSTUDIO_REACT__.useMemo;export const useRef=window.__SHIPSTUDIO_REACT__.useRef;export const useContext=window.__SHIPSTUDIO_REACT__.useContext;export const createElement=window.__SHIPSTUDIO_REACT__.createElement;export const Fragment=window.__SHIPSTUDIO_REACT__.Fragment;";
const _w = window;
function usePluginContext() {
  const React = _w.__SHIPSTUDIO_REACT__;
  const CtxRef = _w.__SHIPSTUDIO_PLUGIN_CONTEXT_REF__;
  if (CtxRef && (React == null ? void 0 : React.useContext)) {
    const ctx = React.useContext(CtxRef);
    if (ctx) return ctx;
  }
  throw new Error("Plugin context not available.");
}
function useProject() {
  return usePluginContext().project;
}
function useShell() {
  return usePluginContext().shell;
}
function useToast() {
  return usePluginContext().actions.showToast;
}
function usePluginStorage() {
  return usePluginContext().storage;
}
function useAppActions() {
  return usePluginContext().actions;
}
function useTheme() {
  return usePluginContext().theme;
}
const STYLE_ID = "my-plugin-styles";
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
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = pluginCSS;
    document.head.appendChild(style);
    return () => {
      var _a;
      (_a = document.getElementById(STYLE_ID)) == null ? void 0 : _a.remove();
    };
  }, []);
}
function PluginModal({ onClose }) {
  const project = useProject();
  const shell = useShell();
  const showToast = useToast();
  const storage = usePluginStorage();
  const actions = useAppActions();
  const theme = useTheme();
  const ctx = usePluginContext();
  const [gitLog, setGitLog] = useState(null);
  const [loadingLog, setLoadingLog] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [storageLoaded, setStorageLoaded] = useState(false);
  useEffect(() => {
    storage.read().then((data) => {
      setClickCount(typeof data.clickCount === "number" ? data.clickCount : 0);
      setStorageLoaded(true);
    });
  }, []);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  const handleRunGitLog = useCallback(async () => {
    setLoadingLog(true);
    try {
      const result = await shell.exec("git", ["log", "--oneline", "-5"]);
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
    showToast(`Count saved: ${next}`, "success");
  }, [clickCount, storage, showToast]);
  const handleRefreshGit = useCallback(() => {
    actions.refreshGitStatus();
    showToast("Git status refreshed", "success");
  }, [actions, showToast]);
  return /* @__PURE__ */ jsx("div", { className: "my-plugin-modal-overlay", onClick: onClose, children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: "my-plugin-modal",
      style: { background: theme.bgPrimary, color: theme.textPrimary, border: `1px solid ${theme.border}` },
      onClick: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "my-plugin-modal-header", style: { borderBottom: `1px solid ${theme.border}` }, children: [
          /* @__PURE__ */ jsx("span", { children: "My Plugin" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "my-plugin-btn",
              onClick: onClose,
              style: { background: theme.bgTertiary, color: theme.textSecondary },
              children: "Close"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "my-plugin-modal-body", children: [
          /* @__PURE__ */ jsxs("div", { className: "my-plugin-section", children: [
            /* @__PURE__ */ jsx("div", { className: "my-plugin-section-title", style: { color: theme.textMuted }, children: "Plugin Info" }),
            /* @__PURE__ */ jsxs("div", { className: "my-plugin-info-row", children: [
              /* @__PURE__ */ jsx("span", { style: { color: theme.textSecondary }, children: "Plugin ID" }),
              /* @__PURE__ */ jsx("span", { style: { fontFamily: "monospace" }, children: ctx.pluginId })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "my-plugin-section", children: [
            /* @__PURE__ */ jsx("div", { className: "my-plugin-section-title", style: { color: theme.textMuted }, children: "Project" }),
            project ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: "my-plugin-info-row", children: [
                /* @__PURE__ */ jsx("span", { style: { color: theme.textSecondary }, children: "Name" }),
                /* @__PURE__ */ jsx("span", { children: project.name })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "my-plugin-info-row", children: [
                /* @__PURE__ */ jsx("span", { style: { color: theme.textSecondary }, children: "Branch" }),
                /* @__PURE__ */ jsx("span", { style: { color: theme.accent }, children: project.currentBranch })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "my-plugin-info-row", children: [
                /* @__PURE__ */ jsx("span", { style: { color: theme.textSecondary }, children: "Uncommitted changes" }),
                /* @__PURE__ */ jsx("span", { style: { color: project.hasUncommittedChanges ? theme.error : theme.success }, children: project.hasUncommittedChanges ? "Yes" : "No" })
              ] })
            ] }) : /* @__PURE__ */ jsx("div", { style: { color: theme.textMuted, fontSize: 12 }, children: "No project open" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "my-plugin-section", children: [
            /* @__PURE__ */ jsx("div", { className: "my-plugin-section-title", style: { color: theme.textMuted }, children: "Shell Command" }),
            /* @__PURE__ */ jsx(
              "button",
              {
                className: "my-plugin-btn",
                onClick: handleRunGitLog,
                disabled: loadingLog,
                style: { background: theme.action, color: theme.actionText },
                children: loadingLog ? "Running..." : "Run git log --oneline -5"
              }
            ),
            gitLog !== null && /* @__PURE__ */ jsx("pre", { className: "my-plugin-pre", style: { background: theme.bgTertiary, color: theme.textPrimary, marginTop: 8 }, children: gitLog })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "my-plugin-section", children: [
            /* @__PURE__ */ jsx("div", { className: "my-plugin-section-title", style: { color: theme.textMuted }, children: "Persistent Storage" }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: "my-plugin-btn",
                  onClick: handleIncrement,
                  disabled: !storageLoaded,
                  style: { background: theme.action, color: theme.actionText },
                  children: "Increment Counter"
                }
              ),
              /* @__PURE__ */ jsxs("span", { style: { fontFamily: "monospace", fontSize: 13 }, children: [
                "Count: ",
                storageLoaded ? clickCount : "..."
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "my-plugin-section", children: [
            /* @__PURE__ */ jsx("div", { className: "my-plugin-section-title", style: { color: theme.textMuted }, children: "App Actions" }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: "my-plugin-btn",
                  onClick: handleRefreshGit,
                  style: { background: theme.bgTertiary, color: theme.textPrimary },
                  children: "Refresh Git Status"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  className: "my-plugin-btn",
                  onClick: () => actions.openUrl("https://github.com/ship-studio"),
                  style: { background: theme.bgTertiary, color: theme.textPrimary },
                  children: "Open GitHub"
                }
              )
            ] })
          ] })
        ] })
      ]
    }
  ) });
}
function ToolbarButton() {
  const [modalOpen, setModalOpen] = useState(false);
  const showToast = useToast();
  useInjectStyles();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setModalOpen(true),
        onContextMenu: (e) => {
          e.preventDefault();
          showToast("Right-clicked the plugin button!", "success");
        },
        title: "My Plugin",
        className: "education-button",
        children: /* @__PURE__ */ jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ jsx("path", { d: "M12 3v18" }),
          /* @__PURE__ */ jsx("path", { d: "M5 10l7-7 7 7" })
        ] })
      }
    ),
    modalOpen && /* @__PURE__ */ jsx(PluginModal, { onClose: () => setModalOpen(false) })
  ] });
}
const name = "My Plugin";
const slots = {
  toolbar: ToolbarButton
};
function onActivate() {
  console.log("[my-plugin] Plugin activated");
}
function onDeactivate() {
  console.log("[my-plugin] Plugin deactivated");
}
export {
  name,
  onActivate,
  onDeactivate,
  slots
};
