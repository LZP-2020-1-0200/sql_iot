import os.path
from py3.sts_client import STSClient, STSPoint
from py3.prior_solis.coordinate import Coordinate
from py3.prior_solis.mover import MicroscopeMover




with STSClient('http://localhost', True, 1, "SOLIS_STAGE", True, True) as sts_client:
    with MicroscopeMover() as mover:
        if mover.connection_active:
            def move(pt:STSPoint):
                destCoord:Coordinate=Coordinate(pt.x, pt.y)
                print(pt.x, pt.y)
                mover.set_coordinates(destCoord)
            def measure(exp_id:int, pt_num:int):
                directory="P://temp"
                filename=f"{exp_id}_{pt_num}.asc"
                mover.set_output_directory(directory)
                mover.take_capture(filename)
                sts_client.send_file(os.path.join(directory,filename),exp_id,pt_num)
            def get_point():
                x,y=mover.get_coordinates().to_tuple(True)
                return STSPoint(int(x),int(y),0)

            
            sts_client.onmeasure=measure
            sts_client.onmove=move
            sts_client.get_points=get_point
            sts_client.current_cal_a=STSPoint(0,0,0)
            sts_client.current_cal_b=STSPoint(1,0,0)
            sts_client.current_cal_c=STSPoint(0,1,0)
            #wait for exit
            input()
            print("Shutdown received.")
        else:
            print("ERROR: mover not engaged")
    
