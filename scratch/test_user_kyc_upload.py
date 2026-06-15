import requests

BASE_URL = "http://localhost:8000"

print("Logging in as a guest...")
res = requests.post(f"{BASE_URL}/api/auth/login", data={
    "username": "guest123@test.com",
    "password": "password123"
})
if res.status_code != 200:
    res = requests.post(f"{BASE_URL}/api/auth/register", json={
        "name": "Test Guest",
        "email": "guest123@test.com",
        "password": "password123",
        "role": "guest"
    })
    res = requests.post(f"{BASE_URL}/api/auth/login", data={
        "username": "guest123@test.com",
        "password": "password123"
    })
print("Login Status:", res.status_code)
token = res.json().get("access_token")

headers = {"Authorization": f"Bearer {token}"}
files = {"file": ("test_dl.png", b"fake image content", "image/png")}
print("Uploading DL...")
upload_res = requests.post(f"{BASE_URL}/api/user-kyc/upload-dl", headers=headers, files=files)
print("Upload Status:", upload_res.status_code)
print("Upload Response:", upload_res.json())

status_res = requests.get(f"{BASE_URL}/api/user-kyc/status", headers=headers)
print("KYC Status:", status_res.json())
