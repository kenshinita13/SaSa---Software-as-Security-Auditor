"""Component checker — detects exposed dependency files and checks for known vulnerable versions (A06)."""
import requests
import json
from classifiers.owasp_mapper import OWASPMapper

# Files that reveal dependency information
DEP_FILES = [
    ('/package.json', 'npm'),
    ('/package-lock.json', 'npm'),
    ('/composer.json', 'composer'),
    ('/Gemfile', 'ruby'),
    ('/requirements.txt', 'pip'),
    ('/Pipfile', 'pip'),
    ('/pom.xml', 'maven'),
    ('/go.mod', 'go'),
]

# Known vulnerable library versions (simplified check)
KNOWN_VULNERABLE = {
    'lodash': {'below': '4.17.21', 'cve': 'CVE-2021-23337 (Prototype Pollution)'},
    'express': {'below': '4.17.3', 'cve': 'CVE-2022-24999 (qs Prototype Pollution)'},
    'jquery': {'below': '3.5.0', 'cve': 'CVE-2020-11023 (XSS)'},
    'minimist': {'below': '1.2.6', 'cve': 'CVE-2021-44906 (Prototype Pollution)'},
    'node-fetch': {'below': '2.6.7', 'cve': 'CVE-2022-0235 (Info Exposure)'},
    'axios': {'below': '0.21.2', 'cve': 'CVE-2021-3749 (SSRF)'},
    'moment': {'below': '2.29.4', 'cve': 'CVE-2022-31129 (ReDoS)'},
}

def _parse_version(v):
    """Simple version comparison — returns tuple of ints."""
    try:
        return tuple(int(x) for x in v.lstrip('^~>=').split('.') if x.isdigit())
    except Exception:
        return (0,)

def check_components(url):
    findings = []
    base = url.rstrip('/')

    for path, ecosystem in DEP_FILES:
        try:
            res = requests.get(f"{base}{path}", timeout=3, allow_redirects=False)
            if res.status_code != 200 or len(res.text) < 10:
                continue

            # Report exposure
            findings.append(OWASPMapper.map_finding(
                'A06',
                f'Exposed Dependency File: {path}',
                f'The {ecosystem} dependency file is publicly accessible, allowing attackers to identify frameworks and versions.',
                f'GET {path} → HTTP 200'
            ))

            # For package.json, check known vulnerable versions
            if 'package.json' in path:
                try:
                    pkg = json.loads(res.text)
                    all_deps = {}
                    all_deps.update(pkg.get('dependencies', {}))
                    all_deps.update(pkg.get('devDependencies', {}))

                    for lib, vuln_info in KNOWN_VULNERABLE.items():
                        if lib in all_deps:
                            installed_version = _parse_version(all_deps[lib])
                            vulnerable_below = _parse_version(vuln_info['below'])
                            if installed_version < vulnerable_below:
                                findings.append(OWASPMapper.map_finding(
                                    'A06',
                                    f'Vulnerable Component: {lib} ({all_deps[lib]})',
                                    f'{lib} version {all_deps[lib]} is below {vuln_info["below"]} and affected by {vuln_info["cve"]}.',
                                    f'{lib}@{all_deps[lib]} — {vuln_info["cve"]}'
                                ))
                except (json.JSONDecodeError, KeyError):
                    pass

        except Exception:
            pass

    return findings
