dojo.provide("icallcenter.Monitor");


icallcenter.Monitor.monitorTimersHandle=null;
icallcenter.Monitor.listenNode = null;
icallcenter.Monitor.endListenHandler = null;

dojo.declare("icallcenter.Monitor", null, {

  constructor: function(phone) {
      this._phone = phone;
      this._statusDesc["stReady"] = "签出";    
      this._statusDesc["stIdle"] = "空闲";
      this._statusDesc["stBusy"] = "忙碌";
      this._statusDesc["stRinging"] = "来电";
      this._statusDesc["stInner"] = "内部通话";
      this._statusDesc["stNormal"] = "普通通话";
      this._statusDesc["stRing"] = "呼叫中";            
      this._statusDesc["stDialout"] = "外呼通话";            
      this._statusDesc["stDialTransfer"] = "外呼转接通话";            
      this._statusDesc["stListen"] = "监听";            
      this._statusDesc["stTransfer"] = "转接通话"; 
      this._statusDesc["stOffline"] = "离线"; 
      this._statusDesc["stUnavaliable"] = "失效"; 
      this._statusDesc["stWebcall"] = "网络来电"; 
      this._statusDesc["stValidate"] = "验证通话"; 

      
	 		 this._init(this._phone);	
      // 注册队列状态变化事件
      var evtHandle = this._phone.register("EvtMonitorQueue", this, "onQueueChanged");  
      this._handles.push(evtHandle);                         
      evtHandle = this._phone.register("EvtMonitorPeer", this, "onAgentChanged");
      this._handles.push(evtHandle);                         
      evtHandle = this._phone.register("EvtMonitorServiceNo", this, "onServiceNoChanged");                           
      this._handles.push(evtHandle);                         
      
    },

    destroy: function() {
      for (var i in this._handles) {    
            this._phone.unregister(this._handles[i]);
      }
    },

  
    _phone: null,
    
   _handles: [],
	
	 _statusDesc: [],

	 _init:function(phone){
		
		//初始化ui
		var tblQueues = dojo.byId("icc.monitor.queues");
		var tblAgets = dojo.byId("icc.monitor.agents");
		var tblServiceNos = dojo.byId("icc.monitor.serviceNos");
		
		if(phone && phone.monitorServiceNos){
			for(var j in phone.monitorServiceNos)	{
				var item=phone.monitorServiceNos[j];
				var tempArray=[item.serviceNo,item.inCalls,item.inLost,item.inComplete];

				var curRow=this.searchQueue(item.serviceNo,tblServiceNos,'serviceNo');
				if(!curRow){
					this.createRowCell(tblServiceNos,item.serviceNo,tempArray,'serviceNo');
				}else{
					this.updateRowCell(curRow,item.serviceNo,tempArray,'serviceNo',true);
				}				
				
			}
		}
		if(phone && phone.monitorQueues){
			for(var j in phone.monitorQueues)	{
				var item=phone.monitorQueues[j];
				var tempArray=[item.queueName,item.idleAgentCount,item.totalAgentCount,item.queueWaitCount,(item.totalCalls-item.abadonedCalls)];

				var curRow=this.searchQueue(item.queueId,tblQueues,'queueId');
				if(!curRow){
					this.createRowCell(tblQueues,item.queueId,tempArray,'queueId');
				}else{
					this.updateRowCell(curRow,item.queueId,tempArray,'queueId',true);
				}				
				
			}
		}
		if(phone && phone.monitorPeers){
			
			var otherPeer=[];
			if(userInfo.allAgentsDisplay){
				for(var m in userInfo.allAgentsDisplay){
						otherPeer[m]=userInfo.allAgentsDisplay[m];
				}
			}			
			for(var i in phone.monitorPeers)	{
				var item=phone.monitorPeers[i];
				console.dir(phone.monitorPeers[i]);
				if(item.userId){
					if(otherPeer){
						for(var m in otherPeer){
								if(otherPeer[m].userId==item.userId){
									delete otherPeer[m];
								}
						}
					}
					var tempArray=[item.exten,item.exten,item.InComplete,item.OutComplete,item.callNo,item.extenType,item.callStatus,item.timestamp,item.status,0,item.channel,item.linkedChannel];
					var curRow=this.searchQueue(item.userId,tblAgets,'userId');
					if(item.user!='admin'){
						if(!curRow){
							this.createRowCell(tblAgets,item.userId,tempArray,'userId');
						}else{
							this.updateRowCell(curRow,item.userId,tempArray,'userId',true);
						}						
					}	
				}
			}
			
			//console.dir(userInfo.allAgentsDisplay);
			//针对同一sip号对应多个坐席的监控处理
			if(otherPeer){
				for(var k in otherPeer){
					//console.dir(otherPeer[k]);
					var tempArray=[otherPeer[k].extension,otherPeer[k].extension,'','','','','签出','','',0,'',''];
					var curRow=this.searchQueue(otherPeer[k].userId,tblAgets,'userId');
					if(curRow){
						this.updateOtherRowCell(curRow,otherPeer[k].userId,tempArray,'userId',true);
					}				
						
				}
			}
			
		}
		icallcenter.Monitor.setInterval();
	},


    onServiceNoChanged: function(/*Object*/monitorServiceNo) {//更新服务号
			var self=this;
		  if(!monitorServiceNo)	 return;
	
			var tblServiceNos = dojo.byId("icc.monitor.serviceNos");
			var tempArray=[monitorServiceNo.serviceNo,monitorServiceNo.inCalls,monitorServiceNo.inLost,monitorServiceNo.inComplete];
			var curRow=self.searchQueue(monitorServiceNo.serviceNo,tblServiceNos,'serviceNo');
			if(!curRow){
				self.createRowCell(tblServiceNos,monitorServiceNo.serviceNo,tempArray,'serviceNo');
			}else{
				self.updateRowCell(curRow,monitorServiceNo.serviceNo,tempArray,'serviceNo');
			}
    },    
    
    onQueueChanged: function(/*Object*/monitorQueue) {//更新队列
			var self=this;
			//console.dir(monitorQueue);
			//alert(monitorQueues.length +"\n"+dojo.isArray(monitorQueues));
		    if(!monitorQueue)	 return;
	
			var tblAgents = dojo.byId("icc.monitor.queues");
			var tempArray=[monitorQueue.queueName,monitorQueue.idleAgentCount,monitorQueue.totalAgentCount,monitorQueue.queueWaitCount,(monitorQueue.totalCalls-monitorQueue.abadonedCalls)];
			var curRow=self.searchQueue(monitorQueue.queueId,tblAgents,'queueId');
			if(!curRow){
				self.createRowCell(tblAgents,monitorQueue.queueId,tempArray,'queueId');
			}else{
				self.updateRowCell(curRow,monitorQueue.queueId,tempArray,'queueId');
			}
    },

    onAgentChanged: function(/*Object*/monitorAgent) {//更新坐席
    	if(!monitorAgent.userId){
    		return ;	
    	}
			var self=this;
			if(!monitorAgent)	 return;
			var tblAgents = dojo.byId("icc.monitor.agents");
			var tempArray=[monitorAgent.exten,monitorAgent.exten,item.InComplete,item.OutComplete,monitorAgent.callNo,monitorAgent.extenType,monitorAgent.callStatus,monitorAgent.timestamp,item.status,0,monitorAgent.channel,monitorAgent.linkedChannel];
			var curRow=self.searchQueue(monitorAgent.userId,tblAgents,'userId');
			if (monitorAgent.user != 'admin') {
				if (!curRow) {
					self.createRowCell(tblAgents, monitorAgent.userId, tempArray, 'userId');
				}
				else {
					self.updateRowCell(curRow, monitorAgent.userId, tempArray, 'userId');
				}
			}
    },

	createRowCell:function(tab, qid, arrCellText,key){
		//动态构建表格
		var trNew = tab.insertRow();
		trNew.setAttribute(key,qid);
		trNew.className='even';
		if(key=='userId'){
			for(var i=0; i<10; i++)
			{
				var tdNew = trNew.insertCell();
				if(i==9){
					var textNode='<a href="#">&nbsp;监听&nbsp;</a><a style="display:none" href="#">&nbsp;结束监听&nbsp;</a><a href="#">&nbsp;强拆&nbsp;</a><a href="#">&nbsp;抢接&nbsp;</a><a href="#">&nbsp;签出&nbsp;</a><a href="#">&nbsp;签入&nbsp;</a>';	
					tdNew.innerHTML=textNode;
					tdNew.setAttribute("extension", arrCellText[0]);
					tdNew.setAttribute("status", arrCellText[4]);
					tdNew.setAttribute("curChannel", arrCellText[7]);
					tdNew.setAttribute("linkedChannel", arrCellText[8]);

					dojo.connect(tdNew.firstChild, "onclick", this.listen); 
					dojo.connect(tdNew.childNodes(1), "onclick", this.endListen); 
					dojo.connect(tdNew.childNodes(2), "onclick", this.forceHangup); 
					dojo.connect(tdNew.childNodes(3), "onclick", this.loot); 
					dojo.connect(tdNew.childNodes(4), "onclick", this.forceKickout); 

				}else if(i==7){
					if(arrCellText[i]){
						var date = new Date();
						var identity = date.valueOf();
						var oldTime=((identity-phone.currentServerTime)-parseFloat(arrCellText[i])*1000)/1000;//设定初始值
						
						if(oldTime<0){
							oldTime=0;
						}
						var countTimer={
							count:oldTime,
							tdNode:tdNew
						}
						monitorTimers[qid]=countTimer;
					}else{
						tdNew.appendChild(document.createTextNode(""));
					}
				}else if(i==6){
					var statusName=this.displayStatus(qid);
					 var txtNew = document.createTextNode(statusName);
					 if(statusName==this._statusDesc["stBusy"]){
					 		tdNew.style.color='red';
					 }else if(statusName==this._statusDesc["stIdle"]){
					 		tdNew.style.color='green';
					 }else if(statusName==this._statusDesc["stWebcall"] || statusName==this._statusDesc["stInner"] || statusName==this._statusDesc["stRing"] || statusName==this._statusDesc["stRinging"] || statusName== this._statusDesc["stListen"] || statusName==	this._statusDesc["stNormal"] || statusName==this._statusDesc["stDialout"] || statusName==this._statusDesc["stDialTransfer"] || statusName== this._statusDesc["stTransfer"]){
					 		tdNew.style.color='#FF33FF';
					 }else{
					 		tdNew.style.color='';
					 	}
					 tdNew.appendChild(txtNew);
				}else if(i==5)	{
						var extenType=this.displayExtenType(qid);
						var txtNew = document.createTextNode(extenType);
					  tdNew.appendChild(txtNew);
				
				}else{
					 var txtNew = document.createTextNode(arrCellText[i]);
					 tdNew.appendChild(txtNew);
				}
			}
		}else if(key=='queueId'){
			for(var i=0; i<arrCellText.length; i++){
				var tdNew = trNew.insertCell();
				var txtNew = document.createTextNode(arrCellText[i]);
				tdNew.appendChild(txtNew);
				if(i==3&&arrCellText[i]!='0'){
						tdNew.style.color='red';
				}else{
						tdNew.style.color='';
				}
				
			}
		}else if(key=='serviceNo'){
			for(var i=0; i<arrCellText.length; i++){
				var tdNew = trNew.insertCell();
				var txtNew = document.createTextNode(arrCellText[i]);
				tdNew.appendChild(txtNew);
			}
		}
	},
		updateOtherRowCell:function(row,qid,arrCellText,key,isFirst){
		if(key=='userId'){
			for(var i=1; i<row.cells.length; i++)
			{
				if(i==6){
					row.cells[i].setAttribute("extension", arrCellText[0]);
					row.cells[i].setAttribute("status", arrCellText[4]);
					row.cells[i].setAttribute("curChannel", arrCellText[7]);
					row.cells[i].setAttribute("linkedChannel", arrCellText[8]);
					
					if(isFirst){
						dojo.connect(row.cells[i].firstChild, "onclick", this.listen); 
						dojo.connect(row.cells[i].childNodes(1), "onclick", this.endListen); 
						dojo.connect(row.cells[i].childNodes(2), "onclick", this.forceHangup); 
						dojo.connect(row.cells[i].childNodes(3), "onclick", this.loot); 
						dojo.connect(row.cells[i].childNodes(4), "onclick", this.forceKickout); 
						dojo.connect(row.cells[i].childNodes(5), "onclick", this.checkin); 
					}
				}			
				else{
					row.cells[i].innerText =arrCellText[i];
				}
			}
		}
	},
	updateRowCell:function(row,qid,arrCellText,key,isFirst){
		//动态更新表格
		if(key=='userId'){
			for(var i=1; i<row.cells.length; i++)
			{
				if(i==7){
					if(arrCellText[i]){
						var date = new Date();
						var identity = date.valueOf();
						var oldTime=((identity-phone.currentServerTime)-parseFloat(arrCellText[i])*1000)/1000;//设定初始值
						//alert(phone.currentServerTime+"\n"+identity+"\n"+arrCellText[i]+"\n"+parseFloat(arrCellText[i])*1000+"\n"+oldTime);

						if(oldTime<0){							oldTime=0;						}
						var countTimer={
							count:oldTime,
							tdNode:row.cells[i]
						}
						monitorTimers[qid]=countTimer;
					}else{
						delete monitorTimers[qid];//清除该分机timer
						row.cells[i].innerText="";
					}
				}else if(i==6){
					var statusName=this.displayStatus(qid);
					row.cells[i].innerText =statusName;
						if(statusName==this._statusDesc["stBusy"]){
					 		row.cells[i].style.color='red';
					 }else if(statusName==this._statusDesc["stIdle"]){
					 		row.cells[i].style.color='green';
					 } else if (statusName == this._statusDesc["stWebcall"]
											|| statusName == this._statusDesc["stInner"]
											|| statusName == this._statusDesc["stRing"]
											|| statusName == this._statusDesc["stRinging"]
											|| statusName == this._statusDesc["stListen"]
											|| statusName == this._statusDesc["stNormal"]
											|| statusName == this._statusDesc["stDialout"]
											|| statusName == this._statusDesc["stDialTransfer"]
											|| statusName == this._statusDesc["stTransfer"]) {
					 		row.cells[i].style.color='#FF33FF';
					 }else{
					 		row.cells[i].style.color='';
					 	}

				}else if(i==5){
						var extenType=this.displayExtenType(qid);
						row.cells[i].innerText =extenType;
				}else if(i==9){
					row.cells[i].setAttribute("extension", arrCellText[0]);
					row.cells[i].setAttribute("status", arrCellText[4]);
					row.cells[i].setAttribute("curChannel", arrCellText[7]);
					row.cells[i].setAttribute("linkedChannel", arrCellText[8]);
					
					if(isFirst){
						dojo.connect(row.cells[i].firstChild, "onclick", this.listen); 
						dojo.connect(row.cells[i].childNodes(1), "onclick", this.endListen); 
						dojo.connect(row.cells[i].childNodes(2), "onclick", this.forceHangup); 
						dojo.connect(row.cells[i].childNodes(3), "onclick", this.loot); 
						dojo.connect(row.cells[i].childNodes(4), "onclick", this.forceKickout); 
						dojo.connect(row.cells[i].childNodes(5), "onclick", this.checkin); 
					}
				}			
				else{
					row.cells[i].innerText =arrCellText[i];
				}
			}
		}else if(key=='queueId'){
			for(var i=1; i<row.cells.length; i++)
			{
				row.cells[i].innerText =arrCellText[i];
				if(i==3&&arrCellText[i]!='0'){
						row.cells[i].style.color='red';
				}else{
					row.cells[i].style.color='';
				}				
			}
		}else if(key=='serviceNo'){
			for(var i=1; i<row.cells.length; i++)
			{
				row.cells[i].innerText =arrCellText[i];
			}
		}
	},
	searchQueue:function(qid,table,key){
		//查询节点是否已经存在
		for(var i=0; i<table.rows.length; i++)
		{
			var row =table.rows[i];
			var trID=row.getAttribute(key);
			if(qid==trID){
				return table.rows[i];
			}
		}
		return null;
	},
	loot:function(event){
		//抢接(通道为LinkedChannel)
		 var o = event.target;
	   var curChannel = o.parentNode.getAttribute("linkedChannel");
	   var status = o.parentNode.getAttribute("status");
   	 var userId = o.parentNode.getAttribute("userId");

	   if (dojo.getObject("phone.extenType")=='none') {
		   alert("执行该操作必须以电话方式登录");
		   return;    
	   }
		 if (userId == userInfo.userId) {
		   alert("不允许对自身进行该操作");
		   return;
	   }
	   if(icallcenter.Monitor.isPeerSelf()){
		   alert("该状态不允许抢接");
		   return;
	   }
	   if (status =="listen" || status=="Idle" || status=="Ring" ) {
				alert("该状态不允许抢接");
				return;
			}
	   
	   if (phone.state != "stBusy") {
		   alert("请先将软电话置忙");
		   return;
	   }
		 phone.lootCall(curChannel);
	},
	forceHangup:function(event){
		//强拆
	  /* if (dojo.getObject("phone.extenType")=='none') {
		   alert("执行该操作必须以电话方式登录");
		   return;    
	   }*/
	
	   var o = event.target;
	   var curChannel = o.parentNode.getAttribute("curChannel");
	   var status = o.parentNode.getAttribute("status");
       if (status != "listen" && status != "Idle") {
           phone.hangupChannel(curChannel);
       }
       else {
           alert("该状态不允许强拆");
       }
	},
	listen:function(event) {
		 var self=this;
	   if (dojo.getObject("phone.extenType")=='none') {
		   alert("执行该操作必须以电话方式登录");
		   return;    
	   }
	   var o = event.target;
	   var phoneNum = o.parentNode.getAttribute("extension");
	   var status = o.parentNode.getAttribute("status");
	   var userId = o.parentNode.getAttribute("userId");
	   var channel = o.parentNode.getAttribute("curChannel");
	   if (userId == userInfo.userId) {
		   alert("不允许对自身进行该操作");
		   return;
	   }
	  	if(icallcenter.Monitor.isPeerSelf()){
		   alert("该状态不允许监听");
		   return;
	   }
	   
	   if (status != "webcall" && status != "inner" && status!="normal" && status!="dialout" && status!="dialTransfer" && status!="transfer") {
		 		alert("该状态不允许监听");
		 		return;
		 }
	   if (phone.state != "stBusy") {
		   alert("请先将软电话置忙");
		   return;
	   }
	   
	   console.debug("监听号码[%s]通道号[%s]", phoneNum,channel);
	   o.style.display = "none";
	   o.nextSibling.style.display = "";
	   icallcenter.Monitor.listenNode = o;
	   icallcenter.Monitor.endListenHandler = phone.register("EvtEndListen", null, function() {icallcenter.Monitor.onEndListen();});                           
	   phone.listen(channel); 
	},

	endListen:function(event) {
	   phone.hangup();
	},

	forceKickout:function(event) {
	   var o = event.target;
	   var sipNo = o.parentNode.getAttribute("extension");
	   var userId = o.parentNode.getAttribute("userId");
	   var username = o.parentNode.getAttribute("username");

	   
	   if (userId == userInfo.userId) {
		   alert("不允许对自身进行该操作");
		   return;
	   }
		if(phone && phone.monitorPeers){
			var peer=phone.monitorPeers[userId];
			if(!peer.login && peer.extenType!='Local'  && peer.extenType!='gateway'){//离线的可以签出
			 alert("不允许对签出坐席进行该操作");
		   return;
			}
		} 
		phone.kick(userId);
	},
	
	checkin:function(event) {
		   var o = event.target;
		   var sipNo = o.parentNode.getAttribute("extension");
		   var userId = o.parentNode.getAttribute("userId");
		   var username = o.parentNode.getAttribute("username");

		   
		   if (userId == userInfo.userId) {
			   alert("不允许对自身进行该操作");
			   return;
		   }
			if(phone && phone.monitorPeers){
				var peer=phone.monitorPeers[userId];
				if(peer.login || peer.extenType!='Local'){
					alert("不允许对签入坐席进行该操作");
					return;
				}
				if(!peer.login && peer.extenType!='Local'){
					return;
				}
			} 
			phone.pick(userId);
		},

	displayStatus:function(/*String*/userId){
		var displayName='';
		if(phone && phone.monitorPeers){
			var peer=	phone.monitorPeers[userId];
			if(peer.login && peer.extenType!='none'){
					if((peer.extenType=='sip' || peer.extenType=='gateway') && peer.register==false){
						displayName=this._statusDesc["stUnavaliable"];
					}else if(peer.callStatus=='Idle'){
						if(peer.busy)	{
							displayName=this._statusDesc["stBusy"];	
						}else{
							displayName=this._statusDesc["stIdle"];	
						}
					}else if(peer.callStatus=='Ring'){
						displayName=this._statusDesc["stRing"];
					}else if(peer.callStatus=='Ringing'){
						displayName=this._statusDesc["stRinging"];
					}else if(peer.callStatus=='inner'){
						displayName=this._statusDesc["stInner"];
					}else if(peer.callStatus=='normal'){
						displayName=this._statusDesc["stNormal"];
					}else if(peer.callStatus=='dialout'){
						displayName=this._statusDesc["stDialout"];
					}else if(peer.callStatus=='dialTransfer'){
						displayName=this._statusDesc["stDialTransfer"];
					}else if(peer.callStatus=='transfer'){
						displayName=this._statusDesc["stTransfer"];
					}else if(peer.callStatus=='listen'){
						displayName=this._statusDesc["stListen"];
					}else if(peer.callStatus=='webcall'){
						displayName=this._statusDesc["stWebcall"];
					}else if(peer.callStatus=='validate'){
						displayName=this._statusDesc["stValidate"];
					}else {
						diplayName=peer.callStatus+'ass';
					}
			}else if(peer.login && peer.extenType=='none'){
				displayName='';
			}else{
					if(peer.callStatus=='Ring'){
						displayName=this._statusDesc["stRing"];
					}else if(peer.callStatus=='Ringing'){
						displayName=this._statusDesc["stRinging"];
					}else if(peer.callStatus=='inner'){
						displayName=this._statusDesc["stInner"];
					}else if(peer.callStatus=='normal'){
						displayName=this._statusDesc["stNormal"];
					}else if(peer.callStatus=='dialout'){
						displayName=this._statusDesc["stDialout"];
					}else if(peer.callStatus=='dialTransfer'){
						displayName=this._statusDesc["stDialTransfer"];
					}else if(peer.callStatus=='transfer'){
						displayName=this._statusDesc["stTransfer"];
					}else if(peer.callStatus=='listen'){
						displayName=this._statusDesc["stListen"];
					}else if(peer.callStatus=='webcall'){
						displayName=this._statusDesc["stWebcall"];
					}else if(peer.callStatus=='validate'){
						displayName=this._statusDesc["stValidate"];
					}
					else{
						if(!peer.login && (peer.extenType=='gateway' || peer.extenType=='Local')){
							displayName=this._statusDesc["stOffline"];
						}else{
							displayName=this._statusDesc["stReady"];
						}
					}
			}
		}
		return displayName;
	},
	displayExtenType:function(userId){
		var displayExtenType='';
		if(phone && phone.monitorPeers){
			var peer=	phone.monitorPeers[userId];
			if(peer.extenType=='sip'){
				displayExtenType='软电话';
			}else if(peer.extenType=='gateway'){
				displayExtenType='SIP话机/网关';
			}else if(peer.extenType=='Local'){
				//displayExtenType='直线电话/手机';
				displayExtenType=peer.loginExten;
			}else if(peer.extenType=='none'){
				displayExtenType='无电话接入';
			}
			
		}
		return displayExtenType;
	}

});
icallcenter.Monitor.isPeerSelf=function() {
		//判断坐席本身是否在通话中
		var me=userInfo.userId;
		if(me && phone && phone.monitorPeers){
				var peer=	phone.monitorPeers[me];
				if(peer.callStatus=='Ring' ||peer.callStatus=='Ringing' || peer.callStatus=='inner'||peer.callStatus=='normal'||peer.callStatus=='dialout'||peer.callStatus=='dialTransfer'||peer.callStatus=='transfer'||peer.callStatus=='listen'){
					return true;
				}
		}

		return false;
	};
