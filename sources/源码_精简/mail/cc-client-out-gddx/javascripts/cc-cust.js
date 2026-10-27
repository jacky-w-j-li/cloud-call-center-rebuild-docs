handler.customer={
    custPageLimit:10,
    custLogLimit:20,
    cid:"#view_nav_customer",
    quickAry:[],
    quickSearchAry:[],
    curSubMenu:'',
    mergeCustomerA:null,
    mergeCustomerB:null,
    batchMaxNum:10000,
    normalId:"NA",
    myMenus:['customer_my', 'customer_seas'],
    custDetail:{},
    _initFuncs:function(){
        var funcIds=session.user.funcIds;
    },
    customer_main:function(menu){
        var pane=$(handler.customer.cid);
        if(handler.workbench.toShowDate){
            pane.find(".btn_customer_seas").click();
            handler.workbench.toShowDate = false;
        }else{
            pane.find(".btn_customer_my").click();
        }


        //var dic=getCache('custTmpls');
        //var aryStatus=dic[0].status||[];
        //handler.customer.quickAry=[{n:"全部",v:""}];
        //for(var k in aryStatus){
        //    handler.customer.quickAry.push({n:aryStatus[k],v:k});
        //}
        /*     var data={
         menu:"query_customer"
         }
         DS.getView('customer/customer_list_page',function(view){
         view=DS.renderMethodViewNew(view,data);
         pane.find("#view_customer_list").html(view);
         pane.find("#view_customer_list_content").html(template("tmpl_right_content",data));


         handler.customer.customer_list_page(data.menu);

         });*/
    },
    quick_subMenu_search: function (submenu,src) {
        var lastMenu=handler.customer.curSubMenu||'';
        var searchPane = src.closest(".left_column");
        searchPane.find(".model_submenu button").removeClass("active");
        src.addClass("active");
        handler.customer.quickAry=[];
        if(submenu=='customer_my'){
            handler.customer.quickAry=[{n:"全部",v:""}];
            handler.customer.quickAry.push({n:"待跟进",v:"isFollow"});
            handler.customer.quickAry.push({n:"联系计划",v:"isProject"});
            handler.customer.quickAry.push({n:"当日计划",v:"totalNotify"});
        }else if(submenu=='customer_seas') {
            handler.customer.quickAry=[{n:"全部",v:""}];
            var dic = getCache("custCategorys");
            for(var j = 0;j<dic.length;j++){
                var commonTmpl = dic[j];
                if(commonTmpl.category=="0"||commonTmpl.category=="3"){
                    var managers = commonTmpl.managers;
                    var members = commonTmpl.members;
                    var userId = session.user._id;
                    if($.inArray(userId,managers)!=-1||$.inArray(userId,members)!=-1){
                        handler.customer.quickAry.push({n:commonTmpl.cName,v:commonTmpl._id});
                    }
                }
            }
        }else if(submenu=='customer_all') {
            handler.customer.quickAry=[{n:"全部",v:""}];
            if(session.user.scope.customer=='all'){
                handler.customer.quickAry.push({n:"无归属",v:handler.customer.normalId});
            }
            var custCategorys=getCache('custCategorys');
            for(var i=0;i<custCategorys.length;i++){
                var categoryTmpl = custCategorys[i];
                var managers = categoryTmpl.managers;
                var members = categoryTmpl.members;
                var userId = session.user._id;
                if($.inArray(userId,managers)!=-1){
                    handler.customer.quickAry.push({n:categoryTmpl.cName,v:categoryTmpl._id});
                }

            }
        }
        var quickSearchTmpls = getCache('quickSearchTmpls') ||[];
        for(var j=0;j<quickSearchTmpls.length;j++){
            var qSearch = quickSearchTmpls[j];
            var menu = qSearch.menu;
            if(menu==submenu){
                var v = qSearch._id+"|quick";
                handler.customer.quickAry.push({n:qSearch.kName,v:v});
            }
        }
        handler.customer.curSubMenu=submenu;
        handler.swapSubMenu(submenu,'customer/customer_list_page',"customer_list",true,true);
        var toolbarPane=$("#pane_deal_list");
        if(toolbarPane.length>0){
            toolbarPane.hide();
        }
        //handler.cancelDealToolbar("customer",lastMenu);
    },
    customer_list_page: function (menu) {
        //console.info("customer_list_page::menu========"+menu)
        var pane=$(handler.customer.cid);
        pane.find("#view_customer_list_content").html(template("tmpl_customer_content_container",{menu:menu}));
        var searchPane = $('#contact_list_'+menu);
        handler.customer._initCustomerSearch(searchPane,menu);
        //if(handler.workbench.toShowDateCustStatus == ""){
        //    var btn=searchPane.find('.customer_normal_search');
        //    btn.click();
        //}
        //if(handler.workbench.toShowDateCustName != ""){
        //    pane.find(".textbox_input").val(handler.workbench.toShowDateCustName);
        //    //$('.customer_normal_search').click();
        //    handler.workbench.toShowDateCustName = '';
        //}
        //隐藏合并功能
        if(!isHasFunc("func_customer_merge")){
            pane.find(".customer_merge").remove();
        }else{
            pane.find(".customer_merge").show();
        }
        //隐藏导出任务功能
        if(!isHasFunc("func_customer_export")){
            pane.find(".customer_export_task").remove();
        }else{
            pane.find(".customer_export_task").show();
        }
        //隐藏奖罚劵功能
        if(!isHasFunc("func_customer_titket")){
            pane.find(".customer_titket").remove();
        }else{
            pane.find(".customer_titket").show();
        }

        //隐藏公海配置
        if(!isHasFunc("func_customer_common")){
            pane.find(".customer_common").remove();
        }else{
            pane.find(".customer_common").show();
        }
        //隐藏商机池
        if(!isHasFunc("func_customer_sale_chace")){
            pane.find(".customer_sale_chance").remove();
        }else{
            pane.find(".customer_sale_chance").show();
        }
    },
    customer_quick_search: function (data,src) {
         var searchPane = {};
        if(src){
            searchPane = src.closest(".list_check_pane");
        }else{
             searchPane = $("#contact_list_customer_my");
            src = searchPane.find(".quick_menu a[ds_data='"+data+"']");
        }
        searchPane.find(".quick_menu a").removeClass("quick_card_active");
        src.addClass("quick_card_active");
            searchPane.find(".quick_desc").text(src.text());
        var index = data.indexOf("|quick");
        if(index!=-1){
            var kId = data.substring(0,index);
            var quickSearch = getCache("quickSearchTmpls",kId);
            var query = quickSearch.query;
            var condition= $.toJSON(query);
            searchPane.find(".quick_search_condition").html(condition);
            searchPane.find("#frm_customer_normal_search").find("input[name='quickSearch']").val("");
        }else{
            searchPane.find(".quick_search_condition").html("");
            searchPane.find("#frm_customer_normal_search").find("input[name='quickSearch']").val(data);
        }
        var menuLeft=searchPane.find(".quick_card");
        var _wl=menuLeft.outerWidth(true);
        //searchPane.find(".textbox_wrap").css({"margin-left":_wl+"px"});

        var btn=searchPane.find('.customer_normal_search');
        btn.click();
    },
    searchCustomerPage: function(data, src) {
        var menu=data.menu||handler.customer.curSubMenu;
        if(src.hasClass("refresh")){
            var searchPane = $('#contact_list_'+menu);
            var param=handler._getSearchCondition(searchPane,"1");
            if(!param){
                    param={
                        menu:data.menu,
                        dbType:data.dbType
                    };
            }
            var a=searchPane.find(".pagination li.active>a");
            if(a.length>0){
                param.page= a.attr("value");
            }
            handler.customer._queryCustomerPage(param,null);
        }else{
            handler.customer._queryCustomerPage(data,src);
        }
    },
    _setSearchCondition:function(data,pane){
        var condition= $.toJSON(data);
        pane.find(".search_condition").html(condition);
    },
    _getSearchCondition:function(pane,isAll){
        var query=null;
        var json=pane.find(".search_condition").html();
        if(json){
            query=$.evalJSON(unescapeHtml(json));
            query=removeEmptyProperty(query);
        }
        if(isAll!="1"){
            var ids=[];
            pane.find(".list_item_check.select_on").each(function(i){
                var cid=$(this).find("input[name='customerId']").val();
                ids.push(cid);
            });
            var _q=null;
            if(ids.length>0){
                _q={_id:{$in:ids}};
            }else{
                _q={_id:"NA"};
            }
            if(query){
                _q.dbType=query.dbType;
            }
            query=_q;
        }
        return query;
    },
    _queryCustomerPage:function(data,src){
        var menu = data.menu;
        var isAdvanceSearch=data.isAdvanceSearch;
        delete  data.isAdvanceSearch;

        var remindSearch_flag = data.remindSearch;
        delete data.remindSearch;

        var actionType = data.actionType;
        delete data.actionType;
        if(actionType){
            data.actionType = 'date';
        }

        var pane=$('#contact_list_'+menu);
        if(!data.dbType){
            data.dbType=pane.find("#frm_customer_normal_search").find('input[name="dbType"]').val();
        }
        var query = null;
        var json=pane.find(".quick_search_condition").html();
        if(json){
            query=$.evalJSON(unescapeHtml(json));
            query=removeEmptyProperty(query);
        }
        if(query!=null){
            var _type = "";
            var tmpls = getCache("custTmpls");
            var _tmpl = tmpls[0];
            var customFields=_tmpl.custom_fields||[];
          for(var q in query){
              for(var i=0;i<customFields.length;i++){
                  var row = customFields[i];
                  if(q == row._id) {
                      var _type = row.type;
                      if(_type=="date"){
                          break;
                      }
                  }
              }
              if(q == "notifyTime" || q == "lastUpdateTime" || q == "createTime" || q=="birth"|| _type=="date"){
                  var item = query[q];
                      for(var it in item){
                          var it1 = utils.Base64.decode(it);
                          item[it1] = item[it];
                          delete item[it];
                      }
                      query[q] = item;

              }
              data[q] = query[q];
          }
        }
        handler.customer._setSearchCondition(data,pane);
        var frmId = "frm_customer_normal_search";
        //var frmId = "frm_customer_advanced_search";
        if(isAdvanceSearch=="1"){
             //frmId = "frm_customer_normal_search";
            frmId = "frm_customer_advanced_search";
        }
        pane.find(".pagination").attr({for:frmId});
        var page=data.page;
        if(src && src.hasClass("page_on")){
            page=src.attr("value");
            handler.cancelDealToolbar("customer",menu);
        }
        if(!page)page=1;
        data.page=page;
        data.limit=handler.customer.custPageLimit;

        var action = {
            action: 'app.customer.queryCustPage2In',
            data:data
        };
        var listPane = pane.find('.list-inside');
        DS.send(action, function(response){
            if(response.success){
                DS.showSearchTips(pane.find("#"+frmId),false);
                var list = response.list;
                var count=response.count;
                var notify=response.notify;
                if(list.length > 0){
                    var html = [];
                    var tmplId="tmpl_customer_page_item";
                    if(menu=='customer_plan'){
                        tmplId="tmpl_customer_plan_item";
                    }
                    for (var i = 0; i < list.length; i++) {
                        var _obj=list[i];
                        handler.customer._initCustomerNullFields(_obj);
                        //var owner=getCache('agents',_obj.owner||'NA');
                        //var ownerDesc='公共客户';
                        //if(owner){
                        //    ownerDesc=owner.displayName;
                        //}
                        _obj.ownerDesc=handler.customer.showForOwnerDesc(_obj,menu);
                        _obj.ownerMenu = menu;
                        if(_obj.owner === session.user._id){
                            if(_obj.isRead === true){
                                _obj.readImg = "/img/client/read.png";
                            }
                        }
                        var contactDesc=handler.customer.showContactDesc(_obj.sysStatus);
                        _obj.contactDesc=contactDesc;
                        html.push($('#'+tmplId).tmpl(_obj).get(0).outerHTML);
                    }
                     var remind = $("#frm_customer_normal_search .cust_remindSearch_hidden").attr("ds_flag");
                    if(remind){
                        if(data.combox){
                            listPane.html(html.join(""));
                            $("#frm_customer_normal_search").find(".cust_remindSearch_hidden").remove();
                            $("#contact_list_customer_my .list-inside input").not("input[value="+remindSearch_flag+"]").closest(".list_item_check").remove();
                            if($("#contact_list_customer_my .list-inside").find("input[value="+remindSearch_flag+"]").length){
                               $("#contact_list_customer_my .list-inside").find("input[value="+remindSearch_flag+"]").click();
                           }
                        }else{
                            listPane.html("");
                        }
                    }else{
                        listPane.html(html.join(""));
                    }
                    
                    
                    var genjin =$('.margin_patch').find($(".genjinicon"));
                    genjin.each(function(){
                        if($(this).hasClass('genjinicon2')){
                            $(this).attr('title','未跟进');
                        }else if($(this).hasClass('genjinicon3')){
                            $(this).attr('title','无效');
                        }else if($(this).hasClass('genjinicon4')){
                            $(this).attr('title','成单');
                        }else if($(this).hasClass('genjinicon5')){
                            $(this).attr('title','审核');
                        }else if($(this).hasClass('genjinicon6')){
                            $(this).attr('title','审核失败');
                        }else if($(this).hasClass('genjinicon7')){
                            $(this).attr('title','丢单');
                        }else{
                            $(this).attr('title','跟进');
                        }
                    });
                    if($.inArray(menu, handler.customer.myMenus)!=-1) {
                        //listPane.find(".cust-owner").hide();
                        if(menu == 'customer_seas'){
                            var sourceElement = listPane.find(".btn_cust_claim");
                            sourceElement.each(function(){
                                $(this).on('click',function(e){
                                    e.stopPropagation();
                                    var custId = $(this).closest(".card_row_new").children("input[name='customerId']").val();
                                    var action = {
                                        action : 'app.customer.claimCustomer',
                                        data : custId
                                    };
                                    DS.send(action,function(rep){
                                        var setData = {};
                                        setData.menu = "customer_seas";
                                        if(rep.success){
                                            $().alertmessage('showSuccess','领取成功!');
                                            handler.customer.searchCustomerPage(setData,$(this));
                                            $("#customer_seas_customer .customer_container,#customer_seas_customer .cust_tab_content_other,#customer_seas_customer .cust_tab_content_bus").empty();
                                        }else if(rep.code=="1001"){
                                            $().alertmessage('showError','客户已达到领取上限!');
                                        }else if(rep.code=="1002"){
                                            $().alertmessage("showError",'您不是该公海的管理员或者成员,不可以领取!');
                                        }else if(rep.code==='1006'){
                                            $().alertmessage('showError','此客户已经被别人领取，请选择其他客户领取!');
                                            handler.customer.searchCustomerPage(setData,$(this));
                                            $("#customer_seas_customer .customer_container,#customer_seas_customer .cust_tab_content").empty();
                                        }else if(rep.code==='1007'){
                                            $().alertmessage('showError','此客户已经被别人删除，请选择其他客户领取!');
                                            handler.customer.searchCustomerPage(setData,$(this));
                                            $("#customer_seas_customer .customer_container,#customer_seas_customer .cust_tab_content").empty();
                                        }else{
                                            $().alertmessage('showError',errMsg);
                                        }
                                    });
                                });
                            });
                        }
                    }
                    if(notify){
                        $().alertmessage('showNotify', "您搜索到的数据太多，未全部展现，请您细化过滤条件！");
                    }
                } else {
                    var html='<div class="alert">未找到客户!</div>';
                    listPane.html(html);
                }
                DS.updatePagination(frmId, count, data.limit, data.page);
                pane.find('#customer_advanced_search_pane').addClass("hidden");

                /*                listPane.mCustomScrollbar({
                 theme:"minimal-dark"
                 });*/
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    
    _initCustomFieldsOption:function(item,showDft,pane){
        var html=[];
        if(showDft!='no'){
            html.push("<option value=''>--请选择--</option>");
        }
        var optionHtml = "<option value='__value'>__name</option>";
        var ary=item.choices||[];
        if(!ary || ary.length==0) return null;
        for (var key in ary) {
            html.push(optionHtml.replace(/__value/g,key).replace(/__name/g,ary[key]));
        }
        var select=pane.find("select");
        if(select.length>0){
            select.html(html.join(""));
        }
    },
    _initCustomFieldsCheckbox:function(item,pane){
        var html=[];
        var optionHtml = '<label class="checkbox inline" style="width: auto;padding-top: 0;"><input style="width: auto;" fieldgroup="1" type="checkbox" name="___id" value="__value"><span>__name</span></label>&nbsp;';
        var ary=item.choices||[];
        if(!ary || ary.length==0) return null;
        for (var key in ary) {
            html.push(optionHtml.replace(/__value/g,key).replace(/__name/g,ary[key]).replace(/___id/g,item._id+"[]"));
        }
        var select=pane.find(".search_checkbox");
        if(select.length>0){
            select.html(html.join(""));
        }
    },
    _initCustomFields2Query: function (customFields, pane) {
        var rowTmp = "<div class='row-fluid'></div>";
        var colTmp = "<div class='_#spanClass#_ advanced_search_item ds_search_item col'></div>";
        var singleTmp = "<label>_#name#_</label><input type='text' name='_#_id#_'>";
        var multiTmp = "<label>_#name#_</label><input type='text' name='_#_id#_'>";
        var numberTmp = "<label>_#name#_</label><input type='text' name='_#_id#_'>";
        var dateTmp = "<label>_#name#_</label><input class='ds_date' type='text' name='_#_id#_'>";
        var dropdownTmp = "<label>_#name#_</label><select  name='_#_id#_'></select>";
        var radioTmp = "<label>_#name#_</label><select  name='_#_id#_'><option value=''>--请选择--</option></select>";
        var checkboxTmp = "<label>_#name#_</label><div class='search_checkbox'></div>";
        var container=pane.find(".custom_fields_pane");
        var checkboxFields=[];
        for (var i = 0; i < customFields.length; i++) {
            var row = customFields[i];
            var _type=row.type;
            if(i%3==0){
                container.append(rowTmp);
            }
            var rowPane = container.children("div.row-fluid:last");
            if(_type=='checkbox'){
                checkboxFields.push(row);
            }else{
                rowPane.append(colTmp.replace(/_#spanClass#_/g, "span4"));
                var colPane = rowPane.children("div.col:last");
                switch (_type) {
                    case 'single':
                        colPane.append(DS.renderMethodViewNew(singleTmp,row));
                        break;
                    case 'multi':
                        colPane.append(DS.renderMethodViewNew(multiTmp,row));
                        break;
                    case 'number':
                        colPane.append(DS.renderMethodViewNew(numberTmp,row));
                        break;
                    case 'date':
                        colPane.append(DS.renderMethodViewNew(dateTmp,row));
                        break;
                    case 'dropdown':
                        colPane.append(DS.renderMethodViewNew(dropdownTmp,row));
                        handler.customer._initCustomFieldsOption(row,null,colPane);
                        break;
                    case 'radio':
                        colPane.append(DS.renderMethodViewNew(radioTmp,row));
                        handler.customer._initCustomFieldsOption(row,null,colPane);
                        break;
                    default :
                        console.log('the type [' + _type + '] is not support!');
                }
            }
        }
        for (var i = 0; i < checkboxFields.length; i++) {
            var row = checkboxFields[i];
            container.append(rowTmp);
            var rowPane = container.children("div.row-fluid:last");
            rowPane.append(colTmp.replace(/_#spanClass#_/g, "span12"));
            var colPane = rowPane.children("div.col:last");
            colPane.append(DS.renderMethodViewNew(checkboxTmp,row));
            handler.customer._initCustomFieldsCheckbox(row,colPane);
        }
    },
    _initQueryFieldsOption:function(item,showDft,pane){
        var html=[];
        if(showDft!='no'){
            html.push("<option value=''>--请选择--</option>");
        }
        var optionHtml = "<option value='__value'>__name</option>";
        var ary=item||[];
        if(!ary || ary.length==0) return null;
        for (var key in ary) {
            html.push(optionHtml.replace(/__value/g,key).replace(/__name/g,ary[key]));
        }
        var select=pane.find("select");
        if(select.length>0){
            select.html(html.join(""));
        }
    },
    _initQueryFields: function (stableFields,pane) {
        var rowTmp = "<div class='row-fluid'></div>";
        var colTmp = "<div class='_#spanClass#_ advanced_search_item ds_search_item col'></div>";
        var textTmp = "<label>_#name#_</label><input type='text' name='_#key#_' />";
        var dateTmp = "<label>_#name#_</label><input class='ds_date' type='text' name='_#key#_'>";
        var radioTmp = "<label>_#name#_</label><select  name='_#key#_'><option value=''>--请选择--</option></select>";

        var container=pane.find(".custom_fields_pane");
        var index = 0;//控制行
        var rowPane = "";
        var colPane = "";
        var iHandler = function(index){
            if(index%3==0){
                container.append(rowTmp);
            }
            rowPane = container.children("div.row-fluid:last");
            rowPane.append(colTmp.replace(/_#spanClass#_/g, "span4"));
            colPane = rowPane.children("div.col:last");
        };
        var nHandler = function(field,colPane,tmp){
            var name = field.name;
            var value = field.value;
            colPane.append(tmp.replace(/_#name#_/g, value).replace(/_#key#_/g, name));
        };

        for(var i in stableFields){
            var field = stableFields[i];
            if(field.search){
                var name = field.name;
                if(name == 'title' || name =="weixin" || name == 'email' || name == 'address' || name == 'note' || name == 'web' || name == 'age' ){
                    iHandler(index);
                    nHandler(field,colPane,textTmp);
                    index++;
                }else if(name == 'sex') {
                    iHandler(index);
                    nHandler(field, colPane, radioTmp);
                    handler.customer._initQueryFieldsOption(["男", "女"], null, colPane);
                    index++;
                }else if(name == 'birth'){
                    iHandler(index);
                    nHandler(field,colPane,dateTmp);
                    index++;
                }
            }
        }
    },
    _initQuickMenu:function(searchPane,dic,filter){
        var container=searchPane;
        if(filter){
            container=searchPane.find(filter);
        }
        var quick_menu=container.find(".quick_menu");
        dic=dic||[];

        var tmpl='<li><a href="#" class="ds_do_action" ds_action="_#action#_" title="_#n#_" ds_data="_#v#_">_#n#_</a></li>';
        tmpl=tmpl.replace(/_#action#_/g,"customer.customer_quick_search");
        quick_menu.empty();
        for (var i = 0; i <dic.length; i++) {
            var _d = dic[i];
            quick_menu.append(DS.renderViewNew(tmpl,_d));
        }
    },
    _initCustomerSearch:function(searchPane,menu){
        var tmpls=getCache('custTmpls');
        if(!tmpls || tmpls.length==0){
            $().alertmessage('showError', "请配置客户数据库");
            return;
        }
        var _tmpl=tmpls[0];
        var dbType=_tmpl._id;
        var customFields=_tmpl.custom_fields||[];
        var stableFields = _tmpl.stable_fields||[];
        searchPane.find("#frm_customer_normal_search").find("input[name='dbType']").val(dbType);
        searchPane.find(".customer_advanced_search").bind("click",function(e){
            e.stopPropagation();
            var offset=searchPane.find(".quick_search").offset();
            var _p=searchPane.find("#customer_advanced_search_pane");
            _p.css({top:offset.top+28+"px",left:offset.left+"px"});
            _p.toggleClass("hidden");
        });
        var url = 'customer/customer_search_manager_new';
        DS.getView(url, function(view){
            if(view){
                view=DS.renderViewNew(view,{menu:menu});
                view = view.replace(/_#menu#_/g,menu);
                searchPane.find("#customer_advanced_search_pane").html(view);
                //searchPane.find("#customer_advanced_search_pane").find(".customer_quick_text").hide();
                //searchPane.find("#customer_advanced_search_pane").find(".customer_quick_search_text").bind("click",function(e){
                //    e.stopPropagation();
                //    searchPane.find("#customer_advanced_search_pane").find(".customer_quick_text").show();
                //    searchPane.find("#customer_advanced_search_pane").find(".customer_quick_search_text").hide();
                //});
                handler.customer._initQuickMenu(searchPane,handler.customer.quickAry);
                var advancePane=searchPane.find("#customer_advanced_search_pane");

                if(menu=="customer_my"){
                    advancePane.find(".cust_query_all").remove();
                    advancePane.find(".cust_query_seas").remove();
                    advancePane.find(".cust_query_my").show();
                }else if(menu == "customer_seas"){
                    advancePane.find(".cust_query_all").remove();
                    advancePane.find(".cust_query_seas").show();
                    advancePane.find(".cust_query_my").remove();
                }else if(menu == "customer_all"){
                    advancePane.find(".cust_query_all").show();
                    advancePane.find(".cust_query_seas").remove();
                    advancePane.find(".cust_query_my").remove();
                }
                //if($.inArray(menu, handler.customer.myMenus)!=-1) {
                //
                //    advancePane.find(".cust_query_all").remove();
                //    advancePane.find(".cust_query_my").show();
                //}else{
                //    advancePane.find(".cust_query_my").remove();
                //}

                if(stableFields && stableFields.length>0){
                    handler.customer._initQueryFields(stableFields,searchPane);
                }
                if(customFields.length>0){
                    handler.customer._initCustomFields2Query(customFields,searchPane);
                }
                var s1=searchPane.find("select[name='status']").get(0);
                var s2=searchPane.find("select[name='custsource1']").get(0);
                var s3=searchPane.find("select[name='sysStatus']").get(0);
                var s4=searchPane.find("select[name='categoryId']").get(0);
                if(menu=="customer_seas") {
                    s4=searchPane.find("select[class='common_sea_owner']").get(0);
                }
                handler.customer.getOptionDic(dbType,'status',s1);
                handler.customer.showSourceOption(dbType,s2,null,1,true);
                handler.customer.showCategoryIdDic(s4,"",1,menu);



                if(searchPane.find("#customer_advanced_search_pane").find(".ds_owner").length>0){
                    var inputId=menu+"_owner_select_input";
                    var containerId=menu+"_owner_select_user";
                    var editOwner="";
                    //if(isHasFunc("func_not_allow_user_edit_owner")){
                    //    editOwner = "readonly"
                    //}
                    //utils.loadAgentComboBox(inputId,containerId,{width:"110",height:"17"},false,true,editOwner);
                    //var depts=getCache("depts");
                    utils.loadAgentTabBox(inputId,containerId,{width:"360",height:"17",maxHeight:292,hideTab:0,isRadio:true,commonTab:true},false,true);
                }
                var html=generateCCOptions(proviceCityDicKey);
                searchPane.find("select[name='province']").html(html);

                resizeLeftColumn(searchPane.closest(".left_column"));
                //console.info("handler.workbench.toShowDateCustStatus==="+handler.workbench.toShowDateCustStatus);

                if(handler.workbench.toShowDateCustStatus!=""){
                    handler.customer.optionSelect($(s1),handler.workbench.toShowDateCustStatus);
                    searchPane.find(".advanced_search_pane .btn_advanced").click();
                    handler.workbench.toShowDateCustStatus = "";
                }else if (handler.workbench.toShowDateCustSales!=""){
                    handler.customer.optionSelect($(s3),handler.workbench.toShowDateCustSales);
                    searchPane.find(".advanced_search_pane .btn_advanced").click();
                    handler.workbench.toShowDateCustSales = "";
                }else if(handler.workbench.toShowDateCustName != ""){
                    handler.customer.optionSelect($(s1),handler.workbench.toShowDateCustStatus);
                    searchPane.find(".textbox_input").val(handler.workbench.toShowDateCustName);
                    searchPane.find(".quick_desc").text("联系计划");
                    searchPane.find("#frm_customer_normal_search").find("input[name='quickSearch']").val("isProject");
                    $('.customer_normal_search').click();
                    handler.workbench.toShowDateCustName = '';
                }else{
                    var quick_menu=searchPane.find(".quick_menu");
                    quick_menu.find("li:first>a").addClass("quick_card_active").click();
                }
            }
        });
    },
    closeAdvanceSearch:function(data,src){
        var pane=src.closest("#customer_advanced_search_pane");
        pane.addClass("hidden");
    },
    // resetForm:function(data,src){
    //     var frm=src.closest("form");
    //     handler.resetForm(data,src);
    //     frm.find('.customer_quick_text').hide();
    //     frm.find('.customer_quick_search_text').show();
    // },
    moreCustomer: function(data, src) {
        var pane = src.closest('.ds_search_pane');
        var index = parseInt(pane.attr('ds_index'))+1;
        var query = getSearchCondition(pane);
        handler.customer._queryCustomer(index, query.data, query.queryDisplay, pane);
    },
    showCustInfo:function(menu,src){
        var cId,
            call_right;
        if (src === "customerPlanRemind"){
            cId = menu.cid;
            call_right=$("#"+menu.menuId+"_customer");
            menu = menu.menuId;
        }else {
            cId=src.find('input[name=customerId]').val();
            call_right=$("#"+menu+"_customer");
        }
        handler.customer.loadCustInfo(cId,menu,'customer',"custDetail",null,function(){
            call_right.find(".func_tab.active").click();
            //客户页工单刷新
            call_right.find('.business_newbuild').remove();
        });
    },
    toggleAction:function(edit,pane){
        if(edit){
            pane.find(".current_name, .current_date, .edit-action").hide();
            pane.find(".change_name, .change_date, .buttons").show();
        }else{
            pane.find(".current_name, .current_date, .edit-action").show();
            pane.find(".change_name, .change_date, .buttons").hide();
        }
    },
    setNotifyDate:function(notifyTime,parent){
        var ary=notifyTime.split(" ");
        parent.find("input[name='notifyTime_date']").val(ary[0]);
        parent.find("input[name='notifyTime_time']").val(ary[1]);
    },
    initActionView:function(data,pane,flag){
        var action=data.action;
        var t = pane.find(".next-action-form");
        t.empty();
        if(!action)data.action='';
        if(!data.notifyTime)data.notifyTime='';
        if(flag=='channel'){
            $("#tmpl_contact_action_channel").tmpl(data).appendTo(t);
        }else{
            $("#tmpl_contact_action").tmpl(data).appendTo(t);
        }


        if(data.notifyTime){
            handler.customer.setNotifyDate(data.notifyTime,t);
        }

        if(action){ 
            handler.customer.toggleAction(false,t);
        } else{
            handler.customer.toggleAction(true,t);
            t.find(".buttons .cancel_button").hide();
        }
        t.find(".edit-action").click(function(){
            handler.customer.toggleAction(true,t);
        });

//        t.find('.ds_date').datepicker({
//            minDate:0,
//            changeMonth: true,
//            changeYear: true,
//            showButtonPanel: true
//        });
//        t.find('.ds_time').timepicker();
//        t.find(".date_picker").datetimepicker({
//            language: 'zh-CN', format: 'yyyy-mm-dd hh:ii', todayBtn: 1, todayHighlight: 1, autoclose: 1, weekStart: 1, startDate: new Date(), minuteStep: 5
//        }).on("changeDate", function () {
//                handler.customer.changeTimeColor(t);
//        });
        t.find(".done_marker").mouseover(function(){
            var p=$(this).closest(".current_name");
            var e=$(this).find(".tip-container");
            p.addClass("hovered");
            e.delay(500).queue(function(i) {
                return p.hasClass("hovered") ? (e.css("opacity", 0), e.show(), e.animate({
                        opacity: 1
                    },
                    100,
                    function() {
                        return p.hasClass("hovered") ? void 0 : e.hide
                    }), i()) : i()
            })
        }).mouseout(function(){
            var p=$(this).closest(".current_name");
            p.removeClass("hovered");
            $(this).find(".tip-container").stop().hide();
        });

        t.find(".change_date select[name=change_date_type]").change(function() {
            var date=t.find(".change_date input[name=notifyTime_date]");
            var time=t.find(".change_date input[name=notifyTime_time]");
            var cdate = new Date();
            var currentDate = dateParse(cdate);
            var currentTime =timeParse(cdate);
            var defaultTime="09:00";
            var i=$(this).val();
            switch (i) {
                case "date":
                    date.val("");
                    time.val("");
                    break;
                case "half":
                    date.val(currentDate);
                    time.val(timeCompute(30));
                    break;
                case "hour":
                    date.val(currentDate);
                    time.val(timeCompute(60));
                    break;
                case "tomorrow":
                    date.val(dateCompute(1));
                    time.val(defaultTime);
                    break;
                case "aftertomorrow":
                    date.val(dateCompute(2));
                    time.val(defaultTime);
                    break;
                case "week":
                    date.val(dateCompute(3));
                    time.val(defaultTime);
                    break;
                case "2week":
                    date.val(dateCompute(14));
                    time.val(defaultTime);
                    break;
                case "month":
                    date.val(dateCompute(30));
                    time.val(defaultTime);
                    break;
                default:
                    date.val(i);
            }
        });
        resizeRightContent(pane);
    },
    initBaseView:function(data,parent,menu,callback){
        handler.customer._initCustomerNullFields(data);
        handler.customer._setCustomerSysField(data);
        var _basePane=parent.find(".baseinfo");
        _basePane.empty();
        parent.find("#tmpl_contact_baseinfo").tmpl(data).appendTo(_basePane);
        var o = parent.find(".user-details");
        var l = o.find(".more-info");
        o.find(".expandable").size() > 0 ? ($(".expandable").hide(), l.find("a")
            .click(function () {
                return l.find(".more, .less, .small-note")
                    .toggleClass("hidden2"), o.find(".expandable").toggle()
            })) : l.remove();

        var my_customer_menu = ['my_action', 'my_new_customer', 'my_all_customer'];
        if($.inArray(menu, my_customer_menu)!=-1) {
            _basePane.find(".customer_owner_giveup").show();
        }else{
            _basePane.find(".customer_owner_giveup").remove();
        }
        _basePane.find(".customer_owner_use").remove();
        handler.customer.getStatusDic(data.dbType,parent);

       if(!isHasFunc("func_not_update_customer_status")){
            updateFun(".edit_status");
        }else if(!isHasFunc("func_not_update_customer_increase")){
            updateFun(".edit_source");
        }

       function updateFun(updateStr) {
           parent.find(updateStr+" .submenu_trigger").click(function(e) {
                e.stopPropagation();
                if (parent.find(updateStr+" .submenu").css("display") == 'none') {
                    parent.find(updateStr+" .submenu_trigger").addClass("open");
                    parent.find(updateStr+" .submenu").css({
                        display : 'block'
                    });
                } else {
                    parent.find(updateStr+" .submenu_trigger").removeClass("open");
                    parent.find(updateStr+" .submenu").css({
                        display : 'none'
                    });
                }
            });
        } 

        handler.customer._registerOwnerEvent(data,_basePane);

        if(typeof callback =='function'){
            callback(data);
        }
    },
    initBaseNewView:function(data,menu,flag,callback){
        //console.info("initBaseNewView=========="+menu);
        var pane=$("#"+menu+"_"+flag);
        var parent=pane.find(".customer_container");
        //外呼任务座席
        if(flag == "agentCustInfo"){
            pane=$("#agent_save_or_update_info");
            pane.find(".task_intrbg").remove();
            parent=pane.find(".customer_container");
        }
        if(flag == "agentCalledCustInfo"){
            pane=$("#agent_called_task_info");
            parent=pane.find(".customer_container");
        }

        //console.dir(parent);
        var proviceDesc=handler.customer.showFieldDesc('province',data.province);
        var cityDesc=handler.customer.showFieldDesc('city',data.city,true,data);
        var area=proviceDesc+cityDesc;
        if(proviceDesc==cityDesc){
            area=proviceDesc;
        }
        data.areaDesc=area;

        handler.customer._initCustomerNullFields(data);
        handler.customer._setCustomerSysField(data);
        var _basePane=parent.find(".baseinfo");
        DS.getView('customer/customer_channel_base',function(view){
            view = view.replace(/_#flag#_/g, flag);
            template.helper("custShowFieldDesc",handler.customer.showFieldDesc);
            template.helper("isHasFunc",isHasFunc);
            template.helper("checkMobile",checkMobile);
            template.helper("checkHideTel",checkHideTel);
            var render = template.compile(view);
            _basePane.find(".base_summary").html(render(data));
            
            //回收倒计时
            var countdowntime = data.recoveryTime||0;
            var stop;
            //clearInterval(stop);
            if(countdowntime>0){
                var interval =1000,
                container = _basePane.find('.count_down_time_container');
                //handler.customer.showCountDown(container,countdowntime,'count_down_time');
                
                var phoneBarTipOption = {placement:'bottom',trigger:'hover',html:true};
                phoneBarTipOption.title='回收倒计时';
                container.tooltip(phoneBarTipOption);
                stop = window.setInterval(function(){
                    container.find('.count_down_time').attr("ds_stop",stop);
                    if(!container.find('.count_down_time').attr('countdowntime')){
                        container.find('.count_down_time[ds_stop='+stop+']').attr('countdowntime',countdowntime);
                    }
                    var time=container.find('.count_down_time').attr('countdowntime')||countdowntime;
                    if(+time>=1){
                        handler.customer.showCountDown(container,time,'count_down_time',stop);
                    }else{
                        container.hide();
                        window.clearInterval(container.attr("ds_stop"));
                    }
                }, interval);
            }


            handler.customer.getStatusDic(data.dbType,parent);
            handler.customer.getSysStatusDic(data,parent);
            handler.customer.getSourceDic(data.dbType,parent);
            //handler.customer.getChanceIdDic(parent);
            //handler.customer.getCommonIdDic(parent);
            handler.customer.getCallPhoneDic(data,parent);
            handler.customer.getSmsDic(data,parent);
            handler.customer.getMailDic(data,parent);
            //handler.customer.getWeixinDic(data,parent);
             if(!isHasFunc("func_not_update_customer_status")){
                parent.find(".edit_status .submenu_trigger").click(function(e) {
                    e.stopPropagation();
                    var _sub=parent.find(".edit_status .submenu");
                    _sub.toggle();
                    //parent.find(".submenu_trigger").addClass("open");
                });
            }else{
               
                parent.find(".edit_status .submenu_trigger").removeClass("label2").addClass('no_change_permissions');
                parent.find(".edit_status .submenu").css({
                            display : 'none',
                });
             }

             if(!isHasFunc("func_not_update_customer_increase")){
                parent.find(".edit_source .submenu_trigger").click(function(e) {
                    e.stopPropagation();
                    var _sub=parent.find(".edit_source .submenu");
                    _sub.toggle();
                    //parent.find(".submenu_trigger").addClass("open");
                });
            }else{
               
                parent.find(".edit_source .submenu_trigger").removeClass("label2").addClass('no_change_permissions');
                parent.find(".edit_source .submenu").css({
                            display : 'none',
                });
             }

       //  if(!isHasFunc("func_not_update_customer_status")){
       //      updateFun(".edit_status");
       //  }else if(!isHasFunc("func_not_update_customer_increase")){
       //      updateFun(".edit_source");
       //  }

       // function updateFun(updateStr) {
       //     parent.find(updateStr+" .submenu_trigger").click(function(e) {
       //          e.stopPropagation();
       //          if (parent.find(updateStr+" .submenu").css("display") == 'none') {
       //               e.stopPropagation();
       //              var _sub=parent.find(".edit_status .submenu");
       //              _sub.toggle();
       //          } else {
       //              parent.find(updateStr+" .submenu_trigger").removeClass("open");
       //              parent.find(updateStr+" .submenu").css({
       //                  display : 'none'
       //              });
       //          }
       //      });
       //  } 
            parent.find(".edit_sysStatus .submenu_trigger").click(function(e) {
                e.stopPropagation();
                var _sub=parent.find(".edit_sysStatus .submenu");
                _sub.toggle();
            });

            handler.customer.showForOwner(data,parent);
            handler.customer._registerOwnerEvent(data,_basePane);
            //console.dir(data);

            var _detailPane=parent.find(".cust_detail");
            //_detailPane.html(template("tmpl_cust_detail",data));
            DS.getView('customer/custinfo_detail',function(view){
                var render = template.compile(view);
                _detailPane.html(render(data));
                var head_h=$(".main_header").outerHeight();
                var h=$(window).height();
                var h1=parent.outerHeight(true)||143;
                //console.info("h1===="+h1+" head_h===="+head_h +" h===="+h);
                _detailPane.css({top:(h1+head_h)+"px",height:(h-head_h-h1)+"px"});
                //外呼任务座席
                if(flag == "agentCustInfo" || flag =="agentCalledCustInfo"){
                    $("#combobox_cust_owner_desc").attr("id","combobox_cust_owner_desc_disableds");
                }

                _basePane.find(".btn_view_cust_detail").unbind("click");
                _basePane.find(".btn_view_cust_detail").bind("click",function(e){
                    e.stopPropagation();
                    _detailPane.toggleClass("cust_detail_toggle");
                    if(_detailPane.hasClass("cust_detail_toggle")){
                        _detailPane.animate({right:0+'px'},'fast');
                        $(this).text("详细信息>>");
                    }else{
                        _detailPane.animate({right:-735+'px'},'fast');
                        $(this).text("详细信息<<");
                    }
                });

                if(typeof callback =='function'){
                    callback(data);
                }
            });

        });
        //parent.find("#tmpl_contact_baseinfo").tmpl(data).appendTo(_basePane);
    },
    /**
     * category:
     * 1:无归属，2：主动领取公海，3:自动分配公海
     * @param data
     * @param pane
     * @private
     */
    _registerOwnerEvent:function(data,pane){
        //console.info("_registerOwnerEvent========");
        //console.dir(data)
        var normalId=handler.customer.normalId;
        var owner=data.owner;
        var oldCategoryId=data.categoryId;
        var scope=session.user.scope.customer;
        var inputItem=pane.find(".for_owner_input");
        if(isHasFunc("func_not_allow_user_edit_owner")){
            inputItem.prop("readonly",true);
            return;
        }

        if(owner){
            if (session.user.moduleUsers["customer"] != "all" && session.user.moduleUsers["customer"].indexOf(owner) == -1 ){
                if(data.owner == data.categoryId){
                    var category = getCache("custCategorys",data.categoryId);
                    if(category && category.managers.indexOf(session.user._id) == -1){
                        inputItem.prop("readonly",true);
                        return;
                    }
                }else{
                    inputItem.prop("readonly",true);
                    return;
                }
            }
        }

        var _agents=filterUserByScope('customer');
        var _categorys=filterCategoryByManager();
        var _agentAll = getCache("agents");
        var _uids=[];

        for (var i = 0; i < _agents.length; i++) {
            var obj = _agents[i];
            _uids.push(obj._id);
        }

        var _categorys2=[];
        var NA={_id:normalId,displayName:"无归属",pinyin:"",exten:'',status:'enable',category:'1'}
        if(scope=='all'||isHasFunc("func_popup_commonCust_owner")){
            _uids.push("NA");
        }
        if(scope=='all'){
            _categorys2.push(NA);
        }

        var _categoryIds=[];
        if(_categorys.length>0){
            for(var i=0;i<_categorys.length;i++){
                var obj=_categorys[i];
                var category=obj.category;
                var item={_id:obj._id,displayName:obj.cName,pinyin:"",exten:'',status:'enable'};
                if(category=='0'||category=='3'){
                    item.category='2';
                }else if(category=='4'){
                    item.category='3';
                }
                _categorys2.push(item);
                _categoryIds.push(obj._id);
            }
            _categorys=_categorys2;
        }

        var registerEvent = function(){
            var cid=data._id;
            var dbType=data.dbType;

            pane.find("#combobox_cust_owner_desc").click(function(){
                $(this).hide();
                pane.find("#combobox_cust_owner").show().focus();
            });
            pane.find("#combobox_cust_owner" ).combobox({
                minLength:0,
                displayField:pane.find("#combobox_cust_owner_desc"),
                source: function( request, response ) {
                    var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( request.term ), "i" );
                    if(request.term){
                        response( $.grep(agents, function( item ){
                            return matcher.test(item.displayName)||matcher.test(item.exten)||matcher.test(item.pinyin);
                        }) );
                    }else{
                        response(agents);
                    };
                },
                select: function( event, ui ) {
                    var owner2=ui.item._id;
                    var category2=ui.item.category||'';
                    var categoryId=oldCategoryId;
                    if(category2){
                        categoryId=owner2;
                    }
//                    var src = $(event.currentTarget);
                    if(category2=='2'||category2=='3'){
                    }else if(category2=='1'){
                    }
                    var action = {
                        action: 'app.customer.updateCustForOwner',
                        data: {_id:cid,owner:owner2,category:category2,categoryId:categoryId}
                    };
                    DS.send(action,function(rep){
                        if(rep.success){
                            pane.find("#combobox_cust_owner_desc").attr("uid",owner2);
                            //pane.find("#combobox_cust_owner_desc").attr("category",ui.item.category||"");
                            pane.find( "#combobox_cust_owner_desc" ).text(ui.item.displayName);
                            pane.find( "#combobox_cust_owner").blur();

                            var json={
                                _id:cid,
                                owner:owner2,
                                dbType:dbType,
                                categoryId:categoryId
                            };
                            dsevent.publish(dsevent.evt.customerUpdateOwner,json);
                            handler.customer.showForOwner(json,pane);
                        }else{
                            if(rep.code==='1001'){
                                $().alertmessage('showError','此状态的客户您已达到领取上限，请选择其他状态的客户领取!');
                            }else if(rep.code==='1002'){
                                $().alertmessage('showError','此客户为公海数据,若要修改请先领取该客户，或者联系管理员!');
                            }else if(rep.code==='1005'){
                                $().alertmessage('showError',"此客户处于待审核状态，若要转移归属，请等待审核完成!");
                            }else{
                                $().alertmessage('showError', rep.message || errMsg);
                            }
                        }
                    });
                    return false;
                },
                open: function(event, ui) {
                    var instance=pane.find("#combobox_cust_owner").data("custom-combobox");
                    var _owner=pane.find("#combobox_cust_owner_desc").attr("uid");
                    var val=pane.find("#combobox_cust_owner").val();
                    if(instance && !val){
                        var container=instance.menu.element;
                        container.find("li").each(function(i){
                            var _uid=$(this).attr("uid");
                            if(_uid==_owner){
//                                $(this).addClass("ui-state-focus");
                                $(this).css({'background-color':'#08c','color':'#fff'});
                                var _scrollTop=$(this).offset().top-container.offset().top+container.scrollTop();
                                container.animate({scrollTop:_scrollTop-65},"fast");
                            }
                        });
                    }
                }
            }); 
        }
        if($.inArray(owner,_uids)!=-1||$.inArray(owner,_categoryIds)!=-1|| $.inArray(owner,_agentAll)==-1){
            var agents=[];
            if(_categorys.length>0){
                agents=_categorys;
            }
            if(_agents.length>0){
                agents=agents.concat(utils.loadUsers(true,false));
            }
            registerEvent();
        }else{
            pane.find("#combobox_cust_owner_desc").removeClass("label2");
        }
    },
    loadCustItem:function(item,menu,/*customer,customermanage,business,popup,popupMail*/flag,busId,popupId,callback){
        //console.info("menu===="+menu+" "+"flag===="+flag);
        var pane=$("#"+menu+"_"+flag);
        pane=pane.find(".customer_container");

        //外呼任务座席
        if(flag == "agentCustInfo"){
            pane=$("#agent_save_or_update_info");
            pane.find(".task_intrbg").remove();
            pane=pane.find(".customer_container");
        }
        if(flag == "agentCalledCustInfo"){
            pane=$("#agent_called_task_info");
            pane=pane.find(".customer_container");
        }
        //if(flag=='popupMail'||flag=='popupWeixin'||flag=="relocationMail"||flag=="relocationWeixin" || flag=='popupWebchat'|| flag=='relocationWebchat'){
        //    pane=pane.find(".customer_container");
        //}
        var cid=item._id;
        var base=pane.find(".baseinfo");
//        var action=pane.find(".next-action-form");
        var history=pane.find(".active-history");
//        var task=pane.find(".business-info");

        if(flag=='customer'){
            handler.customer.initBaseNewView(item,menu,flag,callback);
            //handler.customer.initBaseView(item,pane,menu);
            //handler.customer.initHistory(item,pane);
        }else if(flag=='business'){
            handler.customer.initBaseNewView(item,menu,flag,callback);
//            action.hide();
//            handler.customer.initBaseView(item,pane);
//            handler.customer.initHistory(item,pane,busId);
        }else if(flag=='approval_business'){
            handler.customer.initBaseNewView(item,menu,flag,callback);
//            action.hide();
//            handler.customer.initBaseView(item,pane);
//            handler.customer.initHistory(item,pane,busId);
        }else if(flag=='popup'){
            handler.customer.initBaseNewView(item,menu,flag,callback);
//            action.hide();
//            handler.customer.initBaseView(item,pane);
//            handler.customer.initHistory(item,pane,busId);
//            if(popupId && popupId!='business'){
//                handler.callRecord.showCallRecordInCustomer(cid,task,menu,popupId,item.name);
//            }else{
////                handler.task.showTaskInCustomer(cid,task,menu,busId);
//                handler.business.loadTaskInfo(task,menu,cid,busId,menu,popupId);
//            }

        }else if(flag=='customerLeak'){
//            action.hide();
            handler.customer.initBaseView(item,pane);
            handler.business.loadTaskInfo(task,menu,cid,busId,menu,popupId);
            handler.customer.initHistory(item,pane,busId);
        }else if(flag=='popupMail'||flag=='popupWeixin'||flag=="relocationMail"||flag=="relocationWeixin"){
//            action.hide();
            handler.customer.initBaseView(item,pane);
//            handler.business.loadTaskInfo(task,menu,cid,busId,menu,popupId,flag);
            handler.customer.initHistory(item,pane,busId);
        }else if(flag=="popupWebchat"||flag=='relocationWebchat'||flag=="relocationCall"){
            handler.customer.initBaseNewView(item,menu,flag,callback);
        }else if(flag == "agentCustInfo" || flag == "agentCalledCustInfo"){ //外呼任务座席
            handler.customer.initBaseNewView(item,menu,flag,callback);
        }
    },
    imLocateCustSaveMultiChannelHistory: function(data){
        var action = {
            action: 'config.channel.updateMultiChannelHistoryForLocateCust',
            data: data
        };
        DS.send(action,function(response){
            //console.log(response);
            if(response.success){
            }else{
            }
        });
    },
    /**
     * interface
     * @param cId
     * @param menu

     * @param flag customer,customermanage,business,popup,popupMail
     * @param busId
     */
    loadCustInfo:function(cId,menu,flag,data,popupId,callback){
        var parent=$("#contact_list_"+menu);
        var pane=$("#"+menu+"_"+flag);
        pane=pane.find(".customer_container");
        //if(flag=='popupMail'|| flag=='popupWeixin'||flag=="relocationMail"||flag=="relocationWeixin"|| flag=='popupWebchat'|| flag=='relocationWebchat'||flag=="relocationCall"){
        //    pane=pane.find(".customer_container");
        //}
        //var url='customer/custinfo';
        //外呼任务座席
        if(flag == "agentCustInfo"){
            pane=$("#agent_save_or_update_info");
            pane.find(".task_intrbg").remove();
            pane=pane.find(".customer_container");
        }
        if(flag == "agentCalledCustInfo"){
            var calledPane = $("#agent_called_task_info");
            calledPane.empty();
            var html =  '<div class="customer_container clearfix">'
                        +'</div>'
                        +'<div class="cust_tab_content"><div class="cust_tab_content_other"></div> <div class="cust_tab_content_bus"></div>'
                        +' </div>';
            calledPane.append(html);
            pane=calledPane.find(".customer_container");
        }



        var url='customer/custinfo_tab';
        if(flag=='popupWebchat'||flag=='relocationWebchat'){
            url='customer/custinfo_channel';
        }else if(flag=="relocationCall"){
            url='customer/custinfo_channel_cdr';
        }else if(flag=="business"){
            url='customer/custinfo_tab_business';
        }else if(flag=="popup"){
            url='customer/custinfo_tab_popup';
        }else if(flag=="agentCalledCustInfo"){
            url='customer/task/agent_task_called_info';
        }else if(flag =="approval_business"){
            url='customer/custinfo_tab_approval_business';
        }

        DS.getView(url,function(view){
            if(flag=='popupWebchat'||flag=='relocationWebchat'||flag=="relocationCall") {
               if(flag=="relocationCall"){
                    var menus = menu.split("__")[0];
                    view = view.replace(/_#custId#_/g, cId);
                    view = view.replace(/_#CALL_SHEET_ID#_/g, menus);
                }else{
                    view = view.replace(/_#custId#_/g, cId);
                    view = view.replace(/_#CALL_SHEET_ID#_/g, menu);
                }
            }else{
                view=view.replace(/_#menu#_/g,menu);
                view=view.replace(/_#custId#_/g,cId);
            }
            if(flag=="agentCalledCustInfo"){
                view=view.replace(/_#sampleId#_/g,data);
            }

            if(flag=='business'){
                view=view.replace(/_#busId#_/g,data);
            }
            if(flag=='approval_business'){
                view=view.replace(/_#busId#_/g,data);
            }
            pane.html(view);
            var action = {
                action: 'app.customer.queryCustInfo',
                data: {_id: cId}
            };
            DS.send(action,function(response){
                if(response.success){
                    var item=response.data;
                    if(data==="custDetail"){
                        handler.customer.custDetail=item;
                    }
                    
                    //item.channelId=menu;
                    //parent.find('.refresh').click();
                    
                    handler.customer.loadCustItem(item,menu,flag,data,popupId,callback);
                    if(response.isRead=="notify"){
                        var json={
                            _id:cId
                        };
                        dsevent.publish(dsevent.evt.customerRefreshIsRead,json);
                    }
                }else{
                    if(response.code=='404'&& (flag=='business' || flag== "approval_business" )){//for del customer
                        handler.customer.loadNoCustItem(cId,menu,flag,callback);
                    }else{
                        $().alertmessage('showError', errMsg);
                    }
                }
            });
        });
    },
    showCustDetail:function(data,src){
        var pane=src.closest(".contact_summary");
        pane.find(".cust_detail").animate({right:0+'px'},'slow');
    },
    showShortBatchNo:function(batchNo){
        if(batchNo && batchNo.length>14){
            batchNo=batchNo.substring(0,14)+"...";
        }
        return batchNo;
    },
    _initCustomerNullFields:function(item){
        if(!item.email){
            item.email=[];
        }
        if(!item.weixin){
            item.weixin=[];
        }
        if(!item.title){
            item.title="";
        }
        if(!item.owner){
            item.owner="NA";
        }
        if(!item.phone){
            item.phone=[];
        }
        if(!item.batchNo){
            item.batchNo="";
        }
        if(!item.attachs){
            item.attachs=[];
        }
    },
    _setCustomerSysField:function(item){
        if(item.batchNo){
            var batchObj = {n:"导入批次",v:item.batchNo||'',t:"",k:"batchNo"};
            item.fields.push(batchObj);
        }
        //var ownerDesc='';
        //if(item.owner && getCache('agents',item.owner)){
        //    ownerDesc= getCache('agents',item.owner).displayName;
        //}
        //var owner = {n:"所属人",v:ownerDesc||'',t:"",k:"owner"};
        var createTime = {n:"创建时间",v:item.createTime||'',t:"",k:"createTime"};
        var lastUpdateTime = {n:"最近更新时间",v:item.lastUpdateTime||'',t:"",k:"lastUpdateTime"};
        var lastContactTime={n:"最近联系时间",v:item.lastContactTime||'',t:"",d:"lastContactTime"};
//        item.fields.push(owner);
        item.fields.push(createTime);
        item.fields.push(lastUpdateTime);
        item.fields.push(lastContactTime);
        //外呼任务信息
        /*        if(item.taskId){
         var taskId = {n:"外呼任务名称",v:item.taskId||'',t:"",k:"taskId"};
         item.fields.push(taskId);
         if(!item.taskCalled){
         item.taskCalled = "2";
         }
         var dialStatus = {n:"拨打状态",v:item.taskCalled||'',t:"",k:"taskCalled"};
         item.fields.push(dialStatus);
         }*/

//        item.fields.push(lastContactTime);
//        console.dir(item);
    },
    getStatusDic:function(dbType,parent){
        var ary=getCache('custTmpls',dbType).status;
        var html = ['<li class="note change_contact_status">设置状态为:</li>'];
        for (var i in ary) {
            html.push('<li><a class="'+i+'" href="#'+i+'">'+ary[i]+'</a></li>');
        }
        var p=parent;
        p.find(".edit_status .submenu").html(html.join(""));
        p.find(".edit_status .submenu a").click(function(){
            var a = $(this),status = a.attr("href").substr(1);
            p.find(".edit_status .submenu_trigger").click();
            var cid=p.find("input[name=customerId]").val();
            var action = {
                action: 'app.customer.updateCustomerStatusOrSource',
                data: {_id:cid,status:status}
            };
            DS.send(action,function(rep){
                if(rep.success){
                    p.find(".edit_status .submenu_trigger").attr({title:ary[status],class:"submenu_trigger label2 form_closed contact_status "+status});
                    p.find(".edit_status .submenu_trigger").html(ary[status]);

                    var json={
                        _id:cid,
                        status:status,
                        dbType:dbType
                    };
                    dsevent.publish(dsevent.evt.customerUpdateStatus,json);
                }else{
                   if(rep.code==='1002'){
                        $().alertmessage('showError','此客户为公海数据,若要修改请先领取该客户，或者联系管理员!');
                    }else{
                       $().alertmessage('showError', rep.message || errMsg);
                   }

                }
            });
        });
    },

    getSysStatusDic:function(dbType,parent){
        var cid=parent.find("input[name=customerId]").val();
        var cname=parent.find(".major").attr("title");
        var categoryId=parent.find("input[name=categoryId]").val();
        var status=parent.find("input[name=status]").val();
        var sysStatus=parent.find("input[name=sysStatus]").val();
        var sourceOwner=parent.find("input[name=sourceOwner]").val();
        var html = [];
        html.push('<li class="note change_contact_status">设置状态为：</li>');
        if (sourceOwner != session.user._id){ //所属人不是自己的不能提交
            //禁用下拉框
            $(".edit_sysStatus").removeClass("edit_sysStatus");
        }else if(sysStatus != "0" && sysStatus != "1" && sysStatus != "3" && sysStatus!="10" && sysStatus!="11"){  //除了默认跟进成单和续费状态,其他禁用
            //禁用下拉框
            $(".edit_sysStatus").removeClass("edit_sysStatus");
        }else if(sysStatus == "3"){
            html.push('<li><button style="color:#000;" type="button" class="btn btn-link btn-small ds_do_action red"  ds_action="customer.changeSysStatus" ds_data="8,'+cid+','+ categoryId+','+cname+',' + sysStatus+',' + sourceOwner+',' + status+'">续费</button></li>');
        }else if(sysStatus == "10"){
            html.push('<li><button style="color:#000;" type="button" class="btn btn-link btn-small ds_do_action "  ds_action="customer.changeSysStatus" ds_data="2,'+cid+',' + categoryId+','+cname+',' + sysStatus+',' + sourceOwner+',' + status+'">无效</button></li>');
            html.push('<li><button style="color:#000;" type="button" class="btn btn-link btn-small ds_do_action " ds_action="customer.changeSysStatus" ds_data="4,'+cid+','+ categoryId+','+cname+',' + sysStatus+',' + sourceOwner+',' + status+'">丢单</button></li>');
            html.push('<li><button style="color:#000;" type="button" class="btn btn-link btn-small ds_do_action " ds_action="customer.changeSysStatus" ds_data="3,'+cid+','+ categoryId+','+cname+',' + sysStatus+',' + sourceOwner+',' + status+'">成单</button></li>');
        }else if(sysStatus == "11"){
            html.push('<li><button style="color:#000;" type="button" class="btn btn-link btn-small ds_do_action red"  ds_action="customer.changeSysStatus" ds_data="8,'+cid+','+ categoryId+','+cname+',' + sysStatus+',' + sourceOwner+',' + status+'">续费</button></li>');
        }else{
            html.push('<li><button style="color:#000;" type="button" class="btn btn-link btn-small ds_do_action "  ds_action="customer.changeSysStatus" ds_data="2,'+cid+',' + categoryId+','+cname+',' + sysStatus+',' + sourceOwner+',' + status+'">无效</button></li>');
            html.push('<li><button style="color:#000;" type="button" class="btn btn-link btn-small ds_do_action " ds_action="customer.changeSysStatus" ds_data="4,'+cid+','+ categoryId+','+cname+',' + sysStatus+',' + sourceOwner+',' + status+'">丢单</button></li>');
            html.push('<li><button style="color:#000;" type="button" class="btn btn-link btn-small ds_do_action " ds_action="customer.changeSysStatus" ds_data="3,'+cid+','+ categoryId+','+cname+',' + sysStatus+',' + sourceOwner+',' + status+'">成单</button></li>');
        }
        var p=parent;
        p.find(".edit_sysStatus .submenu").html(html.join(""));
        $("body").click(function(){
            $(".clientSystem-settings").hide();
        });
    },
    getSourceDic:function(dbType,parent){
        var ary=getCache('custTmpls',dbType).source||[];
        if(ary.length>0){
            if(!isHasFunc("func_not_update_customer_increase")){
            parent.find(".edit_source .submenu_trigger a").click(function(e) {
                e.stopPropagation();
                var _sub=parent.find(".edit_source .submenu");
                _sub.toggle();
            });
        }else{
               
            parent.find(".edit_source .submenu_trigger").removeClass("label2").addClass('no_change_permissions');
            parent.find(".edit_source .submenu").css({
                        display : 'none',     
            });
        }

            var html = ['<li class="note change_contact_status">设置来源为:</li>'];
            for(var i=0;i<ary.length;i++){
                var obj=ary[i];
                html.push('<li><a href="#'+obj.key+'">'+obj.name+'</a></li>');
            }
            var p=parent;
            p.find(".edit_source .submenu").html(html.join(""));
            p.find(".edit_source .submenu a").click(function(){
                var a = $(this),source1 = a.attr("href").substr(1);
                var txt= a.text();
                p.find(".edit_source .submenu_trigger").click();
                var cid=p.find("input[name=customerId]").val();
                var action = {
                    action: 'app.customer.updateCustomerStatusOrSource',
                    data: {_id:cid,custsource1:source1}
                };
                DS.send(action,function(rep){
                    if(rep.success){
                        p.find(".edit_source .submenu_trigger").attr({title:txt});
                        p.find(".edit_source .submenu_trigger").html(txt);
                        //var json={
                        //    _id:cid,
                        //    status:status,
                        //    dbType:dbType
                        //}
                        //dsevent.publish(dsevent.evt.customerUpdateStatus,json);
                    }else{
                        if(rep.code==='1002'){
                            $().alertmessage('showError','此客户为公海数据,若要修改请先领取该客户，或者联系管理员!');
                        }else{
                            $().alertmessage('showError', rep.message || errMsg);
                        }
                    }
                });
            })
        }
    } ,

    getWeixinDic:function(data,parent){
        var ary=data.weixin||[];
        var len=ary.length;
        if(len>0){
                parent.find(".view_cust_weixin").hover(function(e) {
                    e.stopPropagation();
                    var _sub=parent.find(".view_cust_weixin .submenu");
                    $(".submenu").hide();
                    _sub.toggle();
                },function(){
                    $(".submenu").hide();
                });

                var html = [];
                for(var i=0;i<ary.length;i++){
                    var obj=ary[i];
                    if(!obj.memo){
                        obj.memo="微信"+(i+1);
                    }
                    var _html=handler.customer.showWeixinInfo(obj.num,obj.memo);
                    html.push('<li>'+_html+'</li>');
                }
                var p=parent;
                p.find(".view_cust_weixin .submenu").html(html.join(""));
                p.find(".view_cust_weixin .submenu a").click(function(){
                    p.find(".view_cust_weixin .submenu_trigger").click();
                });
        }
    } ,
    getMailDic:function(data,parent){
        var ary=data.email||[];
        var len=ary.length;
        if(len>0){
                parent.find(".view_cust_mail").hover(function(e) {
                    e.stopPropagation();
                    var _sub=parent.find(".view_cust_mail .submenu");
                    $(".submenu").hide();
                    _sub.toggle();
                },function(){
                    $(".submenu").hide();
                });

                var html = [];
                for(var i=0;i<ary.length;i++){
                    var obj=ary[i];
                    var mail=obj.email;
                    var desc=mail;
                    if(obj.memo){
                        desc+='('+obj.memo+')';
                    }
                    var _html='<a href="#" onclick="mailTo(\''+mail+'\')">'+desc+'</a>';
                    //if(isHasMenu("nav_mail")||isHasMenu("nav_history")){
                    //    _html='<a href="#" class="ds_do_action" ds_action="callMail.showNewMailReply" ds_data="'+mail+'">'+desc+'</a>';
                    //}
                    html.push('<li>'+_html+'</li>');
                }
                var p=parent;
                p.find(".view_cust_mail .submenu").html(html.join(""));
                p.find(".view_cust_mail .submenu a").click(function(){
                    p.find(".view_cust_mail .submenu_trigger").click();
                });
        }
    } ,
    getCallPhoneDic:function(data,parent){
        var ary=data.phone||[];
        var len=ary.length;
        if(len>0){
                parent.find(".view_cust_phone").hover(function(e) {
                    e.stopPropagation();
                    var _sub=parent.find(".view_cust_phone .submenu");
                    $(".submenu").hide();
                    _sub.toggle();
                },function(){
                    $(".submenu").hide();
                });
                var html = [];
                for(var i=0;i<ary.length;i++){
                    var obj=ary[i];
                    var _num=checkHideTel(obj.tel);
                    var _tel=checkEncryptTel(obj.tel);
                    if(obj.memo){
                        html.push('<li><a href="#'+_tel+'">'+_num+'('+obj.memo+')</a></li>');
                    }else{
                        html.push('<li><a href="#'+_tel+'">'+_num+'</a></li>');
                    }
                }
                parent.find(".view_cust_phone .submenu").html(html.join(""));
                parent.find(".view_cust_phone .submenu a").click(function(){
                    var a = $(this),tel = a.attr("href").substr(1);
                    var txt= a.text();
                    parent.find(".view_cust_phone .submenu_trigger").click();
                    //var cid=parent.find("input[name=customerId]").val();
                    handler.customer.dialCust2(tel);
                })
        }
    } ,
    getSmsDic:function(data,parent){
        var ary=data.phone||[];
        var len=ary.length;
        if(len>0){
                parent.find(".view_cust_sms").hover(function(e) {
                    e.stopPropagation();
                    var _sub=parent.find(".view_cust_sms .submenu");
                    $(".submenu").hide();
                    _sub.toggle();
                },function(){
                    $(".submenu").hide();
                });
                var html = [];
                for(var i=0;i<ary.length;i++){
                    var obj=ary[i];
                    var _num=checkHideTel(obj.tel);
                    if(obj.memo){
                        html.push('<li><a href="#" class="ds_do_action" ds_action="sms.custSendSms" ds_data='+obj.tel+'>'+_num+'('+obj.memo+')</a></li>');
                    }else{
                        html.push('<li><a href="#" class="ds_do_action" ds_action="sms.custSendSms" ds_data='+obj.tel+'>'+_num+'</a></li>');
                    }

                }
                parent.find(".view_cust_sms .submenu").html(html.join(""));
        }
    } ,

    syncCustItem: function(data,pane,/*0:update,1:action,2:status,3:owner*/type) {
        var item=pane;
        if(type==0){
            if (data.status){
                item.find(".status-name").text(getCache('custTmpls',data.dbType).status[data.status]);
                item.find(".status-name").attr({"title": getCache('custTmpls',data.dbType).status[data.status],"class":"status-name "+data.status});
            }
            if(data.name){
                item.find(".major").text(data.name);
                item.find(".major").attr({"title": data.name});
            }
            if(data.title){
                item.find(".minor").text(data.title);
            }
        } else if(type==1){
            if (data.notifyTime) {
                item.find(".action_date_id").text(getNotifyDate(data.notifyTime).name);
                item.find(".action_date_id").attr({"title": data.notifyTime, "class": "action_date_id action_date " + getNotifyDate(data.notifyTime).type});
                item.find(".action_content").text(data.action+"("+getNotifyDate(data.notifyTime).displayName+")");
                item.find(".action_content").attr({"title": data.action});
            } else {
                item.find(".action_date_id").text("");
                item.find(".action_date_id").attr({"title": "", "class": "action_date_id"});
                item.find(".action_content").text("");
                item.find(".action_content").attr({"title": ''});
            }

        } else if(type==2){
            if (data.status) {
                item.find(".status-name").text(getCache('custTmpls',data.dbType).status[data.status]);
                item.find(".status-name").attr({"title": getCache('custTmpls',data.dbType).status[data.status],"class":"status-name "+data.status});
            }
        } else if(type==3){
            var _desc=handler.customer.showItemForOwner(data);
            //if (data.owner) {
            //    var _owner=getCache('agents',data.owner);
            //    if(_owner){
            //        _desc=_owner.displayName;
            //    }
            //}else{
            //    _desc='公共客户';
            //}
            item.find(".cust-owner").text(_desc);
        }
    } ,
    splitNotifyTime: function (time, flag) {
        if (time && time.length >= 16) {
            var d = time.substring(0, 10);
            var t = time.substring(11);
            if (flag == 'd') return d;
            if (flag == 't') return t;
        } else {
            return "";
        }
    },
    optionSelect: function (control, value) {
        control.find('option').each(function (i) {
            if ($(this).val() == value) {
                this.selected = true;
                return;
            } else {
                this.selected = false;
            }
        })
    } ,
    changeTimeColor:function(parent){
        parent.find("#sales_action_time").css({border:0,padding:"0"});
    } ,
    getCustomFieldDicName:function(dbType,id,key,/*dropdown,radio,checkbox*/type){
        var fields=getCache('custTmpls',dbType).custom_fields;
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
    saveCustAction:function (data,src) {
        if (src.hasClass("disabled")) return false;
        var parent=src.closest(".contact_summary");
        var e = parent.find(".next-action-form");
        var cdate=e.find("input[name='notifyTime_date']").val();
        var ctime=e.find("input[name='notifyTime_time']").val();
        var notifyTime = cdate+" "+ctime;
        var remark = e.find("input[name='remark']").val();
        var actionId= e.find('input[name="actionId"]').val();
        var cId=parent.find('input[name="customerId"]').val();
        if(!cId){
            cId=parent.find('input[name="_id"]').val();
        }
        if (!$.trim(remark)) {
            $().alertmessage('showError', "联系内容不能为空!");
            e.find("input[name='remark']").focus();
            return false;
        }
        if ($.trim(remark).length > 140) {
            $().alertmessage('showError', "联系内容最大140个汉字!");
            e.find("input[name='remark']").focus();
            return false;
        }
        if (!cdate) {
            $().alertmessage('showError', "联系日期不能为空!");
            e.find("input[name='notifyTime_date']").focus();
            return false;
        }
        if (!ctime) {
            $().alertmessage('showError', "联系时间不能为空!");
            e.find("input[name='notifyTime_time']").focus();
            return false;
        }
        src.addClass("disabled");
        var url='app.customer.addNote';
        var item={
            accountId:session.user.account,userId:session.user._id,
            remark:remark,notifyTime: notifyTime,customerId: cId
        }
        if(actionId){
            url='app.customer.updateNote';
            item._id=actionId;
        }
        var action = {
            action: url,
            data: item
        };
        DS.send(action,function(rep){
            if(rep.success){
                handler.customer.saveAfter(e,rep.data);
            }else{
                $().alertmessage('showError', errMsg);
            }
            src.removeClass("disabled");
        });
    },
    saveAfter:function(t,data){
        t.find(".cancel_button").show();
        handler.customer.toggleAction(false,t);
        t.find("select[name=change_date_type]").val("date");
        t.find("input[name='actionId']").val(data.actionId);
        t.find("input[name=default_action]").val(t.find("input[name='remark']").val());
        t.find("input[name=default_action_date]").val(data.notifyTime);
        t.find(".current_date span").text(getNotifyDate(data.notifyTime).name);
        t.find(".current_date span").attr({"title": data.notifyTime, "class": getNotifyDate(data.notifyTime).type});
        t.find(".current_name_data span").text(data.action);
        t.find(".current_date span").attr({"title": data.action});
        t.find('.actions_history').html('');
        dsevent.publish(dsevent.evt.action,data);
    },
    dealNote:function(data,src){
        var isComplete=src.hasClass("done_marker");
        var parent=src.closest(".contact_summary");
        var cId=parent.find('input[name="customerId"]').val();
        var cId=parent.find('input[name="customerId"]').val();
        if(!cId){
            cId=parent.find('input[name="_id"]').val();
        }
        var t=parent.find(".next-action-form");
        var item={};
        if(!isComplete){
            item={
                actionId:data.lastActionId,
                _id: cId,
                notifyTime: data.default_action_date,
                action: data.default_action,
                status:"0"
            }
        } else{
            item={
                actionId:data.actionId,
                _id: cId,
                notifyTime: '',
                action: '' ,
                status:"1"
            }
        }
        var action = {
            action: 'app.customer.dealNote',
            data: item
        };
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.data;
                handler.customer.dealAfter(t,isComplete);
                dsevent.publish(dsevent.evt.action,row);
            }else{
                $().alertmessage('showError', errMsg);
            }
            src.removeClass("disabled");
        });
    },
    dealAfter:function(t,isComplete){
        t.find(".cancel_button").show();
        if(isComplete){
            t.find(".actionlabel").text("下一次联系计划:");
            t.find(".cancel_button").attr({"ds_action":"customer.dealNote"});
            handler.customer.toggleAction(true,t);
            t.find("input[name='remark']").val("");
            t.find("input[name='notifyTime_date']").val("");
            t.find("input[name='notifyTime_time']").val("");
            t.find("input[name='lastActionId']").val(t.find("input[name=actionId]").val());
            t.find("input[name='actionId']").val("");
            var html='<div class="last_action"><span class="text">'+t.find("input[name=default_action]").val()+'</span></div>';
            t.find('.actions_history').html(html);
        }else{
            t.find(".actionlabel").text("联系计划:");
            t.find(".cancel_button").attr({"ds_action":"customer.actionCancel"});
            handler.customer.toggleAction(false,t);
            handler.customer.setNotifyDate(t.find("input[name='default_action_date']").val(),t);
            t.find("input[name='remark']").val(t.find("input[name=default_action]").val());
            t.find('.actions_history').html('');
            t.find("input[name='actionId']").val(t.find("input[name='lastActionId']").val());
            t.find("input[name='lastActionId']").val('');
        }
    },
    resetNotifyTime:function(pane){
        pane.find("select[name=change_date_type]").val("date");
        handler.customer.setNotifyDate(pane.find("input[name='default_action_date']").val(),pane);
    },
    actionCancel:function(data,src){
        var parent=src.closest(".contact_summary");
        handler.customer.resetNotifyTime(parent);
        handler.customer.toggleAction(false,parent);
    },
    showCustAdd:function(menu,src){/*popup interface*/
        var pane=$('#'+menu+'_customer');
        pane=pane.find(".customer_container");
        //pane.find("#view_customer_list_content").html(template("tmpl_customer_content_container",{menu:menu}));
        DS.getView('customer/customer_add',function(view){
            view=view.replace(/_#menu#_/g,menu).replace(/_#dealSrc#_/g,"customer").replace(/_#callNo#_/g,"");
            pane.empty().html(view);
            pane.siblings(".cust_tab_content").height("auto").children().empty();
            pane.siblings('.cust_tab_url').empty().height('auto');
            var o=pane.find("#icc_add_customer_dbType");
            var tmpls=getCache('custTmpls');
            if(tmpls && tmpls.length>0){
                var dbType=tmpls[0]._id;
                o.val(dbType);
                handler.customer.loadCustAddTmpl(dbType,pane);
            }
            pane.find(".btn_cancel_edit").click(function(){
                pane.empty();
                dsevent.publish(dsevent.evt.customerAddCancel);
            });
        });
    },
    showCustomerMerge : function(menu,src){
        var pane=$('#'+menu+'_customer');
        pane=pane.find(".customer_container");
        DS.getView('customer/customer_merge',function(view){
            pane.empty().html(view);
            pane.siblings(".cust_tab_content").height("auto").children().empty();
            pane.siblings('.cust_tab_url').empty().height('auto');
            var custA = handler.customer.mergeCustomerA;
            var custB = handler.customer.mergeCustomerB;
            if(custA){
                $("#mergeCustomerA").val(custA.name);
            }
            if(custB){
                $("#mergeCustomerB").val(custB.name);
            }
        });

        pane.find(".btn_cancel_edit").click(function(){
            pane.empty();
            dsevent.publish(dsevent.evt.customerAddCancel);
        });
    },
    selectMergeCustomer : function(customerId,mergeType){
        var modal=$("#show_popup_location_cust_Modal");
        var action = {
            action: 'app.customer.queryCustInfo',
            data: {_id: customerId}
        };
        DS.send(action,function(response){
            if(response.success){
                modal.modal("hide");
                handler.customer[mergeType] = response.data;
                $("#"+mergeType).val(response.data.name).siblings("span[for="+mergeType+"]").html(response.data.name);

            }else{
                modal.modal("hide");
                $().alertmessage('showError',response.message);
            }
        });
    },
    mergePreview : function (){
        var custA = $.extend(true,{}, handler.customer.mergeCustomerA);
        var custB = $.extend(true,{}, handler.customer.mergeCustomerB);
        if(custA._id && custB._id){
            if(custA._id == custB._id){
                alert("相同用户不能合并!");
             return false;
            }

            //清空客户中的合并属性
            delete custA.custAId;
            delete custA.custBId;
            delete custB.custAId;
            delete custB.custBId;
            //
            var tmpl = getCache('custTmpls')[0];
            var qid=uuid.v1();
            tmpl.qiniuId=qid;
            var owner=custB.owner;
            var pane = $("#mergeCustomerInfo");
            pane.empty();
            tmpl.custId = custB._id;
            tmpl.custAId = custA._id;
            $("#tmpl_custmanage_merger").tmpl(tmpl).appendTo(pane);
            handler.customer._initQiniuCustomerMergeUpload(qid,pane);
            pane.find('.date_picker').datepicker({
                changeMonth: true,
                changeYear: true,
                showButtonPanel: true
            });
            var html=generateCCOptions(proviceCityDicKey);
            pane.find("select[name='province']").html(html);
            handler.customer.renderCustMerge($("#mergeCustomerDiv").show().find(".mergeCustForm"),custA,custB,pane);
            handler.customer._initMergeView(pane,tmpl,custA,custB);
            var menu=pane.find(".edit_customer").attr("menu")||"";
            var container = $("#mergeCustomerDiv");

            //修改归属
            if(custB.owner == "NA" && custB.owner.categoryId == "NA"){
                custB.owner = custA.owner;
                custB.categoryId = custA.categoryId;
            }

            utils.loadForOwnerComboBox("update",container,custB);
            //set owner name
            var agentName=handler.customer.showAllForOwnerDesc(custB);
            if(agentName){
                $("#mergeCustomerDiv").find(".for_owner_input").val(agentName);
            }

            if(isHasFunc("func_not_update_customer_fields")){
                handler.customer.renderCustNoUpdate(pane);
            }
            $("#mergeCustomerDiv .btn_cancel_edit").click(function(){
                pane.empty();
                $("#mergeCustomerDiv").hide();
                dsevent.publish(dsevent.evt.customerAddCancel);
            });
        }else{
            alert("请您先指定要合并的客户");
        }
    },
    _initMergeView : function(pane,tmpl,custA,custB){
        var stableFields = tmpl.stable_fields;
        var customFields = tmpl.custom_fields;
        var stableIndex = 0;
        var customIndex = 0;
        for(var i in stableFields){
            var field = stableFields[i];
            if(field.name == "name" || field.name == "web" || field.name == "title"){
                if(custB[field.name]){
                    pane.find("input[name="+field.name+"]").val(custB[field.name]);
                }else{
                    pane.find("input[name="+field.name+"]").val(custA[field.name]);
                }
            }else if (field.name =="address" || field.name =="note" ){
                if(custB[field.name]){
                    pane.find("textarea[name="+field.name+"]").val(custB[field.name]);
                }else{
                    pane.find("textarea[name="+field.name+"]").val(custA[field.name]);
                }
            }
            stableIndex++;
        }
        for(var i in customFields){
            var field = customFields[i];
            if(custB[field.name]){
                pane.find("input[name="+field.name+"]").val(custB[field.name]);
            }else{
                pane.find("input[name="+field.name+"]").val(custA[field.name]);
            }
            customIndex++;
        }
    },
    loadCustAddTmpl:function(dbType,pane){
        var tmpls = getCache('custTmpls',dbType);
        var parent=pane.find("#icc_add_customer_customerAddDiv");
        parent.empty();
        if(tmpls){
            var qid=uuid.v1();
            tmpls.qiniuId=qid;
            pane.find("#tmpl_custmanage_add").tmpl(tmpls).appendTo(parent);
            handler.customer._initQiniuCustomerUpload(qid,parent);
            pane.find('.date_picker').datepicker({
                changeMonth: true,
                changeYear: true,
                showButtonPanel: true
            });
            var html=generateCCOptions(proviceCityDicKey);
            parent.find("select[name='province']").html(html);
            //load user
            var menu=pane.find("input[name='callId']").val()||"";
//            console.info("menu===="+menu);
            //utils.loadAgentComboBox(inputId,containerId,{width:"140",height:"17"},true,null,editOwner);
            utils.loadForOwnerComboBox("add",parent,{});
            //set owner name
            var agentName="";
            var agents=getCache("agents");
            var currentUid=session.user._id;
            for(var i=0;i<agents.length;i++){
                var u=agents[i];
                if(currentUid== u._id){
                    agentName= u.displayName;
                    break;
                }
            }
            //set default owner
            if(isHasFunc("func_cust_owner_empty")){
                pane.find(".edit_customer").find(".for_owner_id").val(handler.customer.normalId);
                pane.find(".edit_customer").find(".for_owner_input").val("无归属");
            }else{
                if(agentName){
                    pane.find(".edit_customer").find(".for_owner_id").val(currentUid);
                    pane.find(".edit_customer").find(".for_owner_input").val(agentName);
                }
            }
            //var hiddenPhone = pane.find("input[name='callTel']").val();
            //if(hiddenPhone){
            //    pane.find('input[name="tel[]"]:first').val(hiddenPhone);
            //}
        }
    },
    getCustDbType:function(obj,src,/*default*/val,/*0 or 1*/selected){
        var tmls=getCache('custTmpls');
        var ary=[];
        for(var i=0 ; i<tmls.length;i++){
            ary.push({k:tmls[i]._id,n:tmls[i].name});
        }
        handler.customer.generateOptions(obj,ary,val,selected);
    } ,
    showCategoryIdDic:function(node,val,selected,menu){
        var ary = [];
        var cateGorys = getCache("custCategorys");
        if(cateGorys.length>0){
            var userId = session.user._id;
            for(var i =0;i<cateGorys.length;i++){
                var m = cateGorys[i];
                var managers = m.managers;
                var members = m.members;
                if(menu=="customer_seas"){
                    var category = m.category;
                    if(category=="0"||category=="3"){
                        ary.push({n: m.cName,k: m._id});
                    }
                }else{
                    ary.push({n: m.cName,k: m._id});
                }
            }
        }
        handler.customer.generateOption2(node,ary,val,selected);
    },
    getOptionDic:function(dbType,type,node,val,selected ){
        var dic=getCache('custTmpls',dbType);
        var ary=[];
        if(type=='status'){
            ary=dic.status;
        }else if(type=='source'){
            ary=dic.source;
        }
        handler.customer.generateOptions(node,ary,val,selected);
    },
    generateOptions: function (obj, ary, val, selected) {
        if ($.isArray(ary)) {
            var len = ary.length;
            for (var i = 0; i < len; i++) {
                var o = document.createElement("OPTION");
                obj.options.add(o);
                o.innerText = ary[i].n;
                o.value = ary[i].k;
                if (val) {
                    if (o.value == val)
                        o.selected = true;
                } else {
                    if (!selected) {
                        if (i == 0) o.selected = true;
                    }
                }

                if (len == 1) o.selected = true;
            }
        } else{
            for(var key in ary){
                var o = document.createElement("OPTION");
                obj.options.add(o);
                o.innerText = ary[key];
                o.value = key;
                if (val) {
                    if (o.value == val)
                        o.selected = true;
                } else {
                    if (!selected) {
                        if (i == 0) o.selected = true;
                    }
                }

                if (len == 1) o.selected = true;
            }
        }
    },
    generateOption2: function (obj, ary, val, selected) {
        if ($.isArray(ary)) {
            var len = ary.length;
            for (var i = 0; i < len; i++) {
                var o = document.createElement("OPTION");
                obj.options.add(o);
                o.innerText = ary[i].n;
                o.value = ary[i].k;
                if (val) {
                    if (o.value == val)
                        o.selected = true;
                } else {
                    if (!selected) {
                        if (i == 0) o.selected = true;
                    }
                }
            }
        }
    },
    showCustUpdate:function(menu,src){
        var pane=src.closest(".contact_summary");
        var container=pane.find(".baseinfo");
        var cid=container.find('input[name=customerId]').val();
        var dbType=container.find('input[name=dbType]').val();
        DS.getView('customer/customer_update',function(view){
            container.empty();
            view=view.replace(/_#id#_/g,cid).replace(/_#menu#_/g,menu);
            container.html(view);
            if(isHasFunc("func_nodelete_customer")){
                var _obj=container.find(".func_hide");
                if(_obj){
                    _obj.remove();
                }
            }else{
                container.find(".func_hide").show();
            }
            pane.find(".dbType").text(getCache('custTmpls',dbType).name);
            pane.find(".btn_cancel_edit").click(function(){
                handler.customer.loadCustBaseInfo(cid,pane,menu);
            });

            handler.customer.loadCustUpdateTmpl(cid,dbType,container);
        });
    },
    loadCustBaseInfoNew:function(cId,menu,flag){
        var action = {
            action: 'app.customer.queryCustInfo',
            data: {_id:cId}
        };
        DS.send(action,function(response){
            if(response.success){
                var item=response.data;
                if(flag=='dialPopup'){
                    var pane=$("#sys_dialPopup");
                    handler.customer.loadDialCustInfo(item,pane,function(){
                        //pane.find(".func_tab.active").click();
                        var _pane=$('#batch_modal');
                        _pane.find(".modal-body").empty();
                        _pane.modal("hide");
                    });
                }else{
                    handler.customer.initBaseNewView(item,menu,flag,function(){
                        var pane=$('#batch_modal');
                        pane.find(".modal-body").empty();
                        pane.modal("hide");
                    });
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    //合并客户使用
    _initQiniuCustomerMergeUpload:function(cid,pane){
        //var pane=$('#view_customer_list_content');
        var containerId= cid+'-customer-qiniu';
        var progressId= cid+'-fsUploadProgress';
        var uploader = Qiniu.uploader({
            runtimes: 'html5,flash,html4',
            browse_button: cid+'-pickCustomerFiles',
            multi_selection:true,
            container:containerId,
            drop_element: containerId,
            max_file_size: '10mb',
            flash_swf_url: '/javascripts/qiniu/plupload/Moxie.swf',
            dragdrop: true,
            chunk_size: '4mb',
            uptoken_url: '/action?action=app.weixin.getUptoken&data={}&sessionId=' + session.id,
            domain: qiniu7moorDomain,
            unique_names: false,
            save_key: false,
            auto_start: true,

            init: {
                'FilesAdded': function(up, files) {
                    pane.find(".customer_attach_container").show();
                    plupload.each(files, function(file) {
                        var progress = new FileProgress(file, progressId,"customer");
                        progress.setStatus("等待...");
                    });

                },
                'BeforeUpload': function(up, file) {
                    var progress = new FileProgress(file, progressId,"customer");
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    if (up.runtime === 'html5' && chunk_size) {
                        progress.setChunkProgess(chunk_size);
                    }
                },
                'UploadProgress': function(up, file) {
                    var progress = new FileProgress(file, progressId,"customer");
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    progress.setProgress(file.percent + "%", up.total.bytesPerSec, chunk_size);
                },
                'UploadComplete': function(evt,info) {
                    $().alertmessage('showSuccess', "文件上传成功");
                    //$("#customer_files").hide(3000);
                    //console.dir(evt);
                    pane.find(".customer_attach_container").hide();
                    pane.find(".customer_attach_container").find("tbody").empty();
                },
                'FileUploaded': function(up, file, info) {
                    var progress = new FileProgress(file, progressId,"customer");
                    var trueName = file.name;
                    up.trueName = trueName;
                    //console.info("FileUploaded=========");
                    //console.dir(up)
                    //console.dir(file)
                    //console.dir(info)
                    progress.setComplete(up, info,"customer");

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
                    var data={fileId:fileName,trueName:trueName,suffix:'other',isNew:"1"};
                    var ul=pane.find(".thumbnails_customer");
                    var imgTypes=["jpg","jpeg",'gif','png',"bmp"];
                    var suffix=trueName.substring(trueName.lastIndexOf(".")+1);
                    suffix=suffix.toLowerCase();
                    if($.inArray(suffix,imgTypes)!=-1){
                        data.suffix='img';
                    };

                    ul.append($("#tmpl_customer_merge_attach").tmpl(data));
                },
                'Error': function(up, err, errTip) {
                    pane.find(".customer_attach_container").show();
                    var progress = new FileProgress(err.file, progressId);
                    progress.setError();
                    progress.setStatus(errTip);
                },
                'Key': function(up, file) {
                    var date=getCurrentDate();
                    var today = new Date();
                    var time=today.getTime();
                    var key = session.user.account+"/customer/"+date+"/"+time+"/"+uuid.v1();
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
    },
    _initQiniuCustomerUpload:function(cid,pane){
        //var pane=$('#view_customer_list_content');
        var containerId= cid+'-customer-qiniu';
        var progressId= cid+'-fsUploadProgress';
        var uploader = Qiniu.uploader({
            runtimes: 'html5,flash,html4',
            browse_button: cid+'-pickCustomerFiles',
            multi_selection:true,
            container:containerId,
            drop_element: containerId,
            max_file_size: '10mb',
            flash_swf_url: '/javascripts/qiniu/plupload/Moxie.swf',
            dragdrop: true,
            chunk_size: '4mb',
            uptoken_url: '/action?action=app.weixin.getUptoken&data={}&sessionId=' + session.id,
            domain: qiniu7moorDomain,
            unique_names: false,
            save_key: false,
            auto_start: true,

            init: {
                'FilesAdded': function(up, files) {
                    pane.find(".customer_attach_container").show();
                    plupload.each(files, function(file) {
                        var progress = new FileProgress(file, progressId,"customer");
                        progress.setStatus("等待...");
                    });

                },
                'BeforeUpload': function(up, file) {
                    var progress = new FileProgress(file, progressId,"customer");
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    if (up.runtime === 'html5' && chunk_size) {
                        progress.setChunkProgess(chunk_size);
                    }
                },
                'UploadProgress': function(up, file) {
                    var progress = new FileProgress(file, progressId,"customer");
                    var chunk_size = plupload.parseSize(this.getOption('chunk_size'));
                    progress.setProgress(file.percent + "%", up.total.bytesPerSec, chunk_size);
                },
                'UploadComplete': function(evt,info) {
                    $().alertmessage('showSuccess', "文件上传成功");
                    //$("#customer_files").hide(3000);
                    //console.dir(evt);
                    pane.find(".customer_attach_container").hide();
                    pane.find(".customer_attach_container").find("tbody").empty();
                },
                'FileUploaded': function(up, file, info) {
                    var progress = new FileProgress(file, progressId,"customer");
                    var trueName = file.name;
                    up.trueName = trueName;
                    //console.info("FileUploaded=========");
                    //console.dir(up)
                    //console.dir(file)
                    //console.dir(info)
                    progress.setComplete(up, info,"customer");

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
                    var data={fileId:fileName,trueName:trueName,suffix:'other',isNew:"1"};
                    var ul=pane.find(".thumbnails_customer");
                    var imgTypes=["jpg","jpeg",'gif','png',"bmp"];
                    var suffix=trueName.substring(trueName.lastIndexOf(".")+1);
                    suffix=suffix.toLowerCase();
                    if($.inArray(suffix,imgTypes)!=-1){
                        data.suffix='img';
                    };

                    ul.append($("#tmpl_customer_attach").tmpl(data));
                },
                'Error': function(up, err, errTip) {
                    pane.find(".customer_attach_container").show();
                    var progress = new FileProgress(err.file, progressId);
                    progress.setError();
                    progress.setStatus(errTip);
                },
                'Key': function(up, file) {
                    var date=getCurrentDate();
                    var today = new Date();
                    var time=today.getTime();
                    var key = session.user.account+"/customer/"+date+"/"+time+"/"+uuid.v1();
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
    },
    loadCustBaseInfo:function(cId,pane,menu){
        var action = {
            action: 'app.customer.queryCustInfo',
            data: {_id:cId}
        };
        DS.send(action,function(response){
            if(response.success){
                var item=response.data;
                handler.customer.initBaseView(item,pane,menu);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    loadCustUpdateTmpl:function(cId,dbType,pane,callback){
        var tmpl = getCache('custTmpls',dbType);
        var container = pane.find("#icc_update_customer_customerUpdateDiv");
        container.empty();
        if(tmpl){
            var action = {
                action: 'app.customer.queryCustInfo',
                data: {_id:cId}
            };
            DS.send(action,function(response){
                if(response.success){
                    var item=response.data;
                    var owner=item.owner;

                    var qid=uuid.v1();
                    tmpl.qiniuId=qid;
                    pane.find("#tmpl_custmanage_update").tmpl(tmpl).appendTo(container);
                    handler.customer._initQiniuCustomerUpload(qid,container);
                    pane.find('.date_picker').datepicker({
                        changeMonth: true,
                        changeYear: true,
                        showButtonPanel: true
                    });
                    var html=generateCCOptions(proviceCityDicKey);
                    container.find("select[name='province']").html(html);
                    handler.customer.renderCustUpdate(pane.find("form"),item,pane);
                    //load user
                    var menu=pane.find(".edit_customer").attr("menu")||"";

                    utils.loadForOwnerComboBox("update",container,item);
                    //set owner name
                    var agentName=handler.customer.showAllForOwnerDesc(item);
                    if(agentName){
                        pane.find(".edit_customer").find(".for_owner_input").val(agentName);
                    }

                    /*var _agents=filterUserByScope();
                    var _uids=[];
                    for (var i = 0; i < _agents.length; i++) {
                        var obj = _agents[i];
                        _uids.push(obj._id);
                    }
                    if(isHasFunc("func_popup_commonCust_owner")){
                        _uids.push("");
                    }
                    if($.inArray(owner,_uids)!=-1||session.user.scope=='all'){
                        var editOwner="";
                        if(isHasFunc("func_not_allow_user_edit_owner")){
                            editOwner = "readonly"
                        }
                        //utils.loadAgentComboBox(inputId,containerId,{width:"140",height:"17"},true,null,editOwner);
                        //set owner name
                        var agentName="";
                        var agents=getCache("agents");
                        for(var i=0;i<agents.length;i++){
                            var u=agents[i];
                            if(item.owner== u._id){
                                agentName= u.displayName;
                                break;
                            }
                        }
                        if(agentName){
                            pane.find(".edit_customer").find("#"+containerId+"_input").val(agentName);
                        }
                    }else{
                        var agent=getCache("agents",owner||"NA");
                        if(agent){
                            var html='<span style="line-height:23px">'+agent.displayName+'</span>';
                            pane.find(".edit_customer").find("#"+containerId).html(html);
                        }else{
                            var html='<span style="line-height:23px">无</span>';
                            pane.find(".edit_customer").find("#"+containerId).html(html);
                        }
                    }*/

                    if(isHasFunc("func_not_update_customer_fields")){
                        handler.customer.renderCustNoUpdate(pane);
                    }
                    if(isHasFunc("func_not_update_customer_status")){
                        pane.find(".edit_customer").find("select[name='status']").attr("disabled", "disabled");
                    }
                    if(isHasFunc("func_not_update_customer_increase")){
                        pane.find(".edit_customer").find("select[name='custsource1']").attr("disabled", "disabled");
                    }
                    if(callback){
                        callback();
                    }
                }else{
                    $().alertmessage('showError', errMsg);
                }
            });
        }
    },

    renderCustUpdate:function(parent,item,pane){
        if(!item)return;
        if(item.phone){
            for (var i = 0; i < item.phone.length; i++) {
                var ary = item.phone[i];
                var html=[];
                if(i==0){
                    var desc=checkHideTel(ary.tel,$('input[name="tel[]"]',parent));
                    $('input[name="tel[]"]',parent).val(desc);
                    $('input[name="memo[]"]',parent).val(ary.memo);
                } else{
                    var desc=checkHideTel(ary.tel);
                    var _num=checkEncryptTel(ary.tel);
                    html.push('<div class="row_item phone"><a href="#"  class="reduce"></a><label>&nbsp;</label> ');
                    html.push('<input name="tel[]" type="text" bgTel="'+_num+'" value="'+desc+'"  style="width:150px;">');
                    html.push('<input name="memo[]" type="text" value="'+ary.memo+'" placeholder="备注"  style="width:150px;margin-left:-1px;">');
                    html.push('</div>');
                    $('input[name="tel[]"]:last',parent).parent().after(html.join(""));
                }
            }
            delete item.phone;
        }
        if(item.email){
            for (var i = 0; i < item.email.length; i++) {
                var ary = item.email[i];
                var html=[];
                if(i==0){
                    $('input[name="email[]"]',parent).val(ary.email);
                    $('input[name="eMemo[]"]',parent).val(ary.memo);
                } else{
                    html.push('<div class="row_item email"><a href="#"  class="reduce"></a><label>&nbsp;</label> ');
                    html.push('<input name="email[]" type="text" value="'+ary.email+'"  style="width:150px;">');
                    html.push('<input name="eMemo[]" type="text" value="'+ary.memo+'" placeholder="备注"  style="width:150px;margin-left:-1px;">');
                    html.push('</div>');
                    $('input[name="email[]"]:last',parent).parent().after(html.join(""));
                }
            }
            delete item.email;
        }
        if(item.weixin){
            for (var i = 0; i < item.weixin.length; i++) {
                var ary = item.weixin[i];
                var html=[];
                if(i==0){
                    $('input[name="num[]"]',parent).val(ary.num);
                    $('input[name="wxMemo[]"]',parent).val(ary.memo);
                } else{
                    html.push('<div class="row_item email"><a href="#"  class="reduce"></a><label>&nbsp;</label> ');
                    html.push('<input name="num[]" type="text" value="'+ary.num+'"  style="width:150px;">');
                    html.push('<input name="wxMemo[]" type="text" value="'+ary.memo+'" placeholder="备注"  style="width:150px;margin-left:-1px;">');
                    html.push('</div>');
                    $('input[name="num[]"]:last',parent).parent().after(html.join(""));
                }
            }
            delete item.weixin;
        }
        if(item.attachs){
            var container=pane.find(".thumbnails_customer");
            for (var i = 0; i < item.attachs.length; i++) {
                var _attach = item.attachs[i];
                pane.find("#tmpl_customer_attach_show").tmpl(_attach).appendTo(container);
            }
            delete item.attachs;
        }

        var selects = $("select", parent);
        selects.each(function(i){
            if($(this).hasClass("cust_city_casecade")){
                var keys=[];
                if(item.province){keys=[item.province]};
                var html=generateCCOptions(proviceCityDicKey,keys,null,true);
                $(this).html(html);
            }
            handler.customer.optionSelect($(this),item[this.name]);
        });

        selects.each(function(i){
            delete item[this.name];
        });

        var checks= $("input[type=checkbox]", parent);
        var checkName={};
        checks.each(function(){
            var n=this.name.substring(0,this.name.length-2);
            checkName[n]=1;
            if(item[n]){
                for(var k=0;k<item[n].length;k++){
                    var temp=item[n][k];
                    if(temp==$(this).val()){
                        $(this).attr({"checked":true});
                    }
                }
            }
        });
        for(var key in checkName){
            delete item[key];
        }
        DS.objectToForm(parent,item);
    },
    renderCustMerge : function (parent,itemA,itemB,pane){
        if(!itemA._id && !itemB._id)return;
        if(itemB.phone && itemA.phone){
            itemB.phone = itemB.phone.concat(itemA.phone);
        }else if(!itemB.phone){
            itemB.phone = itemA.phone;
        }
        if(itemB.phone){
            for (var i = 0; i < itemB.phone.length; i++) {
                var ary = itemB.phone[i];
                var html=[];
                if(i==0){
                    var desc=checkHideTel(ary.tel,$('input[name="tel[]"]',parent));
                    $('input[name="tel[]"]',parent).val(desc);
                    $('input[name="memo[]"]',parent).val(ary.memo);
                } else{
                    var desc=checkHideTel(ary.tel);
                    var _num=checkEncryptTel(ary.tel);
                    html.push('<div class="row_item phone"><a href="#"  class="reduce"></a><label>&nbsp;</label> ');
                    html.push('<input name="tel[]" type="text" bgTel="'+_num+'" value="'+desc+'"  style="width:150px;">');
                    html.push('<input name="memo[]" type="text" value="'+ary.memo+'" placeholder="备注"  style="width:150px;margin-left:-1px;">');
                    html.push('</div>');
                    $('input[name="tel[]"]:last',parent).parent().after(html.join(""));
                }
            }
            delete itemB.phone;
        }
        if(itemB.email && itemA.email){
            itemB.email = itemB.email.concat(itemA.email);
        }else if(!itemB.email){
            itemB.email = itemA.email;
        }

        if(itemB.email){
            for (var i = 0; i < itemB.email.length; i++) {
                var ary = itemB.email[i];
                var html=[];
                if(i==0){
                    $('input[name="email[]"]',parent).val(ary.email);
                    $('input[name="eMemo[]"]',parent).val(ary.memo);
                } else{
                    html.push('<div class="row_item email"><a href="#"  class="reduce"></a><label>&nbsp;</label> ');
                    html.push('<input name="email[]" type="text" value="'+ary.email+'"  style="width:150px;">');
                    html.push('<input name="eMemo[]" type="text" value="'+ary.memo+'" placeholder="备注"  style="width:150px;margin-left:-1px;">');
                    html.push('</div>');
                    $('input[name="email[]"]:last',parent).parent().after(html.join(""));
                }
            }
            delete itemB.email;
        }

        if(itemB.weixin && itemA.weixin){
            itemB.weixin = itemB.weixin.concat(itemA.weixin);
        }else if(!itemB.weixin){
            itemB.weixin = itemA.weixin;
        }
        if(itemB.weixin){
            for (var i = 0; i < itemB.weixin.length; i++) {
                var ary = itemB.weixin[i];
                var html=[];
                if(i==0){
                    $('input[name="num[]"]',parent).val(ary.num);
                    $('input[name="wxMemo[]"]',parent).val(ary.memo);
                } else{
                    html.push('<div class="row_item email"><a href="#"  class="reduce"></a><label>&nbsp;</label> ');
                    html.push('<input name="num[]" type="text" value="'+ary.num+'"  style="width:150px;">');
                    html.push('<input name="wxMemo[]" type="text" value="'+ary.memo+'" placeholder="备注"  style="width:150px;margin-left:-1px;">');
                    html.push('</div>');
                    $('input[name="num[]"]:last',parent).parent().after(html.join(""));
                }
            }
            delete itemB.weixin;
        }
        if(!itemB.attachs || itemB.attachs.length == 0){
            itemB.attachs = itemA.attachs;
        }
        if(itemB.attachs){
            var container=pane.find(".thumbnails_customer");
            for (var i = 0; i < itemB.attachs.length; i++) {
                var _attach = itemB.attachs[i];
                $("#tmpl_customer_merge_attach_show").tmpl(_attach).appendTo(container);
            }
            delete itemB.attachs;
        }else if(itemA.attachs){
            var container=pane.find(".thumbnails_customer");
            for (var i = 0; i < itemA.attachs.length; i++) {
                var _attach = itemA.attachs[i];
                $("#tmpl_customer_merge_attach_show").tmpl(_attach).appendTo(container);
            }
            delete itemA.attachs;
        }

        var selects = $("select", parent);
        selects.each(function(i){
            if($(this).hasClass("cust_city_casecade")){
                var keys=[];
                if(!itemB.province){
                    itemB.province = itemA.province;
                }
                if(itemB.province){keys=[itemB.province]};
                var html=generateCCOptions(proviceCityDicKey,keys,null,true);
                $(this).html(html);
            }
            handler.customer.optionSelect($(this),itemB[this.name]);
        });

        selects.each(function(i){
            delete itemB[this.name];
        });

        var checks= $("input[type=checkbox]", parent);
        var checkName={};
        checks.each(function(){
            var n=this.name.substring(0,this.name.length-2);
            checkName[n]=1;
            if(itemB[n]){
                for(var k=0;k<itemB[n].length;k++){
                    var temp=itemB[n][k];
                    if(temp==$(this).val()){
                        $(this).attr({"checked":true});
                    }
                }
            }
        });
        for(var key in checkName){
            delete itemB[key];
        }
        DS.objectToForm(parent,itemB);
    },
    renderCustNoUpdate:function(pane){
        var fields=pane.find("[noupdate='true']");
        //console.dir(fields)
        var fieldAry={};
        fields.each(function(){
            var obj=$(this);
            var type=this.type;
            var name=this.name;
            if(!fieldAry[name]){//filter repeat
                //console.info("type===="+type+",name====="+name);
                fieldAry[name]=true;
                var item=obj.closest(".row_item");
                var isCustom=false;
                if(item.length==0){
                    item=obj.closest(".frm_item");//custom fields
                    isCustom=true;
                }
                if(type=='text'||type=='textarea'){
                    if(name=='tel[]'){
                        //var desc="";
                        //var parent=obj.closest("fieldset");
                        //parent.find(".row_item.phone").each(function(){
                        //    var tel=$(this).find("input[name='tel[]']").val();
                        //    var memo=$(this).find("input[name='memo[]']").val();
                        //    desc+=tel+(memo?"("+memo+")":"")+"  ";
                        //})
                        //var html=item.find("label").prop("outerHTML")+"<div class='field_span_magin'>"+desc+"</div>";
                        //item.html(html);
                        //item.nextAll(".row_item.phone").remove();
                    }else if(name=='email[]'){
                        //var desc="";
                        //var parent=obj.closest("fieldset");
                        //parent.find(".row_item.email").each(function(){
                        //    var tel=$(this).find("input[name='email[]']").val();
                        //    var memo=$(this).find("input[name='eMemo[]']").val();
                        //    desc+=tel+(memo?"("+memo+")":"")+"  ";
                        //})
                        //var html=item.find("label").prop("outerHTML")+"<div class='field_span_magin'>"+desc+"</div>";
                        //item.html(html);
                        //item.nextAll(".row_item.email").remove();
                    }else if(name=='num[]'){
                        //var desc="";
                        //var parent=obj.closest("fieldset");
                        //parent.find(".row_item.weixin").each(function(){
                        //    var tel=$(this).find("input[name='num[]']").val();
                        //    var memo=$(this).find("input[name='wxMemo[]']").val();
                        //    desc+=tel+(memo?"("+memo+")":"")+"  ";
                        //})
                        //var html=item.find("label").prop("outerHTML")+"<div class='field_span_magin'>"+desc+"</div>";
                        //item.html(html);
                        //item.nextAll(".row_item.weixin").remove();
                    }else{
                        var desc="<div class='field_span_magin'>"+obj.val()+"</div>";
                        if(obj.hasClass("date_picker") && isCustom){
                            obj.closest(".input-append").prop("outerHTML",desc);
                        }else{
                            obj.prop("outerHTML",desc);
                        }
                    }
                }else if(type=='checkbox' || type=='radio'){
                    var desc="";
                    item.find("input:checked").each(function(){
                        desc+=$(this).attr("desc")+"  ";
                    })
                    desc="<div class='field_span_magin'>"+desc+"</div>";
                    if(isCustom){
                        item.find(".frm_right_content2").html(desc);
                    }else{
                        var parent=obj.closest("label");
                        parent.nextAll().remove();
                        parent.prop("outerHTML",desc);
                    }
                }else if(type=='select-one'||type=='select'){
                    var val=obj.val();
                    var desc=obj.find("option:selected").text();
                    if(!val){
                        desc="";
                    }
                    if(name=='province') {
                        desc = "<div class='field_span_magin'>" + desc + "</div>";
                        obj.prop("outerHTML", desc);
                        var city = item.next(".row_item").find("select[name='city']");
                        if (city.length > 0) {
                            desc=city.find("option:selected").text();
                            if(!city.val())desc="";
                            desc = "<div class='field_span_magin'>" + desc + "</div>";
                            city.prop("outerHTML", desc);
                        }
                    }else{
                        desc="<div class='field_span_magin'>"+desc+"</div>";
                        item.find(".frm_right_content2").html(desc);
                    }
                }
            }
        })
    },
    saveCustomer:function(data,src){
        if (src.hasClass("disabled")) return false;
        var flag=src.attr("flag");
        data.dealSrc=flag;
        var tels=data.tel,memos=data.memo;
        var phone=[];
        for(var i=0;i<tels.length;i++) {
            if($.trim(tels[i])){
                //过滤中间空格
                tels[i] = tels[i].replace(/\s/g,"");
                phone.push({tel:tels[i],memo:memos[i]});
            }
        }
        delete data.tel;
        delete data.memo;
        var emails = data.email,eMemos=data.eMemo;
        var email=[];
        if(emails){
            for(var i=0;i<emails.length;i++) {
                if($.trim(emails[i])){
                    email.push({email:emails[i],memo:eMemos[i]});
                }
            }
            delete data.email;
            delete data.eMemo;
            data.email=email;
        }

        var wxNums=data.num,wxMemo=data.wxMemo;
        var weixin=[];
        if(wxNums){
            for(var i=0;i<wxNums.length;i++) {
                if($.trim(wxNums[i])){
                    weixin.push({num:wxNums[i],memo:wxMemo[i]});
                }
            }
            delete data.num;
            delete data.wxMemo;
            data.weixin=weixin;
        }
        var popupId=data.popupId;
        delete data.popupId;

        var paneId=data.callId;
        var callId=data.callId;
        callId=data.callId.split("_")[0];
        data.callId=callId;
        data.actionType="self";
        data.phone=phone;
        var custName=data.name;
        data.attachs=[];
        var pane=src.closest(".edit_customer");
        pane.find(".thumbnails_customer .attachitem").each(function(i){
            var files={
                id:$(this).attr("ds_data"),
                name:$(this).text(),
                type:$(this).attr("suffix"),
                isNew:$(this).attr("isNew")
            };
            data.attachs.push(files);
        });
//        console.dir(data);
//        data.categoryId = "NA";
        src.addClass("disabled");

        if(flag=='dialPopup'){
            var dialModal=src.closest("#dial_popup_modal");
            var dialCallId=dialModal.find("#dial_popup_modal_callSheetID").val();
            data.callId=dialCallId;
        }else if(flag=='taskAgentAdd'){
            var dialCallId=$("#agent_dial_popup_modal_callSheetID").val();
            data.callId=dialCallId;
        }
        var action = {
            action: 'app.customer.addCustomer',
            data: data
        };
        DS.send(action,function(rep){
            if(rep.success){
                var param=rep.data||{};
                if(flag=='callLocation'){
                    $().alertmessage('showSuccess',"已定位客户");
                    if($('#my_call_sheet_query_link').length>0){
                        $('#my_call_sheet_query_link').trigger('click');
                    }
                    if($('#call_sheet_query_link').length>0){
                        $('#call_sheet_query_link').trigger('click');
                    }
                    $('#show_cdr_location_cust_Modal').modal('hide');
                }else if(flag=='customerLeak'){
                    handler.customer.loadCustInfo(param._id, 'my_call_sheet_leak', "customerLeak",null,param.popupId);
                    var _pane=$("#call_sheet_leak_list_item_pane");
                    if(_pane.length>0){
                        _pane.find(".item_row.expanded").find(".leak_location_custName").text(data.name);
                    }

                }else if(flag=='popupWebchat'||flag=='relocationWebchat'|| flag=='relocationCall'){
                    var call_right=$("#"+paneId);
                    if(flag=='popupWebchat'||flag=='relocationWebchat'){
                        handler.customer.imLocateCustSaveMultiChannelHistory({custId:param._id, chatId: callId});
                    }else{
                        var splitPaneId= "";
                        if(paneId.length>paneId.split("_relocationCal")[0].length){
                            splitPaneId=paneId.split("_relocationCal")[0];
                        }
                        callId=splitPaneId;
                    }
                    handler.customer.loadCustInfo(param._id,callId,flag,null,null,function(){
                        call_right.find(".func_tab.active").click();
                    });
                    var pane=$('#batch_modal');
                    pane.find(".modal-body").empty();
                    pane.modal("hide");

                    if(flag=='relocationCall'){
                        var _param={
                            customerId:param._id,
                            callId:callId,
                            custName:param.name
                        }
                        dsevent.publish(dsevent.evt.callRefreshCustomer,_param);
                    }
                    var sidPane = call_right.find(".webchat_user_id");
                    var sid = "";
                    if(sidPane && sidPane.length>0){
                        sid = sidPane.attr("ds_data");
                    }
                    var custDiv = call_right.find(".customer_name"+sid);
                    custDiv.attr("cust_id", param._id);
                    var todo_list = $("#view_webchat_todo");
                    var all_list = $("#view_webchat_all");
                    if(todo_list && todo_list.length > 0){
                        var items = todo_list.find(".webchat_item");
                        if(items && items.length > 0){
                            items.each(function(){
                                if($(this).attr("ds_attr") == sid){
                                    $(this).attr("cust_id",param._id);
                                }
                            });
                        }
                    }
                    if(all_list && all_list.length > 0){
                        var items = all_list.find(".webchat_item");
                        if(items && items.length > 0){
                            items.each(function(){
                                if($(this).attr("ds_attr") == sid){
                                    $(this).attr("cust_id",param._id);
                                }
                            });
                        }
                    }
                    dsevent.publish(dsevent.evt.refreshCustomerName, {custId: param._id, custName: param.name});
                }else if(flag=='popup'){
                    var call_right=$("#"+paneId);
                    //console.info("popup::paneId===="+paneId);
                    handler.customer.loadCustInfo(param._id,callId,flag,null,null,function(){
                        call_right.find(".func_tab.active").click();
                    });

                    param.popupId=popupId;
                    param.callId=callId;
                    //dsevent.publish(dsevent.evt.customerAdd,param);

                    dsevent.publish(dsevent.evt.callRefreshCustomer,param);
                }else if(flag=='dialPopup'){
                    var pane=$("#"+paneId);
                    handler.customer.loadDialCustInfo2Update(param._id,pane,function(){
                        pane.find(".func_tab.active").click();
                    });
                }else if(flag =="taskAgentAdd"||flag =="taskAgentCalledAdd"){
                    $().alertmessage('showSuccess',"新增成功!");
                    $('#batch_modal').modal('hide');
                    var taskId = src.attr("taskId")||src.attr("taskid");
                    var sampleId = src.attr("sampleId")||src.attr("sampleid");
                    handler.customer.task.reloadTaskAgentPane(param._id,taskId,sampleId,pane,flag);
                }else{
                    param.popupId=popupId;
                    param.callId=callId;
                    dsevent.publish(dsevent.evt.customerAdd,param);
                        $("#view_customer_list_content .customer_container,#view_customer_list_content .cust_tab_content").children().empty();
                }
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "电话号码重复");
                }else if(rep.code=='1002'){
                    $().alertmessage('showError', "客户名称重复");
                }else{
                    $().alertmessage('showError', rep.message|| errMsg);
                }
            }
            src.removeClass("disabled");
        });
    } ,
    updateCustomer:function(data,src){
        var pane=src.closest(".contact_summary");
        var container=pane.find(".baseinfo");
        var tels=data.tel,memos=data.memo;
        if(tels){
            var phone=[];
            for(var i=0;i<tels.length;i++) {
                if($.trim(tels[i])){
                    //过滤中间空格
                    tels[i] = tels[i].replace(/\s/g,"");
                    phone.push({tel:tels[i],memo:memos[i]});
                }
            }
            delete data.tel;
            delete data.memo;
            data.phone=phone;
        }

        var emails = data.email,eMemos=data.eMemo;
        var email=[];
        if(emails){
            for(var i=0;i<emails.length;i++) {
                if($.trim(emails[i])){
                    email.push({email:emails[i],memo:eMemos[i]});
                }
            }
            delete data.email;
            delete data.eMemo;
            data.email=email;
        }

        var wxNums=data.num,wxMemo=data.wxMemo;
        var weixin=[];
        if(wxNums){
            for(var i=0;i<wxNums.length;i++) {
                if($.trim(wxNums[i])){
                    weixin.push({num:wxNums[i],memo:wxMemo[i]});
                }
            }
            delete data.num;
            delete data.wxMemo;
            data.weixin=weixin;
        }

        data.attachs=[];
        pane.find(".thumbnails_customer .attachitem").each(function(i){
            var files={
                id:$(this).attr("ds_data"),
                name:$(this).text(),
                type:$(this).attr("suffix"),
                isNew:$(this).attr("isNew")
            };
            data.attachs.push(files);
        });
        if(data.owner==""){
            data.owner="NA";
        }
        var menu=src.attr("menu")||"";
        var flag=src.attr("ds_attr")||"";
        var action = {
            action: 'app.customer.updateCustomer',
            data: data
        };
        DS.send(action,function(rep){
            if(rep.success){
                //if(flag=='popupWebchat' || flag=='relocationWebchat' || flag=='relocationCall'){
                //    handler.customer.loadCustBaseInfoNew(data._id,menu,flag);
                //}else{
                //    handler.customer.loadCustBaseInfo(data._id,pane,menu);
                //}
                handler.customer.loadCustBaseInfoNew(data._id,menu,flag);
                //var action2 = {
                //    action: 'app.webchat.updateCustomerImRelation',
                //    data: {customerId: data._id, custName: data.name}
                //};
                //DS.send(action2,function(rep) {});
                dsevent.publish(dsevent.evt.customerUpdate, data);
                dsevent.publish(dsevent.evt.refreshCustomerName, {custId: data._id, custName: data.name});
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "电话号码重复");
                }else if(rep.code=='1002'){
                    $().alertmessage('showError', "客户名称重复");
                }else if(rep.code =='1005'){
                    $().alertmessage('showError',"此客户处于待审核状态，若要转移归属，请等待审核完成!");
                }else{
                    $().alertmessage('showError', rep.message || errMsg);
                }
            }
        });
    },
    mergeCustomer:function(data,src){
        if(!data._id){
            alert("请先预览再合并客户");
            return;
        }
        var pane=src.closest(".contact_summary");
        var container=pane.find(".baseinfo");
        var tels=data.tel,memos=data.memo;
        if(tels){
            var phone=[];
            for(var i=0;i<tels.length;i++) {
                if($.trim(tels[i])){
                    //过滤中间空格
                    tels[i] = tels[i].replace(/\s/g,"");
                    phone.push({tel:tels[i],memo:memos[i]});
                }
            }
            delete data.tel;
            delete data.memo;
            data.phone=phone;
        }

        var emails = data.email,eMemos=data.eMemo;
        var email=[];
        if(emails){
            for(var i=0;i<emails.length;i++) {
                if($.trim(emails[i])){
                    email.push({email:emails[i],memo:eMemos[i]});
                }
            }
            delete data.email;
            delete data.eMemo;
            data.email=email;
        }

        var wxNums=data.num,wxMemo=data.wxMemo;
        var weixin=[];
        if(wxNums){
            for(var i=0;i<wxNums.length;i++) {
                if($.trim(wxNums[i])){
                    weixin.push({num:wxNums[i],memo:wxMemo[i]});
                }
            }
            delete data.num;
            delete data.wxMemo;
            data.weixin=weixin;
        }

        data.attachs=[];
        pane.find(".thumbnails_customer .attachitem").each(function(i){
            var files={
                id:$(this).attr("ds_data"),
                name:$(this).text(),
                type:$(this).attr("suffix"),
                isNew:$(this).attr("isNew")
            };
            data.attachs.push(files);
        });

        var menu=src.attr("menu")||"";
        var flag=src.attr("ds_attr")||"";
        var action = {
            action: 'app.customer.mergeCustomer',
            data: data
        };
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess',"客户合并成功!");
                $("#mergeCustomerInfo").empty();
                $("#mergeCustomerDiv").hide();
                $("#mergeCustomerA,#mergeCustomerB").val("");
                $("span[for=mergeCustomerA],span[for=mergeCustomerB]").text("");
                handler.customer.mergeCustomerA = null;
                handler.customer.mergeCustomerB = null;
                dsevent.publish(dsevent.evt.customerUpdate, data);
                dsevent.publish(dsevent.evt.refreshCustomerName, {custId: data._id, custName: data.name});
                $("#frm_customer_normal_search").find(".normal_search").click();
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "电话号码重复");
                }else if(rep.code=='1002'){
                    $().alertmessage('showError', "客户名称重复");
                }else if(rep.code ==='1005'){
                    $().alertmessage('showError','客户A处于待审核状态，若要合并，请等待审核完成');
                }else{
                    $().alertmessage('showError', rep.message || errMsg);
                }
            }
        });
    },
    deleteCustomer:function(id,src){
        if(!confirm("确认要删除该客户吗？"))return;
        var flag=src.attr("ds_attr");
        var menu=src.attr("menu");
        var data={_id:id};
        var action = {
            action: 'app.customer.deleteCustomer',
            data: data
        };
        DS.send(action,function(rep){
            if(rep.success){
                if(flag=='popupWebchat' || flag=='relocationWebchat') {
                    handler.webchat.refreshChatDetail(menu, flag);
                    var pane = $('#batch_modal');
                    pane.find(".modal-body").empty();
                    pane.modal("hide");
                }else if(flag=='relocationCall'){
                }
                //var action2 = {
                //    action: 'app.webchat.deleteCustomerImRelation',
                //    data: {customerId: data._id}
                //};
                //DS.send(action2,function(rep) {});
                dsevent.publish(dsevent.evt.refreshCustomerName, {custId: data._id, custName: ""});
                dsevent.publish(dsevent.evt.customerDelete,data);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    toggleAssignBtn:function(pane,show){
//        if(!show){
//            $(".accept_button",pane).addClass("disabled").removeClass("ds_form_action");
//        } else{
//            $(".accept_button",pane).addClass("ds_form_action").removeClass("disabled");
//        }
    },
    _bubbleSort: function(array) {
        var i = 0,
            len = array.length,
            j, d;
        for (; i < len; i++) {
            for (j = 0; j < len; j++) {
                if (parseInt(array[i].exten,10) < parseInt(array[j].exten,10)) {
                    d = array[j];
                    array[j] = array[i];
                    array[i] = d;
                }
            }
        }
        return array;
    },
    showCustAssign:function(menu,src){
//        var pane=$("#"+menu+"_customer");
//        var leftPane=$('#contact_list_customer');
        var toolbarPane=$("#pane_deal_list");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        num=parseInt(num,10)||0;
        if(num<=0){
            $().alertmessage('showError', "请至少选择一条进行操作！");
            return;
        }
        //if(num>10000){
        //    $().alertmessage('showError', "一次最多操作10000条,请您过滤查询条件分批操作!");
        //    return;
        //}
        var pane=$('#batch_modal');
        DS.getView('customer/customer_assign',function(view){
            pane.find('.modal-title').text('分配客户');
            view=view.replace(/_#menu#_/g,menu);
            pane.find(".modal-body").html(view);
//            pane.find(".btn_cancel_edit").click(function(){
//                pane.empty();
//            });
            var users=filterUserByScope('customer');
            users=handler.customer._bubbleSort(users);
            users=copyEnableUser(true,users);
//            console.dir(users)
            var html=[];
            for(var i=0;i<users.length;i++){
                var u=users[i];
                var tmpl=pane.find("#tmpl_cust_assgin").tmpl(u).get(0).outerHTML;
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
            $(".cust_assgin_container",pane).html(html.join(""));
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
//                    if(parseInt($(".cust_count",pane).text()) === sum && sum!=0){
//                        handler.customer.toggleAssignBtn(pane,true);
//                    }else{
//                        handler.customer.toggleAssignBtn(pane);
//                    }
                    var acturalNum=parseInt($(".cust_count",pane).text());
                    acturalNum=acturalNum>handler.customer.batchMaxNum?handler.customer.batchMaxNum:acturalNum;
                    if(sum>acturalNum){
                        sum=0;
                    }else{
                        sum=acturalNum-sum;
                    }
                    $(".cust_more_count",pane).text(sum);
                }
            });
            $(".cust_count",pane).text(num);
            if(num >= handler.customer.batchMaxNum) num = handler.customer.batchMaxNum;
            $(".cust_more_count",pane).text(num);
            pane.width(700);
            pane.modal();
//            handler.cancelDealToolbar("customer");
        });
    },

    autoAssgin:function(data,src){
        var frm=src.closest("form");
        var assgins=frm.find("input[name='assign[]']");
        var total = parseInt(frm.find(".cust_count").text());
        if(total >= handler.customer.batchMaxNum) total = handler.customer.batchMaxNum;
        var num=Math.floor(total/assgins.length);
        assgins.each(function(i){
            $(this).val(num);
        });
        for(var i=0;i<total-(assgins.length*num);i++){
            assgins[i].value=parseInt(assgins[i].value)+1;
        }
        frm.find(".cust_more_count").text("0");
//        handler.customer.toggleAssignBtn(frm,true);
    },
    resetAssgin:function(data,src){
        var frm=src.closest("form");
        var assgins=frm.find("input[name='assign[]']");
        var total = parseInt(frm.find(".cust_count").text());
        if(total >= handler.customer.batchMaxNum) total = handler.customer.batchMaxNum;
        assgins.each(function(i){
            $(this).val("0");
        });
        frm.find(".cust_more_count").text(total);
//        handler.customer.toggleAssignBtn(frm);
    },
    saveCustAssign:function(data,src){
        var form = src.closest("form");
        form.find(".cust_assgin_agent_container").find("input[type = 'checkbox']").attr("checked",true);
        data = DS.util.getDataOfForm(form).data;
        var menu=data.menu;
        var owners=data.owner;
        var assigns=data.assign;
//        var pane=$("#"+menu+"_customer");
        var pane=$('#batch_modal');
        var leftPane=$('#contact_list_'+menu);
        var checkPane=leftPane.find(".list_check_all");
        var isAll=checkPane.hasClass("select_on")?"1":"0";
        var query = handler.customer._getSearchCondition(leftPane,isAll);
        var total = parseInt(pane.find(".cust_count").text());
        total=total>handler.customer.batchMaxNum?handler.customer.batchMaxNum:total;
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
            $().alertmessage('showError', "分配客户的总数不能超过【"+total+"】个");
            return;
        }
        var action={
            action:'app.customer.saveCustAssign2In',
            data : {query:query,owners:filter,total:total}
        };
        DS.send(action,function(rep){
            if(rep.success){
                dsevent.publish(dsevent.evt.customerRefresh);
                $().alertmessage('showSuccess', "分配完成");
                pane.find(".modal-body").empty();
                pane.modal("hide");
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "您分配的数据总数发生变化，请重新确认后再操作");
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
            }
        },"POST");
    },
    showClearOwnerModal:function(menu,src){
        var leftPane=$('#contact_list_'+menu);
        var toolbarPane=$("#pane_deal_list");
        var checkPane=leftPane.find(".list_check_all");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        num=parseInt(num,10)||0;
        if(num<=0){
            $().alertmessage('showError', "请至少选择一条进行操作！");
            return;
        }
        if(num>10000){
            $().alertmessage('showError', "一次最多操作10000条,请您过滤查询条件分批操作!");
            return;
        }
        var isAll=checkPane.hasClass("select_on")?"1":"0";
        var view="<p>你搜索到客户数据共<strong style='color: red;'>"+num+"</strong>条，清空所属人将会把客户放入到公共客户中，确定要操作吗？</p>";
        var p=$('#confirm_modalBox');
//        p.find('.modal-title').text('');
        p.find(".modal-body").html(view);
        p.find(".ds_do_action").attr({"ds_action":"customer.delCustOwner","ds_data":isAll})
        p.width(500);
        p.modal();
    },
    delCustOwner:function(isAll , src){
        var leftPane=$('#contact_list_'+handler.customer.curSubMenu);
        var p=$('#confirm_modalBox');
        var query = handler.customer._getSearchCondition(leftPane,isAll);
        var action={
            action:'app.customer.delCustOwner2In',
            data:query
        };
        DS.send(action,function(rep){
            if(rep.success){
                p.modal("hide");
                dsevent.publish(dsevent.evt.customerRefresh);
                $().alertmessage('showSuccess', "清空所属人成功");
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    showDelCustModal:function(menu,src){
        var leftPane=$('#contact_list_'+menu);
        var toolbarPane=$("#pane_deal_list");
        var checkPane=leftPane.find(".list_check_all");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        num=parseInt(num,10)||0;
        if(num<=0){
            $().alertmessage('showError', "请至少选择一条进行操作！");
            return;
        }
        //if(num>10000){
        //    $().alertmessage('showError', "一次最多操作10000条,请您过滤查询条件分批操作!");
        //    return;
        //}
        var isAll=checkPane.hasClass("select_on")?"1":"0";
        var view="<p>&nbsp;&nbsp;您搜索到客户数据共<strong style='color: red;'>"+num+"</strong>条，删除后将不可恢复，确认要删除吗？</p>";
        if(num>10000){
            view="<p>&nbsp;&nbsp;您搜索到客户数据共<strong style='color: red;'>"+num+"</strong>条，总数已大于1万条，系统将只删除前1万条客户数据,确认要删除吗？</p>";
        }
        var p=$('#confirm_modalBox');
        p.find('.modal-title').text('第一次确认');
        p.find(".btn-primary.ds_do_action").text('确认');
        p.find(".modal-body").html(view);

        if(num>500){
            p.find(".ds_do_action").attr({"ds_action":"customer.confirmDelCustAgain","ds_data":menu})
        }else{
            p.find(".ds_do_action").attr({"ds_action":"customer.delCustQuery","ds_data":isAll});
        }
        //p.find(".ds_do_action").attr({"ds_action":"customer.delCustQuery","ds_data":isAll});
        p.width(500);
        p.modal();
    },
    confirmDelCustAgain:function(menu,src){
        var leftPane=$("#contact_list_"+menu);
        var toolbarPane=$("#pane_deal_list");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        num=parseInt(num,10)||0;
        var view="<p style='margin: 30px 0;'>&nbsp;&nbsp;您搜索到客户数据共<strong style='color: red;'>"+num+"</strong>条，删除后将不可恢复，请再次确认要删除吗？</p>";
        if(num >= handler.customer.batchMaxNum){
            view="<p style='margin: 30px 0;'>&nbsp;&nbsp;您搜索到客户数据共<strong style='color: red;'>"+num+"</strong>条，只能删除前1W条数据,删除后将不可恢复，请再次确认要删除吗？</p>";
        }
        var p=$('#confirm_modalBox');
        p.find('.modal-title').text('第二次确认');
        p.find(".modal-body").html(view);
        p.find(".ds_do_action").attr({"ds_action":"customer.confirmDelCustAgain2","ds_data":menu});

        p.width(500);
        p.find(".btn-primary.ds_do_action").text('再次确认');
        p.modal();
    },
    confirmDelCustAgain2:function(menu,src){
        var leftPane=$('#contact_list_'+menu);
        var toolbarPane=$("#pane_deal_list");
        var checkPane=leftPane.find(".list_check_all");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        num=parseInt(num,10)||0;
        if(num<=0){
            $().alertmessage('showError', "请至少选择一条进行操作！");
            return;
        }
        var isAll=checkPane.hasClass("select_on")?"1":"0";
        var view="<p style='margin: 50px 0;'>&nbsp;&nbsp;您搜索到客户数据共<strong style='color: red;'>"+num+"</strong>条，删除后将不可恢复，请<strong style='color: red;'>最后一次</strong>确认要删除吗？</p>";
        if(num >= handler.customer.batchMaxNum){
            view="<p style='margin: 50px 0;'>&nbsp;&nbsp;您搜索到客户数据共<strong style='color: red;'>"+num+"</strong>条，只能删除前1W条数据,删除后将不可恢复，请<strong style='color: red;'>最后一次</strong>确认要删除吗？</p>";
        }
        var p=$('#confirm_modalBox');
        p.find('.modal-title').text('第三次确认');
        p.find(".modal-body").html(view);
        p.find(".ds_do_action").attr({"ds_action":"customer.delCustQuery","ds_data":isAll});
        p.find(".btn-primary.ds_do_action").text('最终确认');
        p.width(500);
        p.modal();
    },
    delCustQuery:function(isAll, src){
        if (src.hasClass("disabled")) return false;
        src.addClass("disabled");
        var leftPane=$('#contact_list_'+handler.customer.curSubMenu);
        var toolbarPane=$("#pane_deal_list");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        num=parseInt(num,10)||0;
        var p=$('#confirm_modalBox');

        var query = handler.customer._getSearchCondition(leftPane,isAll);
        var action={
            action:'app.customer.delCustQuery2In',
            data:query
        };
        DS.send(action,function(rep){
            if(rep.success){
                p.find('.modal-title').text('确认操作');
                p.find(".btn-primary.ds_do_action").text('确认');
                p.modal("hide");
                dsevent.publish(dsevent.evt.customerBatchDel);
                if(num >= handler.customer.batchMaxNum){
                    $().alertmessage('showSuccess', "成功删除1W条数据");
                }else{
                    $().alertmessage('showSuccess', "删除数据成功");
                }
                //var action2 = {
                //    action: 'app.webchat.deleteCustomerImRelation',
                //    data: {customerId: query._id}
                //};
                //DS.send(action2,function(rep) {});

                dsevent.publish(dsevent.evt.refreshWebchatToDoList);
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
            src.removeClass("disabled");
        },null,null,null,60000);
    },


    /*******import excel**************/
    customer_import: function (menu) {
        handler.customer.searchCustImport(null,$('#import_list_'+menu).find('.contacts_caption'));
    },
    searchCustImport: function(data, src) {
        var pane = src.closest('.ds_search_pane');
        pane.attr('ds_index', '1');
        var index = 1;
        var query = getSearchCondition(pane);
        handler.customer._queryCustImport(index, query.data, query.queryDisplay, pane);
    },
    _queryCustImport:function(index,query,queryDisplay,pane){
        var menu = pane.attr('ds_menu');
        var action = {
            action: 'app.customer.queryMyTask',
            data: {
                query: query,
                queryType: menu,
                option: {
                    index: index,
                    pageSize:handler.customer.custPageLimit
                }
            }
        };
        var listPane = pane.find('.list-inside');
        DS.send(action, function(response){
            if(response.success){
                renderSearchResult(pane,index,handler.customer.custPageLimit, query,queryDisplay, response);
                var contacts = response.list;
                if(contacts.length > 0){
                    for (var i in contacts) {
                        listPane.append($('#tmpl_cust_import_item').tmpl(contacts[i]));
                    }
                    var collapsePane = pane.find('.search.collapse');
                    if(collapsePane.hasClass('in'))
                        collapsePane.collapse('hide');
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    moreCustImport: function(data, src) {
        var pane = src.closest('.ds_search_pane');
        var index = parseInt(pane.attr('ds_index'))+1;
        var query = getSearchCondition(pane);
        handler.customer._queryCustImport(index, query.data, query.queryDisplay, pane);
    },

    showDelImportTask:function(id,src){
        var view="<p>&nbsp;&nbsp;该操作只删掉导入批次，客户数据仍保留，删除后将不可恢复，确认要删除吗？</p>";
        var p=$('#confirm_modalBox');
        p.find('.modal-title').text('导入批次删除确认');
        p.find(".btn-primary.ds_do_action").text('确认');
        p.find(".modal-body").html(view);
        p.find(".ds_do_action").attr({"ds_action":"customer.delImportTask","ds_data":id});
        p.width(500);
        p.modal();
    },
    delImportTask:function(id, src){
        if (src.hasClass("disabled")) return false;
        src.addClass("disabled");
        var pane=$("#customer_import_pane");
        var leftPane=$("#import_list_customer_import");
        var p=$('#confirm_modalBox');
        var action={
            action:'app.customer.delImpTask',
            data:{_id:id}
        };
        DS.send(action,function(rep){
            if(rep.success){
                p.modal("hide");
                leftPane.find(".item"+id).parent().remove();
                pane.empty();
                $().alertmessage('showSuccess', "删除批次成功");
            }else{
                $().alertmessage('showError', errMsg);
            }
            src.removeClass("disabled");
        });
    },
    showImportTask:function(id,src){
        handler.customer.loadTaskInfo(id,src);
    },
    loadTaskInfo:function(id,src){
        var pane=$("#customer_import_pane");
        var action={
            action:'app.customer.getImpTask',
            data:{_id:id}
        };
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                DS.getView("customer/customer_task_tab", function (view) {
                    view=DS.renderMethodViewNew(view,row);
                    pane.html(view);
                    if(row && (row.flag=='finish' || row.flag=='failure')){
                        pane.find(".btn_del_impNo").show();
                    }
                    pane.find('#customer_task_tab > li a:first').click();
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    showImpStatusDesc:function(flag){
        var desc=getDicCacheName('impTaskStatus',flag);
        var html ="";
        if (flag=='finish'){
            html='<span class="status-name" style="color:green;">'+desc+'</span>';
        }else{
            html='<span class="status-name" style="color:red;">'+desc+'</span>';
        }
        return html;
    },
    loadTaskImpList:function(data,src){
        var batchNo=data;
        if(typeof data=='object'){
            batchNo=data.batchNo
        }
        var pane2=$("#customer_task_tab_content");
        var page=1;
        if(src && !src.hasClass("ds_do_action"))page=src.val();
        if(!page)page=1;
        DS.getView("customer/customer_task_import", function (view) {
            pane2.html(view);
            pane2.find("input[name='batchNo']").val(batchNo);
            var pane=pane2.find("#task_import_list_pane");
            var action = {
                action: 'app.customer.queryTaskImport',
                data: {batchNo:batchNo,page:page}
            };
            DS.send(action,function(response){
                if(response.success){
                    var list=response.list;
                    var count=response.count;
                    for(var i in list){
                        pane.append($("#tmpl_taskimport_item").tmpl(list[i]));
                    }
                    var frmId ="import_query_frm";
                    DS.updatePagination(frmId, count, 10, page);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            });
        });
    },
    loadTaskRepeatList:function(data,src){
        var batchNo=data;
        if(typeof data=='object'){
            batchNo=data.batchNo
        }
        var pane2=$("#customer_task_tab_content");
        var page=1;
        if(src && !src.hasClass("ds_do_action"))page=src.val();
        if(!page)page=1;
        DS.getView("customer/customer_task_repeat", function (view) {
            pane2.html(view);
            pane2.find("input[name='batchNo']").val(batchNo);
            var pane=pane2.find("#task_repeat_list_pane");
            var action = {
                action: 'app.customer.queryTaskRepeat',
                data: {batchNo:batchNo,page:page,limit:10}
            };
            DS.send(action,function(response){
                if(response.success){
                    var list=response.list;
                    var count=response.count;
                    for(var i in list){
                        pane.append($("#tmpl_taskimport_item").tmpl(list[i]));
                    }
                    var frmId = "repeat_query_frm";
                    DS.updatePagination(frmId, count, 10, page);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            });
        });
    },
    uploadSucess:function(evt){
//       console.log(evt.target.responseText);
        var rep = $.parseJSON(evt.target.responseText);
        if(rep && !rep.success){
            $().alertmessage('showError', "上传文件失败，请检查网络或文件是否正确");
            return;
        }
        var fileName=rep.filePath.substring(rep.filePath.lastIndexOf("/")+1);
        var trueName=rep.fileName;
        handler.customer.getXlsHeads(trueName,fileName);
    },
    getXlsHeads:function(trueName,fileName){
        var pane=$("#customer_import_pane");
        var action = {
            action: 'app.customer.getXlsHeads',
            data: {
                trueName:trueName,
                fileName:fileName
            }
        };
        DS.send(action,function(response){
            if(response.success){
                pane.find("input[name='fileName']").val(fileName);
                pane.find("input[name='trueName']").val(trueName);
                pane.find("input[name='xlsHeads']").val($.toJSON(response.heads));
                handler.customer.initImportInfo();
//                handler.customer.uploadHeads=response.heads;
//                f(response.heads);
                pane.find("#cust_imp_baseinfo").show();
            }else{
                $().alertmessage('showError', response.message||errMsg);
            }
        });
    },
    uploadError:function(evt){
        $().alertmessage('showError', "上传失败");
    },
    parseCustomFields:function(customFields){
        var fields=[];
        for(var i=0;i<customFields.length;i++){
            var row=customFields[i];
            fields.push(row);
        }
        return fields;
    },
    contactPhoe:function(phonelist){
        var tels=[];
        for(var i=0;i<phonelist.length;i++){
            var item=phonelist[i];
            if(item.tel){
                tels.push(item.tel);
            }
        }
        return tels.join(",");
    },
    getSourceName:function(dbType,val){
        var dic=getCache('custTmpls',dbType).source;
        if(!dic) return;
        var len = dic.length;
        var dicName="";
        for (var i = 0; i < len; i++) {
            if(dic[i].key==val){
                dicName=dic[i].name;
                break;
            }
        }
        return dicName;
    },
    showSourceOption:function(dbType,node,val,selected,showNA){
        var dic=getCache('custTmpls',dbType).source;
        if(!dic) return;
        if(showNA){
            dic=[{key:'NA',name:'无来源'}].concat(dic);
        }
        var len = dic.length;
        for (var i = 0; i < len; i++) {
            var l=dic[i].options;
            var o = document.createElement("option");
            node.options.add(o);
            o.innerText = dic[i].name;
            o.value = dic[i].key;
            if (val) {
                if (o.value == val)
                    o.selected = true;
            } else {
                if (!selected) {
                    if (i == 0) o.selected = true;
                }
            }
            // if (len == 1) o.selected = true;
        }
    },
    addImpTask:function(menu,src){
        var pane=$("#customer_import_pane");
        DS.getView('customer/customer_import_add',function(view){
            pane.empty();
            pane.html(view);
            var type=pane.find("select[name='dbType']");
            type.change(function(){
                var v=$(this).val();
                if(!v)return;
                var s1=pane.find("select[name='status']"),s2=pane.find("select[name='source1']");
                s1.empty();s2.empty();
                handler.customer.getOptionDic(v,'status',s1.get(0));
                handler.customer.showSourceOption(v,s2.get(0));
                var heads=pane.find("input[name='xlsHeads']").val();
                heads=eval(heads);
                var html=handler.customer.xlsRelation(v,heads);
                var pane2=pane.find("#import_cust_relations_container");
                pane2.html(html);
            });

        });
    } ,
    initImportInfo:function(){
        var pane=$("#customer_import_pane");
        var type=pane.find("select[name='dbType']");
        type.empty();
        handler.customer.getCustDbType(type.get(0),null,null,1);
        var dt=type.val();
        type.change();
        var time=getDateNo();
        pane.find("input[name='batchNo']").val(time);
        pane.find("input[name='batchRemark']").keyup(function(e){
            if(e.which == 32){
                $(this).val($(this).val().replace(/\s/g,''));
            }
        })
    },
    xlsRelation:function(dbType,heads){
        var relations={};
        var tmpl=getCache('custTmpls',dbType);
        var checkPhone=tmpl.unique_phone;
        var checkName=tmpl.unique_name;
        var field1=tmpl.stable_fields;
        var field2=tmpl.custom_fields;
        var source=tmpl.source||[];
        relations["status"]='客户状态';
        relations["owner"]='所属人';
        if(source.length>0){
            relations["custsource1"]='数据来源';
        }

        for(var i in field1){

            var value = field1[i].value;
            var name = field1[i].name;
            relations[name] = value;
            //relations[i]=field1[i];
        }
        field2=handler.customer.parseCustomFields(field2);
        var dics={};
        for(var i=0;i<field2.length;i++){
            relations[field2[i]._id]=field2[i].name;
            if(field2[i].dic){
                dics[field2[i]._id]=field2[i].dic;
            }
        }
        handler.customer.dicFields=dics;

        var html=["<table class='table table-bordered table-striped table-hover'>"];
        html.push("<tr><th>excel表头</th><th>客户字段</th><th>excel表头</th><th>客户字段</th></tr>");
        for(var j=0;j<heads.length;j++){
            var tmplsHeads=["<option value=''>---请选择---</option>"];
            for(var key in relations){
                if(relations[key]==heads[j]){
                    tmplsHeads.push("<option selected value='"+key+"'>"+relations[key]+"</option>")

                }else{
                    tmplsHeads.push("<option value='"+key+"'>"+relations[key]+"</option>")

                }
            }
            if(j%2==0) {
                if(j==heads.length-1){
                    html.push("<tr><td>"+heads[j]+"</td><td><select name='heads[]'>"+tmplsHeads.join("")+"</select></td><td colspan='2'>&nbsp;</td></tr>");
                }else{
                    html.push("<tr><td>"+heads[j]+"</td><td><select name='heads[]'>"+tmplsHeads.join("")+"</select></td>");
                }

            }else{
                html.push("<td>"+heads[j]+"</td><td><select name='heads[]'>"+tmplsHeads.join("")+"</select></td></tr>");
            }
        }
        html.push("</table>");

        return html.join("") ;
    },
    importCust:function(data,src){
        if(!data.dbType){
            $().alertmessage('showError', "必须选择一个数据库");
            return;
        }
        data.dic={};
        data.flag="start";
        //过滤批次号空格
        if(data.batchRemark){
            data.batchRemark =data.batchRemark.replace(/\s/g,"");
        }
        //
        data.batchNo=data.batchNo+(data.batchRemark=='添加批次说明'?'':data.batchRemark);
        delete data.batchRemark;
        var hasName=0;
        if(handler.customer.dicFields){
            for(var i=0;i<data.heads.length;i++){
                var field=data.heads[i];
                if(field=='name'){
                    hasName=1;
                }
                var temp=handler.customer.dicFields[field];
                if(temp){
                    data.dic[field]= temp;
                }
            }
        }
        if(!hasName){
            $().alertmessage('showError', "导入客户字段必须包括姓名,请检查关联关系!");
            return false;
        }
        var action = {
            action: 'app.customer.import',
            data: data
        };
        DS.send(action,function(rep) {
            if(rep.success){
//                alert("导入任务已提交！");
                $("#customer_import_pane").empty();
                dsevent.publish(dsevent.evt.importCustomer,rep.row);
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },

    exportCustomer:function(menu,src){
        var leftPane=$('#contact_list_'+menu);
        var toolbarPane=$("#pane_deal_list");
        var checkPane=leftPane.find(".list_check_all");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        var isAll=checkPane.hasClass("select_on")?"1":"0";
        var query = handler.customer._getSearchCondition(leftPane,isAll);
        num=parseInt(num,10)||0;
        if(num<=0){
            $().alertmessage('showError', "请至少选择一条进行操作!");
            return;
        }
        if(num>1000000){
            $().alertmessage('showError', "最多导出100万条,请过滤查询条件分多次导出!");
            return;
        }
        query.menu = menu;

        if(num<=10000){
            var action = {
                action: 'app.excel.exportXls',
                data: {Method:'exportCustomer2In',Query:query}
            };
            DS.send(action,function(rep) {
                if(rep.Succeed){
                    handler.cancelDealToolbar("customer",menu);
                    downloadFile(rep.path);
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
            });
        }else{
            var action = {
                action: 'app.excel.exportMoreXls',
                data: {Method:'exportCustomer',Query:query}
            };
            DS.send(action,function(rep) {
                if(rep.success){
                    $().alertmessage('showSuccess', "您导出的数据已经超过1万条，系统将在后台进行导出，请点击“＋”号进入“导出任务”中进行下载!");
                    handler.cancelDealToolbar("customer",menu);
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
            });
        }
    },

    initHistory:function(data,pane,busId){
        DS.getView('customer/active_history_item',function(view) {
            $(".active-history",pane).empty();
            $(".active-history",pane).html(view);
            $(".active-history-content .activity-bar .active_action",pane).attr({"data":data._id,"busId":busId});
            if(isHasMenu("config_channel")||isHasMenu("my_mail_deal")||isHasMenu("my_weixin_deal")){
                pane.find(".func_hide").show();
            }
            var id=pane.attr("id");
            if(busId) {
                var businessFlow = "<li class=\"active_action\" rel=\"businessFlow\" data=\""+busId+"\">流转历史</li>";
                $(".active-history ul",pane).prepend(businessFlow);
                $(".active-history-content .activity-bar .active_action",pane).find("[rel='businessFlow']").attr("data", busId);
                $(".active-history-content .activity-bar",pane).find('li[rel="business"]').click();
            }else if(id=='query_customer_customer'){
                $(".active-history-content .activity-bar",pane).find('li[rel="notes"]').click();
//                $(".active-history-content .activity-bar",pane).find("li").first().click();
            }

        });
    },
    showActiveHistory: function(rel, data, pane,busId) {
//        console.dir(data);
        pane.find(".active_action").removeClass("active");
        pane.find("ul li[rel='"+rel+"']").addClass("active");

        var history=pane.closest(".active-history");
        var menu=history.attr("ds_menu");
        var callBack = function(err, list) {
            var content = pane.find(".timeLine_list");
            if(rel == "notes"||rel == "business"){
                var p=content.find(".item_action");
                p.siblings().remove();
            }else{
                content.empty();
            }
            if(!err) {
                if(list.length != 0) {
                    DS.getView('customer/active_history_content_item',function(view) {
                        var val = "";
                        for(var i = 0; i < list.length; i++) {
                            val += render.renderActiveHistory(list[i], view, rel);
                        }
                        content.append(val);
                    });
                } else {
                    if(rel != "notes" && rel != "business"){
                        content.append("<div class='timeLine_list_noResult'>没有纪录!</div>");
                    }
                }
            } else
                content.append("<div class='timeLine_list_noResult'>查询出错!</div>");
        }

        if(rel == "notes"){
            var html=template("tmpl_cust_action");
            var _p = pane.find(".timeLine_list");
            _p.html(html);
//            var action=_p.find(".next-action-form");
            var action = {
                action: 'app.customer.queryCustInfo',
                data: {_id: data}
            };
            DS.send(action,function(response){
                if(response.success){
                    var item=response.data;
                    handler.customer.initActionView(item,pane);
                    handler.customer.loadNoteDbTempl(item,callBack);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            });
        }else if(rel == "business"){
            var html=template("tmpl_cust_bus");
            var _p = pane.find(".timeLine_list",{menu:menu});
            _p.html(html);
            var task=_p.find(".business-info");
            if(busId){
                handler.business.loadTaskInfo(task,menu,data,busId);
            }else{
                handler.business.loadTaskInfo(task,menu,data,"");
            }
            handler.business.getCustomerHistoryBusiness(data, callBack);
        } else if(rel == "call"){
            handler.cdr.getCustomerHistoryCdr(data, callBack);
        } else if(rel == "businessFlow"){
            handler.business.getBusinessHistory(data, callBack);
        } else if(rel == "mail"){
            handler.customer.loadMailByCustId(data, callBack);
        } else if(rel == "weixin"){
            handler.customer.loadWeixinByCustId(data, callBack);
        } else if(rel == "webchat"){
            handler.customer.loadWebchatByCustId(data, callBack);
        }

//        else if(rel == "updates")
//            handler.customer.loadCustUpdates(data, pane);

    },
    loadNoteDbTempl:function(custInfo,callBack){
        var custId=custInfo._id;
        var actionId=custInfo.actionId;
        var query={customerId:custId};
        if(actionId){
            query._id={$ne:actionId};
        }
        var action = {
            action: 'app.customer.queryCustNote',
            data: query
        };
        DS.send(action,function(rep){
            if(rep.success) {
                callBack(null, rep.list);
            }else {
                callBack(new Error());
            }
        });
    },
    showRecord:function(url,src){
        var p=$('#batch_modal');
        var html='<p style="text-align: center"><audio style="width: 450px" id="cdr_listen_audio" src="'+url+'" preload="auto" autoplay controls="controls">您的浏览器不支持此播放器</audio></p>';
//        var html='<p><audio id="cdr_listen_audio" src="http://119.254.80.102/monitor/2.1.1.102/20140605/20140605-151101_N00000000020_10000021_53500101_53500101_10000021_pbx-1401952252.14757.mp3" preload="auto" autoplay controls="controls">您的浏览器不支持此播放器</audio></p>';
        p.width('auto');
        p.find('.modal-title').text('听录音');
        p.find(".modal-body").html(html);
        p.modal();
    },
    dialCust:function(tel,src){
        var cid=src.attr("ds_param1");
        var name=src.attr("ds_param2");
        softphonebar_dialout(tel);
        handler.callRecord.showAddCallRecord2Cust(tel,cid,name,src);
    },
    dialCust2:function(tel,src){
        softphonebar_dialout(tel);
    },
    custAssignEvtHandler : function(event){
        var data = $.evalJSON(event.Data);
        var count = data.assignNum;
        if(count > 0){
            var msg="您有<span style='color: red;'>"+count+"</span>条新分配的客户，请到“我的客户”菜单处理！";
            $().alertmessage('showNotify', msg);
        }
    },
    showCallUrlInPopupCust: function (callId,callNo,callBack, url, callObject) {
        $("#" + callId + "_popup").attr("submit", true);
//        handler.call.refreshSubmit(callId);
        var pane = $("#"+callId+"_popup");
        var popupDbtypes = handler.customer.call_popup_custtmpl();
        var action = {
            action: 'app.popup.popupCust',
            data: {accountId:session.user.account, phone:callNo, dbType:{$in:popupDbtypes}}
        };
        DS.send(action,function(rep) {
            var params = "";
            if (callObject) {
                for (var param in callObject) {
                    params += param + "=" + callObject[param] + "&";
                }
                if (session.user) {
                    params += "loginName=" + session.user.loginName;
                }
            }
            if (params) {
                if(url.indexOf('?') == -1){
                    url += '?' + params;
                }else{
                    url += '&' + params;
                }
            }
            pane.css("height","100%")
            pane.html("<iframe class=\"callUrlFrame\" src=\""+url+"\" width=\"100%\" frameborder=\"0\" scrolling=\"yes\" style=\"min-height:inherit;height:100%;\"></iframe>");
            if(rep.success) {
                var contacts = rep.list;
                if(contacts && contacts.length>0) {
                    if(contacts.length == 1){
                        var data = contacts[0];
                        data.callId = callId;
                        data.notUpdCdr = true;
                        data.phone = callNo;
                        dsevent.publish(dsevent.evt.callRefreshCustomer,data);
                    }else{
                        var data = {};
                        data.callId = callId;
                        data.phone = callNo;
                        data.name="多个匹配客户"
                        dsevent.publish(dsevent.evt.callRefreshCustomer,data);
                    }
                } else {
                    var data = {};
                    data.callId = callId;
                    data.phone = callNo;
                    data.name="未知客户"
                    dsevent.publish(dsevent.evt.callRefreshCustomer,data);
                }
            } else {
                callBack({}, true);
            }
            resize();
        });
    },
    showCallUrlOutPopupCust: function(callId,callNo,callBack,business,callObject) {
        $("#" + callId + "_popup").attr("submit", true);
//        handler.call.refreshSubmit(callId);
        var pane = $("#"+callId+"_popup");
        var popupDbtypes = handler.customer.call_popup_custtmpl();
        var action = {
            action: 'app.popup.popupCust',
            data: {accountId:session.user.account, phone:callNo, dbType:{$in:popupDbtypes}}
        };
        DS.send(action,function(rep) {
            pane.html("<div style=\"text-align: center;padding-top: 100px;font-size: 20px;font-weight: bold;\">来电弹出了新窗口</div>");
            var params = "";
            if (callObject) {
                for (var param in callObject) {
                    params += param + "=" + callObject[param] + "&";
                }
                if (session.user) {
                    params += "loginName=" + session.user.loginName;
                }
            }
            if (params) {
                business.url += '?' + params;
            }
            if(business.outOpenType){
                if(business.outOpenType == 'tab'){
                    window.open(business.url, "", "");
                }else{
                    window.open(business.url, "", "fullscreen=yes");
                }
            }else{
                window.open(business.url, "", "fullscreen=yes");
            }
            if(rep.success) {
                var contacts = rep.list;
                if(contacts && contacts.length>0) {
                    if(contacts.length == 1){
                        var data = contacts[0];
                        data.callId = callId;
                        data.notUpdCdr = true;
                        data.phone = callNo;
                        dsevent.publish(dsevent.evt.callRefreshCustomer,data);
                    }else{
                        var data = {};
                        data.callId = callId;
                        data.phone = callNo;
                        data.name="多个匹配客户"
                        dsevent.publish(dsevent.evt.callRefreshCustomer,data);
                    }
                } else {
                    var data = {};
                    data.callId = callId;
                    data.phone = callNo;
                    data.name="未知客户"
                    dsevent.publish(dsevent.evt.callRefreshCustomer,data);
                }
            } else {
                callBack({}, true);
            }
            resize();
        });
    },
    call_popup_custtmpl:function(){
        var custtmpls = getCache('custTmpls');
        var custmpl = [];
        for(var i=0;i<custtmpls.length;i++){
            var cust = custtmpls[i];
            if(cust.call_popup && cust.active+""!='false'){
                custmpl.push(cust._id);
            }
        }
        return custmpl;
    },
    updateCustomerOwner:function(menu,src){
        if(!confirm("确认要占用该客户吗?"))return;
        var pane=$("#"+menu+"_customer");
        var container=pane.find(".baseinfo");
        var cid=container.find('input[name=customerId]').val();
        var dbType=container.find('input[name=dbType]').val();
//        var custTmpl = getCache('custTmpls',dbType);
//        var maxCommon=custTmpl.maxCommon||100;

        var action = {
            action: 'app.customer.useCustomerOwner',
            data: {_id:cid,dbType:dbType}
        };
        DS.send(action,function(rep){
            if(rep.success){
                var param={_id:cid};
                dsevent.publish(dsevent.evt.customerRefresh,param);
                $().alertmessage('showSuccess', "占用客户成功");
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    freeCustomerOwner:function(menu,src){
        if(!confirm("确认要放弃该客户吗,放弃的客户会进入公共客户里?"))return;
        var pane=$("#"+menu+"_customer");
        var container=pane.find(".baseinfo");
        var cid=container.find('input[name=customerId]').val();
        var dbType=container.find('input[name=dbType]').val();

        var action = {
            action: 'app.customer.freeCustomerOwner',
            data: {_id:cid}
        };
        DS.send(action,function(rep){
            if(rep.success){
                var param={_id:cid};
                dsevent.publish(dsevent.evt.customerRefresh,param);
                $().alertmessage('showSuccess', "放弃客户成功");
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    _initStatus:function(pane){
        var tmpls=getCache('custTmpls');
        if(!tmpls || tmpls.length<=0){
            $().alertmessage('showError', "请配置客户数据库");
            return;
        }
//        var dbType=tmpls[0]._id;
        var ary=tmpls[0].status||[];
        var node=pane.find("select[name='status']");
        handler.customer.generateOptions(node.get(0),ary);
//        pane.find(".btn_cancel_edit").click(function(){
//            pane.empty();
//        });
    },
    showBatchStatus:function(menu,src){
//        var pane=$("#"+menu+"_customer");
        var pane=$('#batch_modal');
        var toolbarPane=$("#pane_deal_list");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        num=parseInt(num,10)||0;
        if(num<=0){
            $().alertmessage('showError', "请至少选择一条进行操作！");
            return;
        }
        if(num>10000){
            $().alertmessage('showError', "一次最多操作10000条,请您过滤查询条件分批操作!");
            return;
        }
        DS.getView('customer/customer_batch_update_status',function(view){
            view=view.replace(/_#menu#_/g,menu);
            pane.find('.modal-title').text('批量修改状态');
            pane.find(".modal-body").html(view);
            handler.customer._initStatus(pane);
            $(".cust_count",pane).text(num);
            pane.width(500);
            pane.modal();
        });
    },
    batchUpdateStatus:function(data , src){
        //console.dir(data);
        var menu=data.menu;
        var status=data.status;
//        var pane=$("#"+menu+"_customer");
        var pane=$('#batch_modal');
        var leftPane=$('#contact_list_'+menu);
        var checkPane=leftPane.find(".list_check_all");
        var isAll=checkPane.hasClass("select_on")?"1":"0";
        var query = handler.customer._getSearchCondition(leftPane,isAll);
        var total = parseInt(pane.find(".cust_count").text());
        var action={
            action:'app.customer.batchUpdateStatus2In',
            data: {query:query,status:status,total:total}
        };
        DS.send(action,function(rep){
            if(rep.success){
                dsevent.publish(dsevent.evt.customerRefresh);
                $().alertmessage('showSuccess', "批量修改客户状态成功");
                pane.find(".modal-body").empty();
                pane.modal("hide");
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "您分配的数据总数发生变化，请重新确认后再操作");
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
            }
        });
    },
    getCCName:function(value,isCC){
        value = value || "";
        var parentKeys=[];
        var cust=arguments[2];
//        console.dir(cust)
        if(cust && cust.province){
            parentKeys.push(cust.province);
        }
        var dic = getCCDic(proviceCityDicKey,parentKeys,isCC) || [];
        for (var i = 0; i < dic.length; i++) {
            if (dic[i].key == value) {
                return dic[i].name;
            }
        }
        return value;
    },
    getSexName:function(value){
        var desc="";
        if(value=='0'){
            desc="男";
        }else if(value=="1"){
            desc="女";
        }
        return desc;
    },
    getOwnerName:function(uid){
        var desc="已删除座席";
        if(uid){
            var user=getCache('agents',uid);
            if(user){
                desc= user.displayName;
            }
        }
        return desc;
    },
    getCategoryByNameOrPhone:function(uid){
        var desc = "无归属";
        if(uid){
            var user = getCache('agents',uid);
            if(user){
                desc = user.displayName;
            }else{
                var custCategorys = getCache('custCategorys',uid);
                if(custCategorys){
                    desc = custCategorys.cName;
                }
            }
        }
        return desc;
    },

    syncCustPageItem: function (data,pane,/*0:update,2:status,3:isRead*/type) {
        var item=pane;
        if(type==0){
            if (data.status){
                item.find(".status-name").text(getCache('custTmpls',data.dbType).status[data.status]);
                item.find(".status-name").attr({"title": getCache('custTmpls',data.dbType).status[data.status],"class":"status-name "+data.status});
            }
            if(data.name){
                item.find(".cust-name").text(data.name);
                item.find(".cust-name").attr({"title": data.name});
            }
            if(data.title){
                item.find(".cust-title").text(data.title);
//                item.find(".minor").text(data.title);
            }
            if(data.owner){
                //var owner=getCache('agents',data.owner||'NA');
                //var ownerDesc='公共客户';
                //if(owner){
                //    ownerDesc=owner.displayName;
                //}
                var ownerDesc=handler.customer.showAllForOwnerDesc(data);
                item.find(".cust-owner").text(ownerDesc);
            }
        } else if(type==1){

        } else if(type==2){
            if (data.status) {
                item.find(".status-name").text(getCache('custTmpls',data.dbType).status[data.status]);
                item.find(".status-name").attr({"title": getCache('custTmpls',data.dbType).status[data.status],"class":"status-name "+data.status});
            }
        } else if(type==3){
            item.find(".customer_isRead").html("");
        }
    },
    loadCustAdd2Call:function(pane,data,callback){
        DS.getView('customer/customer_add',function(view){
            var paneId=data.callId+"_callLocation";
            view=view.replace(/_#menu#_/g,paneId).replace(/_#callNo#_/g,data.phone).replace(/_#dealSrc#_/g,"callLocation");
            pane.html(view);
            pane.find(".select_old_cust").show();
            var o=pane.find("#icc_add_customer_dbType");
            var tmpls=getCache('custTmpls');
            if(tmpls && tmpls.length>0){
                var dbType=tmpls[0]._id;
                o.val(dbType);
                handler.customer.loadCustAddTmpl(dbType,pane);
                handler.call._initProviceCity(pane,data.province,data.city);
                var telDesc=checkHideTel(data.phone,pane.find('input[name="tel[]"]'));
                pane.find('input[name="tel[]"]').val(telDesc);
            }
            pane.find(".btn_cancel_edit").click(function(){
                $('#show_cdr_location_cust_Modal').modal('hide');
            });
            if(typeof callback=='function'){
                callback();
            }
        });
    },
    loadCustAdd2CallMore:function(data){
        var params=data.split(",");
        var phone=params[0];
        var paneId=params[1];
        var province=params[2];
        var city=params[3];
        var callId=paneId.split("_")[0];
        var p=$('#show_cdr_location_cust_Modal');
        var pane=p.find(".modal-body");
//        var currentCallSheet = handler.cdr.callSheetDataCache[callId];
//        if (!currentCallSheet) {
//            currentCallSheet = handler.cdr.myCallSheetDataCache[callId];
//        }
        var param={callId:callId,phone:phone,province:province,city:city};
        handler.customer.loadCustAdd2Call(pane,param,null);
    },
    /**
     * 补录客户定位
     * @param data
     * @param src
     */
    locationCustomer: function(data,src,/*是否选择老客户的标记*/isOld) {
//        console.info(data+"  "+isOld);
//        console.dir(src)
        var params=data.split(",");
        var customerId = params[0];
        var paneId = params[1];
        var phone = params[2];
        var callId = paneId.split("_")[0];
        var _param={
            customerId:customerId,
            callId:callId,
            phone:phone,
            dealSrc:"callLocation",
            isOld:isOld
        }
        var action = {
            action: 'app.customer.callLocationCustomer',
            data: _param
        };
        DS.send(action,function(rep) {
            if(rep.success) {
                $().alertmessage('showSuccess',"已定位客户");
                if($('#my_call_sheet_query_link').length>0){
                    $('#my_call_sheet_query_link').trigger('click');
                }
                if($('#call_sheet_query_link').length>0){
                    $('#call_sheet_query_link').trigger('click');
                }
                $('#show_cdr_location_cust_Modal').modal('hide');
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },

    loadCustMore2Call: function(pane,data,callback) {
        var paneId=data.callId+"_callLocation";
        data.popupId="";
        data.id=paneId;
        data.page=1;
        data.limit=handler.call.queryPageSize;
        var action = {
            action: 'app.customer.queryPopupCustomer',
            data: data
        };
        DS.send(action,function(rep) {
            if(rep.success) {
                var contacts = rep.list;
                var count = rep.count;
                DS.getView('call/call_pop_list',function(view){
                    view=DS.renderView(view,data);
                    pane.html(view);
                    pane.find(".pop_cust_create").attr("ds_action","customer.loadCustAdd2CallMore");
                    pane.find(".pop_cust_query").attr("ds_action","customer.queryPopupCustomer");
                    var tds = "";
                    if(contacts && contacts.length > 0) {

                        var param={
                            paneId:paneId,
                            phone:data.phone,
                            popupId:""
                        }
//                        ds_data='__id,"+data.callId+","+data.phone+"'
                        var dsAction="customer.locationCustomer";
                        tds=handler.call.popupCustMoreData(contacts,param,dsAction);
                    }

                    DS.updatePagination("query_customer_form_"+paneId, count, data.limit, data.page);
                    var paneBody = pane.find("#customer_list_pane_"+paneId);
                    paneBody.html(tds);
                    if(typeof callback=='function'){
                        callback();
                    }
                });
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    queryPopupCustomer: function(data,src) {
        var pane=$("#"+data.callId);
//        console.dir(data);
        var _ary=data.callId.split("_");
        var callId=_ary[0];
        if(data.callId.indexOf("customerLeak")!=-1){
            pane=$("#my_call_sheet_leak_customerLeak");
        }else if(data.callId.indexOf("callLocation")!=-1){
            pane=$("#show_cdr_location_cust_Modal");
        }

        var page=1;
        if(src && !src.hasClass("ds_do_action"))page=src.val();
        if(!page)page=1;
        data.page=page;
        data.limit=handler.call.queryPageSize;
        var action = {
            action: 'app.customer.queryPopupCustomer',
            data: data
        };
        DS.send(action,function(rep) {
            if(rep.success) {
                var contacts = rep.list;
                var count = rep.count;
                var tds = "";
                if(contacts && contacts.length > 0) {

                    var param={
                        paneId:data.callId,
                        phone:data.phone,
                        popupId:""
                    }
//                        ds_data='__id,"+data.callId+","+data.phone+"'
                    var dsAction="customer.locationCustomer";
                    tds=handler.call.popupCustMoreData(contacts,param,dsAction);
                }
                DS.updatePagination("query_customer_form_"+data.callId, count, data.limit, data.page);
                var paneBody = pane.find("#customer_list_pane_"+data.callId);
//                pane.find(".location_phone").css("display","none");
                paneBody.html(tds);
            }
        });
    },
    downloadTmpl:function(){
        var url="./template/customer_template.xlsx?1";
        DS.downloadFile(url);
    },

    uploadProgress:function(evt,src) {
        var pane=src.closest(".edit_customer");
        var progress=pane.find(".progress.attach");
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
    uploadAttachSucess:function(evt,src){
        var rep = $.parseJSON(evt.target.responseText);
        if(rep && !rep.success){
            $().alertmessage('showError', '上传文件失败，请检查网络或文件是否正确');
            return;
        }
        var fileName=rep.filePath.substring(rep.filePath.lastIndexOf("/")+1);
        var trueName=rep.fileName;
        var pane=src.closest(".edit_customer");
        handler.customer.showAttach(pane,fileName,trueName);
    },
    showAttach:function(pane,fileName,trueName){
        var data={fileId:fileName,trueName:trueName,suffix:'other',isNew:"1"};
        var ul=pane.find(".thumbnails_customer");
        var imgTypes=["jpg","jpeg",'gif','png',"bmp"];
        var suffix=trueName.substring(trueName.lastIndexOf(".")+1);
        suffix=suffix.toLowerCase();
        if($.inArray(suffix,imgTypes)!=-1){
            data.suffix='img';
        }
        ul.append($("#tmpl_customer_attach").tmpl(data));
    },
    /* delAttach:function(fileId,src){
     if(!confirm('确认删除吗？'))return;
     var body=src.closest(".right_column");
     var _suffix="";
     var thumb=src.closest("li");
     var itemId=body.find("input[name='_id']").val();
     var attachs=[];
     var pane=src.closest(".edit_customer");
     pane.find(".thumbnails_customer .attachitem").each(function(i){
     var id=$(this).attr("ds_data");
     if(id!=fileId){
     var files={
     id:$(this).attr("ds_data"),
     name:$(this).text(),
     type:$(this).attr("suffix"),
     isNew:$(this).attr("isNew")
     };
     attachs.push(files);
     }else{
     _suffix=handler.customer.getImgSuffix($(this).text());
     }
     });
     var action={
     action:"app.customer.delCustomerAttach",
     data:{_id:itemId,attachs:attachs,delId:fileId,suffix:_suffix}
     } ;
     DS.send(action,function(rep){
     if(rep.success){
     thumb.remove();
     }else{
     $().alertmessage('showError', errMsg);
     }
     });
     },*/
    delCustomerAttach:function(fileId,src){
        if(!confirm("确认删除此附件吗？"))return;
        var body=src.closest("form");
        var _suffix="";
        var thumb=src.closest("li");
        var custId=body.find("input[name='_id']").val();
        var attachs=[];
        var pane=src.closest(".edit_customer");
        pane.find(".thumbnails_customer .attachitem").each(function(i){
            var id=$(this).attr("ds_data");
            if(id!=fileId){
                var files={
                    id:$(this).attr("ds_data"),
                    name:$(this).text(),
                    type:$(this).attr("suffix"),
                    isNew:$(this).attr("isNew")
                };
                attachs.push(files);
            }else{
                //_suffix=handler.customer.getImgSuffix($(this).text());
            }
        });
        var action={
            action:"app.customer.delCustomerAttach",
            data:{_id:custId,attachs:attachs,fileId:fileId}
        } ;
        DS.send(action,function(rep){
            if(rep.success){
                thumb.remove();
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    downloadAttach:function(data,src){
        var suffix=src.attr("suffix");
        var file_name = src.text();
        var durl= qiniu7moorDomain+data+"?attname="+file_name;
        if(suffix=='app'){
            durl="./fileDownload?fileId="+data;
            downloadFile(durl);
        }else{
            downloadFile(durl,session);
        }
    },
    getImgSuffix:function(name){
        if(!name)return "";
        var suffix=name.substring(name.lastIndexOf("."));
        return suffix;
    },
    showBigAttach:function(name,src){
//        var container=src.closest(".contact_summary");
        var attachName=src.attr("attachName");
        var qiniu7moor = qiniu7moorDomain;
        var fileId=name.substring(0,name.lastIndexOf("_big"));
        var html='<div class="text-center"><img src="qiniu7moorDomain/__fileName" title="${name}"  class="img-rounded"/></div>';
        html = html.replace(/qiniu7moorDomain/g, qiniu7moor).replace(/__fileName/g, fileId);
        var pane =$('#showBigImgModal');
        pane.find(".modal-title").text("查看大图--"+attachName);
        pane.find(".modal-body").html(html);
        pane.modal();
    },
    report:{
        customer_change_report:function(menu){
            var tmpl=getCache('custTmpls')[0];
            var pane=$("#" + menu + "_report_pane");
            pane.find("input[name='dbType']").val(tmpl._id);
            var status = tmpl.status;
            var headTmp = "<th>_name</th>";
            var html = "";
            for (var k in status) {
                html += headTmp.replace(/_name/g, status[k]);
            }
            pane.find("table").find("thead").find("tr").append(html);
            pane.find(".form_query_button").click();
        }
    },
    loadCustUpdates:function(data,pane){
//        var action = {
//            action: 'app.customer.queryCustNote',
//            data: {customerId:custId}
//        };
//        DS.send(action,function(rep){
//            if(rep.success) {
//                callBack(null, rep.list);
//            }else {
//                callBack(new Error());
//            }
//        });
        var content = pane.find(".timeLine_list");
        DS.getView("customer/customer_updates", function (view) {
            content.html(view);
        });
    },
    showCrash:function(){
        var p=$('#batch_modal');
        DS.getView('customer/customer_crash',function(view){
//            pane.empty();
//            pane.html(view);
            p.find('.modal-title').text('撞单查询');
            p.find(".modal-body").html(view);
            p.width(500);
            p.modal();
        });

//        var pane=$("#show_popup_location_cust_Modal");
//        var param={_id:data,callTel:callTel};
//        DS.getView('call/show_selectCustomer',function(view){
//            view=DS.renderViewNew(view,param);
//            var body=pane.find(".modal-body");
//            body.html(view);
//            DS.updatePagination("popup_query_customer_form_"+data, 0,10, 1);
//            pane.modal();
//        });
    },
    showMailInfo:function(mail,src){
        var html='<a href="#" onclick="mailTo(\''+mail+'\')">'+mail+'</a>';
        if(isHasMenu("config_channel")||isHasMenu("my_mail_deal")||isHasMenu("my_weixin_deal")){
            html='<a href="#" class="ds_do_action" ds_action="callMail.showNewMailReply" ds_data="'+mail+'">'+mail+'</a>';
        }
        return html;
    },
    showWeixinInfo:function(num,memo){
        var html='<a href="#">'+memo+'</a>';
        if(isHasMenu("nav_weixin")||isHasMenu("nav_history")){
            html='<a href="#" class="ds_do_action" ds_action="callWeixin.showUserHistory" ds_data="'+num+'_">'+memo+'</a>';
        }
        return html;
    },
    loadWeixinByCustId:function(custId, callBack){
        var param={
            customerId:custId
        }
        var action = {
            action: "app.weixin.queryUserHistoryByCustId",
            data: param
        };
        DS.send(action, function (rep) {
            if(rep.success){
                callBack(null, rep.list);
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    loadMailByCustId:function(cid, callBack){
        var param={
            customerId:cid
        }
        var action = {
            action: "app.email.queryMailListByCustID",
            data: param
        };
        DS.send(action, function (rep) {
            if(rep.success){
                callBack(null, rep.list);
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    loadWebchatByCustId:function(custId, callBack){
        var param={
            customerId:custId
        }
        var action = {
            action: "app.webchat.queryUserByCustId",
            data: param
        };
        DS.send(action, function (rep) {
            if(rep.success){
                callBack(null, rep.list);
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    getRequest:function(data){
    var url = data //获取url中"?"符后的字串
    var theRequest = new Object();
    if (url.indexOf("?") != -1) {
        var str = url.split('?')[1];
        strs = str.split("&");
        for(var i = 0; i < strs.length; i ++) {
            theRequest[strs[i].split("=")[0]]=unescape(strs[i].split("=")[1]);
        }
    }
    return theRequest;
},
CRMPopoverShow:function(data,src) {
        var CRMPopover = $("#CRMPopover");
        CRMPopover.addClass('CRMPopover').show();
        if(CRMPopover.width() == 200){
            CRMPopover.find('.minimize_btn').click();
        }
    var urlData = handler.customer.getRequest(data);
    if (session.account.tokenCheck) {
        var res = getToken();
        if (res.token) {
            urlData['token'] = res.token;
            urlData['tokenId'] = res.tokenId;
        }
    }
    data = data.split('?')[0]+"?";
    for(var i in urlData){
        data +=i+'='+urlData[i]+'&';
    }
    data = data.substring(0, data.length-1);
            CRMPopover.find('.panel-title').text(src.siblings('a').attr('title'));
            CRMPopover.find('.CRM_wrap').empty();
            if(data.split('?')[0] == 'http://www.taobao.com'){
                CRMPopover.find('.CRM_wrap').append('<iframe class="CRM_content" id="CRM_content" src="'+data+'" frameborder="0" scrolling="auto" style="min-width:1100px"></iframe>');
            }else{
                CRMPopover.find('.CRM_wrap').append('<iframe class="CRM_content" id="CRM_content" src="'+data+'" frameborder="0" scrolling="auto" ></iframe>');
            }
            var l = CRMPopover.offset().left + 'px';
            var t = (CRMPopover.offset().top > 51 ? CRMPopover.offset().top : 51) + 'px';
            CRMPopover.css({left: l, top: t, right: 'auto', bottom: 'auto'})
    },
    swapFunTab:function(data,src){
        var pane=src.closest(".contact_summary");
        var container=pane.find(".func_tab_container");
        var key=src.attr("ds_attr");
        var todoContainer=pane.closest(".call_detail");
        var _p=todoContainer.find(".cust_tab_content");
        var _pBus = _p.find('.cust_tab_content_bus');
        var _pOther = _p.find('.cust_tab_content_other');
        //注释的代码适用于云客服，云电销没有邮件模块
        /*if(_p.hasClass('email_cust_tab_content')){
            _p.attr('style', 'overflow: auto; height: 680px;').siblings('.cust_tab_url').attr('style','display: none');
        }else{
            _p.attr('style', 'padding: 18px; overflow: auto; height: 680px;').siblings('.cust_tab_url').attr('style','display: none');
        }*/
        container.find(".func_tab").removeClass("active");

        src.addClass("active");
        if(data == 'business') {
            _pBus.show().siblings('.cust_tab_content_other').hide();
            resize();
        } else {
            _pBus.hide().siblings('.cust_tab_content_other').show();
        }
        if(data == 'cdr'){
            //handler.cdr.showCdrDetail(key,src);
            var action = {
                action: 'app.callSheet.relocationCustomer',
                data: {_id:key}
            };
            DS.send(action,function(rep) {
                if (rep.success) {
                    var callDB=rep.row||{};
                    var callId=callDB.CALL_SHEET_ID;
                    var p = src.closest(".call_detail").find(".call_body").find('.cust_tab_content_other');
                    handler.channelHistory._loadCallInfo(p, callDB,callId);
                } else {
                    $().alertmessage('showError', '获取缓存数据失败');
                }
            });
        }else if(data=='webchat'){
            handler.webchat.loadChatTab(key,src);
        }else if(data=='business'){
            var busId=src.attr("ds_busId")||'';
            if(_p.find('.business_newbuild').size()>0){
                return;
            }
            var _c='<div class="business-info" ds_menu="'+data+'"></div><div class="business_info_history" ds_menu="'+data+'_history"></div>';
            _pBus.html(_c);
            var task=_pBus.find(".business-info");
            var rid=uuid.v1();

            //console.info("busId===="+busId);
            handler.business.loadTaskInfo(task,rid,key,busId,null,null,function(response){
                if(busId && response){
                    var showHistory = [];
                    var history = response.data.history || [];
                    for (var i = 0; i < history.length; i++) {
                        var historyItem = history[i];
                        if (historyItem.action && historyItem.action == 'complete')continue;
                        var histroyMaster = historyItem.master;
                        if(historyItem.action && historyItem.action == "backIn"){
                            histroyMaster = historyItem.excuteUser;
                        }
                        var showItem = {
                            time: historyItem.time,
                            user: handler.business.getUserNameById(histroyMaster),
                            info: handler.business.getBusinessHisotryInfo(historyItem, historyItem.step, historyItem.fromStep, historyItem.excuteAction),
                            data: handler.business.getBusinessHistoryData(historyItem, response.data,"businessFlow")
                        };
                         var UStep = historyItem.stepProcessTime?handler.business.getTimeByMs("second",historyItem.stepProcessTime):-1;
                            var step = historyItem.ctype&&historyItem.ctime?handler.business.getTimeByMs(historyItem.ctype,historyItem.ctime):-1;
                            showItem.color=UStep>step&&step!==-1?"red":"#666";
                             showItem.stepUseTime = historyItem.stepProcessTime>=0?handler.business.taskTimeAll("second",historyItem.stepProcessTime):-1;
                            showItem.stepTime = historyItem.ctype&&historyItem.ctime?handler.business.taskTimeAll(historyItem.ctype,historyItem.ctime):-1;
                            showItem.setpOrTransform = historyItem.action !== "transformIn"?"停留":"步骤所用";
                            showHistory.push(showItem);
                        }
                        if(showHistory && showHistory.length>0) {
                            DS.getView('business/bus_history_item', function (view) {
                                var val = "";
                                 for (var i = 0; i < showHistory.length; i++) {
                                    var html = render.renderActiveHistory(showHistory[i], view, "businessFlow");
                                    var isUShow = showHistory[i].stepUseTime===-1?"none":"inline-block";
                                    var isShow = showHistory[i].stepTime===-1?"none":"inline-block";

                                   val += html.replace(/__stepUseTime/g,showHistory[i].stepUseTime)
                                              .replace(/__color/g,showHistory[i].color)
                                              .replace(/__isUShow/g,isUShow)
                                              .replace(/__isShow/g,isShow)
                                              .replace(/__stepTime/g,showHistory[i].stepTime)
                                              .replace(/__setpOrTransform/g,showHistory[i].setpOrTransform);
                                }
                            
                            task.append(val);
                            resizeRightContent(_p);
                        })
                    }
                }else{
                    resizeRightContent(_p);
                }
            });
            handler.business.loadHistoryTaskInfo(key,_pBus);
           /* if(busId){
                handler.business.getBusinessHistory(busId, function(err,list){
                    if(!err && list && list.length>0){
                        DS.getView('business/bus_history_item',function(view) {
                            var val = "";
                            for(var i = 0; i < list.length; i++) {
                                val += render.renderActiveHistory(list[i], view, "businessFlow");
                            }
                            _p.append(val);

                            resizeRightContent(_p);
                        })
                    }
                });
            }*/
        }else if(data=='action'){
            var _c='<div class="next-action-form" ds_menu="webchat"></div><div class="history_action_form"></div>';
            _pOther.html(_c);

            if(handler.customer.custDetail._id){
                 handler.customer.initActionView(handler.customer.custDetail,_p,"channel");
                 handler.customer.custDetail = {};
             }else{
                    var action = {
                    action: 'app.customer.queryCustInfo',
                    data: {_id: key}
                };
                DS.send(action,function(response){
                    if(response.success){
                        var item=response.data;
                    handler.customer.initActionView(item,_pOther,"channel");
                        //handler.customer.loadNoteDbTempl(item,callBack);
                    } else {
                        $().alertmessage('showError', errMsg);
                    }
                });
            }
            //联系历史的显示
            handler.customer.showHistoryAction(key,_pOther);
        }else if(data=='history'){
            handler.customer.loadCommonHistory(key,_pOther);
        }else if(data=='changeLog'){
            handler.customer.loadChangeLog(key,_pOther);
        }else if(data == 'taskagent'){
            var _param=$("#agent_called_task_info").data("custInfo");
            taskId=_param.taskId;
            sampleId=_param.sampleId;
            phone=_param.phone;
            owner=_param.owner;
            handler.customer.task._loadCalledTaskInfo(taskId,phone,owner);
        }else if(data == "approval_business"){
            var busId=src.attr("ds_busId")||'';
            handler.customer.approvalBusiness.showApprovalBusinessDetail(busId,_pOther);
        }
    },
    showHistoryAction:function(key,_p){
        var action = {
            action : "app.customer.queryCustCommonHistory",
            data :{customer:key,type:'note'}
        };
        DS.send(action , function(response){
            if(response.success){
                var data = response.data || {};
                handler.customer.processHistoryData(data);
                data.key = key;
                var html = template('history_action_form_template',data)
                _p.find('.history_action_form').empty().html(html);
                //禁止备注编辑
                if(session.user.isAdmin || isHasFunc("func_not_edit_remark_field")){
                    $(".his_comment").removeClass("ds_do_action");
                }
                if(data.list.length>handler.customer.custLogLimit){
                    _p.find('.history_action_form').append()
                }
                var state = DS.getCookie("his_note_ishide");
                if (state) {
                    $('.show_note_preview').attr("checked","checked");
                    $('.his_note_ishide').show();
                } else {
                    $('.show_note_preview').removeAttr("checked");
                    $('.his_note_ishide').attr("style","display:none");
                }
                $('.show_note_preview').change(function(event) {
                    var value = $(this).is(':checked') ? $(this).is(':checked') : '';
                    DS.setCookie("his_note_ishide", value, 30);
                    if (value) {
                        $('.his_note_ishide').show();
                        $('.show_note_preview').attr("checked","checked");
                    } else {
                        $('.his_note_ishide').attr("style", "display:none");
                        $('.show_note_preview').removeAttr("checked");
                    }
                });
            } else {
                $().alertmessage('showError', "获取历史数据异常！");
            }
        });
    },
    showBusDetail: function(busId,src){
        //console.info("showBusDetail busId===="+busId);
        var _p=$('#batch_modal');
        var body=_p.find(".modal-body");
        _p.find('.modal-title').text('工单明细');
        var _c='<div class="business-info" ds_menu=""></div>';
        body.html(_c);
        var frm = $('#frm_cust_his_quick_search')
        var task=_p.find(".business-info").attr('hisSearchDate',frm.find('input[name="date"]').val()).attr('hisSearchType',frm.find('input[name="type"]').val());
        var rid=uuid.v1();
        handler.business.loadTaskInfo(task,rid,'',busId,null,null,function(response){
            if(busId && response){
                var showHistory = [];
                var history = response.data.history || [];
                for (var i = 0; i < history.length; i++) {
                    var historyItem = history[i];
                    if (historyItem.action && historyItem.action == 'complete')continue;
                    var histroyMaster = historyItem.master;
                    if(historyItem.action && historyItem.action == "backIn"){
                        histroyMaster = historyItem.excuteUser;
                    }
                    var showItem = {
                        time: historyItem.time,
                        user: handler.business.getUserNameById(histroyMaster),
                        info: handler.business.getBusinessHisotryInfo(historyItem, historyItem.step, historyItem.fromStep, historyItem.excuteAction),
                        data: handler.business.getBusinessHistoryData(historyItem, response.data,"businessFlow")
                    };
                   var UStep = historyItem.stepProcessTime?handler.business.getTimeByMs("second",historyItem.stepProcessTime):-1;
                            var step = historyItem.ctype&&historyItem.ctime?handler.business.getTimeByMs(historyItem.ctype,historyItem.ctime):-1;
                            showItem.color=UStep>step&&step!==-1?"red":"#666";
                             showItem.stepUseTime = historyItem.stepProcessTime>=0?handler.business.taskTimeAll("second",historyItem.stepProcessTime):-1;
                            showItem.stepTime = historyItem.ctype&&historyItem.ctime?handler.business.taskTimeAll(historyItem.ctype,historyItem.ctime):-1;
                            showItem.setpOrTransform = historyItem.action !== "transformIn"?"停留":"步骤所用";
                            showHistory.push(showItem);
                        }
                        if(showHistory && showHistory.length>0) {
                            DS.getView('business/bus_history_item', function (view) {
                                var val = "";
                                 for (var i = 0; i < showHistory.length; i++) {
                                    var html = render.renderActiveHistory(showHistory[i], view, "businessFlow");
                                    var isUShow = showHistory[i].stepUseTime===-1?"none":"inline-block";
                                    var isShow = showHistory[i].stepTime===-1?"none":"inline-block";

                                   val += html.replace(/__stepUseTime/g,showHistory[i].stepUseTime)
                                              .replace(/__color/g,showHistory[i].color)
                                              .replace(/__isUShow/g,isUShow)
                                              .replace(/__isShow/g,isShow)
                                              .replace(/__stepTime/g,showHistory[i].stepTime)
                                              .replace(/__setpOrTransform/g,showHistory[i].setpOrTransform);
                                }
                         _p.find(".business-info").append(val);

                    })
                }
                _p.width(700);
                _p.modal();
            }else{
            }
        });
    },
    showChatDetail: function(sid, src){
        var _p=$('#batch_modal');
        var body=_p.find(".modal-body");
        _p.find('.modal-title').text('会话记录');
        var _c='<div class="call_detail" id="'+sid+'_relocationWebchat_customerHistory"><div class="cust_tab_content" style="height:400px;" ds_menu=""><div class="cust_tab_content_other"></div>'+
            '<div class="cust_tab_content_bus"></div></div></div>';
        body.html(_c);
        var webchat=_p.find(".cust_tab_content");
        var pane = _p.find("#"+sid+"_relocationWebchat_customerHistory");
        var customerPane = $(src).closest("#view_customer_list_content");
        var custId = customerPane.find("input[name=customerId]").val();
        var custName = customerPane.find(".contact_name>span").attr("title");
        //console.log({custId: custId, custName: custName});
        pane.data("chatInfo",{custId: custId, custName: custName});
        handler.webchat.loadChatTab(sid, webchat, function(){
            _p.find(".span3").remove();
            _p.find(".span9").attr("class", "span12");
            _p.find(".chat_msg").css("height", "350px");
            _p.find(".msg_inner").css("min-height", "300px");
            _p.width(700);
            _p.modal();
        });

    },
    showApprBusDetail : function(data,src){
        var parm = data.split(",");
        var historyId = parm[0];
        var apprId = parm[1];
        var action = {
            action: "app.customer.approvalBusiness.showApprBusDetail",
            data: {"historyId":historyId,"apprId":apprId}
        };
        DS.send(action, function (rep) {
            if(rep.success){
                var pane=$('#batch_modal');
                var custApprovalBusiness = rep.custApprovalBusiness;
                var history = rep.history;
                DS.getView("customer/approvalBusiness/approval_bus_history_item", function (view) {
                    pane.find('.modal-title').text('跟进状态审明细');
                    var createUser = handler.customer.task.getAgentName(custApprovalBusiness.createUser);
                    var apprUser = handler.customer.task.getAgentName(custApprovalBusiness.owner);
                    var infoHtml = render.randerApprovalBusinessInfo(custApprovalBusiness,"");
                    var resultHtml = render.randerApprovalBusinessResult(custApprovalBusiness,"")
                    view = view.replace(/__createTime/g, custApprovalBusiness.createTime)
                        .replace(/__creator/g, createUser).
                        replace(/__apprTime/g, custApprovalBusiness.lastTime).
                        replace(/__apprUser/g, apprUser).
                        replace(/__info/g, infoHtml).
                        replace(/__result/g, resultHtml);
                    pane.find(".modal-body").html(view);
                    pane.find(".func_hide").remove();
                    pane.width(600);
                    pane.modal();

                });
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        });
    },
    showPopUpdate: function(menu,src){
        var chatPane=src.closest(".call_detail");

        var sid=null;
        var flag=null;

        if(menu=='popupWebchat' || menu=='relocationWebchat'){
            var _param=chatPane.data("chatInfo");
            sid=_param.sid;
            flag=_param.flag;
        }else if(menu=='relocationCall'){
            var _param=chatPane.data("cdrInfo");
            sid=_param.callId;
            flag=_param.flag;
        }else if(menu=='customer'){
            sid=handler.customer.curSubMenu;
            flag="customer";
        }else if(menu=='popup'){
            var _id=chatPane.attr("id");
            var ary=_id.split("_");
            sid=ary[0];
            flag="popup";
        }else if(menu=='dialPopup'){
            var _id=chatPane.attr("id");
            var ary=_id.split("_");
            sid=ary[0];
            flag="dialPopup";
        }else if(menu=='business'){
            sid="nav_business";
            flag="business";
        }
        var paneId=sid+"_"+flag;

        var parent=src.closest(".contact_summary");
        var container=parent.find(".baseinfo");
        var cid=container.find('input[name=customerId]').val();
        var dbType=container.find('input[name=dbType]').val();

        var pane=$('#batch_modal');
        DS.getView("customer/customer_update_pop", function (view) {
            pane.find('.modal-title').text('更新客户');
            view=view.replace(/_#id#_/g,cid).replace(/_#menu#_/g,sid).replace(/_#flag#_/g,flag);;
            pane.find(".modal-body").html(view);
/*            if(isHasFunc("func_nodelete_customer") || menu=='popup'){
                var _obj=pane.find(".func_hide");
                if(_obj){
                    _obj.remove();
                }
            }else{
                pane.find(".func_hide").show();
            }*/

            pane.find(".func_hide").remove();
            handler.customer.loadCustUpdateTmpl(cid,dbType,pane,function(){
                pane.width(600);
                pane.modal();
                //外呼任务禁止修改owner
                if(menu == "agentCustInfo" || menu == "agentCalledCustInfo"){
                    pane.find(".combobox_agent").css("z-index",-1);
                }
            });

        });
    },
    showPopAdd: function(menu,src){
        var chatPane=src.closest(".call_detail");
        var sid=null;
        var flag=null;
        var flagId=null;
        var taskId ="";
        var sampleId ="";
        var phone="";
        if(menu=='popupWebchat' || menu=='relocationWebchat'){
            var _param=chatPane.data("chatInfo");
            sid=_param.sid;
            flag=_param.flag;
        }else if(menu=='relocationCall'){
            var _param=chatPane.data("cdrInfo");
            sid=_param.callId;
            flagId=_param.flag;
            flag="_"+chatPane.attr("id").split("__")[1];
            if(menu=='sheetLeak'){
                sheetLeak=_param.SheetLeakId;
            }
            phone=_param.phone;
            //console.dir(_param)
        }else if(menu =='taskAgentAdd'||menu =='taskAgentCalledAdd'){
            var _param=chatPane.data("custInfo");
            sid=_param.taskId;
            flagId=_param.flag;
            taskId=_param.taskId;
            sampleId=_param.sampleId;
            flag=_param.flag;
        }

        var paneId=sid+"_"+flag;

        var parent=src.closest(".contact_summary");
        var container=parent.find(".baseinfo");

        var pane=$('#batch_modal');
        DS.getView("customer/customer_add_pop", function (view) {
            pane.find('.modal-title').text('增加客户');
            view=view.replace(/_#menu#_/g,paneId).replace(/_#dealSrc#_/g,flagId).replace(/_#callNo#_/g,phone).replace(/_#taskId#_/g,taskId).replace(/_#sampleId#_/g,sampleId);
            pane.find(".modal-body").html(view);
            var o=pane.find("#icc_add_customer_dbType");
            var tmpls=getCache('custTmpls');
            if(tmpls && tmpls.length>0){
                var dbType=tmpls[0]._id;
                o.val(dbType);
                handler.customer.loadCustAddTmpl(dbType,pane);
                var telItems=pane.find("input[name='tel[]']");
                if(telItems.length>0){
                    var _tel=getEncryptTel(phone);
                    $(telItems[0]).val(checkHideTel(_tel)).attr("bgTel",phone);
                }
            }
            var _p=container.find(".cust_base_fields");
            if(_p.length>0 && _p.hasClass("autoMatch")){
                var val1=_p.find("input[name=custName]").val();
                var val2=_p.find("input[name=custPhone]").val();
                var val3=_p.find("input[name=custContact]").val();
                if(val1){
                    pane.find("input[name='name']").val(val1);
                }
                if(val2){
                    pane.find("input[name='tel[]']").val(val2);
                }
                if(val3){
                    pane.find("input[name='memo[]']").val(val3);
                }
            }
            //支持外呼任务-座席
            if(menu =='taskAgentAdd' || menu == "taskAgentCalledAdd"){
                var _param=chatPane.data("custInfo");
                phone=_param.phone;
                name=_param.name;
                note=_param.note;
                source=_param.source;
                if(name){
                    pane.find("input[name='name']").val(name);
                }
                if(phone){
                    pane.find("input[name='tel[]']").val(checkHideTel(phone,pane.find("input[name='tel[]']")));
                }
                if(note){
                    pane.find("input[name='title']").val(note);
                }
                if(source){
                    pane.find("select[name=custsource1]").find("option[value="+source+"]").attr("selected",true);
                }
            }

            pane.width(600);
            pane.modal();
        });
    },


    getSourceDesc:function(val){
        var dic=getCache('custTmpls');
        dic=dic[0];
        var ary=dic.source||[];
        var desc="";
        for(var i=0;i<ary.length;i++){
            var obj=ary[i];
            if(obj.key==val){
                desc=obj.name;
            }
        }
        return desc;
    },
    showSelectOldCust:function(paneId,src){
        var pane=$("#show_popup_location_cust_Modal");
        var phone=$("#"+paneId).attr("phone")||'';
        var param={_id:paneId,callTel:phone};
        DS.getView('call/show_selectCustomer',function(view){
            view=DS.renderViewNew(view,param);
            var body=pane.find(".modal-body");
            body.html(view);
            DS.updatePagination("popup_query_customer_form_"+paneId, 0,10, 1);
            pane.modal();
        });
    },
    showSelectMultiCust:function(paneId,src){
        var pane=$("#show_popup_location_cust_Modal");
        var _c=$("#"+paneId);
        var phone=_c.attr("phone");
        var phone2=getEncryptTel(phone);
        var desc=checkHideTel(phone2);

        var param={_id:paneId,callTel:phone};

        DS.getView('call/show_selectCustomer',function(view){
            view=DS.renderViewNew(view,param);
            var body=pane.find(".modal-body");
            body.html(view);
            DS.updatePagination("popup_query_customer_form_"+paneId, 0,10, 1);

            body.find('a[ds_data="phone"]').click();
            body.find('input[name="combox"]').val(desc);
            body.find('.pop_cust_query').click();

            pane.modal();
        });
    },
    dealNote2Tab:function(data,src){
        var isComplete=src.hasClass("done_marker");
        var cId=data.custId;
        var t=src.closest(".next-action-form");
        var item={};
        if(!isComplete){
            item={
                actionId:data.lastActionId,
                _id: cId,
                notifyTime: data.default_action_date,
                action: data.default_action,
                status:"0"
            }
        } else{
            item={
                actionId:data.actionId,
                _id: cId,
                notifyTime: '',
                action: '' ,
                status:"1"
            }
        }
        var action = {
            action: 'app.customer.dealNote',
            data: item
        };
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.data;
                handler.customer.dealAfter2Tab(t,isComplete);
                dsevent.publish(dsevent.evt.action,row);
                t.siblings('.history_action_form').find('.history_action_form_show').click();
            }else{
                $().alertmessage('showError', errMsg);
            }
            src.removeClass("disabled");
        });
    },
    saveCustAction2Tab:function (data,src) {
        if (src.hasClass("disabled")) return false;
        //var parent=src.closest(".contact_summary");

        var cId=data.custId;
        var e=src.closest(".next-action-form");
        var cdate=e.find("input[name='notifyTime_date']").val();
        var ctime=e.find("input[name='notifyTime_time']").val();
        var notifyTime = cdate+" "+ctime;
        var remark = e.find("input[name='remark']").val();
        var actionId= e.find('input[name="actionId"]').val();
        if (!$.trim(remark)) {
            $().alertmessage('showError', "联系内容不能为空!");
            e.find("input[name='remark']").focus();
            return false;
        }
        if ($.trim(remark).length > 140) {
            $().alertmessage('showError', "联系内容最大140个汉字!");
            e.find("input[name='remark']").focus();
            return false;
        }
        if (!cdate) {
            $().alertmessage('showError', "联系日期不能为空!");
            e.find("input[name='notifyTime_date']").focus();
            return false;
        }
        if (!ctime) {
            $().alertmessage('showError', "联系时间不能为空!");
            e.find("input[name='notifyTime_time']").focus();
            return false;
        }
        src.addClass("disabled");
        var url='app.customer.addNote';
        var item={
            accountId:session.user.account,userId:session.user._id,
            remark:remark,notifyTime: notifyTime,customerId: cId
        }
        if(actionId){
            url='app.customer.updateNote';
            item._id=actionId;
        }
        var action = {
            action: url,
            data: item
        };
        DS.send(action,function(rep){
            if(rep.success){
                handler.customer.saveAfter(e,rep.data);
                e.siblings('.history_action_form').find('.history_action_form_show').click();
            }else{
                $().alertmessage('showError', errMsg);
            }
            src.removeClass("disabled");
        });
    },
    editCustAction2Tab : function(data){
        DS.getView('customer/editCustAction', function(view){
            var panel = $('#modal_panel');
            panel.empty();
            var currentCallSheet = handler.cdr.callSheetDataCache[data];
            if (!currentCallSheet) {
                currentCallSheet = handler.cdr.myCallSheetDataCache[data];
            }
            if(currentCallSheet){
                panel.append(view.replace(/__CALL_SHEET_ID/g,data)
                    .replace(/__CDR_MEMO/g,currentCallSheet.COMMENTS?currentCallSheet.COMMENTS:''));
                $('#show_cdr_add_memo_Modal').modal();
            }else{
                var action = {
                    action : 'app.customer.getNote',
                    data : data
                };
                DS.send(action,function(res){
                    panel.append(view.replace(/__CALL_SHEET_ID/g,data)
                        .replace(/__CDR_MEMO/g,res.data.remark)
                        .replace(/notifyTime/g,res.data.notifyTime)
                        .replace(/cId/g,res.data.customerId));
                    $('#show_cdr_add_memo_Modal').modal();
                });
            }
        });
    },
    updateCustAction2Tab : function (data, src) {
        var _id = data.CALL_SHEET_ID;
        var remark = data.memo;
        var notifyTime = data.CALL_SHEET_NOT;
        var cId = data.CALL_SHEET_CID;
        if (!$.trim(remark)) {
            $().alertmessage('showError', "联系内容不能为空!");
            src.find("textarea[name='memo']").focus();
            return false;
        }
        if ($.trim(remark).length > 140) {
            $().alertmessage('showError', "联系内容最大140个汉字!");
            src.find("textarea[name='memo']").focus();
            return false;
        }
        var item={
            accountId:session.user.account,userId:session.user._id,
            remark:remark,notifyTime: notifyTime,customerId: cId,_id:_id
        };
        var action = {
            action: 'app.customer.updateNote',
            data: item
        };
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess','保存备注成功!');
                var newDom = '';
                if (data.memo) {
                    var state = DS.getCookie("his_note_ishide");
                    if (state) {
                        newDom+='<span class="his_note_ishide">'+'['+data.CALL_SHEET_NOT+']'+data.memo+'</span><a href="#" class="his_comment ds_do_action" data-toggle="popover" ds_action="customer.editCustAction2Tab" ds_data="'+data.CALL_SHEET_ID+'" data-placement="top" data-content="['+data.CALL_SHEET_NOT+"]"+data.memo+'" data-original-title=""><img src="../../img/contact_history/comment_e.png" width="13"></a>';
                    } else {
                        newDom+='<span class="his_note_ishide" style="display:none">'+'['+data.CALL_SHEET_NOT+']'+data.memo+'</span><a href="#" class="his_comment ds_do_action" data-toggle="popover" ds_action="customer.editCustAction2Tab" ds_data="'+data.CALL_SHEET_ID+'" data-placement="top" data-content="['+data.CALL_SHEET_NOT+"]"+data.memo+'" data-original-title=""><img src="../../img/contact_history/comment_e.png" width="13"></a>';
                    }
                } else {
                    newDom+='<a href="#" class="his_comment ds_do_action" data-toggle="popover" ds_action="customer.editCustAction2Tab" ds_data="'+data.CALL_SHEET_ID+'" data-placement="top" data-content="['+data.CALL_SHEET_NOT+"]"+data.memo+'" data-original-title=""><img src="../../img/contact_history/comment_d.png" width="13"/></a>';
                }
                $('#show_cdr_add_memo_Modal').modal('hide');
                $('.history_item_head_data').find('a[ds_data="'+data.CALL_SHEET_ID+'"]').parent().html(newDom);
                $('.history_action_table').find('a[ds_data="'+data.CALL_SHEET_ID+'"]').parent().html(newDom)
                $('.history_item_head_data').find('a[ds_data="'+data.CALL_SHEET_ID+'"]').popover();
                //$('.pull-left').find('a[ds_data="history"]').click();
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    actionCancel2Tab:function(data,src){
        var parent=src.closest(".next-action-form");
        handler.customer.resetNotifyTime(parent);
        handler.customer.toggleAction(false,parent);
    },
    dealAfter2Tab:function(t,isComplete){
        t.find(".cancel_button").show();
        if(isComplete){
            t.find(".actionlabel").text("下一次联系计划:");
            t.find(".cancel_button").attr({"ds_action":"customer.dealNote2Tab"});
            handler.customer.toggleAction(true,t);
            t.find("input[name='remark']").val("");
            t.find("input[name='notifyTime_date']").val("");
            t.find("input[name='notifyTime_time']").val("");
            t.find("input[name='lastActionId']").val(t.find("input[name=actionId]").val());
            t.find("input[name='actionId']").val("");
            var html='<div class="last_action"><span class="text">'+t.find("input[name=default_action]").val()+'</span></div>';
            t.find('.actions_history').html(html);
        }else{
            t.find(".actionlabel").text("联系计划:");
            t.find(".cancel_button").attr({"ds_action":"customer.actionCancel2Tab"});
            handler.customer.toggleAction(false,t);
            handler.customer.setNotifyDate(t.find("input[name='default_action_date']").val(),t);
            t.find("input[name='remark']").val(t.find("input[name=default_action]").val());
            t.find('.actions_history').html('');
            t.find("input[name='actionId']").val(t.find("input[name='lastActionId']").val());
            t.find("input[name='lastActionId']").val('');
        }
    },
    showForOwner:function(item,pane){
        //console.dir(item);
        var normalId=handler.customer.normalId;
        var owner=item.owner;
        var categoryId=item.categoryId;
        //console.info("owner===="+owner);
        //console.info("categoryId===="+categoryId);
        var desc="";
        var cls="guishuicon1";
        if(owner!=categoryId){//for user
            desc=handler.customer.getOwnerName(owner);
            var fromSea = handler.customer.getCustomerCategoryDesc(categoryId);
            var agents=getCache("agents");
            var owner_img="";
            for(var i in agents){
                if (agents[i]._id==owner){
                    owner_img = agents[i].im_icon? agents[i].im_icon+"?imageView2/1/w/50/h/50" : "./img/user.png";
                }
            }
            pane.find(".cust_categoryId").text(fromSea).show();
            pane.find(".guishuicon").html("<img src='"+owner_img+"'/>");
            cls="guishuicon2";
        }else{
            var category=normalId;
            if(owner!=normalId){
                var pool=getCache('custCategorys',categoryId);
                if(pool){
                    desc= pool.cName;
                    category=pool.category;
                }
                if(!desc){
                    desc="已删除的公海";
                }
                cls="guishuicon3";
            }else{
                desc='无归属';
            }
            pane.find(".cust_categoryId").hide();
            pane.find(".guishuicon").html("");
        }
        pane.find(".guishuicon").attr("class","guishuicon "+cls);
        pane.find("#combobox_cust_owner_desc").attr("uid",owner).text(desc);
    },

    showItemForOwner:function(item){
        //console.dir(item);
        var normalId=handler.customer.normalId;
        var owner=item.owner;
        var categoryId=item.categoryId;

        var desc="";
        if(owner!=categoryId){//for user
            desc=handler.customer.getOwnerName(owner);
        }else{
            var category=normalId;
            if(owner!=normalId){
                var pool=getCache('custCategorys',categoryId);
                if(pool){
                    desc= pool.cName;
                }
                if(!desc){
                    desc="已删除的公海";
                }
            }else{
                desc='无归属';
            }
        }
       return desc;
    },
    showFieldDesc:function(type,val){
        var desc='';
        if(type=='source'){
            desc=handler.customer.getSourceDesc(val);
        }else if(type=='owner'){
            desc=handler.customer.getOwnerName(val);
        }else if(type=='imgUrl'){
            desc=qiniu7moorDomain+val+"?imageView2/1/w/50";
        }else if(type=='img'){
            desc=handler.customer.getImgSuffix(val)
        }else if(type=='weixin'){
            desc=handler.customer.showWeixinInfo(val,arguments[2]);
        }else if(type=='field'){
            desc=handler.customer.getCustomFieldDicName(val,arguments[2],arguments[3],arguments[4])
        }else if(type=='sex'){
            desc=handler.customer.getSexName(val);
        }else if(type=='province'){
            desc=handler.customer.getCCName(val);
        }else if(type=='city'){
            //console.dir(arguments[3])
            desc=handler.customer.getCCName(val,true,arguments[3]);
        }else if(type=='html'){
            desc=replaceUrl(val);
        }else if(type=='taskId'){
            desc=handler.customer.task.getTaskName(val);
        }else if(type=='taskCalled'){
            desc=handler.customer.task.getDialStatus(val);
        }else if(type=='chanceId'){
            desc=handler.customer.getChaneIdDesc(val);
        }else if(type == 'commonId'){
            desc = handler.customer.getCustomerCommonDesc(val);
        }else if(type == 'sysStatus'){
            desc = handler.customer.getCustomerSysStatus(val);
        }else if(type == 'custCategory'){
            //console.info("custCategory==="+val);
            //var ary=val.split("_");
            //var category=ary[0];
            //if(category=='2'||category=='3'){
            //    desc = handler.customer.getCustomerCategoryDesc(ary[1]);
            //    if(!desc){
            //        if(category=='2'){
            //            desc="已删除的公海";
            //        }else if(category=='3'){
            //            desc="已删除的商机池";
            //        }
            //    }
            //}else{
            //    desc='无归属';
            //}
        }

        return desc;
    },
    _showOperaterType:function(objLog){
        var type=objLog.type;
        var content=objLog.content;
        var desc='';
        if(type=='import'){
            desc="导入了客户";
            content="";
        }else if(type=='add') {
            desc = "新增了客户";
            content="";
        }else if(type=='update') {
            desc = "更改了客户";
        }else if(type=='del') {
            desc = "删除了客户";
            content="";
        }else if(type=='updateStatus') {
            desc = "修改了客户状态";
        }else if(type=='updateOwner') {
            desc = "更改了归属";
        }else if(type=='updateSource') {
            desc = "更改了来源";
        }else if(type=='assign') {
            desc = "分配了客户";
        }else if(type=='clearOwner') {
            desc = "清空了所属人";
        }else if(type=='batchUpdateStatus') {
            desc = "批量修改了状态";
        }else if(type=='claim'){
            desc = "领取了客户";
        }else if(type=='autoAssignPool'){
            desc = "自动分配了客户";
        }else if(type=='recyclePool'){
            desc = "自动回收了客户";
        }else if(type=='changePool'){
            desc = "转移了客户";
        }else if(type=='updateSysStatus'){
            desc = "变更了跟进状态";
        }else if(type=='mergeCust'){
            desc = "合并了客户";
        }

        return {desc:desc,content:content};
    },
    _processLogData:function(_obj){
        var agent = getCache("agents",_obj.user);
        var agentName="";
        if(agent){
            agentName=agent.displayName||'';
        }
        _obj.agentName=agentName;
        if(_obj.user=="system"){
            _obj.agentName="系统";
        }
        _obj.operaterType=handler.customer._showOperaterType(_obj).desc;
        _obj.content=handler.customer._showOperaterType(_obj).content;
        _obj.timeDesc=_obj.time.substring(0,_obj.time.length-3);
    },
    loadChangeLog : function(data , pane){
        var customerId = data || "";
        var action = {
            action : "customerReport.queryChangeLogReport",
            data : {cid: customerId,page:1,limit:handler.customer.custLogLimit}
        };
        DS.util.sendActionWithUrl(DS._ds_report_url,action , function(response){
            if(response.success){
                var list = response.list || {};
                DS.getView("customer/customer_changeLog",function(view){
                    var param={custId:customerId}
                    view=DS.renderMethodViewNew(view,param);
                    pane.html(view);
                    var agents = getCache("agents");
                    var ownerHtml = '<li><a href="#" class="ds_do_action" ds_action="customer.queryCommonChangeLog" ds_data="user" ds_attr="system">系统</a></li>';
                    for(var i=0;i<agents.length;i++){
                        var u=agents[i];
                        ownerHtml += '<li><a href="#" class="ds_do_action" ds_action="customer.queryCommonChangeLog" ds_data="user" ds_attr="'+ u._id+'">'+ u.displayName+'</a></li>';
                    }
                    ownerHtml+='<li><a href="#" class="ds_do_action" ds_action="customer.queryCommonChangeLog" ds_data="user" ds_attr="">全部</a></li>'
                    pane.find(".dropdown-user").html(ownerHtml);
                    var html = [];
                    var len=list.length;
                    if(len>0){
                        for(var i=0;i<len;i++){
                            var _obj = list[i];
                            handler.customer._processLogData(_obj);
                            html.push(template("tmpl_cust_changeLog_item",_obj));
                        }
                        pane.find(".history_list").html(html.join(""));
                    }
                    if(len>=handler.customer.custLogLimit){
                        pane.find(".ds_more").show();
                    }else{
                        pane.find(".ds_more").hide();
                    }
                });
            } else {
                $().alertmessage('showError', "获取历史数据异常！");
            }
        });
    },
    queryChangeLog : function(custId,src){
        var page=src.attr("ds_attr");
        page=parseInt(page,10);
        var pane=src.closest(".cust_tab_content");
        var user = pane.find("input[name='user']").val();
        var type = pane.find("input[name='type']").val();
        var action = {
            action : "customerReport.queryChangeLogReport",
            data : {cid: custId,user:user,type:type,page:page,limit:handler.customer.custLogLimit}
        };
        DS.util.sendActionWithUrl(DS._ds_report_url,action , function(response){
            if(response.success){
                var list = response.list || {};
                var html = [];
                var len=list.length;
                if(len>0){
                    for(var i=0;i<len;i++){
                        var _obj = list[i];
                        handler.customer._processLogData(_obj);
                        html.push(template("tmpl_cust_changeLog_item",_obj));
                    }
                    if(page==1){
                        pane.find(".history_list").html(html.join(""));
                    }else{
                        pane.find(".history_list").append(html.join(""));
                    }
                }
                if(len<handler.customer.custLogLimit){
                    pane.find(".ds_more").hide();
                }else{
                    pane.find(".ds_more").show();
                    pane.find(".ds_more").attr("ds_attr",page+1);
                }
            } else {
                $().alertmessage('showError', "获取日志异常！");
            }
        });
    },
    queryCommonHistoryMore : function(custId,src){
        var page=src.attr("ds_attr");
        page=parseInt(page,10);
        var pane=src.closest(".cust_tab_content");
        var date = pane.find("input[name='date']").val();
        var type = pane.find("input[name='type']").val();
        var action = {
            action : "app.customer.queryCustCommonHistory",
            data : {customer: custId,date:date,type:type,page:page,limit:handler.customer.custLogLimit}
        };
        DS.send(action , function(response){
            if(response.success){
                var data = response.data || {};
                DS.getView("customer/customer_history_page",function(view) {
                    var showPane = pane.find(".history_list");
                    var len = data.list.length;
                    if (len > 0) {
                        var render = template.compile(view);
                        handler.customer.processHistoryData(data);
                        showPane.append(render(data));
                    }
                    if (len < handler.customer.custLogLimit) {
                        pane.find(".ds_more").hide();
                    } else {
                        pane.find(".ds_more").show();
                        pane.find(".ds_more").attr("ds_attr", page + 1);
                    }
                });
            } else {
                $().alertmessage('showError', "获取历史数据异常！");
            }
        });
    },
    queryChangeHistoryAction : function(custId,src){
        var page=src.attr("ds_attr");
        page=parseInt(page,10);
        var pane=src.closest(".cust_tab_content").find('.cust_tab_content_other');
        var action = {
            action : "app.customer.queryCustCommonHistory",
            data : {customer: custId,date:'',type:'note',page:page,limit:handler.customer.custLogLimit}
        };
        DS.send(action, function(response){
            if(response.success){
                var data = response.data || {};
                var html = [];
                var len=data.list.length;
                if(len>=0){
                    handler.customer.processHistoryData(data);
                    var list = data.list,html = '';
                    //var list = [{comments:1,createTimeDisplay:2,agentName:3,dispose:4},{comments:1,createTimeDisplay:2,agentName:3,dispose:4},{comments:1,createTimeDisplay:2,agentName:3,dispose:4}];
                    var html =template("history_action_form_add_template",data);
                    pane.find('.history_action_form').find('tbody').append(html);
                    //禁止备注编辑
                    if(session.user.isAdmin || isHasFunc("func_not_edit_remark_field")){
                        $(".his_comment").removeClass("ds_do_action");
                    }
                    var state = DS.getCookie("his_note_ishide");
                    if (state) {
                        $('.show_note_preview').attr("checked","checked");
                        $('.his_note_ishide').show();
                    } else {
                        $('.show_note_preview').removeAttr("checked");
                        $('.his_note_ishide').attr("style","display:none");
                    }
                    $('.show_note_preview').change(function(event) {
                        var value = $(this).is(':checked') ? $(this).is(':checked') : '';
                        DS.setCookie("his_note_ishide", value, 30);
                        if (value) {
                            $('.his_note_ishide').show();
                            $('.show_note_preview').attr("checked","checked");
                        } else {
                            $('.his_note_ishide').attr("style", "display:none");
                            $('.show_note_preview').removeAttr("checked");
                        }
                    });
                }
                if(len<handler.customer.custLogLimit){
                    pane.find(".ds_more").hide();
                }else{
                    pane.find(".ds_more").show();
                    pane.find(".ds_more").attr("ds_attr",page+1);
                }
            } else {
                $().alertmessage('showError', "获取日志异常！");
            }
        });
    },
    queryChangeHistoryBusiness : function(custId,src){
        var page=src.attr("ds_attr");
        page=parseInt(page,10);
        var pane=src.closest(".cust_tab_content").find('.cust_tab_content_bus');
        var action = {
            action : "app.customer.queryCustCommonHistory",
            data : {customer: custId,date:'',type:'business',page:page,limit:handler.customer.custLogLimit}
        };
        DS.send(action, function(response){
            if(response.success){
                var data = response.data || {};
                var html = [];
                var len=data.list.length;
                if(len>=0){
                    handler.customer.processHistoryData(data);
                    var list = data.list,html = '';
                    //var list = [{businessTypeName:1,createTimeDisplay:2,agentName:3,dispose:4},{businessTypeName:1,createTimeDisplay:2,agentName:3,dispose:4},{businessTypeName:1,createTimeDisplay:2,agentName:3,disposeDisplay:4}];
                  var html = template("history_business_table_add_template",data)
                    pane.find('.business_info_history').find('tbody').append(html)
                    //禁止备注编辑
                    if(session.user.isAdmin || isHasFunc("func_not_edit_remark_field")){
                        $(".his_comment").removeClass("ds_do_action");
                    }
                }
                if(len<handler.customer.custLogLimit){
                    pane.find(".ds_more").hide();
                }else{
                    pane.find(".ds_more").show();
                    pane.find(".ds_more").attr("ds_attr",page+1);
                }
            } else {
                $().alertmessage('showError', "获取日志异常！");
            }
        });
    },
    loadCommonHistory : function(data , panel){
        var customerId = data || "";
        var action = {
            action : "app.customer.queryCustCommonHistory",
            data : {customer: customerId}
        };
        DS.send(action , function(response){
            if(response.success){
                var data = response.data || {};
                var len = data.list.length;
                DS.getView("customer/customer_history",function(view){
                        var render = template.compile(view);
                        data.custId=customerId;
                        handler.customer.processHistoryData(data);
                        panel.html(render(data));
                        panel.find(".7m-jmp3").jmp3({
                            backcolor: "11467B",
                            forecolor: "00ff00",
                            width: 65,
                            showdownload: "false",
                            showfilename: "false"
                        });
                        $('.7m-jmp3').parent('.history_item_head_name').css("margin","6px");
                        resizeRightContent(panel)
                    if(len>=handler.customer.custLogLimit){
                        panel.find(".ds_more").show();
                    }else{
                        panel.find(".ds_more").hide();
                    }
                });


            } else {
                $().alertmessage('showError', "获取历史数据异常！");
            }
        });
    },
    queryCommonHistory : function(flag,src){
        var val=src.attr("ds_attr");
        var pane=src.closest(".cust_tab_content");
        var frm=src.closest("form");
        var txt=src.text();
        var custId=frm.find("input[name='customer']").val();
        if(flag=='date'){
            frm.find(".btn-date").text(txt);
            frm.find("input[name='date']").val(val);
        }else if(flag=='type'){
            frm.find(".btn-type").text(txt);
            frm.find("input[name='type']").val(val);
        }else if(flag=='busType'){
            frm.find(".btn-busType").text(txt);
            frm.find("input[name='businessType']").val(val);
        }

        var data = DS.util.getDataOfForm(frm);
        data=data.data;
        var action = {
            action : "app.customer.queryCustCommonHistory",
            data :data
        };
        DS.send(action , function(response){
            if(response.success){
                var data = response.data || {};
                DS.getView("customer/customer_history_page",function(view){
                    var len = data.list.length;
                        var render = template.compile(view);
                        handler.customer.processHistoryData(data);
                        pane.find(".hist_total").text(data.count);
                        pane.find(".table_content").html(render(data));
                    if(len>=handler.customer.custLogLimit){
                        pane.find(".ds_more").show();
                    }else{
                        pane.find(".ds_more").hide();
                    }
                });
            } else {
                $().alertmessage('showError', "获取历史数据异常！");
            }
        });
    },
    queryCommonChangeLog : function(flag,src){
        var val=src.attr("ds_attr");
        var pane=src.closest(".cust_tab_content");
        pane.find(".ds_more").hide();
        var frm=src.closest("form");
        var txt=src.text();
        if(flag=='user'){
            frm.find(".btn-user").text(txt);
            frm.find("input[name='user']").val(val);
        }else if(flag=='type'){
            frm.find(".btn-type").text(txt);
            frm.find("input[name='type']").val(val);
        }

        var data = DS.util.getDataOfForm(frm);
        data=data.data;
        data.page=1;
        data.limit = handler.customer.custLogLimit;
        var action = {
            action : "customerReport.queryChangeLogReport",
            data :data
        };
        DS.util.sendActionWithUrl(DS._ds_report_url,action , function(response){
            if(response.success){
                var list = response.list || {};
                var showPane = pane.find(".history_list");
                showPane.empty();
                    var html = [];
                    var len=list.length;
                    if(len>0){
                        for(var i=0;i<len;i++){
                            var _obj = list[i];
                            handler.customer._processLogData(_obj);
                            html.push(template("tmpl_cust_changeLog_item",_obj));
                        }
                        showPane.html(html.join(""));
                    }
                    if(len>=handler.customer.custLogLimit){
                        pane.find(".ds_more").show();
                    }else{
                        pane.find(".ds_more").hide();
                    }

            } else {
                $().alertmessage('showError', "获取历史数据异常！");
            }
        });
    },
    processHistoryData : function(data){
        data.businessType = getCache('businessFlow') || [];
        var list = data.list || [];
        for(var i=0 ; i< list.length ;i++){
            var item = list[i];
            //agent
            if(!item.agent){
                item.agentName = "";
            }else{
                var agentObj = getCache("agents",item.agent || "");
                if(agentObj != null)
                    item.agentName = agentObj.displayName || "";
                else
                    item.agentName = null;
            }
            //creatTime
            var timeResult = handler.formatShortTime(item.createTime) || {};
            item.createTimeDisplay = timeResult.name || "";
            if(item.createTimeDisplay.length == 5 && item.createTimeDisplay.split(":").length > 1){
                item.createTimeDisplay = "今天," + item.createTimeDisplay;
            }
            //businessType
            var businessFlow = getCache("businessFlow",item.businessType || "");
            if(businessFlow){
                item.businessTypeName = businessFlow.name || "";
            }
            //dispose
            if(item.type == 'business'){
                var stepObj = getCache('businessFlowStep',item.status);
                if(stepObj){
                    item.disposeDisplay = stepObj.name || "";
                }
            } else if(item.type == 'callin'  || item.type == 'callout'){
                if(item.status == 'dealing'){
                    item.disposeDisplay = '已接听';
                } else if(item.status == 'notDeal'){
                    item.disposeDisplay = '振铃未接听';
                } else if(item.status == 'queueLeak'){
                    item.disposeDisplay = '排队放弃';
                } else if(item.status == 'voicemail'){
                    item.disposeDisplay = '已留言';
                } else if(item.status == 'leak'){
                    item.disposeDisplay = 'IVR放弃';
                } else if (item.status == 'blackList') {
                    item.disposeDisplay = '黑名单';
                }
                if(item.recordFile){
                    item.jmp3Tag = '7m-jmp3';
                    item.showPlayBtn = "";
                }else {
                    item.showPlayBtn = "display: none";
                }
            }else if(item.type == "approval"){
                if(item.status == "unPass"){
                    item.disposeDisplay = '审核不通过';
                }else{
                    item.disposeDisplay = '审核通过';
                }

                //设置业务类型
                if(item.apprType == "2"){
                    item.businessTypeName = "无效审核";
                }else if(item.apprType == "3") {
                    item.businessTypeName = "成单审核";
                }else if(item.apprType == "4") {
                    item.businessTypeName = "丢单审核";
                }else if(item.apprType == "8") {
                    item.businessTypeName = "续费审核";
                }
            }else if(item.type == "note"){
                item.disposeDisplay = item.dispose;
            }
        }
    },
    loadDialCustInfo2Update:function(cId,pane,callback){
        var action = {
            action: 'app.customer.queryCustInfo',
            data: {_id: cId}
        };
        DS.send(action,function(response){
            if(response.success){
                var item=response.data;
                handler.customer.loadDialCustInfo(item,pane,callback);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    loadDialCustInfo:function(data,pane,callback){
        var cId=data._id;
        var parent=pane.find(".customer_container");
        var flag="dialPopup";

        DS.getView("customer/custinfo_tab_popup",function(view){
            view=view.replace(/_#custId#_/g,cId);
            parent.html(view);
            handler.customer._initCustomerNullFields(data);
            handler.customer._setCustomerSysField(data);
            var _basePane=parent.find(".baseinfo");
            DS.getView('customer/customer_channel_base',function(view){
                view = view.replace(/_#flag#_/g, flag);
                template.helper("custShowFieldDesc",handler.customer.showFieldDesc);
                template.helper("isHasFunc",isHasFunc);
                template.helper("checkMobile",checkMobile);
                template.helper("checkHideTel",checkHideTel);
                var render = template.compile(view);
                _basePane.find(".base_summary").html(render(data));
                handler.customer.showForOwner(data,parent);

                handler.customer.getStatusDic(data.dbType,parent);
                handler.customer.getSourceDic(data.dbType,parent);
                //handler.customer.getChanceIdDic(parent);
                //handler.customer.getCommonIdDic(parent);
                handler.customer.getCallPhoneDic(data,parent);
                handler.customer.getSmsDic(data,parent);
                handler.customer.getMailDic(data,parent);
                //handler.customer.getWeixinDic(data,parent);
                if(!isHasFunc("func_not_update_customer_status")){
                    parent.find(".edit_status .submenu_trigger").click(function(e) {
                        e.stopPropagation();
                        var _sub=parent.find(".edit_status .submenu");
                        _sub.toggle();
                        //parent.find(".submenu_trigger").addClass("open");
                    });
                }
                handler.customer._registerOwnerEvent(data,_basePane);

                var _detailPane=parent.find(".cust_detail");
                DS.getView('customer/custinfo_detail',function(view){
                    var render = template.compile(view);
                    _detailPane.html(render(data));
                    _basePane.find(".btn_view_cust_detail").unbind("click");
                    _basePane.find(".btn_view_cust_detail").bind("click",function(e){
                        e.stopPropagation();
                        _detailPane.toggleClass("cust_detail_toggle");
                        if(_detailPane.hasClass("cust_detail_toggle")){
                            _detailPane.animate({right:0+'px'},'fast');
                            $(this).text("详细信息>>");
                        }else{
                            _detailPane.animate({right:-735+'px'},'fast');
                            $(this).text("详细信息<<");
                        }
                    });
                    if(typeof callback =='function'){
                        callback(data);
                    }
                });
            });
        });
    },
    contiueDial:function(data,src){
        var pane=$("#sys_dialPopup");
        var phone=pane.attr("phone");
        var desc=checkHideTel(phone);
        $("#dialout_input").html(desc);
        phone_dialout(phone);
    },
    loadNoCustItem:function(cid,menu,flag,callback){
        var pane=$("#"+menu+"_"+flag);
        pane=pane.find(".customer_container");
        var base=pane.find(".base_summary");
        pane.find(".btn_view_cust_detail").remove();
        if(flag == "" || flag == "approval_business"){
            pane.find(".business_tab").removeClass("ds_do_action").addClass("disabled_new");
        }
        pane.find(".plan_tab,.hist_tab,.cuht_tab").removeClass("ds_do_action").addClass("disabled_new");
        // pane.find("").removeClass("ds_do_action").addClass("disabled_new");
        var tmpl='<span class="label label-warning" style="font-weight:bold;font-size: 15px;padding:8px;">该工单定位的客户已经删除！</span>';
        base.html(tmpl);
        if(typeof callback =='function'){
            callback();
        }
    },
    addQuickSearch:function(data,src){
        var kName = data.kName;
        delete data.kName;
        if(kName == ""){
            $().alertmessage('showError','请输入快捷搜索名称!');
            return;
        }
        var isAdvanceSearch = data.isAdvanceSearch;
        delete data["isAdvanceSearch"];
        var menu = data.menu;
        delete data["menu"];
        var setData = {};
        setData.kName = kName;
        setData.query  = data;
        var action = {
            action:'app.customer.addQuickSearch',
            data:setData
        };
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess','增加快捷搜索成功!');
                addCache("quickSearchTmpls",rep.data);
                var frm=src.closest("form");
                frm.find('.customer_quick_text').hide();
                frm.find('.customer_quick_search_text').show();
            }else{
                $().alertmessage('showError', rep.message|| errMsg);
            }
        });
    },
  showExportTask:function(menu,src){
        var pane=$('#'+menu+'_customer');
        pane=pane.find(".customer_container");
        DS.getView('customer/customer_export_task_search',function(view){
            view = view.replace(/_#menu#_/,menu);
            pane.empty().html(view);
            pane.siblings(".cust_tab_content").empty().height("auto");
            pane.find("#customer_export_task_search_list_panel").find(".refresh").click();
        });
    },
    queryExportTask:function(data,src){
        data.limit = handler.customer.custPageLimit;
        data.page = src.val()|| 1;
        var action = {
            action:'app.customer.queryExportTaskSearch',
            data:data
        };
        var pane =  $("#customer_export_task_search_list_panel");
        var qSearchListPane=pane.find(".customer_export_task_search_list");
        DS.send(action,function(rep){
            if(rep.success){
                var list = rep.list;
                if(list.length>0){
                    DS.getView('customer/customer_export_task_search_item',function(view){
                        var html = [];
                        for(var i=0;i<list.length;i++){
                            var qSearch = list[i];
                            html.push(DS.renderMethodViewNew(view,qSearch));
                        }
                        qSearchListPane.html(html.join(''));
                    });
                }else{
                    var html='<tr><td colspan="3">未找到导出任务!</td></tr>';
                    qSearchListPane.html(html);
                }
                DS.updatePagination('customer_export_task_search_form', rep.count,data.limit, data.page);
            }else{
                $().alertmessage('showError', rep.message|| errMsg);
            }
        })
    },
        showHitsingleSearch:function(menu,src){
        var pane = $('#'+menu+'_customer');
        pane = pane.find(".customer_container");
        DS.getView('customer/customer_hitsingle_search',function(view){
            view = view.replace(/_#menu#_/,menu);
            pane.empty().html(view);
            pane.siblings(".cust_tab_content").height("auto").children().empty();
            pane.siblings('.cust_tab_url').empty().height('auto');
            pane.find("#customer_hitSingle_search_list_panel")
            DS.updatePagination('customer_hitSingle_search_form', 0,10, 1);
        })
    },
    queryHitsingleSearch:function(data,src){
        var custName = data.combox;
        var pane =  $("#customer_hitSingle_search_list_panel");
        var qSearchListPane=pane.find(".customer_hitSingle_search_list");
        if(custName==""){
            src.closest('form').find('input[name="combox"]').focus()
            $().alertmessage('showError','请输入查询条件!');
            var html='<tr><td colspan="2">请输入条件查询!</td></tr>';
            qSearchListPane.html(html);
            DS.updatePagination('customer_hitSingle_search_form', 0,10, 1);
            return;
        }
        data.limit = handler.customer.custPageLimit;
        data.page = src.val()|| 1;
        var action = {
            action:'app.customer.queryHitSingleSearch',
            data:data
        };

        DS.send(action,function(rep){
            if(rep.success){
                var list = rep.list;
                if(list.length>0){
                    DS.getView('customer/customer_hitsingle_search_item',function(view){
                        var html = [];
                        for(var i=0;i<list.length;i++){
                            var qSearch = list[i];
                            html.push(DS.renderMethodViewNew(view,qSearch));
                        }
                        qSearchListPane.html(html.join(''));
                    });
                }else{
                    var html='<tr><td colspan="2">未找到客户!</td></tr>';
                    qSearchListPane.html(html);
                }
                DS.updatePagination('customer_hitSingle_search_form', rep.count,data.limit, data.page);
            }else{
                $().alertmessage('showError', rep.message|| errMsg);
            }
        })
    },
    showQuickSearch:function(menu,src){/*popup interface*/
        var pane=$('#'+menu+'_customer');
        pane=pane.find(".customer_container");
        DS.getView('customer/customer_quick_search',function(view){
            view = view.replace(/_#menu#_/,menu);
            pane.empty().html(view);
            pane.siblings(".cust_tab_content").height("auto").children().empty();
            pane.siblings('.cust_tab_url').empty().height('auto');
            pane.find("#customer_quick_search_list_panel").find(".refresh").click();
        });
    },
    queryQuickSearch:function(data,src){
        data.limit = handler.customer.custPageLimit;
        data.page = src.val()|| 1;
        var action = {
            action:'app.customer.queryQuickSearch',
            data:data
        };
        var pane =  $("#customer_quick_search_list_panel");
        var qSearchListPane=pane.find(".customer_quick_search_list");
        DS.send(action,function(rep){
            if(rep.success){
                var list = rep.list;
                if(list.length>0){
                    DS.getView('customer/customer_quick_search_item',function(view){
                        var html = [];
                        for(var i=0;i<list.length;i++){
                            var qSearch = list[i];
                            html.push(DS.renderMethodViewNew(view,qSearch));
                        }
                        qSearchListPane.html(html.join(''));
                    });
                }else{
                    qSearchListPane.html('');
                }
                DS.updatePagination('customer_quick_search_form', rep.count,data.limit, data.page);
            }else{
                alert("查询失败，请重新查询!");
            }
        })
    },
    _showQuickText:function(val,na,con,pane,selected,menu){
        var html = "";
        var con = $(con);
        var pane = $(pane);
        var ht = '<select name="con[]" style="width:160px"><option value="=">等于</option></select>'
        var ht1 = '<select name="con[]" style="width:160px"><option value="$lt">小于</option><option value="$gt">大于</option></select>'
        if(val == "province") {
            html = '<select name="province" style="width:160px"></select><br>'+
                ' <select name="condition[]" style="width:80px" disabled >'+
                ' <option value="city">市</option></select>'+
                ' <select name="con[]" style="width:65px">'+
                '<option value="=">等于</option>'+
                '</select>'+
                ' <span id="changeText">'+
                ' <select name="city" class="" style="width:160px">'+
                '<option value="">--请选择--</option>'+
                '</select>'+
                '</span>';
            pane.html(html);
            pane.css("display","inline");
            con.html(ht);
            var h = generateCCOptions(proviceCityDicKey);
            pane.find("select[name='province']").html(h);
            pane.find("select[name='province']").change(function(){
                var sel = pane.find("select[name='province'] option:selected");
                var key = [sel.val()];
                var htm=generateCCOptions(proviceCityDicKey,key);
                pane.find("select[name='city']").html(htm);
            });
        }else if(val == 'owner'){
            if(menu=='customer_seas'){
                html = '<select name="owner" style="width:160px">';
                html += '<option value="">--请选择--</option>';
                var ary = getCache("custCategorys") || [];
                if (!ary || ary.length == 0) return null;
                for (var i = 0; i < ary.length; i++) {
                    var obj = ary[i];
                    var managers = obj.managers;
                    var members = obj.members;
                    var userId = session.user._id;
                    var category = obj.category;
                    if(category=="0"||category=="3"||category=="4"){
                        if (managers.indexOf(userId) != -1 || members.indexOf(userId) != -1) {
                            html += '<option value="' + obj._id + '">' + obj.cName + '</option>';
                        }
                    }
                }
                html += '</select>';
               con.html(ht);
                pane.html(html);
            }else if(menu == 'customer_all'){
                html = '<input name="ownercom" type="hidden" class="select_input" id="customer_owner_select_input_com" />'+
                    '<input name="owner" type="hidden" class="select_input" id="customer_owner_select_input" />'+
                    '<input name="ownerdep" type="hidden" class="select_input" id="customer_owner_select_input_dep" />'+
                    '<div id="customer_owner_select_user"  style="width:150px"></div>';
               con.html(ht);
                 pane.css("display","inline-block");
                pane.closest('.modal-body').css("height","400px");
                pane.html(html);
                var inputId="customer_owner_select_input";
                var containerId="customer_owner_select_user";
                var editOwner="";
                if(isHasFunc("func_not_allow_user_edit_owner")){
                    editOwner = "readonly"
                }
                utils.loadAgentTabBox(inputId,containerId,{width:"150px",height:"15px",maxHeight:292,hideTab:0,isRadio:true,commonTab:true},false,true);
            }

        }else {
            if (val == "name" || val == "phone" || val == "batchNo" || val == 'title' || val == "weixin" || val == 'email' || val == 'address' || val == 'note' || val == 'web' || val == 'age') {
                html = '<input name="' + val + '" type="text" maxlength="50" msgName="' + na + '"  style="width:150px">';
               con.html(ht);
            } else if (val == "createTime" || val == "birth" || val == "lastUpdateTime" || val == "notifyTime") {
                html = '<input class="ds_datetime" type="text" name="' + val + '[]" msgName="' + na + '" style="width:150px" readonly>';
               con.html(ht1);
                if (selected) {
                   con.val(selected);
                }
            } else if (val == "status") {
                html = '<select name="status" style="width:160px">';
                html += '<option value="">--请选择--</option>'
                var ary = getCache("custTmpls")[0].status || [];
                if (!ary || ary.length == 0) return null;
                for (var key in ary) {
                    html += '<option value="' + key + '">' + ary[key] + '</option>';
                }
                html += '</select>';
               con.html(ht);
            } else if (val == "custsource1") {
                html = '<select name="custsource1" style="width:160px">';
                html += '<option value="">--请选择--</option>';
                var ary = getCache("custTmpls")[0].source;
                if (!ary || ary.length == 0) return null;
                for (var i = 0; i < ary.length; i++) {
                    var obj = ary[i];
                    html += '<option value="' + obj.key + '">' + obj.name + '</option>';
                }
                html += '</select>';
               con.html(ht);
            } else if (val == 'categoryId') {
                html = '<select name="categoryId" style="width:160px">';
                html += '<option value="">--请选择--</option>';
                var ary = getCache("custCategorys") || [];
                if (!ary || ary.length == 0) return null;
                for (var i = 0; i < ary.length; i++) {
                    var obj = ary[i];
                    var managers = obj.managers;
                    var members = obj.members;
                    var userId = session.user._id;
                    if (managers.indexOf(userId) != -1 || members.indexOf(userId) != -1) {
                        html += '<option value="' + obj._id + '">' + obj.cName + '</option>';
                    }
                }
                html += '</select>';
               con.html(ht);
            } else if (val == 'sysStatus') {
                html = '<select name="sysStatus" style="width:160px">';
                html += '<option value="">--请选择--</option>';
                var ary = getCache('sys_status');
                for (var i = 0; i < ary.length; i++) {
                    var obj = ary[i];
                    html += '<option value="' + obj.code_value + '">' + obj.code_name + '</option>';
                }
            html += '</select>';
               con.html(ht);
            }else if(val == 'sex' ){
                html = '<select name="'+na+'" style="width:160px">'+
                    '<option value="">--请选择--</option>'+
                    '<option value="男">男</option>'+
                    '<option value="女">女</option>'+
                    '</select>';
               con.html(ht);
            }else{
                var tmpls = getCache("custTmpls");
                var _tmpl = tmpls[0];
                var customFields=_tmpl.custom_fields||[];
                var checkboxFields=[];
                for(var i=0;i<customFields.length;i++){
                    var row = customFields[i];
                    if(val == row._id){
                        var _type = row.type;
                        if(_type=='checkbox'){
                            checkboxFields.push(row);
                        }else{
                            switch (_type) {
                                case 'single':
                                    html = '<input type="text" name="'+val+'" msgName="'+na+'" style="width:150px">';
                                   con.html(ht);
                                    break;
                                case 'multi':
                                    html = '<input type="text" name="'+val+'" msgName="'+na+'" style="width:150px">';
                                   con.html(ht);
                                    break;
                                case 'number':
                                    var n = "this.value=this.value.replace(/\D/g,'')"
                                    html = '<input type="text" datatype="Number,Range" onkeyup="'+n+'" name="'+val+'" msgName="'+na+'" style="width:150px">';
                                   con.html(ht);
                                    break;
                                case 'date':
                                    html = '<input class="ds_datetime" type="text" name="'+val+'[]" msgName="'+na+'" style="width:150px" readonly>';
                                   con.html(ht1);
                                    if(selected){
                                       con.val(selected);
                                    }
                                    break;
                                case 'dropdown':
                                    html = '<select  name="'+val+'" style="width:160px">';
                                    html+='<option value="">--请选择--</option>';
                                    var ary=row.choices||[];
                                    if(!ary || ary.length==0) return null;
                                    for (var key in ary) {
                                        html+='<option value="'+key+'">'+ary[key]+'</option>';
                                    }
                                    html+='</select>';
                                   con.html(ht);
                                    break;
                                case 'radio':
                                    var ary=row.choices||[];
                                    if(!ary || ary.length==0) return null;
                                    for (var key in ary) {
                                        html+='<input type="radio" name="'+val+'" value="'+key+'" msgName='+na+'/>'+ary[key];
                                    }
                                   con.html(ht);
                                    break;
                                default :
                                    console.log('the type [' + _type + '] is not support!');
                            }
                        }
                    }
                }
                for (var i = 0; i < checkboxFields.length; i++) {
                    var row = checkboxFields[i];
                    var ary=row.choices||[];
                    if(!ary || ary.length==0) return null;
                    html +="<div class='hobbyCheckBox' style='margin-top:3px'>";
                    for (var key in ary) {
                        html += '<label class="checkbox inline" style="width: auto;padding-top: 0;">'+
                              '<input style="width: auto;" fieldgroup="1" type="checkbox" name="'+row._id+'[]" value="'+key+'">'+
                             '<span>'+ary[key]+'</span></label>&nbsp;'
                    }
                    html += "</div>";
                }
            }
            pane.html(html);
        }
    },
    addQuickSearchList :function(data){
        handler.customer.quickSearchAry = [];
        handler.customer.quickSearchAry.push({n:'客户名称',k:'name'});
        handler.customer.quickSearchAry.push({n:'电话',k:'phone'});
        handler.customer.quickSearchAry.push({n:'客户状态',k:'status'});
        handler.customer.quickSearchAry.push({n:'联系时间',k:'notifyTime'});
        handler.customer.quickSearchAry.push({n:'数据来源',k:'custsource1'});
        handler.customer.quickSearchAry.push({n:'导入批次',k:'batchNo'});
        handler.customer.quickSearchAry.push({n:'省',k:'province'});
        handler.customer.quickSearchAry.push({n:'更新时间',k:'lastUpdateTime'});
        handler.customer.quickSearchAry.push({n:'创建时间',k:'createTime'});
        if(data=='customer_my'){
            handler.customer.quickSearchAry.push({n:'公海来源',k:'categoryId'});
            handler.customer.quickSearchAry.push({n:'跟进状态',k:'sysStatus'});
        }else if(data=='customer_seas'){
            handler.customer.quickSearchAry.push({n:'公海',k:'owner'});
        }else if(data=='customer_all'){
            handler.customer.quickSearchAry.push({n:'公海来源',k:'categoryId'});
            handler.customer.quickSearchAry.push({n:'跟进状态',k:'sysStatus'});
            handler.customer.quickSearchAry.push({n:'所属范围',k:'owner'});
        }

        var tmpls=getCache('custTmpls');
        var _tmpl=tmpls[0];
        var customFields=_tmpl.custom_fields||[];
        var stableFields = _tmpl.stable_fields||[];
        for(var i in stableFields){
            var field = stableFields[i];
            if(field.search){
                var name = field.name;
                if(name == 'title' || name =="weixin" || name == 'email' || name == 'address' || name == 'note' || name == 'web' || name == 'age'|| name == 'sex' || name == 'birth'){
                    handler.customer.quickSearchAry.push({n:field.value,k:field.name});
                }
            }
        }
        for(var j=0;j<customFields.length;j++){
            var row = customFields[j];
            handler.customer.quickSearchAry.push({n:row.name,k:row._id});
        }
    },
    showAddQuickSearch:function(data,src){
        var p=$('#batch_modal');
        DS.getView('customer/customer_quick_search_add',function(view){
            p.find('.modal-title').text('新建自定义快捷搜索');
            p.find(".modal-body").html(view);
            p.width(700);
            p.modal({backdrop:'static'});
            p.find("select[name='menu']").val(data);
            handler.customer.addQuickSearchList(data);
            p.find("select[name='menu']").on('change',function(e){
                var tabVal = p.find("select[name='menu']").val();
                $("#field_quickSearch_pane").empty();
                handler.customer.addQuickSearchList(tabVal);
                var pane = $("#field_quickSearch_pane");
                var n = "this.value=this.value.replace(/\\D/g,'')";
                var str = '<div class="row-select-box" style="position: relative;">'+
                    '<a class="plus ds_form_action" ds_action="customer.plusQuickSearchField" ds_data=""></a>'+
                    '<select class="condition weixin-name"  name="condition[]" ds_action="customer.changeSelectedReset" style="width:80px"></select>'+
                    ' <select class="con" name="con[]" style="width:65px">'+
                    '<option value="=">等于</option>'+
                    '</select>'+
                    ' <span class="changeText"><input name="name" type="text" maxlength="50" msgName="客户名称" style="width:150px"></span>';
                '</div>';
                pane.append(str);
                var ary = handler.customer.quickSearchAry ||[];
                var node = p.find("select[name='condition[]']") || [];
                handler.customer.generateOptions(node.get(0),ary);
            });

            var ary = handler.customer.quickSearchAry ||[];
            var node = p.find("select[name='condition[]']") || [];
            handler.customer.generateOptions(node.get(0),ary);
        });
    },
    //下拉菜单去重
    unique:function(arr) {
        var res = [];
        var json = {};
        for(var i = 0; i < arr.length; i++){
            if(!json[arr[i]]){
                res.push(arr[i]);
                json[arr[i]] = 1;
            }
        }
        return res;
     },
    plusQuickSearchField: function(data) {
        var ary = handler.customer.quickSearchAry||[];
        var pane = $("#field_quickSearch_pane");
        if(data){
            var condition = handler.customer.unique(data.condition);
                if(condition.length-1==ary.length){
                    $().alertmessage('showError','已经没有条件可选了!');
                    return;
                }
        }
        var str = '<div class="row-select-box" style="position: relative;">'+
            '<a class="reduce ds_form_action" ds_action="customer.reduceQuickSearchField" ds_data=""></a>'+
            '<select class="condition weixin-name"  name="condition[]" ds_action="customer.changeSelectedReset" style="width:80px"></select>'+
            ' <select class="con" name="con[]" style="width:65px">'+
            '<option value="=">等于</option>'+
            '</select>'+
            ' <span class="changeText"><input name="name" type="text" maxlength="50" msgName="客户名称" style="width:150px"></span>';
        '</div>';
        data?pane.append(str):"";
        var node = pane.find(".condition")|| [];
        var tabMenu = $('#frm_customer_quick_search_add').find("select[name='menu']").val();
        var i = 0,p,con;
        for (; i < node.length; i++) {
            if(i===node.length-1||!data){
                handler.customer.deletePitchOnOption(ary,node[i],node[i].value,true);
            }else{
                handler.customer.deletePitchOnOption(ary,node[i],node[i].value,false);
            }
        }
        if(data){
            var num = node.length;
            p=$(node[num-1]).parent("div").find(".changeText");
            con =$(node[num-1]).parent("div").find(".con");
            handler.customer._showQuickText(node[num-1].value,node[num-1].text,con,p,1,tabMenu);
        }
    },
    deletePitchOnOption:function(ary,src,seleOptionValue,flag){
        var pitchOnOptionTextArr = [];
        var optionArr = [];
        ary = ary.slice(0);
        var pitchOnOption=$(".condition").find("option:selected")||"";
        for (var i = 0; i < pitchOnOption.length; i++) {
            pitchOnOptionTextArr.push(pitchOnOption[i].value);
        }
        $(src).empty();
        for(i=0;i<pitchOnOptionTextArr.length;i++){
            for (var j =0; j < ary.length; j++) {
                if(ary[j].k==pitchOnOptionTextArr[i]){
                    var firstValue = ary[j];
                    var dataFlag = false;
                    var istype=handler.customer.ifcustomType(pitchOnOptionTextArr[i]);
                    if(firstValue.k == "createTime" || firstValue.k == "birth" || firstValue.k == "lastUpdateTime" || firstValue.k == "notifyTime"||istype){
                        dataFlag = handler.customer.isThesameValue(pitchOnOptionTextArr,pitchOnOptionTextArr[i]);
                        if(dataFlag){
                            ary.splice(j,1);
                            if(seleOptionValue==firstValue.k){
                                 ary.unshift(firstValue);
                                }
                        }else if(seleOptionValue==firstValue.k){
                            var dataArrvalue = ary[j];
                            ary.splice(j,1);
                            ary.unshift(dataArrvalue);

                        }
                    }else{
                        ary.splice(j,1);
                        if(seleOptionValue==firstValue.k){
                                 ary.unshift(firstValue);
                                }
                    }
                }
            }
        }
        flag?ary:ary.splice(1,1);
        handler.customer.generateOptions(src,ary);
    },
    ifcustomType:function(value){
        var _type = "";
        var tmpls = getCache("custTmpls");
        var _tmpl = tmpls[0];
        var customFields=_tmpl.custom_fields||[];
            for(var k=0;k<customFields.length;k++){
                var row = customFields[k];
                if(value == row._id){
                    _type = row.type;
                    if(_type=='date'){
                        return true;
                    }
                }
            }
            return false;
    },
    isThesameValue:function(Arr,value){
        var count=0;
        for (var i = 0; i < Arr.length; i++) {
            if(Arr[i]==value){
                count++;
            }
        }
        if(count==2){
            return true;
        }
        return false;
    },
    reduceQuickSearchField: function(data, target) {
        target.closest('.row-select-box').remove();
        handler.customer.plusQuickSearchField(false);
    },
    changeSelectedReset: function(data, target) {
        handler.customer.plusQuickSearchField(false);
    },
    cancelModel:function(e){
        $("#customer_sale_chance_form").find("tr").removeClass("active");

        //$("tr").removeClass("active");
        if(e == 'frm_sale_chance_update'){
            $("#customer_sale_chance_amend_pane").hide();
        }else if(e == 'frm_sale_chance_add'){
            $("#customer_sale_chance_add_pane").hide();
        }
        var pane = $("#batch_modal");
        pane.find('.modal-body').empty();
        pane.modal('hide');
    },
    getPageName:function(menu){
        var mName = "";
        if(menu == 'customer_my'){
            mName = "我的客户";
        }else if(menu == 'customer_seas'){
            mName = "公海";
        }else if(menu == 'customer_all'){
            mName = "全部";
        }
        return mName;
    },
    getTaskFlagName:function(flag){
        var mName = "";
        if(flag == 'start'|| flag == 'export'){
            mName = "正在导出";
        }else if(flag == 'finish'){
            mName = "完成";
        }else if(flag == 'failure'){
            mName = "失败";
        }else if(flag == 'download'){
            mName = "已下载";
        }
        return mName;
    },
    downloadTaskTmpl:function(url){
        downloadFile(url);
        $("#customer_export_task_search_list_panel").find(".refresh").click();
    },
    downloadOrNot:function(flag,path){
        var html = '';
        if(flag==="finish"){
            html =  "<a href='#' class='ds_do_action' ds_action='customer.downloadTaskTmpl' ds_data='"+path+"'>下载</a>"
        }else{
            html = "";
        }
        return html;
    },
    saveQuickSearch:function(data,src){
        var menu = data.menu;
        var kName = data.kName;
        delete data.kName;
        if(kName == ""){
            $().alertmessage('showError','自定义快捷搜索名称不能为空!');
            return;
        }
        var condition = data.condition;
        var con = data.con;
        var _type = "";
        var tmpls = getCache("custTmpls");
        var _tmpl = tmpls[0];
        var customFields=_tmpl.custom_fields||[];
        for(var i=0;i<condition.length;i++){
            var qa = condition[i];
            var co = con[i];
            for(var k=0;k<customFields.length;k++){
                var row = customFields[k];
                if(qa == row._id){
                    _type = row.type;
                    if(_type=='date'){
                        break;
                    }
                }
            }
            if(condition[i] == "createTime" || condition[i] == "birth" || condition[i] == "lastUpdateTime" || condition[i] == "notifyTime" || _type=="date"){
                for(var h=i+1;h<condition.length;h++){
                    var qab = condition[h];
                    if(qa==qab){
                        var coo = con[h];
                        if(co==coo){
                            $().alertmessage('showError','保存失败，日期格式的条件必须是一个小于,一个大于!');
                            return;
                        }
                    }
                }
            }else{
                for(var j=i+1;j<condition.length;j++){
                    var qaa = condition[j];
                    if(qa==qaa){
                        $().alertmessage('showError','保存失败，存在相同的自定义快捷搜索条件!');
                        return;
                    }
                }
            }
        }
        var sendData = {};
        sendData.menu = menu;
        sendData.kName = kName;
        var query = {};
        if(condition.length == con.length){
            var no = 0;
            var la = 0
            var cr = 0;
            var da = 0;
            var br = 0;
            var qn = {};
            var ql = {};
            var qc = {};
            var qd = {};
            var qb = {};
            var lt = utils.Base64.encode("$lt");
            var gt = utils.Base64.encode("$gt");
            for(var j = 0;j<condition.length;j++){
                var na = condition[j];
                for(var k=0;k<customFields.length;k++){
                    var row = customFields[k];
                    if(na == row._id){
                        _type = row.type;
                        if(_type=='date'){
                            break;
                        }
                    }
                }
                if(na=="notifyTime"){
                    if(data[na][no]!=""){
                        query[na] = qn;
                        var obj = query[na];
                        if(con[j]=="$lt"){
                                obj[lt] = data[na][no];
                        }else if(con[j] == "$gt"){
                            obj[gt] = data[na][no];
                        }
                    }
                    no++;
                }else if(na=="lastUpdateTime"){
                    if(data[na][la]!=""){
                        query[na] = ql;
                        var obj = query[na];
                        if(con[j]=="$lt"){
                            obj[lt] = data[na][la];
                        }else if(con[j]=="$gt"){
                            obj[gt] = data[na][la];
                        }
                    }
                    la++;
                }else if(na=="createTime"){
                    if(data[na][cr]!=""){
                        query[na] = qc;
                        var obj = query[na];
                        if(con[j]=="$lt"){
                            obj[lt] = data[na][cr];
                        }else if(con[j]=="$gt"){
                            obj[gt] = data[na][cr];
                        }
                    }
                    cr++;
                }else if(na=="birth"){
                    if(data[na][br]!=""){
                        query[na] = qb;
                        var obj = query[na];
                        if(con[j]=="$lt"){
                            obj[lt] = data[na][br];
                        }else if(con[j]=="$gt"){
                            obj[gt] = data[na][br];
                        }
                    }
                    br++;
                }else if(_type=="date"){
                    if(data[na][da]!=""){
                        query[na] = qd;
                        var obj = query[na];
                        if(con[j]=="$lt"){
                            obj[lt] = data[na][da];
                        }else if(con[j]=="$gt"){
                            obj[gt] = data[na][da];
                        }
                    }
                    da++;
                }else{
                    if(data[na]!=""){
                        query[na] = data[na];
                    }
                }
            }
            sendData.query = query;
            var action = {
                action:'app.customer.addQuickSearch',
                data:sendData
            };
            DS.send(action,function(rep){
                if(rep.success) {
                    $().alertmessage('showSuccess', '增加自定义快捷搜索成功!');
                    addCache("quickSearchTmpls", rep.data);
                    handler.customer.cancelModel();
                    handler.customer.queryQuickSearch(data,src);
                }else{
                        $().alertmessage('showError', rep.message|| errMsg);
                }
            });
        }
    },

    showDeleteQuickSearch:function(data,src){
        var q = data.split("|");
        var kName = q[1];
        var kId = q[0];
        var view = "<p>自定义快捷搜索【"+kName+"】删除后，将不能恢复,确认删除吗？</p>";
        var p=$('#confirm_modalBox');
        p.find(".modal-body").html(view);
        p.find(".ds_do_action").attr({"ds_action":"customer.deleteQuickSearch","ds_data":kId})
        p.width(600);
        p.modal({backdrop:'static'});

    },
    deleteQuickSearch:function(data,src){
        var kId = data;
        var sendData = {
           kId:data
        }
        var action = {
            action : 'app.customer.deleteQuickSearch',
            data:sendData
        };
        DS.send(action,function(rep){
           if(rep.success){
               $().alertmessage('showSuccess','删除自定义快捷搜索成功!');
               removeCache("quickSearchTmpls",kId);
               handler.customer.cancelConfirmModal();
               handler.customer.queryQuickSearch(sendData,src);
           }else{
               $().alertmessage('showError', rep.message|| errMsg);
           }
        });
    },
    _initUpdateQuickSearch:function(html,pane,selected,menu,sele){
        pane.find("#field_quickSearch_pane").append(html);
        var ary = handler.customer.quickSearchAry || [];
        var node = pane.find("select[name='condition[]']")|| [];
        var num = node.length;
        var obj = node.get(num-1);
        handler.customer.generateOptions(obj,ary,selected);
        //$("#field_quickSearch_pane").find(".row-select-box").
        var value = obj.options[obj.selectedIndex].value;
        var text = obj.options[obj.selectedIndex].text;
        var con = pane.find("select[name='con[]'")||[];
        var nu = con.length;
        var pa = pane.find(".changeText");
        var sum = pa.length;
        var node1 = pane.find(".condition")|| [];
        for (var i=0; i < node1.length; i++) {
            if(i===node1.length-1){
                handler.customer.deletePitchOnOption(ary,node1[i],node1[i].value,true);
            }else{
                handler.customer.deletePitchOnOption(ary,node1[i],node1[i].value,false);
            }
        }
        handler.customer._showQuickText(value,text,con[nu-1],pa[sum-1],sele,menu);
    },
    //修改自定义搜索的时候加载已保存的条件。
    displayCondition:function(query,menu,pane,kName){
        pane.find("input[name='kName']").val(kName);
        var tmpls = getCache("custTmpls");
        var _tmpl = tmpls[0];
        var customFields=_tmpl.custom_fields||[];
        var num = 0;
        var province = [];
        var hasProp = false;
        var ary = handler.customer.quickSearchAry||[];
        var aryName = [];
        for(var a=0;a<ary.length;a++){
            var k = ary[a];
            aryName.push(k.k);
        }
        aryName.push("city");
        for(var i in query){
            if($.inArray(i,aryName)==-1){
                continue;
            }
            var _type = "";
            if(i=="province") {
                province.push(query[i]);
            }
            for(var j = 0;j<customFields.length;j++) {
                var row = customFields[j];
                if (i == row._id) {
                    _type = row.type;
                    if (_type == "date" || _type == "dropdown" || _type == "checkbox" || _type == "radio") {
                        break;
                    }
                }
            }
            var plusTmpl = '<div class="row-select-box" style="position: relative;">'+
                '<a class="plus ds_form_action" ds_action="customer.plusQuickSearchField" ds_data=""></a>'+
                '<select class="condition weixin-name"  name="condition[]" ds_action="customer.changeSelectedReset"  style="width:80px"></select>'+
                ' <select class="con" name="con[]" style="width:65px">'+
                '<option value="=">等于</option>'+
                '</select>'+
                ' <span class="changeText">'+
                '</span>'+
                '</div>';
            var reduceTmpl='<div class="row-select-box" style="position: relative;">'+
                '<a class="reduce ds_form_action" ds_action="customer.reduceQuickSearchField" ds_data=""></a>'+
                '<select class="condition weixin-name"  name="condition[]" ds_action="customer.changeSelectedReset"  style="width:80px"></select>'+
                ' <select class="con" name="con[]" style="width:65px">'+
                '<option value="=">等于</option>'+
                '</select>'+
                ' <span class="changeText"></span>'+
                '</div>';
            if(num == 0){
                hasProp = true;
                if(i == "notifyTime" || i == "lastUpdateTime" || i == "createTime" || i=="birth"|| _type=="date"){
                    var item = query[i];
                    var nNum = 0;
                    for(var u in item){
                        var hTmpl = "";
                        if(nNum == 0){
                            hTmpl = plusTmpl;
                        }else{
                            hTmpl= reduceTmpl;
                        }
                        var sel = u;
                        var val = item[u];
                        var sel1 = utils.Base64.decode(sel);
                        handler.customer._initUpdateQuickSearch(hTmpl,pane,i,menu,sel1);
                        var naa = pane.find("input[name='"+i+"[]']")||[];
                        naa[nNum].value = val;
                        nNum++;
                    }
                }else{
                    if(i=="city") {
                        pane.find("select[name='" + i + "']").val(query[i]);
                    }else{
                        handler.customer._initUpdateQuickSearch(plusTmpl,pane,i,menu,1);
                        if (i == "status" || i == "custsource1" || _type == "dropdown" || i == "province"||i=="categoryId"||i=="sysStatus") {
                            if(i=="province"){
                                var htm=generateCCOptions(proviceCityDicKey,province);
                                pane.find("select[name='city']").html(htm);
                            }
                            pane.find("select[name='" + i + "']").val(query[i]);
                        }else if(i=="owner"){
                            if(menu=="customer_seas"){
                                pane.find("select[name='" + i + "']").val(query[i]);
                            }else if(menu=="customer_all"){
                                var ownerId = query[i];
                                var _agents=filterUserByScope('customer');
                                var _categorys=filterCategoryByManager();
                                var agents = [];
                                if(_categorys.length>0){
                                    agents=_categorys;
                                }
                                if(_agents.length>0){
                                    agents=agents.concat(utils.loadUsers(true,false));
                                }
                                var uName = "";
                                for(var i=0;i<agents.length;i++){
                                    var u = agents[i];
                                    if(u._id == ownerId){
                                        if(u.displayName){
                                            uName = u.displayName;
                                        }else if(u.cName){
                                            uName = u.cName;
                                        }
                                        break;
                                    }
                                }
                                $("#customer_owner_select_user_input").val(uName);
                            }
                        } else if (_type == "checkbox") {
                            var check = pane.find("input[name='" + i + "[]']") || [];
                            if (check) {
                                for (var m = 0; m < query[i].length; m++) {
                                    $("input[name='" + i + "[]'][value=" + query[i][m] + "]").attr("checked", true);
                                }
                            }
                        }else if(_type == "radio"){
                            $("input[name='"+i+"'][value="+query[i]+"]").attr("checked",true)
                        } else {
                            pane.find("input[name='" + i + "']").val(query[i]);
                        }
                    }
                }
            }else{
                if(i == "notifyTime" || i == "lastUpdateTime" || i == "createTime" || i=="birth"|| _type=="date"){
                    var item = query[i];
                    var nNum = 0;
                    for(var n in item){
                        var sel = n;
                        var val = item[n];
                        var sel1 = utils.Base64.decode(sel);
                        handler.customer._initUpdateQuickSearch(reduceTmpl,pane,i,menu,sel1);
                        var naa = pane.find("input[name='"+i+"[]']")||[];
                        naa[nNum].value=val;
                        nNum++;
                    }
                }else{
                    if(i=="city") {
                        pane.find("select[name='" + i + "']").val(query[i]);
                    }else{
                        handler.customer._initUpdateQuickSearch(reduceTmpl,pane,i,menu,1);
                        if (i == "status" || i == "custsource1" || _type == "dropdown" || i == "province"||i=="categoryId"||i=="sysStatus") {
                            if(i=="province"){
                                var htm=generateCCOptions(proviceCityDicKey,province);
                                pane.find("select[name='city']").html(htm);
                            }
                            pane.find("select[name='" + i + "']").val(query[i]);
                        }else if(i=="owner"){
                            if(menu=="customer_seas"){
                                pane.find("select[name='" + i + "']").val(query[i]);
                            }else if(menu=="customer_all"){
                                var ownerId = query[i];
                                var _agents=filterUserByScope('customer');
                                var _categorys=filterCategoryByManager();
                                var agents = [];
                                if(_categorys.length>0){
                                    agents=_categorys;
                                }
                                if(_agents.length>0){
                                    agents=agents.concat(utils.loadUsers(true,false));
                                }
                                var uName = "";
                                for(var i=0;i<agents.length;i++){
                                    var u = agents[i];
                                    if(u._id == ownerId){
                                        if(u.displayName){
                                            uName = u.displayName;
                                        }else if(u.cName){
                                            uName = u.cName;
                                        }
                                        break;
                                    }
                                }
                                $("#customer_owner_select_user_input").val(uName);
                            }
                        } else if (_type == "checkbox") {
                            var check = pane.find("input[name='" + i + "[]']") || [];
                            if (check) {
                                for (var m = 0; m < query[i].length; m++) {
                                    $("input[name='" + i + "[]'][value=" + query[i][m] + "]").attr("checked", true);
                                }
                            }
                        }else if(_type == "radio"){
                            $("input[name='"+i+"'][value="+query[i]+"]").attr("checked",true)
                        } else {
                            pane.find("input[name='" + i + "']").val(query[i]);
                        }
                    }

                }
            }
            num++;
        }
        if(!hasProp){
            var pTmpl = '<div class="row-select-box" style="position: relative;">'+
                '<a class="plus ds_form_action" ds_action="customer.plusQuickSearchField" ds_data=""></a>'+
                '<select class="condition weixin-name"  name="condition[]" ds_action="customer.changeSelectedReset" style="width:80px"></select>'+
                ' <select class="con" name="con[]" style="width:65px">'+
                '<option value="=">等于</option>'+
                '</select>'+
                ' <span class="changeText" id="changeText">'+
                '</span>'+
                '</div>';
            handler.customer._initUpdateQuickSearch(pTmpl,pane,"name",menu,1);
        }
    },
    showQuickSearchUpdate:function(data){
        var kId = data;
        var sendData  = {};
        sendData._id = kId;
        var p=$('#batch_modal');
        DS.getView("customer/customer_quick_search_update",function(view){
            view = view.replace(/_#kId#_/g,kId);
            p.find('.modal-title').text('修改自定义快捷搜索');
            p.find(".modal-body").html(view);
            p.width(685);
            p.modal({backdrop:'static'});
            var action = {
                action: 'app.customer.queryQuickSearchById',
                data:sendData
            };
            DS.send(action,function(rep){
                if(rep.success){
                    var data = rep.data;
                    var kName = data.kName;
                    var menu = data.menu;
                    handler.customer.addQuickSearchList(menu);
                    var query = data.query;

                    handler.customer.displayCondition(query,menu,p,kName);
                    //p.find("input[name='kName']").val(kName);
                    p.find("select[name='menu']").val(menu);
                    p.find("select[name='menu']").on('change',function(e){
                        var tabVal = p.find("select[name='menu']").val();
                        p.find("input[name='kName']").val("");
                        $("#field_quickSearch_pane").empty();
                        handler.customer.addQuickSearchList(tabVal);
                        if(tabVal==menu){
                            handler.customer.displayCondition(query,menu,p,kName);
                        }else{
                            var pane = $("#field_quickSearch_pane");
                            var str = '<div class="row-select-box" style="position: relative;">'+
                                '<a class="plus ds_form_action" ds_action="customer.plusQuickSearchField" ds_data=""></a>'+
                                '<select class="condition weixin-name"  name="condition[]" ds_action="customer.changeSelectedReset" style="width:80px"></select>'+
                                ' <select class="con" name="con[]" style="width:65px">'+
                                '<option value="=">等于</option>'+
                                '</select>'+
                                ' <span class="changeText"><input name="name" type="text" maxlength="50" msgName="客户名称" style="width:150px"></span>';
                            '</div>';
                            pane.append(str);
                            var ary = handler.customer.quickSearchAry ||[];
                            var node = p.find("select[name='condition[]']") || [];
                            handler.customer.generateOptions(node.get(0),ary);
                        }
                    });
                }
            })
        });
    },
    saveUpdateQuickSearch:function(data,src){
        var menu = data.menu;
        var kId = data.kId;
        var kName = data.kName;
        delete data.kName;
        if(kName == ""){
            $().alertmessage('showSuccess','自定义快捷搜索名称不能为空!');
            return;
        }
        var _type = "";
        var tmpls = getCache("custTmpls");
        var _tmpl = tmpls[0];
        var customFields=_tmpl.custom_fields||[];
        var condition = data.condition;
        var con = data.con;
        for(var i=0;i<condition.length;i++){
            var qa = condition[i];
            var co = con[i];
            for(var k=0;k<customFields.length;k++){
                var row = customFields[k];
                if(qa == row._id){
                    _type = row.type;
                    if(_type=='date'){
                        break;
                    }
                }
            }
            if(condition[i] == "createTime" || condition[i] == "birth" || condition[i] == "lastUpdateTime" || condition[i] == "notifyTime" || _type=="date"){
                for(var h=i+1;h<condition.length;h++){
                    var qab = condition[h];
                    if(qa==qab){
                        var coo = con[h];
                        if(co==coo){
                            $().alertmessage('showError','保存失败，日期格式的条件必须是一个小于,一个大于!!');
                            return;
                        }
                    }
                }
            }else{
                for(var j=i+1;j<condition.length;j++){
                    var qaa = condition[j];
                    if(qa==qaa){
                        $().alertmessage('showError','保存失败，存在相同的自定义快捷搜索条件!');
                        return;
                    }
                }
            }
        }
        var sendData = {};
        sendData.menu = menu;
        sendData.kName = kName;
        sendData.kId = kId;
        var query = {};

        if(condition.length == con.length){
            var no = 0;
            var la = 0
            var cr = 0;
            var da = 0;
            var br = 0;
            var qn = {};
            var ql = {};
            var qc = {};
            var qd = {};
            var qb = {};
            var lt = utils.Base64.encode("$lt");
            var gt = utils.Base64.encode("$gt");
            for(var j = 0;j<condition.length;j++){
                var na = condition[j];
                for(var k=0;k<customFields.length;k++){
                    var row = customFields[k];
                    if(na == row._id){
                        _type = row.type;
                        if(_type=='date'){
                            break;
                        }
                    }
                }
                if(na=="notifyTime"){
                    if(data[na][no]!=""){
                        query[na] = qn;
                        var obj = query[na];
                        if(con[j]=="$lt"){
                            obj[lt] = data[na][no];
                        }else if(con[j] == "$gt"){
                            obj[gt] = data[na][no];
                        }
                    }
                    no++;
                }else if(na=="lastUpdateTime"){
                    if(data[na][la]!=""){
                        query[na] = ql;
                        var obj = query[na];
                        if(con[j]=="$lt"){
                            obj[lt] = data[na][la];
                        }else if(con[j]=="$gt"){
                            obj[gt] = data[na][la];
                        }
                    }
                    la++;
                }else if(na=="createTime"){
                    if(data[na][cr]!=""){
                        query[na] = qc;
                        var obj = query[na];
                        if(con[j]=="$lt"){
                            obj[lt] = data[na][cr];
                        }else if(con[j]=="$gt"){
                            obj[gt] = data[na][cr];
                        }
                    }
                    cr++;
                }else if(na=="birth"){
                    if(data[na][br]!=""){
                        query[na] = qb;
                        var obj = query[na];
                        if(con[j]=="$lt"){
                            obj[lt] = data[na][br];
                        }else if(con[j]=="$gt"){
                            obj[gt] = data[na][br];
                        }
                    }
                    br++;
                }else if(_type=="date"){
                    if(data[na][da]!=""){
                        query[na] = qd;
                        var obj = query[na];
                        if(con[j]=="$lt"){
                            obj[lt] = data[na][da];
                        }else if(con[j]=="$gt"){
                            obj[gt] = data[na][da];
                        }
                    }
                    da++;
                }else{
                    if(data[na]!=""){
                        query[na] = data[na];
                    }
                }
            }
            sendData.query = query;
            var action = {
                action:'app.customer.upQuickSearch',
                data:sendData
            };
            DS.send(action,function(rep){
                if(rep.success) {
                    $().alertmessage('showSuccess', '修改自定义快捷搜索成功!');
                    updateCache("quickSearchTmpls",rep.data._id,rep.data);
                    handler.customer.cancelModel();
                    handler.customer.queryQuickSearch(data,src);
                }else{
                    $().alertmessage('showError', rep.message|| errMsg);
                }
            });
        }
    },
    showCustomerCommon:function(menu,src){/*popup interface*/
        var pane=$('#'+menu+'_customer');
        pane=pane.find(".customer_container");
        DS.getView('config/customerCommon/config_customerCommon',function(view){
            pane.empty().html(view);
            pane.siblings(".cust_tab_content").height("auto").children().empty();
            pane.siblings('.cust_tab_url').empty().height('auto');
            //$("#customerCommon_query_panel").find(".refresh").click();
            //$("#customerCommon_info_pane").hide();
            handler.config.customerCommon.config_customerCommon(menu);
        });
    },


    getCustomerCategoryDesc:function(categoryId){
        var desc="";
        var pool=getCache('custCategorys',categoryId);
        if(pool){
            desc= pool.cName;
        }
        return desc;
    },

    getCustomerSysStatus : function (val){
        var ary=getCache('sys_status');
        var desc="";
        for(var i=0;i<ary.length;i++){
            var obj=ary[i];
            if(obj.code_value == val){
                desc=obj.code_name;
                break;
            }

        }
        return desc;
    },

    _initQuery:function(menu){
        var query=null;
        var json=$('#contact_list_'+menu).find(".search_condition").html();
        if(json){
            query=$.evalJSON(unescapeHtml(json));
            query=removeEmptyProperty(query);
            if(!query.category){
                return false;
            }
            return true;
        }else{
            $().alertmessage("showError","请先选择客户分类!");
            return false;
        }
    },
    cancelConfirmModal:function(){
        var p=$('#confirm_modalBox');
        p.modal('hide');
    },
    _initCustomerCommon:function(pane){
        var node = pane.find("select[name='categoryId']")|| [];
        var obj = node.get(0);
        var ary = {};
        ary["NA"] = "无归属";
        var list = getCache("custCategorys");
        if(list.length>0){
            for(var i =0;i<list.length;i++){
                var m = list[i];
                var managers = m.managers;
                var members = m.members;
                var category = m.category;
                var userId = session.user._id;
                if(category=="0"||category=="3"||category=="4"){
                    if(managers.indexOf(userId)!=-1||members.indexOf(userId)!=-1){
                        ary[m._id] = m.cName;
                    }
                }
            }
        }
        handler.customer.generateOptions(obj,ary);
    },
    showBatchCustomerCommon:function(menu,src){
        var pane=$('#batch_modal');
        var toolbarPane=$("#pane_deal_list");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        num=parseInt(num,10)||0;
        if(num<=0){
            $().alertmessage('showError', "请至少选择一条进行操作！");
            return;
        }
        if(session.user.account=='N00000004872'){
            if(num>20000){
                $().alertmessage('showError', "一次最多操作10000条,请您过滤查询条件分批操作!");
                return;
            }
        }else{
            if(num>10000){
                $().alertmessage('showError', "一次最多操作10000条,请您过滤查询条件分批操作!");
                return;
            }
        }
        DS.getView('customer/customer_batch_update_customerCategory',function(view){
            view=view.replace(/_#menu#_/g,menu);
            pane.find('.modal-title').text('批量转移客户');
            pane.find(".modal-body").html(view);
            handler.customer._initCustomerCommon(pane);
            $(".cust_count",pane).text(num);
            pane.width(500);
            pane.modal();
        });
    },
    batchUpdateCustomerCategory:function(data , src){
        //console.dir(data);
        var menu=data.menu;
        var pane=$('#batch_modal');
        var leftPane=$('#contact_list_'+menu);
        var checkPane=leftPane.find(".list_check_all");
        var isAll=checkPane.hasClass("select_on")?"1":"0";
        var query = handler.customer._getSearchCondition(leftPane,isAll);
        var total = parseInt(pane.find(".cust_count").text());
        var categoryId = data.categoryId;
        var action={
            action:'app.customer.batchUpdateCustomerCategory',
            data: {query:query,total:total,categoryId:categoryId}
        };
        DS.send(action,function(rep){
            if(rep.success){
                dsevent.publish(dsevent.evt.customerRefresh);
                $().alertmessage('showSuccess', "转移客户成功");
                pane.find(".modal-body").empty();
                pane.modal("hide");
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "您转移的数据总数发生变化，请重新确认后再操作");
                }else if(rep.code=='1002'){
                    $().alertmessage('showError',"您不是该公海管理员，不能将客户转移到该公海");
                }else if(rep.code ==='1005'){
                    $().alertmessage('showError',"选中的客户中有处于待审核状态的客户，若要批量转移归属，请先等待客户审核完成!");
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
            }
        });
    },


    changeSysStatus :function(data,src) {
        var parm = data.split(",");
        var type=parm[0];
        var cid=parm[1];
        var categoryId=parm[2];
        var cname=parm[3];
        var sysStatus=parm[4];
        var sourceOwner=parm[5];
        var status=parm[6];
        var pane = $("#customer_approval_modal");
        var title = "";
        var openView = "";
        if(type == "2"){
           title = "无效客户报审";
           openView = "customer/customer_approval_invalid";
        }else if(type == "4") {
           title = "丢单客户报审";
           openView = "customer/customer_approval_lose";
        }else if(type == "3"||type=="10"){
           title = "成交客户报审";
           openView = "customer/customer_approval_order";
        }else if(type == "8"){
           title = "续费客户报审";
           openView = "customer/customer_approval_renew";
        }
        DS.getView(openView,function(view){
            pane.find('.modal-title').text(title);
            pane.find(".modal-body").html(view);
            if(type == "4"){
                //设置丢单下拉框
                var selectElement = $("#competitors");
                var competitors = session.dicMap.custTmpls[0]["competitors"];
                if(competitors){
                    for(var i=0; i<competitors.length;i++){
                        selectElement.append('<option value="'+competitors[i].name+'">'+competitors[i].name+'</option>');
                    }
                }
            }

            //设置通用提交信息
            $("#cid").val(cid);
            $("#categoryId").val(categoryId);
            $("#cname").val(cname);
            $("#sysStatus").val(sysStatus);
            $("#status").val(status);
            $("#sourceOwner").val(sourceOwner);
            $("#custTmplsId").val(session.dicMap.custTmpls[0]._id);
            pane.width(500);
            pane.modal({backdrop:'static'});
        });
    },
    showContactDesc:function(val) {
        var desc = '';
        //var contactDesc=getDicCacheName('sys_status',val);
        if (val == '0') {
            desc = "genjinicon2";
        } else if (val == '1') {
            desc = "genjinicon1";
        } else if (val == '2') {//无效
            desc = "genjinicon3";
        } else if (val == '3') {//成单
            desc = "genjinicon4";
        } else if (val == '4') {//丢单
            desc = "genjinicon7";
        } else if (val == '5' ||val == '6'||val == '7'||val == '9') {
            desc = "genjinicon5";
        } else if (val == '10'||val == '11') {
            desc = "genjinicon6";
        }
        return desc;
    },
    showForOwnerDesc:function(item,menu){
        //console.info("menu======="+menu);
        //console.dir(item);
        var normalId=handler.customer.normalId;
        var owner=item.owner;
        var categoryId=item.categoryId;
        var desc="";
        var showCategory=function(){
            if(categoryId!=normalId){
                desc = handler.customer.getCustomerCategoryDesc(categoryId);
                if(!desc){
                    desc="已删除的公海";
                }
            }else{
                desc='无归属';
            }
        }
        if(menu=='customer_my') {
            if(categoryId!=normalId){
                showCategory();
            }
        }else if(menu=='customer_seas'){
            showCategory();
            var id = item._id;
            // desc='<span>'+desc+'<button type="button" id="getSeas" class="btn-blue btn-small ds_do_action btn_cust_claim">领取</button></span>';
        }else{
            if(owner!=categoryId){
                desc=handler.customer.getOwnerName(owner);
            }else{
                showCategory();
            }
        }

        return desc;
    },
    showAllForOwnerDesc:function(item){
        var normalId=handler.customer.normalId;
        var owner=item.owner;
        var categoryId=item.categoryId;
        var desc="";
        var showCategory=function(){
            if(categoryId!=normalId){
                desc = handler.customer.getCustomerCategoryDesc(categoryId);
                if(!desc){
                    desc="已删除的公海";
                }
            }else{
                desc='无归属';
            }
        }
        if(owner!=categoryId){
            desc=handler.customer.getOwnerName(owner);
        }else{
            showCategory();
        }

        return desc;
    },
    refreshCurrentCustomer: function(data){
        var pane = $("#contact_list_customer_my").find(".item"+data);
        pane.parent().remove();
        if (pane.hasClass("expanded")) {
            $("#view_customer_list_content .customer_container,#view_customer_list_content .cust_tab_content").children().empty();
        }
    },
    //取消联系计划
    showCancelPlanning:function(menu,src){
        var leftPane=$('#contact_list_'+menu);
        var toolbarPane=$("#pane_deal_list");
        var checkPane=leftPane.find(".list_check_all");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        num=parseInt(num,10)||0;
        if(num<=0){
            $().alertmessage('showError', "请至少选择一条进行操作!");
            return;
        }
        if(num>10000){
            $().alertmessage('showError', "最多取消10000条,请过滤查询条件分多次取消!");
            return;
        }
        var view="<p>&nbsp;&nbsp;您搜索到客户数据共<strong style='color: red;'>"+num+"</strong>条，取消联系计划后将不可恢复，确认要操作吗？</p>";
        var p=$('#confirm_modalBox');
        p.find(".modal-body").html(view);
        p.find(".ds_do_action").attr({"ds_action":"customer.cancelPlanning","ds_data":menu})
        p.width(500);
        p.modal();

    },
    cancelPlanning:function(menu,src){
        var leftPane=$('#contact_list_'+menu);
        var toolbarPane=$("#pane_deal_list");
        var checkPane=leftPane.find(".list_check_all");
        var num=toolbarPane.find(".bottom_toolbar_selsize_num").text();
        var isAll=checkPane.hasClass("select_on")?"1":"0";
        var query = handler.customer._getSearchCondition(leftPane,isAll);
        query.menu = menu;
        var action = {
            action: 'app.customer.cancelPlanning',
            data: {query:query,total:num}
        };
        DS.send(action,function(rep) {
            if(rep.success){
                $().alertmessage('showSuccess', '取消成功!');
                handler.customer.cancelConfirmModal();
                dsevent.publish(dsevent.evt.customerBatchDel);
            }else{
                if(rep.code=='1001'){
                    $().alertmessage('showError', "您选择的数据总数发生变化，请重新确认后再操作");
                }else{
                    $().alertmessage('showError', rep.message||errMsg);
                }
            }
        });
    },
    showBaAHistory:function(data,src) {
        var _p = src.closest(".cust_tab_content");
        var key = src.attr("ds_attr");
        if (data == 'history_action') {
            handler.customer.showHistoryAction(key, _p);
        } else if (data == 'history_business') {
            handler.business.loadHistoryTaskInfo(key, _p);
        }
    },
    settingCustRemind:function(flag){
        var action = {
            action: 'app.customer.settingCustRemind',
            data: flag
        };
        DS.send(action, function (response) {
            if (response.success) {
                var msg="";
                if(flag=="1"){
                    delete session.user.custRemind;
                    msg="您开启了客户分配、回收提醒，请注意查看！";
                }else if(flag=="0"){
                    session.user.custRemind = "0";
                    msg="您已关闭了客户分配、回收提醒，有客户归属变化将不会提醒！";
                }
                $().alertmessage('showSuccess', msg);
            }else{
                $().alertmessage('showError', response.message);
            }
        })
    },
     showCountDown: function(container,countDownTime,timeClass,stop){
        if(timeClass==="count_down_time"&&parseInt(countDownTime)<1000){
            container.find("."+timeClass+"[ds_stop="+stop+"]").attr("countdowntime",-1);
            return;
        }
        var cc = "",
            leftsecond = parseInt(Math.abs(countDownTime)),
            cc = handler.business.timer(leftsecond)
            container.show();
            if(leftsecond/60<30&&timeClass==="count_down_time"){
                container.css("background-color","red");
            }
            if(timeClass==="time"&&countDownTime<0){
                var phoneBarTipOption = {placement:'bottom',trigger:'hover',html:true};
                phoneBarTipOption.title="已超时";
                container.tooltip(phoneBarTipOption);
                container.find("."+timeClass+"[ds_stop="+stop+"]").css("color","red")
            };
            if(stop){
                container.find("."+timeClass+"[ds_stop="+stop+"]").text(cc).attr("countdowntime",countDownTime-1000);
            }    
             
    }
}
