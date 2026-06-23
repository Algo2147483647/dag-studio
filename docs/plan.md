**目标**
将图谱 UI 样式系统改造成 **CSS-first** 方案：

- 布局/几何相关配置继续使用结构化对象。
- 视觉样式允许用户直接写 CSS。
- 图谱 SVG 输出稳定的 class、data attributes、CSS variables。
- 默认样式迁移为 `GraphAppearance`，并保持当前视觉效果基本不变。
- 后续可以支持主题导入导出、控制台 `/style`、AI 生成样式，但本次先打好核心架构。

**核心模型**
新增 `GraphAppearance`：

```ts
export interface GraphAppearance {
  version: 1;
  layout: GraphLayoutAppearance;
  cssVars: Record<string, string>;
  css: string;
}

export interface GraphLayoutAppearance {
  stagePaddingX: number;
  stagePaddingY: number;
  columnGap: number;
  rowGap: number;
  edgeLaneGap: number;
  nodeHeight: number;
  minNodeWidth: number;
  maxNodeWidth: number;
  stageMinWidth: number;
  stageMinHeight: number;
}
```

现有 `GraphTheme` 可以先保留兼容，但内部逐步迁移到：

```ts
GraphTheme -> GraphLayoutAppearance
```

用户最终配置形态：

```yaml
version: 1

layout:
  stagePaddingX: 108
  stagePaddingY: 88
  columnGap: 116
  rowGap: 22
  edgeLaneGap: 28
  nodeHeight: 74
  minNodeWidth: 188
  maxNodeWidth: 280
  stageMinWidth: 980
  stageMinHeight: 600

cssVars:
  --dag-node-fill: "rgba(252, 253, 255, 0.88)"
  --dag-node-border: "rgba(91, 109, 142, 0.17)"
  --dag-edge: "rgba(76, 96, 132, 0.24)"

css: |
  .dag-node[data-type="service"] .dag-node__shape {
    fill: #eef6ff;
    stroke: #3b82f6;
  }
```

**DOM/SVG 契约**
统一图谱 CSS 命名为 `dag-*`，保留旧 class 一版也可以，但新样式必须基于稳定契约。

`GraphStage` 输出：

```tsx
<svg
  className="dag-graph graph-stage"
  data-layout={stage.layoutMode}
  data-density={isDenseStage ? "dense" : "normal"}
  data-borderless={hideNodeBorders ? "true" : "false"}
  data-has-interactive-node="false"
>
```

节点：

```tsx
<g
  className="dag-node graph-node"
  data-key={node.key}
  data-type={node.typeLabel || ""}
  data-root={node.isRoot ? "true" : "false"}
  data-selected={node.key === stage.root ? "true" : "false"}
  data-focused="false"
  data-hovered="false"
  data-connected="false"
  data-layer={node.layer}
  data-order={node.order}
>
  <ellipse className="dag-node__glow graph-node__glow" />
  <rect className="dag-node__shape graph-node__shape" />
  <circle className="dag-node__pin graph-node__pin" />
  <circle className="dag-node__pin-core graph-node__pin-core" />
  <text className="dag-node__title graph-node__title" />
  <text className="dag-node__detail graph-node__detail" />
  <g className="dag-node__affordance graph-node__affordance" />
</g>
```

边：

```tsx
<g
  className="dag-edge graph-edge-group"
  data-source={edge.source}
  data-target={edge.target}
  data-weight={String(edge.weight ?? "")}
  data-label={edge.label}
  data-active="false"
>
  <path className="dag-edge__path graph-edge" />
  <rect className="dag-edge__label-bg graph-edge-label-bg" />
  <text className="dag-edge__label-text graph-edge-label" />
</g>
```

背景：

```tsx
<g className="dag-backdrop graph-stage">
  <rect className="dag-stage__halo graph-stage__halo" />
  <g className="dag-lane" data-layer={lane.layer} data-label={lane.label}>
    <line className="dag-stage__lane graph-stage__lane" />
    <text className="dag-stage__lane-label graph-stage__lane-label" />
  </g>
</g>
```

**交互状态**
当前代码通过 class 操作：

```ts
has-interactive-node
is-current
is-connected
is-active-edge
```

改成同步 data attribute，同时可以暂时保留旧 class 兼容：

```ts
svg.dataset.hasInteractiveNode = "true" | "false";
node.dataset.hovered = "true" | "false";
node.dataset.focused = "true" | "false";
node.dataset.connected = "true" | "false";
edgeGroup.dataset.active = "true" | "false";
```

注意：当前 `collectEdgeElements` 收集的是 `SVGPathElement`，新方案最好收集 `.dag-edge` group，这样 `data-active` 放在 group 上，CSS selector 更自然：

```css
.dag-edge[data-active="true"] .dag-edge__path {}
```

**新增文件**
建议新增：

```text
src/graph/appearance.ts
```

内容包括：

