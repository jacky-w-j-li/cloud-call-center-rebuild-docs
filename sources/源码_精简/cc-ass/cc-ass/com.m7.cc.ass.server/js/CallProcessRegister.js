dojo.provide("icallcenter.CallProcessRegister");
dojo.require("icallcenter.Phone");

icallcenter.CallProcessRegister.tm_fantong = new icallcenter.TaskManager();

icallcenter.CallProcessRegister.register = function(phone,handles,callProcessor){
			//标准事件注册
      evtHandle = phone.register("EvtRing", callProcessor, "onRing");                           
      handles.push(evtHandle);
      evtHandle = phone.register("EvtConnected", callProcessor, "onConnected");                           
      handles.push(evtHandle);
      evtHandle = phone.register("EvtHangup", callProcessor, "onHangup");                           
      handles.push(evtHandle);
      evtHandle = phone.register("EvtDialing", callProcessor, "onDialing");                           
      handles.push(evtHandle);
      
      //中煤基业注册
      if (userInfo.accountId == 'Q000000003743'){
      	evtHandle = phone.register("EvtRing", this, "onRingForZhongMei");                           
      	handles.push(evtHandle);
      }
      //饭统网事件注册
      else if (userInfo.accountId == 'P000000000930' || userInfo.accountId == 'P000000001297' || userInfo.accountId == 'P000000001487'){
      	evtHandle = phone.register("EvtRing", this, "onRingForFanTong");                           
      	handles.push(evtHandle);
      }

      else if (userInfo.accountId == 'P000000001427'){
      	evtHandle = phone.register("EvtRing", this, "onRingForYiCheng");                           
      	handles.push(evtHandle);      	
      }
      
      else if (userInfo.accountId == 'Q000000003844'){
      	evtHandle = phone.register("EvtRing", this, "onRingForTouQu");                           
      	handles.push(evtHandle);      	
      }

      else if (userInfo.accountId == 'P000000000396' && userInfo.userId == '66bd1ae5-5de8-4ba5-a927-4e7fd9a23760'){
      	evtHandle = phone.register("EvtRing", this, "onRingForThreeSixFive");                           
      	handles.push(evtHandle);      	
      }

      else if (userInfo.accountId == 'P000000001919' && userInfo.userId == '74ba196b-15af-4c81-ad01-215eba172737'){
      	evtHandle = phone.register("EvtRing", this, "onRingForFortest");                           
      	handles.push(evtHandle);      	
      }
      
      else if (userInfo.accountId == 'P000000002212' && (userInfo.userId == 'de281a5c-ef7d-4ec0-8bf6-c4547bec2fb7' || userInfo.userId == '3f14409d-f73b-42eb-b137-2201df980ea2')){
      	evtHandle = phone.register("EvtRing", this, "onRingForBaiNaoHui");                           
      	handles.push(evtHandle);      	
      }

      else if (userInfo.accountId == 'P000000002542' || userInfo.accountId == 'P000000003484'){//博维时代两账户
      	evtHandle = phone.register("EvtRing", this, "onRingForBoWeiShiDai");                           
      	handles.push(evtHandle);      	
      }
      else if (userInfo.accountId == 'P000000001724'){
      	evtHandle = phone.register("EvtRing", this, "onRingForHuaTu");                           
      	handles.push(evtHandle);      	
      }      
      else if (userInfo.accountId == 'Q000000003755'){//P000000003136
      	evtHandle = phone.register("EvtRing", this, "onRingForHaoLeMei");                           
      	handles.push(evtHandle);      	
      }      
      else if (userInfo.accountId == 'P000000003044'){
     	evtHandle = phone.register("EvtRing", this, "onRingForBj27");                           
      	handles.push(evtHandle);      	
      }      
      else if (userInfo.accountId == 'P000000002914'){
     	evtHandle = phone.register("EvtRing", this, "onRingForBj19");                           
      	handles.push(evtHandle);      	
      }      
      else if (userInfo.accountId == 'P000000003147'){
     	evtHandle = phone.register("EvtRing", this, "onRingForBj52");                           
      	handles.push(evtHandle);      	
      }      
      else if (userInfo.accountId == 'P000000002661'){
     	evtHandle = phone.register("EvtRing", this, "onRingForBj28");                           
      	handles.push(evtHandle);      	
      }      
      else if (userInfo.accountId == 'P000000003202'){
     	evtHandle = phone.register("EvtRing", this, "onRingForBj59");                           
      	handles.push(evtHandle);      	
      }      
      else if (userInfo.accountId == 'P000000002334'){
     	evtHandle = phone.register("EvtRing", this, "onRingForYouLi");                           
      	handles.push(evtHandle);      	
      }      
	  else if (userInfo.accountId == 'P000000003169'){//P000000002889
      	evtHandle = phone.register("EvtRing", this, "onRingForWriteCallsheet");                           
      	handles.push(evtHandle);      	
      }
	  else if (userInfo.accountId == 'Q000000003860'){
      	evtHandle = phone.register("EvtRing", this, "onRingForHlyc");                           
      	handles.push(evtHandle);      	
      }
	  else if (userInfo.accountId == 'Q000000003758'){
      	evtHandle = phone.register("EvtRing", this, "onRingForBJ95");                           
      	handles.push(evtHandle);      	
     }
	  else if (userInfo.accountId == 'A000000003064'){
      	evtHandle = phone.register("EvtRing", this, "onRingForHmgb");                           
      	handles.push(evtHandle);      	
     } else if (userInfo.accountId == 'Q000000003906'){
      	evtHandle = phone.register("EvtRing", this, "onRingForBJ83");                           
      	handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'Q000000004281'){
      	evtHandle = phone.register("EvtRing", this, "onRingForZS");                           
      	handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'P000000003621'){
      	evtHandle = phone.register("EvtRing", this, "onRingForCCTV");                           
      	handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'Q000000004065'){
      	evtHandle = phone.register("EvtRing", this, "onRingForCaixinWriteCallsheet");                           
      	handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'Q000000003850'){
      	evtHandle = phone.register("EvtRing", this, "onRingForBJ90");                           
      	handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'Q000000003827'){
      	//evtHandle = phone.register("EvtRing", this, "onRingForBJ92");                           
      	//handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'P000000002792'){
      	evtHandle = phone.register("EvtRing", this, "onRingForBJ01");                           
      	handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'P000000004681'){
      	evtHandle = phone.register("EvtRing", this, "onRingForWTX");                           
      	handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'P000000001383'){
      	evtHandle = phone.register("EvtRing", this, "onRingForWLTX");                           
      	handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'Q000000004501'){
      	evtHandle = phone.register("EvtRing", this, "onRingForStiova");                           
      	handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'G000000004641' && userInfo.isInterface=='1'){
      	evtHandle = phone.register("EvtRing", this, "onRingForHsgk");                           
      	handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'Q000000004621'){
      	evtHandle = phone.register("EvtRing", this, "onRingForRuisen");                           
      	handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'P000000004881'){
      	evtHandle = phone.register("EvtRing", this, "onRingForYZ");                           
      	handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'Q000000004121'){
      	evtHandle = phone.register("EvtRing", this, "onRingCofco");                           
      	handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'Q000000004477'){
      	evtHandle = phone.register("EvtRing", this, "onRingForXcxd");                           
      	handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'Q000000003870'){
      	evtHandle = phone.register("EvtRing", this, "onRingForKuaiqian");                           
      	handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'Q000000003728'){
      	evtHandle = phone.register("EvtRing", this, "onRingForBj99");                           
      	handles.push(evtHandle);      	
    }else if (userInfo.accountId == 'Z000000003781'){
      	evtHandle = phone.register("EvtRing", this, "onRingForEeepay");                           
      	handles.push(evtHandle);      	
     } 	 
};
icallcenter.CallProcessRegister.onRingForEeepay= function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	  if(co && co.callType=='validate'){
	  	taskId=date.valueOf();
	  }
	var url = 'http://www.hui99.com/mall/ivr/ivrMain.html?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
	  if(co.data && co.data.HUIJJ_KEY){
	  	url+= '&huijjKey=' + co.data.HUIJJ_KEY;
	  }
		console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};
