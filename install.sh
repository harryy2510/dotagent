#!/bin/sh
# POSIX entrypoint: curl -fsSL https://dotagent.dev/install | sh
# AgentSync owns configuration, validation, rendering and native-file backups.
# DotAgent only installs its fragment and the skill directories in the pack.
set -eu
umask 077

REPO=harryy2510/dotagent
REF=${DOTAGENT_REF:-main}
SCOPE= PROJECT= AGENTS= SOURCE= APPLY=
METHOD=auto YES=0 FORCE=0 DRY_RUN=0
WORK= LOCK= USER_LOCK= STAGING= BACKUP=
WRITTEN=0 PRESERVED=0

log() { printf '%s\n' "$*"; }
die() { printf 'Error: %s\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }
stage() { printf '\n[%s/6] %s\n' "$1" "$2"; }
usage() {
  cat <<'EOF'
DotAgent — a guided, non-destructive AgentSync setup.

Usage: sh install.sh [options]
       curl -fsSL https://dotagent.dev/install | sh -s -- [options]

  --user             User scope: ${AGENTSYNC_HOME:-$HOME/.agentsync}
  --project          Project scope: ./.agentsync
  --path DIR         Project root (implies --project); creates it if missing
  --agents LIST      Comma-separated AgentSync names; adds without removing
                     existing agents, and enables the explicitly selected ones
                     Examples: claude,codex,cursor,gemini,opencode,factory
  --method METHOD    auto | brew | binary | go | deb | rpm
                     Existing AgentSync is always reused. auto prefers macOS
                     Homebrew, otherwise a verified ~/.local/bin binary.
                     go requires Go; brew requires Homebrew. No runtime setup.
                     deb/rpm require explicit selection and consent; --yes
                     plus --method deb|rpm grants system-package consent.
  --yes              No prompts. Defaults to user scope and applying.
                     Fresh/empty configurations require explicit --agents.
                     Existing enabled agents are reused when omitted.
  --force            Back up then replace only this pack's fragment/skill paths
  --no-apply         Install and validate canonical files; no native rendering
  --apply            Preview, then apply without a further confirmation
  --dry-run          Read-only plan; no writes, downloads, or dependency commands
  --source DIR       Local DotAgent checkout (contains .agentsync); no pack fetch
                     Offline when AgentSync is already installed
  --ref REF          DotAgent tag, branch, or commit (default: main);
                     does not select the AgentSync version; ignored with --source
  -h, --help         Show this help

Without --yes, choices use Gum if installed, otherwise /dev/tty.
Without a usable terminal, pass --yes (or use --dry-run).
Existing canonical hooks/, mcp/, and memory/AGENTS.md are never rewritten.
AgentSync apply renders all enabled agents and existing canonical components.
--agents adds to that set; it is not an apply-only filter.
EOF
}
value() {
  [ "$#" -ge 2 ] && [ -n "$2" ] || die "$1 requires a value."
  case "$2" in --*) die "$1 requires a value." ;; esac
}
select_scope() {
  [ -z "$SCOPE" ] || [ "$SCOPE" = "$1" ] || die "--user and --project/--path conflict."
  SCOPE=$1
}
while [ "$#" -gt 0 ]; do
  case "$1" in
    --user) select_scope user ;;
    --project) select_scope project ;;
    --path) value "$@"; select_scope project; PROJECT=$2; shift ;;
    --agents) value "$@"; AGENTS=$2; shift ;;
    --method) value "$@"; METHOD=$2; shift ;;
    --source) value "$@"; SOURCE=$2; shift ;;
    --ref) value "$@"; REF=$2; shift ;;
    --yes) YES=1 ;;
    --force) FORCE=1 ;;
    --no-apply) [ "$APPLY" != 1 ] || die "--apply and --no-apply conflict."; APPLY=0 ;;
    --apply) [ "$APPLY" != 0 ] || die "--apply and --no-apply conflict."; APPLY=1 ;;
    --dry-run) DRY_RUN=1 ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unknown option: $1. Use --help for available options." ;;
  esac
  shift
