dojo.provide("icallcenter.SoftphoneBar");
dojo.require("icallcenter.Phone");

dojo.declare("icallcenter.SoftphoneBar", null, {
  
  constructor: function(phone, srcNodeName) {
      this._phone = phone;
      this._srcNodeRef = dojo.byId(srcNodeName);
    
      
      this._stateDescription["stReady"] = "签出";    
      this._stateDescription["stIdle"] = "空闲";
      this._stateDescription["stBusy"] = "忙碌";
      this._stateDescription["stBelling"] = "振铃";
      this._stateDescription["stTalking"] = "通话";
      this._stateDescription["stInnerTalking"] = "内部通话";
      this._stateDescription["stHoldTalk"] = "保持";
      this._stateDescription["stHold"] = "保持";      
      this._stateDescription["stConsult"] = "咨询";
      this._stateDescription["stConsulting"] = "正在咨询";   
      this._stateDescription["stConsulted"] = "咨询接通";
      this._stateDescription["stDialing"] = "正在外呼";            
      this._stateDescription["stDialTalking"] = "外呼接通";            
      this._stateDescription["stListening"] = "监听";            
      this._stateDescription["stToIVR"] = "转验证";            
      this._stateDescription["stInvalid"] = "失效"; 
      // 注册分机状态变化事件
      this._phone.register("EvtStateChange", this, "onStateChanged");                           
      this.onStateChanged(this._phone.state);
//	  this._phone.autoBusy ? this._phone.setBusy() : this._phone.setIdle();
    },
    
    _phone: null,
    
    _srcNodeRef: null,
    
    _stateDescription: [],
    
    // 软电话条的状态
    // SIP方式的软电话状态
    sip_stReady: ["BellDisable","DialDisable", "ReadyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    sip_stListening: ["BellDisable","DialDisable", "BusyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    sip_stIdle: ["BellDisable","DialEnable","BusyEnable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    sip_stBusy: ["BellDisable","DialEnable","ReadyEnable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    sip_stBelling: ["BellEnable", "DialDisable", "BusyDisable", "HangupDisable", "HoldDisable","TransferDisable", "ConsultDisable","InvestigateDisable","ToIVRDisable"],
    sip_stThreeWayTalking: ["ThreeWayCallDisable","BellDisable","DialDisable","BusyDisable","HangupEnable","HoldDisable","TransferDisable"],
    sip_stDialTalking: ["ThreeWayCallEnable","BellDisable","SecDialEnable","BusyDisable","HangupEnable","HoldEnable","TransferEnable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    sip_stTalking: ["ThreeWayCallEnable","BellDisable","DialDisable","BusyDisable","HangupEnable","HoldEnable","TransferEnable","ConsultEnable","InvestigateEnable","ToIVREnable"],
    sip_stInnerTalking: ["BellDisable","DialDisable","BusyDisable","HangupEnable","HoldEnable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    sip_stHoldTalk: ["BellDisable", "DialDisable", "BusyDisable","HangupDisable","HoldGetDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    sip_stConsult: ["BellDisable","DialDisable","BusyDisable","HangupDisable","HoldDisable","TransferEnable","ConsultEndEnable","InvestigateDisable","ToIVRDisable"],
    sip_stConsulting: ["BellDisable","DialDisable","BusyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultEndEnable","InvestigateDisable","ToIVRDisable"],
    sip_stConsulted: ["BellDisable","DialDisable","BusyDisable","HangupEnable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    sip_stHold: ["BellDisable","DialDisable","BusyDisable","HangupDisable","HoldGetEnable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    sip_stDialing: ["BellDisable","DialDisable","BusyDisable","HangupEnable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    sip_stToIVR: ["BellDisable","DialDisable","BusyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    sip_stLogout: ["BellDisable","DialDisable","BusyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    sip_stInvalid: ["BellDisable","SecDialDisable","DialDisable","BusyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],    
    // LOCAL方式的toolbar状态
    Local_stReady: ["BellDisable","DialDisable", "ReadyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    Local_stListening: ["BellDisable","DialDisable", "BusyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    Local_stIdle: ["BellDisable","DialEnable","BusyEnable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    Local_stBusy: ["BellDisable","DialEnable","ReadyEnable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    Local_stBelling: ["BellEnable", "DialDisable", "BusyDisable", "HangupDisable", "HoldDisable","TransferDisable", "ConsultDisable","InvestigateDisable","ToIVRDisable"],
    Local_stThreeWayTalking: ["ThreeWayCallDisable","BellDisable","DialDisable","BusyDisable","HangupEnable","HoldDisable","TransferDisable"],
    Local_stDialTalking: ["ThreeWayCallEnable","BellDisable","DialDisable","BusyDisable","HangupEnable","HoldEnable","TransferEnable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    Local_stTalking: ["ThreeWayCallEnable","BellDisable","DialDisable","BusyDisable","HangupEnable","HoldEnable","TransferEnable","ConsultEnable","InvestigateEnable","ToIVREnable"],
    Local_stInnerTalking: ["BellDisable","DialDisable","BusyDisable","HangupEnable","HoldEnable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    Local_stConsult: ["BellDisable","DialDisable","BusyDisable","HangupDisable","HoldDisable","TransferEnable","ConsultEndEnable","InvestigateDisable","ToIVRDisable"],
    Local_stConsulting: ["BellDisable","DialDisable","BusyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultEndEnable","InvestigateDisable","ToIVRDisable"],
    Local_stConsulted: ["BellDisable","DialDisable","BusyDisable","HangupEnable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    Local_stHoldTalk: ["BellDisable", "DialDisable", "BusyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    Local_stHold: ["BellDisable","DialDisable","BusyDisable","HangupDisable","HoldGetEnable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    Local_stDialing: ["BellDisable","DialDisable","BusyDisable","HangupEnable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    Local_stToIVR: ["BellDisable","DialDisable","BusyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    Local_stLogout: ["BellDisable","DialDisable","BusyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    // GATEWAY方式的toolbar状态
    gateway_stReady: ["BellDisable","DialDisable", "ReadyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    gateway_stListening: ["BellDisable","DialDisable", "BusyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    gateway_stIdle: ["BellDisable","DialEnable","BusyEnable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    gateway_stBusy: ["BellDisable","DialEnable","ReadyEnable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    gateway_stBelling: ["BellEnable", "DialDisable", "BusyDisable", "HangupDisable", "HoldDisable","TransferDisable", "ConsultDisable","InvestigateDisable","ToIVRDisable"],
    gateway_stConsult: ["BellDisable","DialDisable","BusyDisable","HangupDisable","HoldDisable","TransferEnable","ConsultEndEnable","InvestigateDisable","ToIVRDisable"],
    gateway_stConsulting: ["BellDisable","DialDisable","BusyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultEndEnable","InvestigateDisable","ToIVRDisable"],
    gateway_stConsulted: ["BellDisable","DialDisable","BusyDisable","HangupEnable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    gateway_stThreeWayTalking: ["ThreeWayCallDisable","BellDisable","DialDisable","BusyDisable","HangupEnable","HoldDisable","TransferDisable"],
    gateway_stDialTalking: ["ThreeWayCallEnable","BellDisable","DialDisable","BusyDisable","HangupEnable","HoldEnable","TransferEnable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    gateway_stTalking: ["ThreeWayCallEnable","BellDisable","DialDisable","BusyDisable","HangupEnable","HoldEnable","TransferEnable","ConsultEnable","InvestigateEnable","ToIVREnable"],
    gateway_stInnerTalking: ["BellDisable","DialDisable","BusyDisable","HangupEnable","HoldEnable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    gateway_stConsulted: ["BellDisable","DialDisable","BusyDisable","HangupEnable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    gateway_stHoldTalk: ["BellDisable", "DialDisable", "BusyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    gateway_stHold: ["BellDisable","DialDisable","BusyDisable","HangupDisable","HoldGetEnable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    gateway_stDialing: ["BellDisable","DialDisable","BusyDisable","HangupEnable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    gateway_stToIVR: ["BellDisable","DialDisable","BusyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    gateway_stLogout: ["BellDisable","DialDisable","BusyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],
    gateway_stInvalid: ["BellDisable","DialDisable","BusyDisable","HangupDisable","HoldDisable","TransferDisable","ConsultDisable","InvestigateDisable","ToIVRDisable"],    

    onStateChanged: function(state) {        
      console.debug("[state=%s]",state);
      var oldState = this._state;
      this._state = state;
      if (state == "stBelling") {
            this.playSound();
      } else if (oldState == "stBelling") {
            this.stopSound();
      } 
      var type = "sip";
      var extenType = this._phone.extenType; 
      if (extenType == "gateway" || extenType == "phone") {
          type = "gateway";
      } else if (extenType == "Local") {
          type = "Local";
      } 
      var curState = type + "_" + state;
      console.debug(curState);
      this._render(curState);
      dojo.byId("icc.login.agentState").innerText = this._stateDescription[state];//更新状态
    },

    toDial: function() {
  	 /* if (this._phone.state != "stBusy") {
      		alert("请先将电话置忙");
          return ;
      }*/
    	
      dm.showDialog("dialDialog", "外呼", "./callprocessor/softphone/outdial.html", {width:200,height:80});             
    },
    
    toSecDial: function() {
      dm.showDialog("secdialDialog", "拨分机", "./callprocessor/softphone/secdial.html", {width:220,height:80});             
    },

    setAutoBusy: function() {
      if (this._phone.state == "stBusy" || this._phone.state == "stIdle") {
          this._phone.setBusy();
          this._phone.autoBusy = true;
          dojo.byId("liAutoBusy").style.display = "none";
          dojo.byId("liAutoIdle").style.display = "";
      } else {
          alert("当前状态下不允许修改该参数");
      }
    },
    
    setAutoIdle: function() {
      if (this._phone.state == "stBusy" || this._phone.state == "stIdle") {
          this._phone.setIdle();
          this._phone.autoBusy = false;
          dojo.byId("liAutoBusy").style.display = "";
          dojo.byId("liAutoIdle").style.display = "none";
      } else {
          alert("当前状态下不允许修改该参数");
      }
      this._phone.autoBusy = false;

    },

    dispatch: function(destExtern, connectType, mode, queueNo) {
       /* if (mode != "skillgroup" && !this._phone.isAgentIdle(queueNo, destExtern)) {
            alert("转接坐席当前忙"); 
            return false;
        }*/
        var callObject = this._phone.callObject;
        var success = true;
        if (connectType == "transfer" && callObject != null) {
            console.dir(callObject.data);
            success = this._phone.transfer(destExtern, mode, callObject.data);    
        } else if (connectType == "consult" && callObject != null) {
            success = this._phone.consult(destExtern, callObject.data);    
        }
        if (success) {
               dm.closeDialog(); 
        }
    },
    
    
    dialout: function(phoneNum, customerId, workSheetId, workFlowId) {
    	 if (/^\d+$/.test(phoneNum)) {
    	 		this._phone.dialout(phoneNum, {customerId: customerId, workSheetId: workSheetId, workFlowId: workFlowId});
    	 		return true;
    	 } else {
    	 		alert("请输入正确的电话号码");
    	 		return false;	
    	 }
    },
    
    toThreeWayCall: function(){    	
    	dm.showDialog("threeWayCallDialog", "三方通话", "./callprocessor/softphone/threeWayCall.html", {width:200,height:80});  
    },
    
    threeWayCall: function(phoneNum){
    	
    	if(/^\d+$/.test(phoneNum)){
    		this._phone.threeWayCall(phoneNum);    		
    		dm.closeDialog();
    	}else{
    		alert("请输入正确的电话号码");
    		dm.closeDialog();   		
    	}
    },

    secDial: function(exten, i) {
         if (!i) i =0;
    	 if (i == 0 && !/^\d+$/.test(exten)) {
	    alert("请输入正确的分机号码");
	    return false;	
    	 }
	 if (i < exten.length) {
	    var num = exten.charAt(i);
	    phone.playDTMF(num);
	    window.setTimeout(function() {softphoneBar.secDial(exten, ++i)}, 500);
	 }
         return true;
    },

    toTransfer: function() {
       if (this._phone.state == "stConsult") {
           this._phone.consultToTransfer();
       } else {
           var request = {
              url: "./service/skillGroupService/getQueuesByAccountId",
              params: [userInfo.accountId],
              onLoad: function(skillgroups) {
                 dm.showDialog("skillGroupDialog", "选择转接对象", 
                 "./action/contactList/transferTab.do?connectType=transfer", {width:360,height:400}, {skillgroups:skillgroups,connectType:'transfer'});            
              }
           };
           icallcenter.common.request(request);     
      }
     },

    toConsult: function() {
       var request = {
          url: "./service/skillGroupService/getQueuesByAccountId",
          params: [userInfo.accountId],
          onLoad: function(skillgroups) {
             dm.showDialog("skillGroupDialog", "选择咨询对象", 
             "./action/contactList/transferTab.do?connectType=consult", {width:360,height:500}, {skillgroups:skillgroups,connectType:'consult'});             
          }
       };
       icallcenter.common.request(request);                 
    },

    exTransfer: function() {
       var phoneNum = dojo.byId("skillgroup.phoneNum").value;
    	 if (/^\d+$/.test(phoneNum)) {
                phone.transfer(phoneNum, "external", {});
                dm.closeDialog();    	 		
    	 } else {
    	 		alert("请输入正确的电话号码");
    	 }       
    },
    
    setBusy: function() {
        if (this._phone.state == "stIdle") {
     //           this._phone.setBusy();
                return 0;
        } else {
                return -1;
        }

    },
    

    changePhone: function(extenType,extenNum) {
        phone.changePhone(extenType,extenNum);
        dojo.byId("liChangeConnect").style.display = 'none';
        dojo.byId("icc.login.listenType").innerText = userInfo.localMobile;
		dojo.byId("icc.login.delay").innerText = "";
    },

    onInterval: function(interval) {
        //dojo.byId("icc.login.delay").innerText = "("+ (interval * 0.5) + "ms)";
    },

    _render: function(state) {  
      var self = this;
      dojo.query("img", this._srcNodeRef).forEach(
            function(imgElement) {
              if (dojo.indexOf(self[state], imgElement.id) < 0) {
                    imgElement.style.display = "none";                                          
              } else {
			if (imgElement.id == 'DialDisable' || imgElement.id == 'DialEnable') {
                                self._display(imgElement, "agent.dialout");
			} else if (imgElement.id == 'InvestigateDisable' || imgElement.id == 'InvestigateEnable') {
                                self._display(imgElement, "agent.investigate");
			} else if (imgElement.id == 'ToIVRDisable' || imgElement.id == 'ToIVREnable') {
                                self._display(imgElement, "agent.toIVR");
			}else if(imgElement.id == 'ThreeWayCallDisable' || imgElement.id == 'ThreeWayCallEnable'){
								self._display(imgElement, "agent.threeWayCall");
			} else {
				imgElement.style.display = "";
			}
              } 
            }
        );  
    },
   
    _display: function(imgElement, func) {
	var owns = dojo.map(userInfo.functions, function(func) {
		return func.accountFunctionValue;
	});
	if (dojo.indexOf(owns, func) < 0) {
		imgElement.style.display = "none"; 	    
	} else {
		imgElement.style.display = "";
	}

    },
    
     playSound: function(){ 　
        try {
	  document.soundPlayer.play();
        } catch (e) {
          console.debug(e);
        }
     },
     
     stopSound: function(){ 　
        try {
	  document.soundPlayer.stop();
        } catch (e) {
          console.debug(e);
        }
     },     
    

     getSkillGroupTree: function(skillgroups, connectType){
         var queueNos = "";
         for (var i = 0; i < skillgroups.length; i++) {
             queueNos += skillgroups[i].queueNo;
             if (i < skillgroups.length - 1) {
                 queueNos += ",";
             }
         }
         var queueStatus = "";
         dtree = new dTree('dtree');
         dtree.config.target = "";
         dtree.config.imageDir = './framework/dtree/img';
         var actionIcon = "./framework/images/docrenew.gif";
         dtree.reSetImagePath();
         dtree.add(0, -1, '技能组'); //根节点                                
         for (var i = 0; i < skillgroups.length; i++) {
             var skillgroup = skillgroups[i];
             var sgList = null;
             if (connectType == "transfer") {
                 actionUrl = "javascript:softphoneBar.dispatch('" + skillgroup.queueNo + "','" + connectType + "','skillgroup')";
                 var actionTitle = "选择技能组";
                 var selectAction = new NodeAction(actionUrl, actionIcon, actionTitle);
                 sgList = new List();
                 sgList.add(selectAction);
             }
             
             dtree.add(skillgroup.queueId, "0", skillgroup.queueName, "", skillgroup.queueName, "", "", "", "true", sgList);
             
             if (dojo.getObject("phone.monitorQueues")) {
                 var curQueue = phone.monitorQueues[skillgroup.queueNo];
                 var peers = curQueue.members;
                 for (var j in peers) {
                    // if (!dojo.getObject("phone.monitorPeers")) 
                      //   continue;
                     var exten = peers[j].Exten;
                     var peer =phone._getUserViaSipNum(exten);
					 
                     if (peer == null) 
                         continue;
                     var displayExtern = '';
                     if (userInfo.allAgentsDisplay) {
                         for (var m in userInfo.allAgentsDisplay) {
                             if (userInfo.allAgentsDisplay[m].userId == peer.userId) {
                                 displayExtern = userInfo.allAgentsDisplay[m].name;
                             }
                         }
                     }
                     
                     if (peer.callStatus == 'Idle' && (peer.extenType == 'Local' || ((peer.extenType == 'sip' || peer.extenType == 'gateway') && peer.register)) && !peer.busy) {
                         actionUrl = "javascript:softphoneBar.dispatch('" + exten + "','" + connectType + "','agent','" + skillgroup.queueNo + "')";
                         actionTitle = "选择座席";
                         selectAction = new NodeAction(actionUrl, actionIcon, actionTitle);
                         sgList = new List();
                         sgList.add(selectAction);
                     }
                     else {
                         sgList = new List();
                     }
                     dtree.add(exten, skillgroup.queueId, displayExtern, "", displayExtern, "", "", "", "true", sgList);
                 }
             }
         }
         return dtree.toString();
     }
});



