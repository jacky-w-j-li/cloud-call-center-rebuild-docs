Ext.define('App.controller.report.incomAnalysis', {
    extend : 'Ext.app.Controller',
    requires : [],
    sefl : this,
    views : [],
    refs : [
        {
            ref: 'reportIncomAnalysis',
            selector: 'reportIncomAnalysis'
        },
        {
            ref: 'weekGrid',
            selector: 'reportIncomAnalysis > grid[class="query"]'
        }

    ],
    initFlag : false,
    init : function() {
        this.control({
            'reportIncomAnalysis button#btn_export_incomAnalysis_month':{
                click : this.exportIncomAnalysisMonth
            },
            'reportIncomAnalysis button#btn_reset_incomAnalysis_month':{
                click : this.resetIncomAnalysisMonth
            }
        });
        this.initFlag = true;
    },
    //查询出所有节点
    queryAllGrid: function (obj) {
        var panel=this.reportIncomAnalysis();
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var param = App.util.AppUtil.getFormParam(fieldSet);
            App.util.AppUtil.request('bill.report.reportIncomAnalysis',param, function (data, self) {
                if (data.success) {
                    panel.data=data.list;
                    var grid = form.up("panel").down("grid[class='query']");
                    grid.store.proxy.extraParams.data = Ext.JSON.encode(param);
                    grid.store.loadPage(1);
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    //导出
    exportIncomAnalysisMonth : function(obj){
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            data.Method="exportIncomAnalysisMonth";
            App.util.AppUtil.request('bill.export.exportBillXls', data, function (rep, self) {
                if (rep.Succeed) {
                    self.downloadFile(rep.path);
                } else {
                    App.util.AppUtil.msg(rep.message);
                }
            }, this);
        }
    },
    //下载
    downloadFile: function (fileUrl) {
        var url = fileUrl;
        var container = {
            id: 'downloadFile_Frame',
            tag: 'iframe',
            style: 'display:none'
        };
        var frame=Ext.getDom("downloadFile_Frame");
        if(!frame){
            Ext.DomHelper.append(Ext.getBody(),container);
            frame=Ext.getDom("downloadFile_Frame");
        }
        frame.src=url;
    },
    //重置按钮
    resetIncomAnalysisMonth : function(obj){
        var form = obj.up("form");
        if (form.form.reset()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            data.Method="resetIncomAnalysisMonth";
            var data = new Date();
            Ext.getCmp('btn_area_personal_year').setValue(data.getFullYear());
            Ext.getCmp('btn_area_personal_month').setValue('');
        }
    }

});