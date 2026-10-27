Ext.define('App.view.account.user.findUser', {
    extend: 'Ext.window.Window',
    requires: [],
    alias: 'widget.findUserWin',
    height: 500,
    width: 850,
    title: '用户查询',
    layout: 'fit',
    data: null,
    initComponent: function () {
        Ext.QuickTips.init();
        var me = this;
        Ext.applyIf(me, {
            modal: true,
            items: [
                {
                    xtype: 'panel',
                    frame: true,
                    items: this.getUserBaseInfo()
                }
            ]
        });
        me.callParent(arguments);
    },
    getUserBaseInfo: function () {
        var items = new Array();
        var baseInfo = {
            xtype: 'fieldset',
            collapsible: true,
            title: '用户基本信息',
            cls: 'backgroud_blue',
            defaults: {
                msgTarget: 'side',
                labelWidth: 80,
                labelAlign: 'right',
                fieldCls: 'field_disable_cls',
                readOnly: true
            },
            defaultType: 'textfield',
            layout: {
                type: 'column'
            },
            items: [
                {
                    fieldLabel: '账户编号',
                    value: this.data.user.account,
                    columnWidth: .33
                },
                {
                    fieldLabel: '工号',
                    value: this.data.user.exten,
                    columnWidth: .33
                },
                {
                    fieldLabel: '密码',
                    value: this.data.user.password,
                    columnWidth: .33
                },{
                    fieldLabel: '用户姓名',
                    value: this.data.user.displayName,
                    columnWidth: .33
                },{
                    fieldLabel: '手机',
                    value: this.data.user.mobile,
                    columnWidth: .33
                },{
                    fieldLabel: '邮箱',
                    value: this.data.user.email,
                    columnWidth: .33
                },{
                    fieldLabel: 'sip号',
                    value: this.data.user.sipExten,
                    columnWidth: .33
                },{
                    fieldLabel: '直线sip号',
                    value: this.data.user.mobileExten,
                    columnWidth: .33
                },{
                    fieldLabel: '直拨号码',
                    value: this.data.user.didNum,
                    columnWidth: .33
                },{
                    fieldLabel: '分配pbx',
                    value: this.data.user.pbx,
                    columnWidth: .33
                }
            ]
        };
        items.push(baseInfo);
        var imInfo = {
            xtype: 'fieldset',
            id: 'account_find_accountInfo',
            collapsible: true,
            title: 'im信息',
            cls: 'backgroud_blue',
            defaults: {
                msgTarget: 'side',
                labelWidth: 80,
                labelAlign: 'right',
                fieldCls: 'field_disable_cls',
                readOnly: true
            },
            defaultType: 'textfield',
            layout: {
                type: 'column'
            },
            items: [
                {
                    fieldLabel: 'im签名',
                    value: this.data.user.im?this.data.user.im.signature : "",
                    columnWidth: .33
                },
                {
                    fieldLabel: '职位',
                    value: this.data.user.im?this.data.user.im.title : "",
                    columnWidth: .33
                }
            ]

        }
        items.push(imInfo);
        return items;
    }
});