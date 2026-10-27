Ext.define('App.view.resource.callLine.update', {
    extend: 'Ext.window.Window',
    alias: 'widget.updateLineWindow',
    width: 850,
    layout: {
//        type: 'anchor'
        type: 'column'
    },
    modal: true,
    data: null,
    title: '修改线路',
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
                        labelWidth: 160,
                        labelAlign: 'right'
                    },
                    items: [
                        {
                            xtype: 'fieldset',
                            title: '线路信息',
                            collapsible: true,
                            defaultType: 'textfield',
                            layout: 'column',
                            cls: 'backgroud_blue',
                            items: [
                                {
                                    fieldLabel: '线路编号',
                                    name: '_id',
                                    value: this.data._id,
                                    //readOnly: true,
                                    columnWidth: .5,
                                    readOnly:true,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '线路名称',
                                    name: 'name',
                                    value: this.data.name,
                                    maxLength: 50,
                                    maxLengthText: '最大长度不能超过50个字符！',
                                    columnWidth: .5,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: '线路类型',
                                    name: 'type',
                                    editable: false,
                                    value: this.data.type,
                                    store: App.util.AppUtil.getDicStore('lineType'),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    columnWidth: .33,
                                    allowBlank: false,
                                    listeners: {
                                        change: function (obj, newvalue) {
                                            var win=obj.up("window");
                                            var strategy = newvalue;
                                            var panel = obj.up('fieldset').down("#line_type_update_panel");
                                            panel.removeAll();
                                            var items = [];
                                            if (strategy == "internal") {
                                                items = win.getInternalFeeItem();
                                            }else if(strategy == "international") {
                                                items = win.getInternationalFeeItem();
                                            }
                                            panel.add(items);
                                        }
                                    }
                                },
                                {
                                    xtype: 'panel',
                                    layout: "column",
                                    border: false,
                                    bodyCls: 'backgroud_blue',
                                    id: 'line_type_update_panel',
                                    columnWidth: 1,
                                    items:this.getIntlItem(this.data.type)
                                },
                                {
                                    fieldLabel: '备注',
                                    value: this.data.memo,
                                    name: 'memo',
                                    xtype: 'textarea',
                                    columnWidth: 1
                                }
                            ]
                        }
                    ]

                }
            ],
            buttons: [
                {
                    text: '保存',
                    class: 'commit_button'
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
    getInternalFeeItem:function(){
        var items=[
            {
                xtype: 'combobox',
                fieldLabel: '本地固话资费策略',
                name: 'dial_localTelStrategy',
                editable: false,
                value : this.data.dialFee.localTelStrategy,
                store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                displayField: 'codeName',
                valueField: 'codeValue',
                typeAhead: true,
                queryMode: 'local',
                columnWidth: .33,
                allowBlank: false,
                listeners: {
                    change: function (obj, newvalue) {
                        var strategy = newvalue;
                        var panel = obj.up('fieldset').down("#localTelFee_detail_panel");
                        panel.removeAll();
                        var items = [];
                        if (strategy == "minute") {
                            items =[
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '资费(元/分钟)',
                                    value: 0.07,
                                    name: 'dial_localTel',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        } else if (strategy == "second6") {
                            items = [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '资费(元/6秒)',
                                    value: 0.007,
                                    name: 'dial_localTel',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        } else if (strategy == "minute3") {
                            items = [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '前3分钟资费(元)',
                                    value: 0.2,
                                    name: 'dial_localTelPrefix',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 1,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '以后每分钟(元/分钟)',
                                    value: 0.1,
                                    name: 'dial_localTel',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        }
                        panel.add(items);
                    }

                }
            },
            {
                xtype: 'panel',
                border: false,
                bodyCls: 'backgroud_blue',
                id: 'localTelFee_detail_panel',
                columnWidth:.66,
                items:this.getLocalTelItem("change",this.data.dialFee.localTelStrategy)
            },

            {
                xtype: 'combobox',
                fieldLabel: '本地手机资费策略',
                name: 'dial_localStrategy',
                editable: false,
                value : this.data.dialFee.localStrategy,
                store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                displayField: 'codeName',
                valueField: 'codeValue',
                typeAhead: true,
                queryMode: 'local',
                columnWidth: .33,
                allowBlank: false,
                listeners: {
                    change: function (obj, newvalue) {
                        var strategy = newvalue;
                        var panel = obj.up('fieldset').down("#localFee_detail_panel");
                        panel.removeAll();
                        var items = [];
                        if (strategy == "minute") {
                            items =[
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '资费(元/分钟)',
                                    value: 0.07,
                                    name: 'dial_local',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        } else if (strategy == "second6") {
                            items = [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '资费(元/6秒)',
                                    value: 0.007,
                                    name: 'dial_local',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        } else if (strategy == "minute3") {
                            items = [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '前3分钟资费(元)',
                                    value: 0.2,
                                    name: 'dial_localPrefix',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 1,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '以后每分钟(元/分钟)',
                                    value: 0.1,
                                    name: 'dial_local',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        }
                        panel.add(items);
                    }

                }
            },
            {
                xtype: 'panel',
                border: false,
                bodyCls: 'backgroud_blue',
                id: 'localFee_detail_panel',
                columnWidth:.66,
                items:this.getLocalItem("change",this.data.dialFee.localStrategy)
            },

            {
                xtype: 'combobox',
                fieldLabel: '长途固话资费策略',
                name: 'dial_remoteTelStrategy',
                editable: false,
                value : this.data.dialFee.remoteTelStrategy,
                store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                displayField: 'codeName',
                valueField: 'codeValue',
                typeAhead: true,
                queryMode: 'local',
                columnWidth: .33,
                allowBlank: false,
                listeners: {
                    change: function (obj, newvalue) {
                        var strategy = newvalue;
                        var panel = obj.up('fieldset').down("#remoteTelFee_detail_panel");
                        panel.removeAll();
                        var items = [];
                        if (strategy == "minute") {
                            items =[
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '资费(元/分钟)',
                                    value: 0.07,
                                    name: 'dial_remoteTel',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        } else if (strategy == "second6") {
                            items = [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '资费(元/6秒)',
                                    value: 0.007,
                                    name: 'dial_remoteTel',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        } else if (strategy == "minute3") {
                            items = [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '前3分钟资费(元)',
                                    value: 0.2,
                                    name: 'dial_remoteTelPrefix',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 1,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '以后每分钟(元/分钟)',
                                    value: 0.1,
                                    name: 'dial_remoteTel',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        }
                        panel.add(items);
                    }

                }
            },
            {
                xtype: 'panel',
                border: false,
                bodyCls: 'backgroud_blue',
                id: 'remoteTelFee_detail_panel',
                columnWidth:.66,
                items:this.getRemoteTelItem("change",this.data.dialFee.remoteTelStrategy)
            },

            {
                xtype: 'combobox',
                fieldLabel: '长途手机资费策略',
                name: 'dial_remoteStrategy',
                editable: false,
                value : this.data.dialFee.remoteStrategy,
                store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                displayField: 'codeName',
                valueField: 'codeValue',
                typeAhead: true,
                queryMode: 'local',
                columnWidth: .33,
                allowBlank: false,
                listeners: {
                    change: function (obj, newvalue) {
                        var strategy = newvalue;
                        var panel = obj.up('fieldset').down("#remoteFee_detail_panel");
                        panel.removeAll();
                        var items = [];
                        if (strategy == "minute") {
                            items =[
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '资费(元/分钟)',
                                    value: 0.07,
                                    name: 'dial_remote',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        } else if (strategy == "second6") {
                            items = [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '资费(元/6秒)',
                                    value: 0.007,
                                    name: 'dial_remote',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        } else if (strategy == "minute3") {
                            items = [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '前3分钟资费(元)',
                                    value: 0.2,
                                    name: 'dial_remotePrefix',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 1,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '以后每分钟(元/分钟)',
                                    value: 0.1,
                                    name: 'dial_remote',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        }
                        panel.add(items);
                    }

                }
            },
            {
                xtype: 'panel',
                border: false,
                bodyCls: 'backgroud_blue',
                id: 'remoteFee_detail_panel',
                columnWidth:.66,
                items:this.getRemoteItem("change",this.data.dialFee.remoteStrategy)
            }


        ];
        return items;

    },
    getInternationalFeeItem:function(){
        var items=[
            {
                xtype: 'numberfield',
                fieldLabel: '港/澳/台(元/分钟)',
                value: 1,
                name: 'intl_fee1',
                columnWidth: .33,
                decimalPrecision : 4,
                minValue: 0,
                /*maxValue: 0.3,*/
                allowBlank: false
            },
            {
                xtype: 'numberfield',
                fieldLabel: '美国/加拿大(元/分钟)',
                value: 2,
                name: 'intl_fee2',
                columnWidth: .33,
                decimalPrecision : 4,
                minValue: 0,
                /* maxValue: 0.3,*/
                allowBlank: false
            },
            {
                xtype: 'numberfield',
                fieldLabel: '其他地区(元/分钟)',
                value: 3,
                name: 'intl_fee3',
                columnWidth: .33,
                decimalPrecision : 4,
                minValue: 0,
                /* maxValue: 0.3,*/
                allowBlank: false
            }
        ];
        return items;
    },

    getIntlItem:function(type){
        var result = [];
        var key,prefix;
        if(type=="internal"){
            key = "dialFee";
            prefix = "dial";
            result=this.getInternalItem(key,prefix);
        }else if(type=="international"){
            key = "internationalFee";
            prefix = "intl";
            result=this.getInternationItem(key,prefix);
        }
        return result;
    },
    getInternalItem:function(key,prefix){
        var result=[
            {
                xtype: 'combobox',
                fieldLabel: '本地固话资费策略',
                name: 'dial_localTelStrategy',
                editable: false,
                value : this.data[key].localTelStrategy,
                store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                displayField: 'codeName',
                valueField: 'codeValue',
                typeAhead: true,
                queryMode: 'local',
                columnWidth: .33,
                allowBlank: false,
                listeners: {
                    change: function (obj, newvalue) {
                        var strategy = newvalue;
                        var panel = obj.up('fieldset').down("#localTelFee_fee_panel_init");
                        panel.removeAll();
                        var items = [];
                        if (strategy == "minute") {
                            items =[
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '资费(元/分钟)',
                                    value: 0.07,
                                    name: 'dial_localTel',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        } else if (strategy == "second6") {
                            items = [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '资费(元/6秒)',
                                    value: 0.007,
                                    name: 'dial_localTel',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        } else if (strategy == "minute3") {
                            items = [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '前3分钟资费(元)',
                                    value: 0.2,
                                    name: 'dial_localTelPrefix',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 1,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '以后每分钟(元/分钟)',
                                    value: 0.1,
                                    name: 'dial_localTel',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        }
                        panel.add(items);
                    }

                }
            },
            {
                xtype: 'panel',
                border: false,
                bodyCls: 'backgroud_blue',
                id: 'localTelFee_fee_panel_init',
                columnWidth:.66,
                items:this.getLocalTelItem("init",this.data.dialFee.localTelStrategy)
            },

            {
                xtype: 'combobox',
                fieldLabel: '本地手机资费策略',
                name: 'dial_localStrategy',
                editable: false,
                value : this.data[key].localStrategy,
                store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                displayField: 'codeName',
                valueField: 'codeValue',
                typeAhead: true,
                queryMode: 'local',
                columnWidth: .33,
                allowBlank: false,
                listeners: {
                    change: function (obj, newvalue) {
                        var strategy = newvalue;
                        var panel = obj.up('fieldset').down("#localFee_fee_panel");
                        panel.removeAll();
                        var items = [];
                        if (strategy == "minute") {
                            items =[
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '资费(元/分钟)',
                                    value: 0.07,
                                    name: 'dial_local',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        } else if (strategy == "second6") {
                            items = [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '资费(元/6秒)',
                                    value: 0.007,
                                    name: 'dial_local',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        } else if (strategy == "minute3") {
                            items = [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '前3分钟资费(元)',
                                    value: 0.2,
                                    name: 'dial_localPrefix',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 1,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '以后每分钟(元/分钟)',
                                    value: 0.1,
                                    name: 'dial_local',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        }
                        panel.add(items);
                    }

                }
            },
            {
                xtype: 'panel',
                border: false,
                bodyCls: 'backgroud_blue',
                id: 'localFee_fee_panel',
                columnWidth:.66,
                items:this.getLocalItem("init",this.data.dialFee.localStrategy)
            },

            {
                xtype: 'combobox',
                fieldLabel: '长途固话资费策略',
                name: 'dial_remoteTelStrategy',
                editable: false,
                value : this.data[key].remoteTelStrategy,
                store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                displayField: 'codeName',
                valueField: 'codeValue',
                typeAhead: true,
                queryMode: 'local',
                columnWidth: .33,
                allowBlank: false,
                listeners: {
                    change: function (obj, newvalue) {
                        var strategy = newvalue;
                        var panel = obj.up('fieldset').down("#remoteTelFee_fee_panel");
                        panel.removeAll();
                        var items = [];
                        if (strategy == "minute") {
                            items =[
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '资费(元/分钟)',
                                    value: 0.07,
                                    name: 'dial_remoteTel',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        } else if (strategy == "second6") {
                            items = [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '资费(元/6秒)',
                                    value: 0.007,
                                    name: 'dial_remoteTel',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        } else if (strategy == "minute3") {
                            items = [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '前3分钟资费(元)',
                                    value: 0.2,
                                    name: 'dial_remoteTelPrefix',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 1,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '以后每分钟(元/分钟)',
                                    value: 0.1,
                                    name: 'dial_remoteTel',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        }
                        panel.add(items);
                    }

                }
            },
            {
                xtype: 'panel',
                border: false,
                bodyCls: 'backgroud_blue',
                id: 'remoteTelFee_fee_panel',
                columnWidth:.66,
                items:this.getRemoteTelItem("init",this.data.dialFee.remoteTelStrategy)
            },

            {
                xtype: 'combobox',
                fieldLabel: '长途手机资费策略',
                name: 'dial_remoteStrategy',
                editable: false,
                value : this.data[key].remoteStrategy,
                store: App.util.AppUtil.getDicStore('dialPriceStrategy'),
                displayField: 'codeName',
                valueField: 'codeValue',
                typeAhead: true,
                queryMode: 'local',
                columnWidth: .33,
                allowBlank: false,
                listeners: {
                    change: function (obj, newvalue) {
                        var strategy = newvalue;
                        var panel = obj.up('fieldset').down("#remoteFee_fee_panel");
                        panel.removeAll();
                        var items = [];
                        if (strategy == "minute") {
                            items =[
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '资费(元/分钟)',
                                    value: 0.07,
                                    name: 'dial_remote',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        } else if (strategy == "second6") {
                            items = [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '资费(元/6秒)',
                                    value: 0.007,
                                    name: 'dial_remote',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        } else if (strategy == "minute3") {
                            items = [
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '前3分钟资费(元)',
                                    value: 0.2,
                                    name: 'dial_remotePrefix',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 1,
                                    allowBlank: false
                                },
                                {
                                    xtype: 'numberfield',
                                    fieldLabel: '以后每分钟(元/分钟)',
                                    value: 0.1,
                                    name: 'dial_remote',
                                    columnWidth: .33,
                                    decimalPrecision : 4,
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                }
                            ];
                        }
                        panel.add(items);
                    }

                }
            },
            {
                xtype: 'panel',
                border: false,
                bodyCls: 'backgroud_blue',
                id: 'remoteFee_fee_panel',
                columnWidth:.66,
                items:this.getRemoteItem("init",this.data.dialFee.remoteStrategy)
            }


        ];
        return result;
    },
    getInternationItem:function(key,prefix){
        var result=[];
        result = [
            {
                xtype: 'numberfield',
                fieldLabel: '港/澳/台(元/分钟)',
                value: this.data[key].fee1,
                name: prefix + '_fee1',
                columnWidth: .33,
                decimalPrecision: 4,
                minValue: 0,
                allowBlank: false
            },
            {
                xtype: 'numberfield',
                fieldLabel: '美国/加拿大(元/分钟)',
                value: this.data[key].fee2,
                name: prefix + '_fee2',
                columnWidth: .33,
                decimalPrecision: 4,
                minValue: 0,
                allowBlank: false
            },
            {
                xtype: 'numberfield',
                fieldLabel: '其他地区(元/分钟)',
                value: this.data[key].fee3,
                name: prefix + '_fee3',
                columnWidth: .33,
                decimalPrecision: 4,
                minValue: 0,
                allowBlank: false
            }
        ];
        return result;
    },

    getLocalTelItem:function(filed,type){
        var result=[];
        var key="dialFee";
        if(filed=="init"){
            if(type=="minute"){
                result=[
                    {
                        xtype: 'numberfield',
                        fieldLabel: '资费(元/分钟)',
                        value: this.data[key].localTel,
                        name: 'dial_localTel',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }else if(type=="second6"){
                result=[
                    {
                        xtype: 'numberfield',
                        fieldLabel: '资费(元/6秒)',
                        value: this.data[key].localTel,
                        name: 'dial_localTel',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }else if(type=="minute3"){
                result = [
                    {
                        xtype: 'numberfield',
                        fieldLabel: '前3分钟资费(元)',
                        value: this.data[key].localTelPrefix,
                        name: 'dial_localTelPrefix',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 1,
                        allowBlank: false
                    },
                    {
                        xtype: 'numberfield',
                        fieldLabel: '以后每分钟(元/分钟)',
                        value: this.data[key].localTel,
                        name: 'dial_localTel',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }
        }
        else if(filed=="change"){
            if(type=="minute"){
                result=[
                    {
                        xtype: 'numberfield',
                        fieldLabel: '资费(元/分钟)',
                        value: 0.07,
                        name: 'dial_localTel',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }else if(type=="second6"){
                result=[
                    {
                        xtype: 'numberfield',
                        fieldLabel: '资费(元/6秒)',
                        value: 0.007,
                        name: 'dial_localTel',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }else if(type=="minute3"){
                result = [
                    {
                        xtype: 'numberfield',
                        fieldLabel: '前3分钟资费(元)',
                        value: 0.2,
                        name: 'dial_localTelPrefix',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 1,
                        allowBlank: false
                    },
                    {
                        xtype: 'numberfield',
                        fieldLabel: '以后每分钟(元/分钟)',
                        value: 0.1,
                        name: 'dial_localTel',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }
        }
        return result;
    },
    getLocalItem:function(filed,type){
        var result=[];
        var key="dialFee";
        if(filed=="init"){
            if(type=="minute"){
                result=[
                    {
                        xtype: 'numberfield',
                        fieldLabel: '资费(元/分钟)',
                        value: this.data[key].local,
                        name: 'dial_local',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }else if(type=="second6"){
                result=[
                    {
                        xtype: 'numberfield',
                        fieldLabel: '资费(元/6秒)',
                        value: this.data[key].local,
                        name: 'dial_local',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }else if(type=="minute3"){
                result = [
                    {
                        xtype: 'numberfield',
                        fieldLabel: '前3分钟资费(元)',
                        value: this.data[key].localPrefix,
                        name: 'dial_localPrefix',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 1,
                        allowBlank: false
                    },
                    {
                        xtype: 'numberfield',
                        fieldLabel: '以后每分钟(元/分钟)',
                        value: this.data[key].local,
                        name: 'dial_local',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }
        }else if(filed=="change"){
            if(type=="minute"){
                result=[
                    {
                        xtype: 'numberfield',
                        fieldLabel: '资费(元/分钟)',
                        value: 0.07,
                        name: 'dial_local',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }else if(type=="second6"){
                result=[
                    {
                        xtype: 'numberfield',
                        fieldLabel: '资费(元/6秒)',
                        value: 0.007,
                        name: 'dial_local',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }else if(type=="minute3"){
                result = [
                    {
                        xtype: 'numberfield',
                        fieldLabel: '前3分钟资费(元)',
                        value: 0.2,
                        name: 'dial_localPrefix',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 1,
                        allowBlank: false
                    },
                    {
                        xtype: 'numberfield',
                        fieldLabel: '以后每分钟(元/分钟)',
                        value: 0.1,
                        name: 'dial_local',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }
        }
        return result;
    },
    getRemoteTelItem:function(filed,type){
        var result=[];
        var key="dialFee";
        if(filed=="init"){
            if(type=="minute"){
                result=[
                    {
                        xtype: 'numberfield',
                        fieldLabel: '资费(元/分钟)',
                        value: this.data[key].remoteTel,
                        name: 'dial_remoteTel',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }else if(type=="second6"){
                result=[
                    {
                        xtype: 'numberfield',
                        fieldLabel: '资费(元/6秒)',
                        value: this.data[key].remoteTel,
                        name: 'dial_remoteTel',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }else if(type=="minute3"){
                result = [
                    {
                        xtype: 'numberfield',
                        fieldLabel: '前3分钟资费(元)',
                        value: this.data[key].remoteTelPrefix,
                        name: 'dial_remoteTelPrefix',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 1,
                        allowBlank: false
                    },
                    {
                        xtype: 'numberfield',
                        fieldLabel: '以后每分钟(元/分钟)',
                        value: this.data[key].remoteTel,
                        name: 'dial_remoteTel',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }
        }
        else if(filed=="change"){
            if(type=="minute"){
                result=[
                    {
                        xtype: 'numberfield',
                        fieldLabel: '资费(元/分钟)',
                        value: 0.07,
                        name: 'dial_remoteTel',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }else if(type=="second6"){
                result=[
                    {
                        xtype: 'numberfield',
                        fieldLabel: '资费(元/6秒)',
                        value: 0.007,
                        name: 'dial_remoteTel',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }else if(type=="minute3"){
                result = [
                    {
                        xtype: 'numberfield',
                        fieldLabel: '前3分钟资费(元)',
                        value: 0.2,
                        name: 'dial_remoteTelPrefix',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 1,
                        allowBlank: false
                    },
                    {
                        xtype: 'numberfield',
                        fieldLabel: '以后每分钟(元/分钟)',
                        value: 0.1,
                        name: 'dial_remoteTel',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }
        }
        return result;
    },
    getRemoteItem:function(filed,type){
        var result=[];
        var key="dialFee";
        if(filed=="init"){
            if(type=="minute"){
                result=[
                    {
                        xtype: 'numberfield',
                        fieldLabel: '资费(元/分钟)',
                        value: this.data[key].remote,
                        name: 'dial_remote',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }else if(type=="second6"){
                result=[
                    {
                        xtype: 'numberfield',
                        fieldLabel: '资费(元/6秒)',
                        value: this.data[key].remote,
                        name: 'dial_remote',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }else if(type=="minute3"){
                result = [
                    {
                        xtype: 'numberfield',
                        fieldLabel: '前3分钟资费(元)',
                        value: this.data[key].remotePrefix,
                        name: 'dial_remotePrefix',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 1,
                        allowBlank: false
                    },
                    {
                        xtype: 'numberfield',
                        fieldLabel: '以后每分钟(元/分钟)',
                        value: this.data[key].remote,
                        name: 'dial_remote',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }
        }
        else if(filed=="change"){
            if(type=="minute"){
                result=[
                    {
                        xtype: 'numberfield',
                        fieldLabel: '资费(元/分钟)',
                        value: 0.07,
                        name: 'dial_remote',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }else if(type=="second6"){
                result=[
                    {
                        xtype: 'numberfield',
                        fieldLabel: '资费(元/6秒)',
                        value: 0.007,
                        name: 'dial_remote',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }else if(type=="minute3"){
                result = [
                    {
                        xtype: 'numberfield',
                        fieldLabel: '前3分钟资费(元)',
                        value: 0.2,
                        name: 'dial_remotePrefix',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 1,
                        allowBlank: false
                    },
                    {
                        xtype: 'numberfield',
                        fieldLabel: '以后每分钟(元/分钟)',
                        value: 0.1,
                        name: 'dial_remote',
                        columnWidth: .33,
                        decimalPrecision : 4,
                        minValue: 0,
                        maxValue: 0.3,
                        allowBlank: false
                    }
                ];
            }
        }

        return result;
    }




});