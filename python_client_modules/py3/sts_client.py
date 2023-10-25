"""Contains STSClient made for communication with the STS (sequencial thing system)"""
import threading
import time
from typing import Callable, Any, TypeGuard, TypedDict
import requests
import numpy as np


class STSUpdate:
    """Object containing a single message with topic"""

    class UpdateDictionary(TypedDict):
        """Dictionary meeting the requirements for IoT_Update"""

        topic: str
        body: dict[Any, Any]

    def __init__(self, msg: UpdateDictionary) -> None:
        self.topic = msg["topic"]
        self.message: dict[Any, Any] = msg["body"]

    @staticmethod
    def is_valid(msg: Any) -> TypeGuard[UpdateDictionary]:
        """Typeguard for the constructor"""
        if not isinstance(msg, dict):
            return False
        if not isinstance(msg["topic"], str):
            return False
        if not isinstance(msg["body"], dict):
            return False
        return True


class STSPacket:
    """A class containing data of a single STS packet"""
    class PacketDictionary(TypedDict):
        """Dictionary meeting the requirements for IoT_Packet"""

        latestId: int
        messages: list[STSUpdate.UpdateDictionary]

    def __init__(self, packet: PacketDictionary) -> None:
        self.latest_id: int = int(packet["latestId"])
        self.messages: list[STSUpdate] = []
        for msg in packet["messages"]:
            if STSUpdate.is_valid(msg):
                self.messages.append(STSUpdate(msg))

    @staticmethod
    def is_valid(packet: Any) -> TypeGuard[PacketDictionary]:
        """Typeguard for the constructor"""
        if not isinstance(packet, dict):
            print("Typeguard did not pass")
            return False
        if not isinstance(packet["latestId"], int):
            print("Typeguard did not pass")
            return False
        if not isinstance(packet["messages"], list):
            print("Typeguard did not pass")
            return False
        return True


class STSPoint:
    """Tiny class for access to x,y,z values."""
    def __init__(self, x: int, y: int, z: int) -> None:
        self.x: int = x
        self.y: int = y
        self.z: int = z
    
    def to_list(self):
        return [self.x, self.y, self.z]

    def get_local(self, og_A:"STSPoint", og_B:"STSPoint", og_C:"STSPoint",
                  local_A:"STSPoint", local_B:"STSPoint", local_C:"STSPoint"):
        relself=STSPoint(self.x-og_A.x, self.y-og_A.y, self.z-og_A.z)
        og_AB=STSPoint(og_B.x-og_A.x, og_B.y-og_A.y, og_B.z-og_A.z)
        og_AC=STSPoint(og_C.x-og_A.x, og_C.y-og_A.y, og_C.z-og_A.z)
        components = np.linalg.lstsq(
            np.transpose(np.array([
                og_AB.to_list(),
                og_AC.to_list()
            ])), 
            np.array(relself.to_list()), rcond=None)[0]
        
        local_AB=STSPoint(local_B.x-local_A.x, local_B.y-local_A.y, local_B.z-local_A.z)
        local_AC=STSPoint(local_C.x-local_A.x, local_C.y-local_A.y, local_C.z-local_A.z)
        local_matrix=np.transpose(np.array([
                local_AB.to_list(),
                local_AC.to_list()
            ]))
        result=STSPoint(*list(local_matrix@components))
        return STSPoint(local_A.x+result.x, local_A.y+result.y, local_A.z+result.z)


