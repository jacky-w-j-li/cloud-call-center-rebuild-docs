handler.custFee = {
    pageSize : 10,
    currList : null,
    /**
     * 获取并渲染扣费设置列表
     *
     * @param data
     * @param src
     */
    getCustFeeList: function(data,src){
        data = data || {};
        if(src){
            data.page = src.attr('value') || 1;
        }else{
            data.page = 1;
        }
        data.limit = handler.custFee.pageSize;
        var frmId = 'frm_cust_fee_info';
        var pane = $("#right_pane");
        var action={
            action: 'app.custFee.getCustFeeList',
            data: data,
        }

        DS.send(action, function(rep){
            if(rep.success) {
                var list = rep.list;
                handler.custFee.currList = list;

                var count = rep.count;

                if (list.length > 0) {
                    var tmpl = '<tr><td>_#name#_</td><td>_@custFee.getStateDesc("_#state#_")@_</td><td>_@custFee.transTime("_#pricePeriod#_","_#beginTime#_")@_</td><td>_@custFee.transTime("_#pricePeriod#_","_#endTime#_")@_</td><td>_#createTime#_</td><td>_@custFee.getAutoRenewDesc(_#autoRenew#_)@_</td><td>_#deal#_</td></tr>';

                    var html = [];
                    list.forEach(function (item) {
                        var id = item.id;

                        item.beginTime = item.beginTime || '';
                        item.endTime = item.endTime || '';

                        var deal = '';
                        if (!item.autoRenew) {
                            deal += '<a href="#" class="ds_do_action" ds_action="custFee.showRenew" ds_data="' + id + '">续费</a>';
                        } else {
                            if(item.state == 'stop'){
                                deal += '<a href="#" class="ds_do_action" ds_action="custFee.startAutoRenew" ds_data="' + id + '">启动自动续费</a>';
                            }
                        }

                        item.deal = deal;
                        html.push(DS.renderMethodViewNew(tmpl, item));
                    });
                    pane.find('.custFee_list').html(html);
                } else {
                    var html = '<tr><td class="text-center" colspan="10">没有记录!</td></tr>';
                    pane.find('.custFee_list').html(html);
                }
                pane.find('.result_count').text(count);
                DS.updatePagination(frmId,count,data.limit,data.page);
            }else{
                $().alertmessage('showError', errMsg);
            }
        });
    },
    /**
     * 弹出续费框
     *
     * @param id
     * @param src
     */
    showRenew: function(id,src){
        var p = $("#service_modal");
        var custFee = handler.custFee.getCurrCustFee(id);

        //不正常
        if(!custFee){
            return;
        }
        custFee = $.extend(true, {}, custFee);
        var overdraw=session.account.overdraw||0;
        var total=session.account.balance+overdraw;
        custFee.balance=handler.formatTrueFee(total);
        custFee.overdraw=handler.formatTrueFee(overdraw);
        custFee.actualBalance=handler.formatTrueFee(session.account.balance);

        DS.getView('custFee/custFee_renew',function(view) {
            view = DS.renderMethodViewNew(view, custFee);
            p.find(".modal-dialog").width(800);
            p.find(".modal-body").html(view);
            p.find(".modal-title").html('自定义扣费-续费');

            var refreshTotalFee = function () {
                var form = p.find('#form_custFee_update');
                var formData = DS.util.getDataOfForm(form);
                if (!formData.succeed) {
                    return;
                }

                var totalFee = handler.formatRoundMoney(formData.data.duration * custFee.price / 10000);
                p.find('.fee').text(totalFee);
            };

            p.find('.ds_spinner_custFee').spinner({
                spin: function (event, ui) {
                    if (ui.value < 1) {
                        $(this).spinner('value', 1);
                        return false;
                    }
                },
                stop: function () {
                    refreshTotalFee();
                }
            }).keyup(function () {
                refreshTotalFee();
            });

            refreshTotalFee();

            p.modal();

        });

    },
    /**
     * 点击确认付款
     *
     * @param data
     * @param src
     * @returns {boolean}
     */
    confirmPay:function(data,src){
        if(src.hasClass("disabled")) return false;

        var custFee = handler.custFee.getCurrCustFee(data.custFeeId);
        var totalFee = handler.formatTrueFee(data.duration * custFee.price);

        var balance=parseFloat(data.balance);
        if(balance<0){
            $().alertmessage('showError', "您的账户已欠费，请先充值");
            return;
        }else if(balance < totalFee){
            $().alertmessage('showError', "余额不足，请先充值");
            return;
        }

        src.addClass("disabled");

        //data.product = 'custFee';
        handler.custFee.balancePay(data,src);
    },
    /**
     * 启动自动续费
     *
     * @param data
     * @param src
     */
    startAutoRenew: function(custFeeId,src){
        if(!confirm('启动自动续费将自动计算费用直到余额不足，确认启动吗？'))return;

        var action={
            action:'app.pay.startAutoRenew',
            data:{custFeeId:custFeeId}
        };
        DS.send(action,function(rep){
            if(rep.success){
                handler.custFee.finishPay();
            }else{
                if(rep.code=='404'){
                    $().alertmessage('showError', handler.account.msg1);
                }else{
                    console.dir(rep)
                    $().alertmessage('showError', rep.message||'启动异常');
                }
            }
            src.removeClass("disabled");
        });
    },
    /**
     * 付费
     *
     * @param data
     * @param src
     */
    balancePay:function(data,src){
        var action={
            action:'app.pay.custFeeBalancePay',
            data:data
        };
        DS.send(action,function(rep){
            if(rep.success){
                handler.custFee.finishPay();
            }else{
                if(rep.code=='404'){
                    $().alertmessage('showError', handler.account.msg1);
                }else{
                    $().alertmessage('showError', rep.message||'支付异常');
                }
            }
            src.removeClass("disabled");
        });
    },
    finishPay: function(){
        var aid=session.account._id;
        var action={
            action:'app.account.getAccountInfoById',
            data:aid
        };

        DS.send(action,function(rep){
            if(rep.success){
                session.account.balance=rep.row.balance;
                session.account.overdraw=rep.row.overdraw||0;
                var acc=session.account;
                var price=handler.formatRound2Money(acc.balance);
                $(".user-header").find('.uc_balance').text(price);
                handler.custFee.getCustFeeList();
                $("#service_modal").modal('hide');
            }else{
                $().alertmessage('showError', errMsg);
            }
        });

    },
    /**
     * 获取当前编辑的扣费
     *
     * @param id
     * @returns {*}
     */
    getCurrCustFee: function(id){
        var custFee = this.currList.find(function(item){
            if(item.id == id){
                return true;
            }
            return false;
        });

        return custFee;
    },
    /**
     * 状态字段展示
     * @param state
     */
    getStateDesc: function(state){
        return getGeneralDicName('custFeeState',state);
    },
    getPricePeriodDesc: function(pricePeriod){
        return getGeneralDicName('custFeePricePeriod',pricePeriod);
    },
    /**
     * 起始时间 到期时间 展示 : 小时原样显示,其他显示到日期
     * @param pricePeriod
     * @param time
     */
    transTime: function(pricePeriod,time){
        if(!time || time == ''){
            return '';
        }
        if(pricePeriod == 'hour'){
            return time;
        }

        return time.slice(0,10);
    },
    /**
     * 是否自动扣费 展示
     *
     * @param autoRenew
     * @returns {string}
     */
    getAutoRenewDesc: function(autoRenew){
        return autoRenew ? '是':'否';
    }

}
