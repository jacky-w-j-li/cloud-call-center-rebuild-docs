Ext.define('App.view.system.systemUser.setSystemUser', {
    extend: 'Ext.window.Window',
    requires: ['App.model.system.SystemUserSetLog'],
    alias: 'widget.setSystemUserWin',
    height: 600,
    width: 1000,
    title: '用户设置',
    autoScroll: true,
    data: null,
    logStore: null,
    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            modal: true,
            items: [
                {
                    xtype: 'tabpanel',
                    activeTab: 0,
                    items: [
                        {
                            xtype: 'panel',
                            frame: true,
                            id: 'sys_user_price_config_panel',
                            title: '用户设置',
                            items: this.getPriceItems(me)
                        }
                    ]
                }
            ]
        });
        me.callParent(arguments);
    },
    getPriceItems: function (me) {
        var items = new Array();
        var getDefaultValue = function (type) {
            if (me.data[type]) {
                return me.data[type];
            }
            if (me.data[type]==0) {
                return 0;
            }
            if (me.data.identity != "proxy") {
                return 0;
            }
            var proxyLevel = me.data.proxyLevel;
            if (type == 'serviceLicence') {//客服版
                //if(proxyLevel=="1"){
                //    return 30;
                //}else if(proxyLevel=="2"){
                //    return 40;
                //}else if(proxyLevel =="3"){
                //    return 50;
                //}
                return 99;
            } else if (type == 'callinLicence') {//企业版
                if (proxyLevel == "1") {
                    return 60;
                } else if (proxyLevel == "2") {
                    return 80;
                } else if (proxyLevel == "3") {
                    return 100;
                }
            } else if (type == 'monitorLicence') {//监控版
                if (proxyLevel == "1") {
                    return 10;
                } else if (proxyLevel == "2") {
                    return 15;
                } else if (proxyLevel == "3") {
                    return 20;
                }
            } else if (type == "agentPercent") {
                if (proxyLevel == "1") {
                    return 50;
                } else if (proxyLevel == "2") {
                    return 40;
                } else if (proxyLevel == "3") {
                    return 30;
                }
            }
            return 0;
        };
        var licenseFeildSet = {
            xtype: 'fieldset',
            id: 'license_set_fieldset',
            title: 'licence资费设置',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {
                    name: '_id',
                    value: this.data._id,
                    hidden: true
                },
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '标准版(元/个)',
                    //value: this.data.serviceLicence || 99,
                    value: getDefaultValue("serviceLicence"),
                    //value:99,
                    name: 'serviceLicence',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '企业版(元/个)',
                    //value: this.data.callinLicence || 300,
                    value: getDefaultValue("callinLicence"),
                    //value:300,
                    name: 'callinLicence',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    allowBlank: false
                },

                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '监控板(元/个)',
                    //value: this.data.monitorLicence || 0,
                    value: getDefaultValue("monitorLicence"),
                    name: 'monitorLicence',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    allowBlank: false
                },

                {
                    xtype: 'numberfield',
                    maxValue: 100,
                    minValue: 0,
                    fieldLabel: 'licence分成比例(%)',
                    //value : this.data.agentPercent || 0,
                    value: getDefaultValue("agentPercent"),
                    name: 'agentPercent',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    allowBlank: false
                }


            ]
        };
        items.push(licenseFeildSet);
        var feeFieldSet = {
            xtype: 'fieldset',
            title: '费用设置',
            id: 'fare_set_fieldset',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '透支额度(元)',
                    value: this.data.overdraw || 0,
                    name: 'overdraw',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    allowBlank: true
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '总机月租分成比例(%)',
                    maxValue: 100,
                    minValue: 0,
                    value: this.data.monthRentPercent || 0,
                    name: 'monthRentPercent',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    allowBlank: false
                }
            ]
        };

        items.push(feeFieldSet);

        var lineFeesFieldSet = {
            xtype:'fieldset',
            title:'线路资费',
            id:'line_fees_fieldset',
            collapsible: true,
            layout: 'fit',
            cls: 'backgroud_blue',
        }
        items.push(lineFeesFieldSet);

        //国际化设置
        /*var internationalFieldSet = {
            xtype: 'fieldset',
            title: '国际长途设置',
            id: 'international_set_fieldset',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {
                    xtype: 'numberfield',
                    fieldLabel: '港/澳/台(元/分钟)',
                    value: this.getInternationalFee(this.data.internationalFee.fee1, 1),
                    name: 'fee1',
                    columnWidth: .33,
                    decimalPrecision: 4,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    /!*maxValue: 0.3,*!/
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '美国/加拿大(元/分钟)',
                    value: this.getInternationalFee(this.data.internationalFee.fee2, 2),
                    name: 'fee2',
                    columnWidth: .33,
                    decimalPrecision: 4,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    /!* maxValue: 0.3,*!/
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '其他(元/分钟)',
                    value: this.getInternationalFee(this.data.internationalFee.fee3, 3),
                    name: 'fee3',
                    columnWidth: .33,
                    decimalPrecision: 4,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    /!* maxValue: 0.3,*!/
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '国际长途分成比例(%)',
                    maxValue: 100,
                    minValue: 0,
                    value: this.data.intlPercent || 0,
                    name: 'intlPercent',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    allowBlank: false
                }
            ]
        };
        items.push(internationalFieldSet);
*/
        var smsFieldSet = {
            xtype: 'fieldset',
            title: '短信资费设置',
            id: 'smsFee_set_fieldset',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '短信资费(元/条)',
                    value: this.data.smsFee || 0,
                    name: 'smsFee',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    allowBlank: true
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '短信分成比例(%)',
                    maxValue: 100,
                    minValue: 0,
                    value: this.data.smsPercent || 0,
                    name: 'smsPercent',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    allowBlank: false
                }
            ]
        };

        items.push(smsFieldSet);

        //运营商流量包
        var flowFieldSet = {
            xtype: 'fieldset',
            title: '运营商流量包资费设置',
            id: 'flow_set_fieldset',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {
                    fieldLabel: "运营商",
                    editable: false,
                    name: 'operatorsResource',
                    columnWidth: .40,
                    labelWidth: 150,
                    value: "中国移动（单位：元）",
                    labelAlign: 'right',
                    readOnly: true
                },
                {
                    xtype: 'panel',
                    layout: "column",
                    border: false,
                    bodyCls: 'backgroud_blue',
                    id: 'llFee_detail_panel',
                    columnWidth: 1,
                    items: [
                        {
                            xtype: 'numberfield',
                            fieldLabel: '10M',
                            value: this.data.fee['100001'] || 3,
                            name: '100001',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '30M',
                            value: this.data.fee['100002'] || 5,
                            name: '100002',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '70M',
                            value: this.data.fee['100003'] || 10,
                            name: '100003',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '150M',
                            value: this.data.fee['100004'] || 20,
                            name: '100004',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '500M',
                            value: this.data.fee['100005'] || 30,
                            name: '100005',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '1024M',
                            value: this.data.fee['100006'] || 50,
                            name: '100006',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '2048M',
                            value: this.data.fee['100007'] || 100,
                            name: '100007',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '3072M',
                            value: this.data.fee['100008'] || 150,
                            name: '100008',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '4096M',
                            value: this.data.fee['100009'] || 200,
                            name: '100009',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '6144M',
                            value: this.data.fee['100010'] || 300,
                            name: '100010',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '11264M',
                            value: this.data.fee['100011'] || 500,
                            name: '100011',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        }
                    ]
                },
                {
                    fieldLabel: "运营商",
                    editable: false,
                    name: 'operatorsResource',
                    columnWidth: .40,
                    labelWidth: 150,
                    value: "中国联通（单位：元）",
                    labelAlign: 'right',
                    readOnly: true
                },
                {
                    xtype: 'panel',
                    layout: "column",
                    border: false,
                    bodyCls: 'backgroud_blue',
                    id: 'ltFee_detail_panel',
                    columnWidth: 1,
                    items: [
                        {
                            xtype: 'numberfield',
                            fieldLabel: '20M',
                            value: this.data.fee['200001'] || 3,
                            name: '200001',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 10,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '50M',
                            value: this.data.fee['200002'] || 6,
                            name: '200002',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 50,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '100M',
                            value: this.data.fee['200003'] || 10,
                            name: '200003',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 50,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '200M',
                            value: this.data.fee['200004'] || 15,
                            name: '200004',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 50,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '500M',
                            value: this.data.fee['200005'] || 30,
                            name: '200005',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 50,
                            allowBlank: false
                        }

                    ]
                },
                {
                    fieldLabel: "运营商",
                    editable: false,
                    name: 'operatorsResource',
                    columnWidth: .40,
                    labelWidth: 150,
                    value: "中国电信（单位：元）",
                    labelAlign: 'right',
                    readOnly: true
                },
                {
                    xtype: 'panel',
                    layout: "column",
                    border: false,
                    bodyCls: 'backgroud_blue',
                    id: 'dxFee_detail_panel',
                    columnWidth: 1,
                    items: [
                        {
                            xtype: 'numberfield',
                            fieldLabel: '5M',
                            value: this.data.fee['300001'] || 1,
                            name: '300001',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '10M',
                            value: this.data.fee['300002'] || 2,
                            name: '300002',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '30M',
                            value: this.data.fee['300003'] || 5,
                            name: '300003',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '50M',
                            value: this.data.fee['300004'] || 7,
                            name: '300004',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '100M',
                            value: this.data.fee['300005'] || 10,
                            name: '300005',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '200M',
                            value: this.data.fee['300006'] || 15,
                            name: '300006',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '500M',
                            value: this.data.fee['300007'] || 30,
                            name: '300007',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        },
                        {
                            xtype: 'numberfield',
                            fieldLabel: '1024M',
                            value: this.data.fee['300008'] || 50,
                            name: '300008',
                            columnWidth: .33,
                            decimalPrecision: 4,
                            msgTarget: 'side',
                            labelWidth: 150,
                            labelAlign: 'right',
                            minValue: 0,
                            maxValue: 1000,
                            allowBlank: false
                        }

                    ]
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '流量分成比例(%)',
                    maxValue: 100,
                    minValue: 0,
                    value: this.data.flowPercent || 0,
                    name: 'flowPercent',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    allowBlank: false
                }
            ]
        };

        items.push(flowFieldSet);

        var voiceFieldSet = {
            xtype: 'fieldset',
            title: '语音验证码资费设置',
            id: 'voice_set_fieldset',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {
                    xtype: 'numberfield',
                    fieldLabel: '语音资费(元/分钟)',
                    value: this.data.voiceFee || 0,
                    name: 'voiceFee',
                    columnWidth: .33,
                    decimalPrecision: 4,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    maxValue: 1,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    fieldLabel: '语音验证码分成比例(%)',
                    maxValue: 100,
                    minValue: 0,
                    value: this.data.voicePercent || 0,
                    name: 'voicePercent',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    allowBlank: false
                }]};

        items.push(voiceFieldSet);

        var resourceFieldSet = {
            xtype: 'fieldset',
            title: '资源设置',
            id: 'resource_set_fieldset',
            collapsible: true,
            layout: 'column',
            cls: 'backgroud_blue',
            defaultType: 'textfield',
            items: [
                {
                    fieldLabel: '选号范围',
                    name: 'numScope',
                    xtype: 'radiogroup',
                    labelWidth: 150,
                    labelAlign: 'right',
                    items: this.getRadiaoItems(this.data),
                    columnWidth: .5,
                    listeners: {}
                }
            ]
        };
        items.push(resourceFieldSet);

        var buttons = {
            xtype: 'fieldset',
            layout: {
                type: 'hbox',
                pack: 'center',
                align: 'middle'
            },
            cls: 'no_border',
            items: [
                {
                    xtype: 'button',
                    width: 90,
                    id: 'sysUser_price_confirm_button',
                    text: '确认'
                },
                {
                    xtype: 'button',
                    width: 90,
                    id: 'viewlog_price_button',
                    text: '查看日志'
                }

            ]
        };
        items.push(buttons);

        var form = {
            xtype: 'form',
            frame: true,
            title: '',
            style: {
                border: 0,
                padding: 0
            },
            items: items
        }
        return form;
    },
    getLogViewPanel: function (type) {
        var gridPanle = {
            xtype: 'gridpanel',
            title: '日志列表',
            class: 'query',
            forceFit: true,
            loadMask: true,
            store: this.getLogDataStore(type),
            columnLines: true,
            columns: [
                {
                    dataIndex: 'time',
                    width: 120,
                    align: 'center',
                    header: '时间'
                },
                {
                    dataIndex: 'operator',
                    width: 70,
                    align: 'center',
                    renderer: this.userRender,
                    header: '操作人'
                },
                {
                    dataIndex: 'content',
                    header: '变更内容',
                    align: 'center',
                    width: 220
                }
            ],
            bbar: Ext.create('Ext.PagingToolbar', {
                store: this.getLogDataStore(type),
                displayInfo: true,
                displayMsg: '当前记录 {0} - {1} 共 {2}',
                emptyMsg: "没有记录可显示"
            })

        };

        var panel = Ext.create('Ext.form.Panel', {
            frame: true,
            class: 'query',
            title: '日志查看',
            dataType: type,
            fieldDefaults: {
                msgTarget: 'side',
                labelWidth: 90,
                labelAlign: 'right'
            },
            bodyStyle: 'padding:2px 2px 0',
            items: [
                {
                    xtype: 'fieldset',
                    title: '日志查询',
                    frame: true,
                    class: "query",
                    collapsible: true,
                    layout: 'column',
                    defaultType: 'textfield',
                    items: [
                        {
                            name: "type",
                            hidden: true,
                            value: type
                        },
                        {
                            name: "uid",
                            value: this.data._id,
                            hidden: true
                        },
                        {
                            fieldLabel: '操作人',
                            name: 'operator',
                            xtype: 'combobox',
                            store: App.util.AppUtil.getDicStore('systemUser'),
                            displayField: 'codeName',
                            valueField: 'codeValue',
                            typeAhead: true,
                            queryMode: 'local',
                            columnWidth: .33
                        },
                        {
                            fieldLabel: '操作时间',
                            name: 'time',
                            xtype: 'datefield',
                            format: 'Y-m-d',
                            columnWidth: .33
                        }
                    ]
                },
                {
                    xtype: 'fieldset',
                    layout: {
                        type: 'hbox',
                        pack: 'center',
                        align: 'middle'
                    },
                    cls: 'no_border',
                    items: [
                        {
                            xtype: 'button',
                            class: 'query',
                            width: 90,
                            text: '查询'
                        },
                        {
                            xtype: 'button',
                            class: 'reset',
                            width: 90,
                            text: '重置'
                        }

                    ]
                },
                gridPanle
            ]

        });
        return panel;
    },
    userRender: function (value) {
        return App.util.AppUtil.getRendererValue(value, 'systemUser');
    },
    getLogDataStore: function (type) {
        if (this.logStore == null) {
            var data = {};
            data.type = type;
            data.uid = this.data._id;
            this.logStore = App.util.AppUtil.getGridStore("bill.systemUser.queryUserSetLog", data, "App.model.system.SystemUserSetLog");
            this.logStore.loadPage(1);
        }
        return this.logStore;
    },
    getDialFeeItem: function (strategy) {
        var feeItem = [];
        if (strategy == "minute") {
            feeItem = [
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '市话(元/分钟)',
                    value: this.data.dialFee.local,
                    name: 'local',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    maxValue: 0.3,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '长途(元/分钟)',
                    value: this.data.dialFee.remote,
                    name: 'remote',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    maxValue: 0.3,
                    allowBlank: false
                }
            ];
        } else if (strategy == "second6") {
            feeItem = [
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '市话(元/6秒)',
                    value: this.data.dialFee.local,
                    name: 'local',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    maxValue: 0.3,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '长途(元/6秒)',
                    value: this.data.dialFee.remote,
                    name: 'remote',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    maxValue: 0.3,
                    allowBlank: false
                }
            ];
        } else if (strategy == 'minute3') {
            feeItem = [
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '本地前3分钟资费(元)',
                    value: this.data.dialFee.prefixMin,
                    name: 'prefixMin',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    maxValue: 1,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '本地以后每分钟(元/分钟)',
                    value: this.data.dialFee.local,
                    name: 'local',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    maxValue: 0.3,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '长途(元/分钟)',
                    value: this.data.dialFee.remote,
                    name: 'remote',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    maxValue: 0.3,
                    allowBlank: false
                }
            ]
        }

        return feeItem;
    },
    getDial400FeeItem: function (strategy) {
        var feeItem = [];
        if (strategy == "minute") {
            feeItem = [
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '市话(元/分钟)',
                    value: this.data.dial400Fee.local,
                    name: 'local400',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    maxValue: 0.3,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '长途(元/分钟)',
                    value: this.data.dial400Fee.remote,
                    name: 'remote400',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    maxValue: 0.3,
                    allowBlank: false
                }

            ];
        } else if (strategy == "second6") {
            feeItem = [
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '市话(元/6秒)',
                    value: this.data.dial400Fee.local,
                    name: 'local400',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    maxValue: 0.3,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '长途(元/6秒)',
                    value: this.data.dial400Fee.remote,
                    name: 'remote400',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    maxValue: 0.3,
                    allowBlank: false
                }

            ];
        } else if (strategy == 'minute3') {
            feeItem = [
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '本地前3分钟资费(元)',
                    value: this.data.dial400Fee.prefixMin,
                    name: 'prefixMin400',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    maxValue: 1,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '本地以后每分钟(元/分钟)',
                    value: this.data.dial400Fee.local,
                    name: 'local400',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    maxValue: 0.3,
                    allowBlank: false
                },
                {
                    xtype: 'numberfield',
                    decimalPrecision: 4,
                    fieldLabel: '长途(元/分钟)',
                    value: this.data.dial400Fee.remote,
                    name: 'remote400',
                    columnWidth: .33,
                    msgTarget: 'side',
                    labelWidth: 150,
                    labelAlign: 'right',
                    minValue: 0,
                    maxValue: 0.3,
                    allowBlank: false
                }
            ]
        }

        return feeItem;
    },
    getRadiaoItems: function (data) {
        var radiaos = [];
        var me = {
            boxLabel: "我自己的",
            name: 'numScope',
            inputValue: "me"
        };
        var all = {
            boxLabel: "我自己的和公共的",
            name: 'numScope',
            inputValue: "all"
        };
        if (data.numScope == 'me') {
            me.checked = true;
        } else {
            all.checked = true;
        }
        radiaos.push(me);
        radiaos.push(all);
        return radiaos;
    },
    getInternationalFee : function (val,dftVal) {
        if(!val && val!=0){
            return dftVal;
        }
        return val;
    }
});
