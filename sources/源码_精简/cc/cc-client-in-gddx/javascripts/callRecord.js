handler.callRecord ={
    showCallRecordInCustomer: function (cid, pane, menu, popupId,custName) {
        DS.getView('callRecord/callRecord', function (view) {
            view = view.replace(new RegExp('_#customer#_', 'g'), cid).replace(/_#popupId#_/g,popupId);
            pane.html(view);
            handler.callRecord.showAddCallRecord(popupId,menu,cid,custName,pane);
//            if (recordId) {
//                handler.task.getTask({_id: recordId}, function (task) {
//                    handler.task._showTask(menu, task, pane.find('.task_detail_pane'));
//                });
//            } else {
//                handler.task.getCustomerIncompleteTask({customer: cid}, function (tasks) {
//                    for (var i = 0; i < tasks.length; i++) {
//                        handler.task._showTask(menu, tasks[i], pane.find('.task_detail_pane'));
//                    }
//                });
//            }
        });
    },
    showAddCallRecord: function (dbType,menu,cid,custName,container) {
        var pane = container.find('.task_add_pane');
        if (pane.find('.task_add').length > 0)
            return;

        DS.getView('callRecord/callRecord_add',function(view){
//            var menu = src.closest('.task_container').attr('ds_menu');
            view = view.replace(new RegExp('_#cid#_', 'g'), cid)
                .replace(new RegExp('_#menu#_', 'g'), menu);

            view=view.replace(/_#dbType#_/g,dbType).replace(/_#custName#_/g,custName);
            pane.empty();
            pane.html(view);
//            var tmpl=getCache('callRecordTmpls',dbType);

            handler.callRecord.loadCallRecordAddTmpl(dbType,pane);
            pane.find(".cancel_button").click(function(){
//                dsevent.publish(dsevent.evt.customerAddCancelPop, callId);
            });
        });
    },
    loadCallRecordAddTmpl:function(dbType,pane){
        var tmpls = getCache('callRecordTmpls',dbType);
        var parent=pane.find("#icc_callRecord_add_pane");
        parent.empty();
        if(tmpls){
            pane.find("#tmpl_callRecord_add").tmpl(tmpls).appendTo(parent);
            pane.find('.date_picker').datepicker({
                changeMonth: true,
                changeYear: true,
                showButtonPanel: true
            });
        }
    },
    saveCallRecord:function(data,src){
        if (src.hasClass("disabled")) return false;
        src.addClass("disabled");
        var action = {
            action: 'app.callRecord.addCallRecord',
            data: data
        };
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "添加成功");
//                dsevent.publish(dsevent.evt.customerAdd,rep.data);
            }else{
                $().alertmessage('showError', errMsg);
            }
//            src.removeClass("disabled");
        });
    },
    cancelAddCallRecord: function (data, src) {
        src.closest('.task_add').remove();
    },
    loadCallRecordInfo:function(id){
        var pane=$("#callRecord_detail_modal");
        DS.getView('callRecord/callRecord_view',function(view){
            pane.html(view);
            var action = {
                action: 'app.callRecord.queryCallRecordInfo',
                data: {_id: id}
            };
            DS.send(action,function(response){
                if(response.success){
                    var row=response.data;
                    var body=pane.find(".modal-body");
                    body.empty();
                    pane.find("#tmpl_callRecord_detail").tmpl(row).appendTo(body);
                    pane.modal();
                }else{
                    $().alertmessage('showError', errMsg);
                }
            });
        });
    },
    getCustomFieldDicName:function(dbType,id,key,/*dropdown,radio,checkbox*/type){
        var fields=getCache('callRecordTmpls',dbType).custom_fields;
        var desc=[];
        for (var i = fields.length - 1; i >= 0; i--) {
            var obj = fields[i];
            if(obj._id==id){
                var choices=obj.choices;
                for(var k in choices){
                    if (type=='checkbox'){
                        for(var j=0;j<key.length;j++){
                            if(k==key[j]){
                                desc.push(choices[k]);
                                break;
                            }
                        }
                    }else {
                        if(k==key){
                            desc.push(choices[k]);
                            break;
                        }
                    }
                }
                break;
            }
        }
        return desc.join(",");
    },
    showTypeDesc:function(dbType,type){
        var types=getCache('callRecordTmpls',dbType).types;
        if(!type)return "";
        for (var i = 0; i < types.length; i++) {
            var obj = types[i];
            if(obj.key==type){
                return obj.name;
            }
        }
    },
    showAddCallRecord2Cust: function (callNo,cid,custName,src) {
        var container=src.closest(".contact_summary").find(".task_container");
        var menu=container.attr("ds_menu");
        var dbType=session.account.currentCallRecord;
//        console.dir("dbType======"+dbType);
        if(dbType){
            DS.getView('callRecord/callRecord', function (view) {
                container.html(view);
                var pane = container.find('.task_add_pane');
                DS.getView('callRecord/callRecord_add_dial',function(view){
                    view = view.replace(/_#cid#_/g, cid).replace(/_#callNo#_/g,callNo);
                    view=view.replace(/_#dbType#_/g,dbType).replace(/_#custName#_/g,custName);
                    pane.html(view);

                    handler.callRecord.loadCallRecordAddTmpl(dbType,pane);
                });

            });
        }
    },
    saveCallRecord2Dial:function(data,src){
        if (src.hasClass("disabled")) return false;
        src.addClass("disabled");
        var action = {
            action: 'app.callRecord.addCallRecord2Dial',
            data: data
        };
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "添加成功");
                var container=src.closest("#view_customer_list");
//                var menu=container.attr("ds_menu");
                src.closest(".contact_operating_area.custlist").empty();
                container.find(".left_column").find(".item"+data.cid).closest(".list_item").remove();
                var first=container.find(".left_column").find(".list_item:first");
                if(first.length>0){
                    first.find(".item_row").click();
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
    //            src.removeClass("disabled");
        });
    }
}
