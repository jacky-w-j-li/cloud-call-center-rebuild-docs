handler.batch2={
    pageSize:10,
    autoRefreshHandler:null,
    task_main:function(data,src){
        var pane=$("#view_batch_task_list");
        pane.find(".nav-tabs li a:first").click();
    },
    _getMyCallStrategy:function(){
        var pbxs=session.account.pbx||[];
        var userPbx=session.user.pbx;
        var pbx={};
        if(pbxs.length>0){
            for (var i = 0; i < pbxs.length; i++) {
                var obj = pbxs[i];
                if(obj.PBX==userPbx){
                    pbx=obj;
                    break;
                }
            }
        }
        return pbx;
    },
    showTab:function(data,src){
        var pane=$("#view_batch_task_list");
        if(data=='1'){
            DS.getView('batch2/task_dealing', function (view) {
                pane.find('#batch_task_tab_content').html(view);
                var pbx=handler.batch2._getMyCallStrategy();
                var val=pbx.AutoCallStrategy;
                var desc='';
                pane.find(".acc_concurrent").text(pbx.maxInbound||2);
                if(val=='smart'){
                    desc="智能并发";
                    pane.find(".batch_autoCallCount").text(pbx.SmartAutoCallCount||1);
                    pane.find(".label_batch_autoCallCount").show();
                }else{
                    desc='固定并发';
//                    pane.find(".label_acc_concurrent").show();
                }
                pane.find(".batch_strategy").text(desc);
                if(!handler.batch2.autoRefreshHandler){
                    handler.batch2._initAutoRefresh();
                }
                handler.batch2.getBdTaskList();
            });
        }else if(data=='2'){
            DS.getView('batch2/task_finish', function (view) {
                pane.find('#batch_task_tab_content').html(view);
                handler.batch2.getBdTaskHistory();
            });
        }else if(data=='3'){
            DS.getView('batch2/history_list', function (view) {
                pane.find('#batch_task_tab_content').html(view);
//                var param={called:'true'};
//                handler.batch2.getBatchList(param);
            });
        }
    },
    getBatchList:function(data,src){
        var pane=$("#view_batch_task_list");
        data=data||{};
        if(!data.taskName){
            $().alertmessage('showError', "任务名称必须填写！");
            pane.find("input[name='taskName']").focus();
            return;
        }
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.batch2.pageSize;
        var frmId='frm_batch_task_history_search';
        var action={
            action:'app.batch.getNumList2',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    DS.getView('batch2/history_item', function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
//                            if(!row.current){
//                                row.current="";
//                            }
                            if(!row.taskName){
                                row.taskName="";
                            }
//                            row.noDialNum='';
//                            if(row.num.indexOf("-")){
//                                var ary=row.num.split("-");
//                                var start=parseInt(ary[0]||0,10);
//                                var end=parseInt(ary[1]||0,10);
//                                var now=parseInt(row.current||0,10);
//                                if(!now)now=start-1;
//                                var leave=end-now;
//                                if(leave>0){
//                                    row.noDialNum=leave;
//                                }else{
//                                    row.noDialNum=0;
//                                }
//                            }

                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        pane.find('.batch_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>';
                    pane.find('.batch_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    getBdTaskHistory:function(data,src){
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.batch2.pageSize;
        var frmId='frm_batch_task_search';
        var pane=$("#view_batch_task_list");
        var action={
            action:'app.batch.getBdTaskList',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    DS.getView("batch2/task_finish_item", function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            var taskType=row.taskType;
                            var calledNum=row.calledNum||0;
                            var dialNum=row.dialNum||0;
//                            var notDialNum=row.notDialNum||0;
                            var total=row.total||1;
//                            var dealNum=dialNum+notDialNum;
                            var dealNum=dialNum;
                            row.dealNum=dealNum;
                            if(calledNum>total){
                                calledNum=total;
                                row.calledNum=calledNum;
                            }
                            if(dialNum>calledNum){
                                dialNum=calledNum;
                                row.dialNum=dialNum;
                            }
                            row.calledRate=Math.round(calledNum/total * 10000)/100.00+"%";
                            row.dialRate=Math.round(dealNum/(calledNum||total) * 10000)/100.00+"%";
                            var sn=getCacheByKey("myServiceNos","Exten",row.serviceNo);
                            var group=getCacheByKey("mySkillGroups","Exten",row.taskQueue);
                            row.serviceNoDesc="";
                            row.groupDesc="";
                            row.timeDesc="";
                            row.numArea="";
                            if(!row.calledNum){
                                row.calledNum=0;
                            }
                            if(!row.dialNum){
                                row.dialNum=0;
                            }
                            if(!row.total){
                                row.total=0;
                            }
                            if(!row.notDialNum){
                                row.notDialNum=0;
                            }

                            if(sn){
                                var desc=sn.Exten;
                                if(sn.DisplayName){
                                    desc+="("+sn.DisplayName+")";
                                }
                                row.serviceNoDesc=desc;
                            }

                            if(group){
//                                var desc=group.Exten;
//                                if(group.DisplayName){
//                                    desc+="("+group.DisplayName+")";
//                                }
                                row.groupDesc=group.DisplayName;
                            }

                            if(row.numType=='generate'){
                                row.numArea=row.beginNum+"-"+row.endNum;
//                                row.currentNum="";
                            }

                            if(taskType=='time'){
                                var times=row.times;
                                var dateDesc="";
                                if(row.timeType=='staticDate'){
                                    dateDesc=row.taskDate;
                                }else{
                                    dateDesc="每天";
                                }
                                var timeDesc=[];
                                for (var j = 0; j < times.length; j++) {
                                    var obj = times[j];
                                    var _area=obj.beginTime+"-"+obj.endTime;
                                    timeDesc.push(_area)
                                }
                                row.dateDesc=dateDesc;
                                row.timeDesc=timeDesc.join(",");
                                row.timeDesc=dateDesc+" "+row.timeDesc;
                            }else{
                                row.timeType="";
                            }
                            html.push(DS.renderMethodViewNew(view,row));
                        }
                        pane.find('.batch_task_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="20">没有记录!</td></tr>';
                    pane.find('.batch_task_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    getBdTaskList:function(data,src,hideLoading){
        data=data||{};
//        if(src){
//            data.page = src.attr("value") || 1;
//        }else{
//            data.page = 1;
//        }
//        data.limit=handler.batch2.pageSize;
        var frmId='frm_batch_task_search';
        var pane=$("#view_batch_task_list");
        var action={
            action:'app.batch.getDealBdTaskList',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var currentTimeStamp=rep.currentTimeStamp;
                var currentDate=rep.currentDate;
//                console.dir(list);
                var count=rep.count;
                if (list.length > 0){
                    var tmpl_import='<div style=""><span>号码：</span><span><button type="button" class="btn btn-small btn-success ds_do_action" ds_action="batch2.showImort" ds_data="_#_id#_|_#name#_">导入号码</button>' +
                        '&nbsp;&nbsp;<button type="button" class="btn btn-small btn-success ds_do_action" ds_action="batch2.showImortInfo" ds_data="_#_id#_">导入进度</button></span></div>';
                    var tmpl_import_num='<div style="" class="pull-left"><span>号码总数：</span><span>_#total#_</span>&nbsp;&nbsp;<span>已拨打：</span><span>_#calledNum#_</span>&nbsp;&nbsp;<span>已接听：</span><span>_#dealNum#_</span></div>';
                    var tmpl_generate='<div style=""><span>号段：</span><span>_#numArea#_</span></div>';//<div style=""><span>当前呼叫：</span><span>_#currentNum#_</span></div>
                    var tmpl_time='<div class=""><span>_#dateDesc#_：</span>&nbsp;_#timeDesc#_</div>';
                    DS.getView("batch2/task_dealing_item", function (view) {
                        var html_normal = [];
                        var html_time = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            var taskType=row.taskType;
                            var calledNum=row.calledNum||0;
                            var dialNum=row.dialNum||0;
//                            var notDialNum=row.notDialNum||0;
                            var total=row.total||1;
//                            var dealNum=dialNum+notDialNum;
                            var dealNum=dialNum;
                            row.dealNum=dealNum;
                            row.calledRate=Math.round(calledNum/total * 10000)/100.00+"%";
                            row.dialRate=Math.round(dealNum/(calledNum||total) * 10000)/100.00+"%";
                            var sn=getCacheByKey("myServiceNos","Exten",row.serviceNo);
                            var group=getCacheByKey("mySkillGroups","Exten",row.taskQueue);
                            row.serviceNoDesc="";
                            row.groupDesc="";
                            row.task_detail="";
                            row.task_detail2="";
                            row.task_detail_time="";
                            row.task_item_css="task_control";
                            row.task_item_bgColor="";
                            if(!row.calledNum){
                                row.calledNum=0;
                            }
                            if(!row.dialNum){
                                row.dialNum=0;
                            }
                            if(!row.total){
                                row.total=0;
                            }
                            if(!row.notDialNum){
                                row.notDialNum=0;
                            }
                            if(sn){
                                var desc=sn.Exten;
                                if(sn.DisplayName){
                                    desc+="("+sn.DisplayName+")";
                                }
                                row.serviceNoDesc=desc;
                            }
                            if(group){
                                row.groupDesc=group.DisplayName;
                            }
                            if(row.numType=='import'){
                                row.task_detail=DS.renderMethodViewNew(tmpl_import, row);
                                row.task_detail2=DS.renderMethodViewNew(tmpl_import_num, row);
                            }else{
                                row.numArea=row.beginNum+"-"+row.endNum;
                                if(!row.currentNum){
                                    row.currentNum="";
                                }
                                row.task_detail=DS.renderMethodViewNew(tmpl_generate, row);
                                row.task_detail2=DS.renderMethodViewNew(tmpl_import_num, row);
                            }

                            if(taskType=='time'){
                                row.task_item_css="task_control_clock";
                                var times=row.times;
                                var dateDesc="";
                                if(row.timeType=='staticDate'){
                                    dateDesc=row.taskDate;
                                }else{
                                    row.taskDate=currentDate;
                                    dateDesc="每天";
                                }

                                var timeDesc=[];
                                for (var j = 0; j < times.length; j++) {
                                    var obj = times[j];
                                    var _area=obj.beginTime+"-"+obj.endTime;
                                    var _begin=new Date(Date.parse(row.taskDate+" "+obj.beginTime.replace(/-/g,"/")));
                                    var _end=new Date(Date.parse(row.taskDate+" "+obj.endTime.replace(/-/g,"/")));
                                    _begin=_begin.getTime();
                                    _end=_end.getTime();
//                                    console.info(_begin+" "+_end+' '+currentTimeStamp);
                                    if(currentTimeStamp>=_begin && currentTimeStamp<=_end){
                                        timeDesc.push('<span class="label label-success">'+_area+'</span>&nbsp;');
                                    }else if(currentTimeStamp<_begin){
                                        timeDesc.push('<span class="label label-warning">'+_area+'</span>&nbsp;');
                                    }else if(currentTimeStamp>_end){
                                        timeDesc.push('<span class="label">'+_area+'</span>&nbsp;');
                                    }

                                }
                                row.dateDesc=dateDesc;
                                row.timeDesc=timeDesc.join("");
                                row.task_detail_time=DS.renderMethodViewNew(tmpl_time, row);
                                if(row.status=='start'){
                                    row.task_item_bgColor="task_item_bgColor";
                                }
                                html_time.push(DS.renderMethodViewNew(view, row));
                            }else{
                                if(row.status=='start'){
                                    row.task_item_css="task_control_pause";
                                    row.task_item_bgColor="task_item_bgColor";
                                    row.task_item_action="batch2.stopDial";
                                }else{
                                    row.task_item_action="batch2.startDial";
                                }
                                html_normal.push(DS.renderMethodViewNew(view, row));
                            }
                        }
                        if(html_normal.join('').length==0){
                            html_normal.push('<span>没有任务!</span>');
                        }
                        if(html_time.join('').length==0){
                            html_time.push('<span>没有任务!</span>');
                        }
                        pane.find('.task_normal_main').html(html_normal.join(''));
                        pane.find('.task_time_main').html(html_time.join(''));
                        pane.find('.task_time_main').find(".task_item_control").removeClass("ds_do_action");
                    });
                } else {
                    var html='<span>没有任务!</span>';
                    pane.find('.task_normal_main').html(html);
                    pane.find('.task_time_main').html(html);
                }
//                pane.find('.result_count').text(count);
//                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                //if(handler.batch2.autoRefreshHandler){
                //    window.clearInterval(handler.batch2.autoRefreshHandler);
                //}
                $().alertmessage('showError', errMsg);
            }
        },null,null,hideLoading)
    },
    _getSnView:function(list,currentVal,showDft){
        var html=[];
        if(showDft!='no'){
            html.push("<option value=''>--请选择--</option>");
        }
        var selectOptionHtml = "<option value='__value' selected>__name</option>";
        var optionHtml = "<option value='__value'>__name</option>";
        var ary=list||[];
        if(!ary || ary.length==0) return null;
        for (var i=0;i<ary.length;i++) {
            var obj=ary[i];
            var desc=obj.Exten;
            if(obj.DisplayName){
                desc+="("+obj.DisplayName+")";
            }
            if(currentVal && currentVal==obj.Exten){
                html.push(selectOptionHtml.replace(/__value/g,obj.Exten).replace(/__name/g,desc));
            } else{
                html.push(optionHtml.replace(/__value/g,obj.Exten).replace(/__name/g,desc));
            }
        }
        return html.join("");
    },
    _getGroupView:function(list,currentVal,showDft){
        var html=[];
        if(showDft!='no'){
            html.push("<option value=''>--请选择--</option>");
        }
        var selectOptionHtml = "<option value='__value' selected>__name</option>";
        var optionHtml = "<option value='__value'>__name</option>";
        var ary=list||[];
        if(!ary || ary.length==0) return null;
        for (var i=0;i<ary.length;i++) {
            var obj=ary[i];
//            var desc=obj.Exten;
//            if(obj.DisplayName){
//                desc+="("+obj.DisplayName+")";
//            }
            var desc=obj.DisplayName;
            if(currentVal && currentVal==obj.Exten){
                html.push(selectOptionHtml.replace(/__value/g,obj.Exten).replace(/__name/g,desc));
            } else{
                html.push(optionHtml.replace(/__value/g,obj.Exten).replace(/__name/g,desc));
            }
        }
        return html.join("");
    },

    showAddTask:function(data,src){
        var p=$('#batch_modal');
        DS.getView('batch2/task_add',function(view){
            var dics=getCache("myServiceNos");
            var groups=getCache("mySkillGroups");
            var html=handler.batch2._getSnView(dics,null,"no");
            view = view.replace(/serviceNoList/g,html);
            html=handler.batch2._getGroupView(groups,null,"no");
            view = view.replace(/queueList/g,html);
            p.find('.modal-title').text('新增呼叫任务');
            p.find(".modal-body").html(view);
            p.width(500);
            p.modal();
        });
    },
    showAddNext:function(step,src){
        var pane=$("#batch_modal");
        var data=DS.getDataOfForm(pane.find(".task_form"));
        data=data.data;
        if(step=="2"){
            var numType=data.numType;
            if(numType=='generate'){
                if(!$.trim(data.beginNum)){
                    $().alertmessage('showError',"开始号码不能为空");
                    return;
                }
                if(!$.trim(data.endNum)){
                    $().alertmessage('showError',"结束号码不能为空");
                    return;
                }
                var start=parseInt(data.beginNum,10);
                var end=parseInt(data.endNum,10);
                if(start>=end){
                    $().alertmessage('showError', "结束号码必须大于起始号码");
                    return;
                }
            }
            pane.find(".task_section").hide();
            pane.find(".section_task_type").show();
        }else if(step=="3"){
            var taskType=data.taskType;
            if(taskType=='time'){
                if(data.timeType=="staticDate" && !$.trim(data.taskDate)){
                    $().alertmessage('showError',"日期不能为空");
                    return;
                }
                var beginTimes=data.beginTime,endTimes=data.endTime;
                for(var i=0;i<beginTimes.length;i++) {
                    if(!beginTimes[i]){
                        $().alertmessage('showError', "开始时间不能为空");
                        return;
                    }
                    if(!endTimes[i]){
                        $().alertmessage('showError', "结束时间不能为空");
                        return;
                    }
                    var start=parseFloat(beginTimes[i].replace(/:/,"."));
                    var end=parseFloat(endTimes[i].replace(/:/,"."));
                    if(start>=end){
                        $().alertmessage('showError', "结束时间必须大于开始时间");
                        return;
                    }
                }
                pane.find(".task_queue").hide();
            }else{
                pane.find(".task_queue").show();
            }
            pane.find(".task_section").hide();
            pane.find(".section_base").show();
        }
    },
    showAddPrev:function(data,src){
        var pane=$("#batch_modal");
        if(data=="1"){
            pane.find(".task_section").hide();
            pane.find(".section_num_type").show();
        }else if(data=="2"){
            pane.find(".task_section").hide();
            pane.find(".section_task_type").show();
        }
    },

    saveBdTask:function(data,src){
        var pane=$("#batch_modal");
        var taskType=data.taskType;
        if(!$.trim(data.name)){
            $().alertmessage('showError',"名称不能为空");
            return;
        }
        if(!$.trim(data.serviceNo)){
            $().alertmessage('showError',"服务号不能为空");
            return;
        }

        if(taskType=='time'){
            var times=[];
            var timeArea=[];//3.3-4.15,12.2-18.3
            var beginTimes=data.beginTime,endTimes=data.endTime;
            for(var i=0;i<beginTimes.length;i++) {
                var b=beginTimes[i];
                var e=endTimes[i];
                times.push({beginTime:b,endTime:e});

                if(b && e){
                    timeArea.push(b.replace(/:/,".")+"-"+e.replace(/:/,"."));
                }
            }
            data.times=times;
            data.timeArea=timeArea.join(",");
            data.taskQueue="";
        }else{
            if(!$.trim(data.taskQueue)){
                $().alertmessage('showError',"技能组不能为空");
                return;
            }
            delete data.timeType;
        }
        delete data.beginTime;
        delete data.endTime;

        var action = {
            action: 'app.batch.saveBdTask',
            data: data
        };
        DS.send(action, function(rep){
            if(rep.success){
                handler.batch2.getBdTaskList();
                $('#batch_modal').modal('hide');
            }else{
                if(rep.Message=='401'){
                    $().alertmessage('showError', "没有服务号同名的技能组");
                }else {
                    $().alertmessage('showError', rep.message||errMsg);
                }
            }
        });
    },
    _initTaskTime:function(data,pane){
        var timeType= pane.find('select[name="timeType"]');
        optionSelect(timeType,data.timeType);
        timeType.change(function(){
            var val=$(this).val();
            var _pane=pane.find(".taskDate_hidden");
            if(val=='staticDate'){
                _pane.show();
            }else{
                _pane.hide();
            }
        });
        var container=pane.find(".task_item_time_area");
        var tmpl_minus=pane.find("#tmpl_task_timeArea_minus").html()||'';
        var tmpl_plus=pane.find("#tmpl_task_timeArea_plus").html()||'';
        var _ary=data.times;
        var html=[];
        for (var i = 0; i < _ary.length; i++) {
            var obj = _ary[i];
            var tmpl="";
            if(i==0){
                tmpl=DS.renderView(tmpl_plus,obj);
            }else{
                tmpl=DS.renderView(tmpl_minus,obj);
            }
            html.push(tmpl);
        }
        container.html(html.join(""));
        timeType.change();
    },
    showUpdateTask:function(id,src){
        var p=$('#batch_modal');
        var action = {
            action: 'app.batch.getTaskById',
            data: {_id:id}
        };
        DS.send(action, function(rep){
            if(rep.success){
                var row=rep.row;
                var taskType=row.taskType;
                var numType=row.numType;
                var status=row.status;
                if(status=='start'){
                    $().alertmessage('showError', "正在运行的任务不能修改");
                    return;
                }
                if(taskType=='time'){
                    DS.getView('batch2/task_update_time',function(view){
                        view=DS.renderMethodViewNew(view,row);
                        p.find('.modal-title').text('修改任务');
                        p.find(".modal-body").html(view);
                        p.width(500);
                        handler.batch2._initTaskTime(row,p.find(".modal-body"));
                        if(numType=='generate'){
                            p.find(".num_generate_hidden").show()
                        }
                        p.modal();
                    });
                }else{
                    DS.getView('batch2/task_update_normal',function(view){
                        view=DS.renderMethodViewNew(view,row);
                        p.find('.modal-title').text('修改任务');
                        p.find(".modal-body").html(view);
                        p.width(500);
                        if(numType=='generate'){
                            p.find(".num_generate_hidden").show()
                        }
                        p.modal();
                    });
                }
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    updateBdTask:function(data,src){
        var pane=$("#batch_modal");
        var taskType=data.taskType;
        if(!$.trim(data.serviceNo)){
            $().alertmessage('showError',"服务号不能为空");
            return;
        }
        if(taskType=='time'){
            if(data.timeType=="staticDate" && !$.trim(data.taskDate)){
                $().alertmessage('showError',"日期不能为空");
                return;
            }
            var times=[];
            var timeArea=[];//3.3-4.15,12.2-18.3
            var beginTimes=data.beginTime,endTimes=data.endTime;
            for(var i=0;i<beginTimes.length;i++) {
                var b=beginTimes[i];
                var e=endTimes[i];
                if(!b){
                    $().alertmessage('showError', "开始时间不能为空");
                    return;
                }
                if(!e){
                    $().alertmessage('showError', "结束时间不能为空");
                    return;
                }
                times.push({beginTime:b,endTime:e});
                if(b && e){
                    timeArea.push(b.replace(/:/,".")+"-"+e.replace(/:/,"."));
                }
                var start=parseFloat(b.replace(/:/,"."));
                var end=parseFloat(e.replace(/:/,"."));
                if(start>=end){
                    $().alertmessage('showError', "结束时间必须大于开始时间");
                    return;
                }
            }
            data.times=times;
            data.timeArea=timeArea.join(",");
            delete data.beginTime;
            delete data.endTime;
        }

        var action = {
            action: 'app.batch.updateBdTask',
            data: data
        };
        DS.send(action, function(rep){
            if(rep.success){
                handler.batch2.getBdTaskList();
                $('#batch_modal').modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    removeBdTask:function(id,src){
        if(!confirm('确认删除该任务吗？'))return;
        var action = {
            action: 'app.batch.removeBdTask',
            data: {_id:id}
        };
        DS.send(action, function(rep){
            if(rep.success){
                handler.batch2.getBdTaskList();
            }else{
                if(rep.Message=='404'){
                    $().alertmessage('showError', "未找到该任务");
                }else {
                    $().alertmessage('showError', rep.message||errMsg);
                }
            }
        });
        /*var action = {
            action: 'app.batch.getTaskById',
            data: {_id:id}
        };
        DS.send(action, function(rep){
            if(rep.success){
                var row=rep.row;
                var status=row.status;
                if(status=='start'){
                    $().alertmessage('showError', "正在运行的任务不能删除");
                    return;
                }

            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });*/
    },

    startDial:function(data,src){
        var pane=$("#view_batch_task_list");
        var param=data.split("|");
        var taskId=param[0];
        var taskType=param[1];
        if(taskType=='time')return;

        if(!confirm('确认开始呼叫吗？'))return;
//        src.attr("disabled","disabled");
//        src.next().prop("disabled",false);
        var action={
            action:'app.batch.startDialTask',
            data:{
                start:'yes',
                pbx:session.user.pbx,
                taskId:taskId
            }
        }
        DS.send(action,function(rep){
            if(rep.success){
                src.attr("ds_action","batch2.stopDial");
                src.removeClass("task_control").addClass("task_control_pause");
                src.closest(".task_item").addClass("task_item_bgColor");
                $().alertmessage('showSuccess', "任务已经开始");
            }else{
                if(rep.Message=='404'){
                    $().alertmessage('showError', "未找到该任务");
                }else if(rep.Message=='401'){
                    $().alertmessage('showError', "已经有一个在执行的手动任务，不能再开始");
                }else {
                    $().alertmessage('showError', rep.message||errMsg);
                }
            }
        })
    },
    stopDial:function(data,src){
        var param=data.split("|");
        var taskId=param[0];
        var taskType=param[1];
        if(taskType=='time')return;
        if(!confirm('确认结束呼叫吗？'))return;
//        src.attr("disabled","disabled");
//        src.prev().prop("disabled",false);
        var action={
            action:'app.batch.startDialTask',
            data:{
                start:'no',
                pbx: session.user.pbx,
                taskId:taskId
            }
        }
        DS.send(action,function(rep){
            if(rep.success){
                src.attr("ds_action","batch2.startDial");
                src.removeClass("task_control_pause").addClass("task_control");
                src.closest(".task_item").removeClass("task_item_bgColor");
                $().alertmessage('showSuccess', "任务已经停止");
            }else{
                if(rep.Message=='404'){
                    $().alertmessage('showError', "未找到该任务");
//                }else if(rep.Message=='401'){
//                    $().alertmessage('showError', "已经有一个在执行的手动任务，不能再开始");
                }else {
                    $().alertmessage('showError', errMsg);
                }
            }
        })
    },
    _getMyCallStrategy:function(){
        var pbxs=session.account.pbx||[];
        var userPbx=session.user.pbx;
        var pbx={};
        if(pbxs.length>0){
            for (var i = 0; i < pbxs.length; i++) {
                var obj = pbxs[i];
                if(obj.PBX==userPbx){
                    pbx=obj;
                    break;
                }
            }
        }
        return pbx;
    },
    _initCallStrategy:function(){
        $('#batch_modal').find('select[name="AutoCallStrategy"]').change(function(){
            var val=$(this).val();
            var _pane=$('#batch_modal').find(".concurrent_num");
            if(val=='smart'){
                _pane.text("空闲座席数的倍数");
                $('#batch_modal').find(".help-block").show();
            }else{
                _pane.text("并发数");
                $('#batch_modal').find(".help-block").hide();
            }
        });
    },
    showCallStrategy:function(data,src){
        var p=$('#batch_modal');
        var pbx=handler.batch2._getMyCallStrategy();
        var autoCallStrategy=pbx.AutoCallStrategy;
        var smartAutoCallCount=pbx.SmartAutoCallCount;
        DS.getView('batch2/num_call_strategy',function(view){
            p.width(500);
            p.find('.modal-title').text('修改外呼策略');
            p.find(".modal-body").html(view);
            handler.batch2._initCallStrategy();
            var option=p.find("#batch_task_autoCallStrategy");
            optionSelect(option,autoCallStrategy);
            if(autoCallStrategy=="smart"){
                p.find("input[name='SmartAutoCallCount']").val(smartAutoCallCount||1);
            }else{
                p.find("input[name='SmartAutoCallCount']").val(pbx.maxInbound||2);
            }
            option.change();
            p.modal();
        });
    },
    _syncSession:function(data){
        var pbxs=session.account.pbx||[];
        var userPbx=session.user.pbx;
        if(pbxs.length>0){
            for (var i = 0; i < pbxs.length; i++) {
                var obj = pbxs[i];
                if(obj.PBX==userPbx){
                    obj.AutoCallStrategy=data.AutoCallStrategy;
                    if(data.AutoCallStrategy=='static'){
                        obj.maxInbound=data.limit;
                    }else{
                        obj.SmartAutoCallCount=data.SmartAutoCallCount;
                    }
                    break;
                }
            }
        }
    },
    _syncSessionOld:function(data){
        var pbxs=session.account.pbx||[];
        var userPbx=session.user.pbx;
        if(pbxs.length>0){
            for (var i = 0; i < pbxs.length; i++) {
                var obj = pbxs[i];
                if(obj.PBX==userPbx){
                    obj.maxInbound=data.limit;
                    break;
                }
            }
        }
    },
    updateCallStrategy:function(data,src){
        var pane=$("#view_batch_task_list");
        var action={
            action:'app.batch.updateTaskCallStrategy',
            data:data
        }
        var fieldDesc="空闲座席数的倍数";
        if(data.AutoCallStrategy=='static'){
            fieldDesc="并发数";
        }
        if(!data.SmartAutoCallCount){
            $().alertmessage('showError', fieldDesc+"必须填写");
            return;
        }
        if(isNaN(data.SmartAutoCallCount)){
            $().alertmessage('showError', fieldDesc+"必须为数字");
            return;
        }

        if(data.AutoCallStrategy=='static'){
            data.limit=data.SmartAutoCallCount;
            delete data.SmartAutoCallCount;
        }else{
//            if(parseInt(data.SmartAutoCallCount,10)>10){
//                $().alertmessage('showError', fieldDesc+"最大为10，若进线率仍比较低的话，请检查固定并发大小或换一批号段");
//                return;
//            }
        }
        DS.send(action,function(rep){
            if(rep.success){
                handler.batch2._syncSession(data);
                pane.find(".batch_strategy").text(handler.batch2.showCallStrategyDesc());
                if(data.AutoCallStrategy=='smart'){
//                    pane.find(".label_acc_concurrent").hide();
                    pane.find(".batch_autoCallCount").text(data.SmartAutoCallCount);
                    pane.find(".label_batch_autoCallCount").show();
                }else{
                    pane.find(".label_batch_autoCallCount").hide();
                    $(".acc_concurrent").text(data.limit);
//                    pane.find(".label_acc_concurrent").show();
                }
                $().alertmessage('showSuccess', "修改策略成功");
                $('#batch_modal').modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    showCallStrategyDesc:function(){
        var desc='';
        var pbx=handler.batch2._getMyCallStrategy();
        var val=pbx.AutoCallStrategy;
        if(val=='smart'){
            desc="智能并发";
        }else{
            desc='固定并发';
        }
        return desc;
    },
    getConcurrent:function(){
        var action={
            action:'app.batch.getConcurrent',
            data:{}
        }
        DS.send(action,function(rep){
            if(rep.success){
                $(".acc_concurrent").text(rep.limit);
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    showConcurrent:function(data,src){
        var p=$('#batch_modal');
        DS.getView('batch2/concurrent_update',function(view){
            p.width(400);
            p.find('.modal-title').text('修改并发');
            p.find(".modal-body").html(view);
            p.modal();
        });
    },
    saveConcurrent:function(data,src){
        var action = {
            action: 'app.batch.saveConcurrent',
            data: data
        };
        DS.send(action, function(rep){
            if(rep.success){
                handler.batch2._syncSessionOld(data);
                $(".acc_concurrent").text(data.limit);
                $().alertmessage('showSuccess', '修改并发成功');
                $('#batch_modal').modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    showImort:function(data,src){
        var p=$('#batch_modal');
        var param=data.split("|");
        var taskId=param[0];
        var taskName=param[1];
        var action = {
            action: 'app.batch.getTaskById',
            data: {_id:taskId}
        };
        DS.send(action, function(rep){
            if(rep.success){
                var row=rep.row;
                var status=row.status;
                if(status=='start'){
                    $().alertmessage('showError', "正在运行的任务不能导入！");
                    return;
                }
                DS.getView('batch2/num_import',function(view){
                    view=view.replace(/_#taskId#_/g,taskId);
                    view=view.replace(/_#taskName#_/g,taskName);
                    p.width(600);
                    p.find('.modal-title').text('导入号码');
                    p.find(".modal-body").html(view);
                    p.modal();
                });
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });

    },
    importNum:function(formId){
        var frm=$("#"+formId)[0];
        var file = frm.file.value;
        var type = file.substring(file.lastIndexOf(".") + 1, file.length);
        if(type != 'xls' && type != 'xlsx'){
            $().alertmessage('showError', "只支持excel格式上传！");
            return;
        }
        var url='./form';
        frm.action=url;
        frm.submit();
    },
    uploadSuccess:function(rep){
        if(rep=='success'){
            $().alertmessage('showSuccess', '导入任务已提交');
//            window.setTimeout(function(){
//                var param={flag:1,called:'false'};
//                handler.batch.getBatchList(param);
//            },1000);
            $('#batch_modal').modal('hide');
        }else{
            $().alertmessage('showError', '导入失败');
        }
    },
    downloadImpTmpl:function(){
        var url="./template/template.xls?1";
        DS.downloadFile(url);
    },
    exportNum:function(data,src){
        var pane=$("#view_batch_task_list");
        data=data||{};
        if(!data.taskName){
            $().alertmessage('showError', "任务名称必须填写！");
            pane.find("input[name='taskName']").focus();
            return;
        }
        handler.batch2.removeEmptyFields(data);
        var query=data;
        query.type='batchDialExport';
        query.account=session.account.account;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportTelTaskList',Query:query}
        };
        DS.send(action,function(rep){
            if(rep.Succeed){
                DS.downloadFile(rep.path);
            }else{
                $().alertmessage('showError', '导出异常');
            }
        });
    },
    _initAutoRefresh:function(){
        var pane=$("#view_batch_task_list");
        handler.batch2.autoRefreshHandler=window.setInterval(function(){
            var obj=pane.find(".batch_task_refresh");
            if(obj.length>0){
//                obj.click();
                handler.batch2.getBdTaskList(null,null,true);
            }
        },5000);
    },
    showImortInfo:function(taskId,src){
        var p=$('#batch_modal');
        DS.getView('batch2/task_import_list',function(view){
            view=view.replace(/_#taskId#_/g,taskId);
            p.width(600);
            p.find('.modal-title').text('导入进度');
            p.find(".modal-body").html(view);
            p.find(".batch_import_task_refresh").click();
            p.modal();
        });
    },
    getImpTaskList:function(data,src){
        data=data||{};
        var pane=$("#batch_modal");
        var action={
            action:'app.batch.getImpTaskById',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
//                var count=rep.count;
                if (list.length > 0){
                    DS.getView('batch2/task_import_item', function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            if(!row.impNum){
                                row.impNum='0';
                            }
                            if(!row.repeatNum){
                                row.repeatNum='0';
                            }
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        pane.find('.batch_task_import_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>';
                    pane.find('.batch_task_import_list').html(html);
                }
//                pane.find('.result_count').text(count);
//                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },

    reset:function(data,src){
        var frm=src.closest("form");
        frm[0].reset();
    },
    showFieldDesc:function(type,val){
        var desc='';
        if(type=='called'){
            if(val==true){
                desc='已呼叫';
            }else{
                desc='未呼叫';
            }
        }else if(type=='reason'){
            if(val=='4'){
                desc='<span class="text-success">呼叫成功</span>';
            }else if(val=='3'){
                desc='<span class="">振铃未接听</span>';
            }else{
                desc='呼叫失败('+val+')';
            }
        }else if(type=='duration'){
            desc=formatTime(val);
        }else if(type=='keypress'){
            if(val=='true'){
                desc="是";
            }else{
                desc="否";
            }
        }else if(type=='finishRate'){
            if(val=='100%'){
                desc='<span class="text-success">'+val+'</span>';
            }else{
                desc=val;
            }
        }else if(type=='myServiceNos'){
            var dics=getCache("myServiceNos");
            desc=handler.batch2._getSnView(dics,val);
        }else if(type=='mySkillGroups'){
            var dics=getCache("mySkillGroups");
            desc=handler.batch2._getGroupView(dics,val,"no");
        }else if(type=='bdNumType'){
            if(val=='import'){
                desc="导入";
            }else{
                desc="号段";
            }
        }else if(type=='bdTaskType'){
            if(val=='normal'){
                desc="普通任务";
            }else{
                desc="定时任务";
            }
        }else if(type=='bdTimeType'){
            if(val=='staticDate'){
                desc="指定日期";
            }else if(val=='everyDay'){
                desc="每天";
            }
        }else if(type=='impTaskStatus'){
            desc=getDicCacheName('impTaskStatus',val);
        }
        return desc;
    },
    removeEmptyFields:function(data){
        for(var i in data){
            if(!data[i]){
                delete  data[i];
            }
        }
    }
}