const command = document.querySelector<HTMLElement>("#install-command");
const note = document.querySelector<HTMLElement>("#install-note");
const projectNote = document.querySelector<HTMLElement>("#project-note");
const status = document.querySelector<HTMLElement>("#copy-status");
const copy = document.querySelector<HTMLButtonElement>("#copy-command");
const scopes = document.querySelectorAll<HTMLInputElement>('input[name="scope"]');
const baseCommand = command?.textContent?.trim() ?? "";

function updateCommand() {
  const project =
    document.querySelector<HTMLInputElement>('input[name="scope"]:checked')?.value === "project";
  if (!command || !note || !projectNote) return;
  command.textContent = `${baseCommand}${project ? " -s -- --project" : ""}`;
  note.hidden = project;
  projectNote.hidden = !project;
  if (copy) copy.textContent = "Copy";
  if (status) status.textContent = "";
}
for (const scope of scopes) scope.addEventListener("change", updateCommand);
updateCommand();

copy?.addEventListener("click", async () => {
  if (!command || !status) return;
  try {
    await navigator.clipboard.writeText(command.textContent ?? "");
    copy.textContent = "Copied";
    status.textContent = "Command copied.";
  } catch {
    const range = document.createRange();
    range.selectNodeContents(command);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    copy.textContent = "Selected";
    status.textContent = "Clipboard unavailable. Copy the selected command.";
  }
});

const dialog = document.querySelector<HTMLDialogElement>("#source-dialog");
const sourceTitle = document.querySelector<HTMLElement>("#source-title");
const sourceContent = document.querySelector<HTMLElement>("#source-content");
const sourceStatus = document.querySelector<HTMLElement>("#source-status");
const sourceLink = document.querySelector<HTMLAnchorElement>("#source-link");
let request: AbortController | undefined;

for (const link of document.querySelectorAll<HTMLAnchorElement>("a[data-source]")) {
  link.addEventListener("click", async (event) => {
    // Modified clicks keep normal browser behavior, including opening new tabs.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0)
      return;
    if (!dialog || !sourceTitle || !sourceContent || !sourceStatus || !sourceLink) return;
    event.preventDefault();
    request?.abort();
    const current = new AbortController();
    request = current;
    sourceTitle.textContent = new URL(link.href).pathname.replace(/^\//, "");
    sourceLink.href = link.href;
    sourceContent.textContent = "";
    sourceStatus.textContent = "Loading file…";
    dialog.showModal();
    try {
      const response = await fetch(link.href, { signal: current.signal });
      if (!response.ok || response.headers.get("content-type")?.includes("text/html")) {
        throw new Error("File unavailable");
      }
      const text = await response.text();
      if (current.signal.aborted) return;
      sourceContent.textContent = text;
      sourceStatus.textContent = "";
    } catch {
      if (!current.signal.aborted) {
        sourceStatus.textContent = "Could not load this file. Use Open file to retry.";
      }
    }
  });
}
document.querySelector("#close-source")?.addEventListener("click", () => dialog?.close());
dialog?.addEventListener("close", () => request?.abort());
