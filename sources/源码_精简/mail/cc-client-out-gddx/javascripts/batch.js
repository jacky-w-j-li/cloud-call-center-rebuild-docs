handler.batch={
    pageSize:10,
    batch_list:function(data,src){
        var pane=$("#view_batch_list");
        var action={
            action:'app.batch.getNumCount',
            data:{}
        }
        DS.send(action,function(rep){
            if(rep.success){
                var total=parseInt(rep.total,10)||0;
                var todo=parseInt(rep.todo,10)||0;
                var success=parseInt(rep.dialsucess,10)||0;
                var fail=(total-todo-success)||0;
                pane.find(".num_total").text(total);
                pane.find(".num_todo").text(todo);
                pane.find(".num_success").text(success);
                pane.find(".num_fail").text(fail);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });

        handler.batch.showNumList("1");
    },
    batch_list2:function(data,src){
        var pane=$("#view_batch_list");
        var action={
            action:'app.batch.getNumCount',
            data:{}
        }
        DS.send(action,function(rep){
            if(rep.success){
                var total=parseInt(rep.total,10)||0;
                var todo=parseInt(rep.todo,10)||0;
                var success=parseInt(rep.dialsucess,10)||0;
                var fail=(total-todo-success)||0;
                pane.find(".num_total").text(total);
                pane.find(".num_todo").text(todo);
                pane.find(".num_success").text(success);
                pane.find(".num_fail").text(fail);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showNumList:function(data,src){
        var pane=$("#view_batch_list");
        if(data=='1'){
            DS.getView('batch/todo_list', function (view) {
                pane.find('#batch_tab_content').html(view);
                var param={flag:1,called:'false'};
                handler.batch.getBatchList(param);
                pane.find(".batch_strategy").text(handler.batch.showCallStrategyDesc());
                handler.batch.getConcurrent();
            });
        }else if(data=='2'){
            DS.getView('batch/history_list', function (view) {
                pane.find('#batch_tab_content').html(view);
                var param={flag:2,called:'true'};
                handler.batch.getBatchList(param);
            });
        }else if(data=='3'){
            DS.getView('batch/batchNo_report_list', function (view) {
                pane.find('#batch_tab_content').html(view);
                handler.batch.getBatchNoReport();
            });
        }
    },
    getBatchList:function(data,src){
        data=data||{};
        var flag=data.flag;
        delete data.flag;
        var url='batch/todo_item';
        if(flag=="2"){
            url='batch/history_item';
        }
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.batch.pageSize;
        var frmId='frm_batch_search';
        var pane=$("#view_batch_list");
        var action={
            action:'app.batch.getNumList',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    DS.getView(url, function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            if(!row.current){
                                row.current="";
                            }
                            row.noDialNum='';
                            if(row.num.indexOf("-")){
                                var ary=row.num.split("-");
                                var start=parseInt(ary[0]||0,10);
                                var end=parseInt(ary[1]||0,10);
                                var now=parseInt(row.current||0,10);
                                if(!now)now=start-1;
                                var leave=end-now;
                                if(leave>0){
                                    row.noDialNum=leave;
                                }else{
                                    row.noDialNum=0;
                                }
                            }

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
    getBatchNoReport:function(data,src){
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.batch.pageSize;
        var frmId='frm_batch_search';
        var pane=$("#view_batch_list");
        var action={
            action:'app.batch.getBatchNoReport',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    DS.getView("batch/batchNo_report_item", function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        pane.find('.batch_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="12">没有记录!</td></tr>';
                    pane.find('.batch_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    showImort:function(data,src){
        var p=$('#batch_modal');
        DS.getView('batch/num_import',function(view){
            p.width(600);
            p.find('.modal-title').text('导入号码');
            p.find(".modal-body").html(view);
            p.modal();
        });
    },

    startDial:function(data,src){
        if(!confirm('确认开始呼叫吗？'))return;
//        src.attr("disabled","disabled");
//        src.next().prop("disabled",false);
        var action={
            action:'app.batch.startDial',
            data:{
                start:'yes',
                pbx:session.user.pbx
            }

        }
        DS.send(action,function(rep){
            if(rep){
                $().alertmessage('showSuccess', "呼叫成功");
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    stopDial:function(data,src){
        if(!confirm('确认结束呼叫吗？'))return;
//        src.attr("disabled","disabled");
//        src.prev().prop("disabled",false);
        var action={
            action:'app.batch.startDial',
            data:{
                start:'no',
                pbx: session.user.pbx
            }
        }
        DS.send(action,function(rep){
            if(rep){
                $().alertmessage('showSuccess', "停止成功");
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
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
            window.setTimeout(function(){
                var param={flag:1,called:'false'};
                handler.batch.getBatchList(param);
            },1000);
            $('#batch_modal').modal('hide');
        }else{
            $().alertmessage('showError', '导入失败');
        }
    },
    downloadImpTmpl:function(){
        var url="./template/template.xls?1";
        DS.downloadFile(url);
    },
    reset:function(data,src){
        var frm=src.closest("form");
        frm[0].reset();
    },
    removeTodoList:function(){
        if(!confirm('该操作将删除所有的未呼叫号码，确认吗？'))return;
        var action={
            action:'app.batch.removeTodoList',
            data:{}
        }
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', '删除成功');
                handler.batch.showNumList("1");
            }else{
                $().alertmessage('showError', '删除数据失败');
            }
        })
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
        }
        return desc;
    },
    exportNum:function(data,src){
        handler.batch.removeEmptyFields(data);
        var query=data;
        query.type='batchDialExport';
        query.account=session.account.account;
        var action = {
            action: 'app.excel.exportXls',
            data: {Method:'exportTelList',Query:query}
        };
        DS.send(action,function(rep){
            if(rep.Succeed){
                DS.downloadFile(rep.path);
            }else{
                $().alertmessage('showError', '导出异常');
            }
        });
    },
    removeEmptyFields:function(data){
        for(var i in data){
            if(!data[i]){
                delete  data[i];
            }
        }
    },

    getConcurrent:function(){
//        var pane=$("#view_batch_list");
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
        DS.getView('batch/concurrent_update',function(view){
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
    showImortArea:function(data,src){
        var p=$('#batch_modal');
        DS.getView('batch/num_import_area',function(view){
            p.width(500);
            p.find('.modal-title').text('生成号码');
            p.find(".modal-body").html(view);
            p.modal();
        });
    },
    importNumArea:function(data,src){
        var start=parseInt(data.beginNum,10);
        var end=parseInt(data.endNum,10);
        if(start>=end){
            $().alertmessage('showError', "结束号码必须大于起始号码");
            return;
        }
        var action={
            action:'app.batch.insertImpAreaTask',
            data:data
        }
        DS.send(action,function(rep){
            if(rep){
                $().alertmessage('showSuccess', "导入成功");
                window.setTimeout(function(){
                    var param={flag:1,called:'false'};
                    handler.batch.getBatchList(param);
                },500);
                $('#batch_modal').modal('hide');
            }else{
                $().alertmessage('showError', errMsg);
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
    showCallStrategy:function(data,src){
        var p=$('#batch_modal');
        var pbx=handler.batch._getMyCallStrategy();
        var autoCallStrategy=pbx.AutoCallStrategy;
        var smartAutoCallCount=pbx.SmartAutoCallCount;
        DS.getView('batch/num_call_strategy',function(view){
            p.width(500);
            p.find('.modal-title').text('修改批量外呼策略');
            p.find(".modal-body").html(view);
            var option=p.find("#batch_autoCallStrategy");
            optionSelect(option,autoCallStrategy);
            if(smartAutoCallCount){
                p.find("input[name='SmartAutoCallCount']").val(smartAutoCallCount);
            }
            option.change();
            p.modal();
        });
    },
    updateCallStrategy:function(data,src){
        var pane=$("#view_batch_list");
        var action={
            action:'app.batch.updateCallStrategy',
            data:data
        }
        if(data.AutoCallStrategy=='smart'){
            if(!data.SmartAutoCallCount){
                $().alertmessage('showError', "空闲座席数的倍数必须填写");
                return;
            }
            if(isNaN(data.SmartAutoCallCount)){
                $().alertmessage('showError', "空闲座席数的倍数必须为数字");
                return;
            }
        }else{
            data.SmartAutoCallCount="1";
        }
        DS.send(action,function(rep){
            if(rep){
                var pbxs=session.account.pbx||[];
                var userPbx=session.user.pbx;
                if(pbxs.length>0){
                    for (var i = 0; i < pbxs.length; i++) {
                        var obj = pbxs[i];
                        if(obj.PBX==userPbx){
                            obj.AutoCallStrategy=data.AutoCallStrategy;
                            obj.SmartAutoCallCount=data.SmartAutoCallCount;
                            break;
                        }
                    }
                }
                pane.find(".batch_strategy").text(handler.batch.showCallStrategyDesc());
                $().alertmessage('showSuccess', "修改策略成功");
                $('#batch_modal').modal('hide');
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    showCallStrategyDesc:function(){
        var desc='';
        var pbx=handler.batch._getMyCallStrategy();
        var val=pbx.AutoCallStrategy;
        if(val=='smart'){
            desc="智能并发";
        }else{
            desc='固定并发';
        }
        return desc;
    }
}