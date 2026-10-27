handler.sipNo={
    pageSize:10,
    codes:null,
    isFax:null,
    initSipNo:function(){
        var html=handler.getDicOptions('sipNumStatus');
        var pane=$("#right_pane");
        pane.find("select[name='status']").html(html);
        var btn=pane.find(".btn_sip_add");
        if(btn.length>0){
            if(isHasFunc('func_zj_sip_add')){
                btn.show();
            }else{
                btn.remove();
            }
        }
        handler.sipNo.getSipNoList();
    },
    initCCSipNo:function(){
        var html=handler.getDicOptions('sipNumStatus');
        var pane=$("#right_pane");
        pane.find("select[name='status']").html(html);
        var html2=handler.getCCPbxOptions();
        pane.find("select[name='pbx']").html(html2);
        handler.sipNo.getSipNoList();
    },
    getSipNoList:function(data,src){
        data=data||{};
        var pane=$("#right_pane");
        var frmId='frm_sipNo_search';
        if(src && src.attr("value")){
            data.page = src.attr("value");
        }else{
            var frmData = DS.getDataOfForm($("#"+frmId));
            data=frmData.data;
            data.page = pane.find(".pagination li[class='active']").find("a").attr("value")||1;
        }
        data.page = parseInt(data.page,10)||1;
        data.limit=handler.sipNo.pageSize;
        data.product=handler.account.productType||'';

        var action={
            action:'app.sipNo.querySipNumByUcenter',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
//                    <td>_@sipNo.showFieldDesc("sipNumStatus","_#status#_")@_</td>
                    var tmpl='<tr><td>_#_id#_</td><td>_#secret#_</td><td>_#codecs#_</td><td class="peerStatus_#_id#_">_@getZJSipStatusDesc("_#sipStatus.peerStatus#_")@_</td><td>_#displayName#_</td><td class="">_#pbxAddr#_</td>' +
                        '<td class=""><a href="#" class="ds_do_action" ds_action="sipNo.showUpdateSipNo" ds_data="_#_id#_|_#secret#_">修改</a>' +
                        '<a href="#" style="margin-left: 10px;" class="ds_do_action bill_hide btn_sip_codec" ds_action="sipNo.showUpdateSipNoCodes" ds_data="_#_id#_|_#codecs#_|_#isFax#_">修改编码</a></td></tr>';
                    if(data.product=='cc'){
                        tmpl='<tr><td>_#_id#_</td><td>_#secret#_</td><td>_#codecs#_</td><td>_@getCCPbxDesc("_#pbx#_")@_</td><td>_#displayName#_</td>' +
                            '<td class="peerStatus_#_id#_">_@getZJSipStatusDesc("_#sipStatus.peerStatus#_")@_</td><td>_#pbxAddr#_</td></tr>';
                    }
                    tmpl+='<tr><td colspan="100"><strong class="sipStatusInfo">详细信息</strong>&nbsp;&nbsp;&nbsp;' +
                        '<span class="sipStatusInfo">延迟<span class="status_#_id#_">_#sipStatus.status#_</span></span>&nbsp;&nbsp;' +
                        '<span class="sipStatusInfo">外网地址<span class="ip_#_id#_">_#sipStatus.ipAddress#_:_#sipStatus.ipPort#_</span></span>&nbsp;&nbsp;' +
                        '<span class="sipStatusInfo">设备:<span class="sipUseragent_#_id#_">_#sipStatus.sipUseragent#_</span></span>&nbsp;&nbsp;' +
                        '<span class="sipStatusInfo">子网信息:<span class="regContact_#_id#_">_#sipStatus.regContact#_</span></span></td></tr>';
                    var html = [];
                    for (var i = 0, len = list.length; i < len; i++) {
                        var row = list[i];
                        if(!row.codes){
                            row.codes=[];
                        }
                        if(!row.isFax){
                            row.isFax = false;
                        }
                        if(!row.userData){
                            row.displayName='';
                        }else{
                            row.displayName=row.userData.displayName;
                        }
                        if(!row.pbxData){
                            row.pbxAddr='';
                        }else{
                            row.pbxAddr=row.pbxData.sipAddr;
                        }

                        row.codecs=row.codes.join(",");
                        html.push(DS.renderMethodViewNew(tmpl, row));
                    }
                    pane.find('.sipNo_list').html(html.join(''));

                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>';
                    pane.find('.sipNo_list').html(html);
                }
                var btn=pane.find(".btn_sip_codec");
                if(btn.length>0){
                    if(isHasFunc('func_zj_sip_codec')){
                        btn.show();
                    }else{
                        btn.remove();
                    }
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },

    showAsk:function(data,src){
        var pane=$("#right_pane");
        data=data||{};
        data.account=session.account._id;
        data.billLoginName=session.account.billLoginName;
        data.product=handler.account.productType;

        DS.getView('zj/sipNo/sipNo_ask',function(view){
            view=DS.renderMethodViewNew(view,data);
            var p=pane.find('#sipNo_modal');
            p.find(".modal-dialog").width(500);
            p.find(".modal-body").html(view);
            p.find(".modal-title").html('申请网关sip号');
            p.find(".ds_form_action").attr({ds_action:'sipNo.addAskSipNo',ds_form:'#frm_ask_update'});
            pane.find('#sipNo_modal').modal();
        })
    },
    addAskSipNo:function(data,src){
        var action={
            action:'bill.systemUser.saveAskGwSip',
            data:data
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "您的申请已发送，我们会在3个工作日内处理！");
                pane.find('#sipNo_modal').modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    showAddSipNo:function(data,src){
        var pane=$("#right_pane");
        data=data||{};
        data.account=session.account._id;
        data.billLoginName=session.account.billLoginName;
        data.product=handler.account.productType;

        DS.getView('zj/sipNo/sipNo_add',function(view){
            view=DS.renderMethodViewNew(view,data);
            var p=pane.find('#sipNo_modal');
            p.find(".modal-dialog").width(500);
            p.find(".modal-body").html(view);
            p.find(".modal-title").html('添加网关sip号');
            p.find(".ds_form_action").attr({ds_action:'sipNo.addSipNo',ds_form:'#frm_addSipNo_update'});
            pane.find('#sipNo_modal').modal();
        })
    },
    addSipNo:function(data,src){
        var action={
            action:'bill.account.addGatewaySipNumByUcenter',
            data:data
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "添加网关sip号成功！");
                pane.find(".sipNo_search").click();
                pane.find('#sipNo_modal').modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    showUpdateSipNo:function(data,src){
        var pane=$("#right_pane");
        var ary=data.split("|");
        var sip={};
        sip._id=ary[0];
        sip.secret=ary[1];

        DS.getView('zj/sipNo/sipNo_update',function(view){
            view=DS.renderMethodViewNew(view,sip);
            var p=pane.find('#sipNo_modal');
            p.find(".modal-dialog").width(500);
            p.find(".modal-body").html(view);
            p.find(".modal-title").html('修改网关sip号');
            p.find(".ds_form_action").attr({ds_action:'sipNo.updateSipNo',ds_form:'#frm_updateSipNo_update'});
            pane.find('#sipNo_modal').modal();
        })
    },
    updateSipNo:function(data,src){
        var action={
            action:'bill.account.updateZJSipNumByUcenter',
            data:data
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "修改网关sip号成功！");
                handler.sipNo.getSipNoList();
                pane.find('#sipNo_modal').modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    showUpdateSipNoCodes:function(data,src){
        var pane=$("#right_pane");
        var ary=data.split("|");
        var sip={};
        sip._id=ary[0];
        handler.sipNo.codes=ary[1] || "";//为aa,bb,cc形式的字符串
        handler.sipNo.isFax=ary[2] || "false";//string

        DS.getView('zj/sipNo/sipNo_update_codes',function(view){
            view=DS.renderMethodViewNew(view,sip);
            var p=pane.find('#sipNo_modal');
            p.find(".modal-dialog").width(500);
            p.find(".modal-body").html(view);
            p.find(".modal-title").html('修改网关sip号');
            p.find(".ds_form_action").attr({ds_action:'sipNo.updateSipNoCodes',ds_form:'#frm_updateSipNo_codes'});
            pane.find('#sipNo_modal').modal();
        })
    },
    updateSipNoCodes:function(data,src){
        var action={
            action:'bill.account.updateZJSipNumCodesByUcenter',
            data:data
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "修改网关sip号成功！");
                handler.sipNo.getSipNoList();
                pane.find('#sipNo_modal').modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    getUpdateIsFax:function(){
        var html='<label class="checkbox-inline col-md-5" style="margin-left: 5px;"><input type="checkbox" id="sipNo_update_isFax" name="isFax" onclick="faxClick2()">传真</label>';
        if(handler.sipNo.isFax == "true"){
             html='<label class="checkbox-inline col-md-5" style="margin-left: 5px;"><input type="checkbox" id="sipNo_update_isFax" name="isFax" checked=true onclick="faxClick2()">传真</label>';
        }
        return html;
    },
    getUpdateCodecs:function(name,type){
        var html=[];
        var selectOptionHtml = '<label class="checkbox-inline" style="margin-left: 5px;"><input type="checkbox" name="'+name+'[]" fieldgroup="1" checked=true value="__value">__name </label>';
        var optionHtml = '<label class="checkbox-inline" style="margin-left: 5px;"><input type="checkbox" name="'+name+'[]" fieldgroup="1" value="__value">__name</label>';
        if(handler.sipNo.isFax == "true"){
            selectOptionHtml = '<label class="checkbox-inline" style="margin-left: 5px;"><input type="checkbox" name="'+name+'[]" fieldgroup="1" checked=true disabled=true value="__value">__name </label>';
            optionHtml = '<label class="checkbox-inline" style="margin-left: 5px;"><input type="checkbox" name="'+name+'[]" fieldgroup="1" disabled=true  value="__value">__name</label>';
        }

        var ary=getCache(type);
        if(!ary || ary.length==0) return null;
        var codes=handler.sipNo.codes;//为aa,bb,cc形式的字符串
        codes=codes.split(',');

        for (var i = 0; i < ary.length; i++) {
            var obj = ary[i];
            if (codes && $.inArray(obj.codeValue, codes) != -1) {
                html.push(selectOptionHtml.replace(/__value/g, obj.codeValue).replace(/__name/g, obj.codeName).replace(/__name/g, obj.codeName));
            } else {
                html.push(optionHtml.replace(/__value/g, obj.codeValue).replace(/__name/g, obj.codeName));
            }
        }
        return html.join("");
    },
    refreshSipNoStatus:function(data,src){
        var action={
            action:'app.sipNo.refreshSipNoStatus',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var statusList = rep.list;
                for(var i=0 ;i<statusList.length; i++){
                    var exten = statusList[i].exten;
                    var status = statusList[i].peerStatus;
                    var selector = $(".peerStatus"+exten);
                    if(selector.length >0){
                        if(status == 'Registered'){
                            selector.html('<font color="green">已注册</font>');
                        }else if(status == 'Unregistered'){
                            selector.html('<font color="red">未注册</font>');
                        }else{
                            selector.html('未知');
                        }
                    }
                    var selector1 = $(".status"+exten);
                    if(selector1.length >0)
                        selector1.html(statusList[i].status);
                    var selector2 = $(".ip"+exten);
                    if(selector2.length >0)
                        selector2.html(statusList[i].ipAddress+':'+statusList[i].ipPort);
                    var selector3 = $(".sipUseragent"+exten);
                    if(selector3.length >0)
                        selector3.html(statusList[i].sipUseragent);
                    var selector4 = $(".regContact"+exten);
                    if(selector4.length >0)
                        selector4.html(statusList[i].regContact);
                }
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    reset:function(data,src){
        var frm=src.closest("form");
        frm[0].reset();
    },
    showFieldDesc:function(type,val){
        var desc='';
        if(type=='sipNumStatus'){
            desc=getGeneralDicName(type,val);
        }
        return desc;
    },
    getAddCodecs:function(){
        var dft=['g729'];
        return getDicCheckbox("code","codecs",dft);
    }


}