done
case "$METHOD" in auto|brew|binary|go|deb|rpm) ;; *) die "Invalid --method; use auto, brew, binary, go, deb, or rpm." ;; esac
case "$REF" in ''|-*|*[!a-zA-Z0-9._/-]*|*..*) die "Invalid --ref; use a tag, branch, or commit." ;; esac
validate_agents() {
  case "$AGENTS" in
    ''|,*|*,|*,,*|*[!a-z0-9,-]*) die "Use a non-empty comma-separated --agents list of lowercase AgentSync names." ;;
  esac
  # Recognized names are validated by AgentSync, never a second adapter registry.
  old_ifs=$IFS; IFS=,
  for agent in $AGENTS; do
    case "$agent" in -*|[0-9]*) die "Invalid agent name: $agent." ;; esac
  done
  IFS=$old_ifs
}
[ -z "$AGENTS" ] || validate_agents

# Require an actual controlling terminal, not merely an existing /dev/tty node.
# Opening it in a subshell avoids a fatal redirection in shells such as dash.
TTY=0
if [ "$YES" -eq 0 ] && [ "$DRY_RUN" -eq 0 ] && ( : </dev/tty >/dev/tty ) 2>/dev/null; then
  TTY=1
fi
ask() {
  [ "$TTY" -eq 1 ] || die "No interactive terminal. Pass --yes and --agents for a fresh setup."
  printf '%s: ' "$1" >/dev/tty
  IFS= read -r answer </dev/tty || die "Setup cancelled: terminal input closed."
  [ -n "$answer" ] || die "Setup cancelled: no selection."
  printf '%s\n' "$answer"
}
choose() {
  prompt=$1; shift
  if have gum; then
    gum choose --header "$prompt" "$@" </dev/tty 2>/dev/tty || die "Setup cancelled."
  else
    printf '%s\n' "$prompt" >/dev/tty
    for option do printf '  %s\n' "$option" >/dev/tty; done
    ask "Enter one choice"
  fi
}
confirm() {
  if have gum; then
    if gum confirm "$1" </dev/tty >/dev/tty 2>/dev/tty; then return 0
    else
      status=$?
      [ "$status" -eq 1 ] || die "Setup cancelled."
      return 1
    fi
  else
    answer=$(ask "$1 [yes/no]") || exit 1
    case "$answer" in yes|y|YES|Y) return 0 ;; no|n|NO|N) return 1 ;; *) die "Setup cancelled: enter yes or no." ;; esac
  fi
}

