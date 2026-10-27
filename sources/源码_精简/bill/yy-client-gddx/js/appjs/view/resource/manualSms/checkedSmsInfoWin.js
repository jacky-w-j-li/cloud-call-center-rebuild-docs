Ext.define('App.view.resource.manualSms.checkedSmsInfoWin', {
    extend: 'Ext.window.Window',
    alias: 'widget.checkedSmsInfoWin',
    width: 350,
    height: 450,
    layout: {
        type: 'anchor'
    },
    modal: true,
    data : null,
    title: '短信详情',

    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'fieldset',
                    collapsible: true,
                    title: '短信详情',
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
                    items : this.getDisplayItems()
                }
            ],
            buttons: [
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
    getDisplayItems : function (){

        var num = {
            fieldLabel: '发送号码',
            value: this.data.num
        };
        if(this.data.isBatch){
            num.xtype = "textareafield";
            num.grow = true;
            num.value = this.data.nums
        }
        var items = [
            {
                fieldLabel: '账户编号',
                value: this.data.account
            },
            num,
            {
                fieldLabel: '短信签名',
                value: this.data.signDisplay
            },
            {
                fieldLabel: '短信内容',
                xtype : "textareafield",
                grow  : true,
                value: this.data.content
            },
            {
                fieldLabel: '提交时间',
                value: this.data.submitTime
            },
            {
                fieldLabel: '短信通道',
                value: this.getSmsChannelName(this.data.smsChannel)
            },
            {
                fieldLabel: '审核人',
                value: this.data.checkUser
            },
            {
                fieldLabel: '审核时间',
                value: this.data.checkTime
            },
            {
                fieldLabel: '审核状态',
                value: this.getCheckStatus(this.data.m7Status)
            }
        ];
        if(this.data.m7Status == 'unpass'){
            items.push({
                fieldLabel: '原因',
                xtype : "textareafield",
                grow  : true,
                value: this.data.by_errordescription
            });
        }
        return items;
    },
    getCheckStatus: function (status) {
        if (status == 'unpass')
            return "未通过";
        else
            return "通过";
    },
    getSmsChannelName : function (channel){
        return App.util.AppUtil.getRendererValue(channel,"smsChannel");
    }

});
