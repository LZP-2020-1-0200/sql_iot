function configureExperiment(experimentID){
    window.open('/experiment_config?id='+experimentID, '_blank');
}


function getExperiments(sampleId){
    $("#addExperiment_sampleId").val(sampleId);

    let exDiv=$('#experimentList');
    data = {count: 0, sampleId:sampleId};
    fetch('/experiments', {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
          "Content-Type": "application/json",
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    }).then(response=>response.json().then(experiments=>{
        console.log(experiments);
        let row=$("<tr></tr>")
        $(row).append($("<th></th>").text("Name"));
        $(row).append($("<th></th>").text("Time of creation"));
        $(row).append($("<th></th>").text("Medium"));
        exDiv.empty();
        exDiv.append(row);
        experiments.forEach(experiment => {
            let row=$("<tr></tr>")
            $(row).append($("<td></td>").text(experiment.Name));
            $(row).append($("<td></td>").text(new Date(experiment.StartDate).toString()));
            $(row).append($("<td></td>").text(experiment.Medium));
            
            exDiv.append(row);
            
            let button = $("<button></button>").text("Configure experiment");
            button.click(()=>configureExperiment(experiment.ID));
            $(row).append($("<td></td>").append(button));
        });
    }));
}
function getSamples(){
    let sampleDiv=$('#sampleList');
    data = {count: 0};
    fetch('/samples', {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
          "Content-Type": "application/json",
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    }).then(response=>response.json().then(samples=>{
        console.log(samples);
        let row=$("<tr></tr>")
        $(row).append($("<th></th>").text("Name"));
        $(row).append($("<th></th>").text("Time of creation"));
        $(row).append($("<th></th>").text("Description"));
        sampleDiv.empty();
        sampleDiv.append(row);
        samples.forEach(sample => {
            let row=$("<tr></tr>")
            $(row).append($("<td></td>").text(sample.Name));
            $(row).append($("<td></td>").text(new Date(sample.CreationTime).toString()));
            $(row).append($("<td></td>").text(sample.Description));
            let button = $("<button></button>").text("Select sample");
            button.addClass("sampleSelector");//not used for now
            button.attr("sampleId", sample.ID);//not used for now
            button.click(()=>getExperiments(sample.ID));
            $(row).append($("<td></td>").append(button));
            sampleDiv.append(row);
        });
    }));
}

$(()=>{
    getSamples();
    getExperiments(SELECTED_SAMPLE);
}); 