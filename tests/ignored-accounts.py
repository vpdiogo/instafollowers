"""Browser regression checks: python tests/ignored-accounts.py (requires Playwright)."""

import io
import json
import shutil
import threading
import zipfile
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
KEY = "instafollowers.ignoredAccounts.v1"


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def archive():
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as export:
        export.writestr("followers_1.json", "[]")
        export.writestr("following.json", json.dumps({
            "relationships_following": [
                {"string_list_data": [{"value": user}]}
                for user in ["ana", "bob", "carol"]
            ]
        }))
    return {"name": "instagram.zip", "mimeType": "application/zip", "buffer": buffer.getvalue()}


def upload(page, url):
    page.goto(url)
    page.locator("#files").set_input_files(archive())
    expect(page.locator("#results-screen")).to_be_visible()
    page.locator("#ignore-filter").select_option("all")


def checkbox(page, user):
    return page.get_by_role("checkbox", name=f"Ignorar @{user}", exact=True)


def saved(page, users):
    page.wait_for_function(
        "([key, expected]) => JSON.stringify(JSON.parse(localStorage.getItem(key) || '[]').sort()) === JSON.stringify(expected)",
        arg=[KEY, sorted(users)],
    )


def check(browser, url, *, without_locks=False):
    context = browser.new_context()
    context.route("https://fonts.googleapis.com/**", lambda route: route.abort())
    context.add_init_script("window.addEventListener('storage', event => { if (window.blockStorageEvents) event.stopImmediatePropagation(); }, {capture: true})")
    if without_locks:
        context.add_init_script("Object.defineProperty(navigator, 'locks', {value: undefined})")
    first, second = context.new_page(), context.new_page()
    errors = []
    for page in [first, second]:
        page.on("pageerror", lambda error: errors.append(str(error)))
        upload(page, url)

    checkbox(first, "ana").click()
    expect(checkbox(second, "ana")).to_be_checked()
    checkbox(second, "bob").click()
    saved(first, ["ana", "bob"])
    expect(checkbox(first, "bob")).to_be_checked()
    checkbox(first, "ana").click()
    saved(second, ["bob"])
    expect(checkbox(second, "ana")).not_to_be_checked()

    # A stale tab must merge the latest persisted state before writing,
    # even if its storage-event listener has not processed an update.
    second.evaluate("window.blockStorageEvents = true")
    checkbox(first, "carol").click()
    saved(first, ["bob", "carol"])
    expect(checkbox(second, "carol")).not_to_be_checked()
    checkbox(second, "ana").click()
    saved(first, ["ana", "bob", "carol"])

    # Reloading and importing again must preserve all merged choices.
    upload(second, url)
    for user in ["ana", "bob", "carol"]:
        expect(checkbox(second, user)).to_be_checked()

    # Removing the key or clearing site data must update the other tab.
    first.evaluate("key => localStorage.removeItem(key)", KEY)
    for user in ["ana", "bob", "carol"]:
        expect(checkbox(second, user)).not_to_be_checked()
    checkbox(second, "bob").click()
    expect(checkbox(first, "bob")).to_be_checked()
    first.evaluate("localStorage.clear()")
    expect(checkbox(second, "bob")).not_to_be_checked()

    if not without_locks:
        # Hold the shared lock while both tabs enqueue changes, then release.
        # Both changes must survive regardless of which tab writes first.
        first.evaluate("key => { window.lockHeld = false; navigator.locks.request(key, async () => { window.lockHeld = true; await new Promise(resolve => { window.releaseLock = resolve; }); }); }", KEY)
        first.wait_for_function("window.lockHeld")
        checkbox(first, "ana").click()
        checkbox(second, "carol").click()
        first.evaluate("window.releaseLock()")
        saved(first, ["ana", "carol"])
        expect(checkbox(second, "ana")).to_be_checked()
        expect(checkbox(first, "carol")).to_be_checked()

    # A failed write must keep session choices across subsequent edits.
    upload(first, url)
    first.evaluate("() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; }")
    checkbox(first, "bob").click()
    expect(first.locator("#storage-warning")).to_be_visible()
    checkbox(first, "bob").click()
    expect(checkbox(first, "bob")).not_to_be_checked()
    checkbox(first, "bob").click()
    expect(checkbox(first, "bob")).to_be_checked()
    first.locator("#restart").click()
    first.locator("#files").set_input_files(archive())
    first.locator("#ignore-filter").select_option("all")
    expect(checkbox(first, "bob")).to_be_checked()
    assert not errors, errors
    context.close()
    print(f"PASS: multi-tab persistence, stale state, deletions, reload, write failures (without_locks={without_locks})")


if __name__ == "__main__":
    with ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(ROOT))) as server:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as playwright:
                options = {"headless": True}
                if executable := shutil.which("chromium"):
                    options["executable_path"] = executable
                browser = playwright.chromium.launch(**options)
                try:
                    url = f"http://127.0.0.1:{server.server_port}"
                    check(browser, url)
                    check(browser, url, without_locks=True)
                finally:
                    browser.close()
        finally:
            server.shutdown()
