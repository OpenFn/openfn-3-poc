import type { Monaco } from "@monaco-editor/react";

/**
 * The one Monaco theme, "default", and the log language whose `logSource`
 * token it styles. Exported so Lightning's own editors use it too: change a
 * colour here and every editor and viewer follows.
 */
// Hex, not tokens: Monaco paints its own canvas and only takes hex strings.
export function setUpMonaco(monaco: Monaco) {
  monaco.editor.defineTheme("default", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "logSource", foreground: "#CBD5E1", fontStyle: "italic" },
      // vs-dark's string orange and type teal (YAML keys) are too dark on this
      // background, and on the highlighted line, for AA contrast.
      { token: "string", foreground: "#F0C4A8" },
      { token: "string.value.json", foreground: "#F0C4A8" },
      { token: "type", foreground: "#5EEAD4" },
    ],
    colors: {
      "editor.foreground": "#E2E8F0",
      "editorLineNumber.foreground": "#CBD5E1",
      "editor.background": "#334155",
      "editor.lineHighlightBackground": "#475569",
      "editor.selectionBackground": "#4f5b66",
      "editorCursor.foreground": "#c0c5ce",
      "editorWhitespace.foreground": "#65737e",
      "editorIndentGuide.background": "#65737F",
      "editorIndentGuide.activeBackground": "#FBC95A",
    },
  });
  if (!monaco.languages.getLanguages().some((l) => l.id === "openFnLogs")) {
    monaco.languages.register({ id: "openFnLogs" });
    monaco.languages.setMonarchTokensProvider("openFnLogs", {
      tokenizer: { root: [[/^([A-Z/]{2,4})/, "logSource"]] },
    });
  }
}
