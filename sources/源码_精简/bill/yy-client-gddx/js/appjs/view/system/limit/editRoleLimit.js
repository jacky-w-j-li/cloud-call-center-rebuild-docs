Ext.define('App.view.system.limit.editRoleLimit', {
    extend : 'Ext.window.Window',
    alias : 'widget.editRoleLimitWindow',
    width : 340,
    height : 600,
    layout : {
        type : 'anchor'
    },
    modal : true,
    title : '权限配置',

    initComponent : function() {
        var me = this;
        Ext.applyIf(me, {
            items : [{
                xtype : 'treepanel',
                id : 'user_limit_config_tree',
                height : 540,
                useArrows : true,
                frame : true,
                rootVisible : true,
                store : this.getTreeStore()
            }],
            buttons : [{
                text : '确定',
                id : 'edit_role_limit_confirm'
            }, {
                text : '关闭',
                handler : function(){
                    me.close();
                }
            }]

        });
        me.callParent(arguments);
    },
    getTreeStore : function() {
        var store = Ext.create('Ext.data.TreeStore');
        return store;
    }
});
