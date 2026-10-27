handler.hangUpSms= {
    pageSize: 10,
    productType:"zj",
    productInfo:[],
    textCount:280,
    splitCount:1,
    templateLength:0,
    tempData:[],
    refreshInfo:function(src){
        handler.hangUpSms.queryHangUpSms(src);
    },
    queryHangUpSms : function(src){
        var pane=$("#right_pane");
        var product=handler.hangUpSms.productType;
        var action={
            action:'app.hangUpSms.getHangUpSmsTemplateAndSet',
            data:{product:product}
        }
        DS.send(action,function(rep){
            if(rep.success){
                var template=rep.list;
                var productInfo=rep.productInfo;
                if(template && template.length>0){
                    var tmplZJ='<tr class="_#trclass#_"><td>_#title#_</td><td>_#num#_</td><td>_#signName#_</td><td>_#desc#_</td>';
                    var suffix_set='<td><button type="button" class="btn btn-info btn-xs ds_do_action"  ds_action="hangUpSms.updateDefaultTemplate" style="margin-right: 10px;" ds_data="_#_id#_|_#title#_">设为默认</button>';
                    var suffix_update='<button type="button" class="btn btn-info btn-xs ds_do_action"  ds_action="hangUpSms.showTemplateUpdate" style="margin-right: 10px;" ds_data="_#_id#_">修改</button>';
                    var suffix_delete='<button type="button" class="btn btn-danger btn-xs ds_do_action"  ds_action="hangUpSms.showTemplateDelete" style="margin-right: 10px;" ds_data="_#_id#_|_#isDefault#_|_#title#_">删除</button></td></tr>';

                    var tmpl="";
                    var html=[];
                    for (var i = 0; i < template.length; i++) {
                        var obj = template[i];
                        var id=obj._id;
                        var num=obj.num;
                        var title=obj.title;
                        var content=obj.content;
                        var isDefault=obj.isDefault;
                        var desc="否";
                        if(isDefault==true){
                            desc="是";
                        }
                        var sign=obj.sign;//短信签名ID
                        var signName = obj.signName || '';
                        var signSubcode = obj.signSubcode || '';
                        if(signName == ''){
                            signName='未指定签名';
                        }
                        if(signSubcode == ''){
                            signSubcode = '未指定签名';
                        }

                        var col={_id:id,title:title,num:num,isDefault:isDefault,desc:desc,trclass:'',content:content,sign:sign,signName:signName,signSubcode:signSubcode};
                        tmpl=tmplZJ + suffix_set + suffix_update + suffix_delete;
                        html.push(DS.renderMethodViewNew(tmpl, col));
                    }
                    pane.find("#hangUpSms_template_list").html(html.join(""));
                }else{
                    pane.find("#hangUpSms_template_list").html('<tr><td colspan="10" class="text-center">您还未添加挂机短信模板</td></tr>');
                }
                //挂机短信设置
                if(!productInfo.hangUpSms){
                    productInfo.hangUpSms= [];
                }
                handler.hangUpSms.productInfo = productInfo;
                handler.hangUpSms.showHangUpSmsSet();
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    showHangUpSmsSet:function(){
        var data = handler.hangUpSms.productInfo;//实现取消设置不再次查询
        var pane=$("#right_pane");
        DS.getView('zj/hangUpSms/hangUpSmsSet',function(view){
            view=DS.renderMethodViewNew(view,data);
            var p=pane.find('#hangUpSms_set');
            p.find(".modal-body").html(view);
            pane.find('#sipNo_modal').modal();
        });
    },
    getHangUpSet:function(){
        var html=[];
        var selectOptionHtml = '<label class="checkbox-inline" style="margin-left: 5px;"><input type="checkbox" name="__name"  checked="checked">__value </label>';
        var optionHtml = '<label class="checkbox-inline" style="margin-left: 5px;"><input type="checkbox" name="__name" >__value</label>';
        var set=handler.hangUpSms.productInfo.hangUpSms;
        if(set.callIn == true){
            html.push(selectOptionHtml.replace(/__name/g, "callIn").replace(/__value/g, "呼入"));
        }else{
            html.push(optionHtml.replace(/__name/g, "callIn").replace(/__value/g, "呼入"));
        }
        if(set.callOut == true){
            html.push(selectOptionHtml.replace(/__name/g, "callOut").replace(/__value/g, "呼出"));
        }else{
            html.push(optionHtml.replace(/__name/g, "callOut").replace(/__value/g, "呼出"));
        }
        return html.join("");
    },
    saveHangUpSmsSet:function(data,src){
        var action={
            action:'app.hangUpSms.saveHangUpSmsSet',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "挂机短信设置成功！");
                handler.hangUpSms.refreshInfo();
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    cancelHangUpSet : function(){
        handler.hangUpSms.showHangUpSmsSet();
    },
    updateDefaultTemplate:function(data,src){
        var ary = data.split("|");
        var id = ary[0];
        var title = ary[1];//现在是字符串

        if(!confirm("确认要设置["+title+"]为默认模板吗？"))return;

        var data={
            account:session.account._id,
            product:handler.hangUpSms.productType,
            _id:id
        };
        var action={
            action:'app.hangUpSms.updateDefaultTemplate',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "设置默认挂机短信模板成功！");
                handler.hangUpSms.refreshInfo();
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    showTemplateDelete:function(data,src) {
        var ary = data.split("|");
        var id = ary[0];
        var isDefault = ary[1];//现在是字符串
        var title = ary[2];
        if (isDefault == "true") {
            $().alertmessage('showError',"不能删除默认模板！");
            return;
        } else {
            if(!confirm("确认要删除["+title+"]模板吗？"))return;
            var action={
                action:'app.hangUpSms.deleteTemplate',
                data:id
            }
            DS.send(action,function(rep){
                if(rep.success){
                    handler.hangUpSms.refreshInfo();
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
            });
        }
    },
    showAddTemplate:function(){
        var pane=$("#right_pane");
        var signs = getCache('smsSign');
        for(var i=0 ;i<signs.length ;i++){
            signs[i].value = signs[i].subcode+"_"+signs[i].name;
        }
        var options = generateComboxOptionsFromDocs(getCache('smsSign'), 'name', 'value','','');

        DS.getView('zj/hangUpSms/addTemplate',function(view){
            var p=pane.find('#hangUpSms_modal');
            p.find(".modal-dialog").width(500);
            p.find(".modal-body").html(view);
            p.find(".modal-title").html('添加模板');
            p.find(".ds_form_action").attr({ds_action:'hangUpSms.addTemplate',ds_form:'#frm_add_Template'});
            //p.find(".ds_do_action").attr({ds_action:'hangUpSms.showAddTemplate'});

            $("#add_template_tip").tooltip({title:'未备案签名不能发短信.<br>超过66字(含签名)后每66字记一条.',placement:'right',html:true});
            p.find('.templateSign').html(options);
            pane.find('#hangUpSms_modal').modal();
        })
    },
    changeTemplateText : function(target){
        var pane=$("#right_pane");
        var p=pane.find('#hangUpSms_modal');
        var content = p.find(target);
        var text = content.val();
        var sign = p.find('.templateSign').val();
        sign = sign.substring(sign.indexOf('_')+1, sign.length);
        if(text.length>(handler.hangUpSms.textCount-sign.length)){
            content.val(text.substring(0,handler.hangUpSms.textCount-sign.length));
            text = content.val();
        }
        var html = "您还可以输入<span style='color: green'>"+(handler.hangUpSms.textCount-sign.length-text.length)
            +"</span>/<span style='color: red'>"+(handler.hangUpSms.textCount-sign.length)+"</span>个文字";
        if((text.length + sign.length) > 66){
            var n=1;
            var nc = parseInt((text.length+sign.length-66)/66);
            var nv = (text.length+sign.length-66)%66;
            n+=nc;
            if(nv >0){
                n+=1;
            }
            html += "<br>内容过长短信将以<span style='color: orange'>"+n+"</span>条发出";
            handler.hangUpSms.splitCount = n;
        }else{
            handler.hangUpSms.splitCount = 1;
        }
        handler.hangUpSms.templateLength = text.length + sign.length;
        p.find('.templateTitle').html(html);
    },
    addTemplate:function(data){
        if(data.title == ''){
            $().alertmessage('showError', "请输入标题的内容！");
            return false;
        }
        if(data.content == ''){
            $().alertmessage('showError', "请输入短信的内容！");
            return false;
        }
        if(data.sign == ''){
            $().alertmessage('showError', "无签名不能发短信，请向我们备案您的签名！");
            return false;
        }
        data.num = handler.hangUpSms.splitCount;
        data.length = handler.hangUpSms.templateLength;
        data.product = handler.hangUpSms.productType;
        var action = {
            action: "app.hangUpSms.addHangUpSmsTemplate",
            data: data
        }
        var pane=$("#right_pane");
        DS.send(action, function (res) {
            if (res.success) {
                $().alertmessage('showSuccess','添加成功！');
                handler.hangUpSms.refreshInfo();
                pane.find('#hangUpSms_modal').modal('hide');
            }else{
                $().alertmessage('showError','添加失败！');
            }
        });

    },
    showTemplateUpdate : function(data,src){
        var id=data;
        //if(data && data!=''){
            var action={
                action:'app.hangUpSms.getTemplateById',
                data:id
            }
            DS.send(action,function(rep){
                if(rep.success){
                    handler.hangUpSms.getUpdateTemplate(rep.template);
                    //if(data && data!=""){
                    //    handler.hangUpSms.tempData=rep.template;//实现重置
                    //}
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
            });
        //}else{//重置
        //    handler.hangUpSms.getUpdateTemplate(handler.hangUpSms.tempData);
        //    var pane=$("#right_pane");
        //    var p=pane.find('#hangUpSms_modal');
        //    var target= p.find(".templateContent");
        //    handler.hangUpSms.changeTemplateText(target);//重新触发短信内容改变事件
        //}
    },
    getUpdateTemplate:function(data){
        var pane=$("#right_pane");
        var id = data.sign;
        var signs = getCache('smsSign');
        for(var i=0 ;i<signs.length ;i++){
            signs[i].value = signs[i].subcode+"_"+signs[i].name;
        }
        var options = generateComboxOptionsFromDocs(getCache('smsSign'), 'name', 'value','_id',id);
        DS.getView('zj/hangUpSms/updateTemplate',function(view){
            view=DS.renderMethodViewNew(view,data);
            var p=pane.find('#hangUpSms_modal');
            p.find(".modal-dialog").width(500);
            p.find(".modal-body").html(view);
            p.find(".modal-title").html('修改模板');
            p.find(".ds_form_action").attr({ds_action:'hangUpSms.updateTemplate',ds_form:'#frm_update_Template'});

            //optionSelect(p.find(".modal-body input[name='isDefault']"),data.isDefault+'');
            if(data.isDefault == true){
                p.find("#is_Default_true").attr("checked",true);
            }else{
                p.find("#is_Default_false").attr("checked",true);
            }
            p.find('.templateSign').html(options);
            $("#update_template_tip").tooltip({title:'未备案签名不能发短信.<br>超过66字(含签名)后每66字记一条.',placement:'right',html:true});
            pane.find('#hangUpSms_modal').modal();
        })
    },
    updateTemplate : function(data){
        if(data.title == ''){
            $().alertmessage('showError', "请输入标题的内容！");
            return false;
        }
        if(data.content == ''){
            $().alertmessage('showError', "请输入短信的内容！");
            return false;
        }
        if(data.sign == ''){
            $().alertmessage('showError', "无签名不能发短信，请向我们备案您的签名！");
            return false;
        }
        data.num = handler.hangUpSms.splitCount;
        data.length = handler.hangUpSms.templateLength;
        data.product = handler.hangUpSms.productType;

        var action = {
            action: "app.hangUpSms.updateHangUpSmsTemplate",
            data: data
        }
        var pane=$("#right_pane");
        DS.send(action, function (res) {
            if (res.success) {
                $().alertmessage('showSuccess','更新成功！');
                handler.hangUpSms.refreshInfo();
                pane.find('#hangUpSms_modal').modal('hide');
            }else{
                $().alertmessage('showError', res.message||errMsg);
            }
        });
    }


}