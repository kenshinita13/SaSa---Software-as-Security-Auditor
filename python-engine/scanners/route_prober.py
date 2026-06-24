"""Route prober - discovers exposed admin panels, debug endpoints, and sensitive files (A01, A04)."""
import requests
from classifiers.owasp_mapper import OWASPMapper
from scanners.scanner_utils import discover_attack_surface

# Comprehensive wordlist of sensitive paths
ADMIN_PATHS = [
    '/admin', '/admin/', '/admin/login', '/admin-panel', '/administrator',
    '/wp-admin', '/wp-login.php', '/phpmyadmin', '/cpanel',
    '/manager', '/management', '/console', '/dashboard/admin',
]

API_PATHS = [
    '/api', '/api/v1', '/api/users', '/api/admin', '/api/internal',
    '/api/debug', '/api/config', '/api/health', '/api/status',
    '/graphql', '/graphiql',
]

DEBUG_PATHS = [
    '/debug', '/debug/vars', '/trace', '/metrics', '/prometheus',
    '/server-status', '/server-info', '/_debug', '/actuator',
    '/actuator/health', '/actuator/env',
    '/elmah.axd', '/phpinfo.php',
]

SENSITIVE_FILES = [
    '/.env', '/.env.local', '/.env.production',
    '/.git/HEAD', '/.git/config',
    '/robots.txt', '/sitemap.xml',
    '/.htaccess', '/web.config',
    '/wp-config.php', '/config.php', '/config.json',
    '/package.json', '/composer.json',
    '/backup.sql', '/dump.sql', '/database.sql',
    '/.DS_Store', '/Thumbs.db',
    '/crossdomain.xml', '/clientaccesspolicy.xml',
]

def probe_routes(url):
    findings = []
    base_url = url.rstrip('/')
    surface = discover_attack_surface(url)

    # Admin / internal routes
    for path in ADMIN_PATHS:
        try:
            target = f"{base_url}{path}"
            res = requests.get(target, timeout=3, allow_redirects=False)
            if res.status_code == 200:
                findings.append(OWASPMapper.map_finding(
                    'A04',
                    f'Unauthenticated Admin/Management Panel',
                    f'The route {path} is accessible without authentication, indicating insecure design.',
                    f'{path} -> HTTP {res.status_code}'
                ))
        except Exception:
            pass

    # API endpoints
    for path in API_PATHS:
        try:
            target = f"{base_url}{path}"
            res = requests.get(target, timeout=3, allow_redirects=False)
            if res.status_code == 200:
                body = res.text.lower()
                # Check if it returns user data or sensitive info
                if any(w in body for w in ['password', 'email', 'token', 'secret', 'user', 'admin']):
                    findings.append(OWASPMapper.map_finding(
                        'A01',
                        f'Sensitive Data Exposed via API',
                        f'The endpoint {path} returns potentially sensitive data without authorization.',
                        f'{path} -> Response contains sensitive fields'
                    ))
        except Exception:
            pass

    # Debug endpoints
    for path in DEBUG_PATHS:
        try:
            target = f"{base_url}{path}"
            res = requests.get(target, timeout=3, allow_redirects=False)
            if res.status_code == 200 and len(res.text) > 50:
                findings.append(OWASPMapper.map_finding(
                    'A05',
                    f'Debug/Status Endpoint Exposed',
                    f'The debug endpoint {path} is accessible publicly, leaking internal application state.',
                    f'{path} -> HTTP 200 ({len(res.text)} bytes)'
                ))
        except Exception:
            pass

    # Sensitive files
    for path in SENSITIVE_FILES:
        try:
            target = f"{base_url}{path}"
            res = requests.get(target, timeout=3, allow_redirects=False)
            if res.status_code == 200 and len(res.text) > 10:
                body = res.text
                category = 'A05'
                title = f'Sensitive File Exposed: {path}'
                desc = f'The file {path} is publicly accessible.'

                if '.env' in path and any(k in body for k in ['DB_', 'SECRET', 'KEY', 'PASSWORD', 'TOKEN']):
                    category = 'A02'
                    title = f'Environment File Exposed ({path})'
                    desc = f'Environment variables containing secrets are publicly accessible at {path}.'
                elif '.git' in path:
                    category = 'A05'
                    title = 'Git Repository Metadata Exposed'
                    desc = 'The .git directory is accessible, allowing source code theft.'
                elif 'package.json' in path and 'dependencies' in body:
                    category = 'A06'
                    title = 'Exposed package.json (Dependency Disclosure)'
                    desc = 'Project dependencies are visible, allowing attackers to identify vulnerable components.'
                elif '.sql' in path or 'backup' in path:
                    category = 'A02'
                    title = 'Database Dump Exposed'
                    desc = f'A database backup file is publicly accessible at {path}.'

                findings.append(OWASPMapper.map_finding(category, title, desc, f'{path} -> HTTP 200'))
        except Exception:
            pass

    for page in surface["pages"]:
        path = page["url"].replace(surface["base"], "") or "/"
        text = page["text"].lower()
        if path == "/robots.txt" and any(p in text for p in ["/backup", "/admin", "/debug", "/api/"]):
            findings.append(OWASPMapper.map_finding(
                'A05',
                'Sensitive Routes Disclosed in robots.txt',
                'robots.txt exposes administrative, backup, debug, or API routes that should not be advertised.',
                f'{path} -> HTTP {page["status"]}'
            ))
        if path.startswith("/api/") and page["status"] == 200 and any(w in text for w in ['password', 'token', 'secret', 'admin', 'debug', 'surfaces']):
            findings.append(OWASPMapper.map_finding(
                'A01',
                'API Endpoint Exposes Internal Data',
                f'The endpoint {path} returns internal service or user information without strong access control.',
                f'{path} -> response contains sensitive keywords'
            ))

    if surface.get("auth_note"):
        findings.append(OWASPMapper.map_finding(
            'A07',
            'Default or Weak Credentials Accepted',
            'The scanner authenticated with a common credential pair, indicating weak authentication controls.',
            surface["auth_note"]
        ))

    try:
        privileged = surface["session"].get(
            f"{base_url}/surface/admin/users",
            headers={"X-User-Role": "admin"},
            timeout=5,
            allow_redirects=True,
        )
        body = privileged.text.lower()
        if privileged.status_code == 200 and "password" in body and ("admin" in body or "users" in body):
            findings.append(OWASPMapper.map_finding(
                'A01',
                'Role Override Header Grants Admin Access',
                'A client-controlled role header can expose the admin user directory and password data.',
                'GET /surface/admin/users with X-User-Role: admin returned user/password data'
            ))
    except Exception:
        pass

    return findings
