Ext.define('App.view.account.account.updateSmsTemplete', {
    extend: 'Ext.window.Window',
    alias: 'widget.updateSmsTempleteWindow',
    width: 550,
    radioValue:null,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '短信模板',
    data: null,
    account: null,
    templateValue:null,
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
                    items: this.getItems()
                }
            ],
            buttons: [
                {
                    text: '保存',
                    id: 'btn_update_sms_templete'
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
        //初始化 radio赋值
        if(this.radioValue){
            Ext.getCmp('radio1').setValue(true);
        }else{
            Ext.getCmp('radio2').setValue(true);
        }
        if(!this.data.yd_smsChannel){
            Ext.getCmp('radio2').setValue(true);
        }
        if(this.templateValue==1){
            Ext.getCmp('templateRadio0').setValue(true);
        }else if(this.templateValue==2){
            Ext.getCmp('templateRadio1').setValue(true);
        }else if(this.templateValue==3){
            Ext.getCmp('templateRadio2').setValue(true);
        }


    },
    getItems : function(){
        var items = [];
        var fieldset = {
            xtype: 'fieldset',
            title: '短信模板',
            collapsible: true,
            defaultType: 'textfield',
            items : [
                {
                    name: 'account',
                    value: this.data.account,
                    hidden: true
                },
                {
                    name: '_id',
                    value: this.data._id,
                    hidden: true
                },
                {
                    name: 'num',
                    value: this.data.num,
                    hidden: true
                },
                {
                    fieldLabel: '模板名称',
                    name: 'name',
                    value : this.data.name,
                    allowBlank: false
                },{
                    fieldLabel: '模板内容',
                    name: 'content',
                    id:'content',
                    xtype:'textareafield',
                    value : this.data.content,
                    allowBlank: false,
                    listeners:{
                        blur: this.delSpecialChar
                    }
                },{
                    fieldLabel: '模板签名',
                    name: 'sign',
                    xtype: 'combobox',
                    store: App.util.AppUtil.getDicStore('smsSign',true,{type:"smsSign",account:this.data.account}),
                    allowBlank: false,
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    value : this.data.sign,
                    typeAhead: true,
                    queryMode: 'local'
                },
                {
                    fieldLabel: '报备通道',
                    id:'df_smsChannel',
                    name: 'df_smsChannel',
                    xtype: 'combobox',
                    value : this.data.df_smsChannel || this.data.smsChannel[0],
                    allowBlank: false,
                    layout: {
                        type: 'hbox',
                        pack: 'center',
                        align: 'middle'
                    },
                    store:App.util.AppUtil.getDicStore('smsChannel',true),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    typeAhead: true,
                    queryMode: 'local'

                },
                {
                    fieldLabel: '短信类型',
                    xtype: 'radiogroup',
                    defaultType: 'radiofield',
                    name: 'templateType',
                    value:3,
                    items:this.getTemplateType()
                },
                {
                    fieldLabel: '是否启用分运营商',
                    xtype: 'radiogroup',
                    defaultType: 'radiofield',
                    name: 'operatorStrategy',
                    items: [
                        {
                            boxLabel: '是',
                            name: 'operatorStrategy',
                            inputValue: true,
                            id:'radio1'
                        }, {
                            boxLabel: '否',
                            name: 'operatorStrategy',
                            inputValue: false,
                            id:'radio2'
                        }
                    ],  listeners: {
                    change: this.openOperatorChange
                }
                },
                {
                    fieldLabel: '移动报备通道',
                    name: 'yd_smsChannel',
                    value :  this.data.yd_smsChannel,
                    id:'yd_smsChannel',
                    xtype: 'combobox',
                    layout: {
                        type: 'hbox',
                        pack: 'center',
                        align: 'middle'
                    },
                    store:App.util.AppUtil.getDicStore('smsChannel',true),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    typeAhead: true,
                    queryMode: 'local'

                },
                {
                    fieldLabel: '电信报备通道',
                    name: 'dx_smsChannel',
                    id:'dx_smsChannel',
                    value :  this.data.dx_smsChannel,
                    xtype: 'combobox',
                    store:App.util.AppUtil.getDicStore('smsChannel',true),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    typeAhead: true,
                    queryMode: 'local'

                },
                {
                    fieldLabel: '联通报备通道',
                    name: 'lt_smsChannel',
                    id:'lt_smsChannel',
                    value :  this.data.lt_smsChannel,
                    xtype: 'combobox',
                    store:App.util.AppUtil.getDicStore('smsChannel',true),
                    displayField: 'codeName',
                    valueField: 'codeValue',
                    typeAhead: true,
                    queryMode: 'local'

                }

            ]
        };
        items.push(fieldset);
        return items;
    },
    getGroupItems : function (){
        var channels = App.util.AppUtil.getDicCache("smsChannel") || [];
        var items = [];
        for (var i in channels){
            if(channels[i].codeValue){
                var item = {
                    boxLabel: channels[i].codeName,
                    name: 'smsChannel',
                    inputValue: channels[i].codeValue,
                    checked: false
                };
                for(var k in this.data.smsChannel||[]){
                    if(this.data.smsChannel[k] == channels[i].codeValue){
                        item.checked = true;
                    }
                }
                items.push(item);
            }
        }
        return items;
    },
    openOperatorChange:function (obj,newValue){
    var fieldset = obj.up('fieldset');
    var items = null;
    var type = newValue.operatorStrategy;

    if (type == true) {

        //显示
        Ext.getCmp('yd_smsChannel').setDisabled(false);
        Ext.getCmp('yd_smsChannel').setVisible(true);

        Ext.getCmp('dx_smsChannel').setDisabled(false);
        Ext.getCmp('dx_smsChannel').setVisible(true);

        Ext.getCmp('lt_smsChannel').setDisabled(false);
        Ext.getCmp('lt_smsChannel').setVisible(true);

      /*  //隐藏
        Ext.getCmp('df_smsChannel').setDisabled(true);
        Ext.getCmp('df_smsChannel').setVisible(false);
*/

        type=null;
    } else if (type == false||type.length>1) {

        //隐藏
        Ext.getCmp('yd_smsChannel').setDisabled(true);
        Ext.getCmp('yd_smsChannel').setVisible(false);
        //重置下拉框选中值（初始化）
        Ext.getCmp('yd_smsChannel').reset();

        Ext.getCmp('dx_smsChannel').setDisabled(true);
        Ext.getCmp('dx_smsChannel').setVisible(false);
        Ext.getCmp('dx_smsChannel').reset();

        Ext.getCmp('lt_smsChannel').setDisabled(true);
        Ext.getCmp('lt_smsChannel').setVisible(false);
        Ext.getCmp('lt_smsChannel').reset();

     /*   //显示
        Ext.getCmp('df_smsChannel').setDisabled(false);
        Ext.getCmp('df_smsChannel').setVisible(true);
*/
        items=null;

    }

},
    //字符过滤处理
    filterCharacter :function(obj) {
        var content=obj.value;
        if(content){
            var pattern =  new RegExp("[`~!@#$%^&*()+_=—|《-》:;\\<>/~！@#￥%…………&*———+|]");
            var rs = "";
            for (var i = 0; i < content.length; i++) {
                rs= rs+content.substr(i, 1).toString().replace(pattern, '');
            }
            rs= rs.replace( ",","，").replace( ".","。");
            Ext.getCmp('content').setValue(rs);
        }
    },
    getTemplateType:function () {
        var tags={};
        App.util.AppUtil.requestSync('bill.resource.queryTemplateType',{},function(data){
            tags=data.list;
        });
        var items = [];
        for(var i in tags){
            var item = {
                boxLabel: tags[i].code_name,
                name: 'templateType',
                id:'templateRadio'+i,
                inputValue: tags[i].code_value,
                checked: false
            };
            items.push(item);
        }
        return items;
    },
    delSpecialChar:function(obj){
        var content=obj.value;
        content = content.replace(/\/'/g,"'");
        content = content.replace(/\/"/g,'"');
        var contentarr = content.split('"');
        var str = "";
        var str2 = "";
        for(var j = 0;j< contentarr.length-1;j++){
            str+=contentarr[j]+(j%2?'”':'“');
        }
        str+=contentarr[j];
        contentarr = str.split("'");
        for(var j = 0;j<contentarr.length-1;j++){
            str2 += contentarr[j]+(j%2?'’':'‘');
        }
        str2 +=contentarr[j];
        var reg1 = new RegExp("<[^<]*>", "gi")
        str2 = str2.replace(reg1,'');
        var reg2 = new RegExp("</", "gi")
        str2 = str2.replace(reg2,'');
        if(str2.substr(str2.length-1,1) == '\\'&&str2.substr(str2.length-2,2) != '\\\\'){
            str2 = str2+'\\'
        }

        Ext.getCmp('content').setValue(str2);
    }


});
