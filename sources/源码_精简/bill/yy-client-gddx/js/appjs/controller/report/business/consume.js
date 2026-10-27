Ext.define('App.controller.report.business.consume', {
    extend : 'Ext.app.Controller',
    requires : [],
    sefl : this,
    views : [],
    refs : [
        {
            ref: 'reportBusinessConsume',
            selector: 'reportBusinessConsume'
        },
        {
            ref: 'weekGrid',
            selector: 'reportBusinessConsume > grid[class="query"]'
        }

    ],
    initFlag : false,
    init : function() {
        this.control({
            'reportBusinessConsume button#btn_export_month':{
                click : this.exportAreaMonth
            },
            'reportBusinessConsume button#btn_reset_month':{
                click : this.resetAreaMonth
            }
        });
        this.initFlag = true;
    },
    //查询出所有节点
    queryAllGrid: function (obj) {
        var panel=this.reportSalesAreaWeek();
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var param = App.util.AppUtil.getFormParam(fieldSet);
            App.util.AppUtil.request('bill.report.reportSalesAreaWeek',param, function (data, self) {
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
    exportAreaMonth : function(obj){
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            data.areaDisplayName=form.form.findField("area").getDisplayValue();
            App.util.AppUtil.exportReport('bill.operation.exportConsumeReport', data, function (rep, self) {
            }, this);
        }
    },
    //重置按钮
    resetAreaMonth : function(obj){
        this.getReportBusinessConsume().down('#business_consume_query_year').setValue(new Date().getFullYear());
    }

});