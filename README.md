# Insta Followers

A static tool that compares followers and following lists from an official Instagram export.

## Privacy

The ZIP or JSON files are processed in the browser. No files, usernames, or credentials are sent to a server. The app does not ask for an Instagram login and is not affiliated with Meta or Instagram.

## Usage

1. Request an Instagram data export in **JSON** format through Accounts Center.
2. Open the site and upload the complete ZIP file.
3. Review accounts that do not follow you back and accounts you do not follow.

## Deployment

The project has no Node.js, database, or backend requirement. Publish the repository as a static site through GitHub Pages, Cloudflare Pages, or Vercel.

The entry point is `index.html`. To test it locally, open it in a browser or serve the directory with any static server.

## Features

- Official Instagram ZIP import.
- Accounts that do not follow you back.
- Accounts you do not follow.
- Username search, profile links, and copying the visible list.
