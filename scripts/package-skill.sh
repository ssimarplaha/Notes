#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_root=$(CDPATH= cd -- "$script_dir/.." && pwd)
source_dir="$repo_root/.agents/skills/notion-notes"
package_name="notion-notes-skill"
version=$(cd "$repo_root" && node -e "console.log(require('./package.json').version)" 2>/dev/null || printf "0.1.0")
output_dir="${1:-$repo_root/dist}"
archive="$output_dir/$package_name-$version.tar.gz"

if [ ! -f "$source_dir/SKILL.md" ]; then
  echo "Missing skill source: $source_dir" >&2
  exit 1
fi

mkdir -p "$output_dir"
tar -czf "$archive" -C "$repo_root/.agents/skills" notion-notes

echo "$archive"