# Reject user-controlled symlinks at every path component BEFORE normalizing.
# /tmp and /var are system aliases on macOS; normalize just those known roots.
absolute() {
  case "$1" in /*) candidate=$1 ;; *) candidate="$(pwd -P)/$1" ;; esac
  case "$candidate" in
    /tmp|/tmp/*) if [ -L /tmp ]; then candidate="/private$candidate"; fi ;;
    /var|/var/*) if [ -L /var ]; then candidate="/private$candidate"; fi ;;
  esac
  safe_path "$candidate"
  # Normalize only after checking symlink ancestors. Equivalent spellings must
  # share one lock and cannot evade the source/destination overlap guard.
  printf '%s\n' "$candidate" | awk -F/ '{
    n=0
    for (i=1; i<=NF; i++) {
      if ($i=="" || $i==".") continue
      if ($i=="..") { if (n>0) n--; continue }
      part[++n]=$i
    }
    if (!n) printf "/"
    for (i=1; i<=n; i++) printf "/%s", part[i]
    printf "\n"
  }'
}
safe_path() {
  checked=$1
  case "$checked" in
    /*) ;;
    *) die "An absolute path is required." ;;
  esac
  case "$checked" in *'
'*) die "Paths must not contain line breaks." ;; esac
  if printf '%s' "$checked" | LC_ALL=C grep '[[:cntrl:]]' >/dev/null; then
    die "Paths must not contain control characters."
  fi
  while [ "$checked" != / ] && [ -n "$checked" ]; do
    [ ! -L "$checked" ] || die "Refusing symlink path: $checked"
    checked=${checked%/*}
  done
}
safe_tree() {
  tree=$(absolute "$1") || exit 1
  [ -e "$tree" ] || return 0
  # No symbolic links, devices, sockets or FIFOs: cp must never follow or block.
  unsafe=$(find "$tree" ! -type d ! -type f -print) || die "Cannot inspect $1."
  [ -z "$unsafe" ] || die "Refusing symlink or special file inside $1."
}
cleanup() {
  result=$?
  trap - 0
  # STAGING is exclusively created by this process, never an existing user tree.
  if [ -n "$STAGING" ] && [ -d "$STAGING" ] && [ ! -L "$STAGING" ]; then
    find "$STAGING" -depth -delete 2>/dev/null || :
  fi
  [ -z "$LOCK" ] || rmdir "$LOCK" 2>/dev/null || :
  [ -z "$USER_LOCK" ] || rmdir "$USER_LOCK" 2>/dev/null || :
  case "$WORK" in /tmp/dotagent.*) rm -rf "$WORK" ;; esac
  if [ "$result" -ne 0 ]; then
    printf 'Setup stopped. Existing files are preserved; any completed additions remain safe to rerun.\n' >&2
    [ -z "$BACKUP" ] || printf 'Replacement backups: %s\n' "$BACKUP" >&2
  fi
  exit "$result"
}

log "DotAgent setup"
log "Shared skills and instructions, delivered through AgentSync."
stage 1 "Choose your setup"
if [ "$YES" -eq 0 ] && [ "$DRY_RUN" -eq 0 ] && [ "$TTY" -eq 0 ]; then
  die "No interactive terminal. Pass --yes and --agents for a fresh setup."
fi
if [ -z "$SCOPE" ]; then
  if [ "$YES" -eq 1 ] || [ "$DRY_RUN" -eq 1 ]; then SCOPE=user
  else SCOPE=$(choose "Where should DotAgent be available? user = all projects; project = one repository" user project)
  fi
fi
case "$SCOPE" in user|project) ;; *) die "Choose user or project." ;; esac
[ -n "${HOME:-}" ] || die "HOME is not set."
HOME=$(absolute "$HOME")
safe_path "$HOME"
[ -d "$HOME" ] || die "HOME must be an existing directory."
export HOME
USER_HOME=$(absolute "${AGENTSYNC_HOME:-$HOME/.agentsync}")
safe_path "$USER_HOME"
if [ "$SCOPE" = project ]; then
  PROJECT=$(absolute "${PROJECT:-$(pwd -P)}")
  safe_path "$PROJECT"
  DEST="$PROJECT/.agentsync"
else
  DEST=$USER_HOME
fi
safe_tree "$DEST"
# AgentSync's global state is shared by both scopes. Inspect it as well.
if [ "$DEST" != "$USER_HOME" ]; then safe_tree "$USER_HOME"; fi
AGENTSYNC_HOME=$USER_HOME
AGENTSYNC_NO_UPGRADE_NOTICE=1
AGENTSYNC_ALLOW_SYMLINK_DEST=0
export AGENTSYNC_HOME AGENTSYNC_NO_UPGRADE_NOTICE AGENTSYNC_ALLOW_SYMLINK_DEST
log "Scope: $SCOPE"
log "Canonical destination: $DEST"
if [ -n "$SOURCE" ]; then
  SOURCE=$(absolute "$SOURCE")
  safe_path "$SOURCE"
  SRC="$SOURCE/.agentsync"
  safe_tree "$SRC"
  [ -f "$SRC/memory/fragments/dotagent.md" ] && [ -d "$SRC/skills" ] ||
    die "--source must contain .agentsync/memory/fragments/dotagent.md and .agentsync/skills/."
fi
if [ "$DRY_RUN" -eq 1 ]; then
  stage 2 "Dependency plan (not executed)"
  if have agentsync; then log "Reuse AgentSync on PATH."
  elif [ -x "$HOME/.local/bin/agentsync" ]; then log "Reuse $HOME/.local/bin/agentsync."
  else log "Install AgentSync using $METHOD; no dependency command runs in --dry-run."
  fi
  stage 3 "Source plan (not fetched)"
  log "Pack: ${SOURCE:-https://github.com/$REPO/tree/$REF}"
  stage 4 "Configuration plan (not written)"
  log "Scaffold only a missing agentsync.toml with AgentSync init."
  log "Agents: ${AGENTS:-reuse existing enabled agents; a fresh setup will require --agents}."
  log "Copy the pack fragment and skills; preserve other canonical files."
  if [ "$FORCE" -eq 1 ]; then log "Back up conflicting owned paths before replacement."
  else log "Preserve every existing fragment/skill path."
  fi
  stage 5 "Validation plan (not executed)"
  log "Run AgentSync check, then apply --dry-run unless --no-apply."
  stage 6 "Apply plan (not executed)"
  if [ "$APPLY" = 0 ]; then log "Skip native rendering."
  else log "Apply all enabled agents after a successful preview."
  fi
  log "Dry run complete. No files written, network requests made, or dependencies executed."
  exit 0
fi
if [ -z "$AGENTS" ] && [ ! -f "$DEST/agentsync.toml" ] && [ "$YES" -eq 1 ]; then
  die "A fresh setup requires explicit --agents with --yes (for example --agents claude,codex)."
fi

WORK=$(mktemp -d /tmp/dotagent.XXXXXXXX) || die "Cannot create a private temporary directory."
trap cleanup 0
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

# Serialize all DotAgent runs sharing AgentSync state, plus the destination
# across different HOME values. mkdir fails closed; stale locks are never stolen.
safe_path "$USER_HOME.dotagent-lock"
mkdir -p "$(dirname "$USER_HOME")"
mkdir "$USER_HOME.dotagent-lock" 2>/dev/null ||
  die "Another setup owns $USER_HOME.dotagent-lock. If interrupted, verify no setup is running before removing the empty lock directory."
USER_LOCK="$USER_HOME.dotagent-lock"
if [ "$DEST" != "$USER_HOME" ]; then
  mkdir -p "$PROJECT"
  safe_path "$DEST.dotagent-lock"
  mkdir "$DEST.dotagent-lock" 2>/dev/null || die "Another setup owns $DEST.dotagent-lock."
  LOCK="$DEST.dotagent-lock"
fi

download() {
  have curl || die "curl is required for downloads. Install it yourself or use --source with an existing AgentSync."
  curl --proto '=https' --proto-redir '=https' --tlsv1.2 -fLsS \
    --connect-timeout 15 --max-time 180 --retry 2 "$1" -o "$2" 2>"$WORK/download.log" ||
    die "Download failed. Check your connection and retry; no downloaded program was executed."
}
archive() {
  have tar || die "tar is required to unpack the download."
  tar -tzf "$1" >"$WORK/archive.names" 2>"$WORK/archive.log" ||
    die "Downloaded archive is invalid."
  # Reject path escapes BEFORE extraction, including absolute members.
  awk '/^\// || /(^|\/)\.\.(\/|$)/ || /\\/ { bad=1 } END { exit bad }' "$WORK/archive.names" ||
    die "Archive contains an unsafe path."
  tar -tvzf "$1" >"$WORK/archive.types" 2>"$WORK/archive.log" ||
    die "Cannot inspect downloaded archive."
  awk 'substr($0,1,1)!="-" && substr($0,1,1)!="d" { bad=1 } END { exit bad }' "$WORK/archive.types" ||
    die "Archive contains a symlink, hard link, or special file."
  mkdir "$2"
  tar -xzf "$1" -C "$2" 2>"$WORK/archive.log" || die "Could not extract archive."
  safe_tree "$2"
}
verified_asset() {
  # GoReleaser names archives agentsync_<version>_<os>_<arch>.tar.gz,
  # and native packages agentsync_linux_<arch>.deb|rpm; checksums.txt covers both.
  release=https://github.com/spxrogers/agentsync/releases/latest/download
  download "$release/checksums.txt" "$WORK/checksums.txt"
  if [ "$METHOD" = binary ]; then
    asset=$(awk -v suffix="_${OS}_${ARCH}.tar.gz" '
      $2 ~ /^agentsync_[a-zA-Z0-9._-]+$/ &&
      substr($2,length($2)-length(suffix)+1)==suffix { print $2 }
    ' "$WORK/checksums.txt")
  else asset="agentsync_linux_${ARCH}.${METHOD}"
  fi
  case "$asset" in ''|*[!a-zA-Z0-9._-]*) die "Release checksum manifest has no unique matching asset." ;; esac
  expected=$(awk -v name="$asset" '$2==name { print $1 }' "$WORK/checksums.txt")
  case "$expected" in ''|*[!a-fA-F0-9]*) die "Missing or invalid release checksum." ;; esac
  [ "${#expected}" -eq 64 ] || die "Missing or ambiguous release checksum."
  download "$release/$asset" "$WORK/$asset"
  if have sha256sum; then actual=$(sha256sum "$WORK/$asset")
  elif have shasum; then actual=$(shasum -a 256 "$WORK/$asset")
  else die "SHA-256 verification requires sha256sum or shasum; nothing was installed."
  fi
  actual=${actual%% *}
  [ "$actual" = "$expected" ] || die "SHA-256 checksum mismatch; refusing to install AgentSync."
  log "Verified official AgentSync release asset (SHA-256)."
}
ensure_agentsync() {
  if have agentsync; then AS=$(command -v agentsync); log "Reusing AgentSync: $AS"; return; fi
  safe_path "$HOME/.local/bin/agentsync"
  if [ -x "$HOME/.local/bin/agentsync" ] && [ -f "$HOME/.local/bin/agentsync" ]; then
    AS="$HOME/.local/bin/agentsync"; log "Reusing AgentSync: $AS"; return
  fi
  OS=$(uname -s); ARCH=$(uname -m)
  case "$OS" in Darwin) OS=darwin ;; Linux) OS=linux ;; *) die "This POSIX installer supports macOS/Linux. On Windows, install AgentSync with Scoop or Chocolatey." ;; esac
  case "$ARCH" in x86_64|amd64) ARCH=amd64 ;; arm64|aarch64) ARCH=arm64 ;; *) die "No official binary for this architecture. Install AgentSync from source first." ;; esac
  if [ "$METHOD" = auto ]; then
    if [ "$TTY" -eq 1 ]; then
      METHOD=$(choose "Install AgentSync: binary = ~/.local/bin; brew/go require existing tools; deb/rpm = system packages" binary brew go deb rpm)
    elif [ "$OS" = darwin ] && have brew; then METHOD=brew
    else METHOD=binary
    fi
  fi
  log "Dependency method: $METHOD"
  case "$METHOD" in
    brew)
      [ "$OS" = darwin ] || die "The official Homebrew cask supports macOS; choose binary or go on Linux."
      have brew || die "Homebrew is not installed. Choose --method binary, or install Homebrew yourself."
      brew tap spxrogers/tap </dev/null >"$WORK/dependency.log" 2>&1 &&
        brew install agentsync </dev/null >>"$WORK/dependency.log" 2>&1 || die "Homebrew could not install AgentSync. Run brew install agentsync to diagnose."
      have agentsync || die "Homebrew finished, but agentsync is not on PATH. Update PATH and rerun."
      AS=$(command -v agentsync)
      ;;
    binary|go)
      BIN="$HOME/.local/bin"
      safe_path "$BIN/agentsync"
      [ ! -e "$BIN/agentsync" ] || die "$BIN/agentsync already exists and is not executable; move it aside yourself."
      if [ "$METHOD" = binary ]; then
        verified_asset
        archive "$WORK/$asset" "$WORK/binary"
        [ -f "$WORK/binary/agentsync" ] || die "Release archive is missing agentsync."
        chmod 755 "$WORK/binary/agentsync"
        BUILT="$WORK/binary/agentsync"
      else
        have go || die "Go is not installed. Choose --method binary, or install Go yourself."
        mkdir "$WORK/gobin"
        GOBIN="$WORK/gobin" GOTOOLCHAIN=local GIT_TERMINAL_PROMPT=0 go install github.com/spxrogers/agentsync/cmd/agentsync@latest \
          </dev/null >"$WORK/dependency.log" 2>&1 || die "Go could not build AgentSync. Check your installed Go version; no toolchain was installed."
        BUILT="$WORK/gobin/agentsync"
        [ -f "$BUILT" ] || die "Go did not produce an AgentSync executable."
      fi
      mkdir -p "$BIN"
      STAGING=$(mktemp -d "$BIN/.dotagent-staging.XXXXXXXX") || die "Cannot stage the AgentSync executable."
      cp "$BUILT" "$STAGING/agentsync"
      chmod 755 "$STAGING/agentsync"
      mv "$STAGING/agentsync" "$BIN/agentsync"
      rmdir "$STAGING"
      STAGING=
      AS="$BIN/agentsync"
      log "Installed $AS. Add $BIN to PATH for future AgentSync commands."
      ;;
    deb|rpm)
      [ "$OS" = linux ] || die "--method $METHOD is only available on Linux."
      if [ "$METHOD" = deb ]; then PKG=dpkg; else PKG=rpm; fi
      have "$PKG" || die "$PKG is not installed; choose --method binary."
      if [ "$YES" -ne 1 ]; then
        confirm "Install the official $METHOD package system-wide with administrator privileges?" ||
          die "System-package installation cancelled."
      fi
      log "System-package consent: --method $METHOD; administrator privileges may be required."
      verified_asset
      if [ "$(id -u)" -eq 0 ]; then
        "$PKG" -i "$WORK/$asset" >"$WORK/dependency.log" 2>&1 ||
          die "System-package installation failed; use $PKG to inspect package status."
      else
        have sudo || die "sudo is required for --method $METHOD; choose --method binary."
        if [ "$YES" -eq 1 ]; then
          sudo -n "$PKG" -i "$WORK/$asset" >"$WORK/dependency.log" 2>&1 ||
            die "System-package installation failed. --yes never prompts for sudo; arrange privileges or choose binary."
        else
          sudo "$PKG" -i "$WORK/$asset" </dev/tty >"$WORK/dependency.log" 2>&1 ||
            die "System-package installation failed; use $PKG to inspect package status."
        fi
      fi
      have agentsync || die "Package installed, but agentsync is not on PATH."
      AS=$(command -v agentsync)
      ;;
    *) die "Invalid dependency method." ;;
  esac
}
stage 2 "Prepare AgentSync"
ensure_agentsync
as_scope() {
  if [ "$SCOPE" = project ]; then
    "$AS" "$@" --scope project --project "$PROJECT" --no-input --color never
  else
    "$AS" "$@" --scope user --no-input --color never
  fi
}
run_as() {
  # Raw diagnostics can quote invalid TOML and secrets. Keep them private and
  # ephemeral; never cat configuration or third-party error output into logs.
  as_scope "$@" >"$WORK/agentsync.log" 2>&1 ||
    die "AgentSync '$*' failed. No further steps ran. Diagnose with agentsync $* --scope $SCOPE${PROJECT:+ --project \"$PROJECT\"}."
}

stage 3 "Prepare the DotAgent pack"
if [ -z "$SOURCE" ]; then
  log "Downloading $REPO at $REF."
  download "https://github.com/$REPO/archive/$REF.tar.gz" "$WORK/pack.tar.gz"
  archive "$WORK/pack.tar.gz" "$WORK/pack"
  set -- "$WORK/pack"/*
  [ "$#" -eq 1 ] && [ -d "$1" ] || die "Expected one repository in the pack archive."
  SRC="$1/.agentsync"
fi
safe_tree "$SRC"
[ -f "$SRC/memory/fragments/dotagent.md" ] && [ -d "$SRC/skills" ] ||
  die "The pack is missing its fragment or skills directory."
skill_count=0
for skill in "$SRC/skills"/* "$SRC/skills"/.[!.]* "$SRC/skills"/..?*; do
  [ -e "$skill" ] || continue
  name=${skill##*/}
  case "$name" in ''|.*|*[!a-zA-Z0-9_-]*) die "Unsafe skill directory name in pack." ;; esac
  [ -d "$skill" ] && [ -f "$skill/SKILL.md" ] || die "Each pack skill must be a directory containing SKILL.md."
  skill_count=$((skill_count + 1))
