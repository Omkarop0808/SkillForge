import requests

try:
    with open("test.pdf", "wb") as f:
        f.write(b"%PDF-1.4\n%EOF")

    res = requests.post(
        "http://127.0.0.1:8000/api/upload/resume",
        files={"file": ("test.pdf", open("test.pdf", "rb"), "application/pdf")}
    )
    print("STATUS:", res.status_code)
    print("BODY:", res.text)
except Exception as e:
    print("ERROR:", e)