class STSClient:
    """A client made for communicating with the IoT network for sequenced measurement.

    Use either with `with` or `start()`, `kill()`.

    Use `on()` to create custom topic handling and `emit()` to send messages.

    While any topics are allowed to be emmited with `emit()`, refrain from using topics:
    - `instrument_ping`
    - `instrument_data`
    - `measure`
    - `ready`

    as they are important for proper operation of sequenced measurements.

    To measure at multiple sequence numbers, create multiple `STSClient`
    instances with different names.
    """

    def __init__(
        self, url: str, critical: bool, sequence_number: int, name: str, priority: bool, is_stage:bool=False, is_2d:bool=False
    ) -> None:
        self.url = url
        try: 
            requests.head(f"{self.url}", timeout=1000)
        except requests.ConnectionError as e:
            if critical:
                # kill the program if the website is not online
                print("Connection could not be established.\n Closing program.")
                quit()
            else:
                raise e
        # get end of queue
        latest_id_response: requests.Response = requests.get(
            f"{self.url}/retrieve", params={"Id": str(0)}, timeout=1000
        )
        self.is_stage: bool=is_stage
        self.is_2d: bool=is_2d
        self._topics: list[str] = []
        self._callbacks: dict[str, Callable[[dict[str, Any]], None]] = {}
        latest_id_response.raise_for_status()
        lid: Any = latest_id_response.json()
        self._latest_id: int
        if isinstance(lid, dict) and isinstance(lid["latestId"], int):
            self._latest_id = lid["latestId"]
        else:
            self._latest_id = 0
        self._event_crash:Exception|None = None
        self._event_alive: bool = False
        self._event_thread: threading.Thread = threading.Thread(
            target=self._event_thread_func
        )
        self.last_heartbeat: int = int(time.time())
        self._sequence_num: int = sequence_number
        self._name: str = name
        self._priority: bool = priority
        
        self.on("instrument_ping", self._inform)
        self.on("measure", self._measure)
        self.on("calibration", self._set_calibration)
        self.on("point_info?", self._get_points)
        self.on("set_local_calibration", self._set_local_calibration)
        self.on("reference", self._get_ref)
        self.on("move", self._move)

        """A callback accepting a reference type and experiment id, that is called when a reference is ordered."""
        self.onmeasure: Callable[
            [int, int], None
        ] = lambda _,__:None  # empty lambda by default

        """A callback accepting a single point, that is called when a move is ordered."""
        self.onmove:Callable[[STSPoint],None]=lambda _:None

        """A callback accepting a single point, experiment id and point number, that is called
        when measurment/preperation is ordered.
        Only return when measurement is finished to ensure proper sequencing.
        """
        self.get_points: Callable[[],STSPoint|None]=lambda:None
        
        """Callback requesting that the current point is supplied. 
        Return None if device does not supply point data.
        """
        self.cal_a:STSPoint=STSPoint(0,0,0)
        self.cal_b:STSPoint=STSPoint(0,0,0)
        self.cal_c:STSPoint=STSPoint(0,0,0)
        
        self.current_cal_a:STSPoint=STSPoint(0,0,0)
        self.current_cal_b:STSPoint=STSPoint(0,0,0)
        self.current_cal_c:STSPoint=STSPoint(0,0,0)

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, *_):
        self.kill()

    def start(self):
        """Starts the client, acquiring new messages."""
        self._err_chk()
        self._event_alive = True
        self._event_thread.start()

    def kill(self):
        """Kills the client event thread."""
        print("Killing listener")
        self._event_alive = False
        self._event_thread.join()
        print("Joined listener")
        self._err_chk()

    def _set_local_calibration(self, body:dict[str, Any]):
        pt=self.get_points()
        if pt:
            if body["point"]=="A":
                self.current_cal_a=pt
            elif body["point"]=="B":
                self.current_cal_b=pt
            elif body["point"]=="C":
                self.current_cal_c=pt

    def _move(self, body:dict[str, Any]):
        pt:STSPoint = STSPoint(body['x'], body['y'], body['z'])
        self.onmove(pt)


    def _get_points(self, _:dict[str, Any]):
        pt:STSPoint|None=self.get_points()
        if pt:
            self.emit("point_info", {'x':pt.x, "y":pt.y, "z":pt.z})

    def _set_calibration(self, body:dict[str, Any]):
        self.cal_a=STSPoint(body["A"]['x'], body["A"]['y'], body["A"]['z'])
        self.cal_b=STSPoint(body["B"]['x'], body["B"]['y'], body["B"]['z'])
        self.cal_c=STSPoint(body["C"]['x'], body["C"]['y'], body["C"]['z'])

    def _get_ref(self, body: dict[str, Any]):
        """Responds to a reference request from the server,
        calling onmeasure with the reference type and experiment id."""
        try:
            self.onmeasure(int(body["refType"]), int(body["experimentId"]))
        finally:
            pass

    def _measure(self, body: dict[str, Any]):
        """Responds to a measurement request from the server,
        sending the measurement data in response.
        """
        print("Measuring")
        print(body)
        if body["sequence"] == self._sequence_num:
            point: STSPoint = STSPoint(
                int(body["point"]["x"]), int(body["point"]["y"]), int(body["point"]["z"])
            )
            print(point.to_list())
            try:
                if self.is_stage:
                    point=point.get_local(self.cal_a, self.cal_b, self.cal_c,
                                    self.current_cal_a, self.current_cal_b, self.current_cal_c)
                self.onmove(point)
                self.onmeasure(
                    int(body["pointNumber"]), int(body["experimentId"])
                )
            finally:
                # call ready no matter if it failed or not
                print("Sending ready")
                self._ready()



    def _inform(self, _: dict[str, Any]):
        """Responds to a ping from the server, 
        sending the instrument data in response.
        """
        print("ping")
        self.emit(
            "instrument_data",
            {
                "priority": self._priority,
                "name": self._name,
                "sequence": self._sequence_num,
            },
        )

    def _event_thread_func(self) -> None:
        """The event thread function, that is run in a seperate thread."""
        while self._event_alive:
            try:
                if int(time.time()) - self.last_heartbeat > 30:
                    requests.post(
                        f"{self.url}",
                        json={"topic": 'heartbeat', "body": {"name": self._name}},
                        timeout=1000,
                    )
                    self.last_heartbeat = int(time.time())
                retrieve_response: requests.Response = requests.get(
                    f"{self.url}/retrieve",
                    params={"Id": str(self._latest_id), "topics[]": self._topics},
                    timeout=1000
                )
                if retrieve_response.ok:
                    retrieve_json: Any = retrieve_response.json()
                    # print(retrieve_json)
                    # Type guards
                    if STSPacket.is_valid(retrieve_json):
                        retrieve_packet: STSPacket = STSPacket(retrieve_json)
                        self._latest_id = retrieve_packet.latest_id
                        for msg in retrieve_packet.messages:
                            # print(msg.topic)
                            self._callbacks[msg.topic](msg.message)
                time.sleep(0.1)
                #print((1+(int(time.time())%3)) * '.')
            except Exception as exc: #pylint: disable = broad-exception-caught
                self._event_crash=exc
                print("Client has encountered an error.")
                print(exc)
                # self._event_alive=False
        

    def on(
        self, topic: str | list[str], callback: Callable[[dict[str, Any]], None]
    ) -> None:
        """Binds a callback function to a topic or topics"""
        self._err_chk()
        if isinstance(topic, str):
            self._topics.append(topic)
            self._callbacks[topic] = callback
        else:
            for top in topic:
                self._topics.append(top)
                self._callbacks[top] = callback

    def _ready(self) -> None:
        """Sends a ready message to the server"""
        print("_ready: Sending ready")
        self.emit("ready", {"sequence": self._sequence_num, "name": self._name})
        print("_ready: Sent ready")

    def _err_chk(self) -> None:
        """Checks if the event thread has crashed and raises the error if it has"""
        if self._event_crash:
            raise self._event_crash

    def emit(self, topic: str, body: dict[str, Any]) -> None:
        """Sends jsonified `body` with `topic` to server"""
        self._err_chk()
        print(f"emit: {topic}")
        requests.post(
            f"{self.url}", json={"topic": topic, "body": body}, timeout=1000
        )
        print(f"emit: {topic} sent")
        
        

    def send_file(self, path: str, pt_num: int, ex_id: int) -> None:
        """Sends a file from `path` to the STS server"""
        self._err_chk()
        with open(path, "rb") as sendable:
            requests.post(
                self.url + "/upload_measurement",
                files={"file": sendable},
                data={
                    "name": self._name,
                    "point_number": pt_num,
                    "experimentId": ex_id,
                },
                timeout=1000,
            )


if __name__ == "__main__":

    print("Point conversion tests:")
    print("Same basis")
    print(STSPoint(2100,2100,0).get_local(
        STSPoint(2000,2000,41), STSPoint(4000,2000,0), STSPoint(2000,3000,12),
        STSPoint(0,0,0), STSPoint(100,0,-23), STSPoint(0,100,0)).to_list())


    name = input("Name: ")
    with STSClient("http://localhost", True, 2, name, True) as client:    
        def _measure(pt_num: int, experiment_id: int) -> None:
            time.sleep(1)
            print("Measuring")
            #client.emit('ready', {'sequence': 1, 'name': 'DEBUG'})
            #client.send_file("./test5.txt", pt_num, experiment_id)
        client.onmeasure = _measure
        input()
