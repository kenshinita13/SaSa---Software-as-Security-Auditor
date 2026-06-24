"""Small compatibility layer for the scanner's httpx.Client usage."""
import requests


class Client:
    def __init__(self, timeout=None):
        self.timeout = timeout
        self.session = requests.Session()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def get(self, url, params=None):
        return self.session.get(url, params=params, timeout=self.timeout)