icallcenter.Monitor.onEndListen=function() {
	   var o = icallcenter.Monitor.listenNode;
	   o.nextSibling.style.display = "none";
	   o.style.display = "";
	   phone.unregister(icallcenter.Monitor.endListenHandler);
	};
icallcenter.Monitor.getTimer=function(/*number秒数*/countTimer){
	  var minute="0";
	  var second="0";
	  var hour="0";
	  countTimer = parseInt(countTimer)+1;
	  hour=parseInt(countTimer/3600);
	  minute = parseInt((countTimer%3600)/60);
	  second = (countTimer%3600)%60;

	  var mtime = (hour<10)? "0" + hour : hour;
	  mtime += ":";
	  mtime += (minute<10)? "0" + minute : minute;
	  mtime += ":";
	  mtime += (second<10)? "0" + second : second;

	  return mtime;
};
icallcenter.Monitor.doCallTimer=function(){
	
	if(monitorTimers){
		for(var i in monitorTimers)
		{
			monitorTimers[i].tdNode.innerText=icallcenter.Monitor.getTimer(monitorTimers[i].count);
			monitorTimers[i].count++;
		}
	}
};
icallcenter.Monitor.setInterval=function(){
     if (icallcenter.Monitor.monitorTimersHandle) {
         window.clearInterval(icallcenter.Monitor.monitorTimersHandle);
     }
     icallcenter.Monitor.monitorTimersHandle = window.setInterval("icallcenter.Monitor.doCallTimer()",1000);
};
