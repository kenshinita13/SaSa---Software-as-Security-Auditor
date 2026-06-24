"""Secret hunter - scans for exposed secrets, credentials, and sensitive files (A02, A05)."""
import re
import requests
from classifiers.owasp_mapper import OWASPMapper
from scanners.scanner_utils import discover_attack_surface

# Secret patterns to search for in page source
SECRET_PATTERNS = [
    (r'sk_live_[a-zA-Z0-9]{20,}', 'Stripe Live Secret Key', 'A02'),
    (r'sk_test_[a-zA-Z0-9]{20,}', 'Stripe Test Key', 'A02'),
    (r'AKIA[0-9A-Z]{16}', 'AWS Access Key ID', 'A02'),
    (r'AIza[0-9A-Za-z\-_]{35}', 'Google API Key', 'A02'),
    (r'ghp_[a-zA-Z0-9]{36}', 'GitHub Personal Access Token', 'A02'),
    (r'xox[bpors]-[a-zA-Z0-9\-]{10,}', 'Slack Token', 'A02'),
    (r'eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+', 'JSON Web Token (JWT)', 'A02'),
    (r'(?:password|passwd|pwd)\s*[=:]\s*["\'][^"\']{4,}["\']', 'Hardcoded Password', 'A02'),
    (r'(?:api[_\-]?key|apikey|secret[_\-]?key)\s*[=:]\s*["\'][a-zA-Z0-9_\-]{10,}["\']', 'Hardcoded API Key/Secret', 'A02'),
    (r'mongodb(?:\+srv)?://[^\s"\'<>]+', 'MongoDB Connection String', 'A02'),
    (r'postgres(?:ql)?://[^\s"\'<>]+', 'PostgreSQL Connection String', 'A02'),
    (r'mysql://[^\s"\'<>]+', 'MySQL Connection String', 'A02'),
    (r'redis://[^\s"\'<>]+', 'Redis Connection String', 'A02'),
]

# Sensitive file paths to probe
SENSITIVE_ENDPOINTS = [
    ('/.env', ['DB_', 'SECRET', 'KEY=', 'PASSWORD', 'TOKEN', 'API_KEY']),
    ('/.env.local', ['DB_', 'SECRET', 'KEY=', 'PASSWORD']),
    ('/.env.backup', ['DB_', 'SECRET', 'KEY=', 'PASSWORD']),
    ('/config.json', ['password', 'secret', 'key', 'token']),
    ('/config.yml', ['password', 'secret', 'key']),
    ('/config.yaml', ['password', 'secret', 'key']),
    ('/wp-config.php', ['DB_PASSWORD', 'AUTH_KEY', 'SECURE_AUTH']),
    ('/.git/HEAD', ['ref:']),
    ('/.svn/entries', []),
    ('/backup.zip', []),
    ('/backup.tar.gz', []),
]

def hunt_secrets(url):
    findings = []
    base = url.rstrip('/')
    surface = discover_attack_surface(url)

    # Scan main page source for secrets
    try:
        res = requests.get(url, timeout=5)
        body = res.text
        for pattern, name, category in SECRET_PATTERNS:
            matches = re.findall(pattern, body, re.IGNORECASE)
            if matches:
                # Truncate secret for evidence
                evidence = matches[0]
                if len(evidence) > 20:
                    evidence = evidence[:20] + '***'
                findings.append(OWASPMapper.map_finding(
                    category,
                    f'{name} Found in Page Source',
                    f'A {name.lower()} was detected in the HTML source of the page.',
                    f'Match: {evidence}'
                ))
    except Exception:
        pass

    for page in surface["pages"]:
        body = page["text"]
        for pattern, name, category in SECRET_PATTERNS:
            matches = re.findall(pattern, body, re.IGNORECASE)
            if matches:
                evidence = str(matches[0])
                if len(evidence) > 20:
                    evidence = evidence[:20] + '***'
                findings.append(OWASPMapper.map_finding(
                    category,
                    f'{name} Found on Discovered Page',
                    f'A {name.lower()} was detected while crawling the application.',
                    f'{page["url"]} match: {evidence}'
                ))
        if any(marker in body.lower() for marker in ['api_keys', 'bk_live_', 'token', 'password']):
            findings.append(OWASPMapper.map_finding(
                'A02',
                'Sensitive Tokens or Password Data Exposed',
                'A crawled page contains token, API key, or password-related data.',
                f'{page["url"]} -> sensitive keyword in response'
            ))

    # Probe for sensitive files
    for path, indicators in SENSITIVE_ENDPOINTS:
        try:
            res = requests.get(f"{base}{path}", timeout=3, allow_redirects=False)
            if res.status_code == 200 and len(res.text) > 10:
                if not indicators or any(i.lower() in res.text.lower() for i in indicators):
                    category = 'A02' if any(k in path for k in ['.env', 'config', 'wp-config']) else 'A05'
                    findings.append(OWASPMapper.map_finding(
                        category,
                        f'Sensitive File Exposed: {path}',
                        f'The file at {path} is publicly accessible and may contain credentials or secrets.',
                        f'GET {path} -> HTTP 200 ({len(res.text)} bytes)'
                    ))
        except Exception:
            pass

    return findings
