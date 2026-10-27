dojo.provide("icallcenter.logon");

icallcenter.logon.sessionHandler = null;

icallcenter.logon.startLogon = function(){
	var self = this;
	var returnUrl = (dojo.cookie("customerReturnURL") != null)? dojo.cookie("customerReturnURL") : "./login.html";

    var request = {
        url: "./service/loginManager/getUserAllInfo",
        params: null,
        onNativeLoad: function(response) {
            if (response.resultCode == '0000' && response.result != null) {
            	if (!self.onLogon(response.result)) {
            		dojo.byId('loaderInner_text').innerHTML = "登录失败,请您点击<a href='" + returnUrl + "'><strong style='color:red'>这里</strong></a>重新登录";
            	} else {
               		dojo.byId('loaderInner_text').innerHTML = "页面加载完成";
							setTimeout("hideLoader()",250);	
				}
            }else{
                var reason = response.resultMsg;
            	dojo.byId('loaderInner_text').innerHTML = reason + "</br>请您点击<a href='" + returnUrl + "'><strong style='color:red'>这里</strong></a>重新登录";
            }        
        }
    }    
    icallcenter.common.request(request); 	
};


// 登录成功后调用
//
icallcenter.logon.onLogon = function(user) {
    // 初始化用户信息
    this.initUserInfo(user);
    // 初始化用户字典数据
    this.initUserDic();
    // 针对字典的初始化做一个判断
    if (userDic) {
        if ("none" != userInfo.extenType) {
            // 软电话初始化
             if(eval(icallcenter.logon.getChatCookie("isWebchat"))==true){
         				dojo.byId('softphonebar').style.right='45px';
          	 }
            if (!this.initPhone()) return false;
        } else {
            dojo.byId("softphonebar").style.display = "none"; 
            dojo.byId('onlinestatus').className='onlinestatus2'; 
//            if(userInfo.sipNo){
            	if (!this.initPhoneWithNone()) return false;
//          	}
         }   
        // 应用初始化
        this.initFramework(); 
        // 初始化界面信息
        this.initUIInfo();
        // 隐藏登录信息对话框
        allowLogin = false; 
        if (phone) {
            //this.initUserSession();
        }

        return true;     
    } else {     
        return false;
    }
};

// 初始化UserInfo

icallcenter.logon.initUserInfo = function(user) {
    if (user) {
    	console.dir(user);
        userInfo = user;
        dojo.cookie("extenType", user.extenType, {expires: 30});
        dojo.cookie("userName", user.userName, {expires: 30});
        dojo.cookie("accountName", user.accountName, {expires: 30});
    }   
};

// 初始化界面信息
//
icallcenter.logon.initUIInfo = function() {
    console.debug("初始化界面信息");
    dojo.byId("icc.login.exten").innerText = userInfo.extension;
    dojo.byId("icc.login.name").innerText = userDic.getNameOrCode("USER", userInfo.userId);
    dojo.byId("icc.login.accountName").innerText = userInfo.accountName;        
    dojo.byId("icc.login.userName").innerText = userInfo.userName;     
};

// 隐藏登录对话框
//      
icallcenter.logon.hideLoginDialg = function() {
    var divLogin = dojo.byId('loginDiv'); 
    dojo.fadeOut({ node: divLogin, duration:500,
        onEnd: function(){ 
            divLogin.style.display = "none"; 
        }
    }).play();
};

//初始化软电话
icallcenter.logon.initPhoneWithNone = function() {
    dojo.require("icallcenter.Phone");
//    dojo.byId("softphonebar").style.display = "";  
    if(userInfo.proxyPbx){
        for(i in userInfo.allQueues){
        	userInfo.allQueues[i]=userInfo.allQueues[i]+'@'+userInfo.proxyPbx;
        }
        for(i in userInfo.allAgents){
        	userInfo.allAgents[i]=userInfo.allAgents[i]+'@'+userInfo.proxyPbx;
        }
    }
    var config = {
		accountId: userInfo.accountId,    	
    	allQueues: userInfo.allQueues,
    	allAgents: userInfo.allAgents,
    	trueName: unescape(userInfo.name),
    	 
       accountName: userInfo.accountName,
       loginName: userInfo.userName + '@' + userInfo.accountId, 
       password: userInfo.password, 
       proxy_url: userInfo.proxy, 
       extension: userInfo.extension,
       sipNo: userInfo.sipNo,
       sipPassword: userInfo.sipPassword,
       pbx_in_ip: userInfo.proxyPbx,
       pbx_ex_ip: userInfo.pbx,
       file_server_ip: userInfo.fileServer,
       extenType: userInfo.extenType,
       queues: userInfo.queues,
       dialOutPrefix: userInfo.dialOutPrefix,
       xferPrefix: userInfo.xferPrefix,
       didNum: userInfo.didNum,
       autoBusy: userInfo.autoBusy,
       redirectPhoneNum: userInfo.redirectPhoneNum,
       userId: userInfo.userId,
       serviceNo: userInfo.serviceNo
    }
    console.dir(config);
    // 加载软电话
    phone = icallcenter.Phone.registerEvent(config);
    return true;
};

