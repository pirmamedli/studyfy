#!/bin/zsh
set -u

cd "$(dirname "$0")" || exit 1
export PATH="$HOME/.local/node/bin:$PATH"

npm run deploy -- "$@"
status=$?

echo
if [ "$status" -eq 0 ]; then
  echo "Deploy finished."
else
  echo "Deploy failed with status $status."
fi

if [ -t 0 ]; then
  echo "Press Enter to close."
  read -r _
fi

exit "$status"
