import json

class OWASPMapper:
    @staticmethod
    def map_finding(category, title, description, evidence):
        return {
            "category": category,
            "title": title,
            "description": description,
            "evidence": evidence
        }

    @staticmethod
    def output_json(findings):
        print(json.dumps(findings))
