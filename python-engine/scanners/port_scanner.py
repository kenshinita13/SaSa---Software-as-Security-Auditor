import nmap
from classifiers.owasp_mapper import OWASPMapper
from urllib.parse import urlparse

def scan_ports(url):
    findings = []
    parsed_url = urlparse(url)
    target_host = parsed_url.hostname
    
    if not target_host:
        return findings

    try:
        nm = nmap.PortScanner()
        # Scan common DB ports: PostgreSQL, MongoDB, MySQL
        nm.scan(target_host, '5432,27017,3306', arguments='-Pn -T4')
        
        for host in nm.all_hosts():
            for proto in nm[host].all_protocols():
                ports = nm[host][proto].keys()
                for port in ports:
                    state = nm[host][proto][port]['state']
                    if state == 'open':
                        findings.append(OWASPMapper.map_finding(
                            'A05',
                            f'Open Database Port ({port})',
                            f'Port {port} is publicly exposed. This is a severe security misconfiguration.',
                            f'Host {host} has port {port} open.'
                        ))
    except Exception as e:
        # Ignore nmap errors if not installed or permission denied
        pass

    return findings
