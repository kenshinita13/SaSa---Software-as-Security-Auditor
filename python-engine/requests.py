"""Small urllib-backed subset of requests used by the local SaSa engine."""
from http.cookiejar import CookieJar
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit, urlunsplit, parse_qsl
from urllib.request import HTTPCookieProcessor, Request, build_opener


class CaseInsensitiveHeaders(dict):
    def __init__(self, headers=None):
        super().__init__()
        for key, value in (headers or {}).items():
            self[key] = value

    def __setitem__(self, key, value):
        super().__setitem__(key.lower(), value)

    def __getitem__(self, key):
        return super().__getitem__(key.lower())

    def get(self, key, default=None):
        return super().get(key.lower(), default)


class Response:
    def __init__(self, status_code, text, headers, url):
        self.status_code = status_code
        self.text = text
        self.headers = CaseInsensitiveHeaders(headers)
        self.url = url


class _NoRedirect:
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class Session:
    def __init__(self):
        self.headers = {}
        self.cookies = CookieJar()

    def request(self, method, url, params=None, data=None, headers=None, timeout=None, allow_redirects=True):
        target = _with_params(url, params)
        body = None
        request_headers = dict(self.headers)
        request_headers.update(headers or {})

        if data is not None:
            if isinstance(data, str):
                body = data.encode("utf-8")
            else:
                body = urlencode(data, doseq=True).encode("utf-8")
                request_headers.setdefault("Content-Type", "application/x-www-form-urlencoded")

        req = Request(target, data=body, headers=request_headers, method=method.upper())
        opener = build_opener(HTTPCookieProcessor(self.cookies))
        if not allow_redirects:
            opener = build_opener(_NoRedirect, HTTPCookieProcessor(self.cookies))

        try:
            with opener.open(req, timeout=timeout) as res:
                raw = res.read()
                return Response(res.status, _decode(raw, res.headers), dict(res.headers.items()), res.geturl())
        except HTTPError as exc:
            raw = exc.read()
            return Response(exc.code, _decode(raw, exc.headers), dict(exc.headers.items()), exc.geturl())
        except URLError:
            raise

    def get(self, url, params=None, headers=None, timeout=None, allow_redirects=True):
        return self.request("GET", url, params=params, headers=headers, timeout=timeout, allow_redirects=allow_redirects)

    def post(self, url, data=None, headers=None, timeout=None, allow_redirects=True):
        return self.request("POST", url, data=data, headers=headers, timeout=timeout, allow_redirects=allow_redirects)

    def options(self, url, headers=None, timeout=None, allow_redirects=True):
        return self.request("OPTIONS", url, headers=headers, timeout=timeout, allow_redirects=allow_redirects)

    def delete(self, url, headers=None, timeout=None, allow_redirects=True):
        return self.request("DELETE", url, headers=headers, timeout=timeout, allow_redirects=allow_redirects)


def _decode(raw, headers):
    content_type = headers.get("content-type", "")
    charset = "utf-8"
    if "charset=" in content_type:
        charset = content_type.split("charset=", 1)[1].split(";", 1)[0].strip()
    return raw.decode(charset or "utf-8", errors="replace")


def _with_params(url, params):
    if not params:
        return url
    split = urlsplit(url)
    query = parse_qsl(split.query, keep_blank_values=True)
    query.extend((params or {}).items())
    return urlunsplit((split.scheme, split.netloc, split.path, urlencode(query, doseq=True), split.fragment))


def request(method, url, **kwargs):
    return Session().request(method, url, **kwargs)


def get(url, **kwargs):
    return request("GET", url, **kwargs)


def post(url, **kwargs):
    return request("POST", url, **kwargs)


def options(url, **kwargs):
    return request("OPTIONS", url, **kwargs)


def delete(url, **kwargs):
    return request("DELETE", url, **kwargs)
