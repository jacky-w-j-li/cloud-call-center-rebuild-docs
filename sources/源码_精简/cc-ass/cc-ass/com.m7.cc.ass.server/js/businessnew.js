dojo.provide("icallcenter.businessnew");
dojo.require("icallcenter.custManage");

icallcenter.businessnew.previousNextVO = null;
icallcenter.businessnew.initAddBusinessDiv = null;

//初始化页面，加载功能
icallcenter.businessnew.toBeDealOnLoad = function(){
	if (dojo.byId("icc.businessnew_worksheet_tobedeal.table").childNodes[1].childNodes[0]){
		var queryString1 = dojo.byId("icc.businessnew_worksheet_tobedeal.table").childNodes[1].childNodes[0].innerHTML;
	  var obj1 = dojo.fromJson(queryString1);
	  icallcenter.common.objectToForm(obj1,dojo.byId("icc.businessnew_worksheet_tobedeal.businessDealSearchForm"));
	}
  this.initAddBusinessDiv = false;
  	var owns = dojo.map(userInfo.functions, function(func) {
        return func.accountFunctionValue;
    });
	if (dojo.indexOf(owns, "agent.exportWorksheet") >= 0) {
       dojo.byId("icc.businessnew_worksheet_tobedeal.btnBusinessSearchExport").style.display = ''; 	    
    } 
};


icallcenter.businessnew.dealedOnLoad = function(){
	if (dojo.byId("icc.businessnew_worksheet_dealed.table").childNodes[1].childNodes[0]){
		var queryString2 = dojo.byId("icc.businessnew_worksheet_dealed.table").childNodes[1].childNodes[0].innerHTML;
	  var obj2 = dojo.fromJson(queryString2);
	  icallcenter.common.objectToForm(obj2,dojo.byId("icc.businessnew_worksheet_dealed.businessDealSearchForm"));  
	}
	var owns = dojo.map(userInfo.functions, function(func) {
        return func.accountFunctionValue;
    });
	if (dojo.indexOf(owns, "agent.exportWorksheet") >= 0) {
       dojo.byId("icc.businessnew_worksheet_dealed.btnBusinessSearchExport").style.display = ''; 	    
    } 
};

icallcenter.businessnew.workSheetViewOnLoad = function(str){
	this.previousNextVO = dojo.fromJson(str);
};

//待办业务记录查询
icallcenter.businessnew.tobedealBusinessSearch = function(form)
{
       var request = {
            url:  "./action/businessnew/toBeDealListQuery.do",
            param: {workSheetRightVOsString: dojo.toJson(userInfo.workflowRights)},
            form: dojo.byId(form),
            tableWrapper: dojo.byId("icc.businessnew_worksheet_tobedeal.table"),
            messager: "icc.public.message",
            message:  "查询业务记录出错"      
        }; 
        icallcenter.common.formSearch(request);         
};

