import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { GraphAppearance, GraphLayoutAppearance } from "../graph/appearance";
import { GRAPH_APPEARANCE_PRESETS, type GraphAppearancePresetId } from "../graph/appearanceCommands";
import type { GraphLayoutMode, GraphTitleFontFamily } from "../graph/types";
import { GRAPH_TITLE_FONT_OPTIONS } from "../graph/types";
import type { AiExecutionMode, AiProvider, AiSettings } from "../ai/types";

type SettingsChapter = "general" | "appearance" | "ai";

interface TopbarProps {
  topbarRef: React.RefObject<HTMLElement>;
  layoutMode: GraphLayoutMode;
  appearance: GraphAppearance;
  showNodeDetail: boolean;
  hideNodeBorders: boolean;
  alignNodeWidthsToMax: boolean;
  status: string;
  fileName: string;
  relativeLinkRootName: string;
  hasGraph: boolean;
  canBack: boolean;
  canUp: boolean;
  canUndo: boolean;
  canRedo: boolean;
  zoomPercent: number;
  canZoomOut: boolean;
  canZoomIn: boolean;
  settingsOpen: boolean;
  consoleSidebarOpen: boolean;
  aiSettings: AiSettings;
  aiBusy: boolean;
  onBack: () => void;
  onUp: () => void;
  onAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onZoomFit: () => void;
  onZoomPercentCommit: (percent: number) => void;
  onSettingsToggle: () => void;
  onConsoleSidebarToggle: () => void;
  onLayoutModeChange: (mode: GraphLayoutMode) => void;
  onLayoutAppearanceChange: <K extends keyof GraphLayoutAppearance>(key: K, value: GraphLayoutAppearance[K]) => void;
  onAppearanceCssVarChange: (key: string, value: string) => void;
  onAppearanceCssChange: (css: string) => void;
  onAppearanceDisplayChange: <K extends keyof GraphAppearance["display"]>(key: K, value: GraphAppearance["display"][K]) => void;
  onAppearancePresetChange: (presetId: GraphAppearancePresetId) => void;
  onAppearanceReset: () => void;
  onAppearanceExport: () => void;
  onAppearanceImportClick: (event: React.MouseEvent<HTMLInputElement>) => void;
  onAppearanceImportChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onNodeDetailToggle: () => void;
  onNodeBordersToggle: () => void;
  onNodeWidthAlignToggle: () => void;
  onFileInputClick: (event: React.MouseEvent<HTMLInputElement>) => void;
  onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFolderInputClick: (event: React.MouseEvent<HTMLInputElement>) => void;
  onFolderInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRelativeLinkRootSelect: () => void;
  onInitializeCanvas: () => void;
  onExport: () => void;
  onSaveJson: () => void;
  onFieldMappingOpen: () => void;
  onAiSettingsChange: (settings: AiSettings) => void;
  onAiConnectionTest: () => Promise<boolean>;
}

