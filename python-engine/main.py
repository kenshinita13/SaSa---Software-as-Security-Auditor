import argparse
import sys
from scanners.port_scanner import scan_ports
from scanners.sqli_fuzzer import fuzz_sqli
from scanners.tls_checker import check_tls
from scanners.route_prober import probe_routes
from scanners.sri_checker import check_sri
from scanners.error_leak_detector import detect_error_leaks
from scanners.ssrf_prober import probe_ssrf
from scanners.secret_hunter import hunt_secrets
from scanners.component_checker import check_components
from classifiers.owasp_mapper import OWASPMapper

def main():
    parser = argparse.ArgumentParser(description='SaSa Python Security Engine')
    parser.add_argument('--url', required=True, help='Target URL to scan')
    parser.add_argument('--output', choices=['json'], default='json', help='Output format')
    parser.add_argument('--test', action='store_true', help='Test connection')
    
    args = parser.parse_args()
    
    if args.test:
        print("Python engine responding")
        return

    findings = []

    scanners = [
        ("port_scanner", scan_ports),
        ("sqli_fuzzer", fuzz_sqli),
        ("tls_checker", check_tls),
        ("route_prober", probe_routes),
        ("sri_checker", check_sri),
        ("error_leak_detector", detect_error_leaks),
        ("ssrf_prober", probe_ssrf),
        ("secret_hunter", hunt_secrets),
        ("component_checker", check_components),
    ]

    for scanner_name, scanner in scanners:
        try:
            findings.extend(scanner(args.url))
        except Exception as exc:
            print(f"[{scanner_name}] failed: {exc}", file=sys.stderr)
    
    if args.output == 'json':
        OWASPMapper.output_json(findings)

if __name__ == '__main__':
    main()
