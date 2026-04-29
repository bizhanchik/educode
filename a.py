import http.client

conn = http.client.HTTPSConnection("judge0-ce.p.rapidapi.com")

headers = {
    'x-rapidapi-key': "76c6b1b48emshba83927ded1e566p179138jsnad5c214ba849",
    'x-rapidapi-host': "judge0-ce.p.rapidapi.com"
}

conn.request("GET", "/submissions/5fcd6440-96db-4513-84ee-a0c0d981a00b?base64_encoded=true&fields=*", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))