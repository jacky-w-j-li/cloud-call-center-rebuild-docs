Ext.define('App.view.system.userInfo.userInfo', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.userInfoPanel',
    requires: [],
    layout: {
        type: 'anchor'
    },
    data:{},
    store: null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'tabpanel',
                    activeTab: 0,
                    items: [
                        {
                            xtype: 'panel',
                            frame: true,
                            id: 'panel_userinfo_fee',
                            title: '我的资费',
                            items:this.getFeeItems()
                        },
                        {
                            xtype: 'panel',
                            frame: true,
                            id: 'panel_userinfo_updatePwd',
                            title: '修改密码',
                            items: this.getPwdItems()
                        },
                        {
                            xtype: 'panel',
                            frame: true,
                            id: 'panel_userinfo_base',
                            title: '基本信息',
                            items: this.getInfoItems()
                        },
                        {
                            xtype: 'panel',
                            frame: true,
                            id: 'panel_userinfo_alert',
                            title: '下属客户设置',
                            items: this.getAlertItems()
                        }
                    ]
                }
            ]
        });
        me.callParent(arguments);
    },
    getFeeItems: function () {
        var items = new Array();
        var licenseFeildSet = {
            xtype: 'fieldset',
            title: 'licence资费',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaults: {
                msgTarget: 'side',
                labelWidth: 100,
                labelAlign: 'right'
            },
            defaultType: 'displayfield',
            items: [
                {
                    fieldLabel: '标准版单价',
                    value: (this.data.standardLicence || 0)+"元/个",
                    columnWidth: .25
                },
                {
                    fieldLabel: '企业版单价',
                    value: (this.data.callinLicence || 0)+"元/个",
                    columnWidth: .25
                },
                //{
                //    fieldLabel: '外呼版单价',
                //    value: (this.data.calloutLicence || 0)+"元/个",
                //    columnWidth: .25
                //},
                {
                    fieldLabel: '监控版单价',
                    value: (this.data.monitorLicence || 0)+"元/个",
                    columnWidth: .25
                },
                {
                    fieldLabel: 'licence分成比例',
                    value: (this.data.agentPercent || 0)+"%",
                    columnWidth: .25
                }
            ]
        };
        items.push(licenseFeildSet);

        var callFieldSet = {
            xtype: 'fieldset',
            title: '通话资费',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaults: {
                msgTarget: 'side',
                labelWidth: 100,
                labelAlign: 'right'
            },
            defaultType: 'displayfield',
            items : [
                {
                    fieldLabel: '手机市话',
                    value: (this.data.dialFee.local || 0)+"元/分钟",
                    columnWidth: .25
                },
                {
                    fieldLabel: '手机长途',
                    value: (this.data.dialFee.remote || 0)+"元/分钟",
                    columnWidth: .25
                },
                {
                    fieldLabel: '固话市话',
                    value: (this.data.dialFee.localTel || 0)+"元/分钟",
                    columnWidth: .25
                },
                {
                    fieldLabel: '固话长途',
                    value: (this.data.dialFee.remoteTel || 0)+"元/分钟",
                    columnWidth: .25
                },
                {
                    fieldLabel: '通话分成比例',
                    value: (this.data.dialPercent || 0)+"%",
                    columnWidth: .25
                }
            ]
        };

        items.push(callFieldSet);

        var num400FieldSet = {
            xtype: 'fieldset',
            title: '400资费',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaults: {
                msgTarget: 'side',
                labelWidth: 100,
                labelAlign: 'right'
            },
            defaultType: 'displayfield',
            items :[
                {
                    fieldLabel: '400市话',
                    value: (this.data.dial400Fee.local || 0)+"元/分钟",
                    columnWidth: .25
                },
                {
                    fieldLabel: '400长途',
                    value: (this.data.dial400Fee.remote || 0)+"元/分钟",
                    columnWidth: .25
                },
                {
                    fieldLabel: '400分成比例',
                    value: (this.data.num400Percent || 0)+"%",
                    columnWidth: .25
                }
            ]
        };

        items.push(num400FieldSet);

        var intlFieldSet = {
            xtype: 'fieldset',
            title: '国际长途资费',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaults: {
                msgTarget: 'side',
                labelWidth: 100,
                labelAlign: 'right'
            },
            defaultType: 'displayfield',
            items :[
                {
                    fieldLabel: '港澳台',
                    value: (this.data.internationalFee.fee1 || 0)+"元/分钟",
                    columnWidth: .25
                },
                {
                    fieldLabel: '美国/加拿大',
                    value: (this.data.internationalFee.fee2 || 0)+"元/分钟",
                    columnWidth: .25
                },
                {
                    fieldLabel: '其他',
                    value: (this.data.internationalFee.fee3 || 0)+"元/分钟",
                    columnWidth: .25
                },
                {
                    fieldLabel: '国际长途分成比例',
                    value: (this.data.intlPercent || 0)+"%",
                    columnWidth: .25
                }
            ]
        };

        items.push(intlFieldSet);

        var feeFieldSet = {
            xtype: 'fieldset',
            title: '其他费用',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaults: {
                msgTarget: 'side',
                labelWidth: 100,
                labelAlign: 'right'
            },
            defaultType: 'displayfield',
            items :[
                {
                    fieldLabel: '透支额度',
                    value: (this.data.overdraw || 0)+"元",
                    columnWidth: .25
                },
                {
                    fieldLabel: '总机月租分成比例',
                    value: (this.data.monthRentPercent || 0)+"%",
                    columnWidth: .25
                }
            ]
        };
        items.push(feeFieldSet);

        var smsFeeFieldSet = {
            xtype: 'fieldset',
            title: '短信资费',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaults: {
                msgTarget: 'side',
                labelWidth: 100,
                labelAlign: 'right'
            },
            defaultType: 'displayfield',
            items :[
                {
                    fieldLabel: '短信资费',
                    value: (this.data.smsFee || 0)+"元/条",
                    columnWidth: .25
                },
                {
                    fieldLabel: '短信分成比例',
                    value: (this.data.smsPercent || 0)+"%",
                    columnWidth: .25
                }
            ]
        };
        items.push(smsFeeFieldSet);

        return items;
    },
    getPwdItems:function(){
        var items = [];
        var form={
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
                    title: '',
                    collapsible: true,
                    defaultType: 'textfield',
                    items: [
                        {
                            fieldLabel: '当前密码',
                            name: 'oldPwd',
                            maxLength: 30,
                            maxLengthText: '最大长度不能超过30个字符！',
                            inputType : 'password',
                            allowBlank: false
                        },
                        {
                            fieldLabel: '新的密码',
                            name: 'password',
                            maxLength: 30,
                            maxLengthText: '最大长度不能超过30个字符！',
                            inputType : 'password',
                            allowBlank: false
                        },
                        {
                            fieldLabel: '确认密码',
                            name: 'retryPassword',
                            maxLength: 30,
                            maxLengthText: '最大长度不能超过30个字符！',
                            inputType : 'password',
                            allowBlank: false
                        }
                    ]
                },
                {
                    xtype: 'fieldset',
                    layout: {
                        type: 'hbox',
                        pack: 'left',
                        align: 'middle'
                    },
                    cls: 'no_border',
                    items: [
                        {
                            xtype: 'button',
                            width: 90,
                            id: 'btn_userinfo_updatepwd',
                            text: '保存'
                        }
                    ]
                }
            ]
        };
        items.push(form);

        return items;
    },
    getInfoItems:function(){
        var items = new Array();
        var form={
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
                    title: '',
                    collapsible: true,
                    defaultType: 'textfield',
                    items: [
                        {
                            fieldLabel: '姓名',
                            name: 'name',
                            value: this.data.name,
                            maxLength: 50,
                            maxLengthText: '最大长度不能超过50个字符！',
                            allowBlank: false
                        },
                        {
                            fieldLabel: '登录名',
                            name: 'loginName',
                            value: this.data.loginName,
                            regex: /^[A-Za-z0-9]+$/,
                            regexText: '只能输入字母和数字！',
                            maxLength: 30,
                            maxLengthText: '最大长度不能超过30个字符！',
                            readOnly:true,
                            allowBlank: false
                        },
                        {
                            fieldLabel: '联系人姓名',
                            name: 'linkManName',
                            value: this.data.linkManName,
                            maxLength: 20,
                            maxLengthText: '最大长度不能超过20个字符！',
                            allowBlank: true
                        },
                        {
                            fieldLabel: '联系人电话',
                            name: 'linkManPhone',
                            value: this.data.linkManPhone,
                            allowBlank: true
                        },
                        {
                            fieldLabel: '联系人邮箱',
                            name: 'linkManEmail',
                            value: this.data.linkManEmail,
                            allowBlank: true
                        }
                    ]
                },
                {
                    xtype: 'fieldset',
                    layout: {
                        type: 'hbox',
                        pack: 'left',
                        align: 'middle'
                    },
                    cls: 'no_border',
                    items: [
                        {
                            xtype: 'button',
                            width: 90,
                            id: 'btn_userinfo_updateinfo',
                            text: '保存'
                        }
                    ]
                }
            ]
        };
        items.push(form);

        return items;
    },
    getAlertItems:function(){
        var items = new Array();
        var form={
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
                    title: '',
                    collapsible: true,
                    defaultType: 'textfield',
                    items: [
                        {
                            xtype:"checkbox",
                            boxLabel: '启用邮件提醒(勾选该选项，您的所有下属客户号码到期或话费达到设定的预警值，平台会给客户发送邮件进行提醒)',
                            name: 'isNotify',
                            id:'set_cust_notify',
                            checked:this.isCheck()
//                            inputValue:this.data.isNotify
                        }
//                        {
//                            xtype:"checkbox",
//                            boxLabel: '启用用户中心申请发票(勾选该选项，您的所有下属客户可以通过用户中心申请发票)',
//                            name: 'isInvoice',
//                            id:'set_cust_invoice',
//                            checked:this.isInvoiceCheck()
////                            inputValue:this.data.isNotify
//                        }
                    ]
                },
                {
                    xtype: 'fieldset',
                    layout: {
                        type: 'hbox',
                        pack: 'left',
                        align: 'middle'
                    },
                    cls: 'no_border',
                    items: [
                        {
                            xtype: 'button',
                            width: 90,
                            id: 'btn_userinfo_saveAlert',
                            text: '保存'
                        }
                    ]
                }
            ]
        };
        items.push(form);

        return items;
    },
    isCheck:function(){
        if(this.data.isNotify){
            return true;
        }
        return false;
    },
    isInvoiceCheck:function(){
        if(this.data.isInvoice){
            return true;
        }
        return false;
    }
});