done
[ "$skill_count" -gt 0 ] || die "The pack contains no skills."
# A source cannot also be the destination: --force must never move its input.
case "$SRC/" in "$DEST/"*) die "Source must be outside the installation destination." ;; esac
case "$DEST/" in "$SRC/"*) die "Destination must be outside the source pack." ;; esac
log "Ready: one memory fragment and $skill_count skills (including bundled files)."

stage 4 "Configure agents and install the pack"
# init refuses any populated canonical tree. Always scaffold privately, and
# copy ONLY a missing config; canonical hooks/MCP/base memory stay untouched.
mkdir "$WORK/scaffold"
if [ "$SCOPE" = project ]; then
  AGENTSYNC_HOME="$WORK/scaffold-user" "$AS" init --scope project --project "$WORK/scaffold" --no-input --color never \
    >"$WORK/agentsync.log" 2>&1 || die "AgentSync init failed; update AgentSync and retry."
  STUB="$WORK/scaffold/.agentsync"
else
  AGENTSYNC_HOME="$WORK/scaffold/.agentsync" "$AS" init --scope user --no-input --color never \
    >"$WORK/agentsync.log" 2>&1 || die "AgentSync init failed; update AgentSync and retry."
  STUB="$WORK/scaffold/.agentsync"
fi
if [ -f "$DEST/agentsync.toml" ]; then
  run_as agent list
  existing=$(awk '/^[a-z][a-z0-9-]*[[:space:]]+enabled=true([[:space:]]|$)/ { print $1 }' "$WORK/agentsync.log" | paste -sd, -)
