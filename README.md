# Insta Followers

A static tool that compares followers and following lists from an official Instagram export.

## Privacy

The ZIP or JSON files are processed in the browser. No files, usernames, or credentials are sent to a server. The app does not ask for an Instagram login and is not affiliated with Meta or Instagram.

Only the usernames you mark to ignore are saved locally, in this browser's `localStorage` under `instafollowers.ignoredAccounts.v1`. ZIP files and full follower/following lists are not persisted. Clearing site data removes your preferences; they are not synced between browsers or devices. If browser storage is unavailable, the app keeps changes for the current page session and shows a warning.

## Usage

1. Request an Instagram data export in **JSON** or **HTML** format through Accounts Center.
2. Open the site and upload the complete ZIP file.
3. Review accounts that do not follow you back and accounts you do not follow.
4. In **Do not follow back**, check **Ignore** next to accounts you want to hide. Use **Not ignored**, **Ignored**, or **All** to review or undo your choices. Search and **Copy list** use the currently visible accounts; summary cards and tab counts always show the original export totals.

Ignored accounts remain ignored when you reload the site and import a new ZIP, including accounts absent from an intermediate export. Preferences apply to all ZIPs opened at the same site address in the same browser profile, without separating Instagram accounts. Matching uses usernames, so a renamed account must be marked again.

Open tabs synchronize ignored accounts automatically. Each edit reads the latest saved preferences; browsers supporting the Web Locks API also serialize writes between tabs to preserve simultaneous changes.

## Deployment

The project has no Node.js, database, or backend requirement. Publish the repository as a static site through GitHub Pages, Cloudflare Pages, or Vercel.

The entry point is `index.html`. To test it locally, open it in a browser or serve the directory with any static server.

## Features

- Official Instagram ZIP import in JSON or HTML format.
- Accounts that do not follow you back.
- Accounts you do not follow.
- Username search, profile links, and copying the visible list.
- Ignore checkboxes and filters, with browser-local preferences preserved across imports.

## Browser regression checks

Development only: install Playwright with `python -m pip install playwright` and a browser with `python -m playwright install chromium`, then run `python tests/ignored-accounts.py`. The test also supports a system `chromium` executable. It covers multi-tab additions/removals, stale tabs, simultaneous writes with Web Locks, cleared preferences, reimports, and session choices when writes fail. The app itself needs no Python or Playwright dependency.
