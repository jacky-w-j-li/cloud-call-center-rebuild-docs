dojo.provide("icallcenter.CallProcessor");
dojo.require("icallcenter.Phone");

dojo.declare("icallcenter.CallProcessor", null, {
  
  constructor: function(phone) {
      this._phone = phone;
      // 注册分机状态变化事件
      icallcenter.CallProcessor.register(this._phone,this._handles,this);
    },

    destroy: function() {
      for (var i in this._handles) {    
            this._phone.unregister(this._handles[i]);
      }
    },

   MAX_TRY: 5,
  
   MAX_WAIT: 20000,

   _phone: null,

   _answerCallTimes: 0,
   
   _handles: [],
    
    // 软电话事件处理
    onRing: function(callObject) {
        console.info("振铃事件处理开始");
        console.dir(callObject);console.dir(callObject.data);
        callObject.originCallNo = callObject.originCallNo.substr(callObject.originCallNo.indexOf("@") + 1); 
        console.debug("callType=[%s]", callObject.callType);
        if (/(\w+)([\[\(].+[\]\)])?/g.test(callObject.callType)) {
            callObject.callType = RegExp.$1
        }
        var self = this;
        var connectType = callObject.callType; 
        var originId = callObject.originId;
        var callId = callObject.callId; 
        var callNo = callObject.originCallNo;
		var locationId=callObject.location;
        var pos = callObject.originCalledNo.indexOf('@');
	    var calledNo = (pos >= 0) ? callObject.originCalledNo.substr(pos+1) : callObject.originCalledNo;
	    var skillgroupNo = callObject.skillgroupNo;

        if (calledNo.indexOf("013") == 0 || calledNo.indexOf("015") == 0) {
            calledNo = calledNo.substr(1);
        }
        var offeringTime = callObject.offeringTime;
        var customerId = callObject.data.customerId || "";
        var refCallSheetId =callObject.callSheetId || callObject.data.callSheetId || "";
        console.debug("振铃参数[%s, %s, %s, %s, %s]", connectType, callNo, calledNo, customerId,locationId);
        var ivrKey = callObject.data.IVRKEY;
		if(!ivrKey){
			ivrKey='';
		}
		var submitData = [callNo, calledNo, connectType, customerId, offeringTime, refCallSheetId, callId, originId,ivrKey,locationId,userInfo.userName,callObject.data];
        if (/^ivr\d?-\d+-?([-\d]*)$/g.test(ivrKey)) {
            ivrKey = RegExp.$1;    
        }
		
       
        var view = {
            callNo: callObject.originCallNo,
            calledNo: calledNo,
            connectType: (connectType == "inner") ? "内线呼叫" : connectType,
            offeringTime: callObject.offeringTime.substr(10),
            ivrKey: ivrKey,
			queue:callObject.queue
        }; 
        var callInfoArea = dojo.byId("callInfoArea");
        icallcenter.CallProcessor.callToView(view); //更新工作台页面左栏来电信息
        dojo.query("label[type=json]", callInfoArea).style("color", "red");
        if (connectType == 'inner') {
			return;//内部通话不记
		}
		
        var url = "./service/sipPhoneService/onRing";
        var ajaxRequest = new icallcenter.ajaxRequest({
            url: url,
            content: {json: dojo.toJson(submitData)},
            handleAs: "json",
            timeout: self.MAX_WAIT,
            preventCache: true,         

            load: function(response, ioArgs) {
                if (response.resultCode == "0000") {
					 console.info("振铃事件成功返回");
                	  var o = response.result;
					  var merge=o.mergeVo;
					  var custList=o.custList;
					  var wsList=o.workSheetList;
					  var csList=o.callSheetList;
                    callObject.data.customerId  = o.customerId;
                    console.debug("定位的客户id[%s]", o.customerId);
                    callObject.province = o.province;
                    callObject.city = o.city;
			        var otherView = {
						province:callObject.province,
						recentContactTime:o.customer.recentContactTime,
						recentDisposalAgent:o.customer.recentDisposalAgent
			        }; 					
					icallcenter.CallProcessor.otherToView(otherView); 
										
                   console.info("生成通话记录成功:[" + callObject.data.callSheetId + "]");
					                  
		    						//if (connectType == "inner") return;
                   // var businessId = userDic.getName("SKILLGROUP_BIZ", skillgroupNo);
				   var businessId=merge.integrationId;
                    var customerType = null; 
                    if (businessId && businessId.indexOf("order_") == 0) {
         				customerType = userDic.getName("BIZ_CUST_TYPE", userInfo.accountId+"_order_cod");
                    } else {
                        customerType = userDic.getName("BIZ_CUST_TYPE", businessId);
                    }
                    
                    if (customerType && !userDic.getName("CUST_TYPE", customerType)) {
                          customerType = null;
                    }
                    console.debug("弹出的业务编号[%s]客户类型[%s]", businessId, customerType);
                    console.dir(phone.callObject.data);
					isCO=0;
					/*if(o.customerId==UNKNOW_CUSTOMER_ID){
						custList=null;
					}*/
					icallcenter.workspace.bodyHtml('customer_th',custList);
                    var owns = dojo.map(userInfo.functions, function(func){
                        return func.accountFunctionValue;
                    });
                    if (dojo.indexOf(owns, "agent.workflow") != -1) {
                    	icallcenter.workspace.bodyHtml('bus_th',wsList);
                    }else{
						icallcenter.workspace.bodyHtml('callSheet_th',csList);
					}

					if(merge.integrationType=='outer'){
						icallcenter.workspace.popupIntegration(merge.url);
					}else if (callObject.data.workSheetId){
                        icallcenter.businessnew.transferWorkSheet(userInfo.userId,callObject.data.workSheetId);
                    } else if (businessId && businessId.indexOf("order_") == 0) {
                        icallcenter.workspace.popupCreateOrder(customerType);                         
                    } else if (businessId) {
                        icallcenter.workspace.popupWorkSheetCreate(businessId, null, customerType);  
                    }else{
						console.info('默认通话弹屏!');
						var custID=UNKNOW_CUSTOMER_ID;
						var custType=null;
						if(custList && custList.length>0){
							custType=custList[0].customerType;
						}
						if(custList && custList.length==1){
							custID=custList[0].customerId;
						}
						icallcenter.workspace.popupCallSheetCreate(o.callSheetId,custType,custID);
					}
					
					
                } else {
                    console.error("振铃生成通话记录失败"); 
                }                
            },
            
            error: function(response, ioArgs) {
                 console.error("振铃处理发生错误");
            }
        });       
        ajaxRequest.doPost();   
    },

    onDialing: function(callObject) {
        console.info("外呼事件处理开始");
        console.dir(callObject);
        console.dir(callObject.data);
        var self = this;
        var connectType = callObject.callType; 
        if (connectType == "inner") return;
        var callNo = callObject.originCallNo;
        var calledNo = callObject.originCalledNo;
        var offeringTime = callObject.offeringTime;
        var customerId = callObject.data.customerId || "";
        var workSheetId = callObject.data.workSheetId || "";
        var workFlowId = callObject.data.workFlowId || "";
        var callSheetId = callObject.callSheetId || "";
        var submitData = [callNo, calledNo, connectType, customerId, workSheetId, workFlowId,callSheetId];
 
        dojo.query("label[type=json]", callInfoArea).style("color", "red"); 
        var url = "./service/sipPhoneService/onDialing";
        var ajaxRequest = new icallcenter.ajaxRequest({
            url: url,
            content: {json: dojo.toJson(submitData)},
            handleAs: "json",
            timeout: self.MAX_WAIT,
            preventCache: true,         

            load: function(response, ioArgs) {
                if (response.resultCode == "0000") {
					isCO=0;
                    var o = response.result;
                    callObject.data.callSheetId = o.callSheetId;
                    callObject.data.customerId  = o.customerId;
                   // var customerInfoArea = dojo.byId("customerInfoArea");
		   // icallcenter.common.objectToView(o.customer, customerInfoArea);
			        var otherView = {
						province:o.province,
						recentContactTime:o.customer.recentContactTime,
						recentDisposalAgent:o.customer.recentDisposalAgent
			        }; 					
					icallcenter.CallProcessor.otherToView(otherView); 			                     
                    console.info("生成通话记录成功:[" + callObject.data.callSheetId + "]");
                    // 显示外呼信息
                    var view = {
                        callNo: callObject.originCallNo,
                        calledNo: dojo.getObject("userInfo.accountId")=='Q000000003844'?"":callObject.originCalledNo,
                        connectType: callObject.callType,
                        offeringTime: offeringTime.substr(10),
                        ivrKey: '',
						queue: ''
                    }; 

                    var callInfoArea = dojo.byId("callInfoArea");
                    icallcenter.CallProcessor.callToView(view);                    
                } else {
                    this.error(response, ioArgs);
                }                
            },
            
            error: function(response, ioArgs) {
                 console.error("外呼处理发生错误");
            }
        });       
        ajaxRequest.doPost();   
    },

    onConnected: function(callObject) {
        console.info("应答事件处理开始");
        console.dir(callObject.data);
        var self = this;   
        // 仅处理被咨询方应答、普通应答以及转接来电应答事件
        if (callObject.callType != "consulted" && callObject.callType.indexOf("webcall") < 0 && callObject.callType != "normal" && callObject.callType != "transfer" && callObject.callType.indexOf("dialout") < 0 && callObject.callType.indexOf("dialTransfer") < 0 ) return;
		var keyword = dojo.byId("icc.customer_workspace.keyword");
		/*if (keyword && callObject.callType.indexOf("dialout") < 0) {
        // 切换到工作台客户的标签页,定位到当前主叫客户
		    icallcenter.taglib.TabPane.selectShow("icc.workspace_main.tab", 1);
			keyword.style.color = '#000';			
            if (callObject.callType.indexOf("dialTransfer") >= 0) {
                var calledNo = callObject.originCalledNo;
                if (calledNo.indexOf("013") == 0) {
                    calledNo = calledNo.substr(1);
                }
                keyword.value = calledNo;
            } else {
                keyword.value = callObject.originCallNo;
            }
			keyword.hasValue = "true";
			icallcenter.custManage.searchForWorkspace(dojo.byId('icc.customer_workspace.form'));
		}*/
        var connectType = callObject.callType; 
        var callNo = callObject.originCallNo;
        var pos = callObject.originCalledNo.indexOf('@');
	   		 var calledNo = (pos >= 0) ? callObject.originCalledNo.substr(pos+1) : callObject.originCalledNo;

        if (calledNo.indexOf("013") == 0 || calledNo.indexOf("015") == 0) {
            calledNo = calledNo.substr(1);
        }
        var offeringTime = callObject.offeringTime;
        var ivrKey = callObject.data.IVRKEY;
        if (/^ivr\d?-\d+-?([-\d]*)$/g.test(ivrKey)) {
            ivrKey = RegExp.$1;    
        }
        var view = {
            callNo: callObject.originCallNo,
            calledNo: dojo.getObject("userInfo.accountId")=='Q000000003844'?"":calledNo,
            connectType: (connectType == "inner") ? "内线呼叫" : connectType,
            offeringTime: (offeringTime)?offeringTime.substr(10):"",
            ivrKey: !ivrKey?'':ivrKey,
            queue: !(callObject.queue)?'':callObject.queue
        };
        var callInfoArea = dojo.byId("callInfoArea");
        icallcenter.CallProcessor.callToView(view); //更新工作台页面左栏来电信息		
		
		// 将来电信息改为黑色显示，同时显示摘机时间 
        dojo.query("label[type=json]", callInfoArea).style("color", "black"); 
        /*dojo.query("label[name=beginTime]", callInfoArea).forEach(function(item) {
                item.innerText = callObject.beginTime.substr(10);
        });*/
				// 等待通话记录生成
        if (!dojo.exists("callSheetId", callObject.data) && this._answerCallTimes < this.MAX_TRY) {
            console.warn("通话清单编号未生成,0.3秒后重新调用[%d]", this._answerCallTimes);
            this._answerCallTimes++;
            window.setTimeout("callProcessor.onConnected(phone.callObject)", 300);              
            return;
        } 
        if (this._answerCallTimes >= this.MAX_TRY) {
	    this._answerCallTimes = 0;
            console.warn("应答尝试次数超过%d次", this.MAX_TRY);
            return;
        }
        this._answerCallTimes = 0;
        console.info("应答成功");
        // 更新通话清单记录
     /*   var submitData = [callObject.data.callSheetId, callObject.beginTime];         
        var url = "./service/sipPhoneService/onAnswer";
        var ajaxRequest = new icallcenter.ajaxRequest({
            url: url,
            content: {json: dojo.toJson(submitData)},
            handleAs: "json",
            timeout: self.MAX_WAIT,

            load: function(response, ioArgs) {
                if (response.resultCode == "0000") {
                    console.info("应答更新通话记录成功");                  
                } else {
                    console.error("应答更新通话记录失败"); 
                }               
            },           
            error: function(response, ioArgs) {
                 console.error("振铃处理发生错误");
            }
        });    
        ajaxRequest.doPost();     */
    },

    onHangup: function(callObject) {
        console.info("挂机事件处理开始");        
        var self = this;
        if (callObject.callType == "inner") {
           console.debug("内线挂机");
           return;
        }
        /*dojo.query("label[name=endTime]", callInfoArea).forEach(function(item) {
                item.innerText = callObject.endTime.substr(10);
        });*/
        //  此处为容错的处理，当挂机异常的时候仍然能正常恢复软电话状态
        if (!dojo.exists("callSheetId",    callObject.data)) {
            console.warn("挂机事件没有对应的CallSheetId");
            callObject = {};
            return;
        }
        // 更新呼叫面板显示
        //  
        var callId = ((this._phone.callObject.callType == "dialout") ? this._phone.callObject.otherCallId : this._phone.callObject.callId) || "";
        var submitData = [callObject.data.callSheetId, callObject.recordFileName, callObject.endTime, callId, callObject.callType];
        callObject = {};
        
      /*  var url = "./service/sipPhoneService/onHangup";
        var ajaxRequest = new 
        icallcenter.ajaxRequest({
            url: url,
            content: {json: dojo.toJson(submitData)},
            handleAs: "json",
            timeout: self.MAX_WAIT,
            preventCache: true,             
 
            load: function(response, ioArgs) {
                if (response.resultCode == "0000") {
                    console.info("挂机更新通话记录成功");                 
                } else {
                    console.error("挂机更新通话记录失败"); 
                } 
            },
            
            error: function(response, ioArgs) {
                 console.debug("挂机处理发生错误");                 
            }
        });     
        ajaxRequest.doPost();    */
    },
    
    
    updateCustomer: function(callSheetId, customerId) {
        if (phone.data.callSheetId == callSheetId) {
            phone.data.customerId = customerId;
            var request = {
                    url: "./service/customerService/getById",
                    params: [customerId], 
                    onLoad: function(result, message) {
                        var customer = result;
                        var customerInfoArea = dojo.byId("customerInfoArea");
             			icallcenter.common.objectToView(customer, customerInfoArea); 
                    }
            };                
        }
    }
});
icallcenter.CallProcessor.register = function(phone, handles, callProcessor){
	//标准事件注册
	evtHandle = phone.register("EvtRing", callProcessor, "onRing");
	handles.push(evtHandle);
	evtHandle = phone.register("EvtConnected", callProcessor, "onConnected");
	handles.push(evtHandle);
	evtHandle = phone.register("EvtHangup", callProcessor, "onHangup");
	handles.push(evtHandle);
	evtHandle = phone.register("EvtDialing", callProcessor, "onDialing");
	handles.push(evtHandle);
	
	/*if(userInfo.accountId == 'P000000002792'){//CS
      	evtHandle = phone.register("EvtRing", this, "writeCallsheetFile");                           
      	handles.push(evtHandle);      	
    }*/
};
icallcenter.CallProcessor.writeCallsheetFile = function(){//CS integration
    var co = phone.callObject;
    var callsheet = 'callsheetId=' + co.callId + '&callNo=' + co.originCallNo + '&calledNo=' + co.originCalledNo + '&agentName=' + userInfo.userName + '&ivrkey=' + co.data.IVRKEY;
    var d = new Date();
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    try {
        fso.CreateFolder("c:\\callsheet\\");
    } 
    catch (e) {
        // alert(e.description);
    }
    try {
        fs = fso.OpenTextFile("c:\\callsheet\\" + d.getFullYear() + "-" + ((d.getMonth() * 1 + 1) < 10 ? '0' + (d.getMonth() * 1 + 1) : (d.getMonth() * 1 + 1)) + "-" + (d.getDate() < 10 ? "0" + d.getDate() : d.getDate()) + ".log", 8, true);
        fs.WriteLine(callsheet);
        fs.close();
    } 
    catch (e) {
        alert(e.description);
    }
};
icallcenter.CallProcessor.callToView = function(obj) {
   dojo.byId('ws_callNo').innerText=obj.callNo;
   dojo.byId('ws_calledNo').innerText=obj.calledNo;
   dojo.byId('ws_connectType').innerText=userDic.getNameOrCode('CONNECT_TYPE', obj.connectType);
   dojo.byId('ws_ivrKey').innerText=obj.ivrKey;
   dojo.byId('ws_queue').innerText=userDic.getNameOrCode('SKILLGROUP_NO', obj.queue);
};
icallcenter.CallProcessor.otherToView = function(obj) {
   dojo.byId('ws_province').innerText=userDic.getNameOrCode('PROVINCE', obj.province);
   dojo.byId('ws_recentContactTime').innerText=obj.recentContactTime;
   dojo.byId('ws_recentDisposalAgent').innerText=userDic.getNameOrCode('USER', obj.recentDisposalAgent);
};