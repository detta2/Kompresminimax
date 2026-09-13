import json
import urllib.request

key = "e9a2b84c31154f2a99d45e7f123abcde"
host = "www.kompresminimax.online"
key_location = f"https://{host}/{key}.txt"

urls = [
    f"https://{host}/",
    f"https://{host}/about.html",
    f"https://{host}/contact.html",
    f"https://{host}/changelog.html",
    f"https://{host}/privacy.html",
    f"https://{host}/terms.html"
]

payload = json.dumps({
    "host": host,
    "key": key,
    "keyLocation": key_location,
    "urlList": urls
}).encode("utf-8")

endpoints = [
    "https://api.indexnow.org/indexnow",
    "https://www.bing.com/indexnow",
    "https://yandex.com/indexnow"
]

for endpoint in endpoints:
    try:
        req = urllib.request.Request(endpoint, data=payload, headers={"Content-Type": "application/json; charset=utf-8"})
        res = urllib.request.urlopen(req, timeout=10)
        print(f"Indexed via {endpoint}: HTTP {res.status}")
    except Exception as e:
        print(f"Endpoint {endpoint}: {e}")
