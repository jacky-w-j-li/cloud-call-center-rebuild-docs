/**
 * Created by yaxi on 2015-07-28.
 */


$(document).ready(function () {
    var init = function () {
        var socket = io.connect("http://localhost:5003",{"force new connection":true, query:{
            username:"haha",
            password:"dfdfd"
        }});//socket服务，后面的参数是指disconnect后，再次connect时开启一个新的socket通道
        socket.on("connect", function(data){
            alert("success");
            alert(data);
        });

        socket.on("error", function(data){
            alert("failure");
            alert(data);
        });
        socket.on("socketId", function (socketData) {
            var socketId = socketData.socketId;
            var port = socketData.port;
            var ip = socketData.ip;

            // do something...
            // 如建立跟后端服务的联系，他们之间可以用session维系
            // 后端可以维护这样的关系：{socketId:socketId, ip: ip, port:port, session:session}，
            // 后端服务就可以根据session找寻socketId, ip, port
            newSocket();
        });
        socket.on("pushMsg", function (data) {
            alert(data.signal);
            if (data.signal == 100) {
                doOne(data.msg);
                //do something...
            } else if (data.signal == 101) {
                doTwo(data.msg);
                //do something...
            }
            //更多业务处理...


        });

        //关闭事件时，调用socket的
        if (window.addEventListener) {
            window.addEventListener("close", function () {
                alert("用户离开");
                socket.disconnect();
            });
        } else {
            window.attachEvent("onclose", function () {
                alert("用户离开");
                socket.disconnect();
            });
        }
    };

    var newSocket = function(){
        $("#msgBox ul").append("<li>").append("新用户进来").append("</li>")
    };

    var doOne = function(msg){
        $("#msgBox ul").append("<li>").append(msg).append("</li>")
    };

    var doTwo = function(msg){
        $("#msgBox ul").append("<li>").append(msg).append("</li>")
    };

    init();
});