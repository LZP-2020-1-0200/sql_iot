from py3.sts_client import STSClient, STSPoint
import serial
import time

with STSClient('http://localhost:80', True, 1, "PRIOR_STAGE", True, True) as sts_client:
	established: bool = False
	connection: serial.Serial = serial.Serial()
	# Attempt connection
	import serial.tools.list_ports
	ports = serial.tools.list_ports.comports()

	for port, desc, hwid in sorted(ports):
		try:
			connection = serial.Serial(port=port, baudrate=9600)
			# kill the input buffer to prevent dual blocking
			connection.timeout = 1
			connection.write_timeout = 1
			print(connection.read_all())
			connection.write(b'\rSERIAL \r')
			connection.timeout = None
			connection.write_timeout = None
			time.sleep(1)
			if "00000" in connection.read_all().decode():
				print("Successfully connected to "+ port)
				established = True
				break
		except serial.SerialException as exception:
			print(exception)
		except ValueError as exception:
			print(exception)
	if established:
		print("Fetching serial number...")
		connection.write(b'SERIAL \r')
		print(connection.read_until(b'\r'))
		def move(pt:STSPoint):
			pass
			# print(pt.x, pt.y)
		def get():
			connection.write(b'P\r')
			coords = (connection.read_until(b'\r').decode().split(','))
			# print(coords)
			return STSPoint(int(coords[0]),int(coords[1]),0)
		sts_client.onmove = move
		sts_client.get_points = get
		print("PRIOR online, press enter to halt process and log any error data")
		input()
		print("Closing process")
	else:
		print("Prior not found")