else existing=
fi
if [ -z "$AGENTS" ]; then
  if [ -n "$existing" ]; then
    log "Reusing enabled agents: $existing"
  elif [ "$YES" -eq 1 ]; then
    die "No enabled agents are configured. Pass explicit --agents with --yes."
  elif have gum; then
    AGENTS=$(gum choose --no-limit --header "Select your agents (space to toggle, enter to continue)" \
      claude codex cursor gemini opencode factory </dev/tty 2>/dev/tty) || die "Agent selection cancelled."
    AGENTS=$(printf '%s\n' "$AGENTS" | paste -sd, -)
    validate_agents
  else
    AGENTS=$(ask "Agents, comma-separated (claude,codex,cursor,gemini,opencode,factory; other AgentSync names accepted)")
    validate_agents
  fi
fi
# Validate names with native agent add in the disposable scaffold before the
# first canonical write, so an unsupported name cannot leave partial config.
if [ -n "$AGENTS" ]; then
  old_ifs=$IFS; IFS=,
  for agent in $AGENTS; do
    if [ "$SCOPE" = project ]; then
      AGENTSYNC_HOME="$WORK/scaffold-user" "$AS" agent add "$agent" --project "$WORK/scaffold" --no-input --color never \
        >"$WORK/agentsync.log" 2>&1 || die "AgentSync could not register '$agent'. Check agentsync agent list --all or update AgentSync."
    else
      AGENTSYNC_HOME="$STUB" "$AS" agent add "$agent" --scope user --no-input --color never \
        >"$WORK/agentsync.log" 2>&1 || die "AgentSync could not register '$agent'. Check agentsync agent list --all or update AgentSync."
    fi
  done
  IFS=$old_ifs
