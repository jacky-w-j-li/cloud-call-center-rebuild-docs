Ext.define('App.view.account.account.selectCCOutPbx', {
    extend: 'Ext.window.Window',
    alias: 'widget.selectCCOutPbxWindow',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    data: null,
    title: '选择呼叫中心节点',
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
                    items: [
                        {
                            xtype: 'fieldset',
                            title: '节点信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name: 'account',
                                    value: this.data.account,
                                    hidden: true
                                },
                                {
                                    fieldLabel: '节点',
                                    name: 'pbx',
                                    value: this.data.pbx[0].PBX,
                                    editable: false,
                                    xtype: 'combobox',
                                    store: this.getPbxStore(),
                                    displayField: 'NickName',
                                    valueField: 'PBX',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    allowBlank: false
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '确认',
                    id: 'btn_select_cc_out_pbx'
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
    getPbxStore: function () {
        var pbxs=this.data.pbx;
//        console.dir(pbxs);
        var fields = [];
        if (pbxs && pbxs.length > 0) {
            var code = pbxs[0];
            for (var p in code) {
                fields.push(p);
            }
        }
        var store = Ext.create('Ext.data.Store', {
            fields: fields,
            data: pbxs
        });
        return store;
    }
});
