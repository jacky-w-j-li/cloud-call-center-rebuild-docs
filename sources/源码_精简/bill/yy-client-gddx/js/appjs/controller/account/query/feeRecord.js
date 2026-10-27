Ext.define('App.controller.account.query.feeRecord', {
    extend : 'Ext.app.Controller',
    views : [],
    models : [],
    initFlag : false,
    refs : [
        {
            ref: 'feeRecordQueryPanel',
            selector: 'feeRecordQueryPanel'
        },
        {
            ref: 'feeRecord2CustPanel',
            selector: 'feeRecord2CustPanel'
        }
    ],
    init : function() {
        this.control({
            'feeRecordQueryPanel >  panel#customer_fee_panel': {
                beforeactivate: this.showCustFeeView
            },
            'feeRecord2CustPanel >  button#btn_export_fee_cust': {
                click : this.exportFee2Cust
            }
        });
        this.initFlag = true;
    },
    showCustFeeView : function(obj){
        if(obj.items.length==0){
            var panel = Ext.create('App.view.account.query.feeRecord2Cust', {
                animateTarget: obj
            });
            obj.add(panel);
        }
    },
    exportFee2Cust : function(obj){
        var form = obj.up("form");
        if (form.form.isValid()) {
            var fieldSet = form.down("fieldset[class='query']");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            data.Method="exportFeeCust";
//            console.dir(data);
            App.util.AppUtil.request('bill.export.exportBillXls', data, function (rep, self) {
                if (rep.Succeed) {
                    self.downloadFile(rep.path);
//                    App.util.AppUtil.msg("导出成功！");
                } else {
                    App.util.AppUtil.msg(rep.message);
                }
            }, this);
        }
    },
    downloadFile: function (fileUrl) {
//        var url = fileUrl + "&sessionId=" + session.id;
        var url = fileUrl;
        var container = {
            id: 'downloadFile_Frame',
            tag: 'iframe',
            style: 'display:none'
        };
        var frame=Ext.getDom("downloadFile_Frame");
//        console.info(url);
        if(!frame){
            Ext.DomHelper.append(Ext.getBody(),container);
            frame=Ext.getDom("downloadFile_Frame");
        }

//        console.dir(frame);
        frame.src=url;
    }
})