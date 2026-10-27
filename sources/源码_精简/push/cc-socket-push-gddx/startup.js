var cluster = require('cluster');
var numCPUs = require('os').cpus().length;


if (cluster.isMaster) {
    var port = 5004;
    var ports = {
    };
    for (var i = 0; i < numCPUs; i++) {
        ports[port] = 0;
        port = port +1;
    }
    // Keep track of http requests
//    var numReqs = {};

//    setInterval(function() {
//        console.log("numReqs =", numReqs);
//    }, 1000);

    // Count requestes
    function messageHandler(msg) {
        console.log(JSON.stringify(msg));
        if (msg.cmd && msg.cmd == 'notifyRequest') {
            console.log(msg.id+"procee this request!");
        }
    }



    // Fork workers.
    for (var i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    Object.keys(cluster.workers).forEach(function(id) {

        cluster.workers[id].on('message', messageHandler);
    });


    cluster.on('fork',function(worker){
        console.log(worker.id +"now is start up!");
        for(var key in ports){
            if(ports[key] == 0){
                worker.httpServerPort = key;
                ports[key] = 1;
                break;
            }
        }

    });

    cluster.on('online', function(worker) {
        worker.send(worker.httpServerPort);
        console.log("Yay, the worker responded after it was forked");
    });

    cluster.on('listening', function(worker, address) {
        console.log("A worker is now connected to " + address.address + ":" + address.port);
    });

    cluster.on('disconnect', function(worker) {
        console.log('The worker #' + worker.id + ' has disconnected');
    });

    cluster.on('exit', function(worker, code, signal) {
        ports[worker.httpServerPort] = 0;
        var exitCode = worker.process.exitCode;
        console.log('worker ' + worker.process.pid + ' died ('+exitCode+'). restarting...');
        cluster.fork();
    });
} else {
    process.on("message", function(msg){
        console.log(msg);
        process.httpServerPort = msg;
        require('./app.js');
    });
}
