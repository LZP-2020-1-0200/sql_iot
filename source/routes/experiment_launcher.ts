



/*
import mysql from 'mysql2';

import {MessageQueue} from '../lib/messageQueue';

let cancelExperiment=false;

async function sequenceLoop(exId:number, messageQueue:MessageQueue, reqInstruments:{[key:number]:Set<string>}, point:any, maxSequenceNum:number){
    for(let i=0;i<=maxSequenceNum;i++){
        const msgid=messageQueue.getId();
        messageQueue.addMessage("measure", {experimentId:exId, sequence:i,point:{x:point.X, y:point.Y, z:point.Z}, pointNumber:point.PointNumber});
        if(reqInstruments[i]){
            const reqList=new Set<string>(reqInstruments[i]);
            while(reqList.size>0){
                await new Promise(resolve=>setTimeout(resolve,100));
                //cancel override
                if(cancelExperiment){
                    return;
                }
                const readyResults=[...messageQueue.messagesSinceId(msgid, ["ready"])];
                readyResults.forEach((val)=>{
                    if(val.msg.sequence==i){
                        reqList.delete(val.msg.name);
                    }
                });
            }
        }
    }

}

async function experimentLoop(exId:number, messageQueue:MessageQueue, reqInstruments:{[key:number]:Set<string>}, points:any, maxSequenceNum:number){
    for(let i=0;i<points.length;i++){
        await sequenceLoop(exId, messageQueue, reqInstruments, points[i], maxSequenceNum);
        //cancel override
        if(cancelExperiment){
            console.log("Experiment cancellation override triggered.");
        }
    }
    console.log("Experiment complete");
}
let lastPingId=0;
export function instrument_ping(messageQueue:MessageQueue){
    lastPingId=messageQueue.getId();
    messageQueue.addMessage("instrument_ping", {});
}
export function get_instruments(messageQueue:MessageQueue){
    return [...messageQueue.messagesSinceId(lastPingId,["instrument_data"])];
}

export function calibrate(messageQueue:MessageQueue, experimentId:number, connectionParams:mysql.ConnectionOptions){
    const connection=mysql.createConnection(connectionParams);
    const query = mysql.format(`
        SELECT
        pointsets.CalibrationAx as Ax, pointsets.CalibrationAy as Ay, pointsets.CalibrationAz as Az,
        pointsets.CalibrationBx as Bx, pointsets.CalibrationBy as "By", pointsets.CalibrationBz as Bz,
        pointsets.CalibrationCx as Cx, pointsets.CalibrationCy as Cy, pointsets.CalibrationCz as Cz
        FROM experiments, pointsets
        WHERE experiments.ID=? AND experiments.PointSetID=pointsets.ID
        LIMIT 1;`, [experimentId]);
    connection.beginTransaction((err)=>{if(err)console.log(err);});
    connection.query<mysql.RowDataPacket[]>(query,async(err, Qresponse, Qfields)=>{
        if(err){
            console.log(err);
            return;
        }
        const calibrationBody={
            "A":{
                "x":Qresponse[0]["Ax"],
                "y":Qresponse[0]["Ay"],
                "z":Qresponse[0]["Az"]
            },
            "B":{
                "x":Qresponse[0]["Bx"],
                "y":Qresponse[0]["By"],
                "z":Qresponse[0]["Bz"]
            },
            "C":{
                "x":Qresponse[0]["Cx"],
                "y":Qresponse[0]["Cy"],
                "z":Qresponse[0]["Cz"]
            }
        };
        messageQueue.addMessage('calibration',calibrationBody);
    });
    connection.commit();
}

export function launch(messageQueue:MessageQueue, experimentId:number, connectionParams:mysql.ConnectionOptions){
    const connection=mysql.createConnection(connectionParams);
    const query = 
        mysql.format(`SELECT Points.PointNumber, Points.X, Points.Y, Points.Z FROM experiments, Points
        WHERE experiments.PointSetID=Points.PointSetID AND experiments.ID=?
        ORDER BY Points.PointNumber;`, [experimentId]);
    connection.beginTransaction((err)=>{if(err)console.log(err);});
    connection.query(query,async(err, Qresponse, Qfields)=>{
        if(err){
            console.log(err);
            return;
        }
        cancelExperiment=false;
        let instr_data = get_instruments(messageQueue);
        calibrate(messageQueue, experimentId, connectionParams);//send calibration data to the devices
        console.log(instr_data);
        console.log(Qresponse);
        let maxSequenceNum = 0;
        let requiredInstrumentWait:{[key:number]:Set<string>}={};
        instr_data.forEach(msg=>{
            let priority:boolean=msg.msg.priority;
            let sequence:number=msg.msg.sequence;
            let name:string=msg.msg.name;
            if(maxSequenceNum<sequence)maxSequenceNum=sequence;
            if(priority){
                if(!requiredInstrumentWait[sequence]){
                    requiredInstrumentWait[sequence]= new Set<string>([]);
                }
                requiredInstrumentWait[sequence].add(name);
            }
        });
        experimentLoop(experimentId, messageQueue, requiredInstrumentWait, Qresponse, maxSequenceNum);
    });
    connection.commit();
};*/