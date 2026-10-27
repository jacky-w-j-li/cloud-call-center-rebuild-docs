dojo.provide("icallcenter.workspace");

icallcenter.workspace.offset = 0;


icallcenter.workspace.setup = function(isAuth){
	tm_sub = new icallcenter.TaskManager(dijit.byId("icc.workspace.rightPane"));
	tm_sub.addContext("account.agent.workspace_rightpane", true);
	this.initWorkSheetCreate();
	icallcenter.taglib.TabPane.urlInit("icc.workspace_main.tab");
	this.popupIndex();
	
    /*if(eval(isAuth)==true){
     var userID=getUserId();
     
     if(eval(getChatCookie("isRegistry"))==true){
     document.all.im_zx_roster.src="jwchat/jwchat_main.html?jid="+userID+"&pass=123&register=false";
     }else{
     document.all.im_zx_roster.src="jwchat/jwchat_main.html?jid="+userID+"&pass=123&register=true&client=true&seatId="+tempUser;
     }
     }*/
};


icallcenter.workspace.show = function(){
    if (this.offset != 0) {
        var box_right = dojo.marginBox(dijit.byId("icc.workspace.rightPane").domNode);
        box_right.w += this.offset;
        dijit.byId("icc.workspace.rightPane").resize(box_right);
        this.offset = 0;
    }
    dijit.byId('icc.workspace.horizontalSplit').resize();
};

icallcenter.workspace.initWorkSheetCreate = function(){
	var node = dojo.byId("icc.workspace_main.action_legacy");
    dojo.forEach(userInfo.creatableWorkflows, function(dataObjectId){
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.innerHTML = userDic.getNameOrCode("WORKFLOW_TYPE", dataObjectId);
        var customerType = userDic.getName("BIZ_CUST_TYPE", dataObjectId);
        a.href = "javascript:icallcenter.workspace.popupWorkSheetCreate('" + dataObjectId + "','" + a.innerHTML + "','" + customerType + "');";
        node.appendChild(li);
        li.appendChild(a);
    });
	
    var node = dojo.byId("icc.workspace_main.action");
    dojo.forEach(userInfo.creatableWorkflows, function(dataObjectId){
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        var a = document.createElement("a");
        a.innerHTML = userDic.getNameOrCode("WORKFLOW_TYPE", dataObjectId);
        var customerType = userDic.getName("BIZ_CUST_TYPE", dataObjectId);
        a.href = "javascript:icallcenter.workspace.popupWorkSheetCreate('" + dataObjectId + "','" + a.innerHTML + "','" + customerType + "');";
		a.onclick = function(){
			dojo.byId('bus_popup_list').style.display = 'none';
		}
        node.appendChild(tr);
		tr.appendChild(td);
        td.appendChild(a);
    });
	dojo.forEach(dojo.query("tr",node),function(item){
		dojo.connect(item,"onmouseover",function(){
			item.style.backgroundColor='#eaeaea';
		});
		dojo.connect(item,"onmouseout",function(){
			item.style.backgroundColor='';
		});
	});
};
icallcenter.workspace.popupCallSheetCreate = function(callSheetId, customerType, customerId){
    var url = "./action/callsheet/preAddCallSheetBus.do?callSheetId=" + callSheetId + "&entryType=workspace";

    if (customerId) {
        url += "&customerId=" + customerId;
    }else if (dojo.getObject("phone.callObject.data.customerId") && isCO==0) {
        url += "&customerId=" + phone.callObject.data.customerId;
    }
    if (customerType) {
        url += "&customerType=" + customerType;
    }
    var date = new Date();
    var identity = date.valueOf();

    var param = null;
    if (phone) {
        param = {
            callObject: {
                connectType: phone.callObject.callType,
                originCallNo: phone.callObject.originCallNo,
                originCalledNo: phone.callObject.originCalledNo,
                province: phone.callObject.province,
                city: phone.callObject.city
            }
        };
    }
    if (typeof tm_sub == 'undefined')         return;
    var task_id = "callSheetId_" + callSheetId + "_" + identity;
    if (dojo.getObject("phone.callObject.callId")) {
        task_id = "add_callsheet_" + callSheetId + "_" + phone.callObject.callId;
    }
    console.debug('工单Task_id 是 [%s]', task_id);
    tm_sub.popupTask(task_id, '电话登记', "add_callsheet", 'account.agent.workspace_rightpane', url, {
        callObject: param
    }, null, null, false);
};
icallcenter.workspace.popupWorkSheetCreate = function(dataObjectId, dataObjectName, customerType, customerId){
    var url = "./action/businessnew/preAddWorkSheet.do?dataObjectId=" + dataObjectId + "&entryType=workspace";
    if (phone && isCO==0) {
		var o=phone.callObject;
		if (dojo.getObject('phone.callObject.data.callSheetId')) {
			url += "&callSheetId=" + o.data.callSheetId;
		}
		if (dojo.getObject('phone.callObject.originCallNo')) {
			url += "&callNo=" + o.originCallNo;
		}
		if (dojo.getObject('phone.callObject.originCalledNo')) {
			url += "&calledNo=" + o.originCalledNo;
		}
	}
    if (customerId) {
        url += "&customerId=" + customerId;
    }else if (dojo.getObject("phone.callObject.data.customerId") && isCO==0) {
        url += "&customerId=" + phone.callObject.data.customerId;
    }
    if (customerType) {
        url += "&customerType=" + customerType;
    }
    var date = new Date();
    var identity = date.valueOf();
    if (!dataObjectName) {
        dataObjectName = userDic.getNameOrCode("WORKFLOW_TYPE", dataObjectId);
    }
    var param = null;
    if (phone) {
        param = {
            callObject: {
                connectType: phone.callObject.callType,
                originCallNo: phone.callObject.originCallNo,
                originCalledNo: phone.callObject.originCalledNo,
                province: phone.callObject.province,
                city: phone.callObject.city
            }
        };
    }
    if (typeof tm_sub == 'undefined')         return;
    var task_id = "add_business_" + dataObjectId + "_" + identity;
    if (dojo.getObject("phone.callObject.callId")) {
        task_id = "add_business_" + dataObjectId + "_" + phone.callObject.callId;
    }
    console.debug('工单Task_id 是 [%s]', task_id);
    tm_sub.popupTask(task_id, dataObjectName, "add_business", 'account.agent.workspace_rightpane', url, {
        callObject: param
    }, null, null, false);
};

