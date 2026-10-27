Ext.define('App.view.resource.dialCount.addCount', {
    extend: 'Ext.window.Window',
    alias: 'widget.addCount',
    width: 350,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '账户拨号',
    account: null,
    editMode :"addNew",
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'form',
                    frame: true,
                    title: 'addNew'?'添加拨号计数':'编辑拨号计数',
                    bodyStyle: 'padding:2px 2px 0',
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 90,
                        labelAlign: 'right'
                    },
                    items: this.getSmsItems()
                }
            ],
            buttons: [
                {
                    text: this.editMode=='addNew'?'添加':'更新',
                    id: 'btn_addCount_save',
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
    getSmsItems : function(){
        var items = [];
        var fieldset = {
            xtype: 'fieldset',
            title: '账户拨号限制',
            collapsible: true,
            defaultType: 'textfield',
            items : [
                {
                    name: 'account',
                    value: this.account.get('_id'),
                    hidden: true
                },
                {
                    fieldLabel: '账户名称',
                    name: 'name',
                    value: this.getFieldValue("name"),
                    allowBlank: false,
                    listeners:{
                        blur: this.getCompanyName
                    }
                },
                {
                    fieldLabel: '公司名称',
                    name: 'companyName',
                    id:'companyName',
                   // value: this.getFieldValue("companyName"),
                    hidden:true,
                },
                {
                    fieldLabel: '拨号次数',
                    name: 'accountCount',
                    value: this.getFieldValue("accountCount"),
                    allowBlank: false
                },
                {
                    fieldLabel: '剩余拨号次数',
                    name: 'accountResidualCount',
                    value: this.getFieldValue("accountResidualCount"),
                    readOnly:true,
                    value : 0
                }
            ]
        };
        items.push(fieldset);
        return items;
    },
    getFieldValue:function(fieldName){
        if(!this.record){
            return '';
        }
        return this.record.get(fieldName);
    },
    getCompanyName:function(obj) {
        if(obj){
            App.util.AppUtil.request('bill.resource.queryCompanyName',obj.value,function(data,self){
                if(data.success){
                    if(data.list[0]){
                        Ext.getCmp('companyName').setValue(data.list[0].companyName);
                        Ext.getCmp('companyName').show();
                    }
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);

        }
}



});

