/**
 * 运营月报表
 * */
Ext.define('App.controller.report.business.month', {
    extend : 'Ext.app.Controller',
    requires : [],
    sefl : this,
    views : [],
    refs : [
        {
            ref:'reportBusinessMonth',
            selector:'reportBusinessMonth'
        }
    ],
    initFlag : false,
    init : function() {
        this.control({
            'reportBusinessMonth button#btn_export_Month_report':{
                click:this.exportMonthreport
            },
            'reportBusinessMonth button#btn_reset_Month_report':{
                click:this.restMonthreport
            }
        });
        this.initFlag = true;
    },
    //重置按钮的方法
    restMonthreport:function(){
        this.getReportBusinessMonth().down("#operation_query_year").setValue(new Date().getFullYear());
    },

    //导出Excele  运营月报表
    exportMonthreport : function(obj){
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            App.util.AppUtil.exportReport('bill.operation.exportMonthReport', data, function (rep, self) {
            }, this);
        }
    }
});
