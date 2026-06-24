import requests
from classifiers.owasp_mapper import OWASPMapper

def detect_error_leaks(url):
    findings = []
    try:
        # Trigger an error by sending malformed JSON to a potential API endpoint
        headers = {'Content-Type': 'application/json'}
        res = requests.post(url, data="{malformed json}", headers=headers, timeout=5)
        
        text = res.text.lower()
        if "stack trace" in text or "exception" in text or "traceback" in text:
            findings.append(OWASPMapper.map_finding(
                'A09',
                'Error Leak / Stack Trace Exposure',
                'The application exposes raw stack traces or error details when given malformed input.',
                f'Found exception traces on POST request.'
            ))
    except Exception:
        pass

    return findings