export default function Topbar({
  topbarRef,
  layoutMode,
  appearance,
  showNodeDetail,
  hideNodeBorders,
  alignNodeWidthsToMax,
  status,
  fileName,
  relativeLinkRootName,
  hasGraph,
  canBack,
  canUp,
  canUndo,
  canRedo,
  zoomPercent,
  canZoomOut,
  canZoomIn,
  settingsOpen,
  consoleSidebarOpen,
  aiSettings,
  aiBusy,
  onBack,
  onUp,
  onAll,
  onUndo,
  onRedo,
  onZoomOut,
  onZoomIn,
  onZoomFit,
  onZoomPercentCommit,
  onSettingsToggle,
  onConsoleSidebarToggle,
  onLayoutModeChange,
  onLayoutAppearanceChange,
  onAppearanceCssVarChange,
  onAppearanceCssChange,
  onAppearanceDisplayChange,
  onAppearancePresetChange,
  onAppearanceReset,
  onAppearanceExport,
  onAppearanceImportClick,
  onAppearanceImportChange,
  onNodeDetailToggle,
  onNodeBordersToggle,
  onNodeWidthAlignToggle,
  onFileInputClick,
  onFileInputChange,
  onFolderInputClick,
  onFolderInputChange,
  onRelativeLinkRootSelect,
  onInitializeCanvas,
  onExport,
  onSaveJson,
  onFieldMappingOpen,
  onAiSettingsChange,
  onAiConnectionTest,
}: TopbarProps) {
  return (
    <header ref={topbarRef} className="topbar">
      <div className="topbar-brand">
        <h1>DAG Studio</h1>
      </div>
      <div className="topbar-actions">
        <div className="topbar-group nav-controls" aria-label="Graph navigation controls">
          <IconButton id="back-btn" label="Back" disabled={!canBack} onClick={onBack} icon={<ArrowLeftIcon />} />
          <IconButton id="up-btn" label="Up" disabled={!canUp} onClick={onUp} icon={<ArrowUpIcon />} />
          <IconButton id="all-btn" label="Show all roots" disabled={!hasGraph} onClick={onAll} icon={<GraphRootsIcon />} />
        </div>
        <div className="topbar-group zoom-controls" aria-label="Graph zoom controls">
          <IconButton id="zoom-out-btn" label="Zoom out" disabled={!canZoomOut} onClick={onZoomOut} icon={<MinusIcon />} />
          <IconButton id="zoom-in-btn" label="Zoom in" disabled={!canZoomIn} onClick={onZoomIn} icon={<PlusIcon />} />
          <ZoomInput value={zoomPercent} disabled={!hasGraph} onCommit={onZoomPercentCommit} />
          <IconButton id="zoom-fit-btn" label="Fit graph to viewport" disabled={!hasGraph} onClick={onZoomFit} icon={<FitIcon />} />
        </div>
        <div className="topbar-group file-controls" aria-label="Graph file controls">
          <IconButton id="undo-btn" label="Undo" disabled={!canUndo} onClick={onUndo} icon={<UndoIcon />} />
          <IconButton id="redo-btn" label="Redo" disabled={!canRedo} onClick={onRedo} icon={<RedoIcon />} />
          <IconButton id="save-json-btn" label="Save JSON" disabled={!hasGraph} onClick={onSaveJson} icon={<SaveIcon />} className="ghost-btn topbar-icon-btn topbar-save-btn" />
          <div id="floating-controls" className="control-dock">
            <IconButton
              id="settings-btn"
              label="Open controls"
              icon={<SlidersIcon />}
              ariaExpanded={settingsOpen}
              ariaControls="settings-modal"
              onClick={onSettingsToggle}
              className="settings-toggle-btn topbar-icon-btn"
            />
            <SettingsModal
              open={settingsOpen}
              layoutMode={layoutMode}
              appearance={appearance}
              showNodeDetail={showNodeDetail}
              hideNodeBorders={hideNodeBorders}
              alignNodeWidthsToMax={alignNodeWidthsToMax}
              status={status}
              fileName={fileName}
              relativeLinkRootName={relativeLinkRootName}
              hasGraph={hasGraph}
              consoleSidebarOpen={consoleSidebarOpen}
              aiSettings={aiSettings}
              aiBusy={aiBusy}
              onClose={onSettingsToggle}
              onLayoutModeChange={onLayoutModeChange}
              onLayoutAppearanceChange={onLayoutAppearanceChange}
              onAppearanceCssVarChange={onAppearanceCssVarChange}
              onAppearanceCssChange={onAppearanceCssChange}
              onAppearanceDisplayChange={onAppearanceDisplayChange}
              onAppearancePresetChange={onAppearancePresetChange}
              onAppearanceReset={onAppearanceReset}
              onAppearanceExport={onAppearanceExport}
              onAppearanceImportClick={onAppearanceImportClick}
              onAppearanceImportChange={onAppearanceImportChange}
              onNodeDetailToggle={onNodeDetailToggle}
              onNodeBordersToggle={onNodeBordersToggle}
              onNodeWidthAlignToggle={onNodeWidthAlignToggle}
              onConsoleSidebarToggle={onConsoleSidebarToggle}
              onFileInputClick={onFileInputClick}
              onFileInputChange={onFileInputChange}
              onFolderInputClick={onFolderInputClick}
              onFolderInputChange={onFolderInputChange}
              onRelativeLinkRootSelect={onRelativeLinkRootSelect}
              onInitializeCanvas={onInitializeCanvas}
              onExport={onExport}
              onFieldMappingOpen={onFieldMappingOpen}
              onAiSettingsChange={onAiSettingsChange}
              onAiConnectionTest={onAiConnectionTest}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

interface SettingsModalProps {
  open: boolean;
  layoutMode: GraphLayoutMode;
  appearance: GraphAppearance;
  showNodeDetail: boolean;
  hideNodeBorders: boolean;
  alignNodeWidthsToMax: boolean;
  status: string;
  fileName: string;
  relativeLinkRootName: string;
  hasGraph: boolean;
  consoleSidebarOpen: boolean;
  aiSettings: AiSettings;
  aiBusy: boolean;
  onClose: () => void;
  onLayoutModeChange: (mode: GraphLayoutMode) => void;
  onLayoutAppearanceChange: <K extends keyof GraphLayoutAppearance>(key: K, value: GraphLayoutAppearance[K]) => void;
  onAppearanceCssVarChange: (key: string, value: string) => void;
  onAppearanceCssChange: (css: string) => void;
  onAppearanceDisplayChange: <K extends keyof GraphAppearance["display"]>(key: K, value: GraphAppearance["display"][K]) => void;
  onAppearancePresetChange: (presetId: GraphAppearancePresetId) => void;
  onAppearanceReset: () => void;
  onAppearanceExport: () => void;
  onAppearanceImportClick: (event: React.MouseEvent<HTMLInputElement>) => void;
  onAppearanceImportChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onNodeDetailToggle: () => void;
  onNodeBordersToggle: () => void;
  onNodeWidthAlignToggle: () => void;
  onConsoleSidebarToggle: () => void;
  onFileInputClick: (event: React.MouseEvent<HTMLInputElement>) => void;
  onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFolderInputClick: (event: React.MouseEvent<HTMLInputElement>) => void;
  onFolderInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRelativeLinkRootSelect: () => void;
  onInitializeCanvas: () => void;
  onExport: () => void;
  onFieldMappingOpen: () => void;
  onAiSettingsChange: (settings: AiSettings) => void;
  onAiConnectionTest: () => Promise<boolean>;
}

function SettingsModal({
  open,
  layoutMode,
  appearance,
  showNodeDetail,
  hideNodeBorders,
  alignNodeWidthsToMax,
  status,
  fileName,
  relativeLinkRootName,
  hasGraph,
  consoleSidebarOpen,
  aiSettings,
  aiBusy,
  onClose,
  onLayoutModeChange,
  onLayoutAppearanceChange,
  onAppearanceCssVarChange,
  onAppearanceCssChange,
  onAppearanceDisplayChange,
  onAppearancePresetChange,
  onAppearanceReset,
  onAppearanceExport,
  onAppearanceImportClick,
  onAppearanceImportChange,
  onNodeDetailToggle,
  onNodeBordersToggle,
  onNodeWidthAlignToggle,
  onConsoleSidebarToggle,
  onFileInputClick,
  onFileInputChange,
  onFolderInputClick,
  onFolderInputChange,
  onRelativeLinkRootSelect,
  onInitializeCanvas,
  onExport,
  onFieldMappingOpen,
  onAiSettingsChange,
  onAiConnectionTest,
}: SettingsModalProps) {
  const [activeChapter, setActiveChapter] = useState<SettingsChapter>("general");
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const [aiConnectionStatus, setAiConnectionStatus] = useState<AiConnectionStatus>("idle");
  const [appearanceCssDraft, setAppearanceCssDraft] = useState(appearance.css);
  const [cssVarDrafts, setCssVarDrafts] = useState<Record<string, string>>(() => buildCssVarDrafts(appearance));
  const [titleSizeDraft, setTitleSizeDraft] = useState(() => String(parseCssPixelValue(appearance.cssVars["--dag-title-font-size"], 15)));
  const updateAiSetting = <K extends keyof AiSettings>(key: K, value: AiSettings[K]) => {
    onAiSettingsChange({ ...aiSettings, [key]: value });
  };
  const handleAiProviderChange = (provider: AiProvider) => {
    const preset = AI_PROVIDER_PRESETS[provider];
    onAiSettingsChange({
      ...aiSettings,
      provider,
      baseUrl: preset.baseUrl,
      model: preset.model,
      apiKey: provider === "ollama" ? "" : aiSettings.apiKey,
    });
    setProviderMenuOpen(false);
  };
  const selectedProvider = AI_PROVIDER_PRESETS[aiSettings.provider];
  const aiConnectionButtonText = getAiConnectionButtonText(aiConnectionStatus, aiBusy);
  const titleFontFamily = appearance.cssVars["--dag-title-font-family"] || GRAPH_TITLE_FONT_OPTIONS[0].value;
  const titleFontSize = parseCssPixelValue(appearance.cssVars["--dag-title-font-size"], 15);
  const titleFontStyle = appearance.cssVars["--dag-title-font-style"] === "normal" ? "normal" : "italic";
  const titleFontWeight = appearance.cssVars["--dag-title-font-weight"] === "700" ? 700 : 400;

  useEffect(() => {
    setAiConnectionStatus("idle");
  }, [aiSettings.provider, aiSettings.baseUrl, aiSettings.model, aiSettings.apiKey]);

  useEffect(() => {
    setAppearanceCssDraft(appearance.css);
    setCssVarDrafts(buildCssVarDrafts(appearance));
    setTitleSizeDraft(String(titleFontSize));
  }, [appearance, titleFontSize]);

  const handleAiConnectionTestClick = async () => {
    setAiConnectionStatus("testing");
    const ok = await onAiConnectionTest();
    setAiConnectionStatus(ok ? "success" : "error");
  };

  const commitAppearanceCssDraft = () => {
    if (appearanceCssDraft !== appearance.css) {
      onAppearanceCssChange(appearanceCssDraft);
    }
  };

  const commitCssVarDraft = (key: string, value: string) => {
    if ((appearance.cssVars[key] || "") !== value) {
      onAppearanceCssVarChange(key, value);
    }
  };

  const commitTitleSizeDraft = () => {
    const value = `${clampNumberInput(titleSizeDraft, 10, 28, titleFontSize)}px`;
    if (appearance.cssVars["--dag-title-font-size"] !== value) {
      onAppearanceCssVarChange("--dag-title-font-size", value);
    }
    setTitleSizeDraft(String(parseCssPixelValue(value, titleFontSize)));
  };

  if (!open) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="settings-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <section id="settings-modal" className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
        <div className="settings-modal-header">
          <div>
            <p id="settings-modal-title" className="control-label">Settings</p>
          </div>
          <button type="button" className="ghost-btn topbar-icon-btn" title="Close settings" aria-label="Close settings" onClick={onClose}>
            <span className="topbar-icon" aria-hidden="true"><CloseIcon /></span>
          </button>
        </div>

        <div className="settings-modal-body">
          <nav className="settings-tabs" aria-label="Settings sections">
            {SETTINGS_CHAPTERS.map((chapter) => (
              <button
                key={chapter.key}
                type="button"
                className={`settings-tab${activeChapter === chapter.key ? " is-active" : ""}`}
                aria-pressed={activeChapter === chapter.key}
                onClick={() => setActiveChapter(chapter.key)}
              >
                {chapter.label}
              </button>
            ))}
          </nav>

          <div className="settings-page">
            {activeChapter === "general" ? (
              <>
                <section className="settings-section" aria-labelledby="file-actions-title">
                  <p id="file-actions-title" className="control-label">Files</p>
                  <div className="import-action-row">
                    <label htmlFor="fileInput" className="ghost-btn settings-action-btn file-input-label" title={fileName ? `Current file: ${fileName}` : "Import JSON file"}>
                      <span className="file-input-text">Import File</span>
                      <input type="file" id="fileInput" accept=".json,application/json" multiple onClick={onFileInputClick} onChange={onFileInputChange} />
                    </label>
                    <label htmlFor="folderInput" className="ghost-btn settings-action-btn file-input-label folder-input-label" title="Import JSON files from a folder">
                      <span className="file-input-text">Import Folder</span>
                      <input
                        type="file"
                        id="folderInput"
                        accept=".json,application/json"
                        multiple
                        onClick={onFolderInputClick}
                        onChange={onFolderInputChange}
                        {...DIRECTORY_INPUT_PROPS}
                      />
                    </label>
                    <button
                      id="relative-link-root-btn"
                      className="ghost-btn settings-action-btn"
                      type="button"
                      title={relativeLinkRootName ? `Current resolve path: ${relativeLinkRootName}` : "Choose a base path for relative links"}
                      onClick={onRelativeLinkRootSelect}
                    >
                      Resolve Path
                    </button>
                    <button id="export-btn" className="ghost-btn settings-action-btn" type="button" disabled={!hasGraph} onClick={onExport}>Export SVG</button>
                  </div>
                </section>

                <section className="settings-section" aria-labelledby="data-actions-title">
                  <p id="data-actions-title" className="control-label">Graph Data</p>
                  <div className="workspace-action-row">
                    <button
                      id="field-mapping-btn"
                      className="ghost-btn settings-action-btn"
                      type="button"
                      onClick={() => {
                        onClose();
                        onFieldMappingOpen();
                      }}
                    >
                      Field Mapping
                    </button>
                    <button type="button" className="ghost-btn settings-action-btn" onClick={onInitializeCanvas}>Initialize</button>
                  </div>
                </section>

                <section className="settings-section" aria-labelledby="general-workspace-title">
                  <p id="general-workspace-title" className="control-label">Workspace</p>
                  <div className="workspace-action-row">
                    <button
                      id="console-sidebar-toggle-btn"
                      className={`ghost-btn settings-action-btn${consoleSidebarOpen ? " settings-action-btn-active" : ""}`}
                      type="button"
                      aria-pressed={consoleSidebarOpen}
                      onClick={onConsoleSidebarToggle}
                    >
                      {consoleSidebarOpen ? "Hide Console" : "Show Console"}
                    </button>
                  </div>
                </section>

                <p id="graph-summary" className="graph-summary">{status}</p>
              </>
            ) : null}

            {activeChapter === "appearance" ? (
              <>
                <section className="settings-section appearance-actions-section" aria-labelledby="appearance-actions-title">
                  <p id="appearance-actions-title" className="control-label">UI Configuration</p>
                  <div className="workspace-action-row">
                    <label htmlFor="appearanceInput" className="ghost-btn settings-action-btn appearance-import-label">
                      Import
                      <input type="file" id="appearanceInput" accept=".json,application/json" onClick={onAppearanceImportClick} onChange={onAppearanceImportChange} />
                    </label>
                    <button type="button" className="ghost-btn settings-action-btn" onClick={onAppearanceExport}>Export</button>
                    <button type="button" className="ghost-btn settings-action-btn" onClick={onAppearanceReset}>Reset</button>
                  </div>
                </section>

                <section className="settings-section" aria-labelledby="layout-mode-title">
                  <label className="layout-select-label" htmlFor="layout-mode-select">
                    <span id="layout-mode-title" className="control-label">Layout</span>
                    <select
                      id="layout-mode-select"
                      className="layout-select"
                      value={layoutMode}
                      onChange={(event) => onLayoutModeChange(event.currentTarget.value as GraphLayoutMode)}
                    >
                      <option value="sugiyama">Sugiyama layered</option>
                      <option value="level">Level layout</option>
                      <option value="dagre">Dagre layered</option>
                    </select>
                  </label>
                </section>

                <section className="settings-section settings-section-emphasis" aria-labelledby="layout-tuning-title">
                  <div className="settings-section-header">
                    <p id="layout-tuning-title" className="control-label">Layout Tuning</p>
                  </div>
                  <div className="settings-slider-grid">
                    {LAYOUT_CONTROLS.map((control) => (
                      <LayoutSliderControl
                        key={control.key}
                        control={control}
                        value={appearance.layout[control.key]}
                        onChange={(value) => onLayoutAppearanceChange(control.key, value)}
                      />
                    ))}
                  </div>
                </section>

                <section className="settings-section" aria-labelledby="appearance-presets-title">
                  <p id="appearance-presets-title" className="control-label">Preset</p>
                  <div className="workspace-action-row">
                    {GRAPH_APPEARANCE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className="ghost-btn settings-action-btn"
                        onClick={() => onAppearancePresetChange(preset.id)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="settings-section" aria-labelledby="appearance-tokens-title">
                  <p id="appearance-tokens-title" className="control-label">Tokens</p>
                  <div className="ai-settings-grid">
                    {APPEARANCE_TOKEN_CONTROLS.map((token) => (
                      <label key={token.key} className="settings-field-label" htmlFor={`appearance-token-${token.key}`}>
                        <span>{token.label}</span>
                        <input
                          id={`appearance-token-${token.key}`}
                          className="settings-text-input"
                          type="text"
                          value={cssVarDrafts[token.key] ?? appearance.cssVars[token.key] ?? ""}
                          onChange={(event) => setCssVarDrafts((current) => ({ ...current, [token.key]: event.currentTarget.value }))}
                          onBlur={(event) => commitCssVarDraft(token.key, event.currentTarget.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              commitCssVarDraft(token.key, event.currentTarget.value);
                              event.currentTarget.blur();
                            }
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </section>

                <section className="settings-section" aria-labelledby="appearance-css-title">
                  <p id="appearance-css-title" className="control-label">Custom CSS</p>
                  <textarea
                    className="settings-text-input appearance-css-editor"
                    value={appearanceCssDraft}
                    spellCheck={false}
                    rows={10}
                    onChange={(event) => setAppearanceCssDraft(event.currentTarget.value)}
                    onBlur={commitAppearanceCssDraft}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                        commitAppearanceCssDraft();
                        event.currentTarget.blur();
                      }
                    }}
                  />
                </section>

                <section className="settings-section title-style-section" aria-labelledby="title-style-title">
                  <p id="title-style-title" className="control-label">Title</p>
                  <div className="title-style-row">
                    <select
                      className="title-font-select"
                      value={titleFontFamily}
                      aria-label="Title font"
                      onChange={(event) => onAppearanceCssVarChange("--dag-title-font-family", event.currentTarget.value as GraphTitleFontFamily)}
                    >
                      {GRAPH_TITLE_FONT_OPTIONS.map((font) => (
                        <option key={font.value} value={font.value}>{font.label}</option>
                      ))}
                    </select>
                    <label className="title-size-control" htmlFor="title-font-size-input">
                      <input
                        id="title-font-size-input"
                        className="title-size-input"
                        type="number"
                        min={10}
                        max={28}
                        step={1}
                        value={titleSizeDraft}
                        aria-label="Title font size"
                        onChange={(event) => setTitleSizeDraft(event.currentTarget.value)}
                        onBlur={commitTitleSizeDraft}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            commitTitleSizeDraft();
                            event.currentTarget.blur();
                          }
                        }}
                      />
                      <span className="title-size-unit">px</span>
                    </label>
                    <div className="title-format-buttons" role="group" aria-label="Title format">
                      <button
                        type="button"
                        className={`title-format-btn${titleFontWeight === 700 ? " is-active" : ""}`}
                        title="Bold"
                        aria-label="Bold title"
                        aria-pressed={titleFontWeight === 700}
                        onClick={() => onAppearanceCssVarChange("--dag-title-font-weight", titleFontWeight === 700 ? "400" : "700")}
                      >
                        B
                      </button>
                      <button
                        type="button"
                        className={`title-format-btn title-format-btn-italic${titleFontStyle === "italic" ? " is-active" : ""}`}
                        title="Italic"
                        aria-label="Italic title"
                        aria-pressed={titleFontStyle === "italic"}
                        onClick={() => onAppearanceCssVarChange("--dag-title-font-style", titleFontStyle === "italic" ? "normal" : "italic")}
                      >
                        I
                      </button>
                    </div>
                  </div>
                </section>

                <section className="settings-section" aria-labelledby="view-options-title">
                  <p id="view-options-title" className="control-label">View</p>
                  <div className="workspace-action-row">
                    <button type="button" className={`ghost-btn settings-action-btn${showNodeDetail ? " settings-action-btn-active" : ""}`} aria-pressed={showNodeDetail} onClick={onNodeDetailToggle}>
                      {showNodeDetail ? "Hide Details" : "Show Details"}
                    </button>
                    <button type="button" className={`ghost-btn settings-action-btn${hideNodeBorders ? " settings-action-btn-active" : ""}`} aria-pressed={hideNodeBorders} onClick={onNodeBordersToggle}>
                      {hideNodeBorders ? "Show Borders" : "Hide Borders"}
                    </button>
                    <button type="button" className={`ghost-btn settings-action-btn${alignNodeWidthsToMax ? " settings-action-btn-active" : ""}`} aria-pressed={alignNodeWidthsToMax} onClick={onNodeWidthAlignToggle}>
                      {alignNodeWidthsToMax ? "Auto Width" : "Max Width"}
                    </button>
                    <button
                      type="button"
                      className={`ghost-btn settings-action-btn${appearance.display.showEdgeLabels ? " settings-action-btn-active" : ""}`}
                      aria-pressed={appearance.display.showEdgeLabels}
                      onClick={() => onAppearanceDisplayChange("showEdgeLabels", !appearance.display.showEdgeLabels)}
                    >
                      {appearance.display.showEdgeLabels ? "Hide Edge Labels" : "Show Edge Labels"}
                    </button>
                  </div>
                </section>
              </>
            ) : null}

            {activeChapter === "ai" ? (
              <section className="settings-section ai-settings-section" aria-label="AI settings">
                <div className="ai-settings-grid">
                  <label className="settings-field-label" htmlFor="ai-provider-select">
                    <span>Provider</span>
                    <div className="provider-picker">
                      <button
                        id="ai-provider-select"
                        className="provider-select-button"
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={providerMenuOpen}
                        onClick={() => setProviderMenuOpen((current) => !current)}
                      >
                        <ProviderIcon provider={aiSettings.provider} />
                        <span>{selectedProvider.label}</span>
                        <span className="provider-select-chevron" aria-hidden="true"><ChevronDownIcon /></span>
                      </button>
                      {providerMenuOpen ? (
                        <div className="provider-options" role="listbox" aria-label="AI provider">
                          {AI_PROVIDER_ENTRIES.map(([provider, preset]) => (
                            <button
                              key={provider}
                              type="button"
                              className={`provider-option${provider === aiSettings.provider ? " is-active" : ""}`}
                              role="option"
                              aria-selected={provider === aiSettings.provider}
                              onClick={() => handleAiProviderChange(provider)}
                            >
                              <ProviderIcon provider={provider} />
                              <span>{preset.label}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </label>
                  <label className="settings-field-label" htmlFor="ai-execution-mode-select">
                    <span>Execution</span>
                    <select id="ai-execution-mode-select" className="settings-select-input" value={aiSettings.executionMode} onChange={(event) => updateAiSetting("executionMode", event.currentTarget.value as AiExecutionMode)}>
                      <option value="ask">Ask</option>
                      <option value="review">Review</option>
                      <option value="auto-readonly">Auto Readonly</option>
                      <option value="auto-edit">Auto Edit</option>
                    </select>
                  </label>
                  <label className="settings-field-label ai-settings-wide" htmlFor="ai-base-url-input">
                    <span>Base URL</span>
                    <input id="ai-base-url-input" className="settings-text-input" type="text" value={aiSettings.baseUrl} onChange={(event) => updateAiSetting("baseUrl", event.currentTarget.value)} />
                  </label>
                  <label className="settings-field-label" htmlFor="ai-model-input">
                    <span>Model</span>
                    <input id="ai-model-input" className="settings-text-input" type="text" value={aiSettings.model} onChange={(event) => updateAiSetting("model", event.currentTarget.value)} />
                  </label>
                  <label className="settings-field-label" htmlFor="ai-api-key-input">
                    <span>API Key</span>
                    <input id="ai-api-key-input" className="settings-text-input" type="password" value={aiSettings.apiKey} placeholder={aiSettings.provider === "ollama" ? "not required" : "sk-..."} onChange={(event) => updateAiSetting("apiKey", event.currentTarget.value)} />
                  </label>
                  <label className="settings-field-label" htmlFor="ai-temperature-input">
                    <span>Temp</span>
                    <input id="ai-temperature-input" className="settings-text-input" type="number" min={0} max={2} step={0.1} value={aiSettings.temperature} onChange={(event) => updateAiSetting("temperature", clampFloatInput(event.currentTarget.value, 0, 2, aiSettings.temperature))} />
                  </label>
                  <label className="settings-field-label" htmlFor="ai-max-tokens-input">
                    <span>Tokens</span>
                    <input id="ai-max-tokens-input" className="settings-text-input" type="number" min={128} max={8000} step={128} value={aiSettings.maxTokens} onChange={(event) => updateAiSetting("maxTokens", clampNumberInput(event.currentTarget.value, 128, 8000, aiSettings.maxTokens))} />
                  </label>
                </div>
                <button
                  type="button"
                  className={`ghost-btn settings-action-btn ai-connection-test-btn ai-connection-test-btn-${aiBusy ? "testing" : aiConnectionStatus}`}
                  disabled={aiBusy}
                  onClick={handleAiConnectionTestClick}
                >
                  {aiConnectionButtonText}
                </button>
              </section>
            ) : null}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

type AiConnectionStatus = "idle" | "testing" | "success" | "error";

function getAiConnectionButtonText(status: AiConnectionStatus, aiBusy: boolean): string {
  if (aiBusy || status === "testing") {
    return "Testing connection...";
  }
  if (status === "success") {
    return "Connection OK - Retest";
  }
  if (status === "error") {
    return "Connection Failed - Retest";
  }
  return "Test Connection";
}

function ZoomInput({ value, disabled, onCommit }: { value: number; disabled: boolean; onCommit: (percent: number) => void }) {
  const digits = String(Math.max(0, Math.trunc(Math.abs(value || 0)))).length;
  const inputWidth = `${Math.max(2, digits) + 0.35}ch`;

  const handleCommit = (event: React.FocusEvent<HTMLInputElement> | React.ChangeEvent<HTMLInputElement>) => {
    onCommit(Number(event.currentTarget.value));
  };

  return (
    <label className="zoom-pill zoom-input-pill" htmlFor="zoom-value-input">
      <input
        id="zoom-value-input"
        className="zoom-value-input"
        type="number"
        min={0.0001}
        step={1}
        value={value}
        disabled={disabled}
        style={{ width: inputWidth, minWidth: inputWidth }}
        aria-label="Zoom percentage"
        onChange={handleCommit}
        onBlur={handleCommit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onCommit(Number(event.currentTarget.value));
            event.currentTarget.blur();
          }
        }}
      />
      <span className="zoom-unit">%</span>
    </label>
  );
}

interface IconButtonProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  ariaControls?: string;
  ariaExpanded?: boolean;
  className?: string;
}

function IconButton({ id, label, icon, disabled, onClick, ariaControls, ariaExpanded, className = "ghost-btn topbar-icon-btn" }: IconButtonProps) {
  return (
    <button
      id={id}
      className={className}
      type="button"
      title={label}
      aria-label={label}
      aria-controls={ariaControls}
      aria-expanded={ariaExpanded}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="topbar-icon" aria-hidden="true">{icon}</span>
    </button>
  );
}

function IconShell({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="topbar-icon-svg" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <IconShell>
      <path d="M19 12H5" />
      <path d="M11 18L5 12L11 6" />
    </IconShell>
  );
}

function ArrowUpIcon() {
  return (
    <IconShell>
      <path d="M12 19V5" />
      <path d="M6 11L12 5L18 11" />
    </IconShell>
  );
}

function GraphRootsIcon() {
  return (
    <IconShell>
      <circle cx="6" cy="7" r="2.2" />
      <circle cx="18" cy="7" r="2.2" />
      <circle cx="12" cy="17" r="2.2" />
      <path d="M7.8 8.6L10.4 14.2" />
      <path d="M16.2 8.6L13.6 14.2" />
    </IconShell>
  );
}

function UndoIcon() {
  return (
    <IconShell>
      <path d="M9 9H5V5" />
      <path d="M5 9C6.8 6.4 9.8 5 13 5C18 5 21 8.3 21 12.9C21 17.4 17.7 20 13.5 20" />
    </IconShell>
  );
}

function RedoIcon() {
  return (
    <IconShell>
      <path d="M15 9H19V5" />
      <path d="M19 9C17.2 6.4 14.2 5 11 5C6 5 3 8.3 3 12.9C3 17.4 6.3 20 10.5 20" />
    </IconShell>
  );
}

function MinusIcon() {
  return (
    <IconShell>
      <path d="M6 12H18" />
    </IconShell>
  );
}

function PlusIcon() {
  return (
    <IconShell>
      <path d="M12 6V18" />
      <path d="M6 12H18" />
    </IconShell>
  );
}

function FitIcon() {
  return (
    <IconShell>
      <path d="M8 4H4V8" />
      <path d="M16 4H20V8" />
      <path d="M8 20H4V16" />
      <path d="M16 20H20V16" />
      <path d="M9 9L4 4" />
      <path d="M15 9L20 4" />
      <path d="M9 15L4 20" />
      <path d="M15 15L20 20" />
    </IconShell>
  );
}

function SaveIcon() {
  return (
    <IconShell>
      <path d="M5 5H16L19 8V19H5Z" />
      <path d="M8 5V10H15V5" />
      <path d="M8 19V14H16V19" />
    </IconShell>
  );
}

function SlidersIcon() {
  return (
    <IconShell>
      <path d="M5 6H19" />
      <path d="M5 12H19" />
      <path d="M5 18H19" />
      <circle cx="9" cy="6" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="11" cy="18" r="1.8" fill="currentColor" stroke="none" />
    </IconShell>
  );
}

function CloseIcon() {
  return (
    <IconShell>
      <path d="M6 6L18 18" />
      <path d="M18 6L6 18" />
    </IconShell>
  );
}

function ChevronDownIcon() {
  return (
    <IconShell>
      <path d="M7 10L12 15L17 10" />
    </IconShell>
  );
}

function ProviderIcon({ provider }: { provider: AiProvider }) {
  const preset = AI_PROVIDER_PRESETS[provider];
  return (
    <span className={`provider-icon provider-icon-${provider}`} aria-hidden="true">
      <img src={preset.logoSrc} alt="" className="provider-icon-img" />
    </span>
  );
}

function truncateFileName(fileName: string, maxLength = 26): string {
  return fileName.length > maxLength ? `${fileName.slice(0, Math.max(0, maxLength - 3))}...` : fileName;
}

const DIRECTORY_INPUT_PROPS = {
  directory: "",
  webkitdirectory: "",
} as Record<string, string>;

function clampNumberInput(value: string, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function clampFloatInput(value: string, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, parsed));
}

function parseCssPixelValue(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildCssVarDrafts(appearance: GraphAppearance): Record<string, string> {
  return Object.fromEntries(APPEARANCE_TOKEN_CONTROLS.map((token) => [token.key, appearance.cssVars[token.key] || ""]));
}

type LayoutControlKey = keyof Pick<GraphLayoutAppearance, "columnGap" | "rowGap" | "edgeLaneGap" | "nodeHeight" | "maxNodeWidth">;

interface LayoutControlDefinition {
  key: LayoutControlKey;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

const LAYOUT_CONTROLS: LayoutControlDefinition[] = [
  { key: "columnGap", label: "Layer spacing", min: 48, max: 260, step: 2, unit: "px" },
  { key: "rowGap", label: "Node spacing", min: 4, max: 140, step: 2, unit: "px" },
  { key: "edgeLaneGap", label: "Line spacing", min: 4, max: 96, step: 2, unit: "px" },
  { key: "nodeHeight", label: "Node height", min: 44, max: 160, step: 2, unit: "px" },
  { key: "maxNodeWidth", label: "Node max width", min: 188, max: 480, step: 4, unit: "px" },
];

const APPEARANCE_TOKEN_CONTROLS = [
  { key: "--dag-node-fill", label: "Node Fill" },
  { key: "--dag-node-border", label: "Node Border" },
  { key: "--dag-node-border-strong", label: "Root Border" },
  { key: "--dag-edge", label: "Edge" },
  { key: "--dag-edge-active", label: "Active Edge" },
  { key: "--dag-text-strong", label: "Title Text" },
  { key: "--dag-text-soft", label: "Soft Text" },
  { key: "--dag-title-font-size", label: "Title Size" },
] as const;

const AI_PROVIDER_PRESETS: Record<AiProvider, { label: string; logoSrc: string; baseUrl: string; model: string }> = {
  "openai-compatible": { label: "OpenAI compatible", logoSrc: "/assets/providers/openai.png", baseUrl: "https://api.openai.com/v1", model: "gpt-4.1-mini" },
  deepseek: { label: "DeepSeek", logoSrc: "/assets/providers/deepseek-icon.png", baseUrl: "https://api.deepseek.com", model: "deepseek-v4-flash" },
  anthropic: { label: "Anthropic", logoSrc: "/assets/providers/anthropic.png", baseUrl: "https://api.anthropic.com", model: "claude-3-5-sonnet-latest" },
  gemini: { label: "Gemini", logoSrc: "/assets/providers/gemini.svg", baseUrl: "https://generativelanguage.googleapis.com", model: "gemini-1.5-flash" },
  ollama: { label: "Ollama", logoSrc: "/assets/providers/ollama.png", baseUrl: "http://localhost:11434", model: "llama3.1" },
};

const AI_PROVIDER_ENTRIES = Object.entries(AI_PROVIDER_PRESETS) as Array<[AiProvider, typeof AI_PROVIDER_PRESETS[AiProvider]]>;

const SETTINGS_CHAPTERS: Array<{ key: SettingsChapter; label: string }> = [
  { key: "general", label: "General" },
  { key: "appearance", label: "Appearance" },
  { key: "ai", label: "AI" },
];

function LayoutSliderControl({
  control,
  value,
  onChange,
}: {
  control: LayoutControlDefinition;
  value: number;
  onChange: (value: number) => void;
}) {
  const inputId = `layout-control-${control.key}`;

  const commitValue = (nextValue: number) => {
    if (!Number.isFinite(nextValue)) {
      return;
    }
    const bounded = Math.max(control.min, Math.min(control.max, Math.round(nextValue)));
    onChange(bounded);
  };

  return (
    <div className="layout-slider-control">
      <label htmlFor={inputId} className="layout-slider-label">{control.label}</label>
      <div className="layout-slider-inputs">
        <input
          id={inputId}
          className="layout-slider"
          type="range"
          min={control.min}
          max={control.max}
          step={control.step}
          value={value}
          onChange={(event) => commitValue(Number(event.currentTarget.value))}
        />
        <label className="layout-value-pill" htmlFor={`${inputId}-number`}>
          <input
            id={`${inputId}-number`}
            className="layout-value-input"
            type="number"
            min={control.min}
            max={control.max}
            step={control.step}
            value={value}
            aria-label={`${control.label} value`}
            onChange={(event) => commitValue(Number(event.currentTarget.value))}
            onBlur={(event) => commitValue(Number(event.currentTarget.value))}
          />
          <span className="layout-value-unit">{control.unit || ""}</span>
        </label>
      </div>
    </div>
  );
}
