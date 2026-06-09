#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_root=$(CDPATH= cd -- "$script_dir/.." && pwd)
source_dir="$repo_root/.agents/skills/notion-notes"
target_root="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
target_dir="$target_root/notion-notes"

if [ ! -f "$source_dir/SKILL.md" ]; then
  echo "Missing skill source: $source_dir" >&2
  exit 1
fi

mkdir -p "$target_root"
rm -rf "$target_dir"
cp -R "$source_dir" "$target_dir"

echo "Installed notion-notes into $target_dir"