icallcenter.workspace.popupCreateOrder = function(customerType){
    var url = "./action/order/preAddOrder.do?entryType=workspace";
    if (phone) {
		var o=phone.callObject;
		if (dojo.getObject("phone.callObject.data.callSheetId")) {
			url += "&orderVO.callSheetId=" + o.data.callSheetId;
		}
		if (dojo.getObject("phone.callObject.originCallNo")) {
			url += "&orderVO.callNo=" + o.originCallNo;
		}
		if (dojo.getObject("phone.callObject.originCalledNo")) {
			url += "&orderVO.calledNo=" + o.originCalledNo;
		}
		if (dojo.getObject("phone.callObject.data.customerId")) {
			url += "&orderVO.customerId=" + o.data.customerId;
		}
	}
    customerType = customerType || userDic.getName("BIZ_CUST_TYPE", userInfo.accountId + "_order_cod");
    if (customerType) {
        url += "&customerType=" + customerType;
    }
    
    var date = new Date();
    var identity = date.valueOf();
    var param = null;
    if (phone) {
        param = {
            callObject: {
                connectType: phone.callObject.callType,
                originCallNo: phone.callObject.originCallNo,
                originCalledNo: phone.callObject.originCalledNo,
                province: phone.callObject.province,
                city: phone.callObject.city
            }
        };
    }
    var task_id = 'add_order_' + identity;
    if (phone && phone.callObject && phone.callObject.callId) {
        task_id = 'add_order_' + phone.callObject.callId;
    }
    tm_sub.popupTask(task_id, '下订单', 'add_order', 'account.agent.workspace_rightpane', url, {
        callObject: param
    }, null, null, false);
};

