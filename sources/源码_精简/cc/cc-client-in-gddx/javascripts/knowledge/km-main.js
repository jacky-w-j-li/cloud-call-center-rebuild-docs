var kmeditor=null;

handler.km={
    qiniuKmDomain:'http://fs-km.7moor.com/',
    currentTab:"inner",
    currentPaneId:"",
    msgBoxHandle:null,
    kmNum:1,
    km_index:function(pane) {
        handler.catalog.main();
    },
    reset:function(){
        handler.kmcontent.kmFlag="";
        handler.kmcontent.kmPage=1;
        handler.kmcontent.kmKeyword="";
        handler.kmcontent.kmCid="";

        handler.catalog.knowledge_tree=null;
        handler.catalog.myTreeDic=[];
        handler.catalog.maxTreeLayer=3;
    },
    km_main:function(menu){
        var pane=$("#view_nav_km");
        pane.find(".km_tab").find("li:first>a").click();
    },
    showTab:function(data,src){
        var pane=$("#view_"+data);
        handler.km.reset();
        handler.km.currentPaneId="#view_"+data;
        var title="用于公司座席内部检索";
        if(data=='km_inner'){
            handler.km.currentTab="inner";
        }else if(data=='km_outer'){
            handler.km.currentTab="outer";
            title="用于在线客服给客户提供检索";
        }
        DS.getView('km/km_body', function (view) {
            pane.html(view);
            pane.find(".km_card_desc").text(title);
            handler.km.km_index(pane);
        });
    },
    showTransDoc:function(data,src){
        handler.km.kmNum = 1;
        var bodyMsg = "<div style='height:20px;overflow:hidden;text-align:center'>" +
            "<img src='./img/client/loading.gif' style='float:left;margin-top:5px;' />" +
            "<div id='kmcontent_msg' style='float:left;color:#666666;padding-left:5px;'>正在转换中..</div>" +
            "<div style='clear:both;height:1px;overflow:hidden'>&nbsp;</div></div>";
        utils.showBox(310, 40, bodyMsg);
        handler.km.msgBoxHandle = setInterval(function(){
            handler.km.checkIsHide('');
        }, 1000);
    },
    checkIsHide:function(data,src){
        var count = handler.km.kmNum ++;
        var html = "转换中,请稍后<span style='font-weight:bold'>(00:" + (count<10?("0"+count):count) +")</span>" + cancelHtml;
        $("#kmcontent_msg").html(html);
    },
    cancelTransDoc:function(data,src){
        if(handler.km.msgBoxHandle)
            clearInterval(handler.km.msgBoxHandle);
        utils.closeBox();
    }
}



