export interface ConsoleCommandReference {
  label: string;
  insertText: string;
  help: string;
}

export const CONSOLE_COMMAND_REFERENCE: ConsoleCommandReference[] = [
  { label: "help", insertText: "help", help: "Show this command reference." },
  { label: "ls <node>", insertText: "ls ", help: "Print a compact node summary in the console output." },
  { label: "use <node>", insertText: "use ", help: "Set the current context node. Use . to refer to the current context in later commands." },
  { label: "show <node>", insertText: "show ", help: "Open the node viewer for a node." },
  { label: "json <node>", insertText: "json ", help: "Open the raw JSON editor for a node." },
  { label: "mv <old-key> <new-key>", insertText: "mv ", help: "Rename a node key." },
  { label: "rm <node>", insertText: "rm ", help: "Delete a single node." },
  { label: "rm -r <node>", insertText: "rm -r ", help: "Delete a node and its descendants." },
  { label: "add <new-key>", insertText: "add ", help: "Add a new node without linking it." },
  { label: "add <new-key> -p <parent>", insertText: "add ", help: "Add a new node and link it as a child of the parent." },
  { label: "cp <source> <new-key>", insertText: "cp ", help: "Copy a node into a new node key." },
  { label: "cp <source> <new-key> -p <parent>", insertText: "cp ", help: "Copy a node and link the copy to a parent." },
  { label: "edge <parent> <child>", insertText: "edge ", help: "Add an edge from parent to child with the default relation value." },
  { label: "edge <parent> <child> <weight>", insertText: "edge ", help: "Add an edge or update its relation value." },
  { label: "edge --create-missing <parent> <child>", insertText: "edge --create-missing ", help: "Create any missing endpoint nodes before adding the edge." },
  { label: "edge --create-missing <parent> <child> <weight>", insertText: "edge --create-missing ", help: "Create missing endpoint nodes and set the edge relation value." },
  { label: "rm-edge <parent> <child>", insertText: "rm-edge ", help: "Remove a single directed edge." },
  { label: "parents <node> = A,B", insertText: "parents ", help: "Replace the parent relation set for a node." },
  { label: "children <node> = A,B", insertText: "children ", help: "Replace the child relation set for a node." },
  { label: "set <node> <field> <value>", insertText: "set ", help: "Set a non-relation field value as string, number, boolean, null, or JSON." },
  { label: "unset <node> <field>", insertText: "unset ", help: "Remove a non-relation field from a node." },
  { label: "clear", insertText: "clear", help: "Clear the console output." },
];

export function buildConsoleHelpText(): string {
  return [
    "Available commands:",
    ...CONSOLE_COMMAND_REFERENCE.map((command) => `- ${command.label}: ${command.help}`),
  ].join("\n");
}
