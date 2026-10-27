Ext.define('App.view.account.account.setProductRecord', {
    extend: 'Ext.window.Window',
    alias: 'widget.setProductRecordWindow',
    width: 340,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '总机录音设置',
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
                    id: 'btn_save_product_record'
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
                    name: 'isRecord',
                    xtype: 'radiogroup',
                    labelWidth: 150,
                    items: this.getRadiaoItems(this.data),
                    listeners: {
                    }
                }

            ]
        };

        items.push(fieldset);
        return items;
    },
    getRadiaoItems: function (data) {
//        { boxLabel: 'Item 2', name: 'rb', inputValue: '2', checked: true},
        var radiaos =[];
        var yes={
            boxLabel: "是",
            name: 'isRecord',
            inputValue: "1"
        };
        var no={
            boxLabel: "否",
            name: 'isRecord',
            inputValue: "0"
        };
        if(data.isRecord=='1'){
            yes.checked=true;
        }else{
            no.checked=true;
        }
        radiaos.push(yes);
        radiaos.push(no);
        return radiaos;
    },
    getPbxStore: function () {
        var pbxs=this.data.pbx;
//        console.dir(pbxs);
        var fields = [];
        if (pbxs && pbxs.length > 0) {
            var code = pbxs[0];
            for (var p in code) {
                fields.push(p);
            }
        }
        var store = Ext.create('Ext.data.Store', {
            fields: fields,
            data: pbxs
        });
        return store;
    }

});
