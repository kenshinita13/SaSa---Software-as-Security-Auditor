import requests
from classifiers.owasp_mapper import OWASPMapper

def check_components(url):
    findings = []
    try:
        res = requests.get(f"{url.rstrip('/')}/package.json", timeout=5)
        if res.status_code == 200 and "dependencies" in res.text:
             findings.append(OWASPMapper.map_finding(
                'A06',
                'Exposed package.json',
                'Project dependencies are exposed, allowing attackers to identify vulnerable components easily.',
                f'Found at {url.rstrip("/")}/package.json'
            ))
    except Exception:
        pass
    return findings
