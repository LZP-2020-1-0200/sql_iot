// Example POST method implementation:
async function postData(url = "", data = {}, getResponse = true) {
    console.log(JSON.stringify(data));
    // Default options are marked with *
    const response = await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "omit", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "manual", // manual, *follow, error
      referrerPolicy: "origin", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    console.log(response.body);
    if(getResponse)return response.json(); // parses JSON response into native JavaScript objects
    if(!response.ok){
        alert(await response.text());
    }
}
// Example GET method implementation:
async function getData(url = "", data = {}) {
    let params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
        if(Array.isArray(value)){
            for(val of value){
                params.append(key, val);
            }
        }else{
            params.append(key, value);
        }
    }
    // Default options are marked with *
    const response = await fetch(url + "?" + params.toString(), {
      method: "GET", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    });
    console.log(response.body);
    return response.json(); // parses JSON response into native JavaScript objects
}

class STSController{
    constructor(address) {
        this.address=address;
        this.calA={x:0, y:0, z:0};
        this.calB={x:0, y:0, z:0};
        this.calC={x:0, y:0, z:0};
    }
    async getId(){
        let latestId=0
        await new Promise((resolve) => {
            getData(this.address+"/retrieve", {Id:0}).then((json)=>{
                resolve(json.latestId);
            });
          }).then(l=>latestId=l);
        return latestId;
    }

    getMessages(topics, latestId){
        return new Promise((resolve) => {
            getData(this.address+"/retrieve", {Id:latestId, "topics[]":topics}).then((json)=>{
                resolve(json);
            });
          });
    }

    emit(topic, body){
        return postData(this.address, {topic:topic, body:body}, false);
    }

    rel_move(x, y){
        return new Promise(async(resolve)=>{
            let pt_data = await this.getPoint();
            if(pt_data){
                pt_data.x+=x;
                pt_data.y+=y;
                await this.emit('move', {x:pt_data.x, y:pt_data.y, z:pt_data.z});
                resolve(true);
                return;
            }
            resolve(false);
        });
    }

    getPoint(){
        return new Promise(async(resolve)=>{
            let latestId= (await this.getId()).valueOf();
            await this.emit('point_info?',{});
            for(let i=0;i<10;i++){
                //wait for a bit
                await new Promise((resolveWait)=>setTimeout(resolveWait, 50));
                let msgs = (await this.getMessages(['point_info'],latestId));
                if(msgs.messages.length>0){
                    resolve(msgs.messages[0].body);
                    return;
                }else{
                    latestId=msgs.latestId;
                }
            }
            resolve(null);
            return;
        });
    }

    set_cal(cal_pt){
        return new Promise(async(resolve)=>{
            let pt = await this.getPoint();
            if(pt){
                if(cal_pt=="A"){
                    this.calA=pt;
                    this.emit("set_local_calibration",{point:cal_pt});
                }else if(cal_pt=="B"){
                    this.calB=pt;
                    this.emit("set_local_calibration",{point:cal_pt});
                }else if(cal_pt=="C"){
                    this.calC=pt;
                    this.emit("set_local_calibration",{point:cal_pt});
                }
            }
            resolve(false);
        });
    }
    addPointToSet(ptSId, ptNum, x,y,z){
        console.log({Id: ptSId, ptNum:ptNum, x:x, y:y, z:z});
        return postData(this.address + "/add_point", {Id: ptSId, ptNum:ptNum, x:x, y:y, z:z}, false);
    }
    removePointFromSet(ptSId, ptNum){
        console.log({Id: ptSId, ptNum:ptNum});
        return postData(this.address + "/remove_point", {Id: ptSId, ptNum:ptNum}, false);
    }
    getPointsOfSet(ptSetId){
        return getData(this.address + "/points_of_id", {Id:ptSetId});
    }
    async pingDevices(){
        await postData(this.address + "/ping", {}, false);
    }
    async getDevices(){
        let response =  await getData(this.address + "/devices",{});
        let devices = [];
        response.forEach(element => {
            devices.push(element.msg);
        });
        return devices;
    }

    async calibrateToExperiment(expId){
        await postData(this.address + "/calibrate", {exId:expId},false);
    }

    async launchExperiment(expId){
        await this.calibrateToExperiment(expId);
        await postData(this.address + "/start", {exId:expId}, false);
    }
}