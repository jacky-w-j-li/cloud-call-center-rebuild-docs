handler.config.mailSign= {
    pageSize:10,
    richEditor:null,
    sign_main: function (menu) {
        handler.config.mailSign.querySignList();
    },
    querySignList: function (data, src,isRefresh) {
        var container=$("#view_mail_sign");
        data=data||{};
        var action = {
            action: 'config.mailSign.querySignList',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var signs = response.list||[];
                if(isRefresh){
                    refreshCache("emailSigns",signs);
                }
                var html = [];
                if(signs.length<=0){
                    container.find('.sign_mail_list').html("<div style='font-size: 14px;font-weight: bold;'>还没有任何签名，请点击添加</div>");
                    return;
                }
                DS.getView('config/mailSign/sign_item', function (view) {
                    for (var i = 0; i < signs.length; i++) {
                        var sign = signs[i];
                        sign.clsDft="";
                        if(sign.isDefault){
                            sign.clsDft="mail_sign_item_dft";
                        }
                        html.push(DS.renderMethodViewNew(view,sign));
                    }
                    container.find('.sign_mail_list').html(html.join(""));
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });

    },
    showSignAdd: function (data,src) {
        var p=$('#batch_modal');
        DS.getView('config/mailSign/sign_add', function (view) {
            p.find('.modal-title').text('新增签名');
            p.find(".modal-body").html(view);
            p.width(650);
            p.modal();
        });
    },
    saveSign: function (data,src) {
        if (src.hasClass("disabled")) return false;
        var richHtml=handler.config.mailSign.richEditor.html();
        data.name= $.trim(data.name);
        var p=$('#batch_modal');
        var frm= p.find("form").get(0);
        if(!$.trim(data.name)){
            $().alertmessage('showError', "名称不能为空");
            frm.name.focus();
            return false;
        }
        if(!$.trim(richHtml)){
            $().alertmessage('showError', "内容不能为空");
            frm.content.focus();
            return false;
        }

        src.addClass("disabled");
        var param={
            name:data.name,
            content:richHtml
        }
        var action = {
            action: "config.mailSign.insertSign",
            data: param
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                addCache('emailSigns',rep.row);
                $().alertmessage('showSuccess', "增加签名成功");
                handler.config.mailSign.querySignList();
                $('#batch_modal').modal("hide");
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
            src.removeClass("disabled");
        },"POST");
    },
    showUpdate: function (key, src) {
        var action = {
            action: 'config.mailSign.getSignById',
            data: {_id: key}
        };
        DS.send(action, function (response) {
            if (response.success) {
                var item = response.row;
                var p=$('#batch_modal');
                DS.getView('config/mailSign/sign_update', function (view) {
                    p.find('.modal-title').text('修改签名');
                    view=DS.renderViewNew(view,item);
                    p.find(".modal-body").html(view);
                    p.width(650);
                    p.modal();
//                    if(handler.config.mailSign.richEditor){
//                        handler.config.mailSign.richEditor.html(item.content);
//                    }
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });

    },
    updateSign: function (data) {
        var richHtml=handler.config.mailSign.richEditor.html();
        data.content=richHtml;
        data.name= $.trim(data.name);
        var p=$('#batch_modal');
        var frm= p.find("form").get(0);
        if(!$.trim(data.name)){
            $().alertmessage('showError', "名称不能为空");
            frm.name.focus();
            return false;
        }
        if(!$.trim(richHtml)){
            $().alertmessage('showError', "内容不能为空");
            frm.content.focus();
            return false;
        }
        var action = {
            action: "config.mailSign.updateSign",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "修改成功");
                updateCache("emailSigns",data._id,data);
                handler.config.mailSign.querySignList();
                $('#batch_modal').modal("hide");
            }else{
                $().alertmessage('showError', errMsg);
            }
        },"POST")
    },
    delSign: function (key) {
        var con = confirm("确定要删除该签名吗？");
        if (!con) {
            return false;
        }
        var action = {
            action: 'config.mailSign.removeSign',
            data: {_id: key}
        };
        DS.send(action, function (response) {
            if (response.success) {
                removeCache("emailSigns",key);
                $().alertmessage('showSuccess', "删除成功");
                handler.config.mailSign.querySignList();
            } else {
                $().alertmessage('showError', errMsg);
            }
        });
    },
    setSignDefault: function (key,src) {
        var action = {
            action: "config.mailSign.setSignDefault",
            data: {_id:key}
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                $().alertmessage('showSuccess', "设置成功");
                handler.config.mailSign.querySignList(null,null,true);
                $('#batch_modal').modal("hide");
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showItemDeal:function(id,isDefault){
        var html='<a href="#" class="ds_do_action" ds_action="config.mailSign.setSignDefault" ds_data="'+id+'" title="设为默认">设为默认</a>|';
        if(isDefault){
            html="默认签名|";
        }
        return html;
    }


}