//待办业务记录导出
icallcenter.businessnew.tobedealBusinessExport = function(form)
{
	var obj =icallcenter.common.formToObject(form);
	if(obj.workFlowId=="" || obj.workFlowId==null)
	{
		alert("必须选择业务类型");	
		return false;
	}
	if(obj.temId=="" || obj.temId==null)
	{
		alert("此业务类型没有配置导出模板，请确认！");	
		return false;
	}
	var dataobjectName = dojo.byId(form).workFlowId.valuel;
	obj.workSheetRightVOs = userInfo.workflowRights;
         var request = {
	      url: "./service/exportService/tobedealBusinessExport",       
	    params: [obj],    
	    messager: "icc.public.message",
	     tableWrapper: dojo.byId("icc.businessnew_worksheet_tobedeal.table"),
	    errorMsg: "导出出错",	    
	    onLoad: function(response)
	    {
				var path ="./export/export/" + userInfo.accountId+"/exportData/"+response+".xls"; 			 	
			 	window.open( path);
	    }
	}				
	icallcenter.common.request(request);	
};
//历史业务记录导出
icallcenter.businessnew.exportExcelByVOHistory = function(form)
{
	var obj =icallcenter.common.formToObject(form);
	if(obj.workFlowId=="" || obj.workFlowId==null)
	{
		alert("必须选择业务类型");	
		return false;
	}
	if(obj.temId=="" || obj.temId==null)
	{
		alert("此业务类型没有配置导出模板，请确认！");	
		return false;
	}
	var dataobjectName = dojo.byId(form).workFlowId.valuel;
	obj.workSheetRightVOs = userInfo.workflowRights;
         var request = {
	      url: "./service/exportService/exportExcelByVOHistory",       
	    params: [obj],    
	    messager: "icc.public.message",
	     tableWrapper: dojo.byId("icc.businessnew_worksheet_tobedeal.table"),
	    errorMsg: "导出出错",	    
	    onLoad: function(response)
	    {
				var path ="./export/export/" + userInfo.accountId+"/exportData/"+response+".xls"; 			 	
			 	window.open( path);
	    }
	}				
	icallcenter.common.request(request);	
};
icallcenter.businessnew.businessTypeChange = function(ObjectId,td)
{
		var myTd= dojo.byId(td);
		if(ObjectId==null||ObjectId=='')
		{
				myTd.innerHTML = "<select name='temId'></select>";
				return false;
		}
		var request = {
        url:  "./service/exportTemService/getTemsByObjectId",
        params: [ObjectId],       
        onLoad: function(temList) 
        {  
  	         
		        	//把选项的给拼装成<option>的html
		        	var optionHtml="";
					
		        	for(i=0;i<temList.length;i++)
		        	{
		        		optionHtml+="<option value = '"+temList[i].temId+"'     >"+temList[i].temName+"</option>";		        			
		        	}
		        	optionHtml ="<select name='temId'>"+optionHtml+"</select>";
			       	
					myTd.innerHTML=  optionHtml;
			  				

         		
        }
     };
  icallcenter.common.formLoad(request);	 
};
//工作台查询
icallcenter.businessnew.searchForWorkspace = function(form){
	if (form.keyWord.value == "请输入主叫号码或客户名称") {
            form.keyWord.value = "";
  }
        
	var request = {
            url:  "./action/businessnew/workspaceListQuery.do",
            form: dojo.byId(form),
            tableWrapper: dojo.byId("icc.businessnew_workspace_main.workSheetTable"),
            messager: "icc.public.message",
            message:  "查询业务记录出错"      
        }; 
        icallcenter.common.formSearch(request);         
};
//历史业务记录查询
icallcenter.businessnew.dealedBusinessSearch = function(form){	
       var request = {
            url:  "./action/businessnew/dealedListQuery.do",
            form: dojo.byId(form),
            tableWrapper: dojo.byId("icc.businessnew_worksheet_dealed.table"),
            messager: "icc.public.message",
            message:  "查询业务记录出错"      
        }; 
        icallcenter.common.formSearch(request);         
};

//打开查看界面
icallcenter.businessnew.preViewBusiness = function(workSheetId,pageType,entryType){
	var self=this;
	var str = pageType == 'tobedeal'? "icc.businessnew_worksheet_tobedeal.table":"icc.businessnew_worksheet_dealed.table";
	var obj = {
								workSheetId: workSheetId,
								pageType: pageType,
								queryString: dojo.byId(str).childNodes[1].childNodes[0].innerHTML,
								workSheetRightVOsString: dojo.toJson(userInfo.workflowRights),
								queryVO: dojo.fromJson(dojo.byId(str).childNodes[1].childNodes[0].innerHTML),
								current: self.previousNextVO == null ? icallcenter.taglib.Pagination.getCurrentPageNum(str) : self.previousNextVO.beginPage
						};
	tm.redirectTask(null,'./action/businessnew/preViewWorkSheet.do?entryType='+entryType,obj);
};

//工作台打开处理界面
icallcenter.businessnew.preDealBusinessWorkSpace = function(workSheetId){
	var url = "./action/businessnew/preViewWorkSheet.do?entryType=workspaceDeal&pageType=tobedeal&workSheetId="+workSheetId;
	tm_sub.popupTask("deal_business_"+workSheetId,"处理业务", "deal_business",'account.agent.workspace_rightpane', url,null, null,null, false);
}

//工作台打开查看界面
icallcenter.businessnew.preViewBusinessWorkSpace = function(workSheetId){
	tm_sub.popupTask("view_business_"+workSheetId,"查看业务", "view_business", 'account.agent.workspace_rightpane', './action/businessnew/preViewWorkSheet.do?entryType=workspace&pageType=workspaceView&workSheetId='+workSheetId,null, null,null, false);					
};

//弹出业务单详细信息
icallcenter.businessnew.popupViewBusiness = function(workSheetId){
			ddl.showLayer("_businessInfo",488,583,0,0,"业务信息","",'./action/businessnew/preViewWorkSheet.do?entryType=workspace&pageType=workspaceView&workSheetId='+workSheetId);
};

//打开高级查询界面
icallcenter.businessnew.popupBusinessAdvSearch = function(pageType){
	dm.showDialog("advSearchWorkSheetDialog", "业务记录高级查询", "./action/businessnew/preAdvSearch.do?pageType="+pageType, {width:650,height:430});
};

