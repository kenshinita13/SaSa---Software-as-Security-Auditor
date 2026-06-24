"""Port scanner — checks for exposed database/service ports without requiring nmap."""
import socket
from urllib.parse import urlparse
from classifiers.owasp_mapper import OWASPMapper

# Common risky ports
RISKY_PORTS = {
    21:    'FTP',
    22:    'SSH',
    23:    'Telnet',
    25:    'SMTP',
    3306:  'MySQL',
    5432:  'PostgreSQL',
    27017: 'MongoDB',
    6379:  'Redis',
    11211: 'Memcached',
    9200:  'Elasticsearch',
    8080:  'HTTP Proxy/Alt',
    8443:  'HTTPS Alt',
    445:   'SMB',
    1433:  'MSSQL',
}

def scan_ports(url):
    findings = []
    parsed = urlparse(url)
    host = parsed.hostname
    if not host:
        return findings

    for port, service in RISKY_PORTS.items():
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1.5)
            result = sock.connect_ex((host, port))
            sock.close()
            if result == 0:
                findings.append(OWASPMapper.map_finding(
                    'A05',
                    f'Open {service} Port ({port})',
                    f'Port {port} ({service}) is publicly accessible. Database and service ports should never be exposed to the internet.',
                    f'Host {host}:{port} — connection accepted'
                ))
        except Exception:
            pass

    return findings