fi
# Both scopes keep native-file backups in the user source's .state directory.
# Private init does not transfer this protection to a populated source for us.
# Keep existing ignore rules, with the protective rule last even after negations.
safe_tree "$USER_HOME"
mkdir -p "$USER_HOME"
state_ignore="$USER_HOME/.gitignore"
[ ! -e "$state_ignore" ] || [ -f "$state_ignore" ] || die "AgentSync .gitignore must be a regular file."
if [ ! -e "$state_ignore" ] && [ "$SCOPE" = user ] && [ -f "$STUB/.gitignore" ]; then
  cp "$STUB/.gitignore" "$state_ignore" || die "Cannot preserve AgentSync's state ignore rules."
fi
if [ ! -f "$state_ignore" ] || [ "$(tail -n 1 "$state_ignore")" != '/.state/' ]; then
  printf '\n# AgentSync local state and plaintext backups must stay private.\n/.state/\n' >>"$state_ignore" ||
    die "Cannot protect AgentSync's local state from accidental commits."
fi
safe_tree "$DEST"
mkdir -p "$DEST/memory/fragments" "$DEST/skills"
if [ ! -e "$DEST/agentsync.toml" ]; then
  [ -f "$STUB/agentsync.toml" ] || die "AgentSync init did not create agentsync.toml."
  cp "$STUB/agentsync.toml" "$DEST/agentsync.toml"
  log "Created the missing config using AgentSync init."