//加载业务查询模板
icallcenter.businessnew.loadBusinessSheetSearchTemplate = function(){
    var sltWorkFlowId = dojo.byId('icc.businessnew_worksheet_advSearch.workFlowId');    
    var workFlowId = sltWorkFlowId.value;
    var widget = dojo.byId("icc.businessnew_worksheet_advSearch.workSheetSearchDIV");    
    icallcenter.common.removeChild(widget);
    if (workFlowId != "") {
        var url = './action/businessnew/getSearchPage.do?dataObjectId=' + workFlowId;
        jtm.loadTemplate(url, widget, null);        
    }    	
};

//高级查询
icallcenter.businessnew.advBusinessSearch = function(form,pageType){
	if (pageType == 'tobedeal'){
		this.tobedealBusinessSearch(form);
	}else{
		this.dealedBusinessSearch(form);
	}
	dm.closeDialog();
};
//高级查询的导出
icallcenter.businessnew.advBusinessExport = function(form,pageType){
	var retun;
	if (pageType == 'tobedeal'){
		retun = this.tobedealBusinessExport(form);
	}else{
		retun = this.exportExcelByVOHistory(form);
	}
	if(!retun==false)
	{
		dm.closeDialog();
	}
};
//高级查询的onload
icallcenter.businessnew.advBusinessOnload = function(){
		var owns = dojo.map(userInfo.functions, function(func) {
        return func.accountFunctionValue;
    });
    if (dojo.indexOf(owns, "agent.exportWorksheet") >= 0) {
       dojo.byId("icc.businessnew_worksheet_dealed.advExport").style.display = ''; 	    
    }
};
icallcenter.businessnew.previousViewBusiness = function(idx,pageType,entryType){
	this.previousNextVO.currentNum --;
	this.previousNextViewBusiness(this.previousNextVO.previousNextIds[idx-2],pageType,entryType);
};

icallcenter.businessnew.nextViewBusiness = function(idx,pageType,entryType){
	this.previousNextVO.currentNum ++;
	this.previousNextViewBusiness(this.previousNextVO.previousNextIds[idx],pageType,entryType);
};

icallcenter.businessnew.previousNextViewBusiness = function(workSheetId,pageType,entryType){
	var self = this;
	var str = "icc.business_worksheet_view_"+entryType+".data";
	var obj = {
								workSheetId: workSheetId,
								pageType: pageType,
								queryString: dojo.byId(str).childNodes[0].innerHTML,
								workSheetRightVOsString: dojo.toJson(userInfo.workflowRights),
								queryVO: dojo.fromJson(dojo.byId(str).childNodes[0].innerHTML),
								previousNextVO: self.previousNextVO
						};
	tm.redirectTask(null,'./action/businessnew/preViewWorkSheet.do?entryType='+entryType,obj);
};

//保存备注
icallcenter.businessnew.insertRemark = function(workSheetId,entryType){
	var remark = dojo.byId("remark_view_"+workSheetId+"_"+entryType).remark.innerHTML;
	
	if (remark == "" || remark.length > 650 ){
    alert("请填写备注，长度不能超过650个汉字!");
    return false;
  }

  var request = {
	    url: "./service/workSheetRemarkService.new/insert",
	    params: [remark,workSheetId],
	    messager: "icc.public.message",
	    tableWrapper: dojo.byId("icc.businessnew_worksheet_tobedeal.table"),
	    errorMsg: "保存备注信息出错",
	    successMsg: "保存备注信息成功",
	    onLoad: function(){
	    			if (entryType == 'workSheetManage'){
	    				tm.refresh();
	    			}else if (entryType == 'workspace' || entryType == 'workspaceDeal'){
	    				dojo.byId("remark_view_"+workSheetId+"_"+entryType).remark.innerHTML = "";
	    				icallcenter.businessnew.fillRemarkList(workSheetId,dojo.byId("icc.businessnew_worksheet_view_baseinfo_"+entryType+"_"+workSheetId+".remarklist"));
	    			}
	    }
	}				
	icallcenter.common.request(request);	
};

//填充备注内容列表
icallcenter.businessnew.fillRemarkList = function(workSheetId,listNode){
      icallcenter.common.showLoadingTableForStruts(listNode);
	    var kw = {
					        url: "./action/businessnew/remarkListQuery.do?workSheetId="+workSheetId,
					        handleAs: "text",
					        content: {current:1,pageSize:10},
									preventCache: true,		        
					        load: function(response, ioArgs) {
					        	if (response != "QueryError"){
					             icallcenter.common.removeChild(dojo.byId(listNode));
					             dojo.byId(listNode).innerHTML = response;
					             dojo.byId(listNode).style.display = "";
					          }else{
					          	this.error();
					          }
					        },
					        error: function(responseObj, ioArgs)
					        {							
												dojo.publish("icc.public.message", [ 
											    { message: "查询出错",
												  type: "error", 
												  duration: 0
												}]);		
					        }
							};
    var ajaxRequest = new icallcenter.ajaxRequest(kw);   
    ajaxRequest.doPost();	
};