```ts
export interface GraphAppearance {}
export interface GraphLayoutAppearance {}
export const DEFAULT_GRAPH_APPEARANCE: GraphAppearance = {}
export function sanitizeGraphAppearance(input: unknown): GraphAppearance {}
export function appearanceToStageStyle(appearance: GraphAppearance): CSSProperties {}
```

可选拆分：

```text
src/graph/appearance/defaultCss.ts
src/graph/appearance/sanitize.ts
```

如果项目偏小，先放一个文件即可。

**默认 CSS**
将当前 [`src/styles/graph.css`](/Users/didi/dag-studio/src/styles/graph.css:1) 中的视觉样式迁移到 `DEFAULT_GRAPH_APPEARANCE.css`，并保留必要基础 CSS。

默认值大致为：

```ts
export const DEFAULT_GRAPH_APPEARANCE: GraphAppearance = {
  version: 1,
  layout: {
    stagePaddingX: 108,
    stagePaddingY: 88,
    columnGap: 116,
    rowGap: 22,
    edgeLaneGap: 28,
    nodeHeight: 74,
    minNodeWidth: 188,
    maxNodeWidth: 280,
    stageMinWidth: 980,
    stageMinHeight: 600,
  },
  cssVars: {
    "--dag-text-strong": "#162033",
    "--dag-text-soft": "#8792a2",
    "--dag-edge": "rgba(76, 96, 132, 0.24)",
    "--dag-edge-active": "rgba(41, 92, 207, 0.72)",
    "--dag-node-fill": "rgba(252, 253, 255, 0.88)",
    "--dag-node-border": "rgba(91, 109, 142, 0.17)",
    "--dag-node-border-strong": "rgba(50, 79, 132, 0.35)",
    "--dag-title-font-family": "\"Georgia\", serif",
    "--dag-title-font-size": "15px",
    "--dag-title-font-style": "italic",
    "--dag-title-font-weight": "400",
  },
  css: DEFAULT_GRAPH_CSS,
};
```

`DEFAULT_GRAPH_CSS` 至少包含：

```css
.dag-edge__path {
  fill: none;
  stroke: var(--dag-edge);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.65;
}

.dag-edge[data-active="true"] .dag-edge__path {
  stroke: var(--dag-edge-active);
  stroke-width: 2.35;
  opacity: 1;
}

.dag-node__shape {
  fill: var(--dag-node-fill);
  stroke: var(--dag-node-border);
  stroke-width: 1.25;
  filter: drop-shadow(0 10px 18px rgba(24, 39, 64, 0.06));
}

.dag-node__title {
  fill: var(--dag-text-strong);
  font-family: var(--dag-title-font-family);
  font-size: var(--dag-title-font-size);
  font-style: var(--dag-title-font-style);
  font-weight: var(--dag-title-font-weight);
}

.dag-node[data-root="true"] .dag-node__shape {
  stroke: var(--dag-node-border-strong);
  stroke-width: 1.7;
  fill: rgba(252, 254, 255, 0.94);
}

.dag-node[data-hovered="true"] .dag-node__shape,
.dag-node[data-focused="true"] .dag-node__shape,
.dag-node[data-selected="true"] .dag-node__shape {
  stroke: var(--dag-node-active-border, rgba(39, 79, 152, 0.48));
  fill: rgba(251, 253, 255, 0.96);
}

.dag-graph[data-has-interactive-node="true"] .dag-node {
  opacity: 0.48;
}

.dag-graph[data-has-interactive-node="true"] .dag-node[data-connected="true"],
.dag-graph[data-has-interactive-node="true"] .dag-node[data-hovered="true"],
.dag-graph[data-has-interactive-node="true"] .dag-node[data-focused="true"] {
  opacity: 1;
}

.dag-graph[data-borderless="true"] .dag-node__shape {
  stroke: transparent;
}

.dag-graph[data-density="dense"] .dag-node__shape {
  filter: none;
}
```

**样式注入方案**
在 `GraphStage` 内注入 scoped `<style>`：

```tsx
<style>{appearance.css}</style>
```

并在 `<svg style={appearanceToStageStyle(appearance)}>` 上挂 css vars。

更稳妥的方式是：

```tsx
<svg>
  <defs>
    <style>{appearance.css}</style>
    ...
  </defs>
</svg>
```

这样导出 SVG 时样式也能跟着走。需要同步修改 `export-svg.ts`，确保 CSS 和 vars 不丢。

**类型配色迁移**
当前 `buildTypeColorMap()` 会按 type 自动生成 CSS variables。保留这个功能，但输出到节点 `style` 上：

```tsx
style={{
  "--dag-node-glow": tokens.glow,
  "--dag-node-border": tokens.border,
  "--dag-node-border-strong": tokens.borderStrong,
  "--dag-node-active-border": tokens.activeBorder,
  "--dag-node-pin-fill": tokens.pinFill,
  ...
}}
```

变量名改为 `--dag-*`。这样用户 CSS 可以继续引用：

```css
.dag-node__shape {
  stroke: var(--dag-node-border);
}
```

**文件修改清单**
修改：

