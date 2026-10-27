/**
 * Created by sG on 2015/11/11.
 */
/**
 * Created by sG on 2015/11/11.
 */
Ext.define('App.controller.report.proxy.analyse', {
    extend : 'Ext.app.Controller',
    requires : [],
    sefl : this,
    views : [],
    refs : [
        {
            ref:'reportProxyAnalyse',
            selector:'reportProxyAnalyse'
        }
    ],
    initFlag : false,
    init : function() {
        this.control({
            'reportProxyAnalyse button#btn_export_analyse':{
                click:this.exporAnalysereport
            },
            'reportProxyAnalyse button#btn_reset_year_month':{
                click:this.restYeraandMonthreport
            }
        });
        this.initFlag = true;
    },
    //重置按钮的方法
    restYeraandMonthreport:function(obj){
        var form = obj.up("form");
        var year = form.down("combobox[name='year']");
        var month = form.down("combobox[name='month']");
        var sort = form.down("combobox[name='sort']");

        var currTime = new Date();

        var yearVal  = currTime.getFullYear();
        var monthVal = "00" + (currTime.getMonth()+1);
        monthVal = monthVal.substr(monthVal.length-2);

        sort.setValue('totalPay');
        year.setValue(yearVal);
        month.setValue(monthVal);
    },
    //导出Excele  渠道分析报表
    exporAnalysereport : function(obj){
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            App.util.AppUtil.exportReport('bill.proxy.exportChannelAnalyseReport', data, function (rep, self) {
            }, this);
        }
    }
});
