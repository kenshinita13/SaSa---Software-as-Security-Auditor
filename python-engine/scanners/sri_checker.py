import requests
from bs4 import BeautifulSoup
from classifiers.owasp_mapper import OWASPMapper
from urllib.parse import urlparse

def check_sri(url):
    findings = []
    try:
        res = requests.get(url, timeout=5)
        soup = BeautifulSoup(res.text, 'html.parser')
        
        scripts = soup.find_all('script', src=True)
        links = soup.find_all('link', rel='stylesheet', href=True)
        
        base_domain = urlparse(url).netloc
        
        for script in scripts:
            src = script.get('src', '')
            if src.startswith('http') and urlparse(src).netloc != base_domain:
                if not script.get('integrity'):
                    findings.append(OWASPMapper.map_finding(
                        'A08',
                        'Missing Subresource Integrity (SRI)',
                        'An external script is loaded without an integrity attribute.',
                        f'Script source: {src}'
                    ))
                    
        for link in links:
            href = link.get('href', '')
            if href.startswith('http') and urlparse(href).netloc != base_domain:
                if not link.get('integrity'):
                    findings.append(OWASPMapper.map_finding(
                        'A08',
                        'Missing Subresource Integrity (SRI)',
                        'An external stylesheet is loaded without an integrity attribute.',
                        f'Stylesheet source: {href}'
                    ))
    except Exception:
        pass

    return findings
