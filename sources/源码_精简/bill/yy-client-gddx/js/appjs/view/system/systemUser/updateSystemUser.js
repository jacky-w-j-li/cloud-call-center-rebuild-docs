Ext.define('App.view.system.systemUser.updateSystemUser', {
    extend: 'Ext.window.Window',
    alias: 'widget.updateSystemUserWindow',
    width: 380,
    layout: {
        type: 'anchor'
    },
    requires: ['Ext.ux.form.ItemSelector', 'Ext.ux.form.MultiSelect'],
    modal: true,
    user: null,
    title: '系统用户信息',
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
                            title: '系统用户信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    name: '_id',
                                    value: this.user.get('_id'),
                                    hidden: true
                                },
                                {
                                    fieldLabel: '用户名称',
                                    name: 'name',
                                    value: this.user.get('name'),
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '登录名',
                                    name: 'loginName',
                                    value: this.user.get('loginName'),
                                    regex: /^[A-Za-z0-9]+$/,
                                    regexText: '只能输入字母和数字！',
                                    maxLength: 30,
                                    maxLengthText: '最大长度不能超过30个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '密码',
                                    name: 'password',
                                    value: this.user.get('password'),
                                    maxLength: 30,
                                    maxLengthText: '最大长度不能超过30个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '身份',
                                    name: 'identity',
                                    value: this.user.get('identity'),
                                    xtype: 'combobox',
                                    store: App.util.AppUtil.getDicStore('userIdentity'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    allowBlank: false,
                                    listeners: {
                                        change: function (obj, newvalue) {
                                            var panel = obj.up('fieldset').down("#add_user_proxy_level_panel");
                                            panel.removeAll();
                                            var items = [];
                                            if(newvalue == "proxy"){
                                                items = [
                                                    {
                                                        fieldLabel: '代理等级',
                                                        name: 'proxyLevel',
                                                        xtype: 'combobox',
                                                        store: App.util.AppUtil.getDicStore('proxyLevel'),
                                                        displayField: 'codeName',
                                                        valueField: 'codeValue',
                                                        typeAhead: true,
                                                        queryMode: 'local',
                                                        allowBlank: false
                                                    },
                                                    {
                                                        fieldLabel: '代理类型',
                                                        name: 'proxyType',
                                                        xtype: 'combobox',
                                                        store: App.util.AppUtil.getDicStore('proxyType'),
                                                        displayField: 'codeName',
                                                        valueField: 'codeValue',
                                                        typeAhead: true,
                                                        queryMode: 'local',
                                                        allowBlank: false
                                                    }
                                                ];
                                            }
                                            panel.add(items);
                                        }
                                    }
                                },
                                {
                                    xtype: 'panel',
                                    layout: "column",
                                    border: false,
                                    bodyStyle: {
                                        background: '#DFE9F6'
                                    },
                                    id: 'add_user_proxy_level_panel',
                                    columnWidth: 1,
                                    items: me.getProxyLevel()
                                },
                                {
                                    xtype: 'itemselector',
                                    name: 'role',
                                    id: 'itemselector-field',
                                    anchor: '100%',
                                    fieldLabel: '角色',
                                    //imagePath: '/ux/css/images/',
                                    availableTitle:'可选',
                                    blankText: "该项为必输项",
                                    selectedTitle:'已选',
                                    store: App.util.AppUtil.getDicStore("role"),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    value: this.user.get("role"),
                                    buttonsText: {
                                        top: "移至顶部",
                                        up: "上移",
                                        add: "添加",
                                        remove: "移除",
                                        down: "下移",
                                        bottom: "移至底部"
                                    },
                                    allowBlank: false,
                                    msgTarget: 'side'
                                },
                                {
                                    fieldLabel: '上级',
                                    name: 'parent',
                                    value: this.user.get('parent'),
                                    xtype: 'combobox',
                                    store: this.getParentStore(this),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    allowBlank: true
                                },
                                {
                                    fieldLabel: '联系人姓名',
                                    name: 'linkManName',
                                    value: this.user.get('linkManName'),
                                    maxLength: 20,
                                    maxLengthText: '最大长度不能超过20个字符！',
                                    allowBlank: true
                                },
                                {
                                    fieldLabel: '联系人电话',
                                    name: 'linkManPhone',
                                    value: this.user.get('linkManPhone'),
                                    allowBlank: true
                                },
                                {
                                    fieldLabel: '联系人邮箱',
                                    name: 'linkManEmail',
                                    value: this.user.get('linkManEmail'),
                                    allowBlank: true
                                },

                                {
                                    fieldLabel: '备注',
                                    name: 'memo',
                                    value: this.user.get('memo'),
                                    xtype: 'textarea'
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'update_user_button'
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
    getProxyLevel:function(){
        var identity = this.user.get('identity');
        var item = [];
        if(identity == "proxy"){
            item = [
                {
                    fieldLabel: '代理等级',
                    name: 'proxyLevel',
                    xtype: 'combobox',
                    value:this.user.get('proxyLevel'),
                    store: App.util.AppUtil.getDicStore('proxyLevel'),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    typeAhead: true,
                    queryMode: 'local',
                    allowBlank: false
                },
                {
                    fieldLabel: '代理类型',
                    name: 'proxyType',
                    xtype: 'combobox',
                    value:this.user.get('proxyType'),
                    store: App.util.AppUtil.getDicStore('proxyType'),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    typeAhead: true,
                    queryMode: 'local',
                    allowBlank: false
                }
            ];
        }
        return item;
    },
    getParentStore : function(self){
        var store = App.util.AppUtil.getDicStore('systemUser');
        var parent = Ext.create('Ext.data.Store', {
            model: 'App.model.common.DicCache',
            data: []
        });
        store.each(function(item){
            //if(gloab_client_user.identity == 'admin'){
                if(item.get("identity") != "admin"){
                    parent.add(item);
                }
            //}
        });
        return parent;
    }
});
