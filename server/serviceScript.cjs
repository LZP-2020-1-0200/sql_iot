var Service = require('node-windows').Service;

if(process.argv[2] === 'uninstall') {
  // get the service
  var svc = new Service({
    name:'Sequential thing server',
    script: 'D://sql_iot/server/build/server.js',
  });
  // Listen for the "uninstall" event so we know when it's done.
  svc.on('uninstall',function(){
    console.log('Uninstall complete.');
    console.log('The service exists: ',svc.exists);
  });

  // Uninstall the service.
  svc.uninstall();
} else if(process.argv[2] === 'install') {
  // Create a new service object
  var svc = new Service({
    name:'Sequential thing server',
    description: 'This service runs the Sequential thing server.',
    script: 'D://sql_iot/server/build/server.js',
    nodeOptions: [
      '--harmony',
      '--max_old_space_size=4096'
    ],
    dependsOn: ["MySQL80"]

    //, workingDirectory: '...'
    //, allowServiceLogon: true
  });

  // Listen for the "install" event, which indicates the
  // process is available as a service.
  svc.on('install',function(){
    svc.start();
  });

  svc.install();
} else {
  console.log('Please specify install or uninstall');
}