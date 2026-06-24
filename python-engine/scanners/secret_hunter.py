import re
import requests
from classifiers.owasp_mapper import OWASPMapper

def hunt_secrets(url):
    findings = []
    try:
        res = requests.get(f"{url.rstrip('/')}/.env", timeout=5)
        if res.status_code == 200 and ("DB_PASSWORD" in res.text or "SECRET_KEY" in res.text):
             findings.append(OWASPMapper.map_finding(
                'A05',
                'Exposed .env File',
                'Environment variables file is publicly accessible.',
                f'Found at {url.rstrip("/")}/.env'
            ))
    except Exception:
        pass
    return findings
