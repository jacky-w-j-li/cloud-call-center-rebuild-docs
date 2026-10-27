/**
 * Created with JetBrains WebStorm.
 * User: caif
 * Date: 13-12-17
 * Time: PM3:50
 * To change this template use File | Settings | File Templates.
 */
handler.agent={
    pageSize:10,
    getAgentList:function(data,src){
        data=data||{};
        var pane=$("#right_pane");
        var frmId='frm_agent_info';
        if(src && src.attr("value")){//for frm and page click
            data.page = src.attr("value");
        }else{
            var frmData = DS.getDataOfForm($("#"+frmId));
            data=frmData.data;
            data.page = pane.find(".pagination li[class='active']").find("a").attr("value")||1;
        }
        data.page = parseInt(data.page,10)||1;
        data.limit=handler.agent.pageSize;
        var action={
            action:'app.agent.getAgentList',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                if (list.length > 0){
                    var tmpl='<tr><td>_#displayName#_ _@agent.showFieldDesc("isAdmin","_#isAdmin#_")@_</td><td>_#exten#_</td><td>_#password#_</td><td>_#mobile#_</td>' +
                        '<td>_#email#_</td><td>_#didNum#_</td><td>_#callerIDNum#_</td><td>_#recordDesc#_</td><td>_#deal#_</td></tr>';
                    var html = [];
                    for (var i = 0, len = list.length; i < len; i++) {
                        var row = list[i];
                        row.recordDesc="否";
                        if(row.isRecord=='true'){
                            row.recordDesc="是";
                        }
                        var id=row._id;
                        if(list[i].isDelete != "drop"){
                            var deal='<a href="#" class="ds_do_action" ds_action="agent.showUpdate" ds_data="'+id+'">修改</a>';
                                //'<a href="#" class="ds_do_action" ds_action="agent.delConfirm" ds_data="'+id+'">删除</a>';
                            if(row.didNum){
                                deal+='&nbsp;&nbsp;<a href="#" class="ds_do_action" ds_action="agent.cancelDidNum" ds_data="'+id+'" didNum="'+row.didNum+'">取消直拨号</a>';
                            }else{
                                row.didNum="";
                                deal+='&nbsp;&nbsp;<a href="#" class="ds_do_action" ds_action="agent.showDidNumView" ds_data="'+id+'">指定直拨号</a>';
                            }
                            row.deal=deal;
                            if(!row.callerIDNum){
                                row.callerIDNum="";
                            }
                            html.push(DS.renderMethodViewNew(tmpl, row));
                        }
                    }
//                    alert((typeof pane)+"\n"+pane.length+"\n"+ pane.prop("tagName")+"\n"+ pane.prop("nodeName"));
                    pane.find('.agent_list').html(html.join(''));
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>';
                    pane.find('.agent_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    updateAgent:function(data,src){
        if(data.iscallinternation == "true"){
            data.iscallinternation = true;
        }else if(data.iscallinternation == "false"){
            data.iscallinternation = false;
        }
        var action={
            action:'app.agent.updateAgent',
            data:data
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                handler.agent.getAgentList();
                pane.find('#agent_modal').modal('hide');
                var cache = session.dicMap["agents"];
                if (cache.length > 0) {
                    for (var i = 0; i < cache.length; i++) {
                        if (cache[i]._id == data._id) {
                            cache[i].isRecord = data.isRecord;
                            break;
                        }
                    }
                }
            }else{
                if(rep.code=='404'){
                    $().alertmessage('showError', rep.message);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            }
        })
    },
    showUpdate:function(id,src){
        var action={
            action:'app.agent.getAgentById',
            data:{_id:id}
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                DS.getView('zj/agent/agent_update',function(view){
                    var row=rep.row;
                    handler.agent.beforeshowupdate(pane,view,row);

                })
            }
        })
    },

    delConfirm:function(data,src){
        if(!confirm("是否要删该员工？"))return;
        var action={
            action:'app.agent.updateAgent',
            data:data
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                handler.agent.getAgentList();
                pane.find('#agent_modal').modal('hide');
            }else{
                if(rep.code=='404'){
                    $().alertmessage('showError', rep.message);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            }
        })
    },

    showAdd:function(data,src){
        var pane=$("#right_pane");
        DS.getView('zj/agent/agent_update',function(view){
            view=view.replace(/_#.*#_/g,'');
            var p=pane.find('#agent_modal');
            p.find(".modal-dialog").width(500);
            p.find(".modal-body").html(view);
            p.find(".modal-title").html('添加员工');
            p.find(".ds_form_action").attr({ds_action:'agent.addAgent',ds_form:'#frm_agent_update'});
            var nums=getCache("ivrNums");
            var html=getDicOptions(nums);
            p.find(".callerIDNum").html(html);
            pane.find('#agent_modal').modal();
        })
    },
    addAgent:function(data,src){
        var action={
            action:'app.agent.addAgent',
            data:data
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                pane.find(".agent_search").click();
                pane.find('#agent_modal').modal('hide');
            }else{
                if(rep.code=='404'){
                    $().alertmessage('showError', rep.message);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            }
        })
    },
    reset:function(data,src){
        var frm=src.closest("form");
        frm[0].reset();
    },
    showFieldDesc:function(type,val){
        var desc='';
        if(type=='isAdmin'){
            if(val=='true'){
                desc='(管理员)';
            }
        }
        return desc;
    },
    showDidNumView:function(uid,src){
        var action={
            action:'app.account.queryFreeDidNumList',
            data:{product:handler.account.productType}
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list||[];
                if(list.length>0){
                    DS.getView('zj/agent/didnum_list',function(view){
                        var p=$('#agent_modal');
                        p.find(".modal-dialog").width(850);
                        p.find('.modal-title').text('选择直拨号码');
                        p.find(".modal-body").html(view);
                        p.find(".modal-body").find("input[name='uid']").val(uid);
                        p.find(".ds_form_action").attr({ds_action:'agent.bindDidNum',ds_form:'#frm_didnum_data'});
                        var tmpl1='<div class="row">';
                        var tmpl='<div class="col-md-3 col1"><label><h3 style="display: inline-block;cursor: pointer;"><input type="radio" name="telNum" value="_#_id#_"> _#_id#_</h3></label></div>';
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            if(i==0){
                                html.push(tmpl1);
                            }else if(i%4==0){
                                html.push("</div>");
                                html.push(tmpl1);
                            }
                            html.push(DS.renderMethodViewNew(tmpl, row));
                            if(i==len-1){
                                html.push("</div>");
                            }
                        }
                        p.find('#service_didnum_list').html(html.join(''));
                        p.modal();
                    });
                }else{
                    $().alertmessage('showWarning', "您还没有购买号码或直拨号码已被绑定");
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
//
//        var pane=$("#right_pane");
//        DS.getView('zj/agent/didnum_list',function(view){
//            var p=pane.find('#agent_modal');
//            p.find(".modal-dialog").width(850);
//            p.find('.modal-title').text('选择直拨号码');
//            p.find(".modal-body").html(view);
//            p.find(".modal-body").find("input[name='uid']").val(uid);
//            p.find(".ds_form_action").attr({ds_action:'agent.bindDidNum',ds_form:'#frm_didnum_data'});
//            handler.agent.getDidNumList();
//            p.modal();
//        });
    },
    cancelDidNum:function(uid,src){
        if(!confirm('确认取消该员工的直拨号码吗？'))return;
        var didNum=src.attr("didNum");

        var pane=$("#right_pane");
        var action={
            action:'app.agent.cancelDidNum',
            data:{uid:uid,didNum:didNum}
        }
        DS.send(action,function(rep){
            if(rep.success){
                handler.agent.getAgentList();
                pane.find('#agent_modal').modal('hide');
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    bindDidNum:function(data,src){
        var pane=$("#right_pane");
        var action={
            action:'app.agent.bindDidNum',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                handler.agent.getAgentList();
                pane.find('#agent_modal').modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    showBatchAdd:function(data,src){
        var pane=$("#right_pane");
        DS.getView('zj/agent/agent_batch_add',function(view){
            var p=pane.find('#agent_modal');
            p.find(".modal-dialog").width(500);
            p.find(".modal-body").html(view);
            p.find(".modal-title").html('批量添加员工');
            p.find(".ds_form_action").attr({ds_action:'agent.batchAddAgent',ds_form:'#frm_agent_batch_add'});
            pane.find('#agent_modal').modal();
        })
    },
    batchAddAgent:function(data,src){
        var action={
            action:'app.agent.batchAddAgent',
            data:data
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                pane.find(".agent_search").click();
                pane.find('#agent_modal').modal('hide');
            }else{
                if(rep.code=='404'){
                    $().alertmessage('showError', rep.message);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            }
        })
    },
    showBatchAddInternation:function(data,src){
        var pane=$("#right_pane");
        DS.getView('zj/agent/agent_batch_update_callInternation',function(view){
            var p=pane.find('#agent_modal');
            p.find(".modal-dialog").width(600);
            p.find(".modal-body").html(view);
            p.find(".modal-title").html('批量国际长途权限');
            p.find(".ds_form_action").attr({ds_action:'agent.batchUpdateCallInternaion',ds_form:'#frm_agent_batch_update_callInternation'});
            pane.find('#agent_modal').modal();
        })
    },
    beforeshowupdate:function(pane,view,row){
        var action = {
            action: 'app.agent.getCallInternation',
        }
        DS.send(action, function (response) {
            view=DS.renderMethodViewNew(view,row);
            var p=pane.find('#agent_modal');
            p.find(".modal-dialog").width(600);
            p.find(".modal-body").html(view);
            optionSelect(p.find(".modal-body select[name='isAdmin']"),row.isAdmin+'');
            optionSelect(p.find(".modal-body select[name='isRecord']"),row.isRecord+'');
            p.find(".modal-title").html('修改员工信息');
            p.find(".ds_form_action").attr({ds_action:'agent.updateAgent',ds_form:'#frm_agent_update'});
            var nums=getCache("ivrNums");
            var html=getDicOptions(nums,row.callerIDNum);
            p.find(".callerIDNum").html(html);
            pane.find('#agent_modal').modal();
            if (response.iscallinternation) {
                pane.find("#isopenrecord").after('<div class="form-group"> <label class="control-label col-md-4">是否开启国际长途服务 </label> <div class="col-md-5"> <select name="iscallinternation" class="form-control input-sm"> <option value="true">是</option> <option value="false">否</option>  </select> </div> </div>');
                optionSelect(p.find(".modal-body select[name='iscallinternation']"),row.iscallinternation+'');
            }
        });
    },
    showBatchUpdateCallerNum:function(data,src){
        var pane=$("#right_pane");
            DS.getView('zj/agent/agent_batch_update_callerNum',function(view){
            var p=pane.find('#agent_modal');
            p.find(".modal-dialog").width(500);
            p.find(".modal-body").html(view);
            p.find(".modal-title").html('批量修改外显号码');
            p.find(".ds_form_action").attr({ds_action:'agent.batchUpdateCallerNum',ds_form:'#frm_agent_batch_update_callerNum'});
            var nums=getCache("ivrNums");
            var html=getDicOptions(nums);
            p.find(".callerIDNum").html(html);
            pane.find('#agent_modal').modal();
        })
    },
    batchUpdateCallerNum:function(data,src){
        var action={
            action:'app.agent.batchUpdateCallerNum',
            data:data
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                pane.find(".agent_search").click();
                pane.find('#agent_modal').modal('hide');
            }else{
                if(rep.code=='404'){
                    $().alertmessage('showError', rep.message);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            }
        })
    },
    batchUpdateCallInternaion:function(data,src){
        if(data.batch_callinternation == "true"){
            data.batch_callinternation = true;
        }else if(data.batch_callinternation == "false"){
            data.batch_callinternation = false;
        }
        var action={
            action:'app.agent.batchUpdateCallInternaion',
            data:data
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                pane.find(".agent_search").click();
                pane.find('#agent_modal').modal('hide');
            }else{
                if(rep.code=='404'){
                    $().alertmessage('showError', rep.message);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            }
        })
    }
    /*getDidNumList:function(data,src){
     data=data||{};
     if(src){
     data.page = src.attr("value") || 1;
     }else{
     data.page = 1;
     }
     data.limit=20;
     var frmId='frm_didnum_info';
     var pane=$("#right_pane");
     var action={
     action:'app.agent.getDidnumList',
     data:data
     };
     DS.send(action,function(rep){
     if(rep.success){
     var list=rep.list;
     var count=rep.count;
     if (list.length > 0){
     var tmpl1='<div class="row">';
     var tmpl='<div class="col-md-3 col1"><label><h3 style="display: inline-block;cursor: pointer;"><input type="radio" name="didNum" value="_#_id#_"> _#_id#_</h3></label></div>';
     var html = [];
     for (var i = 0, len = list.length; i < len; i++) {
     var row = list[i];
     if(i==0){
     html.push(tmpl1);
     }else if(i%4==0){
     html.push("</div>");
     html.push(tmpl1);
     }
     html.push(DS.renderMethodViewNew(tmpl, row));
     if(i==len-1){
     html.push("</div>");
     }
     }
     pane.find('#service_didnum_list').html(html.join(''));
     } else {
     pane.find('#service_didnum_list').html('没有记录!');
     }

     pane.find('.agent_didnum_main .result_count').text(count);
     DS.updatePagination(frmId, count, data.limit, data.page);
     }else{
     $().alertmessage('showError', errMsg);
     }
     });
     }*/

}