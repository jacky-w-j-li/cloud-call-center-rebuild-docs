Ext.define('App.view.resource.cc.board.updateOutLine', {
    extend: 'Ext.window.Window',
    alias: 'widget.ccupdateBoardOutLineWindow',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '更新线路信息',
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
                        labelAlign: 'right',
                        width: 300
                    },
                    items: [
                        {
                            xtype: 'fieldset',
                            title: '线路信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name : "_id",
                                    value : this.data._id,
                                    hidden:true
                                },
//                                {
//                                    fieldLabel: '线路编号',
//                                    xtype:'combobox',
//                                    name: 'number',
//                                    id:'lineNumber',
//                                    value:this.data.number,
//                                    store: App.util.AppUtil.getDicStore('line'),
//                                    displayField:'codeName',
//                                    valueField:'codeValue',
//                                    allowBlank: false,
//                                    listeners: {
//                                        change: function (obj, newvalue) {
//                                            var strategy = newvalue;
//                                            var panel = obj.up('fieldset').down("#lineName");
//                                            panel.setValue(obj.rawValue);
//                                        }
//                                    }
//                                },
//                                {
//                                    fieldLabel: '线路名称',
//                                    id:'lineName',
//                                    name: 'name',
//                                    value: this.data.name,
//                                    readOnly:true,
//                                    maxLength: 50,
//                                    maxLengthText: '最大长度不能超过50个字符！',
//                                    allowBlank: false
//                                },
                                {
                                    fieldLabel: '线路编号',
                                    name: 'number',
                                    allowBlank: false,
                                    value : this.data.number
                                },
                                {
                                    fieldLabel: '线路内容',
                                    xtype: 'textarea',
                                    name: 'context',
                                    allowBlank:false,
                                    value : this.data.context
                                },
                                {
                                    fieldLabel: '备注',
                                    name: 'backInfo',
                                    value: this.data.backInfo,
                                    xtype: 'textarea'
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '修改',
                    class: 'commit_button'
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
    }

});