// 初始化软电话
icallcenter.logon.initPhone = function() {
    console.info("加载软电话");
    dojo.require("icallcenter.Phone");
    dojo.byId("softphonebar").style.display = "";    
    for(i in userInfo.allQueues){
    	userInfo.allQueues[i]=userInfo.allQueues[i]+'@'+userInfo.proxyPbx;
    }
    for(i in userInfo.allAgents){
    	userInfo.allAgents[i]=userInfo.allAgents[i]+'@'+userInfo.proxyPbx;
    }

    var config = {
			 accountId: userInfo.accountId,    	
    	 allQueues: userInfo.allQueues,
    	 allAgents: userInfo.allAgents,
    	 trueName: unescape(userInfo.name),
    	 
       accountName: userInfo.accountName,
       loginName: userInfo.userName + '@' + userInfo.accountId, 
       password: userInfo.password, 
       proxy_url: userInfo.proxy, 
       extension: userInfo.extension,
       sipNo: userInfo.sipNo,
       sipPassword: userInfo.sipPassword,
       pbx_in_ip: userInfo.proxyPbx,
       pbx_ex_ip: userInfo.pbx,
       file_server_ip: userInfo.fileServer,
       extenType: userInfo.extenType,
       queues: userInfo.queues,
       dialOutPrefix: userInfo.dialOutPrefix,
       xferPrefix: userInfo.xferPrefix,
       didNum: userInfo.didNum,
       autoBusy: userInfo.autoBusy,
       redirectPhoneNum: userInfo.redirectPhoneNum,
       userId: userInfo.userId,
       serviceNo: userInfo.serviceNo
    }
    console.dir(config);
    // 加载软电话
    phone = icallcenter.Phone.registerEvent(config);
    if (phone) {
        dojo.require("icallcenter.SoftphoneBar");
        dojo.require("icallcenter.CallProcessor");
        softphoneBar = new icallcenter.SoftphoneBar(phone, "softphonebar");
        callProcessor = new icallcenter.CallProcessor(phone);
        dojo.byId("liState").style.display = ""; 
        var extenType = phone.extenType;       
        if (extenType == 'sip' && userInfo.redirect) {
            dojo.byId("liChangeConnect").innerHTML = "<a href=\"javascript:softphoneBar.changePhone('Local')\">直线接听</a>";
            dojo.byId("liChangeConnect").style.display = "";               
        }
        
        if (phone.autoBusy) {
            dojo.byId("liAutoIdle").style.display = "";        
        } else {
            dojo.byId("liAutoBusy").style.display = "";        
        }
        // 定时更新技能组的状态
        accountSkillgroups = userDic.getPairs("SKILLGROUP_NO");
        this.updateSkillGroupStatus();
        window.setInterval("icallcenter.logon.updateSkillGroupStatus()", 10000);    
	      var evtHandle = phone.register("EvtMonitorQueue", null,function(){icallcenter.logon.updateSingleSkillGroupStatus();});  //订阅队列事件
	      queueHandler.push(evtHandle);
        
        return true;
    } else {
        console.error("加载软电话失败");
        return false;
    }
};

// 加载用户字典数据
icallcenter.logon.initUserDic = function() {       
    console.debug("加载本地用户字典数据");    
    var self = this;        
    var url = "./service/clientDicService/loadDictionary?accountName=" + userInfo.accountName;
    var d = dojo.xhrPost({
        url: url,
        handleAs: "json",
        sync: true,
        load: function(response, ioArgs) {
            console.debug("开始初始化USERDIC");
          if (response.resultCode == '0000') {
                console.debug("初始化USERDIC");
                userDic = new icallcenter.UserDictionary(response.result);
                userDic.init();          
          } else {
                console.error(response.result);  
          }
        },
        error: function(response, ioArgs) {
            console.debug(response);
        } 
    });    
    return d;
};

