Ext.define('App.view.resource.openIntlFee.showDetail', {
    extend: 'Ext.window.Window',
    requires: [],
    alias: 'widget.showDetailWin',
    height: 300,
    width: 750,
    title: '详情',
    layout: 'fit',
    data: null,
    initComponent: function () {
        Ext.QuickTips.init();
        var me = this;
        Ext.applyIf(me, {
            modal: true,
            items: [
                {
                    xtype: 'tabpanel',
                    activeTab: 0,
                    deferredRender: false,
                    items: [
                        {
                            xtype: 'panel',
                            title: '详细信息',
                            frame: true,
                            items: this.getItems()
                        }
                    ]
                }
            ]
        });
        me.callParent(arguments);
    },
    getItems: function () {
        var items = new Array();
        var fieldSet = {
            xtype: 'fieldset',
            id: 'intlFee_find_serviceNumInfo',
            collapsible: true,
            title: '详细信息',
            cls: 'backgroud_blue',
            defaults: {
                msgTarget: 'side',
                labelWidth: 80,
                labelAlign: 'right',
//                fieldCls: 'field_disable_cls',
                readOnly: true
            },
            defaultType: 'displayfield',
            layout: {
                type: 'column'
            },
            items: [
                {
                    fieldLabel: '服务号',
                    value: this.data._id,
                    columnWidth: .33
                },
                {
                    fieldLabel: '状态',
                    value: this.showStatusDesc(),
                    columnWidth: .33
                },
                {
                    fieldLabel: '账户编号',
                    value: this.data.account,
                    columnWidth: .33
                },
                {
                    fieldLabel: '公司名称',
                    value: this.data.companyName,
                    columnWidth: .33
                }
            ]

        }
        items.push(fieldSet);
        return items;
    },
    showStatusDesc:function(){
        var val=this.data.status;
        val=App.util.AppUtil.getRendererValue(val, 'serviceNumType');
        return  val;
    }

});