icallcenter.workspace.popupIntegration = function(url){
    var co = phone.callObject;
    var taskId = "";
    if (co && co.callId) {
        taskId = co.callId;
    }
    tm_sub.popupTask(taskId, '来电弹屏', 'tm_integration_onRing', 'account.agent.workspace_rightpane', url, null, null, null, false);
};
//popup index page
icallcenter.workspace.popupIndex = function(){
    var ajaxRequest = new icallcenter.ajaxRequest({
        url: "./service/integrationService/queryIndexPage",
        content: {
            json: dojo.toJson([userInfo.accountId])
        },
        handleAs: "json",
        preventCache: true,
        timeout: 10000,
        load: function(response, ioArgs){
            if (response.resultCode = '0000') {
                var indexPage = response.result;
                console.debug('对接首页地址:');
				console.dir(indexPage);
                if (indexPage && indexPage.indexUrl) {
                    tm_sub.popupTask("workspace_integration_index", "首页", "workspace_integration_index", 'account.agent.workspace_rightpane', indexPage.indexUrl, null, null, null, true, true);
                    var integrationUrl = indexPage.liveUrl;
					if(integrationUrl){
						window.setInterval(function(){
							icallcenter.workspace.iamLiving(integrationUrl);
						}, 1200000);//20分钟
					}
                }
                else {
                    tm_sub.popupTask("workspace_integration_index", "首页", "workspace_integration_index", 'account.agent.workspace_rightpane', "./action/callsheet/getIndexInfo.do", null, null, null, true, true);
                    window.setInterval(function(){
                        tm_sub.redirectTask("workspace_integration_index","./action/callsheet/getIndexInfo.do", null);
                    }, 300000);//5分钟
                }
            }
        },
        error: function(response, ioArgs){
            console.debug("对接首页弹屏失败,[%s]", ioArgs.url);
        }
    });
    ajaxRequest.doGet();
};
icallcenter.workspace.playNotify = function(){
    try {
        document.soundNotify.play();
    } 
    catch (e) {
        console.debug(e);
    }
};

icallcenter.workspace.popupRemind = function(num) {
     if(num>0){
	 	console.debug("发送提醒[%s]",num);
		if (userInfo.accountId == 'Q000000004522') {//Q000000003896
			this.playNotify();
			dijit.byId('nodealTips').show();
			dijit.byId('nodealTips')._underlay.domNode.style.display = "none";
			dojo.byId('nodealTips').style.top = document.body.clientHeight - 130;
			dojo.byId('nodealTips').style.left = document.body.clientWidth - 200;
			icallcenter.workspace.autoMove();
		}
	}
};
icallcenter.workspace.autoMove = function(num) {
	dojo.byId('nodealTips').style.top=document.body.scrollTop+document.body.clientHeight-130;
	dojo.byId('nodealTips').style.left=document.body.scrollLeft+document.body.clientWidth-200;
	setTimeout("icallcenter.workspace.autoMove();",80)
};