// 初始化Session
icallcenter.logon.initUserSession = function() {  
    console.debug("初始化用户Session");    
    var self = this;
    var userSession = {
        userId: userInfo.userId,
        accountId: userInfo.accountId,
        extenType: userInfo.extenType,
        sessionId: userInfo.cookieId,
        loginType: userInfo.loginType,
        extension: userInfo.extension,
        sipNo: userInfo.sipNo,
        queues: userInfo.queues.join(",") 
    };
    console.dir(userSession);
    var submitData = [userSession];          
    var url = "./service/userSessionService/insertSession";
    var d = dojo.xhrPost({
        url: url,
        handleAs: "json",
        sync: false,
        content: {json: dojo.toJson(submitData)},        
        load: function(response, ioArgs) {
          if (response.resultCode == '0000') {
                self.sessionHandler = window.setInterval(icallcenter.logon.iamLiving, 30000);         
          } else {
                console.error(response.result);  
          }
        },
        error: function(response, ioArgs) {
            console.debug(response);
        } 
    });    
    return d;
};

// 初始化framework
// 
icallcenter.logon.initFramework = function(userFunctions, i) {
    var self = this;
    console.info("初始化framework");
    var taskManagerWidget = dijit.byId("main");
    tm = new icallcenter.SimpleTaskManager(taskManagerWidget);
    dm = new icallcenter.DialogManager();   
    mm = new icallcenter.TemplateManager();
    fv = new icallcenter.Validator();
    jtm = new icallcenter.JspTemplateManager();
	ddl = new icallcenter.DragDropLayer();

    dojo.forEach(userInfo.functions, function(func){
         if (func.accountFunctionType == "menu.agent") {
         	  //if (func.accountFunctionValue == "agent.monitor" && !phone) return;
              console.debug("功能权限[%s][%s]", func.accountFunctionName, func.accountFunctionValue);
              var e = document.createElement("li");
              var a = document.createElement("a"); 
              var t = document.createElement(func.accountFunctionName);
              a.appendChild(t);
              a.id = "menu." + func.accountFunctionValue;
              a.href = "javascript:" + func.accountFunctionUrl;
              a.innerHTML = func.accountFunctionName;
              e.appendChild(a); 
              dojo.byId("agentMenu").appendChild(e);
              if (func.isDefault == '1') {
                 console.debug("[%s]", func.accountFunctionUrl);
                 eval(func.accountFunctionUrl);
              }
         }
    }); 
	var owns = dojo.map(userInfo.functions, function(func) {
        return func.accountFunctionValue;
    });
    if (dojo.indexOf(owns, "agent.km") >= 0) {
       dojo.byId("hollykm").style.display = ''; 	    
    } 
	if (dojo.indexOf(owns, "agent.contactList") >= 0) {
       dojo.byId("contactList").style.display = ''; 	    
    } 

};

//显示测试界面
icallcenter.logon.showTest = function() {
    tm.popupTask('./action/customer/test.do', 'agent.test');
};

//显示测试界面
icallcenter.logon.show = function() {    
    dijit.byId("sideleft").domNode.style.display = "";
    var box_left = dojo.marginBox(dijit.byId("sideleft").domNode);
    var box_main = dojo.marginBox(dijit.byId("main").domNode); 
    var box_switcher = dojo.marginBox(dijit.byId("switcher").domNode);
    box_main.w -= box_left.w;    
    box_main.l += box_left.w;
    dijit.byId("main").resize(box_main);     
    box_switcher.l += box_left.w;    
    dijit.byId("switcher").resize(box_switcher);    
    if (dijit.byId("icc.workspace.rightPane")) {
        var box_right = dojo.marginBox(dijit.byId("icc.workspace.rightPane").domNode);   
        box_right.w -= box_left.w;
    }
    if (dijit.byId("icc.workspace.rightPane")) {
        if (tm.context.id == 'agent.workspace') {
            dijit.byId("icc.workspace.rightPane").resize(box_right);     
        } else {
            icallcenter.workspace.offset -= box_left.w;           
        }
    }
    dojo.byId("imgHide").style.display = "";
    dojo.byId("imgShow").style.display = "none";
};

icallcenter.logon.hide = function() {    
    var box_left = dojo.marginBox(dijit.byId("sideleft").domNode);
    var box_main = dojo.marginBox(dijit.byId("main").domNode);   
    var box_switcher = dojo.marginBox(dijit.byId("switcher").domNode);
    box_main.w += box_left.w;    
    box_main.l -= box_left.w;
    dijit.byId("main").resize(box_main);    
    box_switcher.l -= box_left.w;
    dijit.byId("switcher").resize(box_switcher);
    if (dijit.byId("icc.workspace.rightPane")) {
        var box_right = dojo.marginBox(dijit.byId("icc.workspace.rightPane").domNode);
        box_right.w += box_left.w;    
    }
    if (dijit.byId("icc.workspace.rightPane")) {
        if (tm.context.id == 'agent.workspace') {   
            dijit.byId("icc.workspace.rightPane").resize(box_right);    
        } else {
            icallcenter.workspace.offset += box_left.w;    
        }
    }
    dijit.byId("sideleft").domNode.style.display = "none";
    dojo.byId("imgHide").style.display = "none";
    dojo.byId("imgShow").style.display = "";
};


