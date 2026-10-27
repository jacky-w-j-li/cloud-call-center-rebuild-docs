Ext.define('App.view.resource.board.add', {
    extend: 'Ext.window.Window',
    alias: 'widget.addBoardWindow',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,

    title: '新增机柜',

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
                        width : 300
                    },
                    items: [
                        {
                            xtype: 'fieldset',
                            title: '机柜信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    fieldLabel: '机柜编号',
                                    name: '_id',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '机柜名称',
                                    name: 'name',
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '机柜地区',
                                    xtype: 'combobox',
                                    name: 'location',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('location',true),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25,
                                    allowBlank: false,
                                    listeners : {
                                        change : function(obj,value){
                                            var combox = me.down("#buildingSelect");
                                            combox.reset();
                                            combox.store.removeAll();
                                            App.util.AppUtil.getDicStoreData('building',{location:value},function(data){
                                               combox.store.loadData(data);
                                            });
                                        }
                                    }
                                },
                                {
                                    fieldLabel: '写字楼',
                                    id : 'buildingSelect',
                                    xtype: 'combobox',
                                    name: 'building',
                                    editable: false,
                                    store: Ext.create('Ext.data.Store', {
                                        autoLoad : true,
                                        model: 'App.model.common.DicCache',
                                        data :[]
                                    }),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    queryMode : 'local',
                                    allowBlank: false,
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '备注',
                                    name: 'memo',
                                    xtype: 'textarea'
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '创建',
                    id: 'commit_button'
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