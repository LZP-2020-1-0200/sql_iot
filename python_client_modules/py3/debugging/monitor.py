"""monitors all STS messages"""
import time
import requests


latest_id:int=0
while 1:
    r = requests.get(
        'http://127.0.0.1:80/retrieve',
        params={'Id':str(latest_id),"topics[]":["all"]},
        timeout=100
        ).json()
    latest_id=r["latestId"]
    if len(r["messages"])>0:
        for msg in r["messages"]:
            print(msg["topic"], msg["body"])
    time.sleep(0.1)
