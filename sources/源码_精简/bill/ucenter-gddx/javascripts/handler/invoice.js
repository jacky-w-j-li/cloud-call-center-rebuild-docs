handler.invoice = {
    pageSize: 10,
    currentTab:null,
    payIds:[],
    showMain:function(){
        var pane=$("#right_pane");
        pane.find(".nav.nav-tabs").find("li:first>a").click()
    },
    reset:function(data,src){
        var frm=src.closest("form");
        frm[0].reset();
    },
    //////////////////invoice get////////////////////
    showGetMain:function(data,src){
        var pane=$("#right_pane");
        handler.invoice.currentTab='get';
        var url='index/invoice/invoice_get_list';
        DS.getView(url, function (view) {
            pane.find('#account_invoice_tab_content').html(view);
            pane.find(".ds_invoice_get_search").click();
        });
    },
    quick_search:function(data,src){
        var pane=$("#right_pane");
        var url='index/invoice/invoice_get_list';
        if(data=='deal'){
            url='index/invoice/invoice_pay_list';
        }
        DS.getView(url, function (view) {
            pane.find('#account_invoice_tab_content').html(view);
            pane.find(".ds_invoice_get_search").click();
        });
        //var searchPane = src.closest("#frm_invoice_get_search");
        //searchPane.find(".quick_item").removeClass("active");
        //src.addClass("active");
        //searchPane.find("input[name='flag']").val(data);
        //searchPane.find(".ds_invoice_get_search").click();
    },
    queryGetList:function(data,src){
        data=data||{};
        var flag=data.flag;
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=20;
        var frmId='frm_invoice_get_search';
        var pane=$("#right_pane");
        if(flag=='nodeal'){
            var action={
                action:"app.invoice.getNoInvoiceList",
                data:data
            }
            DS.send(action,function(rep){
                if(rep.success){
                    var list=rep.list||[];
                    var count=rep.count;
                    var total=rep.total;
                    pane.find(".total_invoice").text(total);
                    if (list.length > 0){
                        DS.getView('index/invoice/invoice_get_item',function (view) {
                            var html = [];
                            for (var i = 0, len = list.length; i < len; i++) {
                                var row = list[i];
                                if(!row.memo)row.memo="";
                                html.push(DS.renderMethodViewNew(view, row));
                            }
                            pane.find('.content_list').html(html.join(''));
                        });
                    } else {
                        var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                        pane.find('.content_list').html(html);
                    }
                    pane.find('.result_count').text(count);
                    DS.updatePagination(frmId, count, data.limit, data.page);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            })
        }else{
            var action={
                action:"app.invoice.getDealInvoiceList",
                data:data
            }
            DS.send(action,function(rep){
                if(rep.success){
                    var list=rep.list||[];
                    var count=rep.count;
                    if (list.length > 0){
                        DS.getView('index/invoice/invoice_pay_deal_item',function (view) {
                            var html = [];
                            for (var i = 0, len = list.length; i < len; i++) {
                                var row = list[i];
                                if(!row.memo)row.memo="";
                                row.deal="";
                                if(row.invoiceStatus=='dealing'||row.invoiceStatus=='deal'){
                                    row.deal='<a href="#" class="ds_do_action" ds_action="invoice.viewInvoiceByPayId"  ds_data="'+row.invoiceId+'" >查看</a>';
                                }
                                html.push(DS.renderMethodViewNew(view, row));
                            }
                            pane.find('.content_list').html(html.join(''));
                        });
                    } else {
                        var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                        pane.find('.content_list').html(html);
                    }
                    pane.find('.result_count').text(count);
                    DS.updatePagination(frmId, count, data.limit, data.page);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            })
        }
    },
    viewInvoiceByPayId:function(id,src){
        var action={
            action:'app.invoice.getInvoiceByPayId',
            data:{_id:id}
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                var list=row.payList;
                if(!row.memo){
                    row.memo="";
                }
                if(!row.reason){
                    row.reason="";
                }
                var status=row.status;
                DS.getView('index/invoice/invoice_detail',function(view){
                    view=DS.renderMethodViewNew(view, row);
                    var p=pane.find('#invoice_modal_view');
                    p.find(".modal-body").html(view);
                    if(status=='cancel'){
                        p.find(".invoice_reason").show();
                    }
                    if (list.length > 0){
                        DS.getView('index/invoice/invoice_pay_item',function (view) {
                            var html = [];
                            for (var i = 0, len = list.length; i < len; i++) {
                                var item = list[i];
                                if(!item.memo)item.memo="";
                                html.push(DS.renderMethodViewNew(view, item));
                            }
                            pane.find('.invoice_pay_list .content_list').html(html.join(''));
                        });
                    } else {
                        var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                        pane.find('.content_list').html(html);
                    }

                    p.find(".modal-dialog").width(800);
                    p.find(".modal-title").html('查看开票明细');
                    p.modal();
                })
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    checkAllPay:function(data,src){
        var pane=$("#right_pane").find('#account_invoice_tab_content');
        var all=src.prop("checked");
        var container=pane.find(".content_list");
        var total=pane.find(".result_count").text();
        if(all){
            container.find("input[name='ids']").prop("checked",true);
            pane.find(".select_num").text(total);
            var total_invoice=pane.find(".total_invoice").text();
            pane.find(".select_invoice").text(total_invoice);
            pane.find(".select_num_tr").show();
        }else{
            container.find("input[name='ids']").prop("checked",false);
            pane.find(".select_num").text(0);
            pane.find(".select_invoice").text(0);
            pane.find(".select_num_tr").hide();
        }
    },
    checkOnlyPay:function(data,src){
        var pane=$("#account_invoice_tab_content");
        //var checked=src.prop("checked");
        pane.find(".checkAll").prop("checked",false);
        var container=pane.find(".content_list");
        var selectItems=container.find("input[name='ids']:checked");
        //console.dir(selectItems)
        var len=selectItems.length;
        pane.find(".select_num").text(len);
        var total=0;
        selectItems.each(function(){
            var m=$(this).val()||0;
            m=parseFloat(m);
            total+=m;
        })
        total=Math.round(total*100)/100;
        pane.find(".select_invoice").text(total);
        if(total>0){
            pane.find(".select_num_tr").show();
        }else{
            pane.find(".select_num_tr").hide();
        }
    },
    showGetInvoice:function(data,src){
        var pane=$("#account_invoice_tab_content");
        var container=pane.find(".content_list");
        var checked=pane.find(".checkAll").prop("checked");
        var selectItems=container.find("input[name='ids']:checked");
        handler.invoice.payIds=[];
        selectItems.each(function(){
            var id=$(this).attr("ds_data");
            handler.invoice.payIds.push(id);
        })
        var head=pane.find(".invoice_get_head");
        var selectNum=pane.find(".select_num").text();
        var selectInvoice=head.find(".select_invoice").text();
        var totalInvoice=head.find(".total_invoice").text();
        var _totalInvoice=parseFloat(totalInvoice);
        _totalInvoice=Math.round(_totalInvoice*100)/100;
        var _selectInvoice=parseFloat(selectInvoice);
        _selectInvoice=Math.round(_selectInvoice*100)/100;
        //console.info("selectInvoice==="+selectInvoice);
        if(selectItems.length==0){
            $().alertmessage('showError', "请您至少勾选一条充值单！");
            return;
        }
        if(_selectInvoice<=0){
            $().alertmessage('showError', "开票金额不能小于0！");
            return;
        }
        if(session.account.billLoginName && session.account.proxyType!='channel'){
        }else{
            //if(_selectInvoice<1000){
            //    $().alertmessage('showError', "开票额度不能低于1000元，请您累积到1000元再行开具！");
            //    return;
            //}
        }

        if(_selectInvoice > _totalInvoice){
            $().alertmessage('showError', "不能超过可开票总金额["+_totalInvoice+"]元！");
            return;
        }
        var url='index/invoice/invoice_get';
        DS.getView(url, function (view) {
            var row={
                getMoney:_selectInvoice,
                checkAll:checked==true?"1":"0"
            }
            view=DS.renderMethodViewNew(view,row);
            pane.html(view);
            var _head=pane.find(".invoice_get_head2");
            pane.find(".select_num").text(selectNum);
            _head.find(".select_invoice").text(_selectInvoice);
            handler.invoice.queryInfoList();
            handler.invoice.queryAddrList();
        });
    },
    returnGet:function(data,src){
        var pane=$("#right_pane");
        pane.find(".invoice_get>a").click();
    },
    checkFeeLimit:function(data,src){
        var frm=src.closest("form");
        var infoId=data.infoId;
        var addrId=data.addrId;
        if(!infoId){
            $().alertmessage('showError', "请先添加发票信息");
            return;
        }
        if(!addrId){
            $().alertmessage('showError', "请先添加寄送地址");
            return;
        }
        if(session.account.billLoginName && session.account.proxyType!='channel'){
            handler.invoice.saveGetInvoice(data,src)
        }else{
            var invoiceType=frm.find("input[value='"+infoId+"']").attr("ds_attr");
            var money=parseFloat(data.getMoney);
            if(invoiceType=='normal' && money<1000){
                handler.invoice.showPayFee();
            }else{
                handler.invoice.saveGetInvoice(data,src);
            }
        }
    },
    showPayFee:function(){
        var pane=$("#right_pane");
        var view="<h4>您的开票金额不足1000，将会从您的帐号余额中扣除20元的快递费用，确认要提交吗？</h4>";
        var p=pane.find('#invoice_confirm_modal');
        p.find(".modal-dialog").width(500);
        p.find(".modal-body").html(view);
        p.find(".modal-title").html('扣除快递费确认');
        p.find(".ds_do_action").attr({ds_action:'invoice.confirmPayFee'});
        p.modal();
    },
    confirmPayFee:function(data,src){
        var pane=$("#right_pane");
        var p=pane.find('#invoice_confirm_modal');
        p.modal("hide");
        pane.find(".btn_saveInvoice").attr({ds_action:'invoice.saveGetInvoice'});
        pane.find(".btn_saveInvoice").click();
    },
    saveGetInvoice:function(data,src){
        if (src.hasClass("disabled")) return false;
        var frm=src.closest("form");
        data.ids=handler.invoice.payIds;
        //console.dir(data);
        var infoId=data.infoId;
        var addrId=data.addrId;
        var invoiceType=frm.find("input[value='"+infoId+"']").attr("ds_attr");
        var money=parseFloat(data.getMoney);
        if(!infoId){
            $().alertmessage('showError', "请先添加发票信息");
            return;
        }
        if(!addrId){
            $().alertmessage('showError', "请先添加寄送地址");
            return;
        }
        src.addClass("disabled");
        var action={
            action:'app.invoice.saveGetInvoice',
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "索取发票的请求已经发送，请耐心等待！");
                handler.invoice.returnGet();
                if(invoiceType=='normal' && money<1000) {
                    handler.account.finishPay();
                }
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
            src.removeClass("disabled");
        })
    },

    //////////////////invoice addr////////////////////
    showAddrMain:function(data,src){
        var pane=$("#right_pane");
        handler.invoice.currentTab='addr';
        var url='index/invoice/invoice_addr_list';
        DS.getView(url, function (view) {
            pane.find('#account_invoice_tab_content').html(view);
            handler.invoice.queryAddrList();
        });
    },
    queryAddrList:function(data,src){
        data=data||{};
        var pane=$("#account_invoice_tab_content");

        var action={
            action:"app.invoice.getAddrList",
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list||[];
                var url='index/invoice/invoice_addr_item';
                if(handler.invoice.currentTab=='get'){
                    url='index/invoice/invoice_addr_item_get';
                    pane=pane.find(".invoice_get_addr");
                }
                if (list.length > 0){
                    DS.getView(url, function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            if(handler.invoice.currentTab=='get' && row.isDefault){
                                row.checked="checked";
                            }
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        pane.find('.content_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                    pane.find('.content_list').html(html);
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    showAdd:function(data,src){
        var pane=$("#right_pane");
        DS.getView('index/invoice/invoice_addr_add',function(view){
            view=view.replace(/_#.*#_/g,'');
            var p=pane.find('#invoice_modal');
            p.find(".modal-dialog").width(500);
            p.find(".modal-body").html(view);
            p.find(".modal-title").html('添加配送地址');
            p.find(".ds_form_action").attr({ds_action:'invoice.addAddr',ds_form:'#frm_invoice_addr_update'});
            p.modal();
        })
    },
    addAddr:function(data,src){
        var action={
            action:'app.invoice.addAddr',
            data:data
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                handler.invoice.queryAddrList();
                pane.find('#invoice_modal').modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    showUpdate:function(id,src){
        var action={
            action:'app.invoice.getAddrById',
            data:{_id:id}
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                DS.getView('index/invoice/invoice_addr_add',function(view){
                    view=DS.renderMethodViewNew(view,row);
                    var p=pane.find('#invoice_modal');
                    p.find(".modal-dialog").width(500);
                    p.find(".modal-body").html(view);
                    if(row.isDefault){
                        p.find("input[name='isDefault']").prop("checked",true);
                    }
                    p.find(".modal-title").html('修改配送地址');
                    p.find(".ds_form_action").attr({ds_action:'invoice.updateAddr',ds_form:'#frm_invoice_addr_update'});
                    pane.find('#invoice_modal').modal();
                })
            }
        })
    },
    updateAddr:function(data,src){
        var action={
            action:'app.invoice.updateAddr',
            data:data
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                handler.invoice.queryAddrList();
                pane.find('#invoice_modal').modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    delAddr:function(data,src){
        if(!confirm("确认要删除该地址吗？"))return;
        var action={
            action:'app.invoice.delAddr',
            data:{_id:data}
        }
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "删除成功");
                handler.invoice.queryAddrList();
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    //////////////////invoice info////////////////////
    showInfoMain:function(data,src){
        var pane=$("#right_pane");
        handler.invoice.currentTab='info';
        var url='index/invoice/invoice_info_list';
        DS.getView(url, function (view) {
            pane.find('#account_invoice_tab_content').html(view);
            handler.invoice.queryInfoList();
        });
    },
    queryInfoList:function(data,src){
        data=data||{};
        var pane=$("#account_invoice_tab_content");
        var action={
            action:"app.invoice.getInfoList",
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list||[];
                var url='index/invoice/invoice_info_item';
                if(handler.invoice.currentTab=='get'){
                    url='index/invoice/invoice_info_item_get';
                    pane=pane.find(".invoice_get_info");
                }
                if (list.length > 0){
                    DS.getView(url, function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            row.deal='<a href="#" class="ds_do_action" ds_action="invoice.showUpdateInfo"  ds_data="'+row._id+'" >修改</a>';
                            if(row.invoiceType=='professional'){
                                var _html="";
                                if(!row.isDefault){
                                    _html+='<a href="#" class="ds_do_action" ds_action="invoice.setDefaultInfo"  ds_data="'+row._id+'" >设为默认</a>&nbsp;';
                                }
                                _html+='<a href="#" class="ds_do_action" ds_action="invoice.viewProfessional"  ds_data="'+row._id+'" >查看</a>';
                                row.deal=_html;
                            }
                            if(handler.invoice.currentTab=='get' && row.isDefault){
                                row.checked="checked";
                            }
                            html.push(DS.renderMethodViewNew(view, row));
                        }

                        pane.find('.content_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                    pane.find('.content_list').html(html);
                }
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    _showInfoBase:function(data,src){
        var pane=$("#invoice_modal");
        pane.find(".invoice_info_professional").empty();
        if(data=='person'){
            pane.find(".invoice_info_base").html(template("tmpl_invoice_info_person",{}))
        }else{
            pane.find(".invoice_info_base").html(template("tmpl_invoice_info_company",{}))
        }
    },
    _showInfoProfessional:function(data,src){
        var pane=$("#invoice_modal");
        if(data=='normal'){
            pane.find(".invoice_info_professional").empty();
        }else{
            pane.find(".invoice_info_professional").html(template("tmpl_invoice_info_professional",{}))

            handler.invoice._initQiniuImg("busLicense",pane);
            handler.invoice._initQiniuImg("taxCard",pane);
            handler.invoice._initQiniuImg("taxpayerIdentify",pane);
        }
    },
    showAddInfo:function(data,src){
        var pane=$("#right_pane");
        DS.getView('index/invoice/invoice_info_add',function(view){
            view=view.replace(/_#.*#_/g,'');
            var p=pane.find('#invoice_modal');
            p.find(".modal-dialog").width(800);
            p.find(".modal-body").html(view);
            p.find(".modal-title").html('添加发票信息');
            p.find(".ds_form_action").attr({ds_action:'invoice.addInfo',ds_form:'#frm_invoice_info_update'});
            p.modal();
        })
    },
    addInfo:function(data,src){
        //console.dir(data);
        var invoiceType=data.invoiceType;
        if(invoiceType =='professional' && (!data.busLicense || !data.taxCard || !data.taxpayerIdentify)){
            $().alertmessage('showError', "有未上传的图片!");
            return;
        }
        var action={
            action:'app.invoice.addInfo',
            data:data
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                handler.invoice.queryInfoList();
                pane.find('#invoice_modal').modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    viewProfessional:function(id,src){
        var action={
            action:'app.invoice.getInfoById',
            data:{_id:id}
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                DS.getView('index/invoice/invoice_info_professional',function(view){
                    var render=template.compile(view);
                    var p=pane.find('#invoice_modal_view');
                    p.find(".modal-dialog").width(800);
                    p.find(".modal-body").html(render(row));
                    p.find(".modal-title").html('查看发票信息');
                    //p.find(".ds_form_action").attr({ds_action:'',ds_form:''}).hide();
                    p.modal();
                })
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    showUpdateInfo:function(id,src){
        var action={
            action:'app.invoice.getInfoById',
            data:{_id:id}
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                var customerType=row.customerType;
                var invoiceType=row.invoiceType;
                DS.getView('index/invoice/invoice_info_add',function(view){
                    view=DS.renderMethodViewNew(view,row);
                    var p=pane.find('#invoice_modal');
                    p.find(".modal-dialog").width(800);
                    p.find(".modal-body").html(view);
                    if(row.isDefault){
                        p.find("input[name='isDefault']").prop("checked",true);
                    }
                    if(customerType!='person'){
                        p.find("input[value='company']").click();
                        p.find("input[name='invoiceTitle']").val(row.invoiceTitle);
                    }

                    p.find(".modal-title").html('修改发票信息');
                    p.find(".ds_form_action").attr({ds_action:'invoice.updateInfo',ds_form:'#frm_invoice_info_update'});
                    pane.find('#invoice_modal').modal();
                })
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    updateInfo:function(data,src){
        var action={
            action:'app.invoice.updateInfo',
            data:data
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                handler.invoice.queryInfoList();
                pane.find('#invoice_modal').modal('hide');
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    setDefaultInfo:function(id,src){
        var action={
            action:'app.invoice.updateInfoDefault',
            data:{_id:id}
        }
        DS.send(action,function(rep){
            if(rep.success){
                handler.invoice.queryInfoList();
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    delInfo:function(data,src){
        if(!confirm("确认要删除该地址吗？"))return;
        var action={
            action:'app.invoice.delInfo',
            data:{_id:data}
        }
        DS.send(action,function(rep){
            if(rep.success){
                $().alertmessage('showSuccess', "删除成功");
                handler.invoice.queryInfoList();
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },
    //////////////////invoice list////////////////////
    showInvoiceMain:function(data,src){
        var pane=$("#right_pane");
        handler.invoice.currentTab='invoice';
        var url='index/invoice/invoice_list';
        DS.getView(url, function (view) {
            pane.find('#account_invoice_tab_content').html(view);
            handler.invoice.queryInvoiceList();
        });
    },
    queryInvoiceList:function(data,src){
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.invoice.pageSize;
        var frmId='frm_invoice_query_search';
        var pane=$("#account_invoice_tab_content");
        var action={
            action:"app.invoice.queryInvoiceList",
            data:data
        }
        DS.send(action,function(rep){
            if(rep.success){
                var list=rep.list||[];
                var count=rep.count;
                if (list.length > 0){
                    DS.getView('index/invoice/invoice_item',function (view) {
                        var html = [];
                        for (var i = 0, len = list.length; i < len; i++) {
                            var row = list[i];
                            html.push(DS.renderMethodViewNew(view, row));
                        }
                        pane.find('.content_list').html(html.join(''));
                    });
                } else {
                    var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                    pane.find('.content_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId, count, data.limit, data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        })
    },
    viewInvoice:function(id,src){
        var action={
            action:'app.invoice.getInvoiceById',
            data:{_id:id}
        }
        var pane=$("#right_pane");
        DS.send(action,function(rep){
            if(rep.success){
                var row=rep.row;
                var list=row.payList;
                if(!row.memo){
                    row.memo="";
                }
                if(!row.reason){
                    row.reason="";
                }
                var status=row.status;
                DS.getView('index/invoice/invoice_detail',function(view){
                    view=DS.renderMethodViewNew(view, row);
                    var p=pane.find('#invoice_modal_view');
                    p.find(".modal-body").html(view);
                    if(status=='cancel'){
                        p.find(".invoice_reason").show();
                    }

                    if (list.length > 0){
                        DS.getView('index/invoice/invoice_pay_item',function (view) {
                            var html = [];
                            for (var i = 0, len = list.length; i < len; i++) {
                                var item = list[i];
                                if(!item.memo)item.memo="";
                                html.push(DS.renderMethodViewNew(view, item));
                            }
                            pane.find('.invoice_pay_list .content_list').html(html.join(''));
                        });
                    } else {
                        var html='<tr><td class="text-center" colspan="10">没有记录!</td></tr>'
                        pane.find('.content_list').html(html);
                    }

                    p.find(".modal-dialog").width(800);
                    p.find(".modal-title").html('查看开票明细');
                    p.modal();
                })
            }else{
                $().alertmessage('showError', rep.message||errMsg);
            }
        })
    },


    showFieldDesc:function(type,val){
        var desc='';
        if(type=='addrDefault'){
            if(val){
                desc='<span style="font-weight: bold;">默认地址</span>';
            }
        }else if(type=='infoDefault'){
            if(val){
                desc='<span style="font-weight: bold;">默认发票</span>';
            }
        }else if(type=='customerType'){
            if(val=='person'){
                desc='个人';
            }else if(val=='company'){
                desc='企业';
            }
        }else if(type=='invoiceType'){
            if(val=='normal'){
                desc='增值税普通发票';
            }else if(val=='professional'){
                desc='增值税专用发票';
            }
        }else if(type=='invoiceStatus'){
            if(val=='undeal'){
                desc='<span class="text-warning">处理中</span>';
            }else if(val=='deal'){
                desc='<span class="text-success">已开发票</span>';
            }else if(val=='cancel'){
                desc='<span class="text-danger">已取消</span>';
            }
        }else if(type=='invoicePayStatus'){
            if(val=='dealing'){
                desc='<span class="text-warning">处理中</span>';
            }else if(val=='deal'){
                desc='<span class="text-success">已开发票</span>';
            }else if(val=='overdue'){
                desc='<span class="text-danger">过期</span>';
            }else if(val=='invalid'){
                desc='<span class="text-danger">无效充值</span>';
            }else{
                desc='<span class="">待处理</span>';
            }
        }
        return desc;
    },
    _initQiniuImg:function(key,pane){
        var containerId= key+'-container-qiniu';
        var progressId= key+'-fsUploadProgress';
        var btnId= key+'-pickfiles';
        //console.info("containerId==="+containerId);
        pane=pane.find("."+key+"-upload-container");
        var uploader = Qiniu.uploader({
            runtimes: 'flash,html4',
            browse_button: btnId,
            multi_selection:false,
            container:containerId,
            drop_element: containerId,
            max_file_size: '2mb',
            flash_swf_url: '/javascripts/qiniu/plupload/Moxie.swf',
            dragdrop: true,
            chunk_size: '4mb',
            uptoken_url: '/action?action=app.qiniu.getUptoken&data={}&sessionId=' + session.id,
            domain: qiniu7moorDomain,
            // downtoken_url: '/downtoken',
            unique_names: false,
            save_key: false,
            auto_start: true,
            filters: {
                mime_types : [
                    { title : "Image files", extensions : "jpg,jpeg,gif,png" }
                ]
            },
            init: {
                'FilesAdded': function(up, files) {
                    pane.find(".img_container").show();
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
//                    $().alertmessage('showSuccess', "图片上传成功");
                    pane.find(".img_container").hide();
                },
                'FileUploaded': function(up, file, info) {
                    var progress = new FileProgress(file, progressId);
                    progress.setComplete(up, info,"invoice");
                    //console.info("FileUploaded=========");
                    //console.dir(file)
                    //console.dir(info)
                    var domain = up.getOption('domain');
                    var res = $.parseJSON(info);
                    var url = domain + res.key; //获取上传成功后的文件的Url
                    //console.info("sourceLink========="+url);
                    var _c=pane.find(".thumbnails");
                    var _param={key:res.key,url:url,field:key};
                    _c.html(template("tmpl_invoice_img",_param));
                },
                'Error': function(up, err, errTip) {
//                    $('table').show();
                    pane.find(".img_container").show();
                    var progress = new FileProgress(err.file, progressId);
                    progress.setError();
                    progress.setStatus(errTip);
                },
                'Key': function(up, file) {
                    var date=DS.getCurrentDate();
                    var today = new Date();
                    var time=today.getTime();
                    //var fileName=file.name;
//                    var fileName=encodeURIComponent(file.name);
                    var key = session.account._id+"/invoice/"+date+"/"+time+"/"+uuid.v1();
                    //console.info("Key2========="+key);
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
    }




}