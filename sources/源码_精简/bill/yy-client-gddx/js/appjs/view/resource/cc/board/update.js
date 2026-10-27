Ext.define('App.view.resource.cc.board.update', {
    extend: 'Ext.window.Window',
    alias: 'widget.ccupdateBoardWindow',
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
                                    store: ['阿里云','北京','上海','广州','深圳'],
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth: .25,
                                    allowBlank: false,
                                    value: this.data.location
                                },
                                {
                                    fieldLabel: '所属代理',
                                    xtype: 'combobox',
                                    name: 'owner',
                                    value:this.data.owner,
                                    store: this.getProxyStore(),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    editable:true,
                                    forceSelection:true,
                                    listeners:{
                                        change:function(){
                                            if (this.getValue() === null) {
                                                this.reset();
                                            }
                                        }
                                    }
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
                    class: 'commit_button',
                    listeners:{
                        mouseover:function(obj,event){
                            var win = obj.up('window');
                            var owner = win.down("combobox[name=owner]");
                            owner.triggerBlur();
                            owner.blur();
                        }
                    }
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
    getProxyStore : function(){
        var store = App.util.AppUtil.getDicStore('systemUser');
        var proxy = Ext.create('Ext.data.Store', {
            model: 'App.model.common.DicCache',
            data: []
        });
        store.each(function(item){
            if(item.get("identity") == "proxy"){
                proxy.add(item);
            }
        });
        return proxy;
    }

});
