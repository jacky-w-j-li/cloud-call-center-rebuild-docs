dojo.provide("icallcenter.Phone");

dojo.require("icallcenter.common");
dojo.require("dojo.io.script");

dojo.declare("icallcenter.Phone", null, {
    
    constructor: function(config) {
	console.debug("开始初始化控件");
        this._loadConfig(config);
        console.debug("接听类型："+this.extenType);
        if (this.extenType == "sip") {    
            this._loadSipPhone();
        }
        this._evtXhr = dojo._xhrObj();
        this._init();
    }, 
    
    destroy: function(removeQueue) {
        if (!this._destroyed) {
            this._stopEvent();
            this._exit(self.loginName, removeQueue);
            if (this.extenType == "sip") {
                sipPhone.UnInitNoFire();            
            }
            this._destroyed = true;
        }
    },
    //监控队列对象
   	monitorQueues: [],
   	monitorPeers: [],
   	monitorServiceNos: [],
   	accountCalls: {},

   	//message计数
	iccCount:0,
		
    // 语音编码 
    audioCodec: "spex",  
    // 录音文件格式
    recordFormat: "mp3",
    // 软电话所在的队列号
    queues: [],
    // 软电话的初始状态
    state: "stIdle",
    // 呼叫对象
    callObject: {},
    // 软电话当前所在的队列
    _curQueues: [],
    // 当前呼叫的编号
    _callId: null,  
    // 软电话是否被注销
    _destroyed: false,   
    // 当前的通道号
    _curChannel: null,
    // 和当前分机通话的分机的通道号
    _otherChannel: null,
    // 当前呼入的通话句柄
    _inboundId: null,
    // 当前呼出的通话句柄
    _outboundId: null,   
    // 是否执行了结束咨询 
    _isStopConsulted: false,
    // 原始呼叫的CALL ID
    _originCallId: null,   
    // 状态字典，将AJAM的状态同软电话本身的状态数据对应
    _stateMap: null,    
    // 事件句柄
    _evtHandles: [], 
    // 事件请求令牌
    _token: false,
    // 最近的软电话状态
    _isIdle: true,
    // 是否正在请求事件
    _isWaitingEvent: false,
    
    
    //------------------------
    _isAnswering: false,
    _isInvestigatting: false,
    _isListenning: false,
    _isHanguping: false,
    _isSettingbusy: false,
    _isLooting: false,
    _dialoutData: null,
    _isRelogin: false,
    //------------------------

    ////////////////////////////////////////////////////////////
    // 软电话方法
    ////////////////////////////////////////////////////////////    
    setBusy: function(notChangeState) {
    	if(this._isSettingbusy)
    		return;
    	else this._isSettingbusy = true;
        // summary:
        //    软电话置忙      
        if (this.queues.length == 0) {
        	console.debug("队列为空");
        	this._changeState("stBusy");
        	this._isSettingbusy = false;
         return;
        }
         var self = this;
         var queue = this.queues.join(",");
         var params = {
             "Exten": self.userId, 
             Busy: true
         }
        self._sendAction('Busy', params, function(response, ioArgs) {
             console.dir(response);
             var res = response;
             if (res.Succeed && !notChangeState) {
                self._changeState("stBusy");    
                self._isIdle = false;
             } else {
            	 if(res.Expired){
            		 self._relogin();
            	 }
             }
        }, false);
         this._isSettingbusy = false;
        return SUCCESS;
    },
    
    setIdle: function(notChangeState) {
    	if(this._isSettingbusy)
    		return;
    	else this._isSettingbusy = true;
        // summary:
        //    软电话置闲       
        if (this.queues.length == 0) {
        	 this._changeState("stIdle");
			 this._isSettingbusy = false;
             return;
        }           
         var self = this;
         var queue = this.queues.join(",");
         var params = {
                 "Exten": self.userId,
                 Busy: false
         }

        self._sendAction('Busy', params, function(response, ioArgs) {
                     console.dir(response);
                     var res = response;
                     if (res.Succeed && !notChangeState) {
                    	 self._isIdle = true;
                    	 self._changeState("stIdle");    
                     } else {
                    	 if(res.Expired){
                    		 self._relogin();
                    	 }
                     }
        }, false);
        this._isSettingbusy = false;
        return SUCCESS;
    },
    
    answer: function() {
    	if(this._isAnswering)
    		return;
    	else this._isAnswering = true;
        var self = this;
    	// summary:
        //  软电话应答
        if (this.extenType == "sip") {
            try {
                sipPhone.AnswerCall();                  
                if (this.callObject.callType == "webcall") {
                    this._changeState("stDialing");
                }
            } catch (e) {
                console.debug("应答失败:" + e);   
                self._isAnswering = false;
                return ERR_GENERAL;
            }
       } else {
            console.error("当前接入方式不支持该操作");
            this._isAnswering = false;
            return ERR_NOT_SUPPORT_ACTION;
       }       
       this._isAnswering = false;
       return SUCCESS;
    },

 	dial: function(phoneNum, data) {
        console.debug("呼叫："+phoneNum);
        var self = this;
        var call_type = "inner";
        self.dialoutData = null;
      
        if (this.extenType == "sip") {
            try {
                console.debug("呼叫号码[%s]", phoneNum);
                sipPhone.CallOut(phoneNum, data);
                this._changeState("stDialing");                    
            } catch (e) {
                console.debug("呼叫失败:" + e);    
                return ERR_GENERAL;
            }
        } else {
            self._changeState("stDialing");
            this._sendAction("Originate", 
              {
                    Channel: "SIP/" + self.sipNo,
                    Context: self.accountId,
                    Exten: phoneNum,
                    UserID: self.userId,
                    Priority: '1',
                    Timeout: 30000,
                    Async: "true",
                    CallType: call_type
              },function(response, ioArgs) {
                    var json = response;
                    console.dir(response);
                    if (json.Succeed) {
                         console.debug("呼叫[%s]成功", phoneNum);
//                         dojo.publish("EvtDialing", [self.callObject]);                       
                    } else {
                         self._changeState("stBusy");
                         console.debug("呼叫失败");  
                         console.dir(json);
                         if(json.Expired){
                       		 self._relogin();
                       	 }
                         return ERR_GENERAL;
                    } 
            }); 
        }       
        return SUCCESS;
    },
    
    dialout: function(phoneNum, data) {
        console.debug("呼叫："+phoneNum);
        console.dir(data);
        var self = this;
        var call_type = "";
        if (phoneNum.length >4) {
//        if(phoneNum.length >= 4 && !(/^2\d{7}$/.test(phoneNum))){
            call_type = "dialout";
        } else {
        	call_type = "inner";
        }
        if(data)
        	self.dialoutData = data;
        else self.dialoutData = null;
        if(phoneNum.length > 4){
            phoneNum = '9' + phoneNum;
        } 
		isCO=0;
        if (this.extenType == "sip") {
            try {
                console.debug("外呼号码[%s]", phoneNum);
                sipPhone.CallOut(phoneNum, data);
                this._changeState("stDialing");                    
            } catch (e) {
                console.debug("外呼失败:" + e);    
                return ERR_GENERAL;
            }
        } else {
            self._changeState("stDialing");
            this._sendAction("Originate", 
              {
                    Channel: "SIP/" + self.sipNo,
                    Context: userInfo.accountId,
                    Exten: phoneNum,
                    Priority: '1',
                    UserID: self.userId,
                    Timeout: 30000,
                    Async: "true",
                    CallType: call_type
              },function(response, ioArgs) {
                    var json = response;
                    console.dir(response);
                    if (json.Succeed) {
                         console.debug("外呼[%s]成功", phoneNum);
//                         dojo.publish("EvtDialing", [self.callObject]);                       
                    } else {
                         self._changeState("stBusy");
                         console.debug("外呼失败");  
                         console.dir(json);
                         if(json.Expired){
                       		 self._relogin();
                       	 }
                         return ERR_GENERAL;
                    } 
            }); 
        }       
        return SUCCESS;
    },
    
    threeWayCall: function(phoneNum) {
        console.debug("开始三方通话："+phoneNum);
        var self = this;
        var preState = self.state;
        this._changeState("stThreeWayTalking");
        this._sendAction("ThreeWayCall", 
          {
                FromExten: self.sipNo,
                Exten: phoneNum,
                UserID: self.userId,
                Timeout: 30000
          },function(response, ioArgs) {
                var json = response;
                console.dir(json);
                if (json.Succeed) {
                     console.debug("三方通话[%s]成功", phoneNum);
                } else {
                     console.debug("三方通话失败");
                     if(self.state == "stThreeWayTalking")
                    	 self._changeState(preState);
                     if(json.Expired){
                   		 self._relogin();
                   	 }
                     alert("三方通话失败");
                     return ERR_GENERAL;
                } 
        });      
        return SUCCESS;
    },

    playDTMF: function(num) {
        console.debug("play DTMF[%s]", num);
        sipPhone.PlayDTMF(num);
    },
    
    pick: function (userId) {
    	console.debug("签入坐席"+userId);
    	var self = this;
    	var peer = self.monitorPeers[userId];
    	if(peer == null || peer.Local == null || peer.Local == ""){
    		alert("不能对没有直线号码的坐席做签入操作");
    		return;
    	}
    	this._sendAction("SignIn", {
	        User: userId
		 },function(response, ioArgs) {
	        var json = response;
	        console.dir(response);
	        if (json.Succeed) {
	            console.debug("签入[%s]成功", userId);
				alert("座席签入成功");
	        } else {
	        	console.debug("签入[%s]失败"+json.Message, userId);
	        	 if(json.Expired){
               		 self._relogin();
               	 }
	        }
		});
    },
    
    kick: function(exten){
    	console.debug("签出坐席"+exten);
    	var self = this;
		this._sendAction("Kick", {
		        Exten: exten
		 },function(response, ioArgs) {
		        var json = response;
		        console.dir(response);
		        if (json.Succeed) {
		            console.debug("签出[%s]成功", exten);
		            var peer = self.monitorPeers[exten];
		    		if(peer){
			            peer.C5Status = "";
	        			peer.callNo = "";
	        			peer.callStatus = "Idle";
	        			var date = new Date();
	 					var identity = date.valueOf();
	        			peer.timestamp = identity/1000;
	        			linked = false;
	    				peer.channel = "";
	    				peer.linkedChannel = "";
	    				console.debug("kickoff");
	    				dojo.publish("EvtMonitorPeer",[peer]);
	    				self._updateQueueInfo();
		    		}
		        } else {
		        	console.debug("签出[%s]失败"+response.Message, exten);
		        	 if(json.Expired){
                   		 self._relogin();
                   	 }
		        }
		});
    },
    
    listen: function(channel) {
        // summary:     
        //  软电话监听
        var self = this;
        if (this.state != "stBusy") {
        	alert("请先将电话置忙");
            return ERR_NOT_BUSY;
        }
        this._sendAction("Originate", {
                Channel: "SIP/" + self.sipNo,
                Application: "ChanSpy",
                Data: channel+"|bq",
                UserID: self.userId,
                Callerid: self.sipNo,
                Async: "true"
          },function(response, ioArgs) {
                var json = response;
                console.dir(response);
                if (json.Succeed) {
                    console.debug("监听[%s]成功", channel);
                    self._otherChannel = channel;
                } else {
                	console.debug("监听[%s]失败"+response.Message, channel);
                	 if(json.Expired){
                   		 self._relogin();
                   	 }
                }
        });  
        return SUCCESS;
    },
    
    cancelListen: function() {
    	var self = this; 
        this._sendAction('Hangup', {
            Channel: self._curChannel
        }, function(response, ioArgs) {
        	console.dir(response);
            var json = response;
            if (json.Succeed) {
                console.debug("结束监听成功");
            } else {
                console.debug("结束监听失败");
                self.callObject = {}; 
                self._changeOnHangup();
                if(json.Expired){
              		self._relogin();
              	}
                return SUCCESS;
            }
        });         
        return SUCCESS;
    },

    hold: function() {
    	//保持通话
    	var self = this;
        this._sendAction("Hold", {
                Channel: self._otherChannel,
                UserID: self.userId,
                Async: "true"
          },function(response, ioArgs) {
                var json = response;
                console.dir(response);
                if (json.Succeed) {
                    console.debug("保持成功");
                    self._stateBeforeHold = self.state;
                    self._changeState("stHold");  
                } else {
                	console.debug("保持[%s]失败"+response.Message, self._curChannel);
                	if(json.Expired){
                		self._relogin();
                   	}
                }
        });  
        return SUCCESS;
    	
//        if (this.extenType == "sip") {
//            try {
//                sipPhone.HoldCall();
//                this._stateBeforeHold = this.state;
//                this._changeState("stHold");                 
//            } catch (e) {
//                console.debug("保持失败:" + e);     
//                return ERR_GENERAL;
//            }
//        } else {
//            console.error("当前接入方式不支持该操作");
//            return ERR_NOT_SUPPORT_ACTION;
//        }
//        return SUCCESS;
    },
    
    unhold: function() {
        // 取消保持
    	//保持通话
    	var self = this;
        this._sendAction("Unhold", {
                Channel: self._otherChannel,
                UserID: self.userId,
                Async: "true"
          },function(response, ioArgs) {
                var json = response;
                console.dir(response);
                if (json.Succeed) {
                    console.debug("取消保持成功");
                    self._changeState(self._stateBeforeHold);  
                } else {
                	console.debug("取消保持[%s]失败"+response.Message, self._curChannel);
                	 if(json.Expired){
                   		 self._relogin();
                   	 }
                }
        });  
        return SUCCESS;
//        if (this.extenType == "sip") {
//            try {
//                sipPhone.UnHoldCall();
//                this._changeState(this._stateBeforeHold);              
//            } catch (e) {
//                console.debug("保持失败:" + e);     
//                return ERR_GENERAL;
//            }
//        } else {
//            console.error("当前接入方式不支持该操作");
//            return ERR_NOT_SUPPORT_ACTION;
//        }       
//        return SUCCESS;
    },
    
    hangup: function() {
        var self = this; 
        this._sendAction('Hangup', {
            Channel: self._curChannel
        }, function(response, ioArgs) {
            var json = response;
            console.dir(json);
            if (json.Succeed) {
                console.debug("挂机动作成功");
                self._changeOnHangup();
            } else {
                console.debug("挂机动作失败");
                self.callObject = {}; 
                self._changeOnHangup();
                if(json.Expired){
              		self._relogin();
              	}
                return ERR_NO_SUCH_CHANNEL;
            }
        });         
        return SUCCESS;
    },
    
    hangupChannel: function(channel){
    	var self = this;
    	console.debug("强拆"+channel);
        this._sendAction('Hangup', {
            Channel: channel
        }, function(response, ioArgs) {
        	console.dir(response);
            var json = response;
            if (json.Succeed) {
                console.debug("强拆动作成功");
            } else {
                console.debug("强拆动作失败");
                if(json.Expired){
              		 self._relogin();
              	 }
                return ERR_NO_SUCH_CHANNEL;
            }
        });         
        return SUCCESS;
    },
    
    lootCall: function(channel){
        var self = this;
        if (this.state != "stBusy") {
        	alert("请先将电话置忙");
            return ERR_NOT_BUSY;
        }
        var context = this.accountId;
        console.debug("抢接"+channel);
    	self._sendAction('Transfer', {
            Exten: self.sipNo,
            Channel: channel,
            UserID: self.userId,
            CallType: "Loot",
            Context: context
        }, function(response, ioArgs) {
        	console.dir(response);
            var json = response;
            if (json.Succeed) {
                console.debug("抢接成功");
                self._isLooting = true;
            } else {
                console.debug("抢接失败");
                if(json.Expired){
              		 self._relogin();
              	 }
                return ERR_NO_SUCH_CHANNEL;
            }
        });         
        return SUCCESS;
    },

    transfer: function(destExten, mode, values) {
        // summary:
        //    软电话转接
    	var self = this;  
        console.info("电话转接[%s:%s:%s]", destExten, mode);
        console.dir(self.callObject);
        console.dir(self.callObject.data);
        var fromCid = self.callObject.originCallNo;
        if (mode == "external") {
            destExten = '9' + destExten;            
            fromCid = this.sipNo + '@' + this.didNum;
        } 

        var synData = dojo.objectToQuery(values);
        console.debug(synData);
        var context = "";
        context = this.accountId;
        var workSheetId;
        var customerId
        if(self.callObject && self.callObject.data){
        	workSheetId = self.callObject.data.workSheetId;
            customerId = self.callObject.data.customerId;
        }
        
    	self._sendAction('Transfer', {
    	WorkSheetID: workSheetId?workSheetId:"",
    	CustomerID: customerId?customerId:"",
        Exten: destExten,
        UserID: self.userId,
        Channel: self._otherChannel,
        ExtraChannel: self._curChannel,
        Context: context
    	}, function(response, ioArgs) {
    		console.dir(response);
            var json = response;
            if (json.Succeed) {
                console.debug("转接成功");
            } else{
                console.debug("转接失败-"+json.Message);
                var message = "";
                if(json.Message == "busy")
                	message = "坐席忙";
                else if(json.Message == "unregistered")
                	message = "坐席电话未就绪";
                else if(json.Message == "chatting")
                	message = "坐席正在通话";
                alert("转接失败："+message);
                if(json.Expired){
              		self._relogin();
              	}
                return ERR_NOT_BUSY;
            }
        });
        return SUCCESS;
    },
    
    consult: function(destExten, values) {
      // summary:
      //    软电话咨询  
//    	destExten = "29001507";
        console.info("咨询坐席[%s]", destExten);
        var self = this;
        var connectType = "consult[" + self.sipNo  + "]";
//        var context = userInfo.accountId + "-consult";

        var synData = dojo.objectToQuery(values);
        console.debug("咨询同步数据[%s]", synData);
       
        self._sendAction('Consult', {
            Peer: "SIP/"+destExten,
            ParkChannel: self._otherChannel,
            FromChannel: self._curChannel
          },function(response, ioArgs) {
        	  console.dir(response);
              var json = response;
              if (json.Succeed) {
                  console.debug("咨询动作成功");
                  self._changeState("stConsulting");
              } else {
                  console.debug("咨询动作失败");
                  return ERR_NO_SUCH_CHANNEL;
              }
          });  
//        this._setVar(this._curChannel, "__CUSTOMER_ID", synData, function(response, ioArgs) {
//		self._setVar(self._curChannel, "__CONNECT_TYPE", connectType, function(response, ioArgs) {
//		    self._setVar(self._curChannel, "TRANSFER_CONTEXT", context, function(response, ioArgs) {
//			  self._setVar(self._curChannel, "ATXFER", destExten, function(response, ioArgs) {
//				    console.debug("咨询操作成功返回");
//				    self._changeState("stConsulting");
//			  });
//		      });
//		  });
        return SUCCESS;
    },
 
    consultToTransfer: function() {
        this.hangup();
        this._isStopConsulted = true;
    },

    toIVR: function() {
      // summary:
      //    软电话咨询  
        console.info("转IVR验证");
        var self = this;
        var context = userInfo.accountId + "-validate";

        self._sendAction('Validate', {
            Exten: 's',
            Channel: self._otherChannel,
            Context: context
        }, function(response, ioArgs) {
        	console.dir(response);
            var json = response;
            if (json.Succeed) {
                console.debug("转IVR成功");
            } else {
                console.debug("转IVR失败");
                if(json.Expired){
              		 self._relogin();
              	 }
                return ERR_NO_SUCH_CHANNEL;
            }
        });         
        this._isInvestigatting = false;
        return SUCCESS;
    },

    investigate: function() {
    	if(this._isInvestigatting)
    		return;
    	else this._isInvestigatting = true;
        console.info("转满意度调查");
        console.dir(this.callObject);
        console.dir(this.callObject.data);
        var self = this;
        var userId = userInfo.userId;
        var accountId = userInfo.accountId;
        var context = userInfo.accountId + "-investigate";
        self._sendAction('Transfer', {
            Exten: 's',
            Channel: self._otherChannel,
            CallType: "investigate",
            UserID: userId,
            Context: context
        }, function(response, ioArgs) {
        	console.dir(response);
            var json = response;
            if (json.Succeed) {
                console.debug("转满意度调查成功");
            } else {
                console.debug("转满意度调查失败");
                self._isInvestigatting = false;
                if(json.Expired){
              		 self._relogin();
              	 }
                return ERR_NO_SUCH_CHANNEL;
            }
        });         
        this._isInvestigatting = false;
        return SUCCESS;
    },
    
    stopConsult: function() {
        // summary:
        //    软电话结束咨询  
        console.info("结束咨询-接回[%s]", this._consultChannel);
        var self = this; 
        this._sendAction('Hangup', {
            channel: self._consultChannel
        }, function(response, ioArgs) {
        	console.dir(response);
            self._isStopConsulted = true;
            var json = response;
          if (self._customerHasHangup) {
        	  self._changeOnHangup();
        	  self._customerHasHangup = false;
          } else if (json.Succeed) {
        	  console.debug("挂机动作成功");
        	  self._changeState("stTalking");
          } else {
        	  console.debug("挂机动作失败");
        	  self.callObject = {}; 
        	  self._changeState("stTalking");
        	  return ERR_NO_SUCH_CHANNEL;
          }
        });         
        return SUCCESS;
    },

    changePhone:  function(extenType, extenNum) {
    	console.debug("变更登录方式["+extenType+"-"+extenNum+"]");
        var self = this;
		if (extenType == "Local" || extenType == "gateway") {
			if(self.extenType == "sip")
				sipPhone.UnInitNoFire(); 
			self.extenType = extenType;
			self.sipNo = extenNum;
		} else 
			return;
		self._sendAction('SetExtenType', {
            User: self.userId,
            ExtenType: extenType,
            LoginExten: extenNum
        }, function(response, ioArgs) {
        	console.dir(response);
            var json = response;
            if (json.Succeed) {
                console.debug("变更登录方式成功");
            } else {
                console.debug("变更登录方式失败");
                if(json.Expired){
              		 self._relogin();
              	 }
            }
        });
    },
    
    setWorkSheetID: function(workSheetId){
    	console.debug("设置workSheetid"+workSheetId);
    	var self = this;
    	if(!self._otherChannel)
    		return;
    	var value = "workSheetId="+workSheetId;
    	if(self.callObject.data.customerId)
    		value = value+"&CustomerID="+self.callObject.data.customerId;
    	self._sendAction('SetVar', {
            Channel: self._otherChannel,
            Value: value
        }, function(response, ioArgs) {
        	console.dir(response);
            var json = response;
            if (json.Succeed) {
                console.debug("设置worksheetid成功");
            } else {
                console.debug("设置worksheetid失败");
                if(json.Expired){
              		 self._relogin();
              	}
            }
        });
    },
    
    _changeState: function(state) {
        // summary:
        //    改变当前软电话的状态  
    	console.debug("改变状态[%s]", state);
        var oldState = this.state;      
        if (this._stateMap[state]) {
            this.state = this._stateMap[state];
        } else {
            this.state = state;    
        }
        console.debug("改变软电话的当前状态:[%s]==>[%s]", oldState, this.state);  
        dojo.publish("EvtStateChange", [this.state]);
    },
    
    _changeOnHangup: function() {
    	var peer = this.monitorPeers[this.sipNo];
    	if(peer){
    		var isRegistered = false;
    		if(peer.PeerStatus == "Registered")
    			isRegistered = true;
    		if(!isRegistered && (peer.ExtenType == "gateway" || peer.ExtenType == "sip")
    				&& (this.state == "stIdle" || this.state == "stBusy")){
    			this._changeState("stInvalid");
    		} else if (this._isIdle) {
    			this.autoBusy ? this.setBusy() : this._changeState("stIdle");
    		} else {
    			this.autoBusy ? this._changeState("stBusy") : this.setIdle();
    		} 
    	} else if (this._isIdle) {
			 this.autoBusy ? this.setBusy() : this._changeState("stIdle");
		} else {
			 this.autoBusy ? this._changeState("stBusy") : this.setIdle();
		}
    }, 

    _init: function() {
    	this._waitEvent();
       // this.autoBusy ? this.setBusy() : this.setIdle();     
     },
    
    _setVar: function(channel, value, onSet) { 
        // summary:
        //     获取指定通道的变量名和值
        console.info("设置通道[%s]值为[%s]", channel, value);
        var self = this;
        this._sendAction("SetVar", 
          {
            Channel: channel,
            Value: value                          
          }, 
         function(response, ioArgs) {
        	 console.dir(response);
             if (typeof onSet == "function") {
                onSet(response, ioArgs);   
             }
                                                                                
          });
    },  

    _loadConfig: function(config) {   
        for (var i in config) {
            this[i] = config[i];
        }   
        this.queues = config.queues;
        if (this.extenType != "Local") {
            this.extension = this.sipNo;
        }
        this._stateMap = new Array();
        this._stateMap["16"] = "stHold";
        this._stateMap["8"] = "stBelling";
        this._stateMap["4"] = "stLogout";
        this._stateMap["2"] = "stTalking";
        this._stateMap["0"] = "stIdle";
        this._stateMap["Up"] = "stTalking";
        this._stateMap["Ringing"]  = "stBelling";
    },

    _loadSipPhone: function() {
        sipPhone.StrUser = this.sipNo;
        sipPhone.StrPassword = this.sipPassword;
        sipPhone.StrLine = this.sipNo;
        sipPhone.StrServer = this.pbx_ex_ip;
//		sipPhone.strSipProxy =this.encryptIp;
     //   sipPhone.StrAudioCodec = this.audioCodec;  
//	  	sipPhone.setEncryptKey("1");
//		sipPhone.EncryptSip();
        sipPhone.InitSipPhone();
		
    },


    _exit: function(loginName, removeQueue) {
    	console.debug("注销ASS"+removeQueue);
        var self = this;
        if (!loginName) {
            loginName = self.loginName;
        }
        var remove = removeQueue?"true":"false";
        var url = this.proxy_url;
        url += "Logoff?SessionID="+self.uniqueId+"&QueueRemove="+remove;
		dojo.io.script.get({
            url: url,
            callbackParamName: "callbackName",
			timeout: 15000,
            preventCache: true, 
            load: onload,
            error: function(response, ioArgs) {
                if (this.isTimeout) {
                    console.error("注销请求超时,请检查本地网络[" + ioArgs.url + "]");
                }
                console.debug("注销返回错误");
                console.dir(response);
            }
		});			

    },
    
    
    ////////////////////////////////////////////////////////////
    // OCX控件事件处理
    ////////////////////////////////////////////////////////////
    
    onRing: function(callId, remoteId) {
          this.oldInboundId = this._inboundId;
          console.debug("控件onRing返回[callId:%s,remoteId:%s]", callId, remoteId);
          this._inboundId = callId;      
    },

    onRemoteRing: function(callId, remoteId) {
          console.debug("控件onRemoteRing返回[callId:%s,remoteId:%s]", callId, remoteId);
          this._outboundId = callId;           
    },

    onCalloutFail: function(callId, cause) {
          console.debug("控件CalloutFail返回[callId:%s,cause:%s,inboundid:%s]", callId, cause, this._inboundId);
          if (this.state == "stConsulting") {
              if (this._inboundId) {
                  sipPhone.ChangeCurrentCall(this._inboundId);       
                  this._changeState("stTalking");
              }
          }
    },
    
    onRegister: function(info) {
        console.debug("SIP注册返回[%s]", info);
        // 处理座席错误
    //    if (this.state != "stInvalid" && (!info || info == "" || info == "未知错误" || info == "注册失败" || info == "未知供应")) {            
    //        this._changeState("stInvalid");
    //    } else {
    //        if (this.state == "stInvalid") {
    //             this.autoBusy ? this.setBusy() : this.setIdle();    
    //        }    
    //    }   
    },

    ////////////////////////////////////////////////////////////
    // 消息事件处理
    ////////////////////////////////////////////////////////////
    register: function(evtType, obj, method) {
        // summary:
        //    注册软电话的事件        
        return dojo.subscribe(evtType, obj, method);         
    },
    
    unregister: function(handle) {
        // summary:
        //    注销软电话的事件        
        dojo.unsubscribe(handle);         
    },
    
    _eventHandler: function(evtJsons) {
        try{
            //   软电话事件返回处理
            var self = this; 
            dojo.forEach(evtJsons, function(item) {
                var evtHandler = self._sipEventHandler;
                evtHandler.apply(self, [item]); 
            });
        } catch (e){
        	console.dir(e);
        }
    },  
   
    _sipEventHandler: function(evtJson) {
        // summary
        //    sip方式的事件返回处理
        var self = this;
        console.debug("处理事件");
        console.dir(evtJson);
        if (evtJson.Event == "ChannelStatus") {
        	//处理当前坐席的通话消息
        	if(evtJson.Exten == self.sipNo){
        		if(evtJson.ChannelStatus == "Down"){
        			//self._curChannel = evtJson.Channel;
        		} else if(evtJson.ChannelStatus == "Up") {
        		
        		} else if(evtJson.ChannelStatus == "Ring"){
        			self._curChannel = evtJson.Channel;
        			if(evtJson.ChannelType == "listen"){
        				console.debug("监听振铃");
        				if (this.extenType == "sip") {
        		            try {
        		                sipPhone.AnswerCall();
        		            } catch (e) {
        		                console.debug("应答失败:" + e);
        		            }
        		        }
        			} else if(evtJson.ChannelType == "webcall"){
        				console.debug("网络来电");
        				if (this.extenType == "sip") {
        		            try {
        		                sipPhone.AnswerCall();
        		            } catch (e) {
        		                console.debug("应答失败:" + e);
        		            }
        		        }
        				var callsheetid = "";
        				if(evtJson.Data.CallSheetID)
           					callsheetid = evtJson.Data.CallSheetID;
        		        self.callObject = {
        		        	callSheetId: callsheetid,
    		                originCallNo: evtJson.FromCid,
    		                originCalledNo: evtJson.FromDid,
    		                callType: "webcall",
    		                offeringTime: icallcenter.common.dateParse(new Date(evtJson.Timestamp * 1000)),
    		                data: evtJson.Data
        		        };
        		        
        		        if(self.dialoutData){
        		        	self.callObject.data = self.dialoutData;
        		        	self.dialoutData = null;
        		        }
        		        dojo.publish("EvtDialing", [this.callObject]);
        		        this._changeState("stDialing")
        			} else if(evtJson.ChannelType == "dialout") {
        				if (this.extenType == "sip") {
        		            try {
        		                sipPhone.AnswerCall();
        		            } catch (e) {
        		                console.debug("应答失败:" + e);
        		            }
        		        }
        				var callsheetid = "";
        				if(evtJson.Data.CallSheetID)
           					callsheetid = evtJson.Data.CallSheetID;
        		        self.callObject = {
        		        	callSheetId: callsheetid,
    		                originCallNo: evtJson.FromCid,
    		                originCalledNo: evtJson.FromDid,
    		                callType: "dialout",
    		                offeringTime: icallcenter.common.dateParse(new Date(evtJson.Timestamp * 1000)),
    		                data: evtJson.Data
        		        };
        		        if(self.dialoutData){
        		        	self.callObject.data = self.dialoutData;
        		        	self.dialoutData = null;
        		        }
        		        dojo.publish("EvtDialing", [this.callObject]);
        		        this._changeState("stDialing")
        			}else {
        				this._changeState("stDialing");
        			}
        		} else if(evtJson.ChannelStatus == "Ringing"){
        			self._curChannel = evtJson.Channel;
        			self._otherChannel = evtJson.LinkedChannel.Channel;
    				//转接
        			if(evtJson.LinkedChannel.ChannelType == "dialTransfer"
        				||evtJson.LinkedChannel.ChannelType == "transfer"){
        				if(evtJson.Link){
	           				 var linkedChannel = evtJson.LinkedChannel;
	           				 var callsheetid = "";
	           				 if(linkedChannel.Data && linkedChannel.Data.CallSheetID)
	           					 callsheetid = linkedChannel.Data.CallSheetID;
	        				 self._callId = linkedChannel.Uniqueid;
	        				 self.callObject = {
	     	                		callSheetId: callsheetid,
	     	                        originId: linkedChannel.Uniqueid,
	     	                        originCallNo: linkedChannel.FromCid,
	     	                        originCalledNo: linkedChannel.FromDid,
	     	                        callType: linkedChannel.ChannelType,
	     	                        location: linkedChannel.Location,
	     	                        callId: linkedChannel.Uniqueid,
	     	                        skillgroupNo: linkedChannel.Queue,
	     	                        offeringTime: icallcenter.common.dateParse(new Date(evtJson.Timestamp * 1000)),
	     	                        data: {}
	     	                    };
    	     	                if (linkedChannel.Data) {
    	     	                    console.debug("当前振铃的同步数据");
    	     	                    console.dir(linkedChannel.Data);
    	     	                    self.callObject.data = linkedChannel.Data;
    	     	                    self.callObject.data.callSheetId = callsheetid;
    	     	                }
	     	                console.dir(self.callObject);
	     	                dojo.publish("EvtRing", [self.callObject]);
        				}
        			}
        			else if(evtJson.LinkedChannel.ChannelType == "normal"
        				|| evtJson.LinkedChannel.ChannelType == "webcall"){
            	        if (evtJson.Link) {
            	            // 如果是同一个来电在队列中轮循的第二次振铃，则不做处理（同一个来电的OriginCallID是相同的）
            	            var linkedChannel = evtJson.LinkedChannel;
            	            console.dir(linkedChannel);
            	            if(self._callId != linkedChannel.Uniqueid){
                 	            self._callId = linkedChannel.Uniqueid;
   	           				 	var callsheetid = "";
   	           				 	if(linkedChannel.Data && linkedChannel.Data.CallSheetID)
   	           				 		callsheetid = linkedChannel.Data.CallSheetID;
            	                self.callObject = {
            	                		callSheetId: callsheetid,
            	                        originId: linkedChannel.Uniqueid,
            	                        originCallNo: linkedChannel.FromCid,
            	                        originCalledNo: linkedChannel.FromDid,
            	                        callType: linkedChannel.ChannelType,
            	                        callId: linkedChannel.Uniqueid,
            	                        queue: linkedChannel.Queue,
            	                        location: linkedChannel.Location,
            	                        skillgroupNo: linkedChannel.Queue,
            	                        offeringTime: icallcenter.common.dateParse(new Date(evtJson.Timestamp * 1000)),
            	                        data: {}
            	                    };
            	                if (linkedChannel.Data) {
            	                	console.debug("当前振铃的同步数据");
    	     	                    console.dir(linkedChannel.Data);
    	     	                    self.callObject.data = linkedChannel.Data;
    	     	                    self.callObject.data.callSheetId = callsheetid;
//    	     	                    if(self.callObject.data.CardNo && self.callObject.data.CardPassword){
//    	     	                    	alert("验证结果\n卡号："+self.callObject.data.CardNo+"\n密码："+self.callObject.data.CardPassword);
//    	     	                    }
            	                }
            	                console.dir(self.callObject);
            	                dojo.publish("EvtRing", [self.callObject]);
            	                console.debug("after ring");
            	                console.dir(self.callObject.data);
            	            }
            	        }
        			}
        			else if(evtJson.LinkedChannel.ChannelType == "validate") {
        				if(evtJson.Link){
	           				 var linkedChannel = evtJson.LinkedChannel;
	           				 var callsheetid = "";
	           				 if(linkedChannel.Data && linkedChannel.Data.CallSheetID)
	           					 callsheetid = linkedChannel.Data.CallSheetID;
	        				 self._callId = linkedChannel.Uniqueid;
	        				 self.callObject = {
	     	                		callSheetId: callsheetid,
	     	                        originId: linkedChannel.Uniqueid,
	     	                        originCallNo: linkedChannel.FromCid,
	     	                        originCalledNo: linkedChannel.FromDid,
	     	                        callType: linkedChannel.ChannelType,
	     	                        queue: linkedChannel.Queue,
	     	                        location: linkedChannel.Location,
	     	                        callId: linkedChannel.Uniqueid,
	     	                        skillgroupNo: linkedChannel.Queue,
	     	                        offeringTime: icallcenter.common.dateParse(new Date(evtJson.Timestamp * 1000)),
	     	                        data: {}
	     	                    };
   	     	                if (linkedChannel.Data) {
   	     	                    console.debug("当前验证振铃的同步数据");
   	     	                    //包含data.CardNo, data.CardPassword
   	     	                    console.dir(linkedChannel.Data);
   	     	                    self.callObject.data = linkedChannel.Data;
   	     	                    self.callObject.data.callSheetId = callsheetid;
//   	     	                alert("验证结果\n卡号："+self.callObject.data.CardNo+"\n密码："+self.callObject.data.CardPassword);
   	     	                }
	     	                console.dir(self.callObject);
	     	                dojo.publish("EvtRing", [self.callObject]);
        				}
        			}
        			if(self._isLooting){
        				self._isLooting = false;
        				if (self.extenType == "sip") {
        		            try {
        		                sipPhone.AnswerCall();
        		            } catch (e) {
        		                console.debug("应答失败:" + e);
        		            }
        		        }
        			}
    				self._changeState("stBelling");
                    self._curChannel = evtJson.Channel;
        		} else if (evtJson.ChannelStatus == "Up"){
        			self._curChannel = evtJson.Channel;
//        			//监听时没有link，把up当成link处理
        			 if(evtJson.ChannelType == "listen"){
        				 console.debug("监听接通");
        				 self.callObject.callType = evtJson.ChannelType;
                     	 self._changeState("stListening");
                     	 dojo.publish("EvtConnected", [self.callObject]);
                     }
        		} else if(evtJson.ChannelStatus == "Link"){
        			self._curChannel = evtJson.Channel;
        			console.debug("Link被叫通道号[%s], 当前通道号[%s]", self._otherChannel, self._curChannel);
                    var linkedChannel = evtJson.LinkedChannel;
                    self._otherChannel = linkedChannel.Channel;
                    self.callObject.callType = evtJson.ChannelType;
                    if(linkedChannel.ChannelType == "dialout"
                    	|| linkedChannel.ChannelType == "dialTransfer"){
                    	self._changeState("stDialTalking");
                    } 
                    else if(linkedChannel.ChannelType == "listen"){
                    	self._changeState("stListening");
                    } 
                    else if(linkedChannel.ChannelType == "normal"
                    		|| linkedChannel.ChannelType == "transfer"
                    		|| linkedChannel.ChannelType == "webcall"){
                    	self._changeState("stTalking");
                    } else {
                    	self._changeState("stInnerTalking");
                    }
                    
                    if (!self.callObject.beginTime) {
                        self.callObject.beginTime = icallcenter.common.dateParse(new Date(evtJson.Timestamp * 1000));
                    }
      				var callsheetid = "";
          			if(linkedChannel.Data && linkedChannel.Data.CallSheetID)
          				callsheetid = linkedChannel.Data.CallSheetID;
                    self.callObject.originCallNo = linkedChannel.FromCid;
                    self.callObject.originCalledNo = linkedChannel.FromDid;
                    self.callObject.callSheetId = callsheetid;
                    self.callObject.originId = linkedChannel.Uniqueid;
                    self.callObject.queue = linkedChannel.Queue;
                    self.callObject.location = linkedChannel.Location;
                    self.callObject.callId = linkedChannel.Uniqueid;
                    self.callObject.skillgroupNo = linkedChannel.Queue;
                    if(evtJson.RingTime)
                    	self.callObject.offeringTime = icallcenter.common.dateParse(new Date(evtJson.RingTime * 1000));
                    if (linkedChannel.Data) {
	                	console.dir(linkedChannel.Data);
 	                    self.callObject.data = linkedChannel.Data;
 	                    self.callObject.data.callSheetId = callsheetid;
	                }
                    dojo.publish("EvtConnected", [self.callObject]);
        		} else if(evtJson.ChannelStatus == "Unlink"){
        			self._curChannel = evtJson.Channel;
        			self._callId = "";
        		} else if(evtJson.ChannelStatus == "Hangup"){
        			self._curChannel = evtJson.Channel;
        			self._callId = "";
        			 console.debug("挂机事件到达，对应的通道号: [%s], 当前状态: [%s]",
                     		evtJson.Channel, evtJson.C5Status);
        			 if(self._curChannel == evtJson.Channel){
        				 if (evtJson.ChannelType == "normal" || evtJson.ChannelType == "dialout"
                        	 || evtJson.ChannelType == "dialTransfer"
                        	 || evtJson.ChannelType == "transfer"
                        	 || evtJson.ChannelType == "webcall") {
                             // 只有处于通话或者外拨时的挂机，才需要做相应的服务处理
                             console.debug("通话中或者拨打中挂机[%s]", self.state);
                             self.callObject.endTime = icallcenter.common.dateParse(new Date(evtJson.Timestamp * 1000));
                             dojo.publish("EvtHangup", [self.callObject]);
                             self._isStopConsulted = false;
                             self._changeOnHangup();
                         } else if (evtJson.ChannelType == "listen") {
                        	 console.debug("监听通话结束");
                        	 self._otherChannel = "";
                             dojo.publish("EvtEndListen", []);
                             self._changeOnHangup();
                         } else {
                        	console.debug("开始挂机");
                         	self._isStopConsulted = false;
                         	self._changeOnHangup();
                         }
        			 } else if(self.state == "stDialing"){
        				 self._changeOnHangup();
        			 }
        		}
        	}
        	//处理监控坐席通话消息
    		
    		var peer = self._getUserViaSipNum(evtJson.Exten);
    		if(!peer){
    			return;
    		}
    		
    		if(evtJson.ChannelStatus == "Down"){
    			peer.callStatus = "Down";
    			peer.channel = evtJson.Channel;
    			self._updateQueueInfo();
    		} else if(evtJson.ChannelStatus == "Ring"){
    			//呼叫
    			peer.callStatus = "Ring";
    			peer.called = false;
    			peer.C5Status = evtJson.C5Status;
    			peer.timestamp = evtJson.Timestamp;
    			peer.channel = evtJson.Channel;
    			if(evtJson.C5Status == "OutboundCall"
    				|| evtJson.C5Status == "InboundCall"
    				|| evtJson.C5Status == "listen"){
    				peer.callNo = evtJson.Data.ListenExten;
    			} else if(evtJson.FromDid) 
    				peer.callNo = evtJson.FromDid;
    			dojo.publish("EvtMonitorPeer",[peer]);
    		} else if(evtJson.ChannelStatus == "Ringing"){
    			//被呼振铃
    			peer.called = true;
    			peer.callStatus = "Ringing";
    			peer.C5Status = evtJson.C5Status;
    			peer.channel = evtJson.Channel;
    			peer.linkedChannel = evtJson.LinkedChannel.Channel;
    			if(evtJson.ChannelType == "dialTransfer"){
    				peer.callNo = evtJson.FromDid;
    			} else {
    				peer.callNo = evtJson.FromCid;
    			}
    			peer.timestamp = evtJson.Timestamp;
    			dojo.publish("EvtMonitorPeer",[peer]);
    		} else if(evtJson.ChannelStatus == "Up"){
    			//监听时没有link，用up作为link
    			if(evtJson.ChannelType == "listen"){
    				peer.callNo = evtJson.Data.ListenExten;
    				peer.timestamp = evtJson.Timestamp;
    				peer.C5Status = evtJson.C5Status;
    				peer.callStatus = evtJson.ChannelType;
    				peer.linked = true;
    				peer.channel = evtJson.Channel;
    				dojo.publish("EvtMonitorPeer",[peer]);
    			}
    		} else if(evtJson.ChannelStatus == "Link"){
    			
				peer.timestamp = evtJson.Timestamp;
				peer.C5Status = evtJson.C5Status;
				linked = true;
				peer.channel = evtJson.Channel;
    			peer.linkedChannel = evtJson.LinkedChannel.Channel;
    			peer.callStatus = evtJson.ChannelType;
    			peer.callNo = evtJson.LinkedChannel.CallerIDNum;
				dojo.publish("EvtMonitorPeer",[peer]);
    		} else if(evtJson.ChannelStatus == "Unlink"){
    			
    		} else if(evtJson.ChannelStatus == "Hangup"){
    			//如果已有通话时再产生的channel，不处理
    			if(peer.channel == evtJson.Channel){
        			//如果是监听中的通话挂断，需要结束监听者的通话
        			if(self._otherChannel == evtJson.Channel
        					&& self.state == "stListening")
        				self.hangup();
        			
        			peer.C5Status = evtJson.C5Status;
        			peer.callNo = "";
        			peer.callStatus = "Idle";
        			peer.timestamp = evtJson.Timestamp;
        			linked = false;
    				peer.channel = "";
    				peer.linkedChannel = "";
    				dojo.publish("EvtMonitorPeer",[peer]);
    			}
    			self._updateQueueInfo();
    		}
        } 
        //队列
        else if(evtJson.Event == "QueueParams"){
        	//removed or update
        	//如果找到这个queue，更新这个对象里面的属性
        	//如果没有找到，新建一个，加入到queue[]
        	//把这个变化了的对象publish给界面更新
        	var queueItem={};
        	 queueItem=self._queryQueueItem(evtJson);
         	if(queueItem){
				//update
         		if(evtJson.Removed){
         			queueItem.removed = true;
         		}
         		queueItem.idleAgentCount=evtJson.Members - evtJson.BusyMembers;
         		queueItem.busyAgentCount=evtJson.BusyMembers;
         		queueItem.totalAgentCount=evtJson.Members;
         		queueItem.queueWaitCount=evtJson.Calls;
         		queueItem.abadonedCalls=evtJson.Abandoned;
         		queueItem.totalCalls=evtJson.TotalCalls;
         		queueItem.members=[];
	        	for(var i in evtJson.QueueMember){
	        		var member = evtJson.QueueMember[i];
	        		queueItem.members[member.Exten] = member;
	        	}
         		dojo.publish("EvtMonitorQueue",[queueItem]);
        	}else{
	        	queueItem={
	        		queueName:evtJson.Queue,
	        		queueId:evtJson.Queue,
	        		idleAgentCount:evtJson.Members - evtJson.BusyMembers,
	        		busyAgentCount:evtJson.BusyMembers,
	        		totalAgentCount:evtJson.Members,
	        		queueWaitCount:evtJson.Calls,
	        		abadonedCalls:evtJson.Abandoned,
	        		totalCalls:evtJson.TotalCalls,
	        		members:[],
	        		removed:false
	        	};
	        	for(var i in evtJson.QueueMember){
	        		var member = evtJson.QueueMember[i];
	        		queueItem.members[member.Exten] = member;
	        	}
				self.monitorQueues[evtJson.Queue]=queueItem;
			}
         	self._updateQueueInfo();
        } else if(evtJson.Event == "QueueMemberAdded"){
        	//坐席签入
        //	queue.member +1;
        	//把这个变化了的对象publish给界面更新
        	var queueItem=self._queryQueueItem(evtJson);
        	if(queueItem){
        		if(!queueItem.members[evtJson.Exten]){
            		queueItem.members[evtJson.Exten]=evtJson;
            		queueItem.totalAgentCount++;
            		self._updateQueueInfo();
        		}
        		}else{
        			console.debug('无此队列');	
        		}
        } else if(evtJson.Event == "QueueMemberRemoved"){
        	//坐席签出
        	//queue.member -1;
        	//把这个变化了的对象publish给界面更新
        	var queueItem=self._queryQueueItem(evtJson);
        	if(queueItem){
    			if(queueItem.members[evtJson.Exten]){
    				delete queueItem.members[evtJson.Exten];
        			queueItem.totalAgentCount--;
        			self._updateQueueInfo();
    			} 
        	}else{
        		console.debug('无此队列');	
        	}
        } else if(evtJson.Event == "QueueMemberPaused"){

        } else if(evtJson.Event == "Join"){
        	//来电
         	//如果找到这个queue，更新这个对象里面的属性
        	//如果没有找到，不处理
        	//把这个变化了的对象publish给界面更新
        	var queueItem=self._queryQueueItem(evtJson);
        	if(queueItem){
        		queueItem.queueWaitCount++;
        		dojo.publish("EvtMonitorQueue",[queueItem]);
        	} else {
        		console.debug("找不到队列："+evtJson.Queue);
        	}
        	dojo.publish("EvtQueueEntryAdd", [evtJson]);
        } else if(evtJson.Event == "Leave"){
        	//来电离开：客户取消，被接听
        	var queueItem=self._queryQueueItem(evtJson);
        	if(queueItem){
        		queueItem.totalCalls++;
        		queueItem.queueWaitCount--;
        		if(queueItem.queueWaitCount < 0)
        			queueItem.queueWaitCount = 0;
        		dojo.publish("EvtMonitorQueue",[queueItem]);
        	} else {
        		console.debug("找不到队列："+evtJson.Queue);
        	}
        	dojo.publish("EvtQueueEntryRemove", [evtJson]);
        } else if(evtJson.Event == "QueueCallerAbandon"){
        	//是客户取消的
        	var queueItem=self._queryQueueItem(evtJson);
        	if(queueItem){
        		queueItem.abadonedCalls++;
        		dojo.publish("EvtMonitorQueue",[queueItem]);
        	} else {
        		console.debug("找不到队列："+evtJson.Queue);
        	}
        	dojo.publish("EvtQueueEntryRemove", [evtJson]);
        }
        //坐席
        else if(evtJson.Event == "UserStatus"){
        	var isRegistered = false;
    		if(evtJson.PeerStatus == "Registered")
    			isRegistered = true;
        	if(!self.monitorPeers[evtJson.UserID]){
    			var peer = {
    				exten:evtJson.Exten,
    				sipNo:evtJson.SipNum,
    				name:evtJson.User,
    				loginExten:evtJson.LoginExten,
    				peerStatus:evtJson.PeerStatus,
    				status:evtJson.Status,
    				C5Status:evtJson.C5Status,
    				busy:evtJson.Busy,
    				extenType:evtJson.ExtenType,
    				login:evtJson.Login,
    				userId:evtJson.UserID,
    				user:evtJson.User,
    				register: isRegistered,
    				InCalls: evtJson.InCalls,
    				InComplete: evtJson.InComplete,
    				OutCalls: evtJson.OutCalls,
    				OutComplete: evtJson.OutComplete,
    				linked:false,
    				channel:"",
    				linkedChannel:"",
        			called:false,//是否是被呼
        			//Idle, Ring, Ringing, inner, normal, dialout, dialTransfer,transfer, listen, webcall
        			callStatus:"Idle",
    				callNo:"",
    				timestamp:evtJson.Login?(evtJson.BusyTimestamp):"",
    				busyTimestamp:evtJson.BusyTimestamp,
    				loginTimestamp:evtJson.LoginTimestamp
    			};
    			console.debug("处理坐席状态");
    			self.monitorPeers[evtJson.UserID] = peer;
    			dojo.publish("EvtMonitorPeer",[peer]);
    		} else {
    			var peer = self.monitorPeers[evtJson.UserID];
    			peer.peerStatus = evtJson.PeerStatus;
    			peer.status = evtJson.Status;
    			peer.exten = evtJson.Exten;
				peer.sipNo = evtJson.SipNum;
    			peer.C5Status = evtJson.C5Status;
    			peer.busy = evtJson.Busy;
    			peer.extenType = evtJson.ExtenType;
    			peer.login = evtJson.Login;
    			peer.loginExten = evtJson.LoginExten;
    			peer.name = evtJson.User;
    			peer.userId = evtJson.UserID;
    			peer.user = evtJson.User;
    			peer.register = isRegistered;
    			peer.InCalls = evtJson.InCalls;
    			peer.InComplete = evtJson.InComplete;
    			peer.OutCalls = evtJson.OutCalls;
    			peer.OutComplete = evtJson.OutComplete;
    			peer.busyTimestamp=evtJson.BusyTimestamp;
    			peer.loginTimestamp=evtJson.LoginTimestamp;
    			peer.timestamp = peer.login?(peer.busyTimestamp):"";
    			dojo.publish("EvtMonitorPeer",[peer]);
    			self._updateQueueInfo();
    		}
        }  
        //分机
        else if(evtJson.Event == "PeerStatus"){
        	
        	//当前坐席
        	if(evtJson.Exten == self.sipNo){
        		var peer = self.monitorPeers[self.userId];
        		var isRegistered = false;
        		if(evtJson.PeerStatus == "Registered")
        			isRegistered = true;
        		console.debug("当前状态："+this.state);
        		if(!isRegistered && (this.extenType == "gateway" || this.extenType == "sip")
        				&& (this.state == "stIdle" || this.state == "stBusy")){
        			console.debug("设置失效："+this.state);
        			this._changeState("stInvalid");
        		} else if (isRegistered && this.state == "stInvalid"){
        			if(peer.busy)
        				this._changeState("stBusy");
        			else this._changeState("stIdle");
        		}
        	}
			var isRegistered = false;
    		if(evtJson.PeerStatus == "Registered")
    			isRegistered = true;
			var peer = self._getUserViaSipNum(evtJson.Exten);
			if(peer){
				peer.register = isRegistered;
				peer.status = evtJson.Status;
    			dojo.publish("EvtMonitorPeer",[peer]);
    			console.dir(peer);
    			self._updateQueueInfo();
			}
        } 
        //服务号事件
        else if(evtJson.Event == "TrunkStatus"){
        	if(!self.monitorServiceNos[evtJson.ServiceNo]){
				var serviceNo = {
					serviceNo: evtJson.ServiceNo,
					inCalls: evtJson.InCalls,
					inLost: evtJson.InLost,
					inComplete: evtJson.InComplete,
					outCalls: 0,
					outComplete: 0
				};
				self.monitorServiceNos[evtJson.ServiceNo] = serviceNo;
			} else {
				var serviceNo = self.monitorServiceNos[evtJson.ServiceNo];
				serviceNo.inCalls = evtJson.InCalls,
				serviceNo.inLost = evtJson.InLost,
				serviceNo.inComplete = evtJson.InComplete,
				serviceNo.outCalls = 0,
				serviceNo.outComplete = 0
			}
			dojo.publish("EvtMonitorServiceNo", [self.monitorServiceNos[evtJson.ServiceNo]]);
        }
        // account call status
        else if(evtJson.Event == "AccountStatus"){
        	self.accountCalls = evtJson;
			dojo.publish("EvtAccountStatus", [evtJson]);
        }
    },

	_queryQueueItem:function(evtJson){
		//取得该事件是否在队列中
		if(!this.monitorQueues) return null;
        	for( var i in this.monitorQueues){
        		if(this.monitorQueues[i].queueId==evtJson.Queue){
	        		return this.monitorQueues[i];
        		}
    		}		
    		return null;
		},
		
	_getUserViaSipNum:function(sipNum) {
		if(!this.monitorPeers) return null;
		for(var i in this.monitorPeers) {
			if(this.monitorPeers[i].sipNo == sipNum){
				return this.monitorPeers[i];
			}
		}
		return null;
	},
		
	_updateQueueInfo:function(){
		for( var i in this.monitorQueues){
			var queue = this.monitorQueues[i];
			var members = queue.members;
			queue.busyAgentCount = 0;
			queue.idleAgentCount = 0;
			for(var j in members){
				var peer = this._getUserViaSipNum(members[j].Exten);
				if(peer){
					//坐席忙碌
					if(peer.extenType == "sip"){
						if(!peer.register
								|| !peer.login
								|| peer.busy
								|| peer.callStatus != "Idle"){
							queue.busyAgentCount++;
						}else {
							queue.idleAgentCount++;
						}
					} else if(peer.extenType == "gateway"){
						if(!peer.register
								|| peer.busy
								|| peer.callStatus != "Idle"){
							queue.busyAgentCount++;
						}else {
							queue.idleAgentCount++;
						}
					} else if(peer.extenType == "Local"){
						if(peer.busy
								|| peer.callStatus != "Idle"){
							queue.busyAgentCount++;
						} else {
							queue.idleAgentCount++;
						}
					} else {
						queue.busyAgentCount++;
					}
				} else {
					queue.idleAgentCount++;
				}
			}
			dojo.publish("EvtMonitorQueue",[queue]);
		}
	},

    _waitEvent: function() {
        // summary:
        //    向AJAM发起注册监听事件的请求 
        if (this._isWaitingEvent) return;
        if (this._evtXhr == null) return;
        this._isWaitingEvent = true;
        var self = this;
        var url = this.proxy_url;
        var phoneJson = {
        		Command:"Action",
        		Action:"GetState",
        		ActionID:"GetState"+Math.random(),
        		SessionID:this.uniqueId,
        		User:this.userId
        };
		
        dojo.io.script.get({
            url: url,
            content: {json: dojo.toJson(phoneJson)},
            callbackParamName: "callbackName",
            timeout: 10000,
            preventCache: true,
            load: function(response, ioArgs){
                iccCount = 0;
                self.display("");
                if (!response) {
                    return;
                }
				var datas=response;
                var _response = datas.Response;
                if (!_response) {
                    _response = datas;
                }
                console.dir(_response);
                
                if (_response.Succeed && !_response.HasEvent) {
                
                } else if (!_response.Succeed) {
                        console.debug("会话失效");
                        console.dir(_response);
                        self._isWaitingEvent = false;
                        if (_response.Expired) {
                            console.debug("开始自动重连");
                            self._relogin();
                        }
                        return;
                } else {
                        if (_response.Kick) {
                        	var comments = "";
                    		if(_response.Comments)
                    			comments = _response.Comments;
                    		if(comments == "ukick" || comments == "ekick")
                    			alert("您当前的会话已经失效,导致该问题的原因是别的坐席使用相同的帐号（或相同的分机）登录了");
                    		else
                    			alert("您当前的会话已经失效,导致该问题的原因可能是被管理员强制签出");
                            console.debug(_response.Message);
                            window.location = ".";
                            self.destroy();
                            return;
                        }
                        else {
                            var events = datas.Event;
                            self._eventHandler(events);
                        }
                    }
                self._isWaitingEvent = false;
                self._waitEvent(true);
            },
            
            error: function(response, ioArgs){
                self._isWaitingEvent = false;
                window.setTimeout(function(){
                    iccCount++;
                    if (iccCount > 3) {
                        self.display("连接服务器超时，可能是您的网络问题，正在尝试重新连接...");
                    }
                    self._waitEvent();
                }, 10000);
                return;
            }
        });  

    },
    
    display:function(message){
	    //显示提示信息	
			var netMessage=dojo.byId("netMessage"); 
    	if(netMessage){
    			netMessage.innerHTML=message;
    		}
    },
    _relogin: function(){
    	if(this._isRelogin)
    		return;
    	var self = this;
    	self._isRelogin = true;
    	var phoneJson = {
        		Command:"Action",
        		Action:"Login",
        		ActionID:"Login"+Math.random(),
        		Exten:self.sipNo,
        		Secret:self.sipPassword,
        		LoginExten:self.extension,
        		DialoutPrefix:self.dialOutPrefix,
        		DidNum:self.didNum,
        		TransferPrefix:self.xferPrefix,
        		ServiceNo:self.serviceNo,
        		ExtenType:self.extenType,
        		PBX:self.pbx_in_ip,
        		User:self.loginName,
        		UserName:self.trueName,
        		Account:self.accountId,
        		Password:self.password,
        		AutoBusy:self.autoBusy,
				UserID: self.userId
        		};
		dojo.io.script.get({
            url: self.proxy_url,
            content: {json: dojo.toJson(phoneJson)},
			callbackParamName: "callbackName",
			timeout: 15000,
            preventCache: true, 
            load: function(response, ioArgs) {
            	self._isRelogin = false;
                var _response = response;
                console.dir(_response);
                if (!_response.Succeed) {
                    console.debug("重新登录失败-"+json.Message);
                    var code = _response.Result;
                    if(code && code == 601)
                    	alert("您的账户登录数已达最大或者已经到期");
                    else
                    	alert("您当前的会话已经失效,导致该问题的原因可能是被管理员强制签出");
                    console.debug(json.Message);
                    window.location = ".";
                    self.destroy();
                } else if (_response.SessionID) {
                	console.debug("重新登录成功");
                	self.uniqueId = _response.SessionID;
                    var date = new Date();
					var identity = date.valueOf();
					self.currentServerTime = identity - _response.Timestamp*1000;
					if(!self._isIdle){
						self.setBusy(false);
					}
					self._waitEvent();
                } else {
                	console.debug("登录成功,但没有sessionid");
                }
            },
            error: function(response, ioArgs) { 
                if (this.isTimeout) {
                    console.debug("请求超时,请检查本地网络[" + ioArgs.url + "]");
                }
                console.debug("ACTION返回错误[%s]", response);
            }
		});					
 
    },
    
    _sendAction: function(action, params, onload, sync) {
        //发送软电话消息     
        if (this._destroyed) return;
        var phoneJson = {};
        var url = this.proxy_url;
        dojo.mixin(phoneJson,{
        	Command:"Action",
           	Action:action,
        	ActionID:action+Math.random(),
        	PBX:this.pbx_in_ip,
        	Account:this.accountId,
        	SessionID:this.uniqueId
        });
        
        /*var args = "";
        for (var i in params) {
             args += "&" + i + "=" + escape(params[i]);
        }*/
        dojo.mixin(phoneJson,params);            

        if (onload == null) {
            onload = function(response, ioArgs) {
                console.debug("ACTION调用成功[%s]", response);
            }
        }
        console.debug("发送ACTION");
        console.dir(phoneJson);
        dojo.io.script.get({
            url: url,
            content: {json: dojo.toJson(phoneJson)},
            callbackParamName: "callbackName",
            timeout: 60000,
            preventCache: true,
            load: onload,
            error: function(response, ioArgs) { 
                if (this.isTimeout) {
                    console.error("请求超时,请检查本地网络[" + ioArgs.url + "]");
                }
                console.debug("ACTION返回错误");
                console.dir(response);
            }
        }); 					
    },
    
    _stopEvent: function() {
        if (this._evtXhr) {
            this._evtXhr.abort(); 
            this._evtXhr = null;
        }
    }

});