else
  [ -f "$DEST/agentsync.toml" ] || die "agentsync.toml must be a regular file."
  log "Preserved existing config; only explicitly selected agent registrations may change."
fi
if [ -n "$AGENTS" ]; then
  old_ifs=$IFS; IFS=,
  for agent in $AGENTS; do
    run_as agent add "$agent"
    run_as agent enable "$agent"
  done
  IFS=$old_ifs
fi
run_as agent list
enabled=$(awk '/^[a-z][a-z0-9-]*[[:space:]]+enabled=true([[:space:]]|$)/ { print $1 }' "$WORK/agentsync.log" | paste -sd, -)
[ -n "$enabled" ] || die "AgentSync reported no enabled agents; pack installation stopped."
log "Enabled agents: $enabled"

# Stage on the destination filesystem before moving any existing owned item.
# Backup dirs sit OUTSIDE .agentsync: copied old skills must not be reloaded.
STAGING=$(mktemp -d "$DEST/.dotagent-staging.XXXXXXXX") || die "Cannot stage pack files."
copy_owned() {
  from=$1; relative=$2; target="$DEST/$relative"
  safe_tree "$target"
  if [ -e "$target" ] && [ "$FORCE" -eq 0 ]; then
    PRESERVED=$((PRESERVED + 1)); return
  fi
  incoming="$STAGING/item"
  cp -Rp "$from" "$incoming" || die "Cannot stage $relative; existing content is unchanged."
  previous=
  if [ -e "$target" ]; then
    if [ -z "$BACKUP" ]; then
      BACKUP=$(mktemp -d "$DEST.dotagent-backup.XXXXXXXX") || die "Cannot create replacement backup."
      # Moving a file invalidates path-specific ignore rules at its old location.
      # Protect the whole backup before moving any potentially private content.
      printf '*\n' >"$BACKUP/.gitignore" || die "Cannot protect replacement backups from accidental commits."
      log "Replacement backups: $BACKUP"
    fi
    previous="$BACKUP/$relative"
    mkdir -p "$(dirname "$previous")"
    mv "$target" "$previous" || die "Cannot back up $relative; replacement stopped."
  fi
  if ! mv "$incoming" "$target"; then
    [ -z "$previous" ] || mv "$previous" "$target" ||
      die "Replacement failed; restore $relative from $BACKUP."
    die "Could not install $relative; previous content was restored."
  fi
  WRITTEN=$((WRITTEN + 1))
}
copy_owned "$SRC/memory/fragments/dotagent.md" memory/fragments/dotagent.md
for skill in "$SRC/skills"/*; do
  copy_owned "$skill" "skills/${skill##*/}"
