Ext.define('App.view.account.industry.edit',{
    extend: 'Ext.window.Window',
    alias: 'widget.editIndustry',
    width: 850,
    layout: {
        type: 'column',
    },
    modal: true,
    title: '编辑行业信息',
    record:null,
    editMode:'addNew',
    initComponent: function(){
        var win = this;
        Ext.applyIf(this,{
            items:[
                {
                    xtype: 'form',
                    frame: true,
                    title: '',
                    bodyStyle: 'padding:2px 2px 0',
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 90,
                        labelAlign: 'right',
                    },
                    items:[
                        {
                            xtype:'fieldset',
                            title: '行业信息',
                            id: 'industry_info',
                            collapsible: false,
                            defaultType: 'textfield',
                            layout:'column',
                            cls: 'background_blue',
                            items: [
                                {
                                    name:'_id',
                                    value: this.getFieldValue("_id"),
                                    hidden : true,
                                },
                                {
                                    fieldLabel:'行业名称',
                                    name:'name',
                                    value: this.getFieldValue('name'),
                                    allowBlank: false,
                                    columnWidth: .33333,
                                },
                                {
                                    fieldLabel:'行业分类等级',
                                    name:'categoryLevel',
                                    value: this.getFieldValue('categoryLevel') || 2,
                                    allowBlank: false,
                                    xtype:"combobox",
                                    store:App.util.AppUtil.getDicStore("industryCategoryLevel"),
                                    columnWidth: .333333,
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    listeners:
                                    {
                                        select:function(obj,selected) {
                                            var selectedRecord = selected[0];
                                            var parent = win.down("combobox[name='parent']");
                                            var level = selectedRecord.get('codeValue');
                                            if(level == 1){
                                                parent.setValue(null);
                                                parent.setVisible(false);
                                                parent.allowBlank=true;
                                            }else{
                                                parent.setVisible(true);
                                                parent.allowBlank=false;
                                            }
                                        }
                                    }
                                },
                                {
                                    fieldLabel: "所属行业大类",
                                    xtype:  "combobox",
                                    store:  App.util.AppUtil.getDicStore("industry",true,{categoryLevel:"1"}),
                                    name:   "parent",
                                    displayField: 'codeName',
                                    valueField: 'codeValue',
                                    typeAhead: true,
                                    queryMode: 'local',
                                    value:  this.getFieldValue("parent"),
                                    allowBlank: function(){
                                        if(win.editMode == "addNew"){
                                            return false;
                                        }
                                        if(win.getFieldValue("categoryLevel") == '2'){
                                            return false;
                                        }

                                        return true;
                                    }(),
                                    hidden: function(){
                                        if(win.editMode == "addNew"){
                                            return false;
                                        }
                                        if(win.getFieldValue("categoryLevel") == '2'){
                                            return false;
                                        }

                                        return true;
                                    }(),
                                    columnWidth: .333333,
                                },
                                {
                                    fieldLabel: '备注',
                                    name: 'memo',
                                    xtype: 'textarea',
                                    value: this.getFieldValue('memo'),
                                    columnWidth: 1
                                },
                            ],
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
                    handler: function(obj){
                        var win = obj.up('window');
                        win.close();
                    }
                }
            ]
        });
        this.callParent(arguments);
    },
    getFieldValue:function(fieldName){
        if(!this.record){
            return '';
        }
        return this.record.get(fieldName);
    }
});