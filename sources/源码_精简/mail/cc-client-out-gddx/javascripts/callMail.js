handler.callMail = {
    limit: 10,
    richEditor:null,
    dispatch: function(evtJson) {
        var mailObj = evtJson.Data;
        if(session.currentPage.pageId != 'nav_workbench') {
            var html='<a href="#" class="ds_do_action" ds_action="callMail.gotoEmailMenu">' +
                '您有新邮件,点击进行查看</a>';
            var param={
                cls:'email',
                content:html
            }
            window.setTimeout(function(){
                popupMsgTip(param);
            },500)
        }
        handler.callMail.emailItemAdd(mailObj);
    },
    emailItemAdd:function(data) {
//        var callId=uuid.v1();
        var callId=data.MailId;
        data._id=callId;
        var self = this;
        handler.call._checkLimit(callId);
        var from= $.trim(data.From)||'';
        data.fromDesc=handler.callMail._getComboxMailPopup(from);
        if(data.CreateTime){
            var _t=handler.formatShortTime(data.CreateTime);
            data.shortTime=_t.name;
        }else{
            data.shortTime="";
        }
//        console.info("emailItemAdd=======")
//        console.dir(data)
        DS.getView('callMail/email_item', function (view) {
            view = DS.renderMethodViewNew(view, data);
            handler.call.pane.prepend(view);
            DS.getView('callMail/email_detail', function (detail) {
                detail = DS.renderViewNew(detail, data);
                handler.call.paneDetail.append(detail);
                self.showPopupCust(callId,data);
//                if(handler.call.curShowPaneCallId == "")
//                    self.pane.find(".item"+callId).find(".contact_item").click();
            });
        });
    },
    emailItemRemove:function(evtJson) {
        var mailObj = evtJson;
        var mailId=mailObj.MailId;
        var self = this;
        var current = 0;
        for(var i = 0; i < handler.call.calls.length; i++) {
            if(handler.call.calls[i] == mailId) {
                current = i;
                break;
            }
        }
        var element = handler.call.calls.splice(current, 1);
        handler.call.pane.find(".item"+mailId).remove();
        handler.call.paneDetail.find(mailId+"_popupMail").remove();
    },
    showEmailDetail: function(mid) {
        var pane = handler.call.pane;
        var call_left = pane.find(".item"+mid);
        var call_right=$("#"+mid+"_popupMail");
        if(call_left.hasClass("contact_item_new")){
            var action = {
                action: 'app.email.dealInbox',
                data: {_id:mid}
            };
            DS.send(action,function(rep){
                if(rep.success) {
                    call_left.removeClass("contact_item_new");
                    handler.call.paneDetail.find(".call_detail").hide();
                    var call_right=$("#"+mid+"_popupMail");
                    call_right.show();
                    handler.call.curShowPaneCallId = mid;
                    handler.call.currentFlag = "popupMail";
                }else{
                    $().alertmessage('showError', errMsg);
                }
            });
/*            syncMailDeal(function(rep){
                if(rep.Message=='200'){
                }else{
                    if(rep.Message=='400'){
                        $().alertmessage('showError', "邮件已分给他人");
                    }else if(rep.Message=='404'){
                        $().alertmessage('showError', "邮件已不能处理");
                    }else{
                        $().alertmessage('showError', errMsg);
                    }
                }
            });*/
        }else{
            handler.call.paneDetail.find(".call_detail").hide();
            call_right.show();
            handler.call.curShowPaneCallId = mid;
            handler.call.currentFlag = "popupMail";
        }
        $("#contact_detail_incoming_call").scrollTop(0);
    },
    _getTrueMail:function(mail){
        var from= $.trim(mail)||'';
        if(from.indexOf("<")!=-1){
            from=from.substring(from.indexOf("<")+1,from.indexOf(">"));
        }
        return from;
    },
    _getComboxMailPopup:function(mail){
        var from= $.trim(mail)||'';
        var fromName="";
        if(from.indexOf("<")!=-1){
            fromName=from.substring(0,from.indexOf("<"));
            from=from.substring(from.indexOf("<")+1,from.indexOf(">"));
        }
        if(from!=fromName){
            from=fromName+"&lt;"+from+"&gt;";
        }
        return from;
    },
    _getComboxMail:function(mail,name){
        var from= $.trim(mail)||'';
        var fromName= $.trim(name)||'';
        if(from!=fromName){
            from=fromName+"&lt;"+from+"&gt;";
        }
        return from;
    },
    showPopupCust: function(callId,emailObj){
        var email=handler.callMail._getTrueMail(emailObj.From);
        var paneId=callId+"_popupMail";
        var action = {
            action: 'app.popup.popupEmail',
            data: {email:email,_id:callId}
        };
        DS.send(action,function(rep){
            if(rep.success) {
                var inbox=rep.inbox;
                var contacts = rep.list;
                var count = rep.count;
                var custData = {};
//                inbox.from=email;
                handler.callMail.loadInboxInfo(inbox,paneId);
                $("#"+paneId).attr("phone",email);
                if(!contacts || contacts.length == 0) {
                    handler.callMail.loadCustAddByMailFirst(email,paneId);
                } else if(contacts.length == 1) {
                    handler.customer.loadCustInfo(contacts[0]._id,callId,"popupMail",null,null);
                    custData = contacts[0];
                } else {
                    handler.callMail.loadCustMoreByMail(email,contacts, paneId, true,null,count);
                }
                custData.callId=callId;
                dsevent.publish(dsevent.evt.callRefreshCustomer,custData);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    loadInboxInfo: function(inbox,paneId){
        var to=inbox.to||[];
        var cc=inbox.cc||[];
        inbox.fromDesc= handler.callMail._getComboxMail(inbox.from,inbox.fromName);
        inbox.toDesc=to.join(",");
        inbox.ccDesc=cc.join(",");
        inbox.escapeContent=handler.callMail.escapeHtml(inbox.content);
        var attachs=inbox.attachment||[];
        inbox.attachDesc="";
        var html=[];
        var tmpl='<div class="attach_info"><img src="./img/7mfj.gif"><a href="javascript:handler.callMail.downloadAttach(\'_#url#_\')">_#fileName#_</a></div>';
        if(attachs.length>0){
            for (var i = 0; i < attachs.length; i++) {
                var obj = attachs[i];
                var _url=obj.key+'?download/'+obj.fileName;
                obj.url=encodeURIComponent(_url);
                html.push(DS.renderViewNew(tmpl,obj));
            }
            inbox.attachDesc=html.join("");
        }
//        console.dir(inbox)
        var pane=$("#"+paneId).find(".email_container");
//        inbox.contentHtml=frame.prop('outerHTML');
        DS.getView('callMail/inbox',function(view){
            view=DS.renderMethodViewNew(view,inbox);
            pane.hide();
            pane.html(view);
            var frameId="inbox_"+inbox._id;
            var frame=$("#"+frameId);
            handler.callMail.loadIframeInfo(frame.get(0),inbox.content);
            frame.on("load",function(){
                //console.info("popup onload========================");
                //handler.channelHistory.autoHeight(frame.get(0));
                var doc = frame.get(0).contentDocument || frame.get(0).contentWindow.document;
                var _content=doc.body||doc.documentElement;
                //console.info("scrollHeight=="+_content.scrollHeight+",offsetHeight===="+_content.offsetHeight+",height======"+$(_content).height());
                frame.get(0).height = $(_content).height()||200;
            })
            window.setTimeout(function(){
                //console.info("popup onload========================1111");
                frame.load();//手动调用一次，解决不自动触发onload的情况
            },600)
//            console.info(frame.contents().find("head"))
            frame.contents().find("head").append('<style type="text/css">body{font-family: Arial, Helvetica, sans-serif,Microsoft YaHei;font-size: 12px;}</style>');
            pane.show();
        });
    },
    loadCustAddByMailFirst: function(email,paneId,isDel){
        var pane=$("#"+paneId).find(".customer_container");
        var tip=pane.find(".cust_tip");

        var callId=paneId.split("_")[0];
        var param={
            id:email,
            desc:"邮箱",
            paneId:paneId
        }
        if(isDel){
            tip.html(template("tmpl_popup_one_customer_del",param));
        }else{
            tip.html(template("tmpl_popup_one_customer",param));
        }
        tip.show();
        handler.callMail.loadCustAddByMail(email,paneId,null,true);
    },
    loadCustAddByMail: function(email,paneId,showCancel,isHidden){
        var pane=$("#"+paneId).find(".customer_container .cust_body");
        if(pane.length<=0){
            pane =$("#"+paneId).find(".customer_container");
        }

        var callId=paneId.split("_")[0];
        var dealSrc=paneId.split("_")[1];
        DS.getView('customer/customer_add',function(view){
            view=view.replace(/_#menu#_/g,paneId).replace(/_#callNo#_/g,email).replace(/_#dealSrc#_/g,dealSrc);
            pane.html(view);
            pane.find(".select_old_cust").show();
            var o=pane.find("#icc_add_customer_dbType");
            var tmpls=getCache('custTmpls');
            if(tmpls && tmpls.length>0){
                var dbType=tmpls[0]._id;
                o.val(dbType);
                handler.customer.loadCustAddTmpl(dbType,pane);
                pane.find('input[name="email[]"]').val(email);
                if(!showCancel){
                    pane.find(".btn_cancel_edit").remove();
                }
            }
            if(isHidden){
                pane.hide();
            }
        });
    },
    loadCustMoreByMail: function(email, contacts, paneId, showLocation, popupId,/*total record*/total) {
        var pane=$("#"+paneId).find(".customer_container");
        var callId=paneId.split("_")[0];
        DS.getView('call/call_pop_list',function(view){
            pane.empty();
            view = view.replace(/__id/g, paneId).replace(/__phone/g,email).replace(/__popupId/g,popupId).replace(/__province/g,"").replace(/__city/g,"");
            pane.html(view);
            pane.find(".pop_cust_create").attr("ds_action","callMail.showAddCustomer");
            var tds = "";
            if(contacts && contacts.length > 0) {
                var param={
                    paneId:paneId,
                    phone:email,
                    popupId:popupId
                }
//                ds_data='__id,__name,"+email+","+popupId+"'
                var dsAction="callMail.popLocateSelected";
                tds=handler.call.popupCustMoreData(contacts,param,dsAction);
            }
            if(showLocation){
                pane.find(".location_phone").html("通过邮箱<span class='phone'>"+email+"</span> 为您定位到以下客户，请选择:");
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
        var mail = params[2];
        var paneId = params[3];
        var popupId = params[4];
//        console.info("paneId======"+paneId);
        var arys=paneId.split("_");
        var callId=arys[0],flag=arys[1];

//        var callId = handler.call.curShowPaneCallId;

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
            action: 'app.email.locationCustomer',
            data: _param
        };
        DS.send(action,function(rep) {});
    },
    showAddCustomer: function(data) {
        var params=data.split(",");
        var email=params[0];
        var paneId=params[1];
        handler.callMail.loadCustAddByMail(email,paneId,false);
    },
    showReplyView:function(data,src){
        var content=src.attr("ds_attr");
        var ary=data.split("|");
        var subject="Re: "+ary[6];
        var rid=ary[0];
        var unescapeContent=handler.callMail.unescapeHtml(content);
        var reply={
            rid:ary[0],
            from:ary[1],
            to:ary[2],
            cc:ary[3],
            createTime:ary[4],
            mailId:ary[5],
            fromDesc:ary[7],
            subject:subject,
            content:unescapeContent
        }
        var p=$('#batch_modal');
        DS.getView("callMail/email_reply", function (view) {
            view=DS.renderMethodViewNew(view,reply);
            p.find('.modal-title').text('回复邮件--'+subject);
            p.find(".modal-body").html(view);
            handler.callMail._initMail(p.find(".modal-body"),reply);
            handler.callMail._initQiniuUpload(rid);
            p.width(700);
            p.modal();
//            p.find(".modal-body").scrollTop(0);
        });
    },
    _initMail:function(pane,mailObj){
        handler.callMail.richEditor = KindEditor.create('#editor_container_2mail', {
            width : '100%',
            height: '210px',
            wellFormatMode:false,
            basePath:"./javascripts/km/kindeditor/",
            resizeType : 1,
            formatUploadUrl:false,
            allowPreviewEmoticons : false,
            allowImageUpload : true,
            uploadJson : './richUpload?action=uploadRichImage&sessionId='+session.id,
            afterUpload:function(url){
            },
            items : [
                'fontname', 'fontsize', '|', 'forecolor', 'hilitecolor', 'bold', 'italic', 'underline',
                '|', 'justifyleft', 'justifycenter', 'justifyright', '|','link', 'unlink','table', 'image', '|', 'undo', 'redo','|', 'source','preview', 'fullscreen']
        });
        handler.callMail._initSignList(pane,mailObj);
    },
    _initSignList:function(pane,mailObj){
        var html=['<li><a href="#" class="ds_do_action __cls" ds_action="callMail.selectSign" ds_data="" >无</a></li>'];
        var ary=getCache("emailSigns")||[];
        var li = '<li><a href="#" class="ds_do_action __cls" ds_action="callMail.selectSign" ds_data="__value"  >__name</a></li>';
        var dftSign={name:'无',content:''};
        for (var i=0;i<ary.length;i++) {
            var obj=ary[i];
            obj.cls="";
            if(obj.isDefault){
                obj.cls="mail_sign_active";
                dftSign=obj;
            }
            html.push(li.replace(/__value/g,obj._id).replace(/__name/g,obj.name).replace(/__cls/g,obj.cls));
        }
        html.push('<li class="divider"></li><li><a href="#" class="ds_do_action" ds_action="callMail.setSign" >设置签名</a></li>');
        var content= html.join("");
        pane.find(".sign_list").html(content);
        pane.find(".current_sign").text(dftSign.name);

        var isNew=mailObj.isNew;
        if(handler.callMail.richEditor){
            var _css='<style type="text/css">blockquote{padding: 0 0 0 15px; margin: 0 0 20px;border-left: 5px solid #eee;}</style>';
            var _dftView="<br/><br/>"+dftSign.content+"<br>";
            if(isNew=='1'){
            }else{
                var affix="<div style='color:#999;'>在 "+mailObj.createTime+"，"+mailObj.fromDesc+" 写道：</div>";
                var _c=$("<blockquote style='padding: 0 0 0 15px; margin: 0 0 20px;border-left: 5px solid #eee;'></blockquote>");
                _c.html(mailObj.content);
                _dftView+=(affix+_c.prop("outerHTML"));
            }
            handler.callMail.richEditor.html(_dftView);
            pane.find("iframe.ke-edit-iframe").contents().find(".ke-content").append(_css);
            pane.find("iframe.ke-edit-iframe").contents().find(".ke-content").focus();
        }
    },
    selectSign:function(data,src){
        var pane=src.closest(".btn-group");
        var sign=getCache("emailSigns",data);
        if(data){
            if(sign){
                pane.find(".current_sign").text(sign.name);
                if(handler.callMail.richEditor){
                    var _richHtml=handler.callMail.richEditor.html();
                    _richHtml=_richHtml+"<br/><br/>"+sign.content;
                    handler.callMail.richEditor.html(_richHtml);
                }
                pane.find(".sign_list").find("a").each(function(i){
                    var txt=$(this).text();
                    $(this).removeClass("mail_sign_active");
                    if(txt==sign.name){
                        $(this).addClass("mail_sign_active");
                    }
                })
            }
        }else{
            pane.find(".current_sign").text("无");
        }
    },
    setSign:function(data,src){
        var p=$('#batch_modal');
        p.modal("hide");
        var  headerMenu=$(".main_header").find("a[menuid='manager']");
        headerMenu.click();
        var leftMenu=$(".left_menu_detail").find("a#mail_sign");
        leftMenu.click();
    },
    openUploadAttach:function(data,src){
        $("#file_upload").click();
    },
    replayMail:function(data,src){
        if (src.hasClass("disabled")) return false;
        var richHtml=handler.callMail.richEditor.html();
//        console.info(richHtml);
        data.to= $.trim(data.to);
        var p=$('#batch_modal');
        var frm= p.find("form").get(0);
        if(!$.trim(data.to)){
            $().alertmessage('showError', "收件人不能为空");
            frm.to.focus();
            return false;
        }
        if(!$.trim(richHtml)){
            $().alertmessage('showError', "内容不能为空");
//            frm.content.focus();
            return false;
        }
//        console.dir(data);
        var attachKeys=data.attachKey||[];
        var attachNames=data.attachName||[];
        var attachment=[];
        if(attachKeys.length>0){
            for (var i = 0; i < attachKeys.length; i++) {
                var _key = attachKeys[i];
                attachment.push({key:_key,fileName:attachNames[i]});
            }
//            var html=[];
//            for (var i = 0; i < urls.length; i++) {
//                var obj = urls[i];
//                var name=attachNames[i];
//                var _url=obj+'?download/'+name;
//                var tmpl='<div class="callMail_attach_reply" style="text-align:center;vertical-align:top;width:80px;display:inline-block;">' +
//                    '<a href="'+_url+'"><img src="http://7xj0za.com1.z0.glb.clouddn.com/o_19lq5sfsn46j1r6u1hjh1ch59nc9.png" style="width: 66px;"/></a>' +
//                    '<div>'+name+'</div></div>';
//                html.push(tmpl);
//            }
//            var frame=p.find(".ke-edit-iframe").contents();
//            if(frame.length>0){
//                frame.find("head").append('<style type="text/css">.callMail_attach_reply{width: 80px;display: inline-block;text-align: center;}</style>')
//                frame.find("body").prepend('<style type="text/css">.callMail_attach_reply{width: 80px;display: inline-block;text-align: center;}</style>'+html.join(""));
//                richHtml=handler.callMail.richEditor.html();
//            }
        }
        src.addClass("disabled");
        var param={
            rid:data.rid,
            to:data.to,
            cc:data.cc,
            subject:data.subject,
            content:richHtml,
            mailId:data.mailId,
            attachment:attachment
        }

        var action = {
            action: "app.email.replyInbox",
            data: param
        };
        DS.send(action, function (rep) {
            if (rep.success) {
                var row=rep.data;
                $().alertmessage('showSuccess', "邮件已发送");
                if(data.flag=='info'){
                }else{
                    param.createTime=row.createTime;
                    param._id=row._id;
                    handler.callMail.showReplyInfo(param);
                }
                $('#batch_modal').modal("hide");
            } else {
                $().alertmessage('showError', rep.message||errMsg);
            }
            src.removeClass("disabled");
        },"POST");
    },

    customerAdd: function(data) {//for event
        var callId = handler.call.curShowPaneCallId;
//        if($("#"+callId+"_popupMail").attr("phone") != data.email) {
//            return;
//        }
        if(!callId)return;
        handler.customer.loadCustInfo(data._id, callId, "popupMail",null,data.popupId);
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
    escapeHtml:function(str){
        str = String(str).replace(/'/gm,"&#39;");
        return str;
    },
    unescapeHtml:function(str){
        str = String(str).replace(/&#39;/gm, "'");
        return str;
    },
    loadIframeInfo:function(iframe,html) {
//        console.info(html);
        var doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
/*        window.setTimeout(function(){
            handler.channelHistory.autoHeight(iframe);
        },0)*/
    },
    gotoEmailMenu: function(data,src) {
        var pane=$("#main-panel");
        var callMenu=pane.find(".navbar_top a[id='nav_workbench']");
        callMenu.click();
//        $("#menu").find("[menuid='my_call']:first").click();
//        handler.selectPage('my_call', 'incoming_email', 'callMail/incomingEmail');
//        handler.selectPage('call', 'incoming_call', 'call/incomingCall');
//        closeMsgTip(src.get(0));
    },
    showReplyInfo: function(inbox){
        var paneId=handler.call.curShowPaneCallId+"_popupMail";
        var to=inbox.to||"";
        var cc=inbox.cc||"";
        inbox.toDesc=to;
        inbox.ccDesc=cc;
        var attachs=inbox.attachment||[];
        inbox.attachDesc="";
        var html=[];
        var tmpl='<div class="attach_info"><img src="./img/7mfj.gif"><a href="javascript:handler.callMail.downloadAttach(\'_#url#_\')">_#fileName#_</a></div>';
        if(attachs.length>0){
            for (var i = 0; i < attachs.length; i++) {
                var obj = attachs[i];
                var _url=obj.key+'?download/'+obj.fileName;
                obj.url=encodeURIComponent(_url);
                html.push(DS.renderViewNew(tmpl,obj));
            }
            inbox.attachDesc=html.join("");
        }
//        inbox.escapeContent=handler.callMail.escapeHtml(inbox.content);
        var pane=$("#"+paneId).find(".email_container");
        if(pane.length<=0){
            pane=$("#"+inbox.rid+"_relocationMail").find(".mail_reply");
        }
        DS.getView('callMail/reply_info',function(view){
            view=DS.renderMethodViewNew(view,inbox)
            pane.hide();
            pane.append(view);
            var frameId="reply_"+inbox._id;
            var frame=pane.find("#"+frameId);
            frame.on("load",function(){
                handler.callMail.loadIframeInfo(frame.get(0),inbox.content);
            })
            frame.load();
            frame.contents().find("head").append('<style type="text/css">body{font-family: Arial, Helvetica, sans-serif,Microsoft YaHei;font-size: 12px;}</style>');
            pane.show();
        });
    },
    _initQiniuUpload:function(mid){
        var pane=$('#batch_modal');
//        var progress=pane.find("#fsUploadProgress").get(0);
        var containerId= mid+'-container-qiniu';
        var progressId= mid+'-fsUploadProgress';
        var uploader = Qiniu.uploader({
            runtimes: 'html5,flash,html4',
            browse_button: mid+'-pickfiles',
            multi_selection:true,
            container:containerId,
            drop_element: containerId,
            max_file_size: '60mb',
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
//            filters: {
//                mime_types : [
//                    { title : "Image files", extensions : "jpg,jpeg,gif,png,bmp" }
//                ]
//            },
            init: {
                'FilesAdded': function(up, files) {
//                    console.info("FilesAdded=========");
//                    console.dir(pane.find(".mail_attach_container"));
                    pane.find(".mail_attach_container").show();
//                    $('table').show();
//                    $('#success').hide();
                    plupload.each(files, function(file) {
                        var progress = new FileProgress(file, progressId,"mail");
                        progress.setStatus("等待...");
                    });
                },
                'BeforeUpload': function(up, file) {
                    var progress = new FileProgress(file, progressId,"mail");
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    if (up.runtime === 'html5' && chunk_size) {
                        progress.setChunkProgess(chunk_size);
                    }
                },
                'UploadProgress': function(up, file) {
                    var progress = new FileProgress(file, progressId,"mail");
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    progress.setProgress(file.percent + "%", up.total.bytesPerSec, chunk_size);
                },
                'UploadComplete': function() {
//                    $('#success').show();
                    $().alertmessage('showSuccess', "文件上传成功");
                },
                'FileUploaded': function(up, file, info) {
                    var progress = new FileProgress(file, progressId,"mail");
                    progress.setComplete(up, info,"mail");
//                    console.info("FileUploaded=========");
//                    console.dir(file)
//                    console.dir(info)
//                    var domain = up.getOption('domain');
//                    var res = parseJSON(info);
//                    var sourceLink = domain + info.key; //获取上传成功后的文件的Url
                },
                'Error': function(up, err, errTip) {
//                    $('table').show();
                    pane.find(".mail_attach_container").show();
                    var progress = new FileProgress(err.file, progressId);
                    progress.setError();
                    progress.setStatus(errTip);
                },
                'Key': function(up, file) {
//                    console.dir(file)
                    var date=getCurrentDate();
                    var today = new Date();
                    var time=today.getTime();
//                    var fileName=utils.Base64.encode(file.name);
                    var key = session.user.account+"/mail/"+date+"/"+time+"/"+uuid.v1();
//                    console.info("Key2========="+key);
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
    },
    downloadAttach:function(suffix){
        var url=qiniu7moorDomain+suffix;
//        DS.downloadFile(url);
        var id = "downloadFile_Frame";
        if ($("#" + id).length > 0) {
            $("#" + id).remove();
        }
        var frame = $("<iframe id=" + id + " style='display:none;' src='" + url + "' </iframe>");
        $('body').append(frame);
    },


    test:function(){
        var evtJson={
            Event:"NewMail",
            Command:"Event",
            Data:{
                MailId:"e82bec80-ea30-11e4-8181-2d38ce09c149",
                Account:'N00000000170',
                Address:'service@7moor.com',
                Cc:"zhangsan@7moor.com",
                From:'wangdx@7moor.com',
                To:"service@7moor.com",
                Subject:'上海易前客户付费',
                Pbx:'1.1.1.101',
                CreateTime:'2015-04-27 17:48:20'
            }
        }
        handler.callMail.dispatch(evtJson);
    },
    loadDefaultChannel:function(type){
        var channels=getCache(type);
//        console.dir(channels);
        if(channels.length>0){
            for (var i = 0; i < channels.length; i++) {
                var o = channels[i];
                if(o.isDefault=='1'){
                    return o;
                }
            }
            return channels[0];
        }else{
            return null;
        }
    },
    showNewMailReply:function(mailId,src){
        var p=$('#batch_modal');
        var data={
            to:mailId,
            qiniuId:"new-mail-id",
            isNew:"1",
            mailId:""
        }
        var channel=handler.callMail.loadDefaultChannel("mailChannel");
        if(!channel){
            $().alertmessage('showError', "您还没有配置邮箱通道");
            return;
        }else{
            data.mailId=channel.mailId;
        }
        DS.getView("callMail/email_new", function (view) {
            view=DS.renderMethodViewNew(view,data);
            p.find("input[name='flag']").val("info");
            p.find('.modal-title').text('发送邮件');
            p.find(".modal-body").html(view);
            handler.callMail._initMail(p.find(".modal-body"),data);
            handler.callMail._initQiniuUpload(data.qiniuId);
            p.width(700);
            p.css({'z-index':1060});
            p.modal();
        });
    },

    /*****************mail manage start*****************/
    showMailDetail:function(mailId,src){
        var flag=src.attr("ds_attr");
        var action = {
            action: 'app.email.queryMailInfo',
            data: {_id:mailId}
        };
        DS.send(action,function(rep){
            if(rep.success) {
                var inbox=rep.row||[];
                var replys=rep.replys||[];
                var p=$('#batch_modal');
                DS.getView("callMail/mail_info", function (view) {
                    p.find('.modal-title').text('明细');
                    p.find(".modal-body").html(view);
                    var pane= p.find(".mail_inbox");
                    handler.callMail._loadInboxInfo(pane,inbox,function(){
                        if(flag=='myUndeal'){
                            pane.find(".my_dealInbox").show();
                        }else{
                            pane.find(".my_dealInbox").remove();
                        }
                    });
                    for (var i = 0; i < replys.length; i++) {
                        var obj = replys[i];
                        handler.callMail._loadInboxInfo(p.find(".mail_reply"),obj);
                    }
                    p.width(700);
                    p.modal();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    _loadInboxInfo:function(pane,data,callback){
        var to=data.to||[];
        var cc=data.cc||[];
        data.fromDesc= handler.callMail._getComboxMail(data.from,data.fromName);
        data.toDesc=to.join(",");
        data.ccDesc=cc.join(",");
        data.escapeContent=data.content;
        var attachs=data.attachment||[];
        data.attachDesc="";
        var html=[];
        var tmpl='<div class="attach_info"><img src="./img/7mfj.gif"><a href="javascript:handler.callMail.downloadAttach(\'_#url#_\')">_#fileName#_</a></div>';
        if(attachs.length>0){
            for (var i = 0; i < attachs.length; i++) {
                var obj = attachs[i];
                var _url=obj.key+'?download/'+obj.fileName;
                obj.url=encodeURIComponent(_url);
                html.push(DS.renderViewNew(tmpl,obj));
            }
            data.attachDesc=html.join("");
        }
        DS.getView('callMail/mail_info_in',function(view){
            view=DS.renderMethodViewNew(view,data);
            pane.hide();
            pane.append(view);
            var frameId="inboxInfo_"+data._id;
            var frame=$("#"+frameId);
            frame.on("load",function(){
                handler.callMail.loadIframeInfo(frame.get(0),data.content);
            })
            frame.load();
            frame.contents().find("head").append('<style type="text/css">body{font-family: Arial, Helvetica, sans-serif,Microsoft YaHei;font-size: 12px;}</style>');
            if(typeof callback =='function'){
                callback();
            }
            pane.show();
        });
    },
    showMailReply:function(mailId,src){
        var action = {
            action: 'app.email.queryMailById',
            data: {_id:mailId}
        };
        DS.send(action,function(rep){
            if(rep.success) {
                var data=rep.row||[];
                data.cc=data.cc.join(",");
                var subject="Re: "+data.subject;
                data.rid=mailId;
                data.fromDesc= handler.callMail._getComboxMail(data.from,data.fromName);
//                console.dir(data)
                var p=$('#batch_modal');
                DS.getView("callMail/email_reply", function (view) {
                    view=DS.renderMethodViewNew(view,data);
                    p.find("input[name='flag']").val("info");
                    p.find('.modal-title').text('回复邮件--'+subject);
                    p.find(".modal-body").html(view);
                    handler.callMail._initMail(p.find(".modal-body"),data);
                    handler.callMail._initQiniuUpload(mailId);
                    p.width(700);
                    p.modal();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    reset:function(data,src){
        var frm=src.closest("form");
        frm[0].reset();
        var combox=frm.find(".select_input");
        if(combox.length>0){
            combox.val("");
        }
    },
    showFieldDesc:function(type,val){
        var desc='';
        if(type=='status'){
            desc=getDicCacheName("mailStatus",val);
//            if(val=='undeal'){
//                desc='未读';
//            }else if(val=='deal'){
//                desc='已读';
//            }else if(val=='leak'){
//                desc='未分配';
//            }
        }else if(type=='agent'){
            var _agent=getCache("agents", val);
            if(_agent){
                desc=_agent.displayName;
            }
        }
        return desc;
    },

    showMailAssign:function(data,src){
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
        }else if(num>20000){
            $().alertmessage('showError', "分配邮件的总数不能超过【"+20000+"】个");
            return;
        }
        if(isAll!="1"){
            var ids=query._id["$in"]||[];
            for (var i = 0; i < ids.length; i++) {
                var key = ids[i];
                var item=leftPane.find(".item"+key);
                if(item.length>0){
                    var status=item.attr("ds_attr");
                    if(status!="leak"){
                        $().alertmessage('showError', "必须是未分配状态的邮件才可以分配！");
                        return;
                    }
                }
            }
        }else{
            if(query.status!='leak'){
                $().alertmessage('showError', "必须是未分配状态的邮件才可以分配！");
                return;
            }
        }

        var p=$('#batch_modal');
//        var container=$("#view_all_undeal_mail");
        var pane=p;
        DS.getView("callMail/mail_assign", function (view) {
            p.find('.modal-title').text('分配邮件');
            p.find(".modal-body").html(view);
            var users=copyEnableUser(true);
//            var users=filterUserByScope();
//            users=handler.customer._bubbleSort(users);
//            console.dir(users)
            var html=[];
            for(var i=0;i<users.length;i++){
                var u=users[i];
                var tmpl=pane.find("#tmpl_mail_assgin").tmpl(u).get(0).outerHTML;
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
            $(".mail_assgin_container",pane).html(html.join(""));
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

    saveMailAssign:function(data,src){
        var pane=$('#batch_modal');
//        var container=$("#view_all_undeal_mail");
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
            $().alertmessage('showError', "分配邮件的总数不能超过【"+total+"】个");
            return;
        }
        var action={
            action:'app.email.queryMailList2In',
            data : {query:query,owners:filter,total:total}
        };
        DS.send(action,function(rep){
            if(rep.success){
                dsevent.publish(dsevent.evt.channelRefresh);
                $().alertmessage('showSuccess', "分配完成");
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
    dealInbox: function(mid,src) {
        var left=$("#contact_list_channel");
        var action = {
            action: 'app.email.dealInbox',
            data: {_id:mid}
        };
        DS.send(action,function(rep){
            if(rep.success) {
                $().alertmessage('showSuccess', "操作成功");
                src.remove();
                var item = left.find(".item" +mid);
                item.attr("ds_attr","deal");
                var desc=handler.callMail.showFieldDesc("status","deal");
                item.find(".label_status").text(desc);
                item.find(".label_status").removeClass("label-warning").addClass("label-success");
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    /*****************mail manage end*****************/
    fullscreen:function(id,src){
        var pos=src.offset();
//        console.dir(pos);
        var x=pos.left;
        var y=pos.top;
        var content=src.attr("ds_attr");
        var unescapeContent=handler.callMail.unescapeHtml(content);

        var container=$("#frame_mail_inbox_container");
        var frame=container.find("iframe");
        container.find(".cancel_mail").attr("ds_data",x+","+y);
        window.scrollTo(0, 0);
        var h=$(window).height();
        var w=$(window).width();
        container.css({
//            backgroundColor:"#fff",
            width:w,
            height:h,
            position : 'absolute',
            left : 0,
            top : 0,
            'z-index' : 100
        })
        frame.css({
            height:h-35
        })
        $("body").css({
            'height' : '1px',
            'overflow' : 'hidden'
        })
        $("body").parent().css({'overflow' : 'hidden'});

        frame.on("load",function(){
            handler.callMail.loadIframeInfo(frame.get(0),unescapeContent);
        })
        frame.load();
        frame.contents().find("head").append('<style type="text/css">body{font-family: Arial, Helvetica, sans-serif,Microsoft YaHei;font-size: 12px;}</style>');
        container.addClass("full_on");
        container.show();
    },
    cancelFull:function(data,src){
        data=data||"";
        var ary=data.split(",");
        var x=ary[0];
        var y=ary[1];
        var container=$("#frame_mail_inbox_container");
        var frame=container.find("iframe");
        container.css({
            width:"",
            height:"",
            position : '',
            left : "",
            top : "",
            'z-index' : ""
        });
        frame.css({
            height:""
        });
        $("body").parent().css({'overflow' : ''})
        $("body").css({
            'height' : '',
            'overflow' : ''
        })
        window.scrollTo(x,y);
        container.removeClass("full_on");
        container.hide();
    }

}
