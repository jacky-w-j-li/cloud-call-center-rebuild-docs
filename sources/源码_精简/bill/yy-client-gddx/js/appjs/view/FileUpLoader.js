Ext.define('App.view.FileUploader', {
    alias : 'widget.fileuploader',
    extend : 'Ext.form.FieldContainer',
    previewLocation : undefined, // possible values 'bottom' (default), 'left', or 'none'
    previewInitialSize : undefined, // possible values 'small' (default) , 'large'
    previewSizeSmall : undefined, // image size in pixels, default = 60
    previewSizeLarge : undefined, // image size in pixels, default = 120
    previewImage : null,
    valid : true,
    qiniuNameSpace : '',
    initComponent : function() {
        var me = this;

        var upLoadButton = {
            xtype : 'button',
            name : me.name + '_btn',
            id : me.id + '_btn',
            width: 60,
            text: me.buttonText,
            style: {
                float: 'left',
            }
        };

        if(me.allowBlank != null && !me.allowBlank && !me.value){
            me.valid = false;
        }

        me.sizeSmall = 60; // image size in pixels, default = 60
        if (me.previewSizeSmall != undefined){
            me.sizeSmall = me.previewSizeSmall;
        }
        me.sizeLarge = 120; // image size in pixels, default = 120
        if (me.previewSizeLarge != undefined){
            me.sizeLarge = me.previewSizeLarge;
        }
        me.initialSize = me.sizeSmall;
        if (me.previewInitialSize == 'large'){
            me.initialSize = me.sizeLarge;
        }

        me.items = [upLoadButton];

        if(me.value){
            if(typeof(me.value) == 'object'){
                me.value.forEach(function(img){
                    me.addImage(img);
                })
            }else{
                me.addImage(me.value);
            }
        }

        me.on({
            afterrender : function(){
                me.initUpLoader();
            }
        })

        me.callParent(arguments);
    },
    initUpLoader: function(){
        var me = this;
        var qiniu7moorDomain='http://7xj0za.com1.z0.glb.clouddn.com/';

        //var img = me.down('image')
        //img.getEl().dom.onload = function(){
        //    //隐藏加载菊花.
        //    img.setLoading(false);
        //};
        var qiniu = Qiniu.uploader({
            runtimes: 'flash,html4',
            browse_button: me.id + '_btn',
            multi_selection:false,
            container:me.id,
            drop_element: me.id,
            max_file_size: '2mb',
            flash_swf_url: '/js/qiniu/plupload/Moxie.swf',
            dragdrop: true,
            chunk_size: '4mb',
            uptoken_url: '/action?action=app.qiniu.getUptoken&data={}&sessionId=' + app_sessionId,
            //downtoken_url: '/downtoken',
            domain: qiniu7moorDomain,
            unique_names: false,
            save_key: false,
            auto_start: true,
            filters: {
                mime_types : [
                    { title : "Image files", extensions : "jpg,jpeg,gif,png" }
                ]
            },
            init: {
                'FilesAdded': function(up, files) {
                    //console.log('FilesAdded')
                },
                'BeforeUpload': function(up, file) {
                    //console.log('before upload')
                    Ext.MessageBox.show({
                        xtype : 'messagebox',
                        title : '请稍后...',
                        msg : '正在上传图片',
                        progressText : '已完成0%',
                        width : 300,
                        progress : true,
                        closable : false
                    });
                },
                'UploadProgress': function(up, file) {
                    Ext.MessageBox.updateProgress(file.percent/100,'已完成'+file.percent+'%');
                },
                'UploadComplete': function() {
                    //console.log('UploadComplete');
                    Ext.MessageBox.close();
                },
                'FileUploaded': function(up, file, info) {
                    //console.log('file uploaded')
                    var res = JSON.parse(info);
                    var url = qiniu7moorDomain+res.key;

                    console.log('upload success: ' + url);

                    //img.setSrc(url);
                    //img.setVisible(true);
                    //img.setLoading('Loading...');
                    me.addImage(url);
                    if(typeof(me.value) != "object"){
                        if(me.value && me.value != ''){
                            me.value = [me.value];
                            me.value.push(url);
                        }else{
                            me.value = url;
                        }
                    }else{
                        me.value.push(url);
                    }
                },
                'Error': function(up, err, errTip) {
                    console.log('Error');
                    me.valid = false;
                    Ext.MessageBox.show({
                        title: '上传图片失败',
                        msg: errTip,
                        buttons: Ext.MessageBox.OK,
                        icon: Ext.MessageBox.WARNING
                    });

                },
                'Key': function(up, file) {
                    //console.dir(file)
                    var key = me.qiniuNameSpace + App.util.AppUtil.getUuid() + '$-$'+file.name;
                    return key;
                }
            }
        });
    },
    getValue: function(){
        return this.value;
    },
    getName: function(){
        return this.name;
    },
    addImage:function(src){
        var me = this;
        var previewImage = {
            xtype : 'image',
            frame : true,
            width : me.initialSize,
            height : me.initialSize,
            animate : 2000,
            hidden : true, // initially hidden
            scope : me,
            sizeSmall : me.sizeSmall,
            sizeLarge : me.sizeLarge,
            margin: '0 5 0 5',
            id: 'fileuploader_image_' + me.items.length,
            listeners : {
                el: {
                    contextmenu   : function(event) {
                        event.preventDefault();
                        var messageContextMenu = new Ext.menu.Menu({
                            id      : 'fileuploader_image_menu_' + me.items.length,
                            items   : [
                                {
                                    text    : '删除',
                                    handler : function(){
                                        var img = me.down('image[src="' + src + '"]');
                                        me.remove(img);

                                        if(typeof(me.value) == 'object'){
                                            me.value.splice(me.value.indexOf(src),1);
                                            if(me.value.length == 0){
                                                me.value = null;
                                            }
                                        }else{
                                            me.value = null;
                                        }

                                        messageContextMenu.destroy();
                                    }
                                },
                                {
                                    text    : '下载',
                                    handler : function(){
                                        var downloadName = src.substr(src.lastIndexOf('$-$')+3);
                                        window.location.href = src + '?attname=' + downloadName;
                                        return false;
                                    }
                                }
                            ],
                            listeners: {
                                beforehide : function(){
                                    messageContextMenu.destroy();
                                }
                            }
                        });
                        var coords = event.getXY();
                        messageContextMenu.showAt(coords[0],coords[1]);

                        return false;
                    }
                },
            }
        };

        previewImage.src = src;
        previewImage.hidden = false;

        if (me.previewLocation == 'left' || me.previewLocation == 'bottom' || me.previewLocation == undefined){
            if(me.rendered){
                me.add(previewImage);
            }else{
                me.items.push(previewImage);
            }
        }
        if (me.previewLocation == 'left'){
            me.layout = 'hbox';
            upLoadButton.margin = '0 0 0 -24';
            if (previewImage.initialSize != 'large'){
                previewImage.margin = '0 0 0 90'; // ALIGN THE IMAGE AFTER THE BUTTON
            }
        }
    },
});