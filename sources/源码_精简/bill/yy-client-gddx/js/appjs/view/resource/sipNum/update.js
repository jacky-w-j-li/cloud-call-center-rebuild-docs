Ext.define('App.view.resource.sipNum.update', {
    extend: 'Ext.window.Window',
    alias: 'widget.updateSipWindow',
    width: 400,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '修改sip号',
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
                        labelAlign: 'right',
                        width: 300
                    },
                    items: [
                        {
                            xtype: 'fieldset',
                            title: 'sip号信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            items: [
                                {
                                    fieldLabel: 'sip号',
                                    name: '_id',
                                    value: this.data._id,
                                    readOnly: true,
                                    fieldCls: 'field_disable_cls',
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '密码',
                                    name: 'secret',
                                    value: this.data.secret,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'radiogroup',
                                    fieldLabel: '是否为传真机',
                                    name:'isFax',
                                    items: this.getIsFaxItems(this.data)
                                },
                                {
                                    xtype: "checkboxgroup",
                                    name: "codeConfig",
                                    columns: 3,
                                    fieldLabel: "编码",
                                    allowBlank: false,
                                    items: [
                                        {
                                            boxLabel: 'g729',
                                            name: 'code',
                                            inputValue: "g729",
                                            checked: this.initCodeConfig("g729")

                                        },
                                        {
                                            boxLabel: 'alaw',
                                            name: 'code',
                                            inputValue: "alaw",
                                            checked: this.initCodeConfig("alaw")
                                        },
                                        {
                                            boxLabel: 'ulaw',
                                            name: 'code',
                                            inputValue: "ulaw",
                                            checked: this.initCodeConfig("ulaw")
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: '修改',
                    class: 'submit'
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
    initCodeConfig: function (code) {
        var codes = this.data.codes || [];
        for (var i = 0; i < codes.length; i++) {
            if(codes[i] == code){
                return true;
            }
        }
        return false;
    },
    getIsFaxItems:function(data){
        var radiaos =[];
        var yes={
                boxLabel: "是",
                name: 'isFax',
                inputValue: true
            };
        var no={
                boxLabel: "否",
                name: 'isFax',
                inputValue: false
            };
        if(data.isFax == true){
            yes.checked=true;
        }else{
            no.checked=true;
        }
        radiaos.push(yes);
        radiaos.push(no);
        return radiaos;
    }

});