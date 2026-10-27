Ext.define('App.view.resource.board.update', {
    extend: 'Ext.window.Window',
    alias: 'widget.updateBoardWindow',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '更新机柜信息',
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
                            title: '机柜信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    fieldLabel: '机柜编号',
                                    name: '_id',
                                    value: this.data._id,
                                    readOnly: true,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '机柜名称',
                                    name: 'name',
                                    value: this.data.name,
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '机柜地区',
                                    xtype: 'combobox',
                                    name: 'location',
                                    editable: false,
                                    store: App.util.AppUtil.getDicStore('location', true),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25,
                                    allowBlank: false,
                                    value: this.data.location,
                                    listeners: {
                                        change: function (obj, value, flag, selectVlaue) {
                                            var combox = me.down('combobox[name="building"]');
                                            combox.reset();
                                            combox.store.removeAll();
                                            App.util.AppUtil.getDicStoreData('building', {location: value}, function (data) {
                                                combox.store.loadData(data);
                                                if (flag === true && selectVlaue) {
                                                    combox.setValue(selectVlaue);
                                                }
                                            });
                                        }
                                    }
                                },
                                {
                                    fieldLabel: '大楼',
                                    xtype: 'combobox',
                                    name: 'building',
                                    editable: false,
                                    store: Ext.create('Ext.data.Store', {
                                        autoLoad: true,
                                        model: 'App.model.common.DicCache',
                                        data: []
                                    }),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    queryMode: 'local',
//                                    value : this.data.building,
                                    allowBlank: false,
                                    columnWidth: .25
                                },
                                {
                                    fieldLabel: '开户pbx',
                                    xtype: 'combobox',
                                    name: 'currentAccountPbx',
                                    editable: false,
                                    store: Ext.create('Ext.data.Store', {
                                        autoLoad: true,
                                        model: 'App.model.common.DicCache',
                                        data: []
                                    }),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    queryMode: 'local'

                                },
                                {
                                    fieldLabel: '备注',
                                    name: 'memo',
                                    value: this.data.memo,
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

        var locationCombo = me.down("combobox[name='location']");
        locationCombo.fireEvent('change', locationCombo, locationCombo.getValue(), true, this.data.building);


        App.util.AppUtil.getDicStoreData('pbx',{board:this.data._id},function (data){
            var combox = me.down('combobox[name="currentAccountPbx"]');
            combox.reset();
            combox.store.removeAll();
            combox.store.loadData(data);
            combox.setValue(me.data.currentAccountPbx);
        })
    }

});
