Ext.define('App.view.system.systemUser.externalDialFeesEdit',{
    extend: 'Ext.window.Window',
    alias: 'widget.externalDialFeesEdit',
    width: 850,
    layout: {
        type: 'column',
    },
    modal: true,
    eidtDefaultLineFee:false,
    title: '编辑线路资费',
    record:null,
    lineIds:null,
    editMode:'addNew',
    configLineIds:null,
    initComponent: function(){
        if(this.record && this.record.get('lineIds').length>0){
            this.lineIds = [].concat(this.record.get('lineIds'));
        }
        if(this.editMode == 'update' && this.record && this.lineIds==null){
            this.eidtDefaultLineFee = true;
        }
        Ext.applyIf(this,{
            items:[
                {
                    xtype: 'form',
                    frame: true,
                    title: '',
                    bodyStyle: 'padding:2px 2px 0;',
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 160,
                        labelAlign: 'right',
                    },
                    items:[
                        {
                            xtype:'fieldset',
                            title:'线路',
                            id: 'line_set',
                            hidden: this.eidtDefaultLineFee,
                            collapsible: false,
                            cls: 'background_blue',
                            items:[
                                {
                                 html:'<div class="line_indent" id="external_dial_fees_edit_line_list_div"><span class="line_tag" hidden="true"></span></div>'
                                },
                                {
                                    xtype: 'combobox',
                                    fieldLabel: '添加线路',
                                    id:'combo_add_line',
                                    labelStyle: 'width:55px',
                                    margin:'10 0 10 0',
                                    name:'lineIds',
                                    editable:true,
                                    store: this.getLines(),
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    columnWidth:.25,
                                    msgTarget:'side',
                                },
                            ]
                        },
                        {
                            xtype:'fieldset',
                            title: '通话资费设置',
                            id: 'dial_fee_set',
                            collapsible: false,
                            defaultType: 'numberfield',
                            layout:'column',
                            cls: 'background_blue',
                            items: [
                                {
                                    decimalPrecision: 4,
                                    fieldLabel: '手机市话(元/分钟)',
                                    value: this.getFieldValue("local"),
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
                                    decimalPrecision: 4,
                                    fieldLabel: '手机长途(元/分钟)',
                                    value: this.getFieldValue("remote"),
                                    name: 'remote',
                                    columnWidth: .33,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    decimalPrecision: 4,
                                    fieldLabel: '固话市话(元/分钟)',
                                    value: this.getFieldValue("localTel"),
                                    name: 'localTel',
                                    columnWidth: .33,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    decimalPrecision: 4,
                                    fieldLabel: '固话长途(元/分钟)',
                                    value: this.getFieldValue("remoteTel"),
                                    name: 'remoteTel',
                                    columnWidth: .33,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    fieldLabel: '通话分成比例(%)',
                                    maxValue: 100,
                                    minValue: 0,
                                    value: this.getFieldValue('dialPercent'),
                                    name: 'dialPercent',
                                    columnWidth: .33,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    allowBlank: false
                                },
                            ],
                        },
                        {
                            xtype:'fieldset',
                            title: '400通话资费设置',
                            id: '400_dial_fee_set',
                            collapsible: false,
                            defaultType: 'numberfield',
                            layout:'column',
                            cls: 'background_blue',
                            items:[
                                {
                                    decimalPrecision: 4,
                                    fieldLabel: '400市话(元/分钟)',
                                    value: this.getFieldValue('400local'),
                                    name: '400local',
                                    columnWidth: .33,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    decimalPrecision: 4,
                                    fieldLabel: '400长途(元/分钟)',
                                    value: this.getFieldValue('400remote'),
                                    name: '400remote',
                                    columnWidth: .33,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    minValue: 0,
                                    maxValue: 0.3,
                                    allowBlank: false
                                },
                                {
                                    decimalPrecision: 4,
                                    fieldLabel: '400分成比例(%)',
                                    value: this.getFieldValue('num400Percent'),
                                    name: 'num400Percent',
                                    columnWidth: .33,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    maxValue: 100,
                                    minValue: 0,
                                    allowBlank: false
                                }
                            ]
                        },
                        {
                            xtype: 'fieldset',
                            title: '国际长途资费设置',
                            id: 'intl_dial_fee_set',
                            collapsible: false,
                            defaultType: 'numberfield',
                            layout: 'column',
                            cls: 'background_blue',
                            items:[
                                //{
                                //    fieldLabel: '港/澳/台(元/分钟)',
                                //    value: this.getFieldValue('intlFee1'),
                                //    name: 'intlFee1',
                                //    columnWidth: .33,
                                //    decimalPrecision: 4,
                                //    msgTarget: 'side',
                                //    labelWidth: 150,
                                //    labelAlign: 'right',
                                //    minValue: 0,
                                //    allowBlank: false
                                //},
                                //{
                                //    fieldLabel: '美国/加拿大(元/分钟)',
                                //    value: this.getFieldValue('intlFee2'),
                                //    name: 'intlFee2',
                                //    columnWidth: .33,
                                //    decimalPrecision: 4,
                                //    msgTarget: 'side',
                                //    labelWidth: 150,
                                //    labelAlign: 'right',
                                //    minValue: 0,
                                //    allowBlank: false
                                //},
                                //{
                                //    fieldLabel: '其他(元/分钟)',
                                //    value: this.getFieldValue('intlFee3'),
                                //    name: 'intlFee3',
                                //    columnWidth: .33,
                                //    decimalPrecision: 4,
                                //    msgTarget: 'side',
                                //    labelWidth: 150,
                                //    labelAlign: 'right',
                                //    minValue: 0,
                                //    allowBlank: false
                                //},
                                {
                                    fieldLabel: '国际长途分成比例(%)',
                                    maxValue: 100,
                                    minValue: 0,
                                    value: this.getFieldValue('intlPercent'),
                                    name: 'intlPercent',
                                    columnWidth: .33,
                                    msgTarget: 'side',
                                    labelWidth: 150,
                                    labelAlign: 'right',
                                    allowBlank: false
                                }
                            ]
                        }
                    ]
                }
            ],
            buttons: [
                {
                    text: this.editMode=='addNew'?'添加':'更新',
                    id: 'commit_button',
                },
                {
                    text:'关闭',
                    id:'close',
                }
            ]
        });
        this.callParent(arguments);


    },
    getFieldValue:function(fieldName){
        if(!this.record){
            return 0;
        }
        return this.record.get(fieldName);
    },
    updateRecord:function(){
        if(!this.eidtDefaultLineFee && (this.lineIds==null || this.lineIds.length<=0)){
            return false;
        }

        var fields = this.query('numberfield');
        var record = this.record;
        fields.forEach(function(field){
            var fieldName = field.getName();
            var fieldVal = field.getValue();

            record.set(fieldName,fieldVal);
        });
        if(!this.eidtDefaultLineFee){
            record.set("lineIds", this.lineIds);
        }

        record.commit();

        return true;
    },
    getRecord:function(){
        var fields = this.query('numberfield');
        var record = {};
        fields.forEach(function(field){
            var fieldName = field.getName();
            var fieldVal = field.getValue();

            record[fieldName] = fieldVal;
        });
        record.lineIds = this.lineIds;
        return record;
    },
    getLines: function(){
        return App.util.AppUtil.getDicStore('line');
    },
    getRenderLine: function (lineName,lineId) {
        var span = document.createElement('span');
        span.setAttribute('lineId',lineId);
        span.setAttribute('class','line_tag');
        span.textContent=lineName;

        var delSpan = document.createElement('span');
        delSpan.textContent='✗';
        delSpan.style = "color:red;cursor:pointer;margin-left: 10px;padding: 5px";
        var thisLineIds = this.lineIds;
        var thisConfigLineIds = this.configLineIds;
        delSpan.addEventListener('click', function(event) {
            event = event || window.event;
            var delEle = (event.target || event.srcElement).parentNode;
            var delLineId = delEle.getAttribute("lineId");

            if(thisLineIds && thisLineIds.length>0){
                thisLineIds.splice(thisLineIds.indexOf(delLineId),1);
                delEle.remove();
                thisConfigLineIds.splice(thisConfigLineIds.indexOf(delLineId),1);
            }

        });

        span.appendChild(delSpan);
        return span;
    }
});