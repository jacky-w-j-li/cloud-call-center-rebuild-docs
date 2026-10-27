dojo.provide("icallcenter.ajaxRequest");

dojo.require("icallcenter.xhr");

icallcenter.ajaxRequest._defaultContentType = "application/x-www-form-urlencoded";


dojo.declare("icallcenter.ajaxRequest", null, {
    
    _ioArgs: null,
	
	_isComplete: false,
  
    constructor: function(args, xhr) {                
        this._ioSetArgs(args);       
		if (xhr) {   
        	console.debug("使用自定义的xhr[%s]", args.url);	
			this._ioArgs.xhr = xhr;
		} else {
			this._ioArgs.xhr = icallcenter.xhr.loadXhr();
		}                            
    },
    
    doGet: function() {    
		dojo._ioAddQueryToUrl(this._ioArgs);         
        this._doIt("GET");
    },
    
    doPost: function() {
        console.debug("query[%s]", this._ioArgs.query);
        this._doIt("POST");                
    },
    
    _onStateChange: function(){    
        if (this._ioCheck()) {
            if (dojo._isDocumentOk(this._ioArgs.xhr)) {
                this._xhrOk();            
			} else {
                console.debug("错误消息代码[%s][%s]", this._ioArgs.xhr.status, this._ioArgs.url);
				this._isComplete = true;
				var args = this._ioArgs.args;
				var er = args.error;
				if (er && dojo.isFunction(er)) {
					er.call(args, "bad request", this._ioArgs);
				}
			}
        }        
    },
    
	_ioSetArgs: function(/*dojo.__ioArgs*/args){

		var ioArgs = {args: args, url: args.url};
        
		var formObject = null;
		if(args.form){ 
			var form = dojo.byId(args.form);
			var actnNode = form.getAttributeNode("action");
			ioArgs.url = ioArgs.url || (actnNode ? actnNode.value : null); 
			formObject = dojo.formToObject(form);
		}

		var miArgs = [{}];
	
		if(formObject){
			miArgs.push(formObject);
		}
		if(args.content){
			miArgs.push(args.content);
		}
		if(args.preventCache){
			miArgs.push({"dojo.preventCache": new Date().valueOf()});
		}
		ioArgs.query = icallcenter.common.objectToQuery(dojo.mixin.apply(null, miArgs));
		//alert(ioArgs.query);
		ioArgs.handleAs = args.handleAs || "text";
		
		this._ioArgs = ioArgs;
	},
	
	_xhrCancel: function() {
	    var xhr = this._ioArgs.xhr;
		var _at = (typeof xhr.abort);
		if((_at == "function")||(_at == "unknown")){
			xhr.abort();
			this._ioArgs.xhr = null;
		}
		var err = new Error("xhr cancelled");
		err.dojoType = "cancel";
		return err;
	},
	
	_xhrOk: function(){
		this._isComplete = true;
		var value = dojo._contentHandlers[this._ioArgs.handleAs](this._ioArgs.xhr);
		var args = this._ioArgs.args;
		var ld = args.load;
		if(ld && dojo.isFunction(ld)){
            ld.call(args, value, this._ioArgs);
		}		
	},

	_xhrTimeout: function() {
	    if (this._tHandler) {
		    window.clearTimeout(this._tHandler);
	    }
		if (!this._isComplete) {
		    var value = "";
			var args = this._ioArgs.args;
			var er = args.error;
			if (er && dojo.isFunction(er)) {
				args.isTimeout = true;
				er.call(args, value, this._ioArgs);
			}
		}
	},
	
	_doIt: function(/*String*/method){
	    var self = this;
		var ioArgs = this._ioArgs;
		var args = ioArgs.args;
		if (args.timeout) {
		    this._tHandler = window.setTimeout(function() {
					self._xhrTimeout();			
				}, args.timeout);

		}
		ioArgs.xhr.open(method, ioArgs.url, args.sync !== true, args.user || undefined, args.password || undefined);
		ioArgs.xhr.onreadystatechange = function() {
            self._onStateChange.call(self);    
        };
       
		if(args.headers){
			for(var hdr in args.headers){
				if(hdr.toLowerCase() === "content-type" && !args.contentType){
					args.contentType = args.headers[hdr];
				}else{
					ioArgs.xhr.setRequestHeader(hdr, args.headers[hdr]);
				}
			}
		}		
		ioArgs.xhr.setRequestHeader("Content-Type", (args.contentType || "application/x-www-form-urlencoded"));
	
		try{	
			ioArgs.xhr.send(ioArgs.query);
		}catch(e){
			this._xhrCancel.cancel();
		}
	},
	
	_ioCheck: function(){
		return 4 == this._ioArgs.xhr.readyState; //boolean
	}		
});

