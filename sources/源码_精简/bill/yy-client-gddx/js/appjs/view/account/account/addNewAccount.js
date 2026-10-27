Ext.define('App.view.account.account.addNewAccount', {
    extend: 'Ext.window.Window',
    alias: 'widget.addNewAccountWindow',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '新增账户',
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
                            title: '账户信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    fieldLabel: '公司名称',
                                    name: 'companyName',
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '账户名称',
                                    name: 'name',
                                    regex: /^[A-Za-z0-9.\-_]+$/,
                                    regexText: '只能输入字母和数字和点！',
                                    maxLength: 30,
                                    maxLengthText: '最大长度不能超过30个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '密码',
                                    name: 'managerPassword',
                                    regex: /^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]{8,}$/,
                                    regexText: '必须是数字和字母的组合,且不少于8个字符!',
                                    value: (function(){
                                        return App.util.AppUtil.randomString(4,'0123456789') + App.util.AppUtil.randomString(4,'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
                                    })(),
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '联系人姓名',
                                    name: 'linkManName',
                                    maxLength: 20,
                                    maxLengthText: '最大长度不能超过20个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '联系人电话',
                                    name: 'linkManPhone',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '联系人邮箱',
                                    name: 'linkManEmail',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '账户类型',
                                    xtype: 'combobox',
                                    name: 'accountType',
                                    value: 'normal',
                                    store: this.getAccountTypeStore(),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    editable: false,
                                    allowBlank: false,
                                    hidden: App.util.AppUtil.isHideWidget()
                                },
                                {
                                    fieldLabel: '客户经理',
                                    xtype: 'combobox',
                                    name: 'customerCare',
                                    store: this.getCustomerCareStore(),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    editable: true
                                },
                                {
                                    fieldLabel: '技术顾问',
                                    xtype: 'combobox',
                                    name: 'consultant',
                                    store: this.getConsultantStore(),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    editable: true
                                },
                                //{
                                //    fieldLabel: '所属代理',
                                //    xtype: 'combobox',
                                //    name: 'createUser',
                                //    store: this.getProxyStore(),
                                //    displayField: 'codeName',
                                //    valueField: 'codeValue',
                                //    typeAhead: true,
                                //    queryMode: 'local',
                                //    editable:false,
                                //    hidden:App.util.AppUtil.isHideWidget()
                                //},
                                {
                                    fieldLabel: '账号来源',
                                    xtype: 'combobox',
                                    name: 'createMethod',
                                    store: this.getCreateMethodStore(),
                                    value: '计费创建',
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    editable: false,
                                    //allowBlank: false,
                                    hidden: App.util.AppUtil.isHideWidget(),
                                    listeners: {
                                        change: {
                                            fn: function (self, value) {
                                                if (value == 'www') {
                                                    Ext.getCmp("wwwArea_select").show();
                                                } else {
                                                    Ext.getCmp("wwwArea_select").hide();
                                                }
                                            }
                                        }
                                    }
                                },
                                {
                                    fieldLabel: '所属地区',
                                    id: 'wwwArea_select',
                                    xtype: 'combobox',
                                    name: 'area',
                                    store: App.util.AppUtil.getDicStore("wwwArea"),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    editable: false,
                                    hidden: true
                                },
                                {
                                    fieldLabel: '行业',
                                    xtype: 'combobox',
                                    name: 'industry',
                                    store: App.util.AppUtil.getDicStore("industry",true,{categoryLevel:"1"}),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    editable:true,
                                    listeners: {
                                        change: function(obj,newvalue,oldvalue){
                                            var subCombo = obj.up('fieldset').down("combobox[name=subIndustry]");
                                            subCombo.setValue(null);
                                            var store = App.util.AppUtil.getDicStore("industry",true,{categoryLevel:"2",parent:newvalue});
                                            store.on('load', function (store, records, successful, options) {
                                                if (successful && Ext.typeOf(subCombo.getPicker().loadMask) !== "boolean") {
                                                    subCombo.getPicker().loadMask.hide();
                                                }
                                            });

                                            subCombo.bindStore(store);
                                        }

                                    }
                                },
                                {
                                    fieldLabel:" ",
                                    labelSeparator: '&nbsp',
                                    xtype: 'combobox',
                                    name: 'subIndustry',
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    editable:true,
                                },
                                {
                                    fieldLabel: '所属人',
                                    xtype: 'combobox',
                                    name: 'createUser',
                                    store: App.util.AppUtil.getDicStore('systemUser'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    editable: true,
                                    hidden: App.util.AppUtil.isHideWidget()
                                },

//                                {
//                                    fieldLabel: '互联网账户',
//                                    name : "isWww",
//                                    xtype: 'checkbox',
//                                    inputValue: true,
//
//                                },

                                {
                                    fieldLabel: '公司简介',
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
                    id: 'create_new_account_button'
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
    getCustomerCareStore: function () {
        var store = App.util.AppUtil.getDicStore('systemUser');
        store.each(function (item) {
            if (item.get("identity") !== "customerCare") {
                store.remove(item);
            }
        });
        return store;
    },
    getConsultantStore: function () {
        var store = App.util.AppUtil.getDicStore('systemUser');
        store.each(function (item) {
            if (item.get("identity") !== "consultant") {
                store.remove(item);
            }
        });
        return store;
    },
    getAccountTypeStore: function () {
        // return App.util.AppUtil.getDicStore('accountType', true);
        return App.util.AppUtil.getDicStore('accountType');
    },
    getCreateMethodStore: function () {
        var store = App.util.AppUtil.getDicStore('accountOrigin');
        var method = Ext.create('Ext.data.Store', {
            model: 'App.model.common.DicCache',
            data: []
        });
        store.each(function (item) {
            if (gloab_client_user.identity != 'proxy') {
                method.add(item);
            } else {
                if (item.get("codeValue") == "proxy") {
                    method.add(item);
                }
            }
        });
        return method;
    },
    getProxyStore: function () {
        var store = App.util.AppUtil.getDicStore('systemUser');
        var proxy = Ext.create('Ext.data.Store', {
            model: 'App.model.common.DicCache',
            data: []
        });
        store.each(function (item) {
            if (gloab_client_user.identity != 'proxy') {
                if (item.get("identity") == "proxy") {
                    proxy.add(item);
                }
            }
        });
        return proxy;
    }

});
