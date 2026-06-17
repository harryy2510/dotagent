const rows = document.querySelectorAll<HTMLAnchorElement>(".skill-row");
const search = document.querySelector<HTMLInputElement>("#skill-search");
const category = document.querySelector<HTMLSelectElement>("#skill-category");
const skillStatus = document.querySelector<HTMLElement>("#skill-status");

function filterSkills() {
  const query = search?.value.trim().toLowerCase() ?? "";
  let count = 0;
  for (const row of rows) {
    row.hidden =
      (category?.value !== "all" && row.dataset.category !== category?.value) ||
      !row.textContent?.toLowerCase().includes(query);
    if (!row.hidden) count += 1;
  }
  if (skillStatus) {
    skillStatus.textContent = count
      ? `${count} ${count === 1 ? "skill" : "skills"}`
      : "No matches. Try another search or category.";
  }
}
search?.addEventListener("input", filterSkills);
category?.addEventListener("change", filterSkills);

const command = document.querySelector<HTMLElement>("#install-command");
const note = document.querySelector<HTMLElement>("#install-note");
const status = document.querySelector<HTMLElement>("#copy-status");
const copy = document.querySelector<HTMLButtonElement>("#copy-command");
const scopes = document.querySelectorAll<HTMLInputElement>('input[name="scope"]');
const baseCommand = command?.textContent?.trim() ?? "";

function updateCommand() {
  const project =
    document.querySelector<HTMLInputElement>('input[name="scope"]:checked')?.value === "project";
  if (!command || !note) return;
  command.textContent = `${baseCommand}${project ? " -s -- --project" : ""}`;
  note.textContent = project
    ? "Run from your project directory. The installer asks which agents to configure."
    : "The installer asks which agents to configure. Existing pack files are preserved.";
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