icallcenter.Phone.register = function(server, loginInfo) {
    var config = {             
         accountName: "holly",
         accountId: loginInfo.accountId,
         loginName: loginInfo.loginName, 
         password: loginInfo.password, 
         proxy_url: "http://10.8.10.165:7788/", 
         extension: loginInfo.analogTelNum,
         sipNo: loginInfo.analogTelNum,
         sipPassword: "fdcc29d0",
         pbx_in_ip: loginInfo.pbxAddr,
         pbx_ex_ip: "10.8.66.30:5064",
         file_server_ip: "211.151.35.100",
         extenType: loginInfo.extenType,
         queues: ["29001202"],
         autoBusy: false
    }
    console.info("初始化软电话配置参数");
    console.dir(config);
    result = icallcenter.Phone.registerEvent(config);      
    return result;
};

icallcenter.Phone.registerEvent = function(config) {
        var result = null;
//        if(config.accountId == 'Q000000003893')
//        	config.proxy_url="http://127.0.0.1:7788/";
        var url = config.proxy_url;
        var phoneJson = {
        		Command:"Action",
        		Action:"Login",
        		ActionID:"Login"+Math.random(),
        		Exten:config.sipNo,
        		Secret:config.sipPassword,
        		LoginExten:config.extension,
        		DialoutPrefix:config.dialOutPrefix,
        		DidNum:config.didNum,
        		TransferPrefix:config.xferPrefix,
        		ServiceNo:config.serviceNo,
        		ExtenType:config.extenType,
        		PBX:config.pbx_in_ip,
        		User:config.loginName,
        		UserName:config.trueName,
        		Account:config.accountId,
        		Password:config.password,
        		AutoBusy:config.autoBusy,
				UserID: config.userId
        		};
				
        dojo.io.script.get({
            url: url,
			content: {json: dojo.toJson(phoneJson)},
            callbackParamName: "callbackName",
			timeout: 15000,
            preventCache: true, 
            load: function(response, ioArgs){
				console.debug("注册ass返回");
				console.dir(response);
                var _response =response;
                console.dir(_response);
                if (!_response.Succeed) {
                    result =  false;
                    var code = _response.Result;
                    if(code && code == 601)
                    	alert("您的账户登录数已达最大或者已经到期");
                    else alert("登录失败，请联系管理员");
                    if (dojo.cookie("isSmallVersion") == '1') {
                        window.location = "./manage/";
						self.destroy();
                        return;
                    }
                    window.location = ".";
                    self.destroy();
                } else if (_response.SessionID) {
                    config.uniqueId = _response.SessionID;
                    var date = new Date();
					var identity = date.valueOf();
					config.currentServerTime = identity - _response.Timestamp*1000;
                    result = new icallcenter.Phone(config);
					phone =result;
					if(dojo.cookie("isSmallVersion") != '1') {
						icallcenter.logon.afterPhone(phone);
					}
                } else {
                    result =  false;
                }
				return response;
			},
			error: function(response, ioArgs) { 
				 if (this.isTimeout) {
					 alert("请求超时，请检查本地网络");
				 }
                console.debug("注册ass失败");
                console.dir(response);
				window.location = "./";
				return response;
            }
        });

};