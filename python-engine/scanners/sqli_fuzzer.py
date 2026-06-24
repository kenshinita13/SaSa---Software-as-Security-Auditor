import requests
from classifiers.owasp_mapper import OWASPMapper

def fuzz_sqli(url):
    findings = []
    payloads = ["' OR 1=1 --", "' UNION SELECT null, null --", "1; WAITFOR DELAY '0:0:5'--"]
    
    for payload in payloads:
        try:
            res = requests.get(url, params={"q": payload, "id": payload}, timeout=5)
            text = res.text.lower()
            
            # Simple error-based detection
            if "sql syntax" in text or "mysql_fetch" in text or "pg_query" in text:
                findings.append(OWASPMapper.map_finding(
                    'A03',
                    'SQL Injection Vulnerability',
                    'The application returned a database error when injected with an SQL payload.',
                    f'Payload: {payload}'
                ))
                break # Avoid duplicating for every payload if one works
        except Exception:
            pass

    return findings
