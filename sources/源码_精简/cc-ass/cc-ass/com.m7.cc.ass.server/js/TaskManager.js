dojo.provide("icallcenter.TaskManager");

dojo.require("dijit.Declaration");
dojo.require("icallcenter.ajaxRequest");

dojo.declare("icallcenter.TaskManager", null, {
    // summary:
    //    应用任务管理器，管理应用所有的Task和Task所在的Context
    
    constructor: function(/*string*/widget) {
        this._widget = widget;      
    }, 
    
      // 当前的context
    context: null,
    // 当前的Task
    task: null,
    _contexts: [],
    _widget: null,
    _declareTypes: [],
    
    addContext: function(/*string*/id, /*boolean*/isDefault) {
        // summary:
        //      增加Task弹出的Context，每个Context对应一个DOJO的TabContainer组件
        //      同时定义一个context的对象
        // args:
        //    id: 
        //      新增的context的编号，如果重名，会覆盖原有同名的context定义
        //      
        //      context:
        //          id: context的编号
        //          _widget: context对应的TabContainer的组件实例
        //          _tasks[]: context中包含的所有Task
        console.debug("新增context[%s][%s]", id, isDefault);
        var tabRefNode = document.createElement("div");
        this._widget.domNode.appendChild(tabRefNode);                                   
        var context = new hojit.layout.TabContainer({id: id}, tabRefNode);
        dojo.mixin(context, {
                layoutAlign: "client"
            }
        );  
       
        this._widget.addChild(context);
        context.domNode.style.display = "none";
        this._contexts[id] = {
                id: id,
                _widget: context,
                _tasks: [],
                lastFocusTask: null 
        };
        if (isDefault) {
            console.debug("设置默认的context[%s]", id);
            this.context = this._contexts[id];  
        }                   
    },
    
    getParameter: function(/*string*/paramName, 
                           /*string?*/task, 
                           /*string?*/context) {
        // summary:
        //      获取指定Context下的Task中的参数
        //      同时定义一个context的对象
        // args:
        //      paramName: 
        //            参数名
        //      task: 
        //            Task编号
        //      context:
        //            Task所在的context的编号，如果为空则从当前的context中获取
        var value = null;
        if (task) {
          var value = null;
          if (!context) {
                value = dojo.getObject(paramName,false,this.context._tasks[task].register["param"]);
          } else {
                value = dojo.getObject(paramName,false,this.context[context]._tasks[task].register["param"]);
          }        
        } else {
           if (!this.task) return value; 
           value = dojo.getObject(paramName,false,this.task.register["param"]);
        }  
        return value;     
    },
    
    
    setParameter: function(/*string*/paramName,
                           /*string*/value,
                           /*string?*/task,
                           /*string?*/context) {
        if (task) {
          if (!context) {
                value = dojo.setObject(paramName, value, this.context._tasks[task].register["param"]);
          } else {
                value = dojo.setObject(paramName, value, this.context[context]._tasks[task].register["param"]);
          }        
        } else {
           value = dojo.setObject(paramName, value, this.task.register["param"]);
        }                                
                            
    },
    popupTask2Frame: function(/*string*/id, 
            /*string*/title, 
            /*string*/widgetClass, 
            /*string || null*/context, 
            /*string*/uri, 
            /*Object?*/param, 
            /*Boolean?*/isModel,
            /*string||Object?*/parent,
            /*Boolean?*/isDefault) {
				if (!uri || dojo.string.trim(uri) == "") return;
				var self = this; 
				if (!this._contexts[context]) {
				this.addContext(context);
				}
				// 如果点击的是当前Context对应的菜单，同时菜单对应的页面已经开启，则不做任何操作
				if (this.context && this.context.id == context && isDefault &&  this._getDefaultTaskCount() > 0) {
				return;    
				}
				
				var isSwitchContext = (!this.context || (context != null && this.context.id != context));
				var tabContainer = this._switchContext(context); 
				// 如果从一个菜单切换到另外一个菜单，同时切换的菜单对应的Context的默认Task已经开启，则只切换Context
				// 同时调整当前任务
				if (isSwitchContext && this._getDefaultTaskCount() > 0) { 
				if (this.context.lastFocusTask) {
				    this.task = this.context.lastFocusTask; 
				}                                   
				return;            
				}
				
				// 如果当前的Task是模态的,则不允许在当前的Context下打开新的Task
				var model = !!isModel;
				if (this.task && this.task.isModel && (!context || this.context.id == context)) return; 
				 
				if (this.context._tasks[id]) {      
				console.debug("开启已开启的任务[%s]", id); 
				var tab = this.context._tasks[id]._widget;
				tabContainer.selectChild(tab);
				if (typeof tab.onShowed == "function") {
				    tab.onShowed(param, this.context._tasks[id]._connects, id);
				}                 
				} else {
					if (!this._verifyTaskCount(id)) {
					
					    return;
					}
					if (this._declareTypes[widgetClass]){
					    this._declareTypes[widgetClass].destroy();
					}
					console.debug("开启新的任务[%s]", id);     
		            var refNode = document.createElement("div");  
		            var innerContent = "<div dojoType=\"hojit.layout.ContentPane\" class=\"task\" dojoAttachPoint=\"container\" closeable=\"true\" >";
		            innerContent += '<iframe style="border:0;width:100%;height:100%;bottom:0;right:0;" name="ivrEmbed" id="ivrEmbed" src="'+uri+'"></iframe>'; 
		            innerContent += "</div>";
		            refNode.innerHTML = innerContent;
		            document.body.appendChild(refNode);                  
		            var declareTypeWidget = new dijit.Declaration({id: "",widgetClass: widgetClass}, refNode);
		            self._declareTypes[widgetClass] = declareTypeWidget;
		                                                           
		            self._addNewTab(title, id, widgetClass, param, model, parent, isDefault,uri);
				}
},
    
    popupTask: function(/*string*/id, 
                        /*string*/title, 
                        /*string*/widgetClass, 
                        /*string || null*/context, 
                        /*string*/uri, 
                        /*Object?*/param, 
                        /*Boolean?*/isModel,
                        /*string||Object?*/parent,
                        /*Boolean?*/isDefault, /*Boolean?*/isRedirect) {
        // summary:
        //      弹出Task，如果Task已经打开，则定位到已经打开的Task
        //      如果Task从未打开，则声明一个Task的widgetClass, 打开一个新的Task
        //      如果Task曾经打开过，则用原有的widgetClass定义来产生一个新的Task
        // args:
        //      id: 
        //            弹出Task的编号
        //      title: 
        //            弹出Task的标题
        //      widgetClass:
        //            弹出Task对应的DOJO DeclareClass
        //      context:
        //            Task所在的context的编号，如果为空则从当前的context中获取  
        //      uri:
        //            Task对应页面的url
        //      param:
        //            传递给弹出Task的参数
        //      isModel:
        //            是否是一个模态的Task
        //      parent: 
        //            当前Task对应的父Task
        //      isDefault: 
        //            是否可以关闭
        //      isRedirect: 
        //            是否刷新task
                                 
        // 校验是否是合法的uri,如果uri不合法,则直接返回
        if (!uri || dojo.string.trim(uri) == "") return;
        
        var self = this; 
        
        if (!this._contexts[context]) {
            this.addContext(context);
        }
         // 如果点击的是当前Context对应的菜单，同时菜单对应的页面已经开启，则不做任何操作
        if (this.context && this.context.id == context && isDefault &&  this._getDefaultTaskCount() > 0) {
            return;    
        }

        var isSwitchContext = (!this.context || (context != null && this.context.id != context));
        var tabContainer = this._switchContext(context); 
        // 如果从一个菜单切换到另外一个菜单，同时切换的菜单对应的Context的默认Task已经开启，则只切换Context
        // 同时调整当前任务
        if (isSwitchContext && this._getDefaultTaskCount() > 0) { 
            if (this.context.lastFocusTask) {
                this.task = this.context.lastFocusTask; 
            }                                   
            return;            
        }

        // 如果当前的Task是模态的,则不允许在当前的Context下打开新的Task
        var model = !!isModel;
        if (this.task && this.task.isModel && (!context || this.context.id == context)) return; 
             
        if (this.context._tasks[id]) {      
            console.debug("开启已开启的任务[%s]", id); 
            var tab = this.context._tasks[id]._widget;
            tabContainer.selectChild(tab);
            if (typeof tab.onShowed == "function") {
                tab.onShowed(param, this.context._tasks[id]._connects, id);
            }                 
        } else {
            if (!this._verifyTaskCount(id)) {

                return;
            }
            if (this._declareTypes[widgetClass]){
                this._declareTypes[widgetClass].destroy();
            }
            console.debug("开启新的任务[%s]", id);     
          
          //如果uri以"http://"打头，那么不走ajax，直接处理
          if (uri.length > 7 && uri.substring(0,7).toLowerCase() == "http://"){
                if (param != null){
                    if (uri.indexOf("?") == -1){
                        var params = "?";
                    }else{
                        var params = "&";
                    }
                    for (var name in param){
                        var value = dojo.getObject(name, false, param);
                        params = params + name + "=" + value + "&";
                    }
                    uri += params;
                }
            if (uri.length > 0 && uri.substring(uri.length-1,uri.length) == "&"){
                uri = uri.substring(0,uri.length-1);
            }
                var refNode = document.createElement("div");  
                        var innerContent = "<div dojoType=\"hojit.layout.ContentPane\" class=\"task\" dojoAttachPoint=\"container\" href=\""+uri+"\" closeable=\"true\" ></div>";
                        refNode.innerHTML = innerContent;
                        document.body.appendChild(refNode);                  
              var declareTypeWidget = new dijit.Declaration({id: "",widgetClass: widgetClass}, refNode);
                self._declareTypes[widgetClass] = declareTypeWidget;
                                                               
                self._addNewTab(title, id, widgetClass, param, model, parent, isDefault,uri,isRedirect);
                return;
            }
                      
            var ajaxRequest = new icallcenter.ajaxRequest({
                url: uri,
                handleAs: "text",
                content: null,
                load: function(response, ioArgs) {
                        var refNode = document.createElement("div");  
                        var innerContent = "<div dojoType=\"hojit.layout.ContentPane\" class=\"task\" dojoAttachPoint=\"container\" closeable=\"true\" >";
                        innerContent += response; 
                        innerContent += "</div>";
                        refNode.innerHTML = innerContent;
                        document.body.appendChild(refNode);                  
                        var declareTypeWidget = new dijit.Declaration({id: "",widgetClass: widgetClass}, refNode);
                        self._declareTypes[widgetClass] = declareTypeWidget;
                                                                       
                        self._addNewTab(title, id, widgetClass, param, model, parent, isDefault,uri);
                },
                error: function(response, ioArgs) {
                    console.debug(response);
                    alert(uri + "获取失败");
                } 
            });
            ajaxRequest.doPost();
        }
    },

    
    closeTask: function(/*string*/task) {      
        // summary:
        //      关闭指定的Task
        //    
        // args:
        //      id: 
        //          关闭Task的编号
        var tabContainer = this.context._widget;
        var curTask = null;
        if (task) {                  
            curTask = this.context._tasks[task];
        } else {
            curTask = this.task;  
        }
        tabContainer.closeChild(curTask._widget);
    },
    redirectTask: function(/*string*/task,/*string*/url,/*param?*/param,flag){
            // summary:
            //      重定向指定的Task
            //    
            // args:
            //      id: 
            //          指定Task的编号
			// 		flag:是否设置业务提醒
            var self = this;           
            var tabContainer = this.context._widget;
            var curTask = null;
            if (task) {                  
                curTask = this.context._tasks[task];
            } else {
                curTask = this.task;  
            }
            curTask.preUrl = curTask.uri;
            curTask.uri = url;
            curTask.param = param; 

            var ajaxRequest = new icallcenter.ajaxRequest({
                    url: url,
                    handleAs: "text",
                    content: param,
                    load: function(response, ioArgs) {
                        var tab = curTask._widget;
                        var widget = tab.domNode;
							
                        widget.innerHTML = response;
                        var scripts = dojo.query("> div[type^='dojo/']", widget).orphan();  
                        dojo.parser.parse(widget);
                        scripts.forEach(function(script){
                            icallcenter.common.wireUpMethod(tab, script);
                        });
                        if (typeof (tab.onLoaded) == "function") {
                            tab.onLoaded(param, self.task._connects, self.task.id);
                        }
			            dojo.mixin(tab, {
			                onClose: function() {
								var id=curTask.id;
			                    console.debug("开始关闭Task[%s]", id);
			                    var t = self.context._tasks[id];
			                    if (self._getChildTaskCount(t) > 0) {
			                        alert("请先关闭当前窗口的所有子窗口，点击“确定”跳转到当前窗口的子窗口");                        
			                        var page = self._getFirstChildTask(t)._widget;
			                        tabContainer.selectChild(page);  
			                        return false;    
			                    }
			                    if (typeof this.closing == "function") {
			                        this.closing(t); 
			                    }                 
			                    t._declare.destroyRecursive(true);      
			                    dojo.forEach(t._connects, function(item) {
			                          dojo.disconnect(item);
			                    });
								if (self._getTaskCount() == 1){
									self.context._widget.domNode.childNodes[1].style.display = 'none';
								}	
			                    if (t.parent) {
			                        delete t.parent.children[id]; 
			                    }
			                    delete self.context._tasks[id];                          
			                    delete self._widget;                    
			                    delete self._declare;
			                    delete self.children;

			                    return true;
			                }
			            });						
                    },
                    error: function(response, ioArgs) {
                        console.debug(response);
                        alert(url + "获取失败");
                    } 
                });
            ajaxRequest.doPost();
    },

    refresh: function() {
            this.redirectTask(this.task.id, this.task.uri, this.task.param);      
    },
    
    _verifyTaskCount: function(taskID) {
    		var tmpNum=0;
        if (this._getTaskCount() > MAX_TASK_COUNT) {
         	//当窗口达到最大数是，给webchat客户发消息
    	     if(taskID && taskID.indexOf('webchat_')!=-1){
        			if(frames['im_zx_roster']){
								frames['im_zx_roster'].sendLastMessage(taskID.substring(taskID.indexOf('_')+1));   
								tmpNum++;
							}        		
        		}
        		if(tmpNum>0){
           		setTimeout('alert("当前菜单下已经到达最大的窗口开启数量, 请关闭其他的窗口")',10);   
         		}else{
         			alert("当前菜单下已经到达最大的窗口开启数量, 请关闭其他的窗口");
         		} 
         		tmpNum=0;
            return false;
        } else {
            return true;    
        }       
    },
    
    _addNewTab: function(/*string*/title, 
                         /*string*/id, 
                         /*string*/widgetClass, 
                         /*Object?*/param,
                         /*Boolean*/isModel,
                         /*string||Object?*/parent,
                         /*Boolean?*/isDefault,
                         /*string*/uri,/*Boolean?*/isRedirect) {
        var self = this;
        var tabContainer = this.context._widget;       
		if (tabContainer && tabContainer.domNode && tabContainer.domNode.childNodes[1]){
			tabContainer.domNode.childNodes[1].style.display = '';
		}
        eval("var tabInstance = new " + widgetClass + "\(\{id: \'cls_" +  id + "\', accountId: '" + userInfo.accountId + "'\}\);");
        tab = tabInstance.container;
        tab.isModel = isModel;
        if (dojo.isString(parent)) {
            parent = this.context._tasks[parent];    
        }
        
        var cloasable = !isDefault ;
        var isDefault = !!isDefault;
		var isRedirect =!!isRedirect;
        var task = {
                id: id,
                _widget: tab,
                _declare: tabInstance,
                context: self.context,
                isDefault: isDefault,
                _connects: [],
                register: [],
                parent: parent,
                children: [],
                uri: uri
        };
        var parentPage = null;
        if (parent) {
            parent.children[id] = task;
            parentPage = parent._widget;
        }
        this.context._tasks[id] = task;
        
        // 每个Task都会有param这个默认的寄存器参数
        this.context._tasks[id].register["param"] = param;
                
        dojo.mixin(tab, {
				isRedirect:isRedirect,
                title: title,
                closable: cloasable,
                parent: parentPage,
                onShow: function() {
                        console.debug("当前Task变成[%s]", id);
                        self.task = self.context._tasks[id];
                        if (typeof this.onShowing == "function") {
                         		if(self.context._tasks[id] && self.context._tasks[id]._connects){
								            	this.onShowing(param, self.context._tasks[id]._connects, id);
								          	}
								        }  
                },
                onClose: function() {
                    console.debug("开始关闭Task[%s]", id);
                    var t = self.context._tasks[id];
                    // 判断当前Task是否包含子Task，如果包含，则不允许关闭当前Task，同时跳转到当前Task的首个子Task
                    if (self._getChildTaskCount(t) > 0) {
                        alert("请先关闭当前窗口的所有子窗口，点击“确定”跳转到当前窗口的子窗口");                        
                        var page = self._getFirstChildTask(t)._widget;
                        tabContainer.selectChild(page);  
                        return false;    
                    }
                    // 调用当前Page关闭的回调函数
                    if (typeof this.closing == "function") {
                        this.closing(t); 
                    }                 
                    t._declare.destroyRecursive(true);      
                    // 清理Page中所有的事件句柄
                    dojo.forEach(t._connects, function(item) {
                          dojo.disconnect(item);
                    });
					if (self._getTaskCount() == 1){
						self.context._widget.domNode.childNodes[1].style.display = 'none';
					}	
                    // 断开Task的父子关联
                    if (t.parent) {
                        delete t.parent.children[id]; 
                    }
                    // 清理Context对Task的关联
                    delete self.context._tasks[id];                          
                    delete self._widget;                    
                    delete self._declare;
                    delete self.children;
                    //alert(task.uri);
                    if (task.uri.length > 7 && task.uri.substring(0,7).toLowerCase() == "http://"){
                        return "notDestroy";
                    }
                    return true;
                }
            }
        );   
        tabContainer.addChild(tab);           
        tabContainer.selectChild(tab);            
        if (typeof tab.onLoaded == "function") {
            tab.onLoaded(param, this.context._tasks[id]._connects, id);
        }                          
        if (typeof tab.onShowed == "function") {
            tab.onShowed(param, this.context._tasks[id]._connects, id);
        }
		
		if(id=='workspace_integration_index'){
			var popup0=dojo.byId("dijit_layout__TabButton_0");
			if(popup0){
				popup0.innerHTML=popup0.innerHTML+'&nbsp;&nbsp;<a href="javascript:icallcenter.workspace.popupList2();"><img  src="./ui/theme/blue/image/add_flow.png" style="border:0px;margin-bottom:-2px;vertical-align:middle;"  onclick="javascript:icallcenter.workspace.popupList();"  id="popup_list_0" alt="新建业务单"></a>';
			}
		}                          
    },
    
    _switchContext: function(context,/*boolean?*/addToHistory) {
        // 获取弹出TASK所在的context对应的widget实例
        // 将当前的context隐藏，显示新的context
        var tabContainer = null;
        if (context != null) {
            if (this.context != null) {
                this.context._widget.domNode.style.display = "none";
                this.context.lastFocusTask = this.task;
                if (addToHistory == null){
                    addToHistory = true;
                }
                if (addToHistory){            
                    var self = this;
                    var state = {
                                back: function() {  self._switchContext(this.preContext,false);},
                                forward: function() { self._switchContext(this.forwardContext,false); },
                                changeUrl: true,
                                preContext: self.context.id,
                                forwardContext: context
                        };
                        dojo.back.addToHistory(state);           
                }        
            }
            console.debug("切换到context[%s]", context);
            this.context = this._contexts[context];             
            tabContainer = this.context._widget;
        } else {
            tabContainer = this.context._widget;    
        }
        tabContainer.domNode.style.display = "";          
        return tabContainer;
    },
    
    _getTaskCount: function(context) {
        var curContext = null;
        if (context) {
            curContext = this._contexts[context];
        } else {
            curContext = this.context;    
        }
        var count = 0;
        for (var i in curContext._tasks) {
            count++;    
        }
        return count;            
    },
    
    _getDefaultTaskCount: function(context) {
        var curContext = null;
        if (context) {
            curContext = this._contexts[context];
        } else {
            curContext = this.context;    
        }
        var count = 0;
        for (var i in curContext._tasks) {
            if (curContext._tasks[i].isDefault) {
                count++;    
            }
        }
        return count;            
    },      
    
    _getChildTaskCount: function(parent) {
        var count = 0;
        for (var i in parent.children) {
            count++;    
        }             
        return count;       
    },
    
    _getFirstChildTask: function(parent) {
        for (var i in parent.children) {
            var t = parent.children[i];
            if (t) {
                return t;  
            }   
        }                 
    }
});
