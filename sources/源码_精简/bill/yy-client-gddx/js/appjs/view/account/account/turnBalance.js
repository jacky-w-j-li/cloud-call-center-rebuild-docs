Ext.define('App.view.account.account.turnBalance',{
    extend: "Ext.window.Window",
    alias: 'widget.turnBalanceWin',
    width:340,
    layout:{
        type: 'anchor',
    },
    modal: true,
    account: null,
    title: '账户退费',
    initComponent: function(){
        Ext.applyIf(this,{
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
                   items:[
                       {
                           xtype: 'fieldset',
                           title: '退费信息',
                           collapsible: true,
                           defaultType: 'textfield',
                           items: [
                               {
                                   name: 'account',
                                   value: this.account,
                                   hidden: true,
                               },
                               {
                                   xtype: 'numberfield',
                                   name: 'money',
                                   fieldLabel: '退费金额(元)',
                                   value:0,
                                   minValue:0,
                                   decimalPrecision: 4,
                                   allowBlank:false,
                               },
                               {
                                   xtype: 'textarea',
                                   name: 'memo',
                                   fieldLabel: '备注',
                                   allowBlank:false,
                                   columnWidth: 1,
                               }
                           ]
                       },
                   ]
               }
           ],
           buttons: [
               {
                   text: '确认',
                   class: 'submit',
               },
               {
                   text:'关闭',
                   handler:function(obj){
                       var win = obj.up('window');
                       win.close();
                   }
               }
           ]
        });
        this.callParent(arguments);
    }
});