icallcenter.workspace.iamLiving = function(url) {
    console.debug("发送心跳[%s]",url);
	if(!url) return;
    var ajaxRequest = new icallcenter.ajaxRequest({
        url: url,
        handleAs: "json",
        preventCache: true,
        timeout: 10000,
        load: function(response, ioArgs) {
            if (response.resultCode = '0000') {
 				console.debug("心跳发送成功");
            }
        },
        error: function(response, ioArgs) {
           console.debug("心跳发送失败");
        } 
    });     
    ajaxRequest.doGet();       
};
icallcenter.workspace.popupList = function(event) {
	event = (event)?event:window.event;
	if(!dojo.byId("bus_popup_list")) return;
	dojo.byId("bus_popup_list").style.left = (event.clientX) + 'px';
};
icallcenter.workspace.popupList2 = function() {
	if(!dojo.byId("bus_popup_list")) return;
	dojo.byId("bus_popup_list").style.display = "";
};
icallcenter.workspace.operateHtml = function(key,pk,otherValue) {
	var html="";
    var owns = dojo.map(userInfo.functions, function(func){
        return func.accountFunctionValue;
    });
	if(key=='customer_th'){
		html="<a href=\"javascript:icallcenter.custManage.viewForWorkspace('"+pk+"');\">查看>></a>&nbsp;";
	   /* if (dojo.indexOf(owns, "agent.dialout") != -1) {
	       html+="<a href=\"javascript:icallcenter.custManage.readyToCall('"+pk+"',null,null,'y');\">呼叫>></a>&nbsp;";
	    }*/
	    if (dojo.indexOf(owns, "agent.sendSms") != -1) {
	       html+="<a href=\"javascript:icallcenter.custManage.readyToSendSms('customer','"+pk+"');\"> 发短信>></a>&nbsp;";
	    }
	    if (dojo.indexOf(owns, "agent.sendFax") != -1) {
	       html+="<a href=\"javascript:icallcenter.custManage.readyToSendFax('customer','"+pk+"');\"> 发传真>></a>&nbsp;";
	    }
		html+="<a href=\"javascript:icallcenter.businessnew.selectCustomer('"+pk+"',null,null,null,'"+otherValue+"');\">选定>></a>&nbsp;";
		var tr = dojo.byId(key).insertRow();
		tr.align='right';
		var td=tr.insertCell();
		td.colSpan=3;
		td.innerHTML=html;
	}else if(key=='bus_th'){
		html="<a href=\"javascript:icallcenter.businessnew.preViewBusinessWorkSpace('"+pk+"');\">查看>></a>&nbsp;";
		if (otherValue!='9998') {
	       html+="<a href=\"javascript:icallcenter.businessnew.preDealBusinessWorkSpace('"+pk+"');\"> 修改>></a>&nbsp;";
	    }
		var tr = dojo.byId(key).insertRow();
		tr.align='right';
		var td=tr.insertCell();
		td.colSpan=4;
		td.innerHTML=html;
	}else if(key=='callSheet_th'){
		html="<a href=\"javascript:icallcenter.businessnew.preViewBusinessWorkSpace('"+pk+"');\">查看>></a>&nbsp;";
		var tr = dojo.byId(key).insertRow();
		tr.align='right';
		var td=tr.insertCell();
		td.colSpan=4;
		td.innerHTML=html;		
	}
};
icallcenter.workspace.dottedHtml = function(key,colspan){
	var tr = dojo.byId(key).insertRow();
	var td=tr.insertCell();
	td.colSpan = colspan;
	td.innerHTML = '<hr  size="1" style="border:1px #ccc dotted;" />';
}
icallcenter.workspace.bodyHtml = function(key,data) {
	var self=this;
	if(key=='customer_th'){
		var tbody=dojo.byId(key);
		var rowCount=tbody.rows.length;
		for(var k=1;k<rowCount;k++){
			tbody.deleteRow(1);	
		}
		if(data && data.length>0){
			var len=data.length;
			if(len>1){
				isMoreCust=1;
			}else{
				isMoreCust=0;//reset
			}
			for(var i=0;i<len;i++){
				var tr = tbody.insertRow();
				var td1=tr.insertCell();td1.innerHTML=data[i].customerName;
				var td2=tr.insertCell();td2.innerHTML=userDic.getNameOrCode("CUST_TYPE", data[i].customerType);
				var td3=tr.insertCell();td3.innerHTML=data[i].recentContact;
				self.operateHtml(key,data[i].customerId,data[i].customerName);
				if (i < len - 1) {
					self.dottedHtml(key,3);
				}
			}
		}else{
			var tr = tbody.insertRow();
			var td=tr.insertCell();
			td.colSpan=3;td.align="center";
			td.innerHTML="没有匹配的客户";
		}
	}else if(key=='bus_th'){
		var tbody=dojo.byId(key);
		var rowCount=tbody.rows.length;
		for(var k=1;k<rowCount;k++){
			tbody.deleteRow(1);	
		}
		if(data && data.length>0){
			var len=data.length;
			for(var i=0;i<len;i++){
				var tr = tbody.insertRow();
				var td1=tr.insertCell();td1.innerHTML=data[i].callNo;
				var td2=tr.insertCell();td2.innerHTML=userDic.getNameOrCode("CUST_TYPE", data[i].recentUpdateTime);
				var td3=tr.insertCell();td3.innerHTML=userDic.getNameOrCode("USER", data[i].recentUpdater);
				var td4=tr.insertCell();td4.innerHTML=userDic.getNameOrCode("WORKFLOW_STEP_STATUS", data[i].statusDesc);
				
				var tr2 = tbody.insertRow();
				var td5=tr2.insertCell();td5.innerHTML="业务描述：";td5.colSpan=4;
				
				if (data[i].remark) {
					var tr3 = tbody.insertRow();
					var td6 = tr3.insertCell();
					td6.innerHTML = data[i].remark;
					td6.colSpan = 4;
					td6.style.color = "#ccc";
				}
				self.operateHtml(key,data[i].workSheetId,data[i].nowStep);
				if (i < len - 1) {
					self.dottedHtml(key,4);
				}
			}
		}else{
			var tr = tbody.insertRow();
			var td=tr.insertCell();
			td.colSpan=4;td.align="center";
			td.innerHTML="没有匹配的业务";
		}
	}else if(key=='callSheet_th'){
		var tbody=dojo.byId(key);
		var rowCount=tbody.rows.length;
		for(var k=1;k<rowCount;k++){
			tbody.deleteRow(1);	
		}
		if(data && data.length>0){
			var len=data.length;
			for(var i=0;i<len;i++){
				var tr = tbody.insertRow();
				if(data[i].connectType=='dialout' || data[i].connectType=='dialTransfer'){
					var td1=tr.insertCell();td1.innerHTML=data[i].calledNo;
				}else{
					var td1=tr.insertCell();td1.innerHTML=data[i].callNo;
				}
				var td2=tr.insertCell();td2.innerHTML=data[i].offeringTime;
				var td3=tr.insertCell();td3.innerHTML=userDic.getNameOrCode("CONNECT_TYPE", data[i].connectType);
				var td4=tr.insertCell();td4.innerHTML=userDic.getNameOrCode("USER", data[i].disposalAgent);
				
				var tr2 = tbody.insertRow();
				var td5=tr2.insertCell();td5.innerHTML="沟通内容：";td5.colSpan=4;
				
				if (data[i].comments) {
					var tr3 = tbody.insertRow();
					var td6 = tr3.insertCell();
					td6.innerHTML = data[i].comments;
					td6.colSpan = 4;
					td6.style.color = "#ccc";
				}
				//self.operateHtml(key,data[i].callSheetId);
				if (i < len - 1) {
					self.dottedHtml(key,4);
				}
			}
		}else{
			var tr = tbody.insertRow();
			var td=tr.insertCell();
			td.colSpan=4;td.align="center";
			td.innerHTML="没有匹配的通话";
		}
	}};
icallcenter.workspace.showCustWS = function(url,nodeId){
	var list=dojo.query('div[url*="callsheet/workspace.do"]',dojo.byId('icc.workspace_main.tab').nextSibling);
	if(list && list.length<=0) return;
	if (!dojo.byId('searchEngine_callsheet')) {//init callsheet tab
		var newNode=document.createElement('div');
		newNode.id='searchEngine_callsheet';
		newNode.innerHTML=list[0].innerHTML;
		list[0].innerHTML='';
		list[0].appendChild(newNode);
	}
	if(dojo.byId(nodeId)){
		dojo.query('div[id^="searchEngine_"]',list[0]).forEach(function(item){
			item.style.display='none';
		});
		dojo.byId(nodeId).style.display='';
		return;
	}
	//first click
	var request = {
        url: url,
        load: function(response, ioArgs) {
				dojo.query('div[id^="searchEngine_"]',list[0]).forEach(function(item){
					item.style.display='none';
				});			
				var newNode=document.createElement("div");
				newNode.id=nodeId;
				newNode.innerHTML=response;
				list[0].appendChild(newNode);
				
		        var scripts = dojo.query("> div[type^='dojo/']", newNode).orphan();  
	            dojo.parser.parse(newNode);
	            var o = {};
	            scripts.forEach(function(script){
	                icallcenter.common.wireUpMethod(o, script);
	            });				
        },
        error: function(response, ioArgs) {
        }
	};
    var ajaxRequest = new icallcenter.ajaxRequest(request); 
    ajaxRequest.doGet();
};
icallcenter.workspace.showCustBus = function(customerId){
	var self=this;
	var request={
        url: "./service/workSheetService.new/getWsListByCustID",
        params: [customerId,userInfo.accountId,1,5],
        onLoad: function(buslist, message) {
        	  self.bodyHtml('bus_th',buslist.result);
        }
    };
   icallcenter.common.request(request);
};
icallcenter.workspace.showCustCallSheet = function(customerId){
	var self=this;
	var request={
        url: "./service/callSheetService/queryByCustomerId",
        params: [customerId,1,5],
        onLoad: function(cslist, message) {
        	  self.bodyHtml('callSheet_th',cslist.result);
        }
    };
   icallcenter.common.request(request);
};
icallcenter.workspace.popupCallSheetWS = function(connectType,offeringTime,status,disposalAgent,key,desc){
    var url = "./action/callsheet/workspaceMain.do?connectType="+connectType+"&offeringTime="+offeringTime+"&status="+status+"&agent="+disposalAgent;
    var task_id = 'query_callSheet_wsinfo_'+key;

    tm_sub.popupTask(task_id, desc, 'query_callsheet', 'account.agent.workspace_rightpane', url, null, null, null, false);
};
icallcenter.workspace.popupWorkSheetWS = function(){
    var url = "./action/callsheet/workspaceMain.do";
    var task_id = 'query_workSheet_noDealinfo';

    tm_sub.popupTask(task_id, '未处理工单', 'query_nodealWorksheet', 'account.agent.workspace_rightpane', url, null, null, null, false);
};
icallcenter.workspace.popupNotice = function(noticeId){
    var url = "./action/notice/view2Ws.do?noticeId="+noticeId;
    var task_id = noticeId;

    tm_sub.popupTask(task_id, '公告', 'view_notice', 'account.agent.workspace_rightpane', url, null, null, null, false);
};