//返回主查询界面
icallcenter.businessnew.returnToMain = function(queryString,pageType){
	if (pageType == 'tobedeal'){
		var obj = {queryVO1: dojo.fromJson(queryString),pageType:pageType};
	}else{
		var obj = {queryVO2: dojo.fromJson(queryString),pageType:pageType};
	}
	obj.workSheetRightVOsString = dojo.toJson(userInfo.workflowRights);
	tm.redirectTask(null,'./action/businessnew/main.do',obj);
};

icallcenter.businessnew.businessAddDivDisplayClick = function(id){
  dojo.byId(id).style.display = '';
  if (dojo.byId(id).childNodes[0].childNodes[0].hasChildNodes()){
    dojo.byId(id).childNodes[0].childNodes[0].childNodes[0].childNodes[0].click();
  }else {
    alert("没有启用的业务流程！");
  }
};

//新增业务单保存
icallcenter.businessnew.workSheetAddSave = function(id,dataObjectId,entryType){
	if (!fv.Validate(dojo.byId(id+"_workSheet_"+dataObjectId+"_vo_"+entryType))) return;
	if (!fv.Validate(dojo.byId(id+"_workSheet_"+dataObjectId+"_remark_"+entryType))) return;
	if (!fv.Validate(dojo.byId(id+"_workSheet_"+dataObjectId+"_customerVO_"+entryType))) return;
	
	var workSheetVO = icallcenter.common.formToObject(dojo.byId(id+"_workSheet_"+dataObjectId+"_vo_"+entryType),false);
	var remarkVO = icallcenter.common.formToObject(dojo.byId(id+"_workSheet_"+dataObjectId+"_remark_"+entryType),false);
	workSheetVO.customer = icallcenter.common.formToObject(dojo.byId(id+"_workSheet_"+dataObjectId+"_customerVO_"+entryType),false);
	
	var self = this;
  var request = {
	    url: "./service/workSheetService.new/insertSave",
	    params: [workSheetVO,remarkVO],    
	    messager: "icc.public.message",
	    tableWrapper: dojo.byId("icc.businessnew_worksheet_tobedeal.table"),
	    errorMsg: "保存业务记录出错",
	    successMsg: "保存业务记录成功",
	    onLoad: function(workSheetId){
	    			if (entryType == 'workspace'){
	    				tm_sub.closeTask();
	    				if (dojo.byId("icc.businessnew_worksheet_dealed.table")){
	    					icallcenter.taglib.Pagination.refresh(dojo.byId("icc.businessnew_worksheet_dealed.table"));
	    				}
	    				if (workSheetVO.callSheetId && workSheetVO.customerId){
	    					callProcessor.updateCustomer(workSheetVO.callSheetId,workSheetVO.customerId);
	    				}
	    			}else if (entryType == 'workSheetManage'){
	    				dojo.byId(id+"_icc.business_worksheet_add_"+entryType+".data").childNodes[1].click();
	    			}
				if (phone && phone.callObject){
					if (!phone.callObject.data){
						phone.callObject.data = {};
					}
					phone.callObject.data.workSheetId = workSheetId;	
					phone.setWorkSheetID(workSheetId);
				}
	    }
	}				
	icallcenter.common.requestAndRefresh(request);
};

//开始处理业务单
icallcenter.businessnew.startToDeal = function(workSheetId,node,workSheetOrderNum,entryType){
  var request = {
	    url: "./service/workSheetService.new/getCurrentMaxOrderNumByWorkSheetId",
	    params: [workSheetId],    
	    messager: "icc.public.message",
	    errorMsg: "开始处理业务记录出错",
	    onLoad: function(result){
	    			if (result != workSheetOrderNum){
	    				icallcenter.taglib.TabPane.selectLoad("icc.businessnew_worksheet_view_tab_"+entryType,0);
	    			}
	    			  var request = {
						    url: "./service/workSheetService.new/updateStartToDeal",
						    params: [workSheetId,userInfo.workflowRights],    
						    messager: "icc.public.message",
						    tableWrapper: dojo.byId("icc.businessnew_worksheet_tobedeal.table"),
						    errorMsg: "开始处理业务记录出错",
						    onLoad: function(){
						    	
							    var kw = {
							        url: "./action/businessnew/getWorkSheetCanDealActions.do?workSheetId="+workSheetId+"&entryType="+entryType,
							        handleAs: "text",
							        content: null,
											preventCache: true,		        
							        load: function(response, ioArgs) {
							             icallcenter.common.removeChild(node.parentNode.nextSibling.nextSibling);
							             dojo.byId(node.parentNode.nextSibling.nextSibling).innerHTML = response;
						    					node.parentNode.style.display = 'none';
						    					node.parentNode.nextSibling.style.display = '';
							             dojo.byId(node.parentNode.nextSibling.nextSibling).style.display = "";
							        },
							        error: function(responseObj, ioArgs)
							        {							
														dojo.publish("icc.public.message", [ 
													    { message: "查询动作出错",
														  type: "error", 
														  duration: 0
														}]);		
							        }
									};
							    var ajaxRequest = new icallcenter.ajaxRequest(kw);   
							    ajaxRequest.doPost();	
						    }
						}				
						icallcenter.common.request(request);	
	    }
	}				
	icallcenter.common.request(request);
		

};