done
log "Pack paths: $WRITTEN installed, $PRESERVED preserved."
log "Canonical hooks/, mcp/, and memory/AGENTS.md were left untouched."

stage 5 "Validate and preview"
run_as check
log "AgentSync check passed."
if [ "$APPLY" != 0 ]; then
  run_as apply --dry-run
  # AgentSync owns the destination map. Its preview lists absolute operation
  # paths; check the ancestors of every path it will change (a leaf-only
  # symlink check is insufficient for a linked ~/.claude/ directory). Paths
  # already "synced" are not touched, so a user's own linked skill folder is
  # left alone. Never duplicate the adapter registry.
  awk '$2=="write" || $2=="delete" || $2=="remove" {
    operation=$2
    sub(/^[[:space:]]*[^[:space:]]+[[:space:]]+[^[:space:]]+[[:space:]]+/, "")
    print operation "\t" $0
  }' "$WORK/agentsync.log" >"$WORK/destinations"
  log "Native file changes (configuration values are not displayed):"
  while IFS="$(printf '\t')" read -r operation native_path; do
    absolute "$native_path" >/dev/null
    log "  $operation: $native_path"
  done <"$WORK/destinations"
  # Emit the summary and validated paths, never raw configuration diagnostics.
  awk '/^Plan: [0-9]+ ops total across [0-9]+ agent/ { print }' "$WORK/agentsync.log"
  log "AgentSync preview passed. Applying renders all enabled agents and existing canonical components."
  if [ -z "$APPLY" ]; then
    if [ "$YES" -eq 1 ]; then APPLY=1
    elif confirm "Apply this validated configuration to your agents now?"; then APPLY=1
    else APPLY=0
    fi
  fi
fi
stage 6 "Finish"
if [ "$APPLY" = 1 ]; then
  safe_tree "$DEST"
  if [ "$DEST" != "$USER_HOME" ]; then safe_tree "$USER_HOME"; fi
  while IFS="$(printf '\t')" read -r operation native_path; do
    absolute "$native_path" >/dev/null
  done <"$WORK/destinations"
  # --no-input lets AgentSync honor configured backup policy without hidden
  # prompts. We deliberately do not use --no-git-backup or disable backups.
  run_as apply
  log "AgentSync apply completed. Native-file collision backups are managed by AgentSync."
else
  log "Native rendering skipped. Your canonical DotAgent pack is installed and validated."
fi
log ""
log "DotAgent is ready."
log "  Scope: $SCOPE"
log "  Source of truth: $DEST"
log "  Agents: $enabled"
log "  Pack: $WRITTEN installed, $PRESERVED preserved"
[ -z "$BACKUP" ] || log "  Backups: $BACKUP"
log "Review or apply later:"
if [ "$SCOPE" = project ]; then
  log "  \"$AS\" apply --project \"$PROJECT\" --dry-run"
  log "  \"$AS\" apply --project \"$PROJECT\""
else
  log "  AGENTSYNC_HOME=\"$USER_HOME\" \"$AS\" apply --scope user --dry-run"
  log "  AGENTSYNC_HOME=\"$USER_HOME\" \"$AS\" apply --scope user"
fi
log "Agent runtimes are not installed. Translation support varies; inspect AgentSync's preview for per-agent details."
log "Powered by AgentSync — https://github.com/spxrogers/agentsync"
