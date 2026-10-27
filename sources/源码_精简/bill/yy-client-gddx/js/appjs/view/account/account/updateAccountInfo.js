Ext.define('App.view.account.account.updateAccountInfo', {
    extend: 'Ext.window.Window',
    alias: 'widget.updateAccountInfoWindow',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    account: null,
    title: '账户信息',
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
                                    name: '_id',
                                    value: this.account.get('_id'),
                                    hidden: true
                                },
                                {
                                    fieldLabel: '公司名称',
                                    name: 'companyName',
                                    value: this.account.get('companyName'),
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '账户名称',
                                    name: 'name',
                                    value: this.account.get('name'),
                                    regex: /^[A-Za-z0-9.\-_]+$/,
                                    regexText: '只能输入字母和数字和点！',
                                    maxLength: 30,
                                    //readOnly:true,
                                    maxLengthText: '最大长度不能超过30个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '密码',
                                    name: 'managerPassword',
                                    value: this.account.get('managerPassword'),
                                    regex: /^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]{8,}$/,
                                    regexText: '必须是数字和字母的组合,且不少于8个字符!',
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
//                                    hidden : App.util.AppUtil.proxyNopass()
                                },
                                {
                                    fieldLabel: '联系人姓名',
                                    name: 'linkManName',
                                    value: this.account.get('linkManName'),
                                    maxLength: 20,
                                    maxLengthText: '最大长度不能超过20个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '联系人电话',
                                    name: 'linkManPhone',
                                    value: this.account.get('linkManPhone'),
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '联系人邮箱',
                                    name: 'linkManEmail',
                                    value: this.account.get('linkManEmail'),
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '账户类型',
                                    xtype: 'combobox',
                                    name: 'accountType',
                                    store: this.getAccountTypeStore(),
                                    value: this.account.get('accountType'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    /*queryMode: 'local',*/
                                    editable: false,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '客户经理',
                                    xtype: 'combobox',
                                    name: 'customerCare',
                                    store: this.getCustomerCareStore(),
                                    value: this.account.get('customerCare'),
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
                                    value: this.account.get('consultant'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    editable: true
                                },
                                {
                                    fieldLabel: '账号来源',
                                    xtype: 'combobox',
                                    name: 'createMethod',
                                    //value:this.getCreateMethod(this.account.get('createMethod')),
                                    value:this.account.get('createMethod'),
                                    store: this.getCreateMethodStore(),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    //allowBlank: false,
                                    hidden:App.util.AppUtil.isHideWidget(),
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
                                    value:this.account.get('area'),
                                    store: App.util.AppUtil.getDicStore("wwwArea"),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    editable: false,
                                    hidden: this.account.get('createMethod') == 'www'?false:true
                                },
                                {
                                    fieldLabel: '行业',
                                    id: 'industry',
                                    xtype: 'combobox',
                                    name: 'industry',
                                    value:this.account.get('industry'),
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
                                    value:this.account.get('subIndustry'),
                                    store:App.util.AppUtil.getDicStore("industry",true,{categoryLevel:"2",parent:this.account.get("industry")}),
                                    typeAhead: true,
                                    queryMode: 'local',
                                    loadingText: null,
                                    loadMask: false
                                },
                                {
                                    fieldLabel: '所属人',
                                    xtype: 'combobox',
                                    name: 'createUser',
                                    value: this.account.get('createUser'),
                                    store: this.getCreateUserStore(),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    editable:true,
                                    //hidden: App.util.AppUtil.isHideWidget()
                                },
                                {
                                    fieldLabel: '公司简介',
                                    name: 'memo',
                                    value: this.account.get('memo'),
                                    xtype: 'textarea'
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '更新',
                    id: 'update_account_button'
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
        return App.util.AppUtil.getDicStore('accountType', true);
    },
    getCreateMethodStore : function(){
        var store = App.util.AppUtil.getDicStore('accountOrigin');
        var method = Ext.create('Ext.data.Store', {
            model: 'App.model.common.DicCache',
            data: []
        });
        store.each(function(item){
            if(gloab_client_user.identity != 'proxy'){
                if(item.get("codeValue") != "register"){
                    method.add(item);
                }
            }else{
                if(item.get("codeValue") == "proxy"){
                    method.add(item);
                }
            }
        });
        return method;
    },
    getProxyStore : function(){
        var store = App.util.AppUtil.getDicStore('systemUser');
        var proxy = Ext.create('Ext.data.Store', {
            model: 'App.model.common.DicCache',
            data: []
        });
        store.each(function(item){
            if(gloab_client_user.identity != 'proxy'){
                if(item.get("identity") == "proxy"){
                    proxy.add(item);
                }
            }
        });
        return proxy;
    },
    getProxyId: function(){
        var createMethod=this.account.get('createMethod');
        var createUser=this.account.get('createUser');
        var proxy="";
        if(createMethod=='proxy'){
            proxy=createUser;
        }
        return proxy;
    },
    getCreateUserStore:function(){
        if(gloab_client_user.identity == 'proxy'){
            var store =  App.util.AppUtil.getDicStore('proxyUserAllLower',true,{userId:gloab_client_user._id});
            return store;
        }
        return App.util.AppUtil.getDicStore('systemUser');
    }
});