//业务单解锁
icallcenter.businessnew.unlock = function(workSheetId,node){
  var request = {
	    url: "./service/workSheetService.new/updateUnlock",
	    params: [workSheetId],    
	    messager: "icc.public.message",
	    tableWrapper: dojo.byId("icc.businessnew_worksheet_tobedeal.table"),
	    errorMsg: "业务记录解锁出错",
	    onLoad: function(){
	    	node.parentNode.style.display = 'none';
	    	node.parentNode.nextSibling.style.display = 'none';
	    	node.parentNode.previousSibling.style.display = '';
	    }
	}				
	icallcenter.common.request(request);	
};

//弹出业务单处理编辑页面
icallcenter.businessnew.popupDealEditPage = function(stepActionId,stepName,workSheetId,entryType,stepId){
	var request = {
	    url: "./service/workSheetService.new/canDealAction",
	    params: [stepActionId,stepId],    
	    errorMsg: "处理业务记录出错",
	    onLoad: function(result){
	    	if (result == true){
					dm.showDialog("businessnew_workflow_deal", stepName, "./action/businessnew/getActionEdit.do?workSheetId="+workSheetId+"&stepActionId="+stepActionId+"&entryType="+entryType+"&stepId="+stepId, {width:'850',height:'500'});
	    	}else{
	    		alert("您没有执行该动作的权限！");
	    		
	    	}
	    }
	}				
	icallcenter.common.request(request);
}

//业务单更新保存页面
icallcenter.businessnew.workSheetUpdateSave = function(id,dataObjectId,entryType){
	if (id != null){
		id = id + "_";
	}else{
		id = "";
	}
	if (!fv.Validate(dojo.byId(id+"workSheet_"+dataObjectId+"_vo_"+entryType))) return;
	if (!fv.Validate(dojo.byId(id+"workSheet_"+dataObjectId+"_remark_"+entryType))) return;
	
	if (dojo.byId(id+"workSheet_"+dataObjectId+"_customerVO_"+entryType)){
		if (!fv.Validate(dojo.byId(id+"workSheet_"+dataObjectId+"_customerVO_"+entryType))) return;
	}
	
	var workSheetVO = icallcenter.common.formToObject(dojo.byId(id+"workSheet_"+dataObjectId+"_vo_"+entryType),false);
	var remarkVO = icallcenter.common.formToObject(dojo.byId(id+"workSheet_"+dataObjectId+"_remark_"+entryType),false);
	
	if (dojo.byId(id+"workSheet_"+dataObjectId+"_customerVO_"+entryType)){
		workSheetVO.customer = icallcenter.common.formToObject(dojo.byId(id+"workSheet_"+dataObjectId+"_customerVO_"+entryType),false);
	}
	
	var self = this;
  var request = {
	    url: "./service/workSheetService.new/updateSave",
	    params: [workSheetVO,remarkVO],    
	    messager: "icc.public.message",
	    tableWrapper: dojo.byId("icc.businessnew_worksheet_tobedeal.table"),
	    errorMsg: "保存业务记录出错",
	    successMsg: "保存业务记录成功",
	    onLoad: function(){
	    			if (entryType == 'workspace'){
	    				tm_sub.closeTask();
	    			}else if (entryType == 'workSheetManage'){
	    				dm.closeDialog();
	    				tm.context._param.previousNextVO = self.previousNextVO;
	    				tm.refresh();
	    			}else if (entryType == 'workspaceDeal'){
					dm.closeDialog();
					tm_sub.closeTask();
				}
	    }
	}				
	icallcenter.common.request(request);
};

