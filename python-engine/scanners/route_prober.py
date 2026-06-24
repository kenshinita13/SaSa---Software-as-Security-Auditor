import requests
from classifiers.owasp_mapper import OWASPMapper

def probe_routes(url):
    findings = []
    # Common admin/internal paths
    paths = ['/admin', '/admin-panel', '/api/internal', '/api/users', '/server-status']
    
    base_url = url.rstrip('/')
    
    for path in paths:
        try:
            target = f"{base_url}{path}"
            res = requests.get(target, timeout=5, allow_redirects=False)
            
            if res.status_code == 200:
                findings.append(OWASPMapper.map_finding(
                    'A04',
                    'Insecure Design: Unauthenticated Access to Privileged Route',
                    'A route intended for internal or admin use is accessible without authentication.',
                    f'Path {path} returned 200 OK'
                ))
        except Exception:
            pass

    return findings