icallcenter.CallProcessRegister.onRingForBj99 = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	var url = 'http://mywanliwang.10000.com/call?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
	  
		console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};
icallcenter.CallProcessRegister.onRingForKuaiqian = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	var url = 'http://tracker.99bill.com/Pts/CreateIssue.aspx?project=178&callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
	  
		console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};
icallcenter.CallProcessRegister.onRingForXcxd = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	var url = 'http://www.18900.com/CallCenter/CallCenter.php?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
	  
		console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};
icallcenter.CallProcessRegister.onRingCofco = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	var url = 'http://www.womai.com/user/CallCenter.do?ColumnID=603&callNo=' + co.originCallNo;
	  
		console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};
icallcenter.CallProcessRegister.onRingForYZ = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	var url = 'http://www.moutai60.com/youce/shop_call/shop_call/index.php/Account/searchaccount/callNo/' + co.originCallNo + '/calledNo/' + co.originCalledNo+'/agentName/' + userInfo.userName + '/ivrkey/' + co.data.IVRKEY + '/callsheetId/' + co.callId;

		console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};
icallcenter.CallProcessRegister.onRingForRuisen = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	var url = 'http://biz.jiumaijiu.com/console/telsystem/telindex.aspx?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
	  
		console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};
icallcenter.CallProcessRegister.onRingForHsgk = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	var url = 'http://www.bizviva.com/bizviva/sellercrm/orderCreatindex.do?caller=' + co.originCalledNo+'&tel=' + co.originCallNo;
		console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};
