# Usage Guide

This guide covers the main workflows for using DAG Studio in the browser.

## Running the App

```powershell
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. On first load, the app automatically opens [`public/example.json`](../public/example.json).

## Main Modes

- `Preview` mode is for safe browsing and inspection.
- `Edit` mode enables graph mutation, the console sidebar, undo and redo, and save operations.

The app remembers page preferences such as mode and layout selection across refreshes.

## Loading and Starting Graphs

You can work from sample data or start from scratch.

- The default sample graph is loaded automatically on page load.
- `Initialize Canvas` creates a new blank graph with a single centered root node named `Initial_Node`.
- A newly initialized graph is treated as unsaved until you export or save it as JSON.

## Navigation

After loading JSON, the renderer first looks for nodes with no parents.

- If there is one root node, that node becomes the focused root.
- If there are multiple root nodes, DAG Studio renders them as a forest.
- Clicking a node focuses that node or subtree.
- `Back` returns to the previous focus selection.
- `Up` renders the current node's parent level.
- If a node has multiple parents, the parent level is shown as a forest.

## Layout Modes

- `BFS` keeps the selected traversal close to breadth-first discovery order.
- `Sugiyama layered` ranks nodes by dependency depth and applies crossing reduction before rendering.
- `Dagre layered` uses Dagre's layered engine for a library-backed dependency layout.

## Editing in the UI

Switch to `Edit` mode to enable graph editing.

Right-click a node to access:

- `View Node`
- `Copy Key`
- `Copy Node`
- `Add Child Node`
- `Edit Children`
- `Edit Parents`
- `Rename Node Key`
- `Delete Node`
- `Delete Subtree`

Behavior notes:

- `Copy Node` duplicates the selected node's non-relation fields into a new node.
- `Add Child Node` creates a node and links it as a child immediately.
- `Rename Node Key` prevents duplicate keys.
- `Delete Node` removes the node and clears references from other nodes.
- `Delete Subtree` removes the selected node and all descendants.
- `Edit Parents` and `Edit Children` update the graph and rerender immediately.
- `View Node` in edit mode also supports field-by-field editing and raw JSON editing.

In `Preview` mode, edit-only actions stay disabled while non-destructive actions remain available.

## View Node

`View Node` opens a generic node detail view. It shows:

- every key-value pair in the node
- `define` as readable text
- `parents` and `children` as relation sets
- the node's raw JSON

The viewer is schema-agnostic, so custom node fields are preserved and still inspectable.

## Graph Console

In `Edit` mode, use `Show Console Sidebar` from the controls panel to open the left-side console.

The console is designed for fast text-based graph edits:

- one line is one instruction
- multiple lines run as one batch
- successful mutation batches commit as a single undo step
- parse or execution errors stop at the first failing line
- command history is available with the arrow keys when suggestions are not open
- `clear` or `cls` clears console output
- `help` prints the command reference directly in the console

Common commands:

- `help`
- `use <node>`
- `show <node>`
- `json <node>`
- `mv <old-key> <new-key>`
- `rm <node>` or `rm -r <node>`
- `add <new-key>` or `add <new-key> -p <parent>`
- `cp <source> <new-key>` or `cp <source> <new-key> -p <parent>`
- `parents <node> = A,B`
- `children <node> = A,B`
- `set <node> <field> "value"`

For the full command reference, see [Graph Console DSL](graph-console-dsl.md).

## Undo and Redo

Edit history is separate from navigation history.

- `Back` restores the previous focus selection.
- `Undo` and `Redo` apply only to graph data edits.
- Supported edit actions include add, delete, rename, field edits, and relation edits.
- Creating a new edit after `Undo` clears the redo stack.

Keyboard shortcuts:

- `Ctrl+Z` or `Cmd+Z`: undo
- `Ctrl+Shift+Z` or `Cmd+Shift+Z`: redo
- `Ctrl+Y`: redo

Shortcuts are ignored while typing in editable controls.

## Saving and Export

The top bar includes `Save JSON`.

Available actions:

- `Overwrite Original`: write the edited JSON back to the source file
- `Save New Copy`: download a timestamped JSON file
- `Cancel`: close the dialog

Default new-file naming:

```text
original-name-YYYYMMDD-HHMMSS.json
```

Direct overwrite uses the browser File System Access API. When file access is unavailable, saving a new copy remains available.

The app also supports exporting the current view as SVG.
