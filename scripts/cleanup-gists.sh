#!/bin/bash

# Cleanup script for deleting shellfied test gists
# Usage: ./cleanup-gists.sh
# Requires: GITHUB_TOKEN environment variable with gist scope

if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN environment variable is not set"
  echo "Create a token at https://github.com/settings/tokens with 'gist' scope"
  exit 1
fi

echo "Fetching gists with description starting with 'shellfied:'..."

# Fetch all gists and filter by description
GISTS=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
  "https://api.github.com/gists?per_page=100" | \
  jq -r '.[] | select(.description | startswith("shellfied:")) | "\(.id) \(.description)"')

if [ -z "$GISTS" ]; then
  echo "No shellfied gists found."
  exit 0
fi

echo ""
echo "Found the following gists to delete:"
echo "-------------------------------------"
echo "$GISTS"
echo "-------------------------------------"
echo ""

read -p "Delete all these gists? (y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "Deleting gists..."

echo "$GISTS" | while read -r line; do
  GIST_ID=$(echo "$line" | awk '{print $1}')
  if [ -n "$GIST_ID" ]; then
    echo "Deleting gist: $GIST_ID"
    curl -s -X DELETE -H "Authorization: token $GITHUB_TOKEN" \
      "https://api.github.com/gists/$GIST_ID"
  fi
done

echo ""
echo "Done!"
