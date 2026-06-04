#!/usr/bin/env bash
# Prefer Bun and modern Node; skip broken Homebrew Node 9 on /usr/local/bin.
sanitize_path() {
  local part
  local cleaned=""
  local raw="${1:-$PATH}"
  local prefix="${HOME}/.bun/bin:/opt/homebrew/bin:/opt/homebrew/opt/node@22/bin:/usr/local/opt/node@22/bin:/usr/local/opt/node@20/bin"

  while IFS= read -r part; do
    [[ -z "$part" ]] && continue
    case "$part" in
      /usr/local/bin | /usr/local/Cellar/node/* | /usr/local/Cellar/node@9/*)
        continue
        ;;
    esac
    if [[ -z "$cleaned" ]]; then
      cleaned="$part"
    else
      cleaned="${cleaned}:$part"
    fi
  done < <(printf '%s\n' "${raw//:/$'\n'}")

  if [[ -n "$cleaned" ]]; then
    PATH="${prefix}:${cleaned}"
  else
    PATH="$prefix"
  fi
  export PATH
}

sanitize_path
