"""Error leak detector — probes for stack traces, debug info, and verbose error messages (A09)."""
import requests
from classifiers.owasp_mapper import OWASPMapper

# Patterns that indicate error/debug info leakage
ERROR_PATTERNS = [
    'stack trace', 'traceback', 'exception', 'error at',
    'syntax error', 'fatal error', 'parse error',
    'warning:', 'notice:', 'deprecated:',
    'at module.', 'at object.', 'at function.',
    'node_modules/', 'site-packages/',
    'debug mode', 'debug =', 'debug=true',
    'x-debug', 'xdebug',
    'environment: development', 'env: development',
    'internal server error',
]

# Patterns for DB info leaks
DB_PATTERNS = [
    'mysql', 'postgresql', 'sqlite', 'mongodb', 'redis',
    'connection string', 'connection refused', 'access denied for user',
    'econnrefused', 'pg_hba.conf',
]

def detect_error_leaks(url):
    findings = []
    base = url.rstrip('/')

    # Test 1: Malformed JSON POST
    try:
        res = requests.post(url, data="{malformed!!!", headers={'Content-Type': 'application/json'}, timeout=5)
        text = res.text.lower()
        if any(p in text for p in ERROR_PATTERNS):
            findings.append(OWASPMapper.map_finding(
                'A09',
                'Stack Trace / Error Details Exposed',
                'The application leaks error details, stack traces, or debug information when given malformed input.',
                f'Triggered by POST with malformed JSON → HTTP {res.status_code}'
            ))
        if any(p in text for p in DB_PATTERNS):
            findings.append(OWASPMapper.map_finding(
                'A09',
                'Database Error Information Leaked',
                'The application exposes database technology and connection details in error responses.',
                f'Database info found in error response'
            ))
    except Exception:
        pass

    # Test 2: Non-existent path to trigger 404 handler
    try:
        res = requests.get(f"{base}/nonexistent_path_sasa_test_{hash('test') % 9999}", timeout=5)
        text = res.text.lower()
        if any(p in text for p in ERROR_PATTERNS):
            findings.append(OWASPMapper.map_finding(
                'A09',
                'Verbose 404 Error Page',
                'The 404 error page leaks internal application paths, framework details, or stack traces.',
                f'GET /nonexistent → HTTP {res.status_code}, error details in body'
            ))
    except Exception:
        pass

    # Test 3: Method not allowed
    try:
        res = requests.delete(url, timeout=5)
        text = res.text.lower()
        if any(p in text for p in ERROR_PATTERNS):
            findings.append(OWASPMapper.map_finding(
                'A09',
                'Error Leak via Unsupported HTTP Method',
                'Sending an unsupported HTTP method triggers verbose error output.',
                f'DELETE {url} → HTTP {res.status_code}'
            ))
    except Exception:
        pass

    # Test 4: Check response headers for debug info
    try:
        res = requests.get(url, timeout=5)
        for header_name, header_value in res.headers.items():
            hn = header_name.lower()
            if 'debug' in hn or 'trace' in hn or 'stack' in hn:
                findings.append(OWASPMapper.map_finding(
                    'A09',
                    f'Debug Header Exposed: {header_name}',
                    'A response header containing debug information is present.',
                    f'{header_name}: {header_value}'
                ))
    except Exception:
        pass

    return findings
