/**
 * Created by apple on 15/8/20.
 */
Ext.define('App.view.resource.manualSms.detailManualSms', {
    extend: 'Ext.window.Window',
    alias: 'widget.showSmsWindow',
    width: 440,
    height:400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '短信详情',
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
                        labelAlign: 'right'
                    },
                    items: this.getSmsItems()
                }
            ],
            //buttons: [
            //    {
            //        text: '更新',
            //        id: 'btn_update_sms_edit'
            //    },
            //    {
            //        text: '关闭',
            //        handler: function (obj) {
            //            var win = obj.up('window');
            //            win.close();
            //        }
            //    }
            //]
        });
        me.callParent(arguments);
    },
    getSmsItems : function(){
        var items = [];
        var fieldset = {
            xtype: 'fieldset',
            title: '短信',
            height:300,
            collapsible: true,
            defaultType: 'textfield',
            items : [
                //{header: '账户编号', dataIndex: 'account', width:100,},
                //{header: '短信状态', dataIndex: 'm7Status', width:300},
                //{header: '手机号', dataIndex: 'num', width:100},
                //{header: '短信内容', dataIndex: 'content', flex: 4},
                //{header: '发送时间', dataIndex: 'submitTime', width:100},
                //{ header: '操作人员', dataIndex: 'verifyUser', width:100},
                {
                    xtype : 'textfield',
                    name: '_id',
                    value: this.data._id,
                    hidden: true
                },
                {
                    xtype: 'textfield',
                    fieldLabel: '账户编号',
                    value: this.data.account,
                    readOnly:true,
                    name: 'account',
                    msgTarget: 'side',
                    labelAlign: 'right',
                    allowBlank: false
                },
                {
                    xtype: 'textfield',
                    fieldLabel: '短信状态',
                    readOnly:true,
                    value: this.data.m7Status,
                    autoHeight:true,
                    name: 'm7Status',
                    msgTarget: 'side',
                    labelAlign: 'right',
                    allowBlank: false,
                },
                {
                    xtype: 'textfield',
                    fieldLabel: '手机号',
                    readOnly:true,
                    value: this.data.num,
                    name: 'num',
                    msgTarget: 'side',
                    labelAlign: 'right',
                    allowBlank: false
                },
                {
                    xtype: 'textfield',
                    fieldLabel: '发送时间',
                    readOnly:true,
                    value: this.data.submitTime,
                    name: 'submitTime',
                    msgTarget: 'side',
                    labelAlign: 'right',
                    allowBlank: false
                },
                {
                    xtype: 'textfield',
                    fieldLabel: '操作人员',
                    readOnly:true,
                    value: this.data.verifyUser,
                    name: 'verifyUser',
                    msgTarget: 'side',
                    labelAlign: 'right',
                    allowBlank: false
                },
                {
                    xtype: 'textarea',
                    fieldLabel: '短信内容',
                    readOnly:true,
                    value: this.data.content,
                    autoHeight:true,
                    name: 'content',
                    msgTarget: 'side',
                    width: 350,
                    height:250,
                    labelAlign: 'right',
                    allowBlank: false,
                },

            ]
        };
        items.push(fieldset);
        return items;
    }


});
