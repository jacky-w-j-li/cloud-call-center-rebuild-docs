dojo.provide("icallcenter.callsheet");
dojo.require("icallcenter.common");

icallcenter.callsheet._opener = null;

icallcenter.callsheet.previousNextVO = null;

icallcenter.callsheet.addBlackNum = function(callNo){
	var form1 = {blackNum:callNo};
	request = {
							url: "./service/blackNumService/insert",
							params: [form1] ,
							messager: "icc.public.message",
							successMsg: "添加黑名单成功",
							errorMsg: "提交黑名单出错"        
	};
	icallcenter.common.requestAndRefresh(request);

};

// 通话清单查询
icallcenter.callsheet.searchCallSheet = function(form) {
        var request = {
            url:  "./action/callsheet/query.do",
            form: dojo.byId(form),
            tableWrapper: dojo.byId("icc.callsheet_main.callSheetTable"),
            message:  "查询通话清单出错"      
        }; 
        icallcenter.common.formSearch(request);
};

icallcenter.callsheet.searchForWorkspace = function(form) {
        if (form.keyword.hasValue == "false") {
            form.keyword.value = "";
            form.keyword.hasValue = "true";   
        }
        var request = {
            url:  "./action/callsheet/queryForWorkspace.do",
            form: dojo.byId(form),
            tableWrapper: dojo.byId("icc.callsheet_workspace.callSheetTable"),
            message:  "查询通话清单出错"      
        }; 
        icallcenter.common.formSearch(request);	
};

//查看上一个通话清单
icallcenter.callsheet.previousView = function(idx){
	this.previousNextVO.currentNum --;
	this.viewCallSheet(this.previousNextVO.previousNextIds[idx-2]);
};

//查看下一个通话清单
icallcenter.callsheet.nextView = function(idx){
	this.previousNextVO.currentNum ++;
	this.viewCallSheet(this.previousNextVO.previousNextIds[idx]);
};

//显示通话清单
icallcenter.callsheet.viewCallSheet = function(callSheetId){    
    var queryVO = tm.getParameter("queryVO");
    if (queryVO == null) {
        queryVO = dojo.fromJson(dojo.byId("icc.callsheet_main.callSheetTable").childNodes[1].childNodes[0].innerHTML);
        tm.setParameter("queryVO", queryVO);
    } 
	var self = this;
	var obj = {
        callSheetId: callSheetId,
        previousNextVO: self.previousNextVO,
        queryVO: queryVO,
        current: self.previousNextVO == null ? icallcenter.taglib.Pagination.getCurrentPageNum('icc.callsheet_main.callSheetTable') : self.previousNextVO.beginPage
    };
	tm.redirectTask(null,'./action/callsheet/view.do', obj);
};

icallcenter.callsheet.returnToMain = function() {
    // 需要清空查询列表
    icallcenter.callsheet.previousNextVO = null;
    var queryVO = tm.getParameter("queryVO");
    var obj = {
        queryVO: queryVO,
        previousNextVO: null
    };
    tm.setParameter("queryVO", null);
	tm.redirectTask(null,'./action/callsheet/main.do', obj);
};

icallcenter.callsheet.onViewLoad = function(jsonStr) {
	this.previousNextVO = dojo.fromJson(jsonStr);
};

// 听取录音文件
icallcenter.callsheet.listenRecord = function(url) {
    var owns = dojo.map(userInfo.functions, function(func) {
        return func.accountFunctionValue;
    });
    dm.showDialog("listenRecordDialog", "听取录音", "./action/callsheet/listenRecord.do?url=" + url, {width:'365px',height:'95px'}); 	    
};

// 下载录音文件
icallcenter.callsheet.downloadRecord = function(filePath, fileName) {
    var owns = dojo.map(userInfo.functions, function(func) {
        return func.accountFunctionValue;
    });
    var url = "./action/service/download.do?filePath=" + filePath + "&fileName=" + fileName;
    window.location.href = "http://10.8.66.30:8008/monitor/remote/10.8.66.32/20090706/20090706-203029_29001509_29001510_ss-test-003-1246883429.126.mp3";
//    window.open();
};

// 通话清单导出
icallcenter.callsheet.callSheetExport = function(form) { 	
   	var request = {
		url:  "./service/exportService/callsheetExport",
		params: [dojo.formToObject(dojo.byId(form)) ],
		onLoad: function(response) 
		{
				var path ="./export/export/" + userInfo.accountId+"/exportData/"+response+".xls"; 			 	
			 	window.open( path);
		},
        messager: "icc.business_callSheet_addMessage",
		message:  "导出通话清单出错"      
    };
    icallcenter.common.request(request);
};

icallcenter.callsheet.listenRecordOnClose = function(){
	if (player && player.controls){
		player.controls.stop();
	}
};

// 载入通话清单列表页面

icallcenter.callsheet.onLoaded = function(param, connectors) {
	
var evtHandler = dojo.connect(dojo.byId("icc.callsheet_main.btnSearch"), "onclick", function() {
		
	icallcenter.callsheet.searchCallSheet('icc.callsheet_main.callSheetForm');	
	
	});
	
	connectors.push(evtHandler);
	
	evtHandler = dojo.connect(dojo.byId("icc.callsheet_main.btnReset"), "onclick", function() {
        
	dojo.byId('icc.callsheet_main.callSheetForm').reset();
	});
	connectors.push(evtHandler);	
	
	eventHandler = dojo.connect(dojo.byId("icc.callsheet_main.btnOfferingTimeTo"), "onclick", function() {
	    
	var btn = dojo.byId("icc.callsheet_main.btnOfferingTimeTo");
	    
	Calendar.selectTime(btn, "",null,"end");
	
	});
	connectors.push(evtHandler);
	
	dojo.connect(dojo.byId("icc.callsheet_main.btnOfferingTimeFrom"), "onclick", function() {
	    
	var btn = dojo.byId("icc.callsheet_main.btnOfferingTimeFrom");	    
	    
	Calendar.selectTime(btn, "",null,"start");
	});	
	
	connectors.push(evtHandler);        
	
	 
	evtHandler =	dojo.connect(dojo.byId("icc.callsheet_main.btnCallSheetExport"), "onclick", function() {	    
	  
	icallcenter.callsheet.callSheetExport("icc.callsheet_main.callSheetForm");
	});	
	
	connectors.push(evtHandler);  
	var owns = dojo.map(userInfo.functions, function(func) {
        return func.accountFunctionValue;
    });
	if (dojo.indexOf(owns, "agent.exportCallsheet") >= 0) {
       dojo.byId("icc.callsheet_main.btnCallSheetExport").style.display = ''; 	    
    } 

	};

