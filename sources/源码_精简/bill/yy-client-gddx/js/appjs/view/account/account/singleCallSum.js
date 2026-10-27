Ext.define('App.view.account.account.singleCallSum',{
    extend: "Ext.window.Window",
    alias: 'widget.singleCallSumWin',
    width:340,
    layout:{
        type: 'anchor',
    },
    modal: true,
    account: null,
    title: '拨号次数设置',
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
                           title: '账号拨号设置',
                           collapsible: true,
                           defaultType: 'textfield',
                           items: [
                               {
                                   name: 'account',
                                   value: this.account,
                                   hidden: true,
                               },
                               {
                                   name: 'callSum',
                                   id:'callSum',
                                   fieldLabel: '号码',
                                   allowBlank:false,
                               }/*,
                               {
                                   name: 'freeCallSum',
                                   id:'freeCallSum',
                                   fieldLabel: '剩余拨号次数',
                                   value:0,
                                   readOnly:true,
                                   renderer: this.getCallSum(this.account,'freeCallSum')
                               }*/
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
    },
});