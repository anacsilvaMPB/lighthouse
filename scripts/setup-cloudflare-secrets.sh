#!/usr/bin/env bash
set -euo pipefail

REPO="anacsilvaMPB/lighthouse"

echo "This sets CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID as GitHub Actions secrets on $REPO."
echo "Input is hidden and nothing is printed or logged."
echo

read -rsp "Cloudflare API Token: " CF_API_TOKEN
echo
read -rsp "Cloudflare Account ID: " CF_ACCOUNT_ID
echo

printf '%s' "$CF_API_TOKEN" | gh secret set CLOUDFLARE_API_TOKEN --repo "$REPO"
printf '%s' "$CF_ACCOUNT_ID" | gh secret set CLOUDFLARE_ACCOUNT_ID --repo "$REPO"

unset CF_API_TOKEN CF_ACCOUNT_ID

echo "Done. Secrets are set on $REPO."