```text
src/graph/types.ts
- 保留 GraphTheme 兼容，或导出 GraphLayoutAppearance alias。
- DEFAULT_GRAPH_THEME 可从 DEFAULT_GRAPH_APPEARANCE.layout 派生。

src/graph/appearance.ts
- 新增 GraphAppearance 类型、默认样式、sanitize、style 转换。

src/state/preferences.ts
- GraphPagePreferences 增加 appearance: GraphAppearance。
- 兼容旧 theme 字段，迁移到 appearance.layout 和 cssVars。
- 继续保留 hideNodeBorders，但渲染为 data-borderless。

src/layout/stage-layout.ts
- input.theme 改为 layoutAppearance 或兼容 GraphTheme。
- stageWidth/stageHeight 最小值使用 appearance.layout.stageMinWidth/stageMinHeight。
- 类型色 token 变量命名迁移为 dag 语义。

src/layout/types.ts
- StageNodeColorTokens 字段可保留，但命名注释改为 CSS var source。

src/rendering/GraphStage.tsx
- props 增加 appearance。
- svg 增加 dag-* class 和 data attributes。
- defs 内注入 appearance.css。
- cssVars 注入 svg style。
- 交互状态同步 data attributes。

src/rendering/GraphNode.tsx
- 增加 dag-* class。
- 增加 data-root/data-selected/data-layer/data-order。
- CSS var 名从 --graph-node-* 迁移到 --dag-node-*，可短期双写。

src/rendering/GraphEdge.tsx
- group 使用 dag-edge。
- data-source/data-target/data-weight/data-label 放到 group。
- path 使用 dag-edge__path。
- active 状态改由 group data-active 表达。

src/rendering/GraphBackdrop.tsx
- 增加 dag-backdrop、dag-stage__halo、dag-lane 等 class/data。

src/rendering/GraphDefs.tsx
- style 注入可放这里，接收 appearanceCss prop。
- 保留 arrowhead marker。

src/rendering/export-svg.ts
- 确保导出的 SVG 包含 <style> 和 cssVars。

src/styles/graph.css
- 保留结构性 fallback。
- 视觉默认样式迁移到 DEFAULT_GRAPH_CSS。
- 旧 class 兼容可保留一版。
```

**控制台 DSL 后续扩展**
本次可以不做，但预留命令：

```text
/theme css
/theme vars
/theme reset
/style-var --dag-node-fill "#fff"
```

控制台不解析完整 CSS，只负责替换 `appearance.css` 或 `appearance.cssVars`。

**安全策略**
如果 CSS 只在本地应用，可以第一版不做强沙箱。但要做最小防护：

- 禁止 `<script>` 注入不相关，因为 CSS 作为文本进入 `<style>`。
- `sanitizeGraphAppearance` 限制 `css` 最大长度，例如 50KB。
- `cssVars` key 必须以 `--dag-` 开头。
- `layout` 数值做 clamp。
- 不支持远程 `@import`，可以在保存时移除或报错。

建议 sanitizer：

```ts
function sanitizeCss(css: unknown): string {
  if (typeof css !== "string") return DEFAULT_GRAPH_CSS;
  const trimmed = css.slice(0, 50_000);
  return trimmed.replace(/@import\s+[^;]+;/gi, "");
}
```

**测试计划**
新增或更新测试：

```text
src/test/appearance.test.ts
- sanitizeGraphAppearance 能补齐默认值。
- layout 数值 clamp 生效。
- cssVars 只接受 --dag-*。
- 旧 theme preferences 能迁移到 appearance.layout。

src/test/graph.test.ts
- buildStageData 使用 appearance.layout 后节点位置不回归。

组件层可用现有测试或轻量 DOM 测试：
- GraphNode 输出 dag-node/data-type/data-root。
- GraphEdge 输出 dag-edge/data-weight。
```

**验收标准**
完成后应满足：

- 默认打开图谱，视觉效果与当前版本基本一致。
- 用户可通过修改 `appearance.css` 改节点、边、lane、背景样式。
- 用户可用选择器按 `data-type`、`data-weight`、`data-root` 定制样式。
- hover/focus/connected/active 状态通过 `data-*` 反映，而不是只能依赖内部 class。
- 布局参数仍由结构化 `appearance.layout` 控制。
- 导出的 SVG 包含当前自定义 CSS。
- 旧 localStorage preferences 不会导致页面崩溃。

**推荐实现顺序**
1. 新增 `src/graph/appearance.ts`，定义类型、默认 CSS、sanitize。
2. 修改 preferences，加入 `appearance` 并兼容旧 `theme`。
3. 修改 `GraphStage` 注入 CSS vars 和 `<style>`。
4. 给 `GraphNode`、`GraphEdge`、`GraphBackdrop` 增加 `dag-*` class/data attributes。
5. 将交互状态从 class 同步到 data attributes。
6. 迁移默认视觉 CSS 到 `DEFAULT_GRAPH_CSS`。
7. 修复 SVG export。
8. 补测试。
9. 手动验证默认图谱、hover、focus、borderless、dense、大图导出。