Ext.define('App.view.system.systemUser.addSystemUser', {
    extend: 'Ext.window.Window',
    alias: 'widget.addSystemUserWindow',
    width: 380,
    layout: {
        type: 'anchor'
    },
    requires: ['Ext.ux.form.ItemSelector', 'Ext.ux.form.MultiSelect'],
    modal: true,
    title: '新增系统用户',

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
                                    fieldLabel: '用户名称',
                                    name: 'name',
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '登录名',
                                    name: 'loginName',
                                    regex: /^[A-Za-z0-9]+$/,
                                    regexText: '只能输入字母和数字！',
                                    maxLength: 30,
                                    maxLengthText: '最大长度不能超过30个字符！',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '密码',
                                    name: 'password',
                                    maxLength: 30,
                                    maxLengthText: '最大长度不能超过30个字符！',
                                    allowBlank: false,
                                    value: function(){
                                        var text = "";
                                        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                                        for(var i=0; i < 6; i++){
                                            text += possible.charAt(Math.floor(Math.random() * possible.length));
                                        }

                                        return text;
                                    }()
                                },
                                {
                                    fieldLabel: '身份',
                                    name: 'identity',
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
                                                        id: 'add_user_proxy_level_level',
                                                        xtype: 'combobox',
                                                        store: App.util.AppUtil.getDicStore('proxyLevel'),
                                                        displayField: 'codeName',
                                                        valueField: 'codeValue',
                                                        typeAhead: true,
                                                        queryMode: 'local',
                                                        allowBlank: false,
                                                        listeners: {
                                                            change: function(obj,newvalue,oldvalue){
                                                                var typeComobo = obj.up('fieldset').down("#add_user_proxy_level_type");
                                                                var typeValue = typeComobo.getValue();
                                                                if(oldvalue){
                                                                    if(
                                                                        (newvalue == '0' && oldvalue == '0')
                                                                        ||
                                                                        (newvalue != '0' && oldvalue != '0')
                                                                    ){
                                                                        return;
                                                                    }
                                                                }
                                                                if(newvalue != '0' ){
                                                                    if(typeValue != 'channel' && typeValue != 'other'){
                                                                        typeComobo.setValue("channel");
                                                                    }
                                                                }else if (typeValue == 'channel' || typeValue == 'other'){
                                                                    //自己人
                                                                    typeComobo.setValue("mysales");
                                                                }

                                                                return false;
                                                            }

                                                        }
                                                    },
                                                    {
                                                        fieldLabel: '代理类型',
                                                        name: 'proxyType',
                                                        id: 'add_user_proxy_level_type',
                                                        xtype: 'combobox',
                                                        store: App.util.AppUtil.getDicStore('proxyType'),
                                                        displayField: 'codeName',
                                                        valueField: 'codeValue',
                                                        typeAhead: true,
                                                        queryMode: 'local',
                                                        allowBlank: false,
                                                        listeners: {
                                                            change: function(obj,newvalue,oldvalue){
                                                                var levelComobo = obj.up('fieldset').down("#add_user_proxy_level_level");
                                                                var levelValue = levelComobo.getValue();
                                                                if(oldvalue){
                                                                    if(
                                                                        ((newvalue != 'channel' && newvalue != 'other') && (oldvalue != 'channel' && oldvalue != 'other'))
                                                                        ||
                                                                        ((newvalue == 'channel' || newvalue == 'other') && (oldvalue == 'channel' || oldvalue == 'other'))

                                                                    ){
                                                                        return;
                                                                    }
                                                                }

                                                                if(newvalue != 'channel' && newvalue != 'other'){
                                                                    if(levelValue != '0'){
                                                                        //自己人
                                                                        levelComobo.setValue("0");
                                                                    }
                                                                }else if(levelValue == '0'){
                                                                    levelComobo.setValue("1");
                                                                }

                                                                return false;
                                                            }
                                                        }
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
                                    items: []
                                },
                                {
                                    xtype: 'itemselector',
                                    name: 'role',
                                    id: 'itemselector-field',
                                    anchor: '100%',
                                    fieldLabel: '角色',
                                    //imagePath: '/ux/css/images/',
                                    availableTitle:'可选',
                                    selectedTitle:'已选',
                                    blankText: "该项为必输项",
                                    store: App.util.AppUtil.getDicStore("role"),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    value: [],
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
                                    xtype: 'combobox',
                                    store:this.getParentStore(),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    allowBlank: true
                                },
                                {
                                    fieldLabel: '联系人姓名',
                                    name: 'linkManName',
                                    maxLength: 20,
                                    maxLengthText: '最大长度不能超过20个字符！',
                                    allowBlank: true
                                },
                                {
                                    fieldLabel: '联系人电话',
                                    name: 'linkManPhone',
                                    allowBlank: true
                                },
                                {
                                    fieldLabel: '联系人邮箱',
                                    name: 'linkManEmail',
                                    allowBlank: true
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
                    id: 'create_new_user_button'
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
    getParentStore : function(){
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
