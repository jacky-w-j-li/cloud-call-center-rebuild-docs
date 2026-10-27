Ext.define('App.controller.report.business.accountPayCharge', {
    extend : 'Ext.app.Controller',
    requires : [],
    sefl : this,
    views : [],
    refs : [
        {
            ref: 'reportBusinessAccountPayCharge',
            selector: 'reportBusinessAccountPayCharge'
        }
    ],
    initFlag : false,
    init : function() {
        this.control({
            'reportBusinessAccountPayCharge button#btn_export_account_pay_charge':{
                click : this.export
            },
            'reportBusinessAccountPayCharge button#btn_reset_year_month':{
                click : this.reset
            },
            'reportBusinessAccountPayCharge >  #account_pay_charge_query_account':{
                change : this.onAccountTextFieldChange
            },
        });
        this.initFlag = true;
    },
    //导出
    export : function(obj){
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            App.util.AppUtil.exportReport('bill.operation.exportAccountPayChargeReport', data, function (rep, self) {
            }, this);
        }
    },
    //重置按钮
    reset : function(obj){
        var form = obj.up("form");
        var year = form.down("combobox[name='year']");
        var month = form.down("combobox[name='month']");
        var sort = form.down("combobox[name='sort']");

        var currTime = new Date();

        var yearVal  = currTime.getFullYear();
        var monthVal = "00" + (currTime.getMonth()+1);
        monthVal = monthVal.substr(monthVal.length-2);

        sort.setValue('pay');
        year.setValue(yearVal);
        month.setValue(monthVal);
    },
    onAccountTextFieldChange : function(obj,newValue,oldValue){
        var form = obj.up('form');
        var month = form.down("combobox[name='month']");

        if(newValue && newValue.trim() != ''){
            month.setVisible(false);
        }else{
            month.setVisible(true);
        }
    },
});