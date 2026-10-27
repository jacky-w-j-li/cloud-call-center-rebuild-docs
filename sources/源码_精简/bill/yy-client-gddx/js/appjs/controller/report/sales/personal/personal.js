Ext.define('App.controller.report.sales.personal.personal', {
    extend : 'Ext.app.Controller',
    requires : [],
    sefl : this,
    views : [],
    refs : [
        {
            ref: 'reportSalesPersonal',
            selector: 'reportSalesPersonal'
        }
    ],
    initFlag : false,
    init : function() {
        this.control({
            'reportSalesPersonal >  #sales_personal_query_timeType':{
                change : this.timeTypeChange
            },
            'reportSalesPersonal >  #sales_personal_query_reset_btn':{
                afterReset : this.resetQueryFilelds
            },
            'reportSalesPersonal button#sales_personal_export_btn':{
                click : this.exportPeronalReport
            }
        });
        this.initFlag = true;
    },
    exportPeronalReport : function(obj){
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            App.util.AppUtil.exportReport('bill.sales.exportSalesPersonalReport', data, function (rep, self) {
            }, this);
        }
    },
    resetQueryFilelds : function (obj){
        this.getReportSalesPersonal().down("#sales_personal_query_timeType").setValue("month");
    },
    timeTypeChange : function (obj,value){
        var year = this.getReportSalesPersonal().down("#sales_personal_query_year");
        var season = this.getReportSalesPersonal().down("#sales_personal_query_season");
        var month = this.getReportSalesPersonal().down("#sales_personal_query_month");
        var now = new Date();
        if(value == "month"){
            season.hide();
            month.show();
            year.setValue(now.getFullYear()+"");
            month.setValue((now.getMonth()+1 < 9)? ("0"+ (now.getMonth()+1)):(""+(now.getMonth()+1)));
        } else if(value == "season"){
            season.show();
            season.setValue("1");
            month.hide();
        } else if(value == "year"){
            season.hide();
            month.hide();
        }
    }
});
