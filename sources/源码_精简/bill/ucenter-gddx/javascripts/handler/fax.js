handler.fax = {
    pageSize: 10,
    pane: $("#fax"),
    showMain: function (data, src) {
        var action = {
            action: 'app.fax.getNumCount',
            data: {}
        }
        DS.send(action, function (rep) {
            if (rep.success) {
                var total = parseInt(rep.total, 10);
                var todo = parseInt(rep.todo, 10);
                var success = parseInt(rep.dialsucess, 10);
                var fail = total - todo - success;
                var pane = $("#fax");
                pane.find(".num_total").text(total);
                pane.find(".num_todo").text(todo);
                pane.find(".num_success").text(success);
                pane.find(".num_fail").text(fail);
            } else {
                $().alertmessage('showError', errMsg);
            }
        });
        handler.fax.showNumList("1");
    },
    showNumList: function (data, src) {
        var pane = $("#fax");
        if (data == '1') {
            DS.getView('fax/todo_list', function (view) {
                pane.find('#fax_tab_content').html(view);
                var param = {flag: 1, called: 'false'};
                handler.fax.getFaxList(param);
            });
        } else if (data == '2') {
            DS.getView('fax/history_list', function (view) {
                pane.find('#fax_tab_content').html(view);
                var param = {flag: 2, called: 'true'};
                handler.fax.getFaxList(param);
            });
        } else if (data == '3') {
            DS.getView('fax/batchNo_report_list', function (view) {
                pane.find('#fax_tab_content').html(view);
                handler.fax.getBatchNoReport();
            });
        }
    },
    getFaxList: function (data, src) {
        data = data || {};
        var flag = data.flag;
        delete data.flag;
        var url = 'fax/todo_item';
        if (flag == "2") {
            url = 'fax/history_item';
        }
        if (src) {
            data.page = src.attr("value") || 1;
        } else {
            data.page = 1;
        }
        data.limit = handler.fax.pageSize;
        var frmId = 'frm_fax_search';
        var pane = $("#fax");
        var action = {
            action: 'app.fax.getNumList',
            data: data
        }
        DS.send(action, function (rep) {
            if (rep.success) {
                var list = rep.list;
                var count = rep.count;
                if (list.length > 0) {
                    DS.getView(url, function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        pane.find('.batch_list').html(html.join(''));
                    });
                } else {
                    var html = '<tr><td class="text-center" colspan="10">没有记录!</td></tr>';
                    pane.find('.batch_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            } else {
                $().alertmessage('showError', errMsg);
            }
        })
    },
    getBatchNoReport: function (data, src) {
        data = data || {};
        if (src) {
            data.page = src.attr("value") || 1;
        } else {
            data.page = 1;
        }
        data.limit = handler.fax.pageSize;
        var frmId = 'frm_fax_search';
        var pane = $("#fax");
        var action = {
            action: 'app.fax.getBatchNoReport',
            data: data
        }
        DS.send(action, function (rep) {
            if (rep.success) {
                var list = rep.list;
                var count = rep.count;
                if (list.length > 0) {
                    DS.getView("./fax/batchNo_report_item", function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        pane.find('.batch_list').html(html.join(''));
                    });
                } else {
                    var html = '<tr><td class="text-center" colspan="10">没有记录!</td></tr>';
                    pane.find('.batch_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            } else {
                $().alertmessage('showError', errMsg);
            }
        })
    },
    showImort: function (data, src) {
        var p = $('#fax_modal');
        DS.getView('fax/num_import', function (view) {
            p.find(".modal-dialog").width(600);
            p.find('.modal-title').text('导入号码');
            p.find(".modal-body").html(view);
            p.modal();
        });
    },
    downloadImpTmpl: function () {
        var url = "./template/template_fax.xls";
        DS.downloadFile(url);
    },
    numberFileChange: function (formId) {
        var frm = $("#" + formId)[0];
        var file = frm.numFile.value;
        var type = file.substring(file.lastIndexOf(".") + 1, file.length);
        if (type != 'xls' && type != 'xlsx') {
            $().alertmessage('showError', "只支持excel格式上传！");
            frm.numFile.value = "";
            return;
        }
//        var url='./form';
//        frm.action=url;
//        frm.submit();
    },
    faxFileChange: function (formId) {
        var frm = $("#" + formId)[0];
        var file = frm.faxFile.value;
        var type = file.substring(file.lastIndexOf(".") + 1, file.length);
        if (type !== 'doc' && type !== 'pdf') {
            $().alertmessage('showError', "目前仅支持*.doc、*.pdf格式上传！");
            frm.faxFile.value = "";
            return;
        }
//        var url='./form';
//        frm.action=url;
//        frm.submit();
    },
    importNum: function (data, src) {
        var frm = $("#" + data)[0];
        if (frm.numFile.value) {
            var url = './form';
            frm.action = url;
            frm.submit();
        } else {
            $().alertmessage('showError', "请选择传真文件和号码文件！");
        }
    },
    uploadSuccess: function (rep) {
        if (rep == 'success') {
            $().alertmessage('showSuccess', '导入任务已提交');
            handler.fax.showMain();
            $('#fax_modal').modal('hide');
        } else {
            $().alertmessage('showError', '导入失败');
        }
    },
    uploadFaxFileSuccess: function (rep,name) {
        if (rep == 'success') {
            $('#service_modal').modal('hide');
            session.account.faxFileName = name;
            handler.fax.showMain();
        } else {
            $().alertmessage('showError', '提交失败');
        }
    },
    removeTodoList: function () {
        if (!confirm('该操作将删除所有的未未发送号码，确认吗？'))return;
        var action = {
            action: 'app.fax.removeTodoList',
            data: {}
        }
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', '删除成功');
                handler.fax.showMain();
            } else {
                $().alertmessage('showError', '删除数据失败');
            }
        })
    },
    startDial: function (data, src) {
        if (!confirm('确认开始发送吗？'))return;
        src.attr("disabled", "disabled");
        var action = {
            action: 'app.fax.startDial',
            data: {}
        }
        DS.send(action, function (rep) {
            if (rep) {
                $().alertmessage('showSuccess', '启动成功');
            } else {
                $().alertmessage('showError', '启动异常');
            }
        })
    },
    changeFaxFile : function(data,src){
        var p = $('#service_modal');
        DS.getView('fax/fax_file', function (view) {
            p.find(".modal-dialog").width(600);
            p.find('.modal-title').text('变更传真文件');
            p.find(".modal-body").html(view);
            p.modal();
        });
    },
    uploadFaxFile : function(formId){
        var frm=$("#"+formId)[0];
        var file = frm.file.value;
        var type = file.substring(file.lastIndexOf(".") + 1, file.length);
        if(type != 'pdf'){
            $().alertmessage('showError', '只支持pdf格式上传！');
            frm.file.value = "";
            return;
        }
        var url='./form';
        frm.action=url;
        frm.submit();
    },
    reset: function (data, src) {
        var frm = src.closest("form");
        frm[0].reset();
    },
    showFieldDesc:function(type,val){
        var desc='';
        if(type=='called'){
            if(val==true){
                desc='已发送';
            }else{
                desc='未发送';
            }
        }else if(type=='reason'){
            if(val=='0'){
                desc='<span class="text-success">发送成功</span>';
            }else{
                desc='发送失败('+val+')';
            }
        }else if(type=='duration'){
            desc=formatTime(val);
        }else if(type=='finishRate'){
            if(val=='100%'){
                desc='<span class="text-success">'+val+'</span>';
            }else{
                desc=val;
            }
        } else if(type == 'page'){
            if(!val || isNaN(val)){
                desc = 0;
            } else {
                desc = val;
            }
        }
        return desc;
    },
    removeEmptyFields:function(data){
        for(var i in data){
            if(!data[i]){
                delete  data[i];
            }
        }
    },
    exportNum:function(data,src){
        handler.fax.removeEmptyFields(data);
        var query=data;
        query.type='batchFaxExport';
        query.account=session.account._id;
        var action = {
            action: 'app.export.exportXls',
            data: {Method:'exportFaxList',Query:query}
        };
        DS.send(action,function(rep){
            if(rep.Succeed){
                DS.downloadFile(rep.path);
            }else{
                $().alertmessage('showError', '导出异常');
            }
        });
    }
}