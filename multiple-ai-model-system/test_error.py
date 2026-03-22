import urllib.request
import json
import urllib.error

def test_registration(url):
    try:
        req = urllib.request.Request(url, data=json.dumps({'username':'test99990@example.com','email':'test99990@example.com','password':'Password123!','confirm_password':'Password123!','first_name':'T','last_name':'X'}).encode('utf-8'), headers={'Content-Type':'application/json'})
        print(f"Testing {url}...")
        res = urllib.request.urlopen(req)
        print("Success!")
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}")
        with open('error_out.html', 'wb') as f:
            f.write(e.read())
    except Exception as e:
        print(f"Failed: {e}")

test_registration('http://127.0.0.1:8000/api/v1/accounts/register/')
test_registration('http://127.0.0.1:8082/api/v1/accounts/register/')
test_registration('http://192.168.1.12:8000/api/v1/accounts/register/')
test_registration('http://192.168.1.12:8082/api/v1/accounts/register/')
