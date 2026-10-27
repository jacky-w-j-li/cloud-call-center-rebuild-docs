handler.callWeixin = {
    users: [],
    limit: 10,
    richEditor:null,
    dispatch: function(evtJson) {
        var obj = evtJson.Data;
        if(session.currentPage.pageId != 'nav_workbench') {
            var html='<a href="#" class="ds_do_action" ds_action="callWeixin.gotoWeixinMenu">' +
                '您有新的微信消息,点击进行查看</a>';
            var param={
                cls:'weixin',
                content:html
            }
            window.setTimeout(function(){
                popupMsgTip(param);
            },500)
        }

        handler.callWeixin.weixinItemAdd(obj);
    },
    weixinItemAdd:function(data) {
        var self=this;
        var callId=data.UserID;
        data._id=callId;
        handler.call._checkLimit(callId);
        if(data.CreateTime){
            var _t=handler.formatShortTime(data.CreateTime);
            data.shortTime=_t.name;
        }else{
            data.shortTime="";
        }
        var pane = handler.call.pane;
        var itemPane= pane.find(".item"+callId);

        var _showBadge=function(){
            if(session.currentPage.pageId != 'nav_workbench' || handler.call.curShowPaneCallId!=callId){
                var num=$.trim(itemPane.find(".badge").text())||0;
                num=parseInt(num,10);
                num++;
                itemPane.find(".badge").text(num);
//                console.info("badge==="+itemPane.find(".badge").text())
            }
        }
        if($.inArray(callId,handler.callWeixin.users)!=-1){
            var paneId=callId+"_popupWeixin";
            var rightPane=$("#"+paneId);
            if(rightPane.length>0){
                _showBadge();
                handler.callWeixin.loadInboxInfo(data,paneId);
                if(session.currentPage.pageId == 'nav_workbench' && handler.call.curShowPaneCallId==callId){//打开的情况下，后续的继续更新
                    var action = {
                        action: 'app.weixin.dealMsg',
                        data: {_id:callId}
                    };
                    DS.send(action,function(rep){
                        if(rep.success) {
                        }else{
                            $().alertmessage('showError', errMsg);
                        }
                    },null,null,true);
                }
            }else{
                window.setTimeout(function(){
                    handler.callWeixin.weixinItemAdd(data);
                },1500)
            }
        }else{
            handler.callWeixin.users.push(callId);
            DS.getView('callWeixin/weixin_item', function (view) {
                if(data.MsgType=='image'){
                    data.ContentDesc="图片";
                }else{
                    data.ContentDesc=data.Content;
                }
                view = DS.renderMethodViewNew(view, data);
                handler.call.pane.prepend(view);
                itemPane= pane.find(".item"+callId);
                _showBadge();
                DS.getView('callWeixin/weixin_detail', function (detail) {
                    detail = DS.renderViewNew(detail, data);
                    handler.call.paneDetail.append(detail);
                    self.showPopupCust(callId,data);
                    var paneId=callId+"_popupWeixin";
                    $("#"+paneId).find("textarea[name='content']").keydown(function(event){
                        if(event.keyCode == 13){
                            event.preventDefault();
                            $("#"+paneId).find(".reply_weixin").click();
                        }
                    });
                });
            });
        }

    },
    showWeixinDetail: function(mid) {
        var pane = handler.call.pane;
        var call_left = pane.find(".item"+mid);
        var call_right=$("#"+mid+"_popupWeixin");
        var num=call_left.find(".badge").text();
        if(call_left.hasClass("contact_item_new")||num){
            var action = {
                action: 'app.weixin.dealMsg',
                data: {_id:mid}
            };
            DS.send(action,function(rep){
                if(rep.success) {
                    call_left.removeClass("contact_item_new");
                    handler.call.paneDetail.find(".call_detail").hide();
                    call_right.show();
                    handler.call.curShowPaneCallId = mid;
                    handler.call.currentFlag = "popupWeixin";
                    call_left.find(".badge").text("");
                    var container=call_right.find(".weixin_container .chat_msg");
                    handler.callWeixin._locationMsg(container);
                    handler.callWeixin._initQiniuImg(mid,call_right);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            });
        }else{
            handler.call.paneDetail.find(".call_detail").hide();
            call_right.show();
            handler.call.curShowPaneCallId = mid;
            handler.call.currentFlag = "popupWeixin";
            call_left.find(".badge").text("");
            var container=call_right.find(".weixin_container .chat_msg");
            handler.callWeixin._locationMsg(container);
            handler.callWeixin._initQiniuImg(mid,call_right);
        }
        $("#contact_detail_incoming_call").scrollTop(0);
    },
    showPopupCust: function(callId,wxObj){
        var uid=wxObj.UserID;
        var nick=wxObj.NickName;
        var paneId=callId+"_popupWeixin";
        var action = {
            action: 'app.popup.popupWeixin',
            data: {weixin:uid,_id:wxObj.MessageId}
        };
        DS.send(action,function(rep){
            if(rep.success) {
//                var inbox=rep.inbox;
                var contacts = rep.list;
                var count = rep.count;
                var custData = {};
                handler.callWeixin.loadFirstHistory(paneId,wxObj);
                handler.callWeixin._initHistory(paneId,uid);
//                handler.callWeixin.loadInboxInfo(wxObj,paneId);
                $("#"+paneId).attr("phone",uid);
                $("#"+paneId).attr("nick",nick);
                if(!contacts || contacts.length == 0) {
                    handler.callWeixin.loadCustAddByWeixinFirst(uid,paneId);
                } else if(contacts.length == 1) {
                    handler.customer.loadCustInfo(contacts[0]._id,callId,"popupWeixin",null,null);
                    custData = contacts[0];
                } else {
                    handler.callWeixin.loadCustMoreByMail(uid,contacts, paneId, true,null,count);
                }
                custData.callId=callId;
                dsevent.publish(dsevent.evt.callRefreshCustomer,custData);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    _getImgView:function(data,flag){
//        var imgInfo = Qiniu.imageInfo(key);
        var path=data.filePath;
        var url="";
        if(flag=='receive'){
            path=data.Content;
            url=path;
        }else{
            if(data.type=='in'){
                path=data.content;
                url=path;
            }else{
                url=path+"?imageView2/2/w/100";
            }
        }
        var html='<a href="#" class="ds_do_action" ds_action="callWeixin.showBigImg" ds_data="'+path+'"><img src="'+url+'" style="max-width:100px;"></a>';
        return html;
    },
    loadInboxInfo: function(wxObj,paneId){
        var pane=$("#"+paneId);
        var time=wxObj.CreateTime;
        var type=wxObj.MsgType;
        wxObj.timeDesc=time?time.substring(0,16):"";
        wxObj.contentDesc=wxObj.Content;
        var tmpl=pane.find("#tmpl_weixin_msg_from").html();
        if(type=='text'){
        }else if(type=='image'){
            wxObj.contentDesc=handler.callWeixin._getImgView(wxObj,"receive");
            tmpl=pane.find("#tmpl_weixin_msg_from_img").html();
        }

        tmpl=DS.renderMethodViewNew(tmpl,wxObj);
        var container=pane.find(".weixin_container .chat_msg");
        container.append(tmpl);
        handler.callWeixin._locationMsg(container);
    },
    loadFirstHistory:function(paneId,wxObj){
        var pane=$("#"+paneId);
        var container=pane.find(".chat_msg");
        var param={
            page:1,
            userID:wxObj.UserID,
            createTime:wxObj.CreateTime
        }
        handler.callWeixin.queryHistory(param,function(rep){
            if (rep.success) {
                var lastTime=wxObj.CreateTime;
                var list=rep.list;
                var html=[];
                if(list.length>0){
                    var idx=list.length-1;
                    for (var i = idx; i >=0; i--) {
                        var obj = list[i];
                        if(i==idx){
                            lastTime=obj.createTime;
                        }
                        html.push(handler.callWeixin.showMsg(obj,pane));
                    }
                    container.prepend(html.join(""));
                }
//                container.attr("ds_time",lastTime);
                handler.callWeixin.loadInboxInfo(wxObj,paneId);
//                $(".chat_time").timeago();
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    _initHistory:function(paneId,userId){
        var pane=$("#"+paneId);
        var container=pane.find(".chat_msg");
        container.scroll(function(){
            var load = "<div class='wxloading'><img src='./img/client/loading.gif'>加载中</div>";
            var end = "<div class='wxend'>已到达顶部<div>";
            var scrollTop=container.scrollTop();
            var page=container.attr("ds_attr");
            var time=container.attr("ds_time");
            page=parseInt(page,10);
            if(page==0){
                return;
            }
            if(scrollTop==0){
                $(load).prependTo(container).css("display","block");
                var param={
                    page:page,
                    userID:userId,
                    createTime:time
                }
                handler.callWeixin.queryHistory(param,function(rep){
                    if (rep.success) {
                        page++;
                        var lastTime=time;
                        container.attr("ds_attr",page);
                        container.find(".wxloading").remove();
                        var list=rep.list;
                        var html=[];
                        if(list.length>0){
                            var idx=list.length-1;
                            for (var i = idx; i >=0; i--) {
                                var obj = list[i];
                                if(i==idx){
                                    lastTime=obj.createTime;
                                }
                                html.push(handler.callWeixin.showMsg(obj,pane));
                            }
                            container.prepend(html.join(""));
                            container.scrollTop(150);
//                            $(".chat_time").timeago();
                        }else{
                            $(end).prependTo(container);
                            container.attr("ds_attr",0);
                        }
                    } else {
                        $().alertmessage('showError', rep.message||errMsg);
                    }
                });
            }
        });
    },
    queryHistory:function(data,callback){
        data.page=data.page||1;
        data.limit=handler.callWeixin.limit;
        var action = {
            action: "app.weixin.queryHistory",
            data: data
        };
        DS.send(action, function (rep) {
            callback(rep);
        },null,null,true);
    },
    loadCustAddByWeixinFirst: function(uid,paneId,isDel){
        var pane=$("#"+paneId).find(".customer_container");
        var tip=pane.find(".cust_tip");
        var body=pane.find(".cust_body");
        var callId=paneId.split("_")[0];
        var nick=$("#"+paneId).attr("nick")||'';
        var param={
            id:nick,
            desc:"微信用户",
            paneId:paneId
        }
        if(isDel){
            tip.html(template("tmpl_popup_one_customer_del",param));
        }else{
            tip.html(template("tmpl_popup_one_customer",param));
        }
        tip.show();
        handler.callWeixin.loadCustAddByWeixin(uid,paneId,null,true);

    },
    loadCustAddByWeixin: function(uid,paneId,showCancel,isHidden){
        var pane=$("#"+paneId).find(".customer_container .cust_body");
        if(pane.length<=0){
            pane =$("#"+paneId).find(".customer_container");
        }
        var nick=$("#"+paneId).attr("nick")||'';
        var callId=paneId.split("_")[0];
        var dealSrc=paneId.split("_")[1];

        DS.getView('customer/customer_add',function(view){
            view=view.replace(/_#menu#_/g,paneId).replace(/_#callNo#_/g,uid).replace(/_#dealSrc#_/g,dealSrc);
            pane.html(view);
            pane.find(".select_old_cust").show();
            var o=pane.find("#icc_add_customer_dbType");
            var tmpls=getCache('custTmpls');
            if(tmpls && tmpls.length>0){
                var dbType=tmpls[0]._id;
                o.val(dbType);
                handler.customer.loadCustAddTmpl(dbType,pane);
                pane.find('input[name="num[]"]').val(uid);
                pane.find('input[name="wxMemo[]"]').val(nick);
                if(!showCancel){
                    pane.find(".btn_cancel_edit").remove();
                }
            }
            if(isHidden){
                pane.hide();
            }
        });
    },
    loadCustMoreByMail: function(uid, contacts, paneId, showLocation, popupId,/*total record*/total) {
        var pane=$("#"+paneId).find(".customer_container");
        var nick=$("#"+paneId).attr("nick");
//        var callId=paneId.split("_")[0];
//        var idx=paneId.lastIndexOf("_");
//        var callId=paneId.substring(0,idx);

        DS.getView('call/call_pop_list',function(view){
            pane.empty();
            view = view.replace(/__id/g, paneId).replace(/__phone/g,uid).replace(/__popupId/g,popupId).replace(/__province/g,"").replace(/__city/g,"");
            pane.html(view);
            pane.find(".pop_cust_create").attr("ds_action","callWeixin.showAddCustomer");
            var tds = "";
            if(contacts && contacts.length > 0) {
                var param={
                    paneId:paneId,
                    phone:uid,
                    popupId:popupId
                }
//                ds_data='__id,__name,"+email+","+popupId+"'
                var dsAction="callWeixin.popLocateSelected";
                tds=handler.call.popupCustMoreData(contacts,param,dsAction);
            }
            if(showLocation){
                pane.find(".location_phone").html("通过微信用户<span class='phone'>"+nick+"</span>为您定位到以下客户，请选择:");
                pane.find(".location_phone").css("display","block");
            } else {
                pane.find(".location_phone").css("display","none");
            }
            DS.updatePagination("query_customer_form_"+paneId, total, handler.call.queryPageSize, 1);
            var paneBody = $("#customer_list_pane_"+paneId);
            paneBody.html(tds);
        });
    },
    popLocateSelected: function(data) {//多个客户选择
//        console.dir(data)
        var params=data.split(",");
        var customerId = params[0];
        var name = params[1];
        var wxId = params[2];
        var paneId = params[3];
        var popupId = params[4];
        var arys=paneId.split("_");
        var callId=arys[0],flag=arys[1];
//        var callId = handler.call.curShowPaneCallId;
//        console.info("callId======"+callId)
        handler.customer.loadCustInfo(customerId, callId, flag,null,popupId);
        var popData = {
            callId:callId,
            name:name,
            customerId:customerId
        };
        dsevent.publish(dsevent.evt.callRefreshCustomer,popData);
        //relation customer
        var _param={
            customerId:customerId,
            callId:callId,
            custName:name
        }
        var action = {
            action: 'app.weixin.locationCustomer',
            data: _param
        };
        DS.send(action,function(rep) {});
    },
    showAddCustomer: function(data) {
        var params=data.split(",");
        var weixin=params[0];
        var paneId=params[1];
        handler.callWeixin.loadCustAddByWeixin(weixin,paneId,false);
    },
    customerAdd: function(data) {//for event
        var callId = handler.call.curShowPaneCallId;
//        if($("#"+callId+"_popupWeixin").attr("phone") != data.email) {
//            return;
//        }
        if(!callId)return;
        handler.customer.loadCustInfo(data._id, callId, "popupWeixin",null,data.popupId);
        data.callId = callId;
        dsevent.publish(dsevent.evt.callRefreshCustomer,data);
    },
    callRefreshCustomer: function(data) {//for event
        var name = "未知客户";
        if (data.name != undefined) {
            name = data.name;
        }
        var pane = $(".item" + data.callId);
        pane.find(".customer").html(name);
    },
    replayWeixin:function(data,src){
        if (src.hasClass("disabled")) return false;
        var paneId=handler.call.curShowPaneCallId+"_popupWeixin";
        var pane = $("#"+paneId);
        var frm= pane.find("form").get(0);
        if(!$.trim(data.content)){
            $().alertmessage('showError', "内容不能为空");
            frm.content.focus();
            return false;
        }
        src.addClass("disabled");
        var action = {
            action: "app.weixin.replyMsg",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var row=rep.row;
//                $().alertmessage('showSuccess', "消息已发送");
                var callId = handler.call.curShowPaneCallId+"_popupWeixin";
                pane.find("form").find("textarea[name='content']").val("");
                handler.callWeixin.showMyReply(row,pane.find(".weixin_container"));
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
            src.removeClass("disabled");
        },"POST");
    },
    showMyReply: function(wxObj,pane){
        var time=wxObj.createTime;
        var type=wxObj.contentType;
        wxObj.timeDesc=time?time.substring(0,16):"";
        wxObj.contentDesc=wxObj.content;
        wxObj.uidDesc="我";
        var tmpl=pane.find("#tmpl_weixin_msg_to").html();
        if(type=='text'){
        }else if(type=='image'){
            wxObj.contentDesc=handler.callWeixin._getImgView(wxObj);
            tmpl=pane.find("#tmpl_weixin_msg_to_img").html();
        }

        tmpl=DS.renderMethodViewNew(tmpl,wxObj);
        var container=pane.find(".chat_msg");
        container.append(tmpl);
        handler.callWeixin._locationMsg(container);

        //clear badge
        var call_left = handler.call.pane;
        call_left.find(".item"+wxObj.userID).find(".badge").text("");
    },
    sendImg:function(data,src){
        if (src.hasClass("disabled")) return false;
        var container=src.closest(".weixin_container");
        data.contentType="image";
        data.content="";
        var path=src.attr("ds_attr");
        data.filePath=path;

        var tr=src.closest("tr");
        var table=src.closest("table");
        src.addClass("disabled");
        var action = {
            action: "app.weixin.replyMsg",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var row=rep.row;
//                var callId = handler.call.curShowPaneCallId+"_popupWeixin";
                handler.callWeixin.showMyReply(row,container);
                tr.remove();
                if(table.find("tbody>tr").length==0){
                    table.hide();
                }
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
            src.removeClass("disabled");
        },"POST");
    },
    gotoWeixinMenu: function(data,src) {
        var pane=$("#main-panel");
        var callMenu=pane.find(".navbar_top a[id='nav_workbench']");
        callMenu.click();

//        $("#menu").find("[menuid='my_call']:first").click();
//        handler.selectPage('my_call', 'incoming_weixin', 'callWeixin/incomingWeixin');
//        handler.selectPage('call', 'incoming_call', 'call/incomingCall');
//        closeMsgTip(src.get(0));
    },
    _locationMsg:function(container){
        window.setTimeout(function(){
            var lastMsg=container.find(".chat_popover:last");
            if(lastMsg.length>0){
                var scrollTop=lastMsg.offset().top-container.offset().top+container.scrollTop()+lastMsg.innerHeight();
                container.scrollTop(scrollTop);
            }
        },500);
    },

    _initQiniuImg:function(wxId,pane){
//        var fileId=uuid.v1();
//        var paneId=wxId+"_popupWeixin";
//        var pane =$("#"+paneId);
        var containerId= wxId+'-container-qiniu';
        var progressId= wxId+'-fsUploadProgress';
        var uploader = Qiniu.uploader({
            runtimes: 'flash,html4',
            browse_button: wxId+'-pickfiles',
            multi_selection:false,
            container:containerId,
            drop_element: containerId,
            max_file_size: '10mb',
            flash_swf_url: '/javascripts/qiniu/plupload/Moxie.swf',
            dragdrop: true,
            chunk_size: '4mb',
            uptoken_url: '/action?action=app.weixin.getUptoken&data={}&sessionId=' + session.id,
            domain: qiniu7moorDomain,
            // downtoken_url: '/downtoken',
            unique_names: false,
            save_key: false,
            // x_vars: {
            //     'id': '1234',
            //     'time': function(up, file) {
            //         var time = (new Date()).getTime();
            //         // do something with 'time'
            //         return time;
            //     },
            // },
            auto_start: true,
            filters: {
                mime_types : [
                    { title : "Image files", extensions : "jpg,jpeg,gif,png,bmp" }
                ]
            },
            init: {
                'FilesAdded': function(up, files) {
                    pane.find(".wx_img_container").show();
//                    $('table').show();
//                    $('#success').hide();
                    plupload.each(files, function(file) {
                        var progress = new FileProgress(file, progressId);
                        progress.setStatus("等待...");
                    });
                },
                'BeforeUpload': function(up, file) {
                    var progress = new FileProgress(file, progressId);
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    if (up.runtime === 'html5' && chunk_size) {
                        progress.setChunkProgess(chunk_size);
                    }
                },
                'UploadProgress': function(up, file) {
                    var progress = new FileProgress(file, progressId);
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    progress.setProgress(file.percent + "%", up.total.bytesPerSec, chunk_size);
                },
                'UploadComplete': function() {
//                    $('#success').show();
                    $().alertmessage('showSuccess', "图片上传成功");
                },
                'FileUploaded': function(up, file, info) {
                    var progress = new FileProgress(file, progressId);
                    progress.setComplete(up, info);
//                    console.info("FileUploaded=========");
//                    console.dir(file)
//                    console.dir(info)
//                    var domain = up.getOption('domain');
//                    var res = parseJSON(info);
//                    var sourceLink = domain + info.key; //获取上传成功后的文件的Url
                },
                'Error': function(up, err, errTip) {
//                    $('table').show();
                    pane.find(".wx_img_container").show();
                    var progress = new FileProgress(err.file, progressId);
                    progress.setError();
                    progress.setStatus(errTip);
                },
                'Key': function(up, file) {
                    var date=getCurrentDate();
                    var today = new Date();
                    var time=today.getTime();
                    var fileName=file.name;
//                    var fileName=encodeURIComponent(file.name);
                    var key = session.user.account+"/weixin/"+date+"/"+time+"/"+uuid.v1();
                    console.info("Key2========="+key);
                    return key;
                }
            }
        });
        $('#'+containerId).on(
            'dragenter',
            function(e) {
                e.preventDefault();
                $('#'+containerId).addClass('draging');
                e.stopPropagation();
            }
        ).on('drop', function(e) {
                e.preventDefault();
                $('#'+containerId).removeClass('draging');
                e.stopPropagation();
            }).on('dragleave', function(e) {
                e.preventDefault();
                $('#'+containerId).removeClass('draging');
                e.stopPropagation();
            }).on('dragover', function(e) {
                e.preventDefault();
                $('#'+containerId).addClass('draging');
                e.stopPropagation();
            });
//        uploader.bind('FileUploaded', function() {
//            console.log('hello man,a file is uploaded');
//        });
//        console.info("_initQiniuImg======111111");
//        console.dir(uploader);
    },
    delImg:function(key,src){
        if(!confirm("确认删除此图片吗？"))return;
        var tr=src.closest("tr");
        var table=src.closest("table");
        var action = {
            action: "app.weixin.delFile",
            data: {key:key}
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var result=rep.data;
                if(!result){
                    tr.remove();
                    if(table.find("tbody>tr").length==0){
                        table.hide();
                    }
                }
//                $().alertmessage('showSuccess', "图片已删除");
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    showBigImg:function(url,src){
//        var attachName=src.attr("attachName");
        var html='<div class="text-center"><img src="'+url+'"  class="img-rounded"/></div>';
        var pane =$('#showBigImgModal');
        pane.find(".modal-title").text("查看大图");
        pane.find(".modal-body").html(html);
        pane.css({'z-index':1060});
        pane.modal();
    },
    showMsg: function(wxObj,pane){
        var time=wxObj.createTime;
        var msgType=wxObj.msgType;
        wxObj.timeDesc=time?time.substring(0,16):"";
        wxObj.contentDesc=wxObj.content;
        wxObj.uidDesc="";
        var uid=wxObj.user;
        var type=wxObj.type;//in,out
        var tmpl="";
        if(type=='out'){
            var user={displayName:"我"};
            if(uid!=session.id){
                user=getCache("agents",uid)||{displayName:'NA'};
            }
            wxObj.uidDesc=user.displayName;
            if(msgType=='text'){
                tmpl=pane.find("#tmpl_weixin_msg_to").html();
            }else if(msgType=='image'){
                tmpl=pane.find("#tmpl_weixin_msg_to_img").html();
                wxObj.contentDesc=handler.callWeixin._getImgView(wxObj);
            }
        }else{
            if(msgType=='text'){
                tmpl=pane.find("#tmpl_weixin_msg_from").html();
            }else if(msgType=='image'){
                tmpl=pane.find("#tmpl_weixin_msg_from_img").html();
                wxObj.contentDesc=handler.callWeixin._getImgView(wxObj);
            }
        }

        tmpl=DS.renderMethodViewNew(tmpl,wxObj);

        return tmpl;
    },


    test:function(){
        var evtJson={
            Event:"NewWeixin",
            Command:"Event",
            Data:{
                MessageId:"e82bec80-ea30-1234-8181-2d38ce09c149",
                Account:'N00000000170',
                OpenID:"7moorwx",
                UserID:'wangdx',
                MsgType:"text",
                Content:'通话听不清楚，什么原因？',
                Pbx:'1.1.1.101',
                CreateTime:'2015-04-27 17:48:20',
                NickName:"啊哈哈"
            }
        }
        handler.callWeixin.dispatch(evtJson);
    },

    /*****************weixin manage start*****************/
    showUserHistory: function(uid,src) {
        var pane=$('#batch_modal');
        var flag="";
        if(src){
            src.attr("ds_attr");
        }
        var idx=uid.lastIndexOf("_");
        var userId=uid.substring(0,idx);
//        var userId=uid.split("_")[0];
        DS.getView("callWeixin/weixin_history", function (view) {
            pane.find('.modal-title').text('聊天记录');
            var _data={
                qiniuId:'user-his',
                userID:userId,
                openID:''
            }
            if(flag=='cust'){
                var channel=handler.callMail.loadDefaultChannel("weixinChannel");
                if(!channel){
                    $().alertmessage('showError', "您还没有配置微信通道");
                    return;
                }else{
                    _data.openID=channel.openID;
                }
            }
            view = DS.renderViewNew(view, _data);
            pane.find(".modal-body").html(view);
            handler.callWeixin._initQiniuImg(_data.qiniuId,pane);

            if(flag=='myUndeal'){
                pane.find(".my_dealMsg").show();
            }else{
                pane.find(".my_dealMsg").remove();
            }
            var container=pane.find(".chat_msg");
            pane.find("textarea[name='content']").keydown(function(event){
                if(event.keyCode == 13){
                    event.preventDefault();
                    pane.find(".reply_weixin").click();
                }
            });
            var param={
                page:1,
                userID:userId,
                limit:handler.callWeixin.limit
            }
            var action = {
                action: "app.weixin.queryUserHistory",
                data: param
            };
            DS.send(action, function (rep) {
               if(rep.success){
                   var list=rep.list;
                   var html=[];
                   if(list.length>0){
                       var idx=list.length-1;
                       for (var i = idx; i >=0; i--) {
                           var obj = list[i];
                           if(i==idx && flag!='cust'){
                               pane.find(".modal-body").find('input[name="openID"]').val(obj.openID);
                           }
                           html.push(handler.callWeixin.showMsg(obj,pane));
                       }
                       container.prepend(html.join(""));
                   }

                   handler.callWeixin._locationMsg(container);
               }else{
                   $().alertmessage('showError', rep.message||errMsg);
               }
            },null,null,true);
            handler.callWeixin._initUserHistory(pane,userId);
            pane.width(700);
            pane.css({'z-index':1060});
            pane.modal();
        });
    },
    _initUserHistory:function(pane,userId){
        var container=pane.find(".chat_msg");
        container.scroll(function(){
            var load = "<div class='wxloading'><img src='./img/client/loading.gif'>加载中</div>";
            var end = "<div class='wxend'>已到达顶部<div>";
            var scrollTop=container.scrollTop();
            var page=container.attr("ds_attr");
            var time=container.attr("ds_time");
            page=parseInt(page,10);
            if(page==0){
                return;
            }
            if(scrollTop==0){
                $(load).prependTo(container).css("display","block");
                var param={
                    page:page,
                    userID:userId,
                    createTime:time
                }
                var action = {
                    action: "app.weixin.queryUserHistory",
                    data: param
                };
                DS.send(action, function (rep) {
                    if (rep.success) {
                        page++;
                        var lastTime=time;
                        container.attr("ds_attr",page);
                        container.find(".wxloading").remove();
                        var list=rep.list;
                        var html=[];
                        if(list.length>0){
                            var idx=list.length-1;
                            for (var i = idx; i >=0; i--) {
                                var obj = list[i];
                                if(i==idx){
                                    lastTime=obj.createTime;
                                }
                                html.push(handler.callWeixin.showMsg(obj,pane));
                            }
                            container.prepend(html.join(""));
                            container.scrollTop(150);
                        }else{
                            $(end).prependTo(container);
                            container.attr("ds_attr",0);
                        }
                    } else {
                        $().alertmessage('showError', rep.message||errMsg);
                    }
                },null,null,true);

            }
        });
    },
    replayWeixin2:function(data,src){
        if (src.hasClass("disabled")) return false;
        var flag= src.attr("ds_attr");
        var pane=$('#batch_modal');
        if(flag=="channel"){
            var paneId=data.userID+"_relocationWeixin";
            pane=$('#'+paneId);
        }
        var frm= pane.find("form").get(0);
        if(!$.trim(data.content)){
            $().alertmessage('showError', "内容不能为空");
            frm.content.focus();
            return false;
        }
        src.addClass("disabled");
        var action = {
            action: "app.weixin.replyMsg",
            data: data
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var row=rep.row;
                pane.find("form").find("textarea[name='content']").val("");
                handler.callWeixin.showReply2(row,pane);
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
            src.removeClass("disabled");
        },"POST");
    },
    showReply2: function(wxObj,pane){
        var time=wxObj.createTime;
        var type=wxObj.contentType;
        wxObj.timeDesc=time?time.substring(0,16):"";
        wxObj.contentDesc=wxObj.content;
        wxObj.uidDesc="我";
        var tmpl=pane.find("#tmpl_weixin_msg_to").html();
        if(type=='text'){
        }else if(type=='image'){
            wxObj.contentDesc=handler.callWeixin._getImgView(wxObj);
            tmpl=pane.find("#tmpl_weixin_msg_to_img").html();
        }

        tmpl=DS.renderMethodViewNew(tmpl,wxObj);
        var container=pane.find(".weixin_container .chat_msg");
        container.append(tmpl);
        handler.callWeixin._locationMsg(container);
    },

    showWeixinAssign:function(data,src){
        var leftPane=$('#contact_list_channel');
        var checkPane=leftPane.find(".list_check_all");
        var isAll=checkPane.hasClass("select_on")?"1":"0";
        var query = handler._getSearchCondition(leftPane,isAll);

        var toolbarPane=$("#pane_deal_list");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        num=parseInt(num,10)||0;
        if(num<=0){
            $().alertmessage('showError', "请至少选择一条进行操作！");
            return;
//        }else if(num>20000){
//            $().alertmessage('showError', "分配用户的总数不能超过【"+20000+"】个");
//            return;
        }
        if(isAll!="1"){
            var ids=query._id["$in"]||[];
            for (var i = 0; i < ids.length; i++) {
                var key = ids[i];
                var item=leftPane.find(".item"+key);
                if(item.length>0){
                    var status=item.attr("ds_attr");
                    if(status!="leak"){
                        $().alertmessage('showError', "必须是未分配状态的用户才可以分配！");
                        return;
                    }
                }
            }
        }else{
            if(query.status!='leak'){
                $().alertmessage('showError', "必须是未分配状态的用户才可以分配！");
                return;
            }
        }

        var p=$('#batch_modal');
//        var container=$("#view_all_undeal_weixin");
        var pane=p;
        DS.getView("callWeixin/weixin_assign", function (view) {
            p.find('.modal-title').text('分配用户');
            p.find(".modal-body").html(view);
            var users=copyEnableUser(true);
//            var users=filterUserByScope();
//            users=handler.customer._bubbleSort(users);
//            console.dir(users)
            var html=[];
            for(var i=0;i<users.length;i++){
                var u=users[i];
                var tmpl=pane.find("#tmpl_weixin_assgin").tmpl(u).get(0).outerHTML;
                if((i+1)%3==1){
                    html.push('<div class="row-fluid">'+tmpl);
                }else if((i+1)%3==0){
                    html.push(tmpl+'</div>');
                }else{
                    html.push(tmpl);
                }
            }
            if(users.length%3==1){
                html.push('<div class="span8"></div></div>');
            }else if(users.length%3==2){
                html.push('<div class="span4"></div></div>');
            }
            $(".weixin_assgin_container",pane).html(html.join(""));
            $(".user_cust",pane).keyup(function (event) {
                var e = event.keyCode;
                if ((e >= 48 && e <= 57) ||(e >= 96 && e <= 105) || e == 8) {
                    var len = $(".user_cust",pane).length;
                    var sum = 0;
                    for(var xx=0;xx<len;xx++){
                        var inputval = $(".user_cust",pane).get(xx).value;
                        if(inputval){
                            sum+= parseInt($(".user_cust",pane).get(xx).value);
                        }
                    }
                    $(".cust_more_count",pane).text(parseInt($(".cust_count",pane).text())-sum);
                }
            });
//            var count =  container.find(".pagination .result_count").text();
            $(".cust_count",pane).text(num);
            $(".cust_more_count",pane).text(num);
            p.width(700);
            p.modal();
        })
    },

    saveWeixinAssign:function(data,src){
        var pane=$('#batch_modal');
//        var container=$("#view_all_undeal_weixin");
//        var query = handler.customer._getSearchCondition(container);

        var leftPane=$('#contact_list_channel');
        var checkPane=leftPane.find(".list_check_all");
        var isAll=checkPane.hasClass("select_on")?"1":"0";
        var query = handler._getSearchCondition(leftPane,isAll);

        var owners=data.owner;
        var assigns=data.assign;
        var total = parseInt(pane.find(".cust_count").text());
        var filter=[];
        var assginNum=0;
        for(var i=0;i<assigns.length;i++) {
            var t=assigns[i];
            if(t && parseInt(t)>0){
                assginNum+=parseInt(t,10);
                filter.push({owner:owners[i],count:parseInt(t,10)});
            }
        }
        if(assginNum>total){
            $().alertmessage('showError', "分配用户的总数不能超过【"+total+"】个");
            return;
        }
        var action={
            action:'app.weixin.saveWeixinAssign2In',
            data : {query:query,owners:filter,total:total}
        };
        DS.send(action,function(rep){
            if(rep.success){
                dsevent.publish(dsevent.evt.channelRefresh);
                $().alertmessage('showSuccess', "分配完成");
//                handler.callWeixin.queryUndealList(query);
                pane.find(".modal-body").empty();
                pane.modal("hide");
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "您分配的数据总数发生变化，请重新确认后再操作");
                }else{
                    $().alertmessage('showError', errMsg);
                }
            }
        },"POST");
    },
    dealMessage: function(uid,src) {
        var left=$("#contact_list_channel");
        var action = {
            action: 'app.weixin.dealMsg',
            data: {_id:uid}
        };
        DS.send(action,function(rep){
            if(rep.success) {
                $().alertmessage('showSuccess', "操作成功");
                src.remove();
                var item = left.find(".item" +uid);
                item.attr("ds_attr","deal");
                var desc=handler.callMail.showFieldDesc("status","deal");
                item.find(".label_status").text(desc);
                item.find(".badge").text("");
                item.find(".label_status").removeClass("label-warning").addClass("label-success");
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    showFieldDesc:function(type,val,val2){
        var desc='';
        if(type=='status'){
            var _desc=getDicCacheName("mailStatus",val);
            var badge='&nbsp;<span class="badge badge-important">'+val2+'</span>';
            if(val=='undeal'||val=='leak'||val=='assign'){
                desc=_desc+badge;
            }else if(val=='deal'){
                desc=_desc;
            }
        }
        return desc;
    }
    /*****************weixin manage end*****************/


}
