"""Simulates 2 devices with different sequence numbers for use in testing"""
import time
import requests

latestId=requests.get(
        'http://127.0.0.1:3000/retrieve',
        params={'Id':str(0)},
        timeout=100
        ).json()["latestId"]
while 1:
    r = requests.get(
        'http://127.0.0.1:3000/retrieve',
        params={'Id':str(latestId),"topics[]":["instrument_ping", "measure"]},
        timeout=100
        ).json()
    latestId=r["latestId"]
    if len(r["messages"])>0:
        for msg in r["messages"]:
            if msg["topic"]=="instrument_ping":
                requests.post(
                    'http://127.0.0.1:3000',
                    json={
                        "topic":"instrument_data",
                        "message":
                        {
                            "priority":False,
                            "sequence":1,
                            "name":"device A"
                        }
                    },
                    timeout=100
                )
                requests.post(
                    'http://127.0.0.1:3000',
                    json={
                        "topic":"instrument_data",
                        "message":
                        {
                            "priority":True,
                            "sequence":4,
                            "name":"device B"
                        }
                    },
                    timeout=100
                )
            elif msg["topic"]=="measure":
                if msg["message"]["sequence"]==1:
                    print("simulating capture")
                    time.sleep(3)
                    requests.post(
                        'http://127.0.0.1:3000',
                        json={
                            "topic":"ready",
                            "message":
                            {
                                "sequence":1,
                                "name":"device A"
                            }
                        },
                        timeout=100
                    )
                if msg["message"]["sequence"]==4:
                    print("simulating capture B")
                    time.sleep(3)
                    requests.post(
                        'http://127.0.0.1:3000',
                        json={
                            "topic":"ready",
                            "message":
                            {
                                "sequence":4,
                                "name":"device B"
                            }
                        },
                        timeout=100
                    )
    time.sleep(0.5)
