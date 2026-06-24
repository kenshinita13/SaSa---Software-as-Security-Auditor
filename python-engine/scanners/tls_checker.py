import ssl
import socket
from urllib.parse import urlparse
from classifiers.owasp_mapper import OWASPMapper

def check_tls(url):
    findings = []
    parsed_url = urlparse(url)
    
    if parsed_url.scheme != 'https':
        findings.append(OWASPMapper.map_finding(
            'A02',
            'Unencrypted HTTP Traffic',
            'The target URL is using unencrypted HTTP.',
            f'URL: {url}'
        ))
        return findings

    hostname = parsed_url.hostname
    port = parsed_url.port or 443

    try:
        context = ssl.create_default_context()
        # Ensure we can check for older protocols
        context.options &= ~ssl.OP_NO_TLSv1
        context.options &= ~ssl.OP_NO_TLSv1_1
        
        with socket.create_connection((hostname, port), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                version = ssock.version()
                if version in ['TLSv1', 'TLSv1.1']:
                    findings.append(OWASPMapper.map_finding(
                        'A02',
                        'Deprecated TLS Version',
                        'The server supports or uses a deprecated TLS version (1.0 or 1.1).',
                        f'Negotiated version: {version}'
                    ))
    except Exception:
        pass

    return findings