icallcenter.CallProcessRegister.onRingForStiova = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	var url = 'http://www.bizviva.com/bizviva/sellercrm/orderCreatindex.do?caller=' + co.originCalledNo+'&tel=' + co.originCallNo;
		console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};
icallcenter.CallProcessRegister.onRingForWTX = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	var url = 'http://www.bizviva.com/bizviva/sellercrm/orderCreatindex.do?caller=' + co.originCalledNo+'&tel=' + co.originCallNo;
		console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};
icallcenter.CallProcessRegister.onRingForBJ01 = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	var url = 'http://www.bizviva.com/bizviva/sellercrm/orderCreatindex.do?caller=' + co.originCalledNo+'&tel=' + co.originCallNo +'&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
		console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};
/*icallcenter.CallProcessRegister.onRingForBJ92 = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	var url = 'http://127.0.0.1:8080/callcenter/customerDetail.jsp?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
		console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};*/
icallcenter.CallProcessRegister.onRingForBJ90 = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	var url = 'http://traffic.lukuang.net.cn:9081/oneNavigation/lukuang.jsp?actiontype=&partnet=&agent'+userInfo.userName+'&callerid='+co.originCallNo+'&calleeid='+co.originCalledNo;
	console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');	
};

icallcenter.CallProcessRegister.onRingForCaixinWriteCallsheet = function(){
	var co = phone.callObject;
	var callsheet = 'callsheetId=' + co.callId+'&callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY ;
	this.writeCallsheetFile(callsheet);
};
icallcenter.CallProcessRegister.onRingForCCTV = function(){
	var date = new Date();
	var co = phone.callObject;
	var roleID=userInfo.userRoles.toString();
	var hashStr="agentname="+userInfo.userName+"&roleid="+roleID+"&key=abc123";
	var ticket=hex_md5(hashStr);
	console.dir(co);

	console.debug("hexmd5:::[%s]:::[%s]:::[%s]",roleID,hashStr,ticket);
	
	var url = 'http://callcenter.chinaumv.cn/zh/sfCallcenterHome?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId + '&roleid=' + roleID+ '&ticket=' + ticket;
  console.debug(url);
	this.tm_fantong.popupTask(date.valueOf(),'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};

icallcenter.CallProcessRegister.onRingForZS = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	var url = 'http://222.35.143.66:9001/erp/rwgl/diain/index.action?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
		console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');	
};
icallcenter.CallProcessRegister.onRingForBJ83 = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	var url = 'http://www.actrip.com/callcenter.aspx?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
		console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');	
};

icallcenter.CallProcessRegister.onRingForHmgb = function(){
	  var date = new Date();
	  var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	var url = 'http://www.justbb.com/bam/callcenter/calling.aspx?phone=' + co.originCallNo;
		console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');	
};
icallcenter.CallProcessRegister.onRingForBJ95 = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	  
	var url = 'http://www.bflhauto.com/callcenter/chinapoo_yhy.dll?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
		console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');	
};

icallcenter.CallProcessRegister.onRingForHlyc = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	
	var url = 'http://www.handylink.cn/callcenter/comingCall.do?callNum=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agent=' + userInfo.userName + '&ivrKey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
        console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');	
};

icallcenter.CallProcessRegister.onRingForZhongMei = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	if (co.data && co.data.CardNo) {
				var url = 'http://callcenter.kuaileyigou.com:1806/dcap/platform/dingdangl/cibank/getCardInfo.jsp?cardNum='+co.data.CardNo+'&ani='+co.originCallNo+'&agenda='+userInfo.userName;
    console.debug(url);
  
		this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
		tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');	

	}else if(co.data){
				var url = 'http://callcenter.kuaileyigou.com:1806/dcap/platform/dingdangl/cibank/getCardInfo.jsp?ani='+co.originCallNo+'&agenda='+userInfo.userName;
    console.debug(url);
  
		this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
		tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');	
	}
};

icallcenter.CallProcessRegister.onRingForFanTong = function(){
	var date = new Date();
	var co = phone.callObject;
	
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }

	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', 'http://124.42.34.232:8080/callcenter/callin.jsp?CallIdNum='+phone.callObject.originCallNo+'&code='+userInfo.sipNo,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};

icallcenter.CallProcessRegister.onRingForYiCheng = function() {
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	
	var url = 'http://www.etown.cn/crm_callin_page/index-temp.asp?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
        console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};

