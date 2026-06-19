import requests
import time

API = "http://127.0.0.1:8000"
NEXT = "http://localhost:3000"

ts = int(time.time())
email = f"temp+{ts}@example.com"
password = "Testpass123!"

s = requests.Session()
print('Registering', email)
resp = s.post(f"{API}/api/auth/register", json={"email": email, "password": password})
print('Register status', resp.status_code)
print(resp.text[:1000])
if not resp.ok:
    print('Register failed, trying login')
    resp = s.post(f"{API}/api/auth/login", json={"email": email, "password": password})
    print('Login status', resp.status_code)
    print(resp.text[:1000])
    if not resp.ok:
        raise SystemExit('Register/login failed')

data = resp.json()
access = data.get('access_token')
refresh = data.get('refresh_token')
print('Got tokens: access len', len(access) if access else None)

# Post tokens to Next set-cookie route to create httpOnly cookies (via Next server)
set_resp = s.post(f"{NEXT}/api/set-cookie", json={"access_token": access, "refresh_token": refresh})
print('/api/set-cookie', set_resp.status_code, set_resp.text[:500])

# Now request dashboard (this will include cookies set by Next)
dash = s.get(f"{NEXT}/dashboard")
print('/dashboard', dash.status_code)
print(dash.text[:1000])
