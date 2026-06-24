import argparse
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
    
    findings.extend(scan_ports(args.url))
    findings.extend(fuzz_sqli(args.url))
    findings.extend(check_tls(args.url))
    findings.extend(probe_routes(args.url))
    findings.extend(check_sri(args.url))
    findings.extend(detect_error_leaks(args.url))
    findings.extend(probe_ssrf(args.url))
    findings.extend(hunt_secrets(args.url))
    findings.extend(check_components(args.url))
    
    if args.output == 'json':
        OWASPMapper.output_json(findings)

if __name__ == '__main__':
    main()
