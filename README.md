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

## VM deployment with Docker and the shared Caddy proxy

The project keeps its name, Insta Followers. Its public address is
`https://ufollow.duckdns.org`. Docker serves only the static application with
Nginx; no database, backend, secrets or uploaded-file storage is needed.

Prerequisites: Git, Docker with Compose, the existing external Docker network
`proxy`, and the central Caddy container `reverse-proxy-caddy-1`. DuckDNS must
point to the VM public IP, with ports 80 and 443 reachable by Caddy. Keep any
existing DuckDNS updater running if the IP is dynamic.

### First deployment (after merging this change)

Run as `sysadmin` on the VM. Use a fresh destination; do not overwrite an existing
checkout or local changes.

```sh
cd /srv/apps
git clone https://github.com/vpdiogo/instafollowers.git instafollowers
cd instafollowers
docker network inspect proxy >/dev/null
docker compose config -q
docker compose up -d --build
docker compose ps
```

The application publishes no host ports. Caddy reaches it through the unique
network alias `instafollowers` on port 80. Reserve that alias for this service.

Back up the central Caddyfile, then edit it (do not replace existing site blocks):

```sh
sudo cp -a /srv/proxy/caddy/Caddyfile "/srv/proxy/caddy/Caddyfile.backup-$(date +%Y%m%d-%H%M%S)"
sudo nano /srv/proxy/caddy/Caddyfile
```

Append this block once:

```caddyfile
ufollow.duckdns.org {
    reverse_proxy instafollowers:80
}
```

Validate before reloading. Reload only if validation succeeds:

```sh
docker exec reverse-proxy-caddy-1 caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile &&
docker exec reverse-proxy-caddy-1 caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile
```

Caddy manages HTTPS. Check the public response, then open the site and import a
ZIP to verify results, language switching, filters and saved ignore preferences:

```sh
curl --fail --show-error --head https://ufollow.duckdns.org
```

Preferences from the old Cloudflare Pages address do not transfer automatically:
localStorage is specific to each origin. Keep the old deployment until the new
one is verified. This repository does not modify or deploy the central proxy.

### Updates and troubleshooting

```sh
cd /srv/apps/instafollowers
git pull --ff-only origin main
docker compose up -d --build
docker compose ps
```

To refresh the Nginx base image too, run `docker compose build --pull` before
`docker compose up -d`. Application updates do not require reloading Caddy.

```sh
docker compose logs --tail=50 web
docker logs --tail=50 reverse-proxy-caddy-1
```

If a proxy edit fails validation, correct it or restore the backup before
reloading. To stop only this application, run `docker compose down` from its
checkout; do not stop the central proxy or remove the shared `proxy` network.
