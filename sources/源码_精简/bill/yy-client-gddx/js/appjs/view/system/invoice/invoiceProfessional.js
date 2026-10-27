Ext.define('App.view.system.invoice.invoiceProfessional', {
    extend: 'Ext.window.Window',
    requires: [],
    alias: 'widget.invoiceProfessionalWin',
    height: 500,
    width: 850,
    title: '专票明细',
    layout: 'fit',
    data: null,
    initComponent: function () {
        Ext.QuickTips.init();
        var me = this;
        Ext.applyIf(me, {
            modal: true,
            items: [
                {
                    xtype: 'panel',
                    autoScroll: true,
                    frame: true,
                    items: this.getBaseInfo()
                }
            ]
        });
        me.callParent(arguments);
    },
    getBaseInfo: function () {
        var items = new Array();
        var baseInfo = {
            xtype: 'fieldset',
            collapsible: true,
            title: '专票明细',
            cls: 'backgroud_blue',
            defaults: {
                msgTarget: 'side',
                labelWidth: 120,
                labelAlign: 'right',
                fieldCls: 'field_disable_cls',
                readOnly: true
            },
            defaultType: 'textfield',
            layout: {
                type: 'column'
            },
            items: [
                {
                    fieldLabel: '发票抬头',
                    value: this.data.invoiceTitle,
                    columnWidth: .6
                },
                //{
                //    fieldLabel: '发票类型',
                //    value: "增值税专用发票",
                //    columnWidth: .5
                //},

                {
                    fieldLabel: '税务登记证号',
                    value: this.data.registerNo,
                    columnWidth: .6
                },
                {
                    fieldLabel: '基本开户银行名称',
                    value: this.data.bank,
                    columnWidth: .6
                },
                {
                    fieldLabel: '基本开户账号',
                    value: this.data.bankNo,
                    columnWidth: .6
                },
                {
                    fieldLabel: '注册场所地址',
                    value: this.data.registerAddr,
                    columnWidth: .6
                },
                {
                    fieldLabel: '注册固定电话',
                    value: this.data.registerTel,
                    columnWidth: .6
                },
                {
                    xtype: 'panel',
                    //autoScroll: true,
                    frame: true,
                    columnWidth: 1,
                    height:200,
                    html:'<div><span style="display: inline-block;width: 160px;text-align: right;margin-right: 10px;">营业执照复印件:</span> ' +
                    '<a href="http://7xj0za.com1.z0.glb.clouddn.com/' +this.data.busLicense+ '" target="_blank">'+
                    '<img src="http://7xj0za.com1.z0.glb.clouddn.com/' +this.data.busLicense+ '?imageView2/1/w/50" class="" style="width:50px;max-height: 50px;">'+
                    '</a></div>'+
                    '<div><span style="display: inline-block;width: 160px;text-align: right;margin-right: 10px;">税务登记复印件:</span> ' +
                    '<a href="http://7xj0za.com1.z0.glb.clouddn.com/' +this.data.taxCard+ '" target="_blank">'+
                    '<img src="http://7xj0za.com1.z0.glb.clouddn.com/' +this.data.taxCard+ '?imageView2/1/w/50" class="" style="width:50px;max-height: 50px;">'+
                    '</a></div>'+
                    '<div><span style="display: inline-block;width: 160px;text-align: right;margin-right: 10px;">一般纳税人资格认证复印件:</span> ' +
                    '<a href="http://7xj0za.com1.z0.glb.clouddn.com/' +this.data.taxpayerIdentify+ '" target="_blank">'+
                    '<img src="http://7xj0za.com1.z0.glb.clouddn.com/' +this.data.taxpayerIdentify+ '?imageView2/1/w/50" class="" style="width:50px;max-height: 50px;">'+
                    '</a></div>'
                }
            ]

        }
        items.push(baseInfo);

        return items;
    }
});
