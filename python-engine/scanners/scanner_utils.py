"""Shared helpers for safer, broader in-scope web probes."""
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
import json
import re
import requests


COMMON_PATHS = [
    "/",
    "/login",
    "/admin",
    "/dashboard",
    "/robots.txt",
    "/api/status",
    "/backup/debug",
    "/surface/profile/alice",
    "/surface/profile/1",
    "/surface/api/users/alice",
    "/surface/admin/users",
    "/surface/banking/login",
    "/surface/db/console",
    "/surface/component-report",
    "/surface/update",
    "/surface/audit",
    "/surface/audit/export",
    "/surface/comments",
    "/surface/upload",
]

COMMON_CREDS = [
    ("admin", "admin123"),
    ("alice", "password123"),
    ("user", "password"),
    ("test", "test"),
]

USER_AGENT = "SaSa-Scanner/1.1 (+authorized security audit)"
_SURFACE_CACHE = {}


class LinkAndFormParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = set()
        self.forms = []
        self._form = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and attrs.get("href"):
            self.links.add(attrs["href"])
        elif tag in ("script", "link") and (attrs.get("src") or attrs.get("href")):
            self.links.add(attrs.get("src") or attrs.get("href"))
        elif tag == "form":
            self._form = {
                "action": attrs.get("action") or "",
                "method": (attrs.get("method") or "GET").upper(),
                "inputs": set(),
            }
        elif tag in ("input", "textarea", "select") and self._form is not None:
            name = attrs.get("name")
            if name:
                self._form["inputs"].add(name)

    def handle_endtag(self, tag):
        if tag == "form" and self._form is not None:
            self._form["inputs"] = list(self._form["inputs"])
            self.forms.append(self._form)
            self._form = None


def base_url(url):
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


def same_origin(url, candidate):
    try:
        return urlparse(url).netloc == urlparse(candidate).netloc
    except Exception:
        return False


def new_session():
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    return session


def try_authenticate(session, url):
    """Try common training-app credentials; returns a short auth note or None."""
    base = base_url(url)
    login_paths = ["/login", "/", "/surface/banking/login"]
    for path in login_paths:
        target = urljoin(base, path)
        for username, password in COMMON_CREDS:
            try:
                res = session.post(
                    target,
                    data={"username": username, "password": password},
                    timeout=2,
                    allow_redirects=True,
                )
                text = res.text.lower()
                success = (
                    res.url.rstrip("/") != target.rstrip("/")
                    or "logout" in text
                    or "dashboard" in text
                    or "company workspace" in text
                    or "welcome" in text
                )
                if success and "invalid" not in text and "login failed" not in text:
                    return f"{username}:{password} accepted at {path}"
            except Exception:
                continue
    return None


def parse_html(html):
    parser = LinkAndFormParser()
    try:
        parser.feed(html or "")
    except Exception:
        pass
    return parser


def discover_attack_surface(url, limit=80):
    """Crawl shallow same-origin links, forms, robots hints, and simple JSON URLs."""
    if url in _SURFACE_CACHE:
        return _SURFACE_CACHE[url]

    session = new_session()
    auth_note = try_authenticate(session, url)
    base = base_url(url)
    queue = []
    seen = set()
    pages = []
    forms = []

    for path in COMMON_PATHS:
        queue.append(urljoin(base, path))
    queue.append(url)

    while queue and len(seen) < limit:
        target = queue.pop(0)
        if target in seen or not same_origin(base, target):
            continue
        seen.add(target)
        try:
            res = session.get(target, timeout=2, allow_redirects=True)
        except Exception:
            continue

        content_type = res.headers.get("content-type", "")
        text = res.text or ""
        pages.append({"url": target, "status": res.status_code, "text": text, "headers": dict(res.headers)})

        if "text/html" in content_type or "<html" in text.lower() or "<form" in text.lower():
            parser = parse_html(text)
            for link in parser.links:
                absolute = urljoin(target, link)
                if same_origin(base, absolute) and absolute not in seen:
                    queue.append(absolute.split("#", 1)[0])
            for form in parser.forms:
                action = urljoin(target, form["action"])
                forms.append({**form, "url": action})

        if target.endswith("/robots.txt"):
            for match in re.findall(r"(?im)^(?:allow|disallow|sitemap):\s*(\S+)", text):
                absolute = urljoin(base, match)
                if same_origin(base, absolute) and absolute not in seen:
                    queue.append(absolute)

        if "application/json" in content_type or text.lstrip().startswith(("{", "[")):
            try:
                data = json.loads(text)
                blob = json.dumps(data)
                for match in re.findall(r'"/[^"\s]{2,}"', blob):
                    absolute = urljoin(base, match.strip('"'))
                    if same_origin(base, absolute) and absolute not in seen:
                        queue.append(absolute)
            except Exception:
                pass

    surface = {
        "session": session,
        "auth_note": auth_note,
        "base": base,
        "urls": list(seen),
        "pages": pages,
        "forms": forms,
    }
    _SURFACE_CACHE[url] = surface
    return surface
