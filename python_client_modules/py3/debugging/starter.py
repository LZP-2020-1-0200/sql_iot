"""Sends a ping and begin message with an experiment ID"""
import requests
requests.post(
    'http://127.0.0.1:3000/ping',
    timeout=100
)
print("pingu")
input()
print(requests.get(
    'http://127.0.0.1:3000/devices',
    timeout=100
).json())
# input()
# requests.post(
#     'http://127.0.0.1:3000/calibrate',
#     json={
#         "exId":10
#     },
#     timeout=100
# ) 
input()
requests.post(
    'http://127.0.0.1:3000/start',
    json={
        "exId":10
    },
    timeout=100
)