handler.kmcontent = {
    kmCid:"",
    kmFlag:"",
    kmPage:1,
    kmKeyword:"",
    separator:"/",
    isManager:function(){
        var container=$(handler.km.currentPaneId);
        var pane=container.find("#knowledge_right_div");
        if(handler.catalog.hasManage){
            pane.find(".km_manage").show();
        }else{
            pane.find(".km_manage").hide();
        }
    },
    uploadSucess:function(evt){
        var rep = $.parseJSON(evt.target.responseText);
        if(rep && !rep.success){
            $().alertmessage('showError', "上传文件失败，请检查网络或文件是否正确");
            return;
        }
        var fileName=rep.filePath.substring(rep.filePath.lastIndexOf(handler.kmcontent.separator)+1);
        var trueName=rep.fileName;
        handler.km.showTransDoc();
        handler.kmcontent.convertHtml(fileName,trueName);
    },
    uploadProgress:function(evt,src) {
        var pane=src.closest("#km_edit_body");
        var id=src.attr("id");
        var progress=pane.find(".progress.attach");
        if(id=='uploadDoc'){
            progress=pane.find(".progress.doc");
        }
        progress.show();
        progress.find(".bar").css("width","0");

        if (evt.lengthComputable) {
            var percentComplete = Math.round(evt.loaded * 100 / evt.total);
            progress.find(".bar").css("width",percentComplete.toString() + '%');
            if(percentComplete==100){
                progress.hide();
            }
        }else{
            progress.html("浏览器不支持计算进度");
        }
    },
    showKmAttach:function(fileName,trueName){
        var container=$(handler.km.currentPaneId);
        var data={fileId:fileName,trueName:trueName};
        var pane=container.find("#knowledge_right_div");
        var ul=pane.find(".thumbnails_km");
        ul.append(pane.find("#tmpl_km_attach").tmpl(data));
    },
    uploadAttachSucess:function(evt,src){
        var rep = $.parseJSON(evt.target.responseText);
        if(rep && !rep.success){
            $().alertmessage('showError', "上传文件失败，请检查网络或文件是否正确");
            return;
        }
        var fileName=rep.filePath.substring(rep.filePath.lastIndexOf(handler.kmcontent.separator)+1);
        var trueName=rep.fileName;
        handler.kmcontent.showKmAttach(fileName,trueName);
    },
    convertHtml:function(fileName,trueName){
        var container=$(handler.km.currentPaneId);
        var action = {
            action:'app.km.uploadDoc',
            data:{fileName:fileName,trueName:trueName}
        };
        DS.send(action,function(rep){
            handler.km.cancelTransDoc();
            if(rep.success){
                var pane=container.find("#knowledge_right_div");
                pane.find("input[name='fileId']").val(rep.fileId);
                if(kmeditor){
                    kmeditor.html(rep.html);
                }
            } else{
                if(rep.code=='km001'||rep.code=='km002'){
                    $().alertmessage('showError', rep.Message);
                }
            }

        });
    },

    download:function(data,src){
        var trueName = src.text();
        //var action = {
        //    action:'app.km.getKmAttachUrl',
        //    data:{fileName:data,trueName:trueName}
        //};
        //DS.send(action,function(rep){
        //    if(rep.success){
        //        downloadFile(rep.downloadUrl,session);
        //    } else{
        //        $().alertmessage('showError', "未找到文件或授权失败！");
        //    }
        //});
        var suffix=src.attr("suffix");
        var durl= handler.km.qiniuKmDomain+data+"?attname="+trueName;
        downloadFile(durl,session);
    },
    listRecently:function(data,src){
        handler.kmcontent.kmFlag="recent";
        var container=$(handler.km.currentPaneId);
        var pane= container.find("#knowledge_right_div");
        DS.getView('./km/km_lately',function(view){
            pane.empty();
            pane.html(view);
            var action = {
                action:'app.km.queryRecentList',
                data:{kmType:handler.km.currentTab}
            };
            DS.send(action,function(rep){
                if(rep.success){
                    var body=pane.find("#km_item_list_pane");
                    body.empty();
                    var list=rep.list;
                    var pane2=pane.find(".km_body");
                    if(!list || list.length<=0){
                        pane2.html('<div style="font-size:16px;margin: 20px;">知识库还没有任何内容哦！</div>');
                    }else{
                        for (var i = 0; i < list.length; i++) {
                            var obj = list[i];
                            pane.find("#tmpl_km_item").tmpl(obj).appendTo(body);
                        }
                    }
                }
            });
        });
    },
    refreshList:function(data,src){
        var flag=handler.kmcontent.kmFlag;
        var page=handler.kmcontent.kmPage;
        var keyword=handler.kmcontent.kmKeyword;
        var cid=handler.kmcontent.kmCid;
        if(flag=='km'){
            handler.catalog.queryKmList(cid,page);
        }else if(flag=='recent'){
            handler.kmcontent.listRecently();
        }else if(flag=='dic'){
            handler.catalog.searchKmList(keyword,page);
        }
    },
    cancelUpdateKm:function(data,src){
        handler.kmcontent.refreshList();
    },
    showAddPage:function(cid,src){
        var container=$(handler.km.currentPaneId);
        var qid=uuid.v1();
        var pane=container.find("#knowledge_right_div");
        DS.getView('./km/km_add',function(view){
            pane.empty();
            view=DS.renderViewNew(view,{qiniuId:qid});
            pane.html(view);
            if(handler.km.currentTab=='outer'){
                pane.find(".km_attach_pane").hide();
            }
            pane.find("input[name='cid']").val(cid);
            var html=handler.catalog.showCatlogPath(cid,pane);
            pane.find(".km_nav").text(html);

            handler.kmcontent._initQiniuKmUpload(qid,pane);
        });
    },
    insertKm: function(data,src) {
        if (src.hasClass("disabled")) return false;
        var body=src.closest("#knowledge_right_div");
        var picVO={};
        var frm=body.find("#kmaddFrm").get(0);
        var title=data.title;
        var richHtml=kmeditor.html();
        if(!$.trim(title)){
            $().alertmessage('showError', "标题不能为空!");
            frm.title.focus();
            return false;
        }
        if(!$.trim(richHtml)){
            $().alertmessage('showError', "内容不能为空!");
            return false;
        }
        src.addClass("disabled");
        picVO.title=title;
        picVO.content=richHtml;
        picVO.cid=frm.cid.value;
        picVO.fileId=frm.fileId.value;
        var fileIds={};
        body.find(".thumbnails_km .attachitem").each(function(i){
            fileIds[$(this).attr("ds_data")]=$(this).text();
        });
        picVO.attachs=fileIds;
        picVO.kmType=handler.km.currentTab;
        var action = {
            action: 'app.km.saveItem',
            data: picVO
        };
        DS.send(action,function(rep){
            if(rep.success){
                body.empty();
                $().alertmessage('showSuccess', "发布成功");
                handler.kmcontent.refreshList();
            }
            src.removeClass("disabled");
        },"POST");
    },
    viewKmInfo:function(itemId,src){
        var container=$(handler.km.currentPaneId);
        var pane=container.find(".knowledge_right_div");
        var action={
            action:'app.km.showItemEdit',
            data:{_id:itemId,flag:"view",kmType:handler.km.currentTab}
        };
        DS.send(action,function(rep){
            if(rep.success){
                var item=rep.row;
                DS.getView('./km/km_info',function(view){
                    var keyWord= container.find(".km-input-text").val();
                    view=render.replaceDataByObject(item,view,keyWord);
                    pane.empty();
                    pane.html(view);
                    var html=handler.catalog.showCatlogPath(item.cid,pane);
                    pane.find(".km_nav").text(html);
                    if(item.attachs){
                        var parent=pane.find("#thumbnails");
                        for(var k in item.attachs){
                            var data={fileId:k,trueName:item.attachs[k]};
                            parent.append(pane.find("#tmpl_km_attach").tmpl(data));
                        }
                    }
                });
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "该知识点不存在或被删除");
                }
            }
        });
    },
    showUpdatePage:function(itemId,src){
        var container=$(handler.km.currentPaneId);
        var pane=container.find("#knowledge_right_div");
        var qid=uuid.v1();
        var action={
            action:'app.km.showItemEdit',
            data:{_id:itemId,kmType:handler.km.currentTab}
        };
        DS.send(action,function(rep){
            if(rep.success){
                var item=rep.row;
                DS.getView('./km/km_add',function(view){
                    pane.empty();
                    view=DS.renderViewNew(view,{qiniuId:qid});
                    pane.html(view);
                    if(handler.km.currentTab=='outer'){
                        pane.find(".km_attach_pane").hide();
                    }
                    var html=handler.catalog.showCatlogPath(item.cid,pane);
                    pane.find(".km_nav").text(html);
                    pane.find(".accept_button").attr("ds_action","kmcontent.updateKm");
                    var html=handler.catalog.showCatalogOptions(item.catalog,true)||[];
                    pane.find("input[name='_id']").val(itemId);
                    pane.find("input[name='title']").val(item.title);
                    pane.find("input[name='fileId']").val(item.fileId);
                    pane.find("select[name='catalogId']").html(html);
                    pane.find("select[name='catalogId']").parent().show();
                    if(kmeditor){
                        kmeditor.html(item.content);
                    }
                    if(item.attachs && handler.km.currentTab=='inner'){
                        var ul=pane.find(".thumbnails_km");
                        for(var k in item.attachs){
                            var data={fileId:k,trueName:item.attachs[k]};
                            ul.append(pane.find("#tmpl_km_attach").tmpl(data));
                        }
                    }
                    handler.kmcontent._initQiniuKmUpload(qid,pane);
                });
            }
        });

    },
    updateKm: function(data,src){
        var body=src.closest("#knowledge_right_div");
        var flag=src.attr("flag");
        var picVO={};
        var frm=body.find("#kmaddFrm").get(0);
        var title=data.title;
        var richHtml=kmeditor.html();
        var richText=kmeditor.text();
        if(!$.trim(title)){
            $().alertmessage('showError', "标题不能为空");
            frm.title.focus();
            return false;
        }
        picVO._id=data._id;
        picVO.title=title;
        picVO.content=richHtml;
        picVO.cid=data.catalogId;
        picVO.fileId=data.fileId;
        var fileIds={};
        body.find(".thumbnails_km .attachitem").each(function(i){
            fileIds[$(this).attr("ds_data")]=$(this).text();
        });
        picVO.attachs=fileIds;
        picVO.kmType=handler.km.currentTab;
        var action = {
            action: 'app.km.updateItem',
            data: picVO
        };
        DS.send(action,function(rep){
            if(rep.success){
                body.empty();
                $().alertmessage('showSuccess', "修改成功");
                handler.kmcontent.refreshList();
            }
        },"POST");
    },
    delAttachFile:function(fileId,src){
        if(!confirm('确认删除吗？'))return;
        var container=$(handler.km.currentPaneId);
        var body=container.find("#knowledge_right_div");
        var thumb=src.closest("li");
        var itemId=body.find("input[name='_id']").val();
        var attachs={};
        body.find(".thumbnails_km .attachitem").each(function(i){
            var id=$(this).attr("ds_data");
            if(id!=fileId){
                attachs[id]=$(this).text();
            }
        });
        var action={
            action:"app.km.delAttach",
            data:{_id:itemId,attachs:attachs,delId:fileId,kmType:handler.km.currentTab}
        } ;
        DS.send(action,function(rep){
            if(rep.success){
                thumb.remove();
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    removeKm: function(itemId,src) {
        if(!confirm('确认删除吗？'))return;
        var container=$(handler.km.currentPaneId);
        var action={
            action:"app.km.delItem",
            data:{_id:itemId,kmType:handler.km.currentTab}
        } ;
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "删除成功");
                handler.kmcontent.refreshList();
            }
        });
    },

    showFieldsDesc:function(type,val){
        var desc="";
        if(type=='agent'){
            var user=getCache('agents',val);
            if(user){
                desc=user.displayName;
            }
        }
        return desc;
    },
    _initQiniuKmUpload:function(cid,pane){
        var containerId= cid+'-km-qiniu';
        var progressId= cid+'-fsUploadProgress';
        var uploader = QiniuKm.uploader({
            runtimes: 'html5,flash,html4',
            browse_button: cid+'-pickKmFiles',
            multi_selection:true,
            container:containerId,
            drop_element: containerId,
            max_file_size: '10mb',
            flash_swf_url: '/javascripts/qiniu/plupload/Moxie.swf',
            dragdrop: true,
            chunk_size: '4mb',
            uptoken_url: '/action?action=app.km.getKmUptoken&data={}&sessionId=' + session.id,
            domain: handler.km.qiniuKmDomain,
            unique_names: false,
            save_key: false,
            auto_start: true,

            init: {
                'FilesAdded': function(up, files) {
                    pane.find(".km_attach_container").show();
                    plupload.each(files, function(file) {
                        var progress = new FileProgress(file, progressId,"km");
                        progress.setStatus("等待...");
                    });

                },
                'BeforeUpload': function(up, file) {
                    var progress = new FileProgress(file, progressId,"km");
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    if (up.runtime === 'html5' && chunk_size) {
                        progress.setChunkProgess(chunk_size);
                    }
                },
                'UploadProgress': function(up, file) {
                    var progress = new FileProgress(file, progressId,"km");
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    progress.setProgress(file.percent + "%", up.total.bytesPerSec, chunk_size);
                },
                'UploadComplete': function(evt,info) {
                    $().alertmessage('showSuccess', "文件上传成功");
                    //$("#km_files").hide(3000);
                    //console.dir(evt);
                    pane.find(".km_attach_container").hide();
                    pane.find(".km_attach_container").find("tbody").empty();
                },
                'FileUploaded': function(up, file, info) {
                    var progress = new FileProgress(file, progressId,"km");
                    var trueName = file.name;
                    up.trueName = trueName;
                    //console.info("FileUploaded=========");
                    //console.dir(up)
                    //console.dir(file)
                    //console.dir(info)
                    progress.setComplete(up, info,"km");

                    var res = $.parseJSON(info);
                    //var url;
                    var fileName = res.key;
                    var trueName = up.trueName;
                    //if (res.url) {
                    //    url = res.url;
                    //} else {
                    //    var domain = up.getOption('domain');
                    //    url = domain + encodeURI(res.key);
                    //};
                    var data={fileId:fileName,trueName:trueName};
                    var ul=pane.find(".thumbnails_km");
                    ul.append($("#tmpl_km_attach").tmpl(data));
                },
                'Error': function(up, err, errTip) {
                    pane.find(".km_attach_container").show();
                    var progress = new FileProgress(err.file, progressId);
                    progress.setError();
                    progress.setStatus(errTip);
                },
                'Key': function(up, file) {
                    var date=getCurrentDate();
                    var today = new Date();
                    var time=today.getTime();
                    var key = session.user.account+"/km/"+date+"/"+time+"/"+uuid.v1();
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
    }

};