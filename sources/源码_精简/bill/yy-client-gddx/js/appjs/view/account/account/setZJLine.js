Ext.define('App.view.account.account.setZJLine', {
    extend: 'Ext.window.Window',
    alias: 'widget.setZJLineWindow',
    width: 350,
    layout: {
        type: 'anchor'
    },
    modal: true,
    zjProductModel:null,
    title: '总机线路设置',
    data: null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'form',
                    frame: true,
                    title: '',
                    bodyStyle: 'padding:2px 2px 0',
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 90,
                        labelAlign: 'right'
                    },
                    items: this.getOutRoutes()
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'saveProductZJLine'
                },
                {
                    text: '关闭',
                    handler: function (obj) {
                        var win = obj.up('window');
                        win.close();
                    }
                }
            ]
        });
        me.callParent(arguments);
    },
    getOutRoutes : function(){
        var items = [];
        var fieldset = {
            xtype: 'fieldset',
            title: '总机线路设置',
            collapsible: true,
            defaultType: 'textfield',
            items : [
                {
                    xtype : 'textfield',
                    name: '_id',
                    value: this.zjProductModel.get("_id"),
                    hidden: true
                },
                {
                    xtype : 'textfield',
                    name: 'pbx',
                    value: this.getPBX(),
                    hidden: true
                },
                {
                    xtype : 'textfield',
                    name: 'account',
                    value: this.zjProductModel.get('account'),
                    hidden: true
                },
                {
                    fieldLabel: '外呼路由',
                    name: 'zjOutRoute',
                    value:this.zjProductModel.get('zjOutRoute'),
                    xtype: 'combobox',
                    store: App.util.AppUtil.getDicStore('zjOutRouteByPBX',true,{pbx:this.getPBX()}),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    typeAhead: true,
                    queryMode: 'local',
                    allowBlank: false
                },
                {
                    fieldLabel: '呼转路由',
                    name: 'zjTransferRoute',
                    value:this.zjProductModel.get('zjTransferRoute'),
                    xtype: 'combobox',
                    store: App.util.AppUtil.getDicStore('zjOutRouteByPBX',true,{pbx:this.getPBX()}),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    typeAhead: true,
                    queryMode: 'local',
                    allowBlank: false
                }
            ]
        };
        items.push(fieldset);
        return items;
    },
    getPBX: function () {
        var pbxArr = this.zjProductModel.get('pbx');
        if(pbxArr && pbxArr.length>0){
            return pbxArr[0].pbx;
        }
    }


});
