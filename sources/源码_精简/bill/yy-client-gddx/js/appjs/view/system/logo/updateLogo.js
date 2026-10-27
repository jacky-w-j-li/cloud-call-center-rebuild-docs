Ext.define('App.view.system.logo.updateLogo', {
    extend: 'Ext.window.Window',
    alias: 'widget.updateLogoWindow',
    width: 600,
    layout: {
        type: 'anchor'
    },
    modal: true,
    title: '更新logo',
    data: null,

    initComponent: function () {
        var me = this;
        Ext.applyIf(me, {
            items: [
                {
                    xtype: 'form',
                    frame: true,
                    title: '',
                    id:'uploadLogo_Form',
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
                            xtype : 'box',
                            //id : 'browseImage',
                            fieldLabel : "当前logo图片",
                            autoEl : {
                                width: 235,
                                //height: 150,
                                tag: 'img',
                                // type : 'image',
                                src: '/image/thirdImg/' + this.data.fileName,
                                style: 'filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale);',
                                complete: 'off'
                                //id : 'imageBrowse'
                            }
                        },
                        {
                            xtype: 'fieldset',
                            title: 'logo信息',
                            id:'logo_update_info',
                            collapsible: true,
                            defaultType: 'textfield',
                            items:this.getItems()
                        }
                    ]
                }
            ],
            buttons: [
                {
                    id:'update_logo_commit_button',
                    text:'更新'
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
                value:'updateLogo',
                hidden:'true'
            },
            {
                name: 'sessionId',
                value:app_sessionId,
                hidden:'true'
            },
            {
                name: 'fileName',
                value:this.data.fileName,//用于删除，可以少一步查询
                hidden:'true'
            },
            {
                fieldLabel: '域名',
                name: '_id',
                maxLength: 30,
                value:this.data._id,
                maxLengthText: '最大长度不能超过30个字符！',
                readOnly:true,
                allowBlank: false
            },
            {
                fieldLabel: '联系人电话',
                name: 'phone',
                value:this.data.phone,
                allowBlank: true
            },
            {
                fieldLabel: '联系人邮箱',
                name: 'email',
                value:this.data.email,
                allowBlank: true
            },
            {
                xtype:'textfield',
                id:'update_LoadImage',
                //allowBlank:false,
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
                enableAlignments: false,
                value:this.data.footer
            }
        });

        items.push(htmlEditor);

        return items;
    }
});