icallcenter.CallProcessRegister.onRingForTouQu = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	
	var url = 'http://www.okooo.com/Admin/UserAdmin/CallCenter.php?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
        console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');	
};

icallcenter.CallProcessRegister.onRingForHuaTu = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	
	var url = 'http://www.htexam.net/hl/comTel.asp?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
        console.debug(url);
	window.open(url,'','height=200,width=670,left='+(screen.availWidth-680)+',top='+(screen.availHeight-220-28)+',menubar=no,resizable=yes,scrollbars=yes,location=no,status=no');	
};

icallcenter.CallProcessRegister.onRingForThreeSixFive = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	
	var url = 'http://113.11.200.160:8005/callcenter.aspx?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
        console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};

icallcenter.CallProcessRegister.onRingForFortest = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	
	var url = 'http://211.154.136.140:8000/CRMtest.asp?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
        console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};

icallcenter.CallProcessRegister.onRingForBaiNaoHui = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	
	var url = 'http://192.168.102.138/callcenter/tel_list.php?act=list&callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
        console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_bainaohui_onRing', 'account.agent.workspace_bainaohui', url,null, null,null, false);
	tm._switchContext('agent.workspace_bainaohui',true,'./action/workspace/workspace_main_bainaohui.do');
};

icallcenter.CallProcessRegister.onRingForBoWeiShiDai = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	
	var url = 'http://crm.4008109966.com/Interface.aspx?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
        console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};

icallcenter.CallProcessRegister.onRingForBj27 = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	
	var url = 'http://10.188.5.16/crm/cc.php?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
        console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};

icallcenter.CallProcessRegister.onRingForBj19 = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	
	var url = 'http://192.168.1.21/cc.jsp?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
        console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};

icallcenter.CallProcessRegister.onRingForBj52 = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	
	var url = 'http://www.felissimo.com.cn/member/MemberSearchForCallCenter.aspx?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
        console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};

icallcenter.CallProcessRegister.onRingForBj28 = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	
	var url = 'http://127.0.0.1/?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
        console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};

icallcenter.CallProcessRegister.onRingForBj59 = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
/*	var url = 'http://www.bjjlsw.com/callcenter/chinapoo_yhy.dll?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId + '&reply=' + co.data.reply;*/
	var url = 'http://www.bjjlsw.com/callcenter/cardinfo.dll?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId + '&gwc=&gwm=&gwd=';
        console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};

icallcenter.CallProcessRegister.onRingForYouLi = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	
	var url = 'http://crm.maotai60.cn/crm/shop_call/shop_call/index.php/Account/searchaccount/callNo/' + co.originCallNo + '/calledNo/' + co.originCalledNo
		+ '/agentName/' + userInfo.userName + '/ivrkey/' + co.data.IVRKEY + '/callsheetId/' + co.callId;
        console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};

icallcenter.CallProcessRegister.onRingForHaoLeMei = function(){
	var date = new Date();
	var co = phone.callObject;
	  var taskId=date.valueOf();
	  if(co && co.callId){
		  taskId=co.callId;
	  }
	var url = 'http://www.okaybuy.com.cn/admin/odr/callpage.php?callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY + '&callsheetId=' + co.callId;
        console.debug(url);
	this.tm_fantong.popupTask(taskId,'来电弹屏', 'tm_fantong_onRing', 'account.agent.workspace_fantong', url,null, null,null, false);
	tm._switchContext('agent.workspace_fantong',true,'./action/workspace/workspace_main_fantong.do');
};
icallcenter.CallProcessRegister.onRingForWLTX = function(){
	var co = phone.callObject;
	var callsheet = 'callsheetId=' + co.callId+'&callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY ;
	this.writeCallsheetFile(callsheet);
};
icallcenter.CallProcessRegister.onRingForWriteCallsheet = function(){
	var co = phone.callObject;
	var callsheet = 'callsheetId=' + co.callId+'&callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo
		+ '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY ;
	icallcenter.CallProcessRegister.writeCallsheetFile(callsheet);
};
icallcenter.CallProcessRegister.writeCallsheetFile = function(callsheet){
    var d = new Date();
	var fso = new ActiveXObject("Scripting.FileSystemObject");
      try{
		fso.CreateFolder("c:\\callsheet\\");
		}catch(e){
      // alert(e.description);
      }
	  try{
       fs = fso.OpenTextFile("c:\\callsheet\\"+d.getFullYear()+"-"+((d.getMonth()*1+1)<10?'0'+(d.getMonth()*1+1):(d.getMonth()*1+1))+"-"+(d.getDate()<10?"0"+d.getDate():d.getDate())+".log",8,true);
	   fs.WriteLine(callsheet);
       fs.close();
      }catch(e){
       alert(e.description);
      }
}
