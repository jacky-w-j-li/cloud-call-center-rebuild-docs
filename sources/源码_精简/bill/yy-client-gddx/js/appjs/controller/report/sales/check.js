Ext.define('App.controller.report.sales.check', {
    extend : 'Ext.app.Controller',
    requires : [],
    sefl : this,
    views : [],
    refs : [
        {
            ref: 'reportSalesCheck',
            selector: 'reportSalesCheck'
        }
    ],
    initFlag : false,
    init : function() {
        this.control({
            'reportSalesCheck >  #sales_check_query_timeType':{
                change : this.timeTypeChange
            },
            'reportSalesCheck >  #sales_check_query_reset_btn':{
                afterReset : this.resetQueryFilelds
            },
            'reportSalesCheck >  #sales_check_query_find_btn':{
                afterQuery : this.afterQueryProcess
            },
            'reportSalesCheck button#sales_query_check_export_btn' :{
                click : this.exportSalesCheckReport
            }
        });
        this.initFlag = true;
    },
    afterQueryProcess : function (obj,data){
        var column = this.getReportSalesCheck().down("#sales_check_query_grid_column_day");
        var user = this.getReportSalesCheck().down("#sales_check_query_form_proxy");
        var value = user.getValue();
        if(value){
            column.show();
        } else {
            column.hide();
        }
    },
    resetQueryFilelds : function (obj){
        this.getReportSalesCheck().down("#sales_check_query_timeType").setValue("month");
    },
    timeTypeChange : function (obj,value){
        var year = this.getReportSalesCheck().down("#sales_check_query_year");
        var season = this.getReportSalesCheck().down("#sales_check_query_season");
        var month = this.getReportSalesCheck().down("#sales_check_query_month");
        var custom = this.getReportSalesCheck().down("#sales_check_query_custom");
        var custom1 = this.getReportSalesCheck().down("#sales_check_query_custom1");
        var custom2 = this.getReportSalesCheck().down("#sales_check_query_custom2");
        var now = new Date();
        if(value == "month"){
            year.show();
            season.hide();
            month.show();
            custom.hide();
            custom1.hide();
            custom2.hide();
            year.setValue(now.getFullYear()+"");
            month.setValue((now.getMonth()+1 < 9)? ("0"+ (now.getMonth()+1)):(""+(now.getMonth()+1)));
        } else if(value == "season"){
            year.show();
            season.show();
            season.setValue("1");
            month.hide();
            custom.hide();
            custom1.hide();
            custom2.hide();
        } else if(value == "year"){
            year.show();
            season.hide();
            month.hide();
            custom.hide();
            custom1.hide();
            custom2.hide();
        } else if(value == "custom"){
            season.hide();
            year.hide();
            month.hide();
            custom.show();
            custom1.show();
            custom2.show();
        }
    },
    exportSalesCheckReport : function(obj){
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            App.util.AppUtil.exportReport('bill.sales.exportSalesCheckReport', data, function (rep, self) {
            }, this);
        }
    }
});
