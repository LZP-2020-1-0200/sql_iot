import express from 'express';
import bodyParser from 'body-parser';
import type { MessagePayload, QueueResponse} from './lib/messageQueue.js';
import { mainQueue } from './lib/messageQueue.js';
//test();

const app = express();
const port = 80;
// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static('static'));
//var mysql      = require('mysql2');

//dev url logger
app.use((req, res, next)=>{
	//console.log(req.url);
	next();
});



// messageQueue route 
import {router as msgQRouter} from './routes/messageQueue.js';
app.use('/messageQueue', msgQRouter);

import { sampleController } from './routes/sampleController.js';
app.use('/samples', sampleController);

import { pointsetController } from './routes/pointsetController.js';
app.use('/points', pointsetController);

import { pointController } from './routes/pointController.js';
app.use('/pt', pointController);

app.get('/', (req, res) => {res.redirect('/samples');});
/*

interface Experiment extends RowDataPacket {
    ID?: number
    Directory?: string
    Name?:string
    Medium?:string
    Mode?:string
  }
const connectionParams={
    host     : 'localhost',
    user     : "iot_server",
    password : "$janG^eMZDp2CZ40J0nm",
    database : "experiment_db"
}

var connection = mysql.createConnection(connectionParams);

function error_report(err:any){
    // TODO: implement logging
    if(err)console.error(err);
}


const upload = multer({ dest: os.tmpdir() });
console.log(os.tmpdir());
app.post('/upload_measurement', upload.single('file'), function(req, res) {
    const body = req.body;
    const file = req.file;
    
    console.log(body);
    console.log(file);
    if(file){
        connection.beginTransaction(error_report);
        //fetch save dir
        let dir_query = mysql.format("SELECT Directory FROM experiments WHERE ID=? LIMIT 1;",
                [req.body.experimentId]);
        connection.query<Experiment[]>(dir_query, (err, Qresponse, Qfields)=>{
            error_report(err);
            if(!err && Qresponse[0].Directory){

                let directory:string=Qresponse[0].Directory;
                let targetPath=path.join(directory, file.filename+path.extname(file.originalname));
                console.log(targetPath);
                let query = mysql.format(
                    "INSERT INTO measurments(ExperimentId, PointNumber, FileType, FilePath, OriginalFilename) "+
                    "VALUES (?, ?, ?, ?, ?);", 
                    [
                        req.body.experimentId, 
                        req.body.point_number, 
                        path.extname(file.originalname), 
                        targetPath,
                        file.originalname
                    ]);
                connection.beginTransaction(error_report);
                connection.query(query,(err, Qresponse, Qfields)=>{
                    error_report(err);
                    if(err){
                        
                        res.sendStatus(400);
                        return;
                    }
                    fs.copyFile(file.path, targetPath,fs.constants.COPYFILE_EXCL, (err)=>{
                        if(err){
                            console.log(`Copy from temp storage failed. See backup: ${file.path}`);
                            console.log(err);
                        }
                    });
                    res.sendStatus(200);
                });
                connection.commit();
            }else{
                res.sendStatus(400);
            }
        });
        connection.commit();
    }else{
        res.sendStatus(400);
    }
});

app.post('/add_pointset', (req, res)=>{
    
    console.log(req.body);
    //check if all required properties are found in the request
    let propertyList = ["name", "sampleId",
        "calAx", "calAy", "calAz",
        "calBx", "calBy", "calBz",
        "calCx", "calCy", "calCz"];
    if(propertyList.every(val=>(Object.keys(req.body).includes(val)))){
        //build query
        let query = mysql.format(`INSERT INTO pointsets
            (Name, sampleId, 
                CalibrationAx, CalibrationAy, CalibrationAz,
                CalibrationBx, CalibrationBy, CalibrationBz,
                CalibrationCx, CalibrationCy, CalibrationCz)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, 
            [
                req.body.name, Number(req.body.sampleId),
                Number(req.body.calAx), Number(req.body.calAy), Number(req.body.calAz),
                Number(req.body.calBx), Number(req.body.calBy), Number(req.body.calBz),
                Number(req.body.calCx), Number(req.body.calCy), Number(req.body.calCz)
            ]);
        //console.log(req.body);
        connection.beginTransaction(error_report);
        connection.query(query,(err, Qresponse, Qfields)=>{
            error_report(err);
        });
        connection.commit();
        res.redirect('back');
    }else{
        res.sendStatus(400);
    }
    
});

app.post('/add_sample', (req, res)=>{
    if(req.body.name && req.body.description){
        let query = mysql.format("INSERT INTO samples(Name, Description) VALUES (?, ?);", [req.body.name, req.body.description]);
        console.log(req.body);
        connection.beginTransaction(error_report);
        connection.query(query,(err, Qresponse, Qfields)=>{
            error_report(err);
        });
        connection.commit();
        res.redirect('back');
    }else{
        res.sendStatus(400);
    }
    
});




app.post('/add_experiment', (req, res)=>{
    if(req.body.name && req.body.medium && req.body.mode && req.body.pointSetId){
        let query = mysql.format("INSERT INTO experiments(Name, Medium, Mode, PointSetId) VALUES (?, ?, ?, ?);", 
            [req.body.name, req.body.medium,req.body.mode,req.body.pointSetId]);
        console.log(req.body);
        connection.beginTransaction(error_report);
        connection.query(query,(err, Qresponse, Qfields)=>{
            error_report(err);
            //res.send(Qresponse);
        });
        connection.commit();
        res.redirect("back");
    }else{
        res.sendStatus(400);
    }
    
});



app.post('/add_point', (req, res)=>{
    console.log(req.body);
    if(req.body.Id!=undefined && req.body.ptNum!=undefined && req.body.x!=undefined && req.body.y!=undefined && req.body.z!=undefined){
        let query = mysql.format("INSERT INTO points(PointSetID, PointNumber, X, Y, Z) VALUES (?, ?, ?, ?, ?);", 
            [req.body.Id, req.body.ptNum, req.body.x, req.body.y, req.body.z]);
        console.log(req.body);
        connection.beginTransaction(error_report);
        connection.query(query,(err, Qresponse, Qfields)=>{
            error_report(err);
            if(err){
                res.status(400);
                res.send("Bad inputs - does this point not exist already?");
            }else res.sendStatus(200);
        });
        connection.commit();
    }else{
        res.sendStatus(400);
    }
    
});
app.post('/remove_point', (req, res)=>{
    console.log(req.body);
    if(typeof req.body.Id === 'number' && typeof req.body.ptNum === 'number'){
        let query = mysql.format("DELETE FROM points WHERE PointSetID=? AND PointNumber=?;", 
            [req.body.Id, req.body.ptNum]);
        console.log(req.body);
        connection.beginTransaction(error_report);
        connection.query(query,(err, Qresponse, Qfields)=>{
            error_report(err);
            if(err){
                res.status(400);
                res.send("Bad inputs");
            }else res.sendStatus(200);
        });
        connection.commit();
    }else{
        res.sendStatus(400);
    }
});


app.get('/launch', (req, res)=>{
    let q = "SELECT ID, Name, Medium, Mode, StartDate FROM experiments;";
    connection.query(q,(err, Qresponse, Qfields)=>{
        error_report(err);
        console.log(Qresponse);
        res.render('pages/launch.ejs', {experiments:Qresponse});
    });
    
});
/*
app.post('/ping', (req, res)=>{
    instrument_ping(messageQueue);
    res.sendStatus(200);
});
app.get('/devices', (req, res)=>{
    res.status(200);
    res.json(get_instruments(messageQueue));
});
app.post('/calibrate', (req, res)=>{
    if(req.is('json')){
        if(typeof req.body.exId === 'number'){
            calibrate(messageQueue, req.body.exId, connectionParams);
            res.sendStatus(200);
        }
    }else{
        res.status(415);
        res.send("Invalid type");
    }
});

app.post('/start', (req, res)=>{
    if(req.is('json')){
        if(typeof req.body.exId === 'number'){
            launch(messageQueue, req.body.exId, connectionParams);
            res.sendStatus(200);
        }
    }else{
        res.status(415);
        res.send("Invalid type");
    }
});



app.get('/experiment', (req, res)=>{
    let dir_query = mysql.format("SELECT ID, Name, Medium, Mode, Description FROM experiments WHERE PointSetID=?;",
                [req.query.ptSID]);
    connection.query(dir_query,(err, Qresponse, Qfields)=>{
        error_report(err);
        res.render('pages/experiments.ejs', {experiments:Qresponse});
    });
});

app.get('/pointset', (req, res)=>{
    let select="SELECT ID, Name, Datetime as CreationTime, Description FROM samples;";
    
    connection.query(select,(err, Qresponse, Qfields)=>{
        error_report(err);
        res.render('pages/pointset.ejs', {samples:Qresponse, maxDescL: 40});
    });
});
app.get('/point', (req, res)=>{
    res.render('pages/point.ejs', {pointSetId: req.query.Id || 0});
});
app.get('/points_of_id', (req, res)=>{
    console.log(req.query);
    if(req.query.Id){
        let select="SELECT PointNumber, X,Y,Z FROM points WHERE PointSetID=? ORDER BY PointNumber ASC;";
        let query=mysql.format(select, [Number(req.query.Id)]);
        connection.query(query,(err, Qresponse, Qfields)=>{
            error_report(err);
            let select=`SELECT
                CalibrationAx as Ax, CalibrationAy as Ay, CalibrationAz as Az,
                CalibrationBx as Bx, CalibrationBy as 'By', CalibrationBz as Bz,
                CalibrationCx as Cx, CalibrationCy as Cy, CalibrationCz as Cz
                FROM pointsets WHERE ID=?;`;
            let query=mysql.format(select, [Number(req.query.Id)]);
            connection.query(query,(err, Qresponse2, Qfields)=>{
                error_report(err);
                console.log({points: Qresponse, calPoints: Qresponse2});
                res.status(200).json({points: Qresponse, calPoints: Qresponse2});
            });
        });
    }else{
        res.status(415);
        res.send("Invalid type");
    }
});

app.post('/samples', (req, res)=>{
    if(req.is('json')){
        let loadCount = req.body.count;
        let select="SELECT ID, Name, Datetime as CreationTime, Description FROM samples";
        let query="";
        if(loadCount!=0){
            query=mysql.format(select+" LIMIT ?;",[req.body.count])
        }else{
            query=select+";";
        }
        connection.query(query,(err, Qresponse, Qfields)=>{
            error_report(err);
            console.log(Qresponse);
            res.send(Qresponse);
        });
    }else{
        res.status(415);
        res.send("Invalid type");
    }
});
app.post('/experiments', (req, res)=>{
    if(req.is('json')){
        let loadCount = Number(req.body.count || 20);
        let q = mysql.format("SELECT ID, Name, Medium, Mode, StartDate FROM experiments LIMIT ?;", [loadCount]);
        connection.query(q,(err, Qresponse, Qfields)=>{
            error_report(err);
            console.log(Qresponse);
            res.send(Qresponse);
        });
    }else{
        res.status(415);
        res.send("Invalid type");
    }
});
*/
app.post('/', (req, res)=>{
	if(req.is('json')){
		if(typeof req.body.topic === 'string' && req.body.body instanceof Object){
			mainQueue.addMessage(req.body.topic, req.body.body);
			res.status(200);
			res.end();
		}else{
			res.status(400);
			res.send("Invalid json");
		}
	}else{
		res.status(415);
		res.send("Invalid type");
	}
    
});
app.get('/retrieve', (req, res) => {
	const id=Number(req.query.Id);
	const topics:string[]=[];
	if( req.query.topics instanceof Array){
		req.query.topics.forEach((val)=>{if(typeof val ==='string')topics.push(val.toString());});
	}
	if(!isNaN(id)){
		const response: QueueResponse={latestId:mainQueue.getId(), messages:[]};
		const messages: MessagePayload[]=[...mainQueue.messagesSinceId(id,topics)];
		messages.forEach(value=>response.messages.push(value));
		res.send(response);
	}else{
		res.status(400);
		const queueResponse:QueueResponse={latestId:mainQueue.getId(),messages:[]};
		res.send(queueResponse);
	}
});




const server=app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});

export function stop(){
	server.close();
}
/*
//Server stop handler
const readlineInterface= readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

readlineInterface.question('Press enter to stop server\n', dat => {
    
    server.close();
    process.exit(0);
    readlineInterface.close();
});*/
