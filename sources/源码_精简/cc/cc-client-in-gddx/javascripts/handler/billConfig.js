handler.billConfig = {
    billList: function () {
        handler.billConfig.getAccountBill({query: ''}, $(""));
    },
    getAccountBill: function (data, src) {
        data.page = src.val() || 1;
        data.limit = handler.account.queryPageSize;
        var action = {
            action: 'bill.getAccountBill',
            data: data
        };
        $('#bill_list_pane').empty();
        DS.send(action, function (response) {
            var list = response.list;
            var count = response.count;
            if (response.success) {
                DS.getView('billConfig/billList_item', function (view) {
                    if (view) {
                        var html = '';
                        for (var i = 0; i < list.length; i++) {
                            console.log(list[i]);
                            list[i].bill.borrowBalance = list[i].bill.borrowBalance || 0;
                            list[i].bill.billType = list[i].bill.billType || 'min';
                            html += DS.renderView(view, list[i], '');
                        }
                        $('#bill_list_pane').append(html);
                        DS.updatePagination("query_account_bill_form", count, data.limit, data.page);
                    }
                });
            }
        });
    },
    setAccountBalance: function (data, src) {
        var action = {
            action: 'bill.setAccountBalance',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                src.parents('#bill_set_account_balance' + data._id).modal('hide');
                handler.refreshTableData("query_account_bill_form");
            } else {
                alert('操作失败：' + response.message);
            }
        });
    },
    setAccountFee: function (data, src) {
        var action = {
            action: 'bill.setAccountFee',
            data: data
        };
        DS.send(action, function (response) {
            console.dir(response);
            if (response.success) {
                src.parents('#bill_set_account_fee' + data._id).modal('hide');
                handler.refreshTableData("query_account_bill_form");
            } else {
                alert('操作失败：' + response.message);
            }
        });
    },
    setAccountRepaymentBalance : function(data,src){
        var action = {
            action: 'bill.setAccountRepaymentBalance',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                src.parents('#bill_set_repayment_balance' + data._id).modal('hide');
                handler.refreshTableData("query_account_bill_form");
            } else {
                alert('操作失败：' + response.message);
            }
        });
    },
    setAccountBorrowBalance : function(data,src){
        var action = {
            action: 'bill.setAccountBorrowBalance',
            data: data
        };
        DS.send(action, function (response) {
            if (response.success) {
                src.parents('#bill_set_borrow_balance' + data._id).modal('hide');
                handler.refreshTableData("query_account_bill_form");
            } else {
                alert('操作失败：' + response.message);
            }
        });
    }

}