//业务单更新提交页面
icallcenter.businessnew.workSheetUpdateGo = function(id,dataObjectId,entryType,stepActionId){
	if (id != null){
		id = id + "_";
	}else{
		id = "";
	}
	if (!fv.Validate(dojo.byId(id+"workSheet_"+dataObjectId+"_vo_"+entryType))) return;
	if (!fv.Validate(dojo.byId(id+"workSheet_"+dataObjectId+"_remark_"+entryType))) return;
	
	if (dojo.byId(id+"workSheet_"+dataObjectId+"_customerVO_"+entryType)){
		if (!fv.Validate(dojo.byId(id+"workSheet_"+dataObjectId+"_customerVO_"+entryType))) return;
	}
	
	var workSheetVO = icallcenter.common.formToObject(dojo.byId(id+"workSheet_"+dataObjectId+"_vo_"+entryType),false);
	var remarkVO = icallcenter.common.formToObject(dojo.byId(id+"workSheet_"+dataObjectId+"_remark_"+entryType),false);
	
	if (dojo.byId(id+"workSheet_"+dataObjectId+"_customerVO_"+entryType)){
		workSheetVO.customer = icallcenter.common.formToObject(dojo.byId(id+"workSheet_"+dataObjectId+"_customerVO_"+entryType),false);
	}
	
	var self = this;
  var request = {
	    url: "./service/workSheetService.new/updateGo",
	    params: [workSheetVO,remarkVO,stepActionId],    
	    messager: "icc.public.message",
	    tableWrapper: dojo.byId("icc.businessnew_worksheet_tobedeal.table"),
	    errorMsg: "处理业务记录出错",
	    successMsg: "处理业务记录成功",
	    onLoad: function(){
	    			if (entryType == 'workspace'){
	    				tm_sub.closeTask();
	    			}else if (entryType == 'workSheetManage'){
                        
	    				dm.closeDialog();
	    				var div = dojo.byId("icc.businessnew_worksheet_view_"+entryType);
	    				div.innerHTML = '<div style="height:100px;margin-top:40px" align="center">您的操作已经成功！<input type="button" value="查看该业务单当前信息" class="button_style" onclick="tm.context._param.previousNextVO = icallcenter.businessnew.previousNextVO;tm.refresh();"/></div>';
							dojo.byId("icc.business_worksheet_view_"+entryType+".data").previousSibling.style.display = 'none';
							dojo.byId("icc.business_worksheet_view_"+entryType+".data").previousSibling.previousSibling.style.display = 'none';
	    				//tm.context._param.previousNextVO = self.previousNextVO;
	    				//tm.refresh();
	    			}else if (entryType == 'workspaceDeal'){
					dm.closeDialog();
					tm_sub.closeTask();
				}
	    }
	}				
	icallcenter.common.request(request);
};

//业务单新增并转入
icallcenter.businessnew.workSheetAddGo = function(id,dataObjectId,stepActionId,entryType){
	if (!fv.Validate(dojo.byId(id+"_workSheet_"+dataObjectId+"_vo_"+entryType))) return;
	if (!fv.Validate(dojo.byId(id+"_workSheet_"+dataObjectId+"_remark_"+entryType))) return;
	if (!fv.Validate(dojo.byId(id+"_workSheet_"+dataObjectId+"_customerVO_"+entryType))) return;
	
	var workSheetVO = icallcenter.common.formToObject(dojo.byId(id+"_workSheet_"+dataObjectId+"_vo_"+entryType),false);
	var remarkVO = icallcenter.common.formToObject(dojo.byId(id+"_workSheet_"+dataObjectId+"_remark_"+entryType),false);
	workSheetVO.customer = icallcenter.common.formToObject(dojo.byId(id+"_workSheet_"+dataObjectId+"_customerVO_"+entryType),false);
	
	var self = this;
  var request = {
	    url: "./service/workSheetService.new/insertGo",
	    params: [workSheetVO,remarkVO,stepActionId],    
	    messager: "icc.public.message",
	    tableWrapper: dojo.byId("icc.businessnew_worksheet_tobedeal.table"),
	    errorMsg: "处理业务记录出错",
	    successMsg: "处理业务记录成功",
	    onLoad: function(workSheetId){
	    			if (entryType == 'workspace'){
	    				tm_sub.closeTask();
	    				if (dojo.byId("icc.businessnew_worksheet_dealed.table")){
	    					icallcenter.taglib.Pagination.refresh(dojo.byId("icc.businessnew_worksheet_dealed.table"));
	    				}
	    				if (workSheetVO.callSheetId && workSheetVO.customerId){
	    					callProcessor.updateCustomer(workSheetVO.callSheetId,workSheetVO.customerId);
	    				}
	    			}else if (entryType == 'workSheetManage'){
	    				dojo.byId(id+"_icc.business_worksheet_add_"+entryType+".data").childNodes[1].click();
	    			}
				if (phone && phone.callObject && phone.callObject.data){
					phone.callObject.data.workSheetId = workSheetId;
					phone.setWorkSheetID(workSheetId);
				}
	    }
	}				
	icallcenter.common.requestAndRefresh(request);
};

icallcenter.businessnew.returnToOriginMain = function(){
	  tm.redirectTask(null,'./action/businessnew/main.do?pageType=tobedeal',{workSheetRightVOsString:dojo.toJson(userInfo.workflowRights)});
};

//选择客户
icallcenter.businessnew.selectCustomer = function(customerId,customerVOString,originalString,customerType){
	if (tm_sub.task){
		var node = dojo.query("div[flag='workSheet_customerVO_workspace']", tm_sub.task._widget.domNode);
		if (node[0]){
		    var param = null;
		    if (phone) {
		        param = {callObject:phone.callObject};    
		    }
            icallcenter.custManage.loadCustomerInc(customerId,node[0],'edit',customerVOString,customerType,param);
            if (node[0].onload){
                    if ( customerId == null &&  !(customerVOString == null) ){
                            if (dojo.fromJson(originalString).customerId){
                                    customerId = dojo.fromJson(originalString).customerId;
                            }
                    }
                    if (customerId){
                            //icallcenter.order.addCustomerAddressee(customerId,'icc.order_add_customerAddresseeArea');
                            eval(node[0].onload);
                    }
            }
		}
	}
};

icallcenter.businessnew.selectCustomerForTY = function(reserve1){
	if (tm_sub.task){
		var node = dojo.query("div[flag='workSheet_customerVO_workspace']", tm_sub.task._widget.domNode);
		var vo = null;
		dojo.forEach(icallcenter.custManage.customerVOsForTY,function(customerVO){
			if (customerVO.reserve1 == reserve1){
				vo = customerVO;
			}
		});
		var url = "./action/customer/loadForTY.do?mode=edit&customerVOString="+icallcenter.common.EncodeUtf8(dojo.toJson(vo));
	  jtm.loadTemplate(url, node[0], null);   
	} 
};

icallcenter.businessnew.addBusinessDivDisplay = function(id){
	if (!this.initAddBusinessDiv){
		this.adjustDivPosition(dojo.byId(id));
		this.initializeBusinessAddDivData(id);
		this.initAddBusinessDiv = true;
	}
	dojo.byId(id).style.display = '';
};

//初始化业务表单按钮层数据
icallcenter.businessnew.initializeBusinessAddDivData = function(id){
	var div = dojo.byId(id);
	var tbody = div.childNodes[0].childNodes[0];
	icallcenter.common.removeChild(tbody);
	dojo.forEach(userInfo.creatableWorkflows,function(dataObjectId){
		var tr = document.createElement("tr");
		tbody.appendChild(tr);
		var td = document.createElement("td");
		td.setAttribute("align","left");
		dojo.addClass(td,"itemh");
		td.onmouseover = new Function("this.className ='hover';");
		td.onmouseout = new Function("this.className ='itemh';");
		td.onclick = new Function("icallcenter.businessnew.redirectWorkSheetCreate('"+dataObjectId+"');");
		td.innerHTML = "<nobr style='color: #000066;text-overflow:ellipsis;width:100%;overflow:hidden;white-space:nowrap'>"+userDic.getNameOrCode("WORKFLOW_TYPE",dataObjectId)+"</nobr>";
		td.setAttribute("title",userDic.getNameOrCode("WORKFLOW_TYPE",dataObjectId));
		tr.appendChild(td);
	});
	div.style.display = "";
	tbody.style.display = "";
	div.childNodes[1].style.height = dojo.marginBox(div).h+"px";	
};

icallcenter.businessnew.redirectWorkSheetCreate = function(dataObjectId){
	var str = "icc.businessnew_worksheet_tobedeal.table";
	var obj = {
								pageType: "tobedeal",
								queryString: dojo.byId(str).childNodes[1].childNodes[0].innerHTML
						};
	tm.redirectTask(null,"./action/businessnew/preAddWorkSheet.do?dataObjectId="+dataObjectId+"&entryType=workSheetManage",obj);
};

icallcenter.businessnew.redirectWorkSheetReCreate = function(refWorkSheetId){
	var str = "icc.businessnew_worksheet_dealed.table";
	var obj = {
								pageType: "dealed",
								queryString: dojo.byId(str).childNodes[1].childNodes[0].innerHTML
						};
						
	tm.redirectTask(null,"./action/businessnew/preAddWorkSheet.do?refWorkSheetId="+refWorkSheetId+"&entryType=workSheetManage",obj);
};

icallcenter.businessnew.popupWorkSheetReSent = function(workSheetId,pageType){
	dm.showDialog("business_sheet_resent", "业务记录改派", "./action/businessnew/preReSentWorkSheet.do?workSheetId="+workSheetId+"&pageType="+pageType, {width:400,height:120});
};

icallcenter.businessnew.workSheetResent = function(form,pageType){
	if (dojo.byId(form).currentHandler.value == ""){
    alert("请选择改派人，把当前业务记录分派给其处理！");
    return;
  }
  var request = {
      url: "./service/workSheetService.new/updateResent",
      messager: "icc.public.message",
      params: [icallcenter.common.formToObject(dojo.byId(form), true)],
      errorMsg: "改派业务记录出错",
      successMsg: "改派业务记录成功",
      tableWrapper: pageType == 'tobedeal'? "icc.businessnew_worksheet_tobedeal.table":"icc.businessnew_worksheet_dealed.table",
      onError: function(){
						icallcenter.taglib.Pagination.refresh(pageType == 'tobedeal'? "icc.businessnew_worksheet_tobedeal.table":"icc.businessnew_worksheet_dealed.table");
				}
  };
  icallcenter.common.requestAndRefresh(request);
  
  dm.closeDialog();
};

//转接业务单时的动作，包括重设当前处理人，打开处理页面，关联通话清单
icallcenter.businessnew.transferWorkSheet = function(userId,workSheetId){
	var callSheetId = "";
	if (phone && phone.callObject && phone.callObject.data && phone.callObject.data.callSheetId){
		callSheetId = phone.callObject.data.callSheetId;
	}
	var request = {
		url: "./service/workSheetService.new/transferWorkSheet",
		params: [{"currentHandler":"","workSheetId":workSheetId},callSheetId],
		onLoad: function(result){
			if (result != "-1"){
				icallcenter.businessnew.preDealBusinessWorkSpace(workSheetId);
			}
		},
		onError: function(){
		}
	}
	icallcenter.common.request(request);
}

//判断增加业务表单按钮层显示位置
icallcenter.businessnew.adjustDivPosition = function(obj,width){
		var t,l,w,h,r;
		if(obj){
			if(window.event){
				var srcElement = window.event.srcElement;
				if(srcElement){
					t = srcElement.offsetTop;
					l = srcElement.offsetLeft;
					w = srcElement.offsetWidth;
					h = srcElement.offsetHeight;
					r = l + w;
					while(srcElement = srcElement.offsetParent){
						t += srcElement.offsetTop;
						l += srcElement.offsetLeft;
					}
				}
			}
			//to do 计算，防止默认层布局超过当前document.offsetWidth;
			obj.style['right']= r+15;
			obj.style["top"] = (t + h)-95;
			//obj.style['left']= l-345;
			//obj.style["top"] = (t + h)-111;
		}
};

icallcenter.businessnew.onFaxSendLoaded = function(objectId,dataobjectId,type,td,content) {
		var myTd= dojo.byId(td);
		var request = {
        url:  "./service/faxTemService/getTemsByObjectId",
        params: [objectId,dataobjectId,type],       
        onLoad: function(temList) 
        {  
  	         
		        	//把选项的给拼装成<option>的html
		        	var optionHtml="<option value=''>--请选择--</option>";
					
		        	for(i=0;i<temList.length;i++)
		        	{
		        		optionHtml+="<option value = '"+temList[i].temId+"'>"+temList[i].name+"</option>";		        			
		        	}
					//customerId = "'"+customerId+"'";
		        	optionHtml ="<select name='temId' outofForm='true' onchange=\"icallcenter.businessnew.onFaxTemChange(this.value,'"+objectId+"','"+dataobjectId+"','"+type+"','"+content+"');\">"+optionHtml+"</select>";
			       	
					myTd.innerHTML=  optionHtml;
			  				

         		
        }
     };
  icallcenter.common.formLoad(request);	 

};

icallcenter.businessnew.onFaxTemChange = function(temId,objectId,dataobjectId,type,content) {
		var request = {
        url:  "./service/faxTemService/getTemConstent",
        params: [temId,objectId,dataobjectId,type],       
        onLoad: function(constants) 
        {  
			dojo.byId(content).value = constants;
         		
        }
     };
  icallcenter.common.formLoad(request);	 

};

icallcenter.businessnew.chooseCallNo = function() {
	var phoneNumList = dojo.byId("icc.preSendFax.phoneNumList");
	if (phoneNumList.selectedIndex >= 0) {
    	var option = phoneNumList.options[phoneNumList.selectedIndex]; 
    	if (option) {
    		dojo.byId("icc.preSendFax.phoneNum").value = option.value;		
    	}		    
	}
};

icallcenter.businessnew.worksheet_result_init = function(customerId){
	var selectNode = dojo.byId("icc.businessnew.worksheet_result.select_"+customerId);
	dojo.forEach(userInfo.creatableWorkflows,function(dataObjectId){
		var o = document.createElement("option");
		selectNode.options.add(o);
		o.innerText = userDic.getNameOrCode("WORKFLOW_TYPE",dataObjectId);
		o.value = dataObjectId+"_"+userDic.getName("BIZ_CUST_TYPE", dataObjectId)+"_"+customerId; 
	});
};