// 显示修改密码界面
icallcenter.logon.showModifyPassword = function() {
    dm.showDialog('accountUserPassword', '修改密码', './account/user_Password.html', {width:'340', height:'230'},'logo');
};

// 显示修改电话界面
icallcenter.logon.readyToChangePhone = function() {
    dm.showDialog('changePhone', '更改接入方式', './callprocessor/softphone/change_phone.html', {width:'340', height:'230'});
};

// 准备登出
icallcenter.logon.confirmLogout = function() {
     var dlgLogOut = dijit.byId("icc.loginOutDlg");
     dojo.byId("icc.logon.reserveNum").checked = false;  
     dlgLogOut.show();
     if (!phone || phone.extenType != "Local") {
        dojo.byId("icc.logon.reserveNumDiv").style.visibility = "hidden";   
     }
};

// 登出
//
icallcenter.logon.logout = function() {
    console.debug("退出系统");
	var returnUrl = (dojo.cookie("customerReturnURL") != null)? dojo.cookie("customerReturnURL") : "./login.html";

  //使坐席离线
 //   frames["im_zx_roster"].location.href="#";
    var removeQueue = !dojo.byId("icc.logon.reserveNum") || !dojo.byId("icc.logon.reserveNum").checked;
     var submitData = [removeQueue];
     if(monitor){
     	monitor.destroy();	
     }
     
    if(queueHandler && phone) {
      for (var i in queueHandler) {    
            phone.unregister(queueHandler[i]);
      }
    }
//    if (phone && phone.extenType!='none') {
    if (phone) {
            console.debug("卸载电话[removeQueue=%s]", removeQueue);
	    phone.destroy(removeQueue);
            console.debug("清除事件XHR");
	    icallcenter.xhr.clear();
        var ajaxRequest = new icallcenter.ajaxRequest({
            url: "./service/loginManager/logout?loginName=" + userInfo.accountName,
            content: {json: dojo.toJson(submitData)},
            handleAs: "json",
            preventCache: true,
            timeout: 10000,
            load: function(response, ioArgs) {
              console.debug("退出请求返回");
              if (response.resultCode == '0000') {  
						window.location = returnUrl;                      
              } 
            },
            error: function(response, ioArgs) {
               //alert("退出请求失败,请检查本地网络连接");
            } 
        });     
        console.debug("发送退出请求");
        ajaxRequest.doGet();            
        console.debug("退出请求调用完成");
    } else {
        window.location = returnUrl;      
    }
};


icallcenter.logon.iamLiving = function() {
    console.debug("发送心跳");
    var self = this;
    var ajaxRequest = new icallcenter.ajaxRequest({
        url: "./service/userSessionService/iamLiving",
        handleAs: "json",
        preventCache: true,
        timeout: 10000,
        load: function(response, ioArgs) {
            if (response.resultCode = '0000') {
                if (response.result == "session_update_success") {
                     console.debug("心跳发送成功");
                } else if (response.result == "session_not_exist") {
                     console.debug("SESSION已经失效");
                     window.clearInterval(self.sessionHandler);
                     alert("当前用户已经在其他地方登录, 点击确定后当前应用自动退出");                   
	             window.location = "./login.html";      
                }                
            }
           
        },
        error: function(response, ioArgs) {
           console.debug("心跳发送失败");
        } 
    });     
    ajaxRequest.doGet();       
};

// 实时更新技能组的状态
icallcenter.logon.updateSingleSkillGroupStatus = function() {
//	alert(curQueueObj+"\n"+userDic.getNameOrCode("SKILLGROUP_NO", curQueueObj));
		if(curQueueObj){
			var curQueue=phone.monitorQueues[curQueueObj];
  		if(curQueue){
	        dojo.byId("icc.login.queueName").innerText = userDic.getNameOrCode("SKILLGROUP_NO", curQueueObj);
	        dojo.byId("icc.login.waitCount").innerText = curQueue.queueWaitCount;
	        dojo.byId("icc.login.idleCount").innerText = curQueue.idleAgentCount;             
  		}else{
  			curQueue={queueWaitCount:0,idleAgentCount:0};
        dojo.byId("icc.login.queueName").innerText = userDic.getNameOrCode("SKILLGROUP_NO", curQueueObj);
        dojo.byId("icc.login.waitCount").innerText = curQueue.queueWaitCount;
        dojo.byId("icc.login.idleCount").innerText = curQueue.idleAgentCount;             
  		}             
		}
};

