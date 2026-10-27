Ext.define('App.controller.report.maintenance.teletraffic', {
    extend : 'Ext.app.Controller',
    requires : [],
    views : [],
    refs : [
        {
            ref: 'reportTeletraffic',
            selector: 'reportTeletraffic'
        }
    ],
    initFlag : false,
    init : function() {
        this.control({
            'reportTeletraffic >  #maintenance_teletraffic_query_timeType':{
                change : this.timeTypeChange
            },
            'reportTeletraffic >  #maintenance_teletraffic_query_reset_btn':{
                afterReset : this.resetQueryFilelds
            },
            'reportTeletraffic button#maintenance_teletraffic_query_check_export_btn' :{
                click : this.exportMaintenanceTeletrafficReport
            }
        });
        this.initFlag = true;
    },
    resetQueryFilelds : function (obj){
        this.getReportTeletraffic().down("#maintenance_teletraffic_query_timeType").setValue("day");
        this.getReportTeletraffic().down("#maintenance_teletraffic_query_lines").setValue(null);
        this.getReportTeletraffic().down('#maintenance_teletraffic_query_day').setValue(new Date());
    },
    timeTypeChange : function (obj,value){
        var year = this.getReportTeletraffic().down("#maintenance_teletraffic_query_year");
        var season = this.getReportTeletraffic().down("#maintenance_teletraffic_query_season");
        var month = this.getReportTeletraffic().down("#maintenance_teletraffic_query_month");
        var day = this.getReportTeletraffic().down('#maintenance_teletraffic_query_day');
        var custom = this.getReportTeletraffic().down("#maintenance_teletraffic_query_custom");
        var custom1 = this.getReportTeletraffic().down("#maintenance_teletraffic_query_custom1");
        var custom2 = this.getReportTeletraffic().down("#maintenance_teletraffic_query_custom2");
        var now = new Date();
        if(value == 'day'){
            year.hide();
            season.hide();
            month.hide();
            day.show();
            custom.hide();
            custom1.hide();
            custom2.hide();
            day.setValue(new Date());
        }else if(value == "month"){
            year.show();
            season.hide();
            month.show();
            day.hide();
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
            day.hide();
            custom.hide();
            custom1.hide();
            custom2.hide();
        } else if(value == "year"){
            year.show();
            season.hide();
            month.hide();
            day.hide();
            custom.hide();
            custom1.hide();
            custom2.hide();
        } else if(value == "custom"){
            season.hide();
            year.hide();
            month.hide();
            day.hide();
            custom.show();
            custom1.show();
            custom2.show();
            custom.setValue(new Date());
        }
    },
    exportMaintenanceTeletrafficReport : function(obj){
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);

            App.util.AppUtil.exportReport('bill.maintenance.exportMaintenanceTeletrafficReport', data, function (rep, self) {
            }, this);
        }
    }
});
