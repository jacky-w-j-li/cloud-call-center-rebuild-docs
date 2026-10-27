handler.config.customerApproval = {
    pageSize:10,
    cust_approval_config : function (menu){
        //var container=$("#view_customer_approval_approvalManager");
        handler.config.customerApproval.queryCustApprovalList();
    },
    queryCustApprovalList: function (data, src) {
        data=data||{};
        if(src){
            data.page = src.attr("value") || 1;
        }else{
            data.page = 1;
        }
        data.limit=handler.config.dept.pageSize;
        var action = {
            action: 'config.customerApproval.queryCustApprovalList',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                var custApproval = response.list;
                var container = $("#view_customer_approval_approvalManager");
                if(custApproval.length > 0){
                    var html = [];
                    DS.getView('config/customerApproval/customer_approval_item', function (view) {
                        for (var i = 0; i < custApproval.length; i++) {
                            var approval = custApproval[i];
                            approval.role = showOptionDesc("roles",approval.role);
                            html.push(DS.renderMethodViewNew(view,approval));
                        }
                        container.find('#cust_approval_list_pane').html(html.join(""));
                    });
                } else {
                    var html='<tr style="text-align: center;"><td colspan="8">未找到审批项!</td></tr>';
                    container.find('#cust_approval_list_pane').html(html);
                }
                DS.updatePagination("frm_customer_approval_search", response.count, handler.config.dept.pageSize, data.page);
            }else{
                $().alertmessage('showError', response.message);
            }
        });
    },
    showCustAoorovalUpdate : function (data,src){
        var container=$("#view_customer_approval_approvalManager");
        $(src).closest("tr").addClass("active").siblings().removeClass("active");
        var openView = 'config/customerApproval/cust_approval_update';
        var pram = data.split(",");
        DS.getView(openView, function (view) {
            var pane = container.find("#cust_approval_detail_pane");
            pane.html(view);
            var action = {
                action: 'config.customerApproval.getCustApprovalById',
                data:pram[0]
            };
            DS.send(action, function (response) {
                if (response.success) {
                    var custApproval = response.custApproval;
                    handler.config.customerApproval._initCustApprovalInfo(pane,custApproval);
                }else{
                    $().alertmessage('showError', errMsg);
                }
            });
        });
    },
    _initCustApprovalInfo : function (pane,custApproval){
        pane.find("#frm_cust_approval_update").find("input[name=_id]").val(custApproval._id);
        pane.find("#frm_cust_approval_update").find("input[name=name]").val(custApproval.name);
        if(custApproval.type == "2") $("#updateTitle").html("修改无效审核模板");
        if(custApproval.type == "3") $("#updateTitle").html("修改成单审核模板");
        if(custApproval.type == "4") $("#updateTitle").html("修改丢单审核模板");
        if(custApproval.type == "8") $("#updateTitle").html("修改续费审核模板");
        $("#updateTitle")
        var  swapOption=function(src, det) {
            var _src = src.find("option:selected");
            _src.appendTo(det);
        }
        var s1=pane.find(".left_role");
        var s2=pane.find(".right_role");
        var b1=pane.find(".left_middle");
        var b2=pane.find(".right_middle");
        s1.dblclick(function() {
            swapOption(s1, s2);
        });
        s2.dblclick(function() {
            swapOption(s2, s1);
        });
        b1.click(function() {
            swapOption(s1, s2);
        });
        b2.click(function() {
            swapOption(s2, s1);
        });
        var html=getDicOptions("roles",null,"no",custApproval.role);
        pane.find(".left_role").html(html);
        html=getDicOptions("roles",null,"no",custApproval.role,true);
        pane.find(".right_role").html(html);

    },
    updateCustApproval : function (data,src){
        var action = {
            action: "config.customerApproval.updateCustApproval",
            data: {
                _id:data._id,
                role:data.selectRoles||[]
            }
        };
        DS.send(action, function (response) {
            if (response.success) {
                handler.config.customerApproval.queryCustApprovalList();
                src.closest(".right_content_pane").empty();
                $().alertmessage('showSuccess', "修改成功");
            }else{
                $().alertmessage('showError', errMsg);
            }
        });

    }
}

function showOptionDesc(type,dics){
    var ary=getCache(type);
    if(!ary || ary.length==0) return '';
    var newAry=[];
    if(dics && dics.length>0){
        for (var i=0;i<ary.length;i++) {
            var obj=ary[i];
            if($.inArray(obj._id,dics)!=-1){
                newAry.push(obj.display_name);
            }
        }
        return newAry.join(",");
    }else{
        return '';
    }
}