handler.catalog={
    hasManage:false,
    maxTreeLayer:3,
    knowledge_tree:null,
    myTreeDic:[],
    main:function(){
        if(isHasFunc("func_km_config")){
            handler.catalog.hasManage=true;
        }
        if(session.account.knowledgeLayer && !isNaN(session.account.knowledgeLayer)){
            handler.catalog.maxTreeLayer=parseInt(session.account.knowledgeLayer);
        }
        if(handler.km.currentTab=='outer'){
            handler.catalog.maxTreeLayer=1;
        }
        var container=$(handler.km.currentPaneId);
        container.find("#km_key_word").textRemindAuto();
        handler.catalog.findCatalogList();
        handler.kmcontent.listRecently();
    },
    listKmTreeNav:function(buffer,names,id){
        if(names[id]){
            buffer.push(names[id].name);
            handler.catalog.listKmTreeNav(buffer,names,names[id].pid);
        }
    },
    getKmTreeDesc:function(names,tree){
        for(var i=0;i<tree.length;i++){
            var t=tree[i];
            names[t._id]= t;
            if(t.childs && t.childs.length>0){
                handler.catalog.getKmTreeDesc(names, t.childs);
            }
        }
    },
    getKmTreeIds:function(ids,tree){
        for(var i=0;i<tree.length;i++){
            var t=tree[i];
            ids[t._id]= t.pid;
            if(t.childs && t.childs.length>0){
                handler.catalog.getKmTreeIds(ids, t.childs);
            }
        }
    },
    getKmExpandIds:function(eids,ids,id){
        if(ids[id]){
            eids.push(ids[id]);
            handler.catalog.getKmExpandIds(eids,ids,ids[id]);
        }
    },
    getKmTreeChildIds:function(ids,tree,cid){
        for(var i=0;i<tree.length;i++){
            var t=tree[i];
            if(cid && t._id==cid){
                ids.push(t._id);
                if(t.childs && t.childs.length>0){
                    handler.catalog.getKmTreeChildIds(ids,t.childs);
                }
            }else{
                if(cid){
                    if(t.childs && t.childs.length>0){
                        handler.catalog.getKmTreeChildIds(ids,t.childs,cid);
                    }
                } else{
                    ids.push(t._id);
                    if(t.childs && t.childs.length>0){
                        handler.catalog.getKmTreeChildIds(ids,t.childs);
                    }
                }
            }
        }
    },

    generateKmTreeView:function(view,tree,eids){
        view.push("<ul>");
        for(var i=0;i<tree.length;i++){
            var t=tree[i];
            view.push("<li style='' isexpand='"+($.inArray(t._id,eids)==-1?false:true)+"' cId='"+ t._id+"' parentId='"+ t.pid+"' order='"+ t.order+"'><span>"+ t.name+"</span>");
            if(t.childs && t.childs.length>0){
                handler.catalog.generateKmTreeView(view, t.childs,eids);
            }
            view.push("</li>");
        }
        view.push("</ul>");
    },
    generateKmTreeItemView:function(html,data,ary,blankCount,isSelf){
        var selectOptionHtml = "<option value='__value' selected>__name</option>";
        var optionHtml = "<option value='__value'>__name</option>";
        var disableHtml = "<option disabled='true' value='__value'>__name</option>";
        var blankHtml = "";
        for(var j=0;j<blankCount;j++){
            var blank = "&nbsp;&nbsp;&nbsp;&nbsp;";
            blankHtml+=blank;
        }
        if(isSelf){
            for (var i=0;i<ary.length;i++) {
                var isDisable=false;
                if(data._id==ary[i]._id){
                    html.push(selectOptionHtml.replace(/__value/g,ary[i]._id).replace(/__name/g,blankHtml+ary[i].name));
                } else{
                    html.push(optionHtml.replace(/__value/g,ary[i]._id).replace(/__name/g,blankHtml+ary[i].name));
                }
                if(ary[i].childs && ary[i].childs.length>0){
                    handler.catalog.generateKmTreeItemView(html,data,ary[i].childs,blankCount+1,isSelf);
                }
            }
        } else{
            for (var i=0;i<ary.length;i++) {
                var isDisable=false;
                if(data.pid==ary[i]._id){
                    html.push(selectOptionHtml.replace(/__value/g,ary[i]._id).replace(/__name/g,blankHtml+ary[i].name));
                }else if(data._id==ary[i]._id){
                    isDisable=true;
                    html.push(disableHtml.replace(/__value/g,ary[i]._id).replace(/__name/g,blankHtml+ary[i].name));
                } else{
                    html.push(optionHtml.replace(/__value/g,ary[i]._id).replace(/__name/g,blankHtml+ary[i].name));
                }

                if(isDisable==false && ary[i].childs && ary[i].childs.length>0){
                    handler.catalog.generateKmTreeItemView(html,data,ary[i].childs,blankCount+1,isSelf);
                }
            }
        }

        return html.join("");
    },
    showKmTree:function(tree,id,isUpdate){
        var container=$(handler.km.currentPaneId);
        var pane = container.find("#knowledge_tree");
        var view=['<ul id="knowledge_tree_info" ><li cId="0"><span>目录浏览</span>'];
        var ids={},eids=[];
        if(id){
            handler.catalog.getKmTreeIds(ids,tree);
            handler.catalog.getKmExpandIds(eids,ids,id);
            if(isUpdate){
                eids.push(id);
            }
        }
        handler.catalog.generateKmTreeView(view,tree,eids);
        view.push('</li></ul>');
        pane.html(view.join(""));
        pane.find("#knowledge_tree_info").ligerTree({
            checkbox: false,
            nodeWidth: 210,
            attribute: ['nodename','cId','parentId','order'],
            isKnowledge:handler.catalog.hasManage,
            knowledgeLayer:handler.catalog.maxTreeLayer,
            onSelect: function (node) {
            }
        });
        handler.catalog.knowledge_tree = pane.find(".l-tree").ligerGetTreeManager();
        if(handler.catalog.hasManage)TREE._setTreeMouseEven($('.tree_text',pane));
    },
    findCatalogList:function(id,isUpdate){
        var action = {
            action:'app.km.queryCatalogList',
            data:{kmType:handler.km.currentTab}
        };
        DS.send(action,function(rep){
            if(rep.success){
//                console.dir(rep.tree);
                handler.catalog.myTreeDic=rep.tree;
                handler.catalog.showKmTree(rep.tree,id,isUpdate);
            }
        });
    },

    addCatalog:function(parent,toAdd){
        if(!toAdd){$().alertmessage('showError', "您最多可创建"+handler.catalog.maxTreeLayer+"层目录");return;}
        var catalogVO={};
        var nodes = [];
        var catalogBtnEnable=true;
        var div="<div style='margin:25px 20px;'>目录名称：<input type='text' style='width:250px;' id='addTreeItemInfo'/></div>";
        $.ligerDialog.open({
            title:"添加目录信息",
            target:div,
            width: 400,
            height: 150,
            buttons: [
                { text: '确定', onclick: function(item,dialog){
                    if(!catalogBtnEnable){return;}
                    else{catalogBtnEnable=false;}
                    var cName=$("#addTreeItemInfo").val();
                    cName=$.trim(cName);
                    if(!cName){catalogBtnEnable=true;$().alertmessage('showError', "目录名称不能为空!");return;}
                    else if(cName.length>25){catalogBtnEnable=true;$().alertmessage('showError', "目录名称不能超过25个字符!");return;}
                    catalogVO.cName=cName;
                    catalogVO.cParent=parent;
                    var action = {
                        action:'app.km.addCatalog',
                        data:{name:cName,pid:parent,order:0,kmType:handler.km.currentTab} //default order 0
                    };
                    DS.send(action,function(rep){
                        if(rep.success){
                            $().alertmessage('showSuccess', "添加目录成功");
                            handler.catalog.findCatalogList(rep.id);
                            dialog.close();
                        }else{
                            if(rep.code='1001'){
                                catalogBtnEnable=true;
                                $().alertmessage('showError', "已经存在相同的目录名称!");
                                return;
                            }
                        }
                    });

                } },
                { text: '取消', onclick: function (item, dialog) { dialog.close(); } }
            ]
        });
    },
    showCatalogOptions:function(data,isSelf){
        var ary=handler.catalog.myTreeDic;
        var html=[];
        if(!isSelf){
            html.push("<option value='0'>目录浏览</option>");
        }
        html=handler.catalog.generateKmTreeItemView(html,data,ary,0,isSelf);
        return html;
    },
    editCatalogItem:function(index) {
        var obj = $("#" + index +"_edit").parent().parent("li")[0];
        if (obj){
            var action = {
                action:'app.km.showCatalogEdit',
                data:{_id:index,kmType:handler.km.currentTab}
            };
            DS.send(action,function(rep){
                if(rep.success){
                    var row=rep.row;
                    var html=handler.catalog.showCatalogOptions(row)||[];
                    var pageHtml='';
                    DS.getView('./km/catalog_update',function(view){
                        row.tree=html;
                        pageHtml=render.replaceDataByObject(row,view);
                        $.ligerDialog.open({
                            title:"修改目录信息",
                            target:pageHtml,
                            id:"editTreeItem_info",
                            width: 400,
                            height: 200,
                            buttons: [
                                { text: '确定', onclick: function (item, dialog) {
                                    var pane=$("#editTreeItem_info");
                                    var cName=pane.find("#cName").val();
                                    cName=$.trim(cName);
                                    var cOrder=pane.find("#cOrder").val();
                                    var oldOrder=pane.find("#index").val();
                                    if(!cName){$().alertmessage('showError', "目录名称不能为空!");return;}
                                    else if(cName.length>25){$().alertmessage('showError', "目录名称不能超过25个字符!");return;}
                                    var pid=pane.find("#cParent").val();
                                    cOrder=parseInt(cOrder);
                                    oldOrder=parseInt(oldOrder);
                                    if(isNaN(cOrder)){$().alertmessage('showError', "请输入正确的数字!");return;}
                                    else if(cOrder<0){$().alertmessage('showError', "输入值不能小于0!");return;}
                                    var catalogVO={_id:row._id,pid:pid,name:cName,order:cOrder,index:oldOrder,kmType:handler.km.currentTab};

                                    handler.catalog.updateCatalogItem(catalogVO, dialog);
                                } },
                                { text: '取消', onclick: function (item, dialog) { dialog.close(); } }
                            ]
                        });
                        if(handler.km.currentTab=="outer"){
                            $("#cParent option:not(:first-child)").hide();
                        }else{
                            $("#cParent option:not(:first-child)").show();
                        }
                    });
                }
            });
        }else{
            $().alertmessage('showError', "请先选择节点");
        }
    },
    updateCatalogItem:function (catalogVO,dialog){
        var action = {
            action:'app.km.updateCatalog',
            data:catalogVO
        };
        DS.send(action,function(rep){
            if(rep.success){
                handler.catalog.findCatalogList(catalogVO._id,true);
                $().alertmessage('showSuccess', "更新目录成功");
                if(dialog)dialog.close();
            }else{
                if(rep.code='1001'){
                    $().alertmessage('showError', "已经存在相同的目录名称!");
                }else{
                    $().alertmessage('showError', errMsg);
                }
            }
        });
    },
    removeCatalogItem:function(id) {
        if(!window.confirm("确认要删除该目录吗?"))return;
        var obj = $("#" + id +"_del").parent().parent()[0];
        if (obj){
            var ids=[];
            var tree=handler.catalog.myTreeDic;
            handler.catalog.getKmTreeChildIds(ids,tree,id);
            if(ids.length>1){
                $().alertmessage('showError', "该目录下有子目录或知识点，不能删除！");
                return;
            }
            var action = {
                action:'app.km.delCatalog',
                data:{kmType:handler.km.currentTab,id:id}
            };
            DS.send(action,function(rep){
                if(rep.success){
                    handler.catalog.findCatalogList();
                    $().alertmessage('showSuccess', "删除目录成功");
                }else{
                    if(rep.code=='1001'){
                        $().alertmessage('showError', "该目录下有子目录或知识点，不能删除！");
                    }else{
                        $().alertmessage('showError', errMsg);
                    }
                }
            });
        }else{
            $().alertmessage('showError', "请先选择节点");
        }
    },
    textSearch:function(){
        var container=$(handler.km.currentPaneId);
        var pane= container.find("#km_search_container");
        var keyword=pane.find('#km_key_word');
        var val=$.trim(keyword.val());
        if(!val || val=='请输入关键词...'){
            return;
        }

        handler.catalog.searchKmList(val);
    },
    searchKmList:function(keyword,page){
        if(!page)page=1;
        handler.kmcontent.kmFlag="dic";
        handler.kmcontent.kmPage=page;
        handler.kmcontent.kmKeyword=keyword;
        var container=$(handler.km.currentPaneId);
        var pane= container.find("#knowledge_right_div");
        var action = {
            action:'app.km.queryKmDic',
            data:{key:keyword,page:page,kmType:handler.km.currentTab}
        };
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                DS.getView('./km/km_full_search',function(view){
                    view=view.replace(/_#keyword#_/g,keyword);
                    view=view.replace(/_#totalRow#_/g,count);
                    pane.empty();
                    pane.html(view);
                    var body=pane.find(".km_body");
                    body.empty();
                    if(!list || list.length<=0){
                        pane.find(".norecord").show();
                        pane.find(".pagination").hide();
                    }else{
                        pane.find(".norecord").hide();
                        pane.find(".pagination").show();
                        for (var i = 0; i < list.length; i++) {
                            var obj = list[i];
                            obj.catalog=handler.catalog.showCatlogPath(obj.cid)||'';
                            if(obj.content && obj.content.length>=100){
                                obj.content+="...";
                            }
                            pane.find("#tmpl_km_item").tmpl(obj).appendTo(body);
                        }
                    }
                    handler.kmcontent.isManager();
                    pane.find(".pagination span.result_count").text(count);
                    var li = pane.find(".pagination .km_item_list_page li");
                    updatePagination(li, count, 10, page);
                });
            }
        },"post");
    },
    searchKmListPage:function(data,src){
        var page=1;
        if(src && !src.hasClass("do_action"))page=src.val();
        handler.kmcontent.kmPage=page;
        var keyword=data.keyword;
        var container=$(handler.km.currentPaneId);
        var pane= container.find("#knowledge_right_div");
        var action = {
            action:'app.km.queryKmDic',
            data:{key:keyword,page:page,kmType:handler.km.currentTab}
        };
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list;
                var count=rep.count;
                var body=pane.find(".km_body");
                body.empty();
                for (var i = 0; i < list.length; i++) {
                    var obj = list[i];
                    obj.catalog=handler.catalog.showCatlogPath(obj.cid)||'';
                    pane.find("#tmpl_km_item").tmpl(obj).appendTo(body);
                }
                handler.kmcontent.isManager();
                pane.find(".pagination span.result_count").text(count);
                var li = pane.find(".pagination .km_item_list_page li");
                updatePagination(li, count, 10, page);
            }
        },"post");
    } ,
    showCatlogPath:function(cid){
        var names={},buffer=[];
        handler.catalog.getKmTreeDesc(names,handler.catalog.myTreeDic);
        handler.catalog.listKmTreeNav(buffer,names,cid);
        var html="";
        for(var i=buffer.length-1;i>=0;i--){
            html+=buffer[i]+">";
        }
        return html;
    },
    queryKmList:function(cid,page){
        if(!page)page=1;
        handler.kmcontent.kmPage=page;
        handler.kmcontent.kmCid=cid;
        handler.kmcontent.kmFlag="km";
        var container=$(handler.km.currentPaneId);
        var pane= container.find("#knowledge_right_div");
        DS.getView('./km/km_list',function(view){
            view=view.replace(/_#cid#_/g,cid);
            pane.empty();
            pane.html(view);
            var html=handler.catalog.showCatlogPath(cid,pane);
            pane.find(".km_nav").text(html);
            var action = {
                action:'app.km.queryItemList',
                data:{cid:cid,page:page,kmType:handler.km.currentTab}
            };
            DS.send(action,function(rep){
                if(rep.success){
                    var body=pane.find("#km_item_list_pane");
                    body.empty();
                    var list=rep.list;
                    var count=rep.count;
                    var pane2=pane.find(".km_body");
                    if(!list || list.length<=0){
//                        pane.find(".km_btn_group").hide();
                        var txt="此目录还没发布任何内容!";
//                        if(handler.catalog.hasManage){
//                           txt='还没有内容,赶快去<a href="#" class="km_manage" appaction="kmcontent.showAdd" appdata="'+cid+'" class="action"><strong>增加</strong></a>吧'
//                        }
                        pane2.html('<div style="font-size:16px;margin: 20px;">'+txt+'</div>');
                    }else{
//                        pane.find(".km_btn_group").show();
                        for (var i = 0; i < list.length; i++) {
                            var obj = list[i];
                            pane.find("#tmpl_km_item").tmpl(obj).appendTo(body);
                        }
                    }
                    handler.kmcontent.isManager();
                    pane.find(".pagination span.result_count").text(count);
                    var li = pane.find(".pagination .km_item_list_page li");
                    updatePagination(li, count, 10, page);
                }
            });
        });
    },
    queryListPage:function(data,src){
        var page=1;
        if(src && !src.hasClass("do_action"))page=src.val();
        handler.kmcontent.kmPage=page;
        var container=$(handler.km.currentPaneId);
        var cid=handler.kmcontent.kmCid;
        var pane= container.find("#knowledge_right_div");
        var action = {
            action:'app.km.queryItemList',
            data:{cid:cid,page:page,kmType:handler.km.currentTab}
        };
        DS.send(action,function(rep){
            if(rep.success){
                var body=pane.find("#km_item_list_pane");
                body.empty();
                var count=rep.count;
                var list=rep.list;
                for (var i = 0; i < list.length; i++) {
                    var obj = list[i];
                    pane.find("#tmpl_km_item").tmpl(obj).appendTo(body);
                }
                handler.kmcontent.isManager();
                pane.find(".pagination span.result_count").text(count);
                var li = pane.find(".pagination .km_item_list_page li");
                updatePagination(li, count, 10, page);
            }
        });
    },

    hitKmSort:function(event){
        var getSortDIVs=function(divs,index, dataType,sortState) {
            var trArr = new Array;
            for(var i=0; i<divs.length; i++) {
                trArr[i] = divs[i];
            }
            trArr.sort(compareDIVs(index, dataType,sortState));
            return trArr;
        };
        var compareDIVs=function(index, dataType, sortState) {
            var self = this;
            return function compare(tr1, tr2) {
                var value1 = convert(tr1.children[index].innerHTML, dataType);
                var value2 = convert(tr2.children[index].innerHTML, dataType);
                if(sortState == null || sortState == "up") {
                    return asc(value1, value2);
                } else if(sortState == "down") {
                    return desc(value1, value2);
                }
            };
        };
        var convert=function(value, dataType) {
            switch(dataType) {
                case "int": return parseInt(value);
                case "float": return parseFloat(value);
                case "date": return new Date(Date.parse(value));
                default: return value.toString();
            }
        };
        var asc=function(x, y) {
            if(x > y) {
                return 1;
            } else if(x < y) {
                return -1;
            } else {
                return 0;
            }
        };
        var desc=function(x, y) {
            if(x > y) {
                return -1;
            } else if(x < y) {
                return 1;
            } else {
                return 0;
            }
        };
        var container=$(handler.km.currentPaneId);
        var pane= container.find("#knowledge_right_div");
        var children=pane.find("#sortDiv_body").children();
        var arr=null;
        if(event.innerHTML=="点击量▼"){
            event.innerHTML="点击量▲";
            arr=getSortDIVs(children,1,"int","up");
        }else{
            event.innerHTML="点击量▼";
            arr=getSortDIVs(children,1,"int","down");
        }
        var docFrag = document.createDocumentFragment();
        for(var i=0;i<arr.length;i++) {
            docFrag.appendChild(arr[i]);
        }
        pane.find("#sortDiv_body")[0].appendChild(docFrag);
    }

};
