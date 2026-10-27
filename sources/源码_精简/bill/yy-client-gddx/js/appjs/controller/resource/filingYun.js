Ext.define('App.controller.resource.filingYun', {
    extend : 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    refs : [
        {
            ref: 'queryGrid',
            selector: 'filingYunQueryPanel > grid[class="query"]'
        },
        {
            ref: 'addFilingYunWin',
            selector: 'addFilingYunWin'
        }
    ],
    init : function() {
        this.control({
            'filingYunQueryPanel >  button#btn_filing_add': {
                click: this.showAdd
            },
            'addFilingYunWin >  button#serviceNum_new_button':{
                click: this.add
            },
            'filingYunQueryPanel > grid[class="query"]': {
                selectionchange: this.enableDockItems
//                itemdblclick: this.showUpdate
            }
        });
        this.initFlag = true;
    },
    add:function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if(form.form.isValid()){
            var fieldset = form.down('fieldset');
            var param = App.util.AppUtil.getFormParam(fieldset);

            App.util.AppUtil.request('bill.resource.addFilingNum',param,function(data,self){
                if(data.success){
                    win.close();
                    App.util.AppUtil.msg("添加备案成功！");
                    var queryGrid =self.getQueryGrid();
                    queryGrid.store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }
    },
    showAdd: function (obj) {
        var win = Ext.create('App.view.resource.filingYun.add', {
            animateTarget: obj
        });
        win.show();
    },
    enableDockItems: function (selModel, selections) {
        App.util.AppUtil.commonDock(selections,this);
    }

});