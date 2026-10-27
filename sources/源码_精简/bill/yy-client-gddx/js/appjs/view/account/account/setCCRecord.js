Ext.define('App.view.account.account.setCCRecord', {
    extend: 'Ext.window.Window',
    alias: 'widget.setCCRecordWindow',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '呼叫中心录音设置',
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
                    items: this.getRecordItems()
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'btn_save_cc_record'
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
        if(this.data.isRecording=='true'||this.data.isRecording==undefined){
            Ext.getCmp('recordStore').show();
        }
    },
    getRecordItems : function(){
        var items = [];
        var fieldset = {
            xtype: 'fieldset',
            title: '录音设置',
            collapsible: true,
            defaultType: 'textfield',
            items : [
                {
                    xtype : 'textfield',
                    name: '_id',
                    value: this.data._id,
                    hidden: true
                },
                {
                    fieldLabel: '是否开启通话录音',
                    name: 'isRecording',
                    id:'isRecording',
                    xtype: 'radiogroup',
                    labelWidth: 150,
                    items: this.getRadiaoItems(this.data),
                    listeners: {
                        change: this.isRecordChange
                    }
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '录音保存时间(天)',
                    value: this.data.recordStore!=null?this.data.recordStore:90,
                    name: 'recordStore',
                    id:'recordStore',
                    msgTarget: 'side',
                    labelWidth: 120,
                    labelAlign: 'right',
                    minValue: 1,
                    allowBlank: false,
                    hidden: true
                }
            ]
        };

        items.push(fieldset);
        return items;
    },
    getRadiaoItems: function (data) {

        var radiaos =[];
        var yes={
            boxLabel: "是",
            name: 'isRecord',
            inputValue: "true"
        };
        var no={
            boxLabel: "否",
            name: 'isRecord',
            inputValue: "false"
        };
        if(data.isRecording=='true'||data.isRecording==undefined){
            yes.checked=true;
        }else{
            no.checked=true;
        }
        radiaos.push(yes);
        radiaos.push(no);
        return radiaos;
    },
    isRecordChange:function (obj,newValue){
        console.log(Ext.getCmp('recordStore'))
        var type = newValue.isRecord;
        if (type == "true") {
            Ext.getCmp('recordStore').show();
        } else if (type == "false"||type.length>1) {
            Ext.getCmp('recordStore').hide();

        }
    }


});
