Ext.define('App.view.system.logo.addLogo', {
    extend: 'Ext.window.Window',
    alias: 'widget.addLogoWindow',
    width: 600,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '添加logo',

    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'form',
                    frame: true,
                    title: '',
                    id:'uploadLogoForm',
                    bodyStyle: 'padding:2px 2px 0',
                    encType:"multipart/form-data",
                    fileUpload : true,
                    fieldDefaults: {
                        msgTarget: 'side',
                        labelWidth: 90,
                        labelAlign: 'right'
                    },
                    items: [
                        {
                            xtype: 'fieldset',
                            title: 'logo信息',
                            id:'logo_add_info',
                            collapsible: true,
                            defaultType: 'textfield',
                            items:this.getItems()
                        }
                    ]
                }
            ],
            buttons: [
                {
                    id:'add_logo_commit_button',
                    text:'创建'
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
    getItems:function(){
        var items=[
            {
                name: 'action',
                value:'addLogo',
                hidden:'true'
            },
            {
                name: 'sessionId',
                value:app_sessionId,
                hidden:'true'
            },
            {
                fieldLabel: '域名',
                name: '_id',
                maxLength: 30,
                maxLengthText: '最大长度不能超过30个字符！',
                allowBlank: false
            },
            {
                fieldLabel: '联系人电话',
                name: 'phone',
                allowBlank: true
            },
            {
                fieldLabel: '联系人邮箱',
                name: 'email',
                allowBlank: true
            },
            {
                xtype:'textfield',
                id:'LoadImage',
                allowBlank:false,
                fieldLabel:'logo图片',
                inputType:'file',
                name:'file'
            }
        ];
        Ext.tip.QuickTipManager.init();  // enable tooltips
        var htmlEditor=new Ext.panel.Panel({
            title: '页脚',
            renderTo: Ext.getBody(),
            width: 550,
            height: 250,
            frame: true,
            layout: 'fit',
            items: {
                xtype: 'htmleditor',
                name:'footer',
                enableColors: false,
                enableAlignments: false
            }
        });

        items.push(htmlEditor);

        return items;
    }
});
