import requests
from classifiers.owasp_mapper import OWASPMapper
from urllib.parse import urlparse
from html.parser import HTMLParser


class ResourceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'script' and attrs.get('src'):
            self.scripts.append(attrs)
        if tag == 'link' and attrs.get('href') and 'stylesheet' in (attrs.get('rel') or ''):
            self.links.append(attrs)

def check_sri(url):
    findings = []
    try:
        res = requests.get(url, timeout=5)
        parser = ResourceParser()
        parser.feed(res.text)
        
        base_domain = urlparse(url).netloc
        
        for script in parser.scripts:
            src = script.get('src', '')
            if src.startswith('http') and urlparse(src).netloc != base_domain:
                if not script.get('integrity'):
                    findings.append(OWASPMapper.map_finding(
                        'A08',
                        'Missing Subresource Integrity (SRI)',
                        'An external script is loaded without an integrity attribute.',
                        f'Script source: {src}'
                    ))
                    
        for link in parser.links:
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
