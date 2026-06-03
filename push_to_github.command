#!/bin/bash
# Pushes IndTaxPro to GitHub using YOUR GitHub login on this Mac.
# No credentials are stored in this file.
cd "$(dirname "$0")" || exit 1

REPO="indtaxpro"
VISIBILITY="public"

echo "=== Push IndTaxPro to GitHub ==="
echo "Repo name : $REPO"
echo "Visibility: $VISIBILITY"
echo "Folder    : $(pwd)"
echo ""

if ! git rev-parse HEAD >/dev/null 2>&1; then
  echo "No git commit found in this folder. Aborting."
  read -p "Press Enter to close..."; exit 1
fi

if command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI found. Checking login..."
  if gh auth status >/dev/null 2>&1; then
    if git remote get-url origin >/dev/null 2>&1; then
      echo "Remote already set: $(git remote get-url origin)"
      git push -u origin main && echo "" && echo "Done. Pushed to existing remote."
    else
      echo "Creating $VISIBILITY repo and pushing..."
      gh repo create "$REPO" --"$VISIBILITY" --source=. --remote=origin --push
      echo ""
      echo "Done. URL: $(gh repo view "$REPO" --json url -q .url 2>/dev/null)"
    fi
  else
    echo "GitHub CLI is installed but you are not logged in."
    echo "Run this once, then double-click this file again:"
    echo "    gh auth login"
  fi
else
  echo "GitHub CLI (gh) is not installed on this Mac."
  echo ""
  echo "Option A (recommended):"
  echo "    brew install gh && gh auth login"
  echo "    then double-click this file again."
  echo ""
  echo "Option B (manual): create an EMPTY repo named '$REPO' on github.com"
  echo "(do not add a README), then run, replacing YOUR-USERNAME:"
  echo "    git remote add origin https://github.com/YOUR-USERNAME/$REPO.git"
  echo "    git push -u origin main"
fi

echo ""
read -p "Press Enter to close this window..."