// 更新技能组的状态
icallcenter.logon.updateSkillGroupStatus = function() {
    var queues = userInfo.queues;
    if (queues.length > 0 ) {
        curQueueObj = queues.pop();
        
        if (curQueueObj.length == 9 || curQueueObj.length == 12) {
            queues.unshift(curQueueObj);    
            return;
        }
        console.debug("开始查询队列状态[%s]", curQueueObj);
        if(dojo.getObject("phone.monitorQueues")){
        		var curQueue=phone.monitorQueues[curQueueObj];
        		if(curQueue){
				        dojo.byId("icc.login.queueName").innerText = userDic.getNameOrCode("SKILLGROUP_NO", curQueueObj);
				        dojo.byId("icc.login.waitCount").innerText = curQueue.queueWaitCount;
				        dojo.byId("icc.login.idleCount").innerText = curQueue.idleAgentCount;             
        		}else{
        			curQueue={queueWaitCount:0,idleAgentCount:0};
			        dojo.byId("icc.login.queueName").innerText = userDic.getNameOrCode("SKILLGROUP_NO", curQueueObj);
			        dojo.byId("icc.login.waitCount").innerText = curQueue.queueWaitCount;
			        dojo.byId("icc.login.idleCount").innerText = curQueue.idleAgentCount;             
        		}
        }

          
       /* phone.queryQueue(queue, function(evtJson) {
            var tblQueueState = dojo.byId('icc.login.queueState');         
            dojo.byId("icc.login.queueName").innerText = userDic.getNameOrCode("SKILLGROUP_NO", queue);
            dojo.byId("icc.login.waitCount").innerText = evtJson[0];
            dojo.byId("icc.login.idleCount").innerText = evtJson[2];             
        });*/
        queues.unshift(curQueueObj);    
    }
};

icallcenter.logon.onExtenTypeChanged = function(extenType) {
    dojo.byId("icc.login.analogTelNum").disabled = (extenType != "Local");
    var color = (extenType == "Local") ? "#E1EFF9" : "#C0C0C0";
    dojo.byId("icc.login.analogTelNum").style.backgroundColor = color;
};


//修改用户密码
icallcenter.logon.modifyPassword = function(form) {   
    var theForm=dojo.byId(form)
    if( theForm.newPassword.value.search(" ") != -1 )//有空格
    {
        alert("新密码不能包括空格");
        return false;
    }
    if( theForm.newPasswordconfim.value.search(" ") != -1 )//有空格
    {
        alert("新密码不能包括空格");
        return false;
    }   
    if (!fv.Validate(theForm)) return false;
    //密码与确认密码必须相同
    if(theForm.newPassword.value!=theForm.newPasswordconfim.value)
    {
        alert("确认密码必须和新密码相同");
        return false;
    }
    //密码不能是中文
     var pattern = /^([\u4E00-\u9FA5])*$/gi;   
     if   (pattern.test(theForm.newPassword.value)) {
         alert("密码不能是中文.只能是数字字母");
         return false;
     } 
     var request = {
        url: "./service/accountUserService/updateUserPassword",
        params: [theForm.oldPassword.value,theForm.newPasswordconfim.value],
        onLoad: function(returnMessage) 
        {   
                if (returnMessage == "密码修改成功") {
                  dm.closeDialog();
                  dojo.publish("icc.public.message", [returnMessage]);
                } else {//显示错误信息
                    alert(returnMessage);
                } 
        }
     };
     icallcenter.common.request(request);  
};
//获取cookie值
icallcenter.logon.getChatCookie = function(name) { 
	var strCookie=document.cookie;
	var arrCookie=strCookie.split("; "); // 将多cookie切割为多个名/值对
	for(var i=0;i<arrCookie.length;i++){ // 遍历cookie数组，处理每个cookie对
		var arr=arrCookie[i].split("="); // 找到名称为userId的cookie，并返回它的值
		if(arr[0]==name)
		return arr[1];
	}
	return "";
}

//获取登录地址，仅在非正常退出时使用，正常使用时用logout函数的逻辑
icallcenter.logon.getReturnUrl = function() {   
	return returnUrl = (dojo.cookie("customerReturnURL") != null)? dojo.cookie("customerReturnURL") : "./login.html";
};