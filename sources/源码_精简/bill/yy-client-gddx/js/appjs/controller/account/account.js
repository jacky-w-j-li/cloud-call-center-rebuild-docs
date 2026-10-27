Ext.define('App.controller.account.account', {
    extend: 'Ext.app.Controller',
    views: [],
    models: [],
    initFlag: false,
    countTimer: 0,
    timerHandler: null,
    refs: [
        {
            ref: 'smsSignWin',
            selector: 'smsSignWin'
        },
        {
            ref: 'smsEditWin',
            selector: 'smsEditWin'
        },
        {
            ref: 'smsSignGrid',
            selector: 'smsSignWin >  grid[class="smsSign"]'
        },
        {
            ref: 'smsTempleteGrid',
            selector: 'smsSignWin >  grid[class="smsTemplete"]'
        },
        {
            ref: 'smsEditGrid',
            selector: 'smsEditWin > grid[class="query"]'
        },
        {
            ref: 'addSmsSignWindow',
            selector: 'addSmsSignWindow'
        },
        {
            ref : 'addSmsTempleteWindow',
            selector : 'addSmsTempleteWindow'
        },
        {
            ref: 'addSmsEditWindow',
            selector: 'addSmsEditWindow'
        },
        {
            ref: 'updateSmsSignWindow',
            selector: 'updateSmsSignWindow'
        },
        {
            ref: 'setSmsChannelWindow',
            selector: 'setSmsChannelWindow'
        },
        {
            ref: 'setMoreSnWindow',
            selector: 'setMoreSnWindow'
        },


        {
            ref: 'accountQueryPanel',
            selector: 'accountQueryPanel'
        },
        {
            ref: 'addNewAccountWindow',
            selector: 'addNewAccountWindow'
        },
        {
            ref: 'stopAccountWindow',
            selector: 'stopAccountWindow'
        },
        {
            ref: 'updateAccountInfoWindow',
            selector: 'updateAccountInfoWindow'
        },
        {
            ref: 'queryGrid',
            selector: 'accountQueryPanel > grid[class="query"]'
        },
        {
            ref: 'findCostRecordWin',
            selector: 'findCostRecordWin'
        },
        {
            ref: 'accountSetWin',
            selector: 'accountSetWin'
        },
        {
            ref: 'sn400ManageGrid',
            selector: 'serviceno400QueryPanel > grid[class="query"]'
        },
        {
            ref: 'accSnQueryPanel',
            selector: 'accSnQueryPanel'
        },
        {
            ref: 'snManageGrid',
            selector: 'accSnQueryPanel > grid[class="query"]'
        },
//        {
//            ref: 'addServiceNoWin',
//            selector: 'addServiceNoWin'
//        },
//        {
//            ref: 'addSnGrid',
//            selector: 'addServiceNoWin panel > grid[class="query"]'
//        },
        {
            ref: 'setServiceNoWin',
            selector: 'setServiceNoWin'
        },
        {
            ref: 'askGatewaySipWin',
            selector: 'askGatewaySipWin'
        },
//        {
//            ref: 'buyServiceNoWin',
//            selector: 'buyServiceNoWin'
//        },
//        {
//            ref: 'renewServiceNoWin',
//            selector: 'renewServiceNoWin'
//        },
//        {
//            ref: 'setServiceNo2HpWin',
//            selector: 'setServiceNo2HpWin'
//        },
        {
            ref: 'productManagerWin',
            selector: 'productManagerWin'
        },
        {
            ref: 'accountProductSetWin',
            selector: 'accountProductSetWin'
        },
        {
            ref: 'pay2AccByProxyWin',
            selector: 'pay2AccByProxyWin'
        },
        {
            ref: 'businessTagManager',
            selector: 'businessTagManager'
        },
        {
            ref: 'openProductGrid',
            selector: 'productManagerWin  grid#account_product_grid'
        },
        {
            ref:'openedCustFeeGrid',
            selector:'grid#opened_product_cust_fee_grid'
        },
        {
            ref: 'openNewCustFeeGrid',
            selector: 'grid#open_product_cust_fee_grid'
        },
        {
            ref:'openedIntlFeeGrid',
            selector:'grid#opened_product_intl_fee_grid'
        },
        {
            ref: 'openNewIntlFeeGrid',
            selector: 'grid#open_product_intl_fee_grid'
        },
        {
            ref:'openedIntlLine',
            selector:'combobox#opened_product_intl_fee_line'
        },
        {
            ref: 'openNewIntlLine',
            selector: 'combobox#open_product_intl_fee_line'
        },
        {
            ref:'openedIntlAllowOther',
            selector:'checkbox#opened_product_intl_allow_other'
        },
        {
            ref: 'openNewIntlAllowOther',
            selector: 'checkbox#open_product_intl_allow_other'
        },
        {
            ref:'openedIntlOtherPrice',
            selector:'numberfield#opened_product_intl_other_price'
        },
        {
            ref: 'openNewIntlOtherPrice',
            selector: 'numberfield#open_product_intl_other_price'
        },
        {
            ref: 'openedIntlIsOpenIntl',
            selector: 'checkbox#opened_product_intl_is_open_intl'
        },
        {
            ref: 'openNewIntlIsOpenIntl',
            selector: 'checkbox#open_product_intl_is_open_intl'
        },
        {
            ref: 'openedProductIntlCidSet',
            selector: 'fieldset#opened_product_intl_cid_set'
        },
        {
            ref: 'openedProductIntlComboAddCid',
            selector: 'combobox#opened_product_intl_combo_add_cid'
        }
    ],
    init: function () {
        this.control({
                'accountQueryPanel >  button#smsSign_tool': {
                    click: this.showSmsSign
                },
                'accountQueryPanel >  button#smsEdit_tool': {
                    click: this.showSmsEdit
                },
                'smsSignWin >  button#btn_show_add_sms_sign': {
                    click: this.showAddSmsSign
                },
                'smsEditWin >  button#btn_show_add_sms_edit': {
                    click: this.showAddSmsEdit
                },
                'smsSignWin >  button#btn_show_add_sms_templete': {
                    click: this.showAddSmsTemplete
                },
                'addSmsSignWindow >  button#btn_add_sms_sign': {
                    click: this.addSmsSign
                },
                'addSmsTempleteWindow >  button#btn_add_sms_templete':{
                    click: this.addSmsTemplete
                },'addSmsTempleteWindow >  fieldcontainer#test':{
                    click: this.showRadioClick},
                'addSmsEditWindow >  button#btn_add_sms_edit': {
                    click: this.addSmsEdit
                },
                'smsSignWin >  button#btn_show_update_sms_sign': {
                    click: this.showUpdateSmsSign
                },
                'smsSignWin >  button#btn_show_update_sms_templete': {
                    click: this.showUpdateSmsTemplete
                },
                'smsEditWin >  button#btn_show_update_sms_edit': {
                    click: this.showUpdateSmsEdit
                },
                'updateSmsSignWindow  button#btn_update_sms_sign':{
                    click: this.updateSmsSign
                },
                'updateSmsTempleteWindow  button#btn_update_sms_templete':{
                    click: this.updateSmsTemplete
                },
                'updateSmsEditWindow  button#btn_update_sms_edit':{
                    click: this.updateSmsEdit
                },
                'smsSignWin >  button#btn_delete_sms_templete': {
                    click: this.deleteSmsTemplete
                },
                'smsSignWin >  button#btn_delete_sms_sign': {
                    click: this.deleteSmsSign
                },
                'smsEditWin >  button#btn_delete_sms_edit': {
                    click: this.deleteSmsEdit
                },
                'smsSignWin >  grid#account_smsSign_query_grid' :{
                    selectionchange: this.enableSmsSignDockItems
                },
                'smsSignWin >  grid#account_smsTemplete_query_grid' :{
                    selectionchange: this.enableSmsTempleteDockItems
                },
                'smsEditWin > grid#account_smsEdit_query_grid' :{
                    selectionchange: this.enableSmsEditDockItems
                },
                'accountQueryPanel >  button#addTryAccount_tool': {
                    click: this.showAddAccount
                },
                'accountQueryPanel >  button#addGatewaySip_tool': {
                    click: this.showAddGatewaySip
                },
                'addGatewaySip >  button[class="submit"]': {
                    click: this.addGatewaySip
                },
                'accountQueryPanel >  button#accountInfo_tool': {
                    click: this.showAccountInfo
                },
                'accountQueryPanel >  button#accountSet_tool': {
                    click: this.showAccountSet
                },
                'accountQueryPanel >  button#accountFind_tool': {
                    click: this.showAccountFind
                },
                'accountQueryPanel >  button#product_tool': {
                    click: this.showProduct
                },
                'accountQueryPanel >  button#businessTag_tool': {
                    click: this.showBusinessTag
                },
                'accountQueryPanel >  button#redirect_ucenter': {
                    click: this.showUcenter
                },
                'accountQueryPanel >  button#redirect_cc': {
                    click: this.showCC
                },
                'accountQueryPanel >  button#redirect_cc_in': {
                    click: this.showCCIn
                },
                'accountQueryPanel >  button#redirect_cc_out': {
                    click: this.showCCOut
                },
                'accountQueryPanel >  button#accountStop_tool': {
                    click: this.showStopInfo
                },
                'accountQueryPanel >  button#accountReopen_tool': {
                    click: this.reopen
                },
                'accountQueryPanel >  button#askGatewaySip_tool': {
                    click: this.askGwSip
                },
                'accountQueryPanel >  button#accountPay_tool': {
                    click: this.showPay2AccByProxy
                },
                'accountQueryPanel >  button#accountDeduction_tool': {
                    click: this.showDeductionFee
                },
                'accountQueryPanel >  button#borrow_tool': {
                    click: this.showBorrowAccount
                },
                'borrowAccountWin >  button[class="submit"]': {
                    click: this.borrowAccount
                },
                'turnBalanceWin >  button[class="submit"]' : {
                    click: this.turnBalance
                },
                'borrowAccountWin >  #borrow_account_name': {
                    change : this.findCompanyNameByAccountName
                },
                'accountQueryPanel >  button#bind_finance_account': {
                    click: this.showBindFinanceAccount
                },
                'accountQueryPanel >  button#unbind_finance_account': {
                    click: this.unBindFinanceAccount
                },
                'bindFinanceAccountWin >  button[class="submit"]': {
                    click: this.bindFinanceAccount
                },
                'bindFinanceAccountWin >  #finance_account_name': {
                    change : this.findCompanyNameByFinanceAccountName
                },
                'accountQueryPanel >  button#refund_tool': {
                    click: this.showBalanceRefund
                },
                'accountQueryPanel >  button#supplementDectuct_minConsume_tool': {
                    click: this.deductCCMinConsume
                },
                'accountQueryPanel >  button#revocation_minConsume_tool': {
                    click: this.backoutCCMinConsume
                },
                'accountQueryPanel >  button#account_turnBalance_tool' : {
                    click: this.showTurnBalance
                },
                'productManagerWin >  button#account_call_sum_tool' : {
                    click: this.showCallSum
                },
                'productManagerWin >  button#open_call_sum_tool' : {
                    click: this.openCallSum
                },
                'productManagerWin >  button#open_account_call_sum_tool' : {
                    click: this.openAccountCallSum
                },
                'balanceRefundWin >  button[class="submit"]': {
                    click: this.balanceRefund
                },
                'supplementDeductionMinConsumeWin >  button[class="submit"]': {
                    click: this.supplementDeductionMinConsume
                },
                'revocationMinConsumeWin >  button[class="submit"]': {
                    click: this.revocationMinConsume
                },
                'pay2AccByProxyWin >  button[class="submit"]': {
                    click: this.pay2AccByProxy
                },
                'pay2AccByUserWin >  button[class="submit"]': {
                    click: this.pay2AccByUser
                },
                'deductionFeeWin >  button[class="submit"]': {
                    click: this.deductionFeeByUser
                },
                'callSumWin >  button[class="submit"]':{
                    click: this.updateAccountSetCallSum
                },
                'singleCallSumWin >  button[class="submit"]':{
                    click: this.openSingleCallSum
                },
                'updateAccountInfoWindow >  button#update_account_button': {
                    click: this.updateAccountInfo
                },
                'addNewAccountWindow >  button#create_new_account_button': {
                    click: this.addNewAccount
                },
                'stopAccountWindow >  button#btn_stop_account': {
                    click: this.stopAccount
                },
                'accountSetWin >  button#over_confirm_button': {
                    click: this.saveOverdrawConfig
                },
                'accountSetWin >  button#viewlog_price_button': {
                    click: this.showPriceLog
                },
                'accountSetWin >  button#alert_confirm_button': {
                    click: this.saveAlertConfig
                },
                'accountSetWin >  button#viewlog_alert_button': {
                    click: this.showAlertLog
                },
                'accountQueryPanel > grid[class="query"]': {
                    selectionchange: this.enableDockItems,
                    itemdblclick: this.showAccountFind,
                   // itemclick:this.findAccountPbx
                },
                'accountQueryPanel >  button#costRecord_tool': {
                    click: this.showAccountCost
                },
//                'accountSetWin >  panel#account_overdraw__panel': {
//                    beforeactivate: this.showAccountOverDrawView
//                },
                'accountSetWin >  panel#account_serviceno_config_panel_new': {
                    beforeactivate: this.showServiceNoView
                },
                'accountSetWin >  panel#account_400_config_panel': {
                    beforeactivate: this.show400ServiceNoView
                },
                'accountSetWin >  button#IDD_config_button':{
                    click : this.configAccountIDD
                },
                'accountSetWin >  button#btn_save_invoice_set':{
                    click : this.setAccountInvoice
                },
//            this.getAccountOverdrawItems()
//                'accSnQueryPanel >  button#serviceno_add_new_tool': {
//                    click: this.showAddServiceNo
//                },
                'accSnQueryPanel >  button#btn_serviceno_set_monthRent': {
                    click: this.showSetServiceNo
                },
                'serviceno400QueryPanel >  button#btn_400_set_tool': {
                    click: this.showSet400ServiceNo
                },


//                'accSnQueryPanel >  button#serviceno_pay_tool': {
//                    click: this.showPayServiceNo
//                },

                'serviceno400QueryPanel > grid[class="query"]': {
                    selectionchange: this.enableSet400SNDockItems,
                    itemdblclick: this.showSet400ServiceNo
                },

                'accSnQueryPanel > grid[class="query"]': {
                    selectionchange: this.enableSetSNDockItems,
                    itemdblclick: this.showSetServiceNo
                },

                'setSnPriceWindow >  button#btn_set_sn_price': {
                    click: this.setServiceNumPrice
                },
                'set400SnPriceWindow >  button#btn_set_400sn_price': {
                    click: this.set400ServiceNumPrice
                },

//                'addServiceNoWin >  button#serviceno_select_button': {
//                    click: this.addServiceNo
//                },
//                'addServiceNoWin panel > grid[class="query"]': {
//                    selectionchange: this.enableAddSn,
//                    itemdblclick: this.addServiceNo
//                },
//                'setServiceNoWin  button#setServiceNo_button': {
//                    click: this.setSnMonthRent
//                },
//                'setServiceNoWin  button#reselect_ServiceNo_button': {
//                    click: this.reselectServiceNo
//                },
//                'setServiceNoWin >  button#viewlog_sn_button': {
//                    click: this.showSetsnLog
//                },
//                'setServiceNo2HpWin >  button#setServiceNo2Hp_button': {
//                    click: this.setSnLine
//                },
//                'setServiceNo2HpWin >  button#viewlog2Hp_sn_button': {
//                    click: this.showSetLineLog
//                },

                'askGatewaySipWin >  button#ask_gw_confirm_button': {
                    click: this.saveAskGw
                },
                /*'buyServiceNoWin': {
                 afterrender: this.initSnPay,
                 destroy: this.destroySnPay
                 },
                 'buyServiceNoWin  button#sn_buy_button': {
                 click: this.paySn
                 },
                 'renewServiceNoWin >  panel#renew_month_panel': {
                 beforeactivate: this.initRenewMonth
                 },
                 'renewServiceNoWin >  panel#renew_concurrent_panel': {
                 beforeactivate: this.initRenewConcurrent
                 },
                 'renewServiceNoWin >  panel#renew_dialmins_panel': {
                 beforeactivate: this.initRenewDial
                 },
                 'renewServiceNoWin  button#sn_renew_month_button': {
                 click: this.renewSn
                 },
                 'renewServiceNoWin  button#sn_renew_concurrent_button': {
                 click: this.renewSn
                 },
                 'renewServiceNoWin  button#sn_renew_dial_button': {
                 click: this.renewSn
                 },*/
                'productManagerWin >  button#open_new_product' : {
                    click: this.openNewProduct
                },
                'productManagerWin >  button#open_new_cust_fee_product' : {
                    click: this.openNewCustFeeProduct
                },
                'productManagerWin  grid#account_product_grid' :{
                    selectionchange: this.enableProductDockItems,
                    itemdblclick: this.showProductDetail
                },
                'productManagerWin grid#account_product_grid #account_product_set':{
                    click:this.showProductDetail
                },

                'accountProductSetWin  button[class="submit"]':{
                    click: this.updateAccountProduct
                },
                'businessTagManager  button[class="submit"]':{
                    click: this.updateAccountBusinessTag
                },
                'selectCCPbxWindow  button#btn_select_cc_pbx':{
                    click: this.redirectCCByPbx
                },
                'selectCCInPbxWindow  button#btn_select_cc_in_pbx':{
                    click: this.redirectCCInByPbx
                },
                'selectCCOutPbxWindow  button#btn_select_cc_out_pbx':{
                    click: this.redirectCCOutByPbx
                },
                'productManagerWin  grid#account_product_grid #account_product_minConsume_set':{
                    click:this.showProductMinConsumeSet
                },
                'productManagerWin  grid#account_product_grid #account_product_zj_line_set':{
                    click:this.showProductZJLineSet
                },
                'productManagerWin  grid#account_product_grid #account_product_sms_pwd_set':{
                    click:this.showSmsPwdSet
                },
                'productManagerWin  grid#account_product_grid #account_product_sms_dispatch_set':{
                    click:this.showSmsPwdDispatchSet
                },
                'setZJLineWindow  button#saveProductZJLine':{
                    click:this.saveProductZJLineSet
                },
                'setSmsPwdWindow  button#saveProductSmsPwd':{
                    click:this.saveProductSmsPwd
                },
                'setSmsDispatchWindow  button#saveProductSmsDispatch':{
                    click:this.saveProductSmsDispatch
                },
                'setProductMinConsumeWindow  button#btn_save_product_minConsume':{
                    click: this.saveProductMinConsume
                },
                'productManagerWin  grid#account_product_grid #account_product_concurrent_set':{
                    click:this.showProductConcurrent
                },
                'setProductConcurrentWindow  button#btn_save_product_concurrent':{
                    click: this.saveProductConcurrent
                },
                'setProductConcurrentWindow': {
//                    beforeactivate: this.initProductConcurrent
                    beforeshow: this.initProductConcurrent
                },
                'productManagerWin  grid#account_product_grid #account_product_record_set':{
                    click:this.showProductRecordSet
                },
                'setProductRecordWindow  button#btn_save_product_record':{
                    click: this.saveProductRecord
                },
                'setCCRecordWindow  button#btn_save_cc_record':{
                    click: this.saveCCRecord
                },
                'productManagerWin  grid#account_product_grid #account_product_cdr_set':{
                    click:this.showProductCdrSet
                },
                'setCdrDayWindow  button#btn_save_cc_cdr':{
                    click: this.saveProductCdr
                },
                'setCdrDayWindow': {
                    beforeshow: this.initProductCdrParam
                },
                'productManagerWin  grid#account_product_grid #account_product_smsChannel_set':{
                    click:this.showProductSmsChannelSet
                },
                'setSmsChannelWindow  button#saveProductSmsChannel':{
                    click: this.saveProductSmsChannel
                },
                'setMoreSnWindow': {
                    beforeshow: this.initProductMoreSnParam
                },
                'productManagerWin  grid#account_product_grid #account_product_moreSn_set':{
                    click:this.showProductMoreSnSet
                },
                'setMoreSnWindow  button#btn_save_zj_moreSn':{
                    click: this.saveProductMoreSn
                },
                'accountProductSetWin >  button#add_cust_fee_tool': {
                    click: this.custFeeShowAdd,
                },
                'accountProductSetWin >  button#update_cust_fee_tool': {
                    click: this.custFeeShowUpdate,
                },
                'accountProductSetWin >  button#delete_cust_fee_tool': {
                    click: this.custFeeRemove,
                },
                'productManagerWin >  button#add_cust_fee_tool': {
                    click: this.custFeeShowAdd,
                },
                'productManagerWin >  button#update_cust_fee_tool': {
                    click: this.custFeeShowUpdate,
                },
                'productManagerWin >  button#delete_cust_fee_tool': {
                    click: this.custFeeRemove,
                },
                'custFeeEdit >  button#commit_button' : {
                    click: this.custFeeUpsert
                },
                'accountProductSetWin >  button#opened_add_intl_fee_tool': {
                    click: this.intlFeeShowAdd,
                },
                'accountProductSetWin >  button#opened_update_intl_fee_tool': {
                    click: this.intlFeeShowUpdate,
                },
                'accountProductSetWin >  button#opened_delete_intl_fee_tool': {
                    click: this.intlFeeRemove,
                },
                'productManagerWin >  button#add_intl_fee_tool': {
                    click: this.intlFeeShowAdd,
                },
                'productManagerWin >  button#update_intl_fee_tool': {
                    click: this.intlFeeShowUpdate,
                },
                'productManagerWin >  button#delete_intl_fee_tool': {
                    click: this.intlFeeRemove,
                },
                'intlFeeEdit >  button#commit_button' : {
                    click: this.intlFeeUpsert
                },
                'accountProductSetWin >  combobox#opened_product_intl_fee_line' : {
                    change: this.intlLineChange
                },
                'productManagerWin >  combobox#open_product_intl_fee_line' : {
                    change: this.intlLineChange
                },
                'accountProductSetWin >  checkbox#opened_product_intl_is_open_intl' : {
                    change: this.intlIsOpenIntlChange
                },
                'productManagerWin >  checkbox#open_product_intl_is_open_intl' : {
                    change: this.intlIsOpenIntlChange
                },
                'accountProductSetWin >  checkbox#opened_product_intl_allow_other' : {
                    change: this.intlAllowOtherChange
                },
                'productManagerWin >  checkbox#open_product_intl_allow_other' : {
                    change: this.intlAllowOtherChange
                },
                'accountProductSetWin >  combobox#opened_product_intl_combo_add_cid' : {
                    select: this.intlCidSelect,
                    keyup : this.intlCidInput,
                }
            }
        );
        this.initFlag = true;

    },
    custFeeEnableDockItems : function(selModel,selections){
        var grid = this.retrieveCustFeeGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;

        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    custFeeShowUpdate: function(obj){
        var record = this.retrieveCustFeeGrid().getSelectionModel().getSelection()[0];

        if(record.get('state') != 'stop'){
            App.util.AppUtil.msg("非停用状态下的扣费不允许更新!");
            return false;
        }

        var win = Ext.create('App.view.account.account.custFeeEdit',{
            animateTarget: obj,
            editMode: 'update',
            record:record,
        });
        win.show();
    },
    custFeeRemove: function(obj){
        var grid = this.retrieveCustFeeGrid();
        var selected = grid.getSelectionModel().getSelection()[0];

        if(selected.get('state') == 'stop' ||
            (selected.get('state') != 'stop' && confirm("确认要删除在用扣费吗？删除后将不再计算费用"))){
            grid.getStore().remove(selected);
        }
    },
    custFeeShowAdd: function(obj){
        var win = Ext.create('App.view.account.account.custFeeEdit',{
            animateTarget: obj,
            editMode: 'addNew',
        });
        win.show();
    },
    custFeeUpsert: function(obj){
        var win = obj.up('window');
        var form = win.down('form');
        var grid = this.retrieveCustFeeGrid();
        if(!form.form.isValid()){
            return;
        }
        if(win.editMode == 'update'){
            if(!win.updateRecord()){
                return;
            }
        }else if(win.editMode == 'addNew'){
            var newRecord = win.getRecord();

            newRecord.state = 'stop';

            if(grid.getStore().count()>1){
                grid.getStore().insert(0,newRecord);
            }else{
                grid.getStore().add(newRecord);

                //在开通自定义扣费产品时绑定事件一次且只有一次
                if(this.retrieveCustFeeGrid() == this.getOpenNewCustFeeGrid()){
                    this.getOpenNewCustFeeGrid().addListener('selectionchange', this.custFeeEnableDockItems);
                    this.getOpenNewCustFeeGrid().addListener('itemdbclick', this.custFeeShowUpdate);
                    this.getOpenNewCustFeeGrid().retrieveCustFeeGrid = this.retrieveCustFeeGrid;
                    this.getOpenNewCustFeeGrid().getOpenNewCustFeeGrid = this.getOpenNewCustFeeGrid;
                    this.getOpenNewCustFeeGrid().getOpenedCustFeeGrid = this.getOpenedCustFeeGrid;
                }
            }
        }
        win.close();
    },
    retrieveCustFeeGrid: function(){
        if(this.getOpenNewCustFeeGrid()){
            return this.getOpenNewCustFeeGrid();
        }

        return this.getOpenedCustFeeGrid();

    },
    intlFeeEnableDockItems : function(selModel,selections){
        var grid = this.retrieveIntlFeeGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;

        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    intlFeeShowUpdate: function(obj){
        var lineCombobox = obj.up('fieldset').down('combobox[name="intlLine"]');
        var line = lineCombobox.getValue();
        if(!line){
            lineCombobox.markInvalid("请先设置国际长途线路!");
            return;
        }

        var grid = this.retrieveIntlFeeGrid();
        var record = grid.getSelectionModel().getSelection()[0];

        var codes = [];
        grid.getStore().each(function(record){
            codes.push(record.get('code'));
        });
        codes.splice(codes.indexOf(record.get('code')),1);

        var win = Ext.create('App.view.account.account.intlFeeEdit',{
            animateTarget: obj,
            editMode: 'update',
            line:line,
            record:record,
            codes:codes,
        });
        win.show();
    },
    intlCidSelect: function(obj,selected){
        var selectedRecord = selected[0];
        var cid = selectedRecord.get('codeValue');

        var win = obj.up('window');

        if(!obj.cids) {
            obj.cids = []
        }

        if(obj.cids.indexOf(cid)>=0){
            //警告重复
            obj.markInvalid("号码重复!");
            return;
        }

        var cidsDiv = document.getElementById("cid_list_div");
        var cidSpan = this.getRenderIntlCid(obj,cid);
        cidsDiv.appendChild(cidSpan);

        //重新布局
        cidsDiv.style.height = this.calcCidsDivHeight(cidsDiv,win) + 'px';
        win.doLayout();

        obj.cids.push(cid);
        obj.reset();
    },
    intlCidInput: function(obj,e){
        if (e.getKey() != e.ENTER) {
            return true;
        }
        var cid = obj.getValue();
        var win = obj.up('window');

        if(!obj.cids) {
            obj.cids = []
        }

        if(obj.cids.indexOf(cid)>=0){
            //警告重复
            obj.markInvalid("号码重复!");
            return;
        }

        var cidsDiv = document.getElementById("cid_list_div");
        var cidSpan = this.getRenderIntlCid(obj,cid);
        cidsDiv.appendChild(cidSpan);

        //重新布局
        cidsDiv.style.height = this.calcCidsDivHeight(cidsDiv,win) + 'px';
        win.doLayout();

        obj.cids.push(cid);
        obj.reset();
    },
    calcCidsDivHeight:function(cidsDiv){
        var cidSpans = cidsDiv.children || [];
        var limitWidth = cidsDiv.getBoundingClientRect().width;
        var totalWidth = 0;
        for (var i = 0; i < cidSpans.length; i++) {
            totalWidth += cidSpans[i].getBoundingClientRect().width + 2;
        };

        var newHeight = (Math.floor((totalWidth)/(limitWidth-40)) + 1) * 40;

        return newHeight;
    },
    intlFeeRemove: function(obj){
        var grid = this.retrieveIntlFeeGrid();
        var selected = grid.getSelectionModel().getSelection()[0];

        if(confirm("确认要删除国际长途资费设置吗?")){
            grid.getStore().remove(selected);
        }
    },
    intlFeeShowAdd: function(obj){
        var lineCombobox = obj.up('fieldset').down('combobox[name="intlLine"]');
        var line = lineCombobox.getValue();
        if(!line){
            lineCombobox.markInvalid("请先设置国际长途线路!");
            return;
        }

        var grid = this.retrieveIntlFeeGrid();
        var codes = [];
        grid.getStore().each(function(record){
           codes.push(record.get('code'));
        });

        var win = Ext.create('App.view.account.account.intlFeeEdit',{
            animateTarget: obj,
            editMode: 'addNew',
            line:line,
            codes:codes,
        });
        win.show();
    },
    intlFeeUpsert: function(obj){
        var win = obj.up('window');
        var form = win.down('form');
        var grid = this.retrieveIntlFeeGrid();
        if(!form.form.isValid()){
            return;
        }
        if(win.editMode == 'update'){
            if(!win.updateRecord()){
                return;
            }
        }else if(win.editMode == 'addNew'){
            var newRecord = win.getRecord();

            if(grid.getStore().count()>1){
                grid.getStore().insert(0,newRecord);
            }else{
                grid.getStore().add(newRecord);

                if(this.retrieveIntlFeeGrid() == this.getOpenNewIntlFeeGrid()){
                    this.getOpenNewIntlFeeGrid().addListener('selectionchange', this.intlFeeEnableDockItems);
                    this.getOpenNewIntlFeeGrid().addListener('itemdbclick', this.intlFeeShowUpdate);
                    this.getOpenNewIntlFeeGrid().retrieveIntlFeeGrid = this.retrieveIntlFeeGrid;
                    this.getOpenNewIntlFeeGrid().getOpenNewIntlFeeGrid = this.getOpenNewIntlFeeGrid;
                    this.getOpenNewIntlFeeGrid().getOpenedIntlFeeGrid = this.getOpenedIntlFeeGrid;
                }
            }
        }
        win.close();
    },
    retrieveIntlFeeGrid: function(){
        if(this.getOpenedIntlFeeGrid()){
            return this.getOpenedIntlFeeGrid();
        }

        return this.getOpenNewIntlFeeGrid();

    },
    retrieveIntlLine: function(){
        if(this.getOpenedIntlLine()){
            return this.getOpenedIntlLine();
        }

        return this.getOpenNewIntlLine();
    },
    retrieveIntlAllowOther: function(){
        if(this.getOpenedIntlAllowOther()){
            return this.getOpenedIntlAllowOther();
        }

        return this.getOpenNewIntlAllowOther();
    },
    retrieveIntlOtherPrice: function(){
        if(this.getOpenedIntlOtherPrice()){
            return this.getOpenedIntlOtherPrice();
        }

        return this.getOpenNewIntlOtherPrice();
    },
    intlLineChange: function(obj,newValue,oldValue){
        if(!oldValue){
            return;
        }

        if(obj.eventSuspend){
            delete obj.eventSuspend;
            return;
        }

        if(this.retrieveIntlFeeGrid().getStore().count()>0) {
            if (confirm('改变国际长途线路将清空国际长途资费设置,是否继续?')) {
                this.retrieveIntlFeeGrid().getStore().removeAll();
            } else {
                obj.eventSuspend = true;
                obj.setValue(oldValue);
            }
        }
    },
    intlIsOpenIntlChange: function(obj,newValue,oldValue){
        if(newValue == true){
            this.retrieveIntlLine().setVisible(true);
            this.retrieveIntlLine().allowBlank = false;
            this.retrieveIntlAllowOther().setVisible(true);
            this.retrieveIntlFeeGrid().setVisible(true);
            if(this.getOpenedProductIntlCidSet()){
                this.getOpenedProductIntlCidSet().setVisible(true);
            }
        }else{
            if(!confirm("关闭国际长途将清空相关数据,是否继续?")){
                return;
            }

            this.retrieveIntlLine().setVisible(false);
            this.retrieveIntlAllowOther().setVisible(false);
            this.retrieveIntlFeeGrid().setVisible(false);
            if(this.getOpenedProductIntlCidSet()){
                this.getOpenedProductIntlCidSet().setVisible(false);
                this.getOpenedProductIntlComboAddCid().cids=null;
                var cidDiv = document.getElementById('cid_list_div');
                while (cidDiv.firstChild) {
                    cidDiv.removeChild(cidDiv.firstChild);
                }
            }

            this.retrieveIntlLine().allowBlank = true;
            this.retrieveIntlLine().eventSuspend = true;
            this.retrieveIntlLine().setValue(null);
            this.retrieveIntlAllowOther().setValue(false);
            this.retrieveIntlFeeGrid().getStore().removeAll();

        }
    },
    intlAllowOtherChange: function(obj,newValue,oldValue){
        if(newValue == true){
            this.retrieveIntlOtherPrice().setVisible(true);
            this.retrieveIntlOtherPrice().allowBlank = false;
        }else{
            this.retrieveIntlOtherPrice().setVisible(false);
            this.retrieveIntlOtherPrice().allowBlank = true;
            this.retrieveIntlOtherPrice().setValue(null);
        }
    },
    getRenderIntlCid: function (obj,cid) {
        var span = document.createElement('span');
        span.setAttribute('cid',cid);
        span.setAttribute('class','line_tag');
        span.textContent=cid;

        var delSpan = document.createElement('span');
        delSpan.textContent='✗';
        delSpan.style = "color:red;cursor:pointer;margin-left: 10px;padding: 5px";
        var thisCids = obj.cids;
        delSpan.addEventListener('click', function(event) {
            event = event || window.event;
            var delEle = (event.target || event.srcElement).parentNode;
            var delCid = delEle.getAttribute("cid");

            if(thisCids && thisCids.length>0){
                thisCids.splice(thisCids.indexOf(delCid),1);
                delEle.remove();
            }
        });

        span.appendChild(delSpan);
        return span;
    },
    enableProductDockItems : function(selModel, selections){
        var grid = this.getProductManagerWin().down("#account_product_grid");
        var toolbars = grid.query('toolbar[class="dock"]');

        toolbars.forEach(function(toolbar){
            var items = toolbar.items.items;

            var zjLineSetToolButton = null;
            for (var i = 0; i < items.length; i++) {
                if (items[i].needSelect) {
                    if(items[i].product){
                        items[i].setDisabled(!(selections.length != 0 && items[i].product == selections[0].get('product')));
                    }else{
                        items[i].setDisabled(selections.length === 0);
                    }
                }
            }
        });
    },
    showProductDetail : function(obj){
        var grid = this.getProductManagerWin().down("#account_product_grid");
        var selection = grid.getSelectionModel().getSelection()[0];
        var id = selection.get("_id");

        App.util.AppUtil.request('bill.account.getProductAndLicenceById',{_id:id},function(data,self){
            if(data.success){
                var win = Ext.create('App.view.account.account.accountProductSet', {
                    data: data.data,
                    animateTarget: obj
                });

                self.currentDetailProduct = data.data.product;
                if(self.currentDetailProduct == 'custFee'){
                    self.getOpenedCustFeeGrid().addListener('selectionchange', self.custFeeEnableDockItems);
                    self.getOpenedCustFeeGrid().addListener('itemdbclick', self.custFeeShowUpdate);
                    self.getOpenedCustFeeGrid().retrieveCustFeeGrid = self.retrieveCustFeeGrid;
                    self.getOpenedCustFeeGrid().getOpenNewCustFeeGrid = self.getOpenNewCustFeeGrid;
                    self.getOpenedCustFeeGrid().getOpenedCustFeeGrid = self.getOpenedCustFeeGrid;
                }

                if(self.currentDetailProduct == 'zj' || self.currentDetailProduct == 'cc'){
                    self.getOpenedIntlFeeGrid().addListener('selectionchange', self.intlFeeEnableDockItems);
                    self.getOpenedIntlFeeGrid().addListener('itemdbclick', self.intlFeeShowUpdate);
                    self.getOpenedIntlFeeGrid().retrieveIntlFeeGrid = self.retrieveIntlFeeGrid;
                    self.getOpenedIntlFeeGrid().getOpenNewIntlFeeGrid = self.getOpenNewIntlFeeGrid;
                    self.getOpenedIntlFeeGrid().getOpenedIntlFeeGrid = self.getOpenedIntlFeeGrid;
                }

                win.setTitle(App.util.AppUtil.getRendererValue(selection.get('product'), "product")+'-->产品设置');
                win.show();

                if(data.data.intlFeeSet && data.data.intlFeeSet.cids){
                    self.getOpenedProductIntlComboAddCid().cids = data.data.intlFeeSet.cids;
                    var cidsDiv = document.getElementById("cid_list_div");
                    data.data.intlFeeSet.cids.forEach(function(cid){
                        var cidSpan = self.getRenderIntlCid(self.getOpenedProductIntlComboAddCid(),cid);
                        cidsDiv.appendChild(cidSpan);
                    });

                    //重新布局
                    cidsDiv.style.height = self.calcCidsDivHeight(cidsDiv,win) + 'px';
                    win.doLayout();
                }
            } else {
                App.util.AppUtil.msg("获取产品信息失败！");
            }
        },this);

    },
    showProductConcurrent:function(obj){
        var grid = this.getProductManagerWin().down("#account_product_grid");
        var selection = grid.getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        App.util.AppUtil.request('bill.account.getAccountProductById',{_id:id},function(data,self){
            if(data.success){
                var product=data.data;
                if(product.product=='cc'){
//                    console.dir(product);
                    if(!product.pbx || product.pbx.length<=0){
                        App.util.AppUtil.msg("还没选择pbx");
                        return;
                    }
                    var win = Ext.create('App.view.account.account.setProductConcurrent', {
                        data: data.data,
                        animateTarget: obj
                    });
                    win.setTitle(App.util.AppUtil.getRendererValue(selection.get('product'), "product")+'-->产品设置');
                    win.show();
                }else{
                    App.util.AppUtil.msg("您选择的不是呼叫中心产品");
                }
            } else {
                App.util.AppUtil.msg("获取产品信息失败！");
            }
        },this);
    },
    openNewProduct : function(obj){
        var form = obj.up("form");
        if(form.form.isValid()){
            var data = {};
            var product = form.down('#open_product_radio').getValue();
            data.product = product.product;
            data.account = form.down("#open_product_account").getValue();
            var feeSet = form.down('fieldset#open_product_feeset');
            var feeSetData = App.util.AppUtil.getFormParam(feeSet);

            data.dialFee = {};
            data.fee = {};
            data.transferFee = {};
            //data.internationalFee = {};

            for(var key in feeSetData){
                if(key.startWith("dial_")){
                    data.dialFee[key.replace("dial_","")] =  feeSetData[key];
                    continue;
                }
                if(key.startWith("fee_")){
                    data.fee[key.replace("fee_","")] =  feeSetData[key];
                    continue;
                }
                if(key.startWith("transfer_")){
                    data.transferFee[key.replace("transfer_","")] =  feeSetData[key];
                    continue;
                }
                //新增
                //if(key.startWith("intl_")){
                //    data.internationalFee[key.replace("intl_","")] =  feeSetData[key];
                //    continue;
                //}
                data[key] = feeSetData[key];
            }
            var nodeSet = form.down('fieldset#open_product_node');
            if(nodeSet){
                var nodeSetData = App.util.AppUtil.getFormParam(nodeSet);
                data.node = nodeSetData.node;
            }else{
                data.node="";
            }

            if(data.product == 'cc' || data.product == 'zj') {
                var openNewIsOpenIntl = this.getOpenNewIntlIsOpenIntl();
                var openNewIntlFeeGrid = this.getOpenNewIntlFeeGrid();
                var openNewIntlAllowOther = this.getOpenNewIntlAllowOther();
                var openNewIntlLine = this.getOpenNewIntlLine();
                var openNewIntlOtherPrice = this.getOpenNewIntlOtherPrice();

                if (openNewIsOpenIntl.getValue() && openNewIntlFeeGrid.getStore().count() == 0 && !openNewIntlAllowOther.getValue()) {
                    openNewIntlAllowOther.markInvalid('至少配置一个国际长途区域!');
                    openNewIntlLine.markInvalid('至少配置一个国际长途区域!');
                    return;
                }

                data.intlFeeSet = {};
                data.intlFeeSet.isOpenIntl = openNewIsOpenIntl.getValue();
                data.intlFeeSet.line = openNewIntlLine.getValue();
                data.intlFeeSet.allowOther = openNewIntlAllowOther.getValue();
                data.intlFeeSet.otherPrice = openNewIntlOtherPrice.getValue();
                if (openNewIntlFeeGrid.getStore().count() > 0) {
                    data.intlFeeSet.fees = [];
                    openNewIntlFeeGrid.getStore().each(function (record) {
                        var fee = {};
                        fee.code = record.get('code');
                        fee.price = record.get('price');
                        fee.memo = record.get('memo');

                        data.intlFeeSet.fees.push(fee);
                    });
                }
                // //默认开启录音权限，保存90天
                // data.recordStore=90;
                // data.isRecording="true";
            }

            App.util.AppUtil.request('bill.account.openAccountProduct',data,function(data,self){
                if(data.success){
                    App.util.AppUtil.msg("开通成功！");
                    obj.up("window").close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }
    },
    openNewCustFeeProduct : function(obj){
        var openNewCustFeeGrid = this.getOpenNewCustFeeGrid();
        var form = obj.up('form');
        if(!form.getForm().isValid()){
            return;
        }

        var data = {};
        data.account = form.down("#open_product_account").getValue();
        data.product = form.down('#open_product_radio').getValue().product;
        data.poundage = this.getProductManagerWin().down('#open_product_cust_fee_poundage').getValue();
        data.custFees = [];

        if(openNewCustFeeGrid.getStore().count()<1){
            return;
        }
        openNewCustFeeGrid.getStore().each(function(record){
            var custFee = {};
            custFee.name = record.get('name');
            custFee.price = record.get('price');
            custFee.pricePeriod = record.get('pricePeriod');
            custFee.autoRenew = record.get('autoRenew');
            custFee.memo = record.get('memo');

            data.custFees.push(custFee);
        });

        App.util.AppUtil.request('bill.account.openAccountCustFeeProduct',data,function(data,self){
            if(data.success){
                App.util.AppUtil.msg("开通成功！");
                obj.up("window").close();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        },this);
    },
    updateAccountBusinessTag : function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if(form.form.isValid()){
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            if(!(data.businessTag.tag instanceof Array)){
               var oneTag = data.businessTag.tag;
                data.businessTag.tag = [oneTag];
            }
            App.util.AppUtil.request('bill.account.updateAccountBusinessTag',data,function(data,self){
                if(data.success){
                    App.util.AppUtil.msg("标记成功！");
                    obj.up("window").close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }
    },
    updateAccountSetCallSum : function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if(form.form.isValid()){
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.updateAccountSetCallSum',data,function(data,self){
                if(data.success){
                    App.util.AppUtil.msg("设置拨号次数成功！");
                    obj.up("window").close();
                    //self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);
        }
    },
    openSingleCallSum: function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if(form.form.isValid()){
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.openSingleCallSum',{data:data},function(data){
                if(data.success){
                    App.util.AppUtil.msg("设置拨号权限成功");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            });

        }
    },

    openAccountCallSum: function() {
        if(!confirm("确认开放账户拨号限制吗?")){
            return;
        }
       // var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var grid = this.getProductManagerWin().down("#account_product_grid");
        var selection = grid.getSelectionModel().getSelection()[0];
        var accountId=selection.get("account");
        var data={
            account:accountId
        };
        App.util.AppUtil.request('bill.account.openAccountCallSum',{data:data},function(data){
            if(data.success){
                App.util.AppUtil.msg("设置账户拨号权限成功");
            } else {
                App.util.AppUtil.msg(data.message);
            }
        });
    },
    findAccountPbx:function(){
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        App.util.AppUtil.request('bill.account.queryPbxByAccountId', {_id:id}, function (rep, self) {
            console.log(rep);
            if (rep.list.length>0) {
                Ext.getCmp('account_call_sum_tool').show();
                Ext.getCmp('open_call_sum_tool').show();
                Ext.getCmp('open_account_call_sum_tool').show();
            } else {
                Ext.getCmp('account_call_sum_tool').hide();
                Ext.getCmp('open_call_sum_tool').hide();
                Ext.getCmp('open_account_call_sum_tool').hide();
            }
        }, this);
    },
    updateAccountProduct : function(obj){
        if(this.currentDetailProduct == 'custFee'){
            this.updateAccountCustFeeProduct(obj);
            return;
        }
        var win = obj.up("window");
        var form = win.down("form");
        if(form.form.isValid()){
            var data = {};
            var feeSet = form.down('fieldset#account_product_feeset');
            var feeSetData = App.util.AppUtil.getFormParam(feeSet);

            var calloutLicenceStrategy = feeSetData.calloutLicenceStrategy;
            var oldCalloutLicenceStrategy = feeSetData.oldCalloutLicenceStrategy;
            if(oldCalloutLicenceStrategy == "licencePrice" && calloutLicenceStrategy != "licencePrice"){
                App.util.AppUtil.msg("外呼版licence策略【按licence套餐】不能更改为【自定义】!");
                return;
            }
            delete feeSetData.oldCalloutLicenceStrategy;
            delete feeSetData.calloutLicenceNum;
            //delete feeSetData.licencePriceType;
            data.dialFee = {};
            data.fee={};
            data.transferFee = {};
            //data.internationalFee={};
            for(var key in feeSetData){
                if(key.startWith("dial_")){
                    data.dialFee[key.replace("dial_","")] =  feeSetData[key];
                    continue;
                }
                if(key.startWith("fee_")){
                    data.fee[key.replace("fee_","")] =  feeSetData[key];
                    continue;
                }
                if(key.startWith("transfer_")){
                    data.transferFee[key.replace("transfer_","")] =  feeSetData[key];
                    continue;
                }
                if(key.startWith("intl_")){
                //    data.internationalFee[key.replace("intl_","")] =  feeSetData[key];
                    continue;
                }

                data[key] = feeSetData[key];
            }

            if(data._id.indexOf('cc') >= 0 || data._id.indexOf('zj') >= 0) {

                var openedIsOpenIntl = this.getOpenedIntlIsOpenIntl();
                var openedIntlFeeGrid = this.getOpenedIntlFeeGrid();
                var openedIntlAllowOther = this.getOpenedIntlAllowOther();
                var openedIntlLine = this.getOpenedIntlLine();
                var openedIntlOtherPrice = this.getOpenedIntlOtherPrice();
                var cids = this.getOpenedProductIntlComboAddCid().cids;

                console.dir(cids);

                if (openedIsOpenIntl.getValue() && openedIntlFeeGrid.getStore().count() == 0 && !openedIntlAllowOther.getValue()) {
                    openedIntlAllowOther.markInvalid('至少配置一个国际长途区域!');
                    openedIntlLine.markInvalid('至少配置一个国际长途区域!');
                    return;
                }

                data.intlFeeSet = {};
                data.intlFeeSet.isOpenIntl = openedIsOpenIntl.getValue();
                data.intlFeeSet.line = openedIntlLine.getValue();
                data.intlFeeSet.allowOther = openedIntlAllowOther.getValue();
                data.intlFeeSet.otherPrice = openedIntlOtherPrice.getValue();
                data.intlFeeSet.cids = cids;
                if (openedIntlFeeGrid.getStore().count() > 0) {
                    data.intlFeeSet.fees = [];
                    openedIntlFeeGrid.getStore().each(function (record) {
                        var fee = {};
                        fee.code = record.get('code');
                        fee.price = record.get('price');
                        fee.memo = record.get('memo');

                        data.intlFeeSet.fees.push(fee);
                    });
                }
            }

            App.util.AppUtil.request('bill.account.updateAccountProduct',data,function(data,self){
                if(data.success){
                    self.getAccountProductSetWin().close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            },this);

        }
    },
    updateAccountCustFeeProduct: function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if(!form.getForm().isValid()){
            return;
        }

        var grid = this.getOpenedCustFeeGrid();
        var productId = grid.productId;

        var data = {productId:productId};
        data.custFees = [];
        data.poundage = this.getAccountProductSetWin().down('#open_product_cust_fee_poundage').getValue();

        if(grid.getStore().count()<1){
            return;
        }
        grid.getStore().each(function(record){
            var custFee = {};
            custFee.name = record.get('name');
            custFee.price = record.get('price');
            custFee.pricePeriod = record.get('pricePeriod');
            custFee.autoRenew = record.get('autoRenew');
            custFee.memo = record.get('memo');
            custFee.state = record.get('state');
            custFee.id = record.get('id');

            data.custFees.push(custFee);
        });

        App.util.AppUtil.request('bill.account.updateAccountCustFeeProduct',data,function(data,self){
            if(data.success){
                self.getAccountProductSetWin().close();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        },this);



    },
    saveAlertConfig: function (obj) {
        var fieldSet = obj.up("panel").down("fieldset");
        var data = App.util.AppUtil.getFormParam(fieldSet);
        App.util.AppUtil.request('bill.account.saveAlertConfig', data, function (data, self) {
            if (data.success) {
                App.util.AppUtil.msg("保存成功！");
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    showAlertLog: function (obj) {
        var win = obj.up('window');
        win.logStore = null;
        var panel = win.getLogViewPanel('balanceAlert');
        var pricePanel = win.down("tabpanel").down('panel#account_alert_config_panel');
        pricePanel.add(panel);
        obj.setDisabled(true);
    },
    configAccountIDD : function (obj) {
        var fieldSet = obj.up("panel").down("fieldset");
        var requestData = App.util.AppUtil.getFormParam(fieldSet);
        App.util.AppUtil.request('bill.account.setIDDstatus', requestData, function (data, self) {
            if (data.success) {
                App.util.AppUtil.msg("操作成功！");
                var status = requestData.IDDstatus || "off" ;
                var displayValue = (status == 'on' ? "<span color='green'>开通</span>":"<span color='red'>关闭</span>");
                fieldSet.down("#field_idd_config_status").setValue(displayValue);
                var statusValue = status == 'on'? "off":"on";
                fieldSet.down("#field_idd_config_status_value").setValue(statusValue);
                var buttonValue = (status == 'on' ? "关闭国际长途": "开通国际长途");
                obj.setText(buttonValue);
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    setAccountInvoice:function(obj){
        var fieldSet = obj.up("panel").down("fieldset");
        var data = App.util.AppUtil.getFormParam(fieldSet);
        App.util.AppUtil.request('bill.account.saveInvoiceSet', data, function (data, self) {
            if (data.success) {
                App.util.AppUtil.msg("保存成功！");
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    /*    initAccountSet: function (src) {
     var obj = src.down("#set_pay_off");
     if (src.data.account.payFlag) {
     obj.setValue(true);
     }
     },*/
    saveOverdrawConfig: function (obj) {
        var form = obj.up('form');
        //console.dir(form);
        if (form.form.isValid()) {
            var fieldSet =form.down("fieldset");
            var data = App.util.AppUtil.getFormParam(fieldSet);
            App.util.AppUtil.request('bill.account.savaOverdrawConfig', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("保存成功！");
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showPriceLog: function (obj) {
        var win = obj.up('window');
        win.logStore = null;
        var panel = win.getLogViewPanel('outCallPrice');
        var pricePanel = win.down("tabpanel").down('panel#account_price_config_panel');
        pricePanel.add(panel);
        obj.setDisabled(true);
    },
    showAddAccount: function (obj) {
        var win = Ext.create('App.view.account.account.addNewAccount', {
            animateTarget: obj
        });
        win.show();
    },
    showAddGatewaySip: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.account.account.addGatewaySip', {
            account: selection.get("_id"),
            animateTarget: obj
        });
        win.show();
    },
    addGatewaySip: function (obj) {
        var win = obj.up("window");
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.addGatewaySipNum', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("添加网关sip号成功！");
                    win.close();
//                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    addNewAccount: function (obj) {
        var win = this.getAddNewAccountWindow();
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            if(data.createMethod == 'www'){
                data.area = data.area || "bj";
            }
            App.util.AppUtil.request('bill.account.createNewAccount', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("添加账户成功！");
                    var win = self.getAddNewAccountWindow();
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showStopInfo: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
//        console.dir(selection);
        if(selection.data.status=='stop'){
            App.util.AppUtil.msg("该账号已经停用");
            return;
        }
        var win = Ext.create('App.view.account.account.stopAccount', {
            account: selection,
            animateTarget: obj
        });
        win.setTitle('停用账号---->' + selection.get('companyName'));
        win.show();
    },
    reopen : function(obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        if(selection.data.status != 'stop'){
            App.util.AppUtil.msg("该账号正在使用");
            return;
        }

        if(!confirm("确认重开" + selection.data.name + '账户吗?')){
            return;
        }

        App.util.AppUtil.request('bill.account.reopenAccount', {account : selection.data._id}, function (data, self) {
            if (data.success) {
                App.util.AppUtil.msg("重启账户成功！");
                self.getQueryGrid().store.load();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    stopAccount: function (obj) {
        if(!confirm('确认要停用该账号吗？'))return;
        var win = this.getStopAccountWindow();
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.stopAccount', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("停用账户成功！");
                    var win = self.getStopAccountWindow();
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },

    enableDockItems: function (selModel, selections) {
        var grid = this.getQueryGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        items=items[0].items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    showAccountSet: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var accountId = selection.get("_id");
        App.util.AppUtil.request('bill.account.getAccountSetInfo', {_id: accountId}, function (data, self) {
            if (data.success) {
                data.data.account.dialAlert=data.data.account.dialAlert||0;
                var win = Ext.create('App.view.account.account.setAccount', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle(selection.get('companyName') + '---->' + '账户配置');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },


    enableSmsSignDockItems: function (selModel, selections) {
        var grid = this.getSmsSignGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    enableSmsTempleteDockItems : function (selModel, selections){
        var grid = this.getSmsTempleteGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                if(selections.length > 0 && (selections[0].get("smsChannel").indexOf("ytxyx") >= 0 || selections[0].get("smsChannel").indexOf("ytx") >= 0) && items[i].id == 'btn_show_update_sms_templete'){
                    items[i].setDisabled(true);
                    continue;
                }
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    enableSmsEditDockItems: function (selModel, selections) {
        var grid = this.getSmsEditGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    showSmsSign: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.account.account.smsSign', {
            account: selection,
            animateTarget: obj
        });
        win.setTitle('短信签名');
        win.show();
    },
    showSmsEdit: function(obj){
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.account.account.smsEdit', {
            account: selection,
            animateTarget: obj
        });
        win.setTitle('短信模版');
        win.show();
    },

    showAddSmsSign:function (obj) {
        var parent=obj.up("window");
        var account=parent.account;
        var win = Ext.create('App.view.account.account.addSmsSign', {
            account: account,
            animateTarget: obj
        });
        win.setTitle('添加短信签名');
        win.show();
    },
    showAddSmsTemplete : function (obj){
        var win = obj.up("window");
        var account = win.account ;

        App.util.AppUtil.request('bill.account.getAccountProductById', {account:account.get("_id"),product:'cc'}, function (data, self) {
            if (data.success == false) {
                App.util.AppUtil.msg("请先开通一款产品！");
                return;
            } else {

            var minSmsSplitBaseNum;
            var product = data.data;
            if (product) {
                minSmsSplitBaseNum = product.smsSplitBaseNum || 66;
            }

            var win = Ext.create('App.view.account.account.addSmsTemplete', {
                account: account,
                animateTarget: obj,
                minSmsSplitBaseNum: minSmsSplitBaseNum
            });

            win.setTitle('添加短信模板');
            win.show();
        }
        }, this);
    },
    showAddSmsEdit:function (obj) {
        var parent=obj.up("window");
        var account=parent.account;
        var win = Ext.create('App.view.account.account.addSmsEdit', {
            account: account,
            animateTarget: obj
        });
        win.setTitle('添加短信模版');
        win.show();
    },
    addSmsSign: function (obj) {
        var win = this.getAddSmsSignWindow();
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.addSmsSign', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("添加签名成功！");
                    //var win = self.getAddSmsSignWindow();
                    win.close();
                    self.getSmsSignWin().down("#account_smsSign_query_grid").store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    addSmsTemplete : function (obj){
        var win = this.getAddSmsTempleteWindow();
        var form = win.down('form');
        if (form.form.isValid()){
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            //内容加签名总文字长度不超过280个字
            var signContent = data.sign;
            var signRecord = fieldset.down('combobox[name="sign"]').findRecordByValue(data.sign);
            if(signRecord){
                signContent = signRecord.raw.codeName;;
            }
            var signLength = signContent.length;
            var contentLength = data.content.length;
            if(signLength + contentLength > 280){
                return App.util.AppUtil.msg('内容加签名总文字长度不可以超过280个字');
            }
            if(data.operatorStrategy){
                data.operatorStrategy=data.operatorStrategy.operatorStrategy;

            }
          if (data.smsChannel) {
                data.smsChannel = data.smsChannel.smsChannel || [];
            }
            if(!(data.smsChannel instanceof  Array)){
               var temp = data.df_smsChannel;
                data.smsChannel = [temp];
            }
            data.templateType=data.templateType.templateType;
            App.util.AppUtil.request('bill.account.addSmsTemplete', data , function(data , self){
                if (data.success){
                    App.util.AppUtil.msg("添加短信模板成功！");
                    win.close();
                    self.getSmsSignWin().down("#account_smsTemplete_query_grid").store.load();
                }   else {
                    App.util.AppUtil.msg(data.message);
                }
            } , this);
        }
    },
    addSmsEdit: function (obj) {
        var win = this.getAddSmsEditWindow();
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.addSmsEdit', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("添加模版成功！");
                    var win = self.getAddSmsEditWindow();
                    win.close();
                    self.getSmsEditGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showUpdateSmsSign:function(obj){
        var grid = this.getSmsSignWin().down("#account_smsSign_query_grid");
        var selection = grid.getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        var account = selection.get("account");
        App.util.AppUtil.request('bill.account.getSmsSignByAccount',{_id:id},function(data,self){
            if(data.success){
                var win = Ext.create('App.view.account.account.updateSmsSign', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle(account+'-->短信签名');
                win.show();
            } else {
                App.util.AppUtil.msg("获取短信数据失败！");
            }
        },this);
    },
    showUpdateSmsTemplete : function(obj){
        var grid = this.getSmsSignWin().down("#account_smsTemplete_query_grid");
        var selection = grid.getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        //var account = selection.get("account");
        App.util.AppUtil.request('bill.account.getSmsTempleteById',{_id:id},function(data,self){
            if(data.success) {
              var templeteData = data.data || {};

                /* if (templeteData.operatorStrategy) {
                    templeteData.operatorStrategy = templeteData.operatorStrategy || [];
                }
                if(!(templeteData.operatorStrategy instanceof  Array)) {
                    var temp = templeteData.operatorStrategy;
                    templeteData.operatorStrategy = [temp];
                }*/
                var win = Ext.create('App.view.account.account.updateSmsTemplete',{
                    data : templeteData,
                    animateTarget: obj,
                    radioValue : templeteData.operatorStrategy,
                    templateValue:templeteData.templateType
                });
                win.setTitle(account+'-->短信模板');
                win.show();
            }else {
                App.util.AppUtil.msg("获取短信数据失败！");
            }
        },this);
    },
    showUpdateSmsEdit:function(obj){
    var grid = this.getSmsEditWin().down("#account_smsEdit_query_grid");
    var selection = grid.getSelectionModel().getSelection()[0];
    var id = selection.get("_id");
    var account = selection.get("account");
    App.util.AppUtil.request('bill.account.getSmsEditByAccount',{_id:id},function(data,self){
        if(data.success){
            var win = Ext.create('App.view.account.account.updateSmsEdit', {
                data: data.data,
                animateTarget: obj
            });
            win.setTitle(account+'-->短信模版');
            win.show();
        } else {
            App.util.AppUtil.msg("获取短信模版数据失败！");
        }
    },this);
},
    updateSmsSign: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.updateSmsSign', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("更新短信签名成功！");
                    win.close();
                    self.getSmsSignGrid().store.load()
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    updateSmsTemplete : function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            //console.log("into updatesmsTem...");
           // console.log(data);
            //内容加签名总文字长度不超过280个字
            var signContent = data.sign;
            var signRecord = fieldset.down('combobox[name="sign"]').findRecordByValue(data.sign);
            if(signRecord){
                signContent = signRecord.raw.codeName;
            }
            var signLength = signContent.length;
            var contentLength = data.content.length;
            if(signLength + contentLength > 280){
                return App.util.AppUtil.msg('内容加签名总文字长度不可以超过280个字');
            }


            if(data.operatorStrategy){
                data.operatorStrategy=data.operatorStrategy.operatorStrategy;

            }


                if (data.smsChannel) {
                    data.smsChannel = data.smsChannel.smsChannel || [];
                }
                if(!(data.smsChannel instanceof  Array)){
                    var temp = data.df_smsChannel;
                    data.smsChannel = [temp];
                }
            data.templateType=data.templateType.templateType;
            App.util.AppUtil.request('bill.account.updateSmsTemplete', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("更新短信模板成功！");
                    win.close();
                    self.getSmsSignWin().down("#account_smsTemplete_query_grid").store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    updateSmsEdit: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.updateSmsEdit', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("更新短信模版成功！");
                    win.close();
                    console.dir(self);
                    self.getSmsEditGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    deleteSmsTemplete:function(obj){
        var win = this.getSmsSignWin();
        var queryGrid = win.down("#account_smsTemplete_query_grid");
        var selection = queryGrid.getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        var name = selection.get("name");
        Ext.Msg.confirm("警告", "确认删除模板[" + name + "]?", function (result) {
            if (result == "yes") {
                App.util.AppUtil.request("bill.account.deleteSmsTemplete", {_id:id}, function (data) {
                    if (data.success) {
                        App.util.AppUtil.msg("删除成功！");
                        queryGrid.store.load();
                    } else {
                        App.util.AppUtil.msg(data.message);
                    }
                }, this);
            }
        });
    },
    deleteSmsSign:function(obj){
        var self=this.getSmsSignWin();
        var displayField="name";
        var action="bill.account.deleteSmsSign";
        var data={};

        var queryGrid = self.down("#account_smsSign_query_grid");
        var selection = queryGrid.getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        data = data || {};
        data._id = id;
        var display = selection.get(displayField);
        Ext.Msg.confirm("警告", "确认删除[" + display + "]?", function (result) {
            if (result == "yes") {
                App.util.AppUtil.request(action, data, function (data) {
                    if (data.success) {
                        App.util.AppUtil.msg("删除成功！");
                        queryGrid.store.load();
                    } else {
                        App.util.AppUtil.msg(data.message);
                    }
                }, self);
            }
        });
    },

    deleteSmsEdit:function(obj){
        var self=this.getSmsEditWin();
        var displayField="name";
        var action="bill.account.deleteSmsEdit";
        var data={};

        var queryGrid = self.down("#account_smsEdit_query_grid");
        var selection = queryGrid.getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        data = data || {};
        data._id = id;
        var display = selection.get(displayField);
        Ext.Msg.confirm("警告", "确认删除[" + display + "]?", function (result) {
            if (result == "yes") {
                App.util.AppUtil.request(action, data, function (data) {
                    if (data.success) {
                        App.util.AppUtil.msg("删除成功！");
                        queryGrid.store.load();
                    } else {
                        App.util.AppUtil.msg(data.message);
                    }
                }, self);
            }
        });
    },


    showAccountFind: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var accountId = selection.get("_id");
        App.util.AppUtil.request('bill.account.getAccountSetInfo', {_id: accountId}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.account.account.findAccount', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle(selection.get('companyName') + '---->' + '账户查询');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    showAccountInfo: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.account.account.updateAccountInfo', {
            account: selection,
            animateTarget: obj
        });
        win.setTitle(selection.get('companyName') + '---->' + '账户信息');
        win.show();
    },
    updateAccountInfo: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.updateAccountInfo', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("修改账户信息成功！");
                    win.close();
                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showProduct: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var accountId = selection.get("_id");
        App.util.AppUtil.request('bill.account.getAccountProductInfo', {account: accountId}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.account.account.productManager', {
                    data: data.data,
                    accountId: accountId,
                    zjBoards:data.zjBoards,
                    animateTarget: obj
                });
                win.setTitle(selection.get('companyName') + '---->' + '产品管理');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        });
    },
    showBusinessTag : function (obj){
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var accountId = selection.get("_id");
        App.util.AppUtil.request('bill.account.getAccountBusinessTagInfo', {_id: accountId}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.account.account.businessTagManager', {
                    data: data.tags,
                    account: accountId,
                    animateTarget: obj
                });
                win.setTitle(selection.get('companyName') + '---->' + '业务标记');
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        });
    },
    showAccountCost: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var accountId = selection.get("_id");
        var win = Ext.create('App.view.account.account.findCostRecord', {
            accountId: accountId,
            animateTarget: obj
        });
        win.setTitle(selection.get('companyName') + '---->' + '资费查询');
        win.show();
    },
    showServiceNoView: function (obj) {
        var win = obj.up('window');
        var accountId = win.data.account._id;

        if (obj.items.length == 0) {
            var panel = Ext.create('App.view.account.account.servicenoManage', {
                accountId: accountId,
                animateTarget: obj
            });
            obj.add(panel);
        }
    },
    /*showAccountOverDrawView: function (obj) {
     var win = obj.up('window');
     if (obj.items.length == 0) {
     var panel=win.getAccountOverdrawItems();
     obj.add(panel);
     }
     },*/
    show400ServiceNoView: function (obj) {
        var win = obj.up('window');
        var accountId = win.data.account._id;

        if (obj.items.length == 0) {
            var panel = Ext.create('App.view.account.account.serviceno400Manage', {
                accountId: accountId,
                animateTarget: obj
            });
            obj.add(panel);
        }
    },
    /*    showAddServiceNo: function (obj) {
     var parent = this.getSnManageQueryPanel();
     var accountId = parent.accountId;
     App.util.AppUtil.request('bill.account.checkNopayServiceNo', {account: accountId}, function (data, self) {
     if (data.success) {
     if (gloab_client_user.identity == 'hp' && data.total > 0) {
     App.util.AppUtil.msg('服务号只能选择一个!');
     return;
     }
     var win = Ext.create('App.view.account.account.addServiceNo', {
     accountId: accountId
     });
     win.show();
     } else {
     App.util.AppUtil.msg(data.message);
     }
     }, this);
     },*/


    /*    enableAddSn: function (selModel, selections) {
     var win = this.getAddServiceNoWin();
     var btn = win.down('button[id="serviceno_select_button"]');
     if (btn.needSelect) {
     btn.setDisabled(selections.length === 0);
     }
     },*/
    /*   addServiceNo: function (obj) {
     var win = obj.up("window");
     if (!confirm("确认选择该号码吗？"))return;
     var selection = this.getAddSnGrid().getSelectionModel().getSelection()[0];
     var id = selection.get("_id");
     var account = win.accountId;
     if (gloab_client_user.identity == 'hp') {
     App.util.AppUtil.request('bill.hp.lockServiceNo2Hp', {_id: id, account: account}, function (data, self) {
     if (data.success) {
     App.util.AppUtil.msg('增加号码成功');
     win.close();
     var parent = self.getSnManageGrid();
     parent.store.load();
     } else {
     App.util.AppUtil.msg(data.message);
     }
     }, this);
     } else {
     App.util.AppUtil.request('bill.account.lockServiceNo', {_id: id, account: account}, function (data, self) {
     if (data.success) {
     App.util.AppUtil.msg('增加号码成功');
     win.close();
     var parent = self.getSnManageGrid();
     parent.store.load();
     } else {
     App.util.AppUtil.msg(data.message);
     }
     }, this);
     }
     },*/
    showUcenter: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var container = {
            id: 'login_ucenter',
            tag: 'div',
            style: 'display:none'
        };
        var div = Ext.getDom("login_ucenter");
        if (!div) {
            Ext.DomHelper.append(Ext.getBody(), container);
        }
        var div2 = Ext.getDom("login_ucenter");
        if (div2) {
            var param = {
                data: {
                    loginName: selection.get("name"),
                    password: selection.raw.managerPassword,
                    type: 'ucenter',
                    billLoginName:gloab_client_user.loginName,
                    billIdentity:gloab_client_user.identity,
                    billLimits:gloab_client_user.limits
//                    billUid:gloab_client_user._id
                }
            }

            var html = '<input type="hidden" name="action" value="bill.getSessionId">' +
                '<input type="hidden" name="data" value="">';
            var form = {
                id: 'login_ucenter_frm',
                tag: 'form',
                action: './public',
                target: '_blank',
                method: 'POST',
                html: html
            };
            div2.innerHTML = '';
            Ext.DomHelper.append('login_ucenter', form);
            Ext.getDom("login_ucenter_frm").data.value = Ext.JSON.encode(param);
            Ext.getDom("login_ucenter_frm").submit();
        }
    },
    /**
     * @param obj
     */
    _redirectCC: function (param) {
        App.util.AppUtil.requestSync('bill.redirectCCAdminLogin', param, function (data, self) {
            if (data.success) {
                var url=data.url;
                window.open(url,"_newtab");
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    _redirectCC2In: function (param) {
        App.util.AppUtil.requestSync('bill.redirectCCInLogin', param, function (data, self) {
            if (data.success) {
                var url=data.url;
                window.open(url,"_newtab");
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    _redirectCC2Out: function (param) {
        App.util.AppUtil.requestSync('bill.redirectCCOutLogin', param, function (data, self) {
            if (data.success) {
                var url=data.url;
                window.open(url,"_newtab");
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    showCC: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var account= selection.get("_id");
//        console.dir(selection)
        App.util.AppUtil.requestSync('bill.checkCCPbx', {account: account}, function (data, self) {
            if (data.success) {
                var pbx=data.pbx||[];
                if(pbx.length==1){
                    var param = {
                        account: account,
                        pbx:pbx[0].PBX
                    }
                    self._redirectCC(param);
                }else if(pbx.length==0){
//                    App.util.AppUtil.msg("呼叫中心产品没指定节点！");
                    var param = {
                        account: account,
                        pbx:''
                    }
                    self._redirectCC(param);
                }else{
                    data.account=account;
                    var win = Ext.create('App.view.account.account.selectCCPbx', {
                        data: data,
                        animateTarget: obj
                    });
                    win.setTitle("选择呼叫中心节点");
                    win.show();
                }
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    showCCIn: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var account= selection.get("_id");
//        console.dir(selection)
        App.util.AppUtil.requestSync('bill.checkCCPbx', {account: account}, function (data, self) {
            if (data.success) {
                var pbx=data.pbx||[];
                if(pbx.length==1){
                    var param = {
                        account: account,
                        pbx:pbx[0].PBX
                    }
                    self._redirectCC2In(param);
                }else if(pbx.length==0){
//                    App.util.AppUtil.msg("呼叫中心产品没指定节点！");
                    var param = {
                        account: account,
                        pbx:''
                    }
                    self._redirectCC2In(param);
                }else{
                    data.account=account;
                    var win = Ext.create('App.view.account.account.selectCCInPbx', {
                        data: data,
                        animateTarget: obj
                    });
                    win.setTitle("选择呼叫中心节点");
                    win.show();
                }
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    showCCOut: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var account= selection.get("_id");
//        console.dir(selection)
        App.util.AppUtil.requestSync('bill.checkCCPbx', {account: account}, function (data, self) {
            if (data.success) {
                var pbx=data.pbx||[];
                if(pbx.length==1){
                    var param = {
                        account: account,
                        pbx:pbx[0].PBX
                    }
                    self._redirectCC2Out(param);
                }else if(pbx.length==0){
//                    App.util.AppUtil.msg("呼叫中心产品没指定节点！");
                    var param = {
                        account: account,
                        pbx:''
                    }
                    self._redirectCC2Out(param);
                }else{
                    data.account=account;
                    var win = Ext.create('App.view.account.account.selectCCOutPbx', {
                        data: data,
                        animateTarget: obj
                    });
                    win.setTitle("选择呼叫中心节点");
                    win.show();
                }
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    redirectCCByPbx: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            var param = {
                account: data.account,
                pbx:data.pbx
            }
            this._redirectCC(param);
        }
    },
    redirectCCInByPbx: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            var param = {
                account: data.account,
                pbx:data.pbx
            }
            this._redirectCC2In(param);
        }
    },
    redirectCCOutByPbx: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            var param = {
                account: data.account,
                pbx:data.pbx
            }
            this._redirectCC2Out(param);
        }
    },
    saveProductConcurrent: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            if(data.maxIn==null){
                data.maxIn=-1;
            }

            var max=data.maxIn;
            var inbound=data.maxInbound;
            if(inbound==-1){
                if(!isNaN(max) && max!=-1){
                    App.util.AppUtil.msg("呼入并发不能设为-1");
                    return;
                }
            }else{
                if(!isNaN(max) && max!=-1 && max<inbound){
                    App.util.AppUtil.msg("呼入并发不能大于最大呼入并发");
                    return;
                }
            }

            App.util.AppUtil.request('bill.account.updateCCConcurrent', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("设置并发成功！");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },


    initProductConcurrent: function (obj) {
        var combox=obj.down("#combox_product_cc_pbx");
        combox.fireEvent("change",combox,combox.getValue());
    },

    showSet400ServiceNo: function (obj) {
        var selection = this.getSn400ManageGrid().getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        App.util.AppUtil.request('bill.resource.getNum400Info', {_id: id}, function (data, self) {
            if (data.success) {
                var win = Ext.create('App.view.account.account.set400SnPrice', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle("400号设置");
                win.show();
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    set400ServiceNumPrice: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            data.dial400Fee = {};
            if(data.local) data.dial400Fee.local = data.local;
            if(data.remote) data.dial400Fee.remote = data.remote;
            if(data.prefixMin) data.dial400Fee.prefixMin = data.prefixMin;
            delete data.local;
            delete data.remote;
            delete data.prefixMin;
            App.util.AppUtil.request('bill.resource.updateNum400', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("更新400号成功！");
                    win.close();
                    self.getSn400ManageGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showSetServiceNo: function (obj) {
        var selection = this.getSnManageGrid().getSelectionModel().getSelection()[0];
        var sn = selection.raw;
        var win = Ext.create('App.view.account.account.setSnPrice', {
            data: sn,
            animateTarget: obj
        });
        win.setTitle(selection.get('_id') + '---->' + '号码配置');
//        if (!sn.endTime) {
//            win.down("#reselect_ServiceNo_button").show();
//        }
        win.show();

//        if (gloab_client_user.identity == 'hp') {
//            var manage = this.getSnManageQueryPanel();
//            var accountId = manage.accountId;
//            App.util.AppUtil.request('app.account.getAccountInfoById', accountId, function (result, self) {
//                if (result.success) {
//                    var win = Ext.create('App.view.account.account.setServiceNo2Hp', {
//                        data: sn,
//                        account: result.row,
//                        animateTarget: obj
//                    });
//                    win.setTitle(selection.get('_id') + '---->' + '号码配置');
//                    win.show();
//                } else {
//                    App.util.AppUtil.msg(result.message);
//                }
//            }, this);
//
//        } else {

//        }
    },
    setServiceNumPrice: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.resource.updateServiceNum', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("设置服务号成功！");
                    win.close();
                    self.getSnManageGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    enableSetSNDockItems: function (selModel, selections) {
        var grid = this.getSnManageGrid();
        //console.dir(grid);
        //console.dir(selections);
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        //console.dir(items);
        for (var i = 0; i < items.length; i++) {
            //console.dir(items[i].needSelect);
            if (items[i].needSelect) {
//                console.dir(selections.length === 0);
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    enableSet400SNDockItems: function (selModel, selections) {
        var grid = this.getSn400ManageGrid();
        var toolbar = grid.child('toolbar[class="dock"]');
        var items = toolbar.items.items;
        for (var i = 0; i < items.length; i++) {
            if (items[i].needSelect) {
                items[i].setDisabled(selections.length === 0);
            }
        }
    },
    /* setSnMonthRent: function (obj) {
     var win = this.getSetServiceNoWin();
     var form = win.down('form');
     if (form.form.isValid()) {
     var manage = this.getAccSnQueryPanel();
     var fieldSet = form.down("fieldset");
     var data = App.util.AppUtil.getFormParam(fieldSet);
     data.account = manage.accountId;
     App.util.AppUtil.request('bill.account.setSnMonthRent', data, function (result, self) {
     if (result.success) {
     App.util.AppUtil.msg("设置月租成功！");
     win.close();
     self.getSnManageGrid().store.load();
     } else {
     App.util.AppUtil.msg(result.message);
     }
     }, this);
     }
     },
     reselectServiceNo: function (src) {
     var win = this.getSetServiceNoWin();
     //        console.dir(win.data);
     App.util.AppUtil.request('bill.account.reSelectServiceNo', win.data, function (result, self) {
     if (result.success) {
     App.util.AppUtil.msg("该号码已释放，请点击“选号”重新选择！");
     win.close();
     self.getSnManageGrid().store.load();
     } else {
     App.util.AppUtil.msg(result.message);
     }
     }, this);
     },*/
    showSetsnLog: function (obj) {
        var win = obj.up('window');
        win.logStore = null;
        var panel = win.getLogViewPanel('monthRent');
        var snPanel = win.down("tabpanel").down('panel#account_serviceno_set_panel');
        snPanel.add(panel);
        obj.setDisabled(true);
    },
    showSetLineLog: function (obj) {
        var win = obj.up('window');
        win.logStore = null;
        var panel = win.getLogViewPanel('hpLine');
        var snPanel = win.down("tabpanel").down('panel#account_line_set_panel');
        snPanel.add(panel);
        obj.setDisabled(true);
    },
    /*    setSnLine: function (src) {
     var win = this.getSetServiceNo2HpWin();
     var form = win.down('form');
     if (form.form.isValid()) {
     var manage = this.getAccSnQueryPanel();
     var fieldSet = form.down("fieldset");
     var data = App.util.AppUtil.getFormParam(fieldSet);
     data.account = manage.accountId;
     App.util.AppUtil.request('bill.hp.setSnLine2Hp', data, function (result, self) {
     if (result.success) {
     App.util.AppUtil.msg("设置成功！");
     win.close();
     self.getSnManageGrid().store.load();
     } else {
     App.util.AppUtil.msg(result.message);
     }
     }, this);
     }
     },*/

    askGwSip: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var accountId = selection.get("_id");

        var win = Ext.create('App.view.account.account.askGatewaySip', {
            accountId: accountId,
            animateTarget: obj
        });
        win.show();
    },
    saveAskGw: function (obj) {
        var win = this.getAskGatewaySipWin();
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.systemUser.saveAskGwSip', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("申请成功，我们会在3个工作日内处理！");
                    var win = self.getAskGatewaySipWin();
                    win.close();
//                    self.getQueryGrid().store.load();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    /*    showPayServiceNo: function (obj) {
     var selection = this.getSnManageGrid().getSelectionModel().getSelection()[0];
     //        var accountItem = this.getQueryGrid().getSelectionModel().getSelection()[0];
     var serviceNo = selection.raw;
     if (!serviceNo.flag) {
     App.util.AppUtil.msg('请先设置号码类型！');
     return;
     }
     App.util.AppUtil.request('bill.account.getServiceNoById', {_id: serviceNo._id}, function (data, self) {
     if (data.success) {
     serviceNo = data.row;
     var billUser = data.user;
     var acc = data.acc;
     serviceNo.billMonthRent = billUser.monthRentPrice;
     serviceNo.billOutCallPrice = billUser.price;
     serviceNo.accOutCallPrice = acc.outCallPrice;
     serviceNo.accOutCallMinutes = acc.outCallMinutes;

     if (serviceNo.status == 'ready') {
     var win = Ext.create('App.view.account.account.buyServiceNo', {
     data: serviceNo,
     animateTarget: obj
     });
     win.setTitle(selection.get('_id') + '---->' + '号码支付');
     win.show();
     } else {
     var win = Ext.create('App.view.account.account.renewServiceNo', {
     data: serviceNo,
     animateTarget: obj
     });
     win.setTitle(selection.get('_id') + '---->' + '号码续费');
     win.show();
     }
     } else {
     App.util.AppUtil.msg(data.message);
     }
     }, this);
     },
     initSnPay: function (panel) {
     var balance = (gloab_client_user.totalFee - gloab_client_user.consume) / 1000 || 0;
     panel.calculateFee(panel.data);
     panel.down("#pay_dialMins").setValue(panel.data.dialMins);
     panel.down("#pay_fee").setValue(panel.data.money);
     panel.down("#bill_pay_fee").setValue(panel.data.billMoney);
     panel.down('#pay_balance').setValue(balance);
     this._initTimer(panel.data.timeout);
     },*/
    destroySnPay: function (obj) {
        window.clearInterval(this.timerHandler);
        this.timerHandler = null;
    },
    /*_initTimer: function (second) {
     var self = this;
     self.countTimer = second || 0;
     self.timerHandler = window.setInterval(function () {
     self._showTimer();
     }, 1000);
     },
     _showTimer: function () {
     var self = this;
     var parent = this.getBuyServiceNoWin();
     var label = parent.down("#pay_tips");
     if (label) {
     //            console.dir(Ext.select('.lock_timer'));
     var txt = App.util.AppUtil.app_timer(self.countTimer);
     var html = '<p>请您在8小时内完成支付，避免被他人抢注，还剩<strong class="lock_timer" style="color: red;">' + txt + '</strong></p>';
     label.update(html);
     }
     self.countTimer--;
     if (self.countTimer < 0) {
     window.clearInterval(self.timerHandler);
     parent.down("#sn_buy_button").setDisabled(true);
     App.util.AppUtil.msg('服务号已超过8小时锁定时间,暂不能支付,将在10分钟后释放');
     }
     },*/
    /*  paySn: function (src) {
     var win = this.getBuyServiceNoWin();
     var form = win.down('form');
     if (form.form.isValid()) {
     var fieldSet = form.down("fieldset");
     var data = App.util.AppUtil.getFormParam(fieldSet);
     data.account = win.data.account;
     if (parseFloat(data.billMoney) > parseFloat(data.balance)) {
     App.util.AppUtil.msg('您的余额不足');
     return;
     }

     App.util.AppUtil.request('bill.account.balancePay', data, function (data, self) {
     if (data.success) {
     self.syncBalance();
     App.util.AppUtil.msg("支付成功！");
     win.close();
     self.getSnManageGrid().store.load();
     } else {
     App.util.AppUtil.msg(data.message);
     }
     }, this);
     }
     },
     initRenewMonth: function (panel) {
     var win = this.getRenewServiceNoWin();
     var balance = (gloab_client_user.totalFee - gloab_client_user.consume) / 1000 || 0;
     win.calculateFee(win.data, true);
     panel.down("#pay_dialMins").setValue(win.data.dialMins);
     panel.down("#pay_fee").setValue(win.data.money);
     panel.down("#bill_pay_fee").setValue(win.data.billMoney);
     panel.down('#pay_balance').setValue(balance);
     },
     initRenewConcurrent: function (panel) {
     var win = this.getRenewServiceNoWin();
     var balance = (gloab_client_user.totalFee - gloab_client_user.consume) / 1000 || 0;
     win.calculateConcurrentFee(win.data, true);
     panel.down("#pay_dialMins_concurrent").setValue(win.data.dialMins);
     panel.down("#pay_fee_concurrent").setValue(win.data.money);
     panel.down("#bill_pay_fee_concurrent").setValue(win.data.billMoney);
     panel.down('#pay_balance_concurrent').setValue(balance);
     },
     initRenewDial: function (panel) {
     var win = this.getRenewServiceNoWin();
     var balance = (gloab_client_user.totalFee - gloab_client_user.consume) / 1000 || 0;
     panel.down("#pay_dialMins_dial").setValue(win.data.accOutCallMinutes);
     panel.down('#pay_balance_dial').setValue(balance);
     },
     renewSn: function (src) {
     var win = this.getRenewServiceNoWin();
     var form = src.up('form');
     if (form.form.isValid()) {
     var fieldSet = form.down("fieldset");
     var data = App.util.AppUtil.getFormParam(fieldSet);
     data.account = win.data.account;
     if (parseFloat(data.billMoney) > parseFloat(data.balance)) {
     App.util.AppUtil.msg('您的余额不足');
     return;
     }
     App.util.AppUtil.request('bill.account.balancePay', data, function (data, self) {
     if (data.success) {
     self.syncBalance();
     App.util.AppUtil.msg("支付成功！");
     win.close();
     self.getSnManageGrid().store.load();
     } else {
     App.util.AppUtil.msg(data.message);
     }
     }, this);
     }
     },*/
    syncBalance: function () {
        var win = Ext.getCmp("main_head_panel");
        var pane = win.down("#user_balance_head");
        App.util.AppUtil.request('bill.account.getSystemInfoById', null, function (data, self) {
            if (data.success) {
                gloab_client_user.balance = data.user.balance;
                var balance = App.util.AppUtil.formatTrueFee(gloab_client_user.balance);
                pane.update('余额：[' + '<span style="color:blue;">' + balance + '</span>' + ']元')
            } else {
                App.util.AppUtil.msg(data.message);
            }
        }, this);
    },
    showPay2AccByProxy: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var identity=gloab_client_user.identity;
//        console.info(identity);
        if(identity=='proxy'){
            var win = Ext.create('App.view.account.account.pay2AccByProxy', {
                account: selection.get("_id"),
                animateTarget: obj
            });
            win.show();
        }else{
            var win = Ext.create('App.view.account.account.pay2AccByUser', {
                account: selection.get("_id"),
                animateTarget: obj
            });
            win.show();
        }
    },
    showDeductionFee: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
            var win = Ext.create('App.view.account.account.deductionFee', {
                account: selection.get("_id"),
                animateTarget: obj
            });
            win.show();
    },
    showBalanceRefund: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var createUser=selection.get("createUser");
        var id=selection.get("_id");
        App.util.AppUtil.request('bill.account.getAccountInfoById',{_id:id},function(data1){
            if(data1.success){
                var account = data1.data;
                if (account.createMethod != 'proxy') {
                    App.util.AppUtil.msg("请选择代理创建的账号！");
                    return;
                }
                App.util.AppUtil.request('bill.account.getSystemUserInfoById',{_id:createUser},function(data){
                    if(data.success){
                        var system = data.data;
                        var win = Ext.create('App.view.account.account.balanceRefund', {
                            _id:selection.get("createUser"),
                            account: selection.get("_id"),
                            companyName:selection.get("companyName"),
                            refundMoney:account.balance,
                            createUser:system.name,
                            animateTarget: obj
                        });
                        win.show();
                    } else {
                        App.util.AppUtil.msg("账户异常！");
                    }
                });
            } else {
                App.util.AppUtil.msg("账户异常！");
            }
        });
    },
    deductCCMinConsume: function (obj) {
        if(!confirm("确认补扣低消吗?")){
            return;
        }
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var accountId=selection.get("_id");

        App.util.AppUtil.request('bill.account.deductCCMinConsume',{account:accountId},function(data){
            if(data.success){
                App.util.AppUtil.msg("补扣低消成功");
            } else {
                App.util.AppUtil.msg(data.message);
            }
        });

    },
    backoutCCMinConsume: function (obj) {
        if(!confirm("确认撤销低消吗?")){
            return;
        }

        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var accountId=selection.get("_id");

        App.util.AppUtil.request('bill.account.backoutCCMinConsume',{account:accountId},function(data){
            if(data.success){
                App.util.AppUtil.msg("撤销低消成功");
            } else {
                App.util.AppUtil.msg(data.message);
            }
        });
    },
    showTurnBalance: function(obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.account.account.turnBalance',{
            account: selection.get("_id"),
            animateTarget: obj
        });
        win.show();
    },
    showCallSum: function(obj) {
       // var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var grid = this.getProductManagerWin().down("#account_product_grid");
        var selection = grid.getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.account.account.callSum',{
            account: selection.get("account"),
            animateTarget: obj
        });
        win.show();
    },
    openCallSum: function(obj) {
        //var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var grid = this.getProductManagerWin().down("#account_product_grid");
        var selection = grid.getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.account.account.singleCallSum',{
            account: selection.get("account"),
            animateTarget: obj
        });
        win.show();
    },

    turnBalance:function(obj){
        var win = obj.up("window");
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.turnBalance', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("退费成功！");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showBorrowAccount: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
            var win = Ext.create('App.view.account.account.borrowAccount', {
                account: selection.get("_id"),
                animateTarget: obj
            });
            win.show();
    },
    borrowAccount:function(obj){
        var win = obj.up("window");
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.borrowAccount', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("拆借成功！");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    findCompanyNameByAccountName : function(obj,value){
        var name = value;
        App.util.AppUtil.request('bill.account.getAccountInfoById',{name:name},function(data){
            var fieldset = obj.up("fieldset");
            if(data.success){
                var account = data.data;
                    fieldset.down("[name='companyName']").setValue(account.companyName);
            } else {
                fieldset.down("[name='companyName']").setValue("");
            }
        });
    },
    showBindFinanceAccount: function (obj) {
        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var win = Ext.create('App.view.account.account.bindFinanceAccount', {
            account: selection.get("_id"),
            animateTarget: obj
        });
        win.show();
    },
    bindFinanceAccount: function (obj) {
        var win = obj.up("window");
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.bindFinanceAccount', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("绑定财务账号成功！");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    unBindFinanceAccount: function (obj) {
        if(!confirm("确认解绑财务账户吗?")){
            return;
        }

        var selection = this.getQueryGrid().getSelectionModel().getSelection()[0];
        var accountId = selection.get("_id");

        App.util.AppUtil.request('bill.account.unbindFinanceAccount',{ account:accountId },function(data) {
            if(data.success){
                App.util.AppUtil.msg("解绑财务账户成功");
            } else {
                App.util.AppUtil.msg(data.message);
            }
        });
    },
    findCompanyNameByFinanceAccountName: function (obj, value) {
        var name = value;
        App.util.AppUtil.request('bill.account.getFinanceAccountInfoById',{name:name},function(data){
            var fieldset = obj.up("fieldset");
            if(data.success){
                var account = data.data;
                fieldset.down("[name='companyName']").setValue(account.companyName);
                fieldset.down("[name='financeAccount']").setValue(account._id);
            } else {
                fieldset.down("[name='companyName']").setValue("");
            }
        });
    },
    balanceRefund:function(obj){
        var win = obj.up("window");
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.balanceRefund', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("余额清退成功！");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    supplementDeductionMinConsume:function(obj){
        var win = obj.up("window");
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.supplementDeductionMinConsume', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("补扣低消成功！");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    revocationMinConsume:function(obj){
        var win = obj.up("window");
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.revocationMinConsume', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("撤销低消成功！");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    pay2AccByProxy: function (obj) {
        var win = obj.up("window");
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.pay2AccByProxy', data, function (data, self) {
                if (data.success) {
                    self.syncBalance();
                    App.util.AppUtil.msg("给账号充值成功！");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    pay2AccByUser:function(obj){
        var win = obj.up("window");
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.pay2AccByUser', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("给账号充值成功！");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    deductionFeeByUser:function(obj){
        var win = obj.up("window");
        var form = win.down('form');
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.deductionFeeByUser', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("账号扣费成功！");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showProductMinConsumeSet:function(obj){
        var grid = this.getProductManagerWin().down("#account_product_grid");
        var selection = grid.getSelectionModel().getSelection()[0];
        var id=selection.get("_id");
        App.util.AppUtil.request('bill.account.getAccountProductById',{_id:id},function(data,self){
            if(data.success){
                var product=data.data;
                var win = Ext.create('App.view.account.account.setProductMinConsume', {
                    data: {
                        _id:product._id,
                        minConsume:product.minConsume
                    },
                    animateTarget: obj
                });
                win.setTitle(App.util.AppUtil.getRendererValue(selection.get('product'), "product")+'-->低消设置');
                win.show();
            } else {
                App.util.AppUtil.msg("获取产品信息失败！");
            }
        },this);
    },
    saveProductMinConsume: function (obj) {
        var win = obj.up("window");
        var getThis=this;
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.setProductMinConsume', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("低消费用设置成功！");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showProductRecordSet:function(obj){
        var grid = this.getProductManagerWin().down("#account_product_grid");
        var selection = grid.getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        App.util.AppUtil.request('bill.account.getAccountProductById',{_id:id},function(data,self){
            if(data.success){
                var product=data.data;
                if(product.product=='zj'){
                    var win = Ext.create('App.view.account.account.setProductRecord', {
                        data: data.data,
                        animateTarget: obj,
                        product:product
                    });
                    win.setTitle(App.util.AppUtil.getRendererValue(selection.get('product'), "product")+'-->录音设置');
                    win.show();
                }else{
                    var win = Ext.create('App.view.account.account.setCCRecord', {
                        data: data.data,
                        animateTarget: obj
                    });
                    win.setTitle(App.util.AppUtil.getRendererValue(selection.get('product'), "product")+'-->录音设置');
                    win.show();
                }
            } else {
                App.util.AppUtil.msg("获取产品信息失败！");
            }
        },this);
    },
    saveProductRecord: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.setIsRecord', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("录音设置成功！");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    saveCCRecord: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            data.isRecord=data.isRecording.isRecord;
            var returnMsg;
            App.util.AppUtil.requestSync('bill.account.setCCRecord', data, function (data, self) {
                returnMsg=data.success;
            }, this);
            if(returnMsg){
                App.util.AppUtil.request('bill.account.setCCRecordRights', data, function (data, self) {
                    if (data.success) {
                        App.util.AppUtil.msg("录音设置成功！");
                        win.close();
                    } else {
                        App.util.AppUtil.msg(data.message);
                    }
                }, this);
            }

      /*      App.util.AppUtil.request('bill.account.setCCRecord', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("录音设置成功！");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);*/
        }
    },
    showProductCdrSet:function(obj){
        var grid = this.getProductManagerWin().down("#account_product_grid");
        var selection = grid.getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        var product = selection.get("product");
        if(product=='zj'){
            App.util.AppUtil.msg("请选择呼叫中心产品！");
            return;
        }
        App.util.AppUtil.request('bill.account.getAccountProductById',{_id:id},function(data,self){
            if(data.success){
                var product=data.data;
                var win = Ext.create('App.view.account.account.setCdrDay', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle(App.util.AppUtil.getRendererValue(selection.get('product'), "product")+'-->通话记录设置');
                win.show();
            } else {
                App.util.AppUtil.msg("获取产品信息失败！");
            }
        },this);
    },
    showProductSmsChannelSet:function(obj){
        var grid = this.getProductManagerWin().down("#account_product_grid");
        var selection = grid.getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        App.util.AppUtil.request('bill.account.getAccountProductById',{_id:id},function(data,self){
            if(data.success){
                var win = Ext.create('App.view.account.account.setSmsChannel', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle(App.util.AppUtil.getRendererValue(selection.get('product'), "product")+'-->短信通道设置');
                win.show();
            } else {
                App.util.AppUtil.msg("获取产品信息失败！");
            }
        },this);
    },
    saveProductSmsChannel : function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.setSmsChannel', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("短信通道设置成功！");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    initProductMoreSnParam: function (obj) {
        var isMoreSn=obj.data.isMoreSn;
        if(typeof(isMoreSn)=='undefined' || isMoreSn==null ){
            isMoreSn=false;
        }
        isMoreSn=isMoreSn==true?"true":"false";
        var group=obj.down("#ZJ_isMoreSn");
        group.setValue({'isMoreSn':isMoreSn});
    },
    showProductMoreSnSet:function(obj){
        var grid = this.getProductManagerWin().down("#account_product_grid");
        var selection = grid.getSelectionModel().getSelection()[0];
        var id = selection.get("_id");
        var product = selection.get("product");
        if(product != 'zj'){
            App.util.AppUtil.msg("请选择企业总机产品！");
            return;
        }
        App.util.AppUtil.request('bill.account.getAccountProductById',{_id:id},function(data,self){
            if(data.success){
                var product=data.data;
                var win = Ext.create('App.view.account.account.setMoreSn', {
                    data: data.data,
                    animateTarget: obj
                });
                win.setTitle(App.util.AppUtil.getRendererValue(selection.get('product'), "product")+'-->多服务号呼入设置');
                win.show();
            } else {
                App.util.AppUtil.msg("获取产品信息失败！");
            }
        },this);
    },
    saveProductMoreSn : function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.setZJMoreSn', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("企业总机多服务号呼入设置成功！");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    saveProductCdr: function (obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            App.util.AppUtil.request('bill.account.setCCCdrDay', data, function (data, self) {
                if (data.success) {
                    App.util.AppUtil.msg("通话记录设置成功！");
                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    initProductCdrParam: function (obj) {
        var cdrClearKeepDealing=obj.data.cdrClearKeepDealing;
        if(typeof(cdrClearKeepDealing)=='undefined' || cdrClearKeepDealing==null ){
            cdrClearKeepDealing=false;
        }
        cdrClearKeepDealing=cdrClearKeepDealing==true?"true":"false";
        var group=obj.down("#cdrSet_cdrClearKeepDealing");
        group.setValue({'cdrClearKeepDealing':cdrClearKeepDealing});
    },
    showProductZJLineSet: function(obj) {
        var selected = this.getOpenProductGrid().getSelectionModel().getSelection()[0];
        if(!selected){
            //有问题
            return;
        }
        var win = Ext.create('App.view.account.account.setZJLine',{
            zjProductModel:selected,
            animateTarget: obj,
        });
        win.show();
    },
    saveProductZJLineSet: function(obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            var grid = this.getOpenProductGrid();
            App.util.AppUtil.request('bill.account.setZJLine', data, function (res, self) {
                if (res.success) {
                    App.util.AppUtil.msg("总机线路设置成功！");

                    var selected = grid.getSelectionModel().getSelection()[0];
                    selected.set('zjOutRoute',data.zjOutRoute);
                    selected.set('zjTransferRoute',data.zjTransferRoute);
                    selected.commit();


                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    showSmsPwdSet : function(obj) {
        var selected = this.getOpenProductGrid().getSelectionModel().getSelection()[0];
        if(!selected){
            return;
        }
        var win = Ext.create('App.view.account.account.setSmsPwd',{
            productModel:selected,
            animateTarget: obj,
        });
        win.show();
    },
    showSmsPwdDispatchSet : function(obj){
        var selected = this.getOpenProductGrid().getSelectionModel().getSelection()[0];
        if(!selected){
            return;
        }
        var win = Ext.create('App.view.account.account.setSmsDispatch',{
            productModel:selected,
            animateTarget: obj,
        });
        win.show();
    },
    saveProductSmsPwd: function(obj) {
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            var grid = this.getOpenProductGrid();
            App.util.AppUtil.request('bill.account.setSmsPwd', data, function (res, self) {
                if (res.success) {
                    App.util.AppUtil.msg("短信接口密码串设置成功！");

                    var selected = grid.getSelectionModel().getSelection()[0];
                    selected.set('templateSmsInterfacePassword',data.templateSmsInterfacePassword);
                    selected.commit();


                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    },
    saveProductSmsDispatch: function(obj){
        var win = obj.up("window");
        var form = win.down("form");
        if (form.form.isValid()) {
            var fieldset = form.down('fieldset');
            var data = App.util.AppUtil.getFormParam(fieldset);
            var grid = this.getOpenProductGrid();
            App.util.AppUtil.request('bill.account.setSmsDispatch', data, function (res, self) {
                if (res.success) {
                    App.util.AppUtil.msg("短信推送设置成功！");

                    var selected = grid.getSelectionModel().getSelection()[0];
                    selected.set('sms_dispatch_url',data.sms_dispatch_url);
                    selected.set('open_sms_dispatch',data.open_sms_dispatch)
                    selected.commit();


                    win.close();
                } else {
                    App.util.AppUtil.msg(data.message);
                }
            }, this);
        }
    }

});
