var constants = {
    /*运维角色id"ac2b1e90-22cb-11e4-98b0-afd2ca705c70"*/
    identitys:["admin",/*运维身份*/"operation"],
    currentPriceMin:10,
    DB_IP : 'ip',
    DB_BILL_DATA : 'bill_data',
    DB: {
        system_user: "bill_system_user",
        system_user_standard_price_config: 'bill_system_user_standard_price_config',
        system_user_limit: "bill_system_user_limit",
        system_user_role: "bill_system_user_role",
        system_session: "bill_system_session",
        system_menu: "bill_system_menu",
        access_ip: "access_ip",
        db_master: "db_master",
        bill_operate_log: "bill_operate_log",
        system_general_codes: "bill_system_general_codes",
        platform_product: "platform_product",
        platform_account_product: "platform_account_product",
        platform_account: "platform_account",
        platform_account_pay_consume: "platform_account_pay_consume",
        // platform_account_type: "platform_account_type",
        // platform_license: "platform_license",
        platform_license: "platform_licence",
        platform_license_op_record: "platform_license_op_record",
        platform_user: "platform_user",
        platform_department: "platform_department",
        platform_serviceNum: "platform_serviceNum",
        platform_approve_serviceNum: "platform_approve_serviceNum",
        platform_num400: "platform_num400",
        platform_pbx: "platform_pbx",
        platform_cc_pbx: "platform_cc_pbx",
        platform_sipNum: "platform_sipNum",
        platform_queue: "platform_queue",
        platform_location: "platform_location",
        platform_building: "platform_building",
        platform_board: "platform_board",
        platform_cc_board: "platform_cc_board",
        platform_cc_board_outRoute: "platform_cc_board_outRoute",
        platform_cc_board_outLine: "platform_cc_board_outLine",
        platform_cc_board_inRoute: "platform_cc_board_inRoute",
        platform_cc_board_server: "platform_cc_board_server",
        platform_board_outRoute: "platform_board_outRoute",
        platform_board_outLine: "platform_board_outLine",
        platform_board_inRoute: "platform_board_inRoute",
        platform_board_server: "platform_board_server",
        platform_line: "platform_line",
        platform_hangUp_sms_template : "platform_hangUp_sms_template",
        //wwh
        platform_sp:"platform_sp",
        platform_logo:"platform_logo",
        platform_account_balance: "platform_account_balance",
        bill_system_mail_send: "bill_system_mail_send",
        bill_system_mail_config: "bill_system_mail_config",
        bill_platform_mail_register: "bill_platform_mail_register",
        bill_platform_mail_register_url_click_log: "bill_platform_mail_register_url_click_log",
        bill_platform_mail_exclude : "bill_platform_mail_exclude",
        bill_platform_image_verity : "bill_platform_image_verity",
        user_serviceno_record: "user_serviceno_record",
        bill_test_renew_record: "bill_test_renew_record",
        log_adjust_licence:"log_adjust_licence",
        user_pay: "user_pay",
        bill_user_pay: "bill_user_pay",
        bill_call_income:"bill_call_income",
        bill_400_income:"bill_400_income",
        bill_call_proxy_detail:"bill_call_proxy_detail",
        bill_400_proxy_detail:"bill_400_proxy_detail",
        platform_weixin_config: "platform_weixin_config",
        platform_weixin_user: "platform_weixin_user",
        platform_voicemail: "platform_voicemail",
        platform_autocall: "platform_autocall",
        platform_autofax: "platform_autofax",
        user_import_task: "user_import_task",
        platform_cdr: "platform_cdr",
        bill_system_user_operate_log: "bill_system_user_operate_log",
        bill_user_withdraw: "bill_user_withdraw",
        bill_user_payee: "bill_user_payee",
        user_bank_pay: "user_bank_pay",
        bill_customerCare_pay: "bill_customerCare_pay",
        bill_consultant_pay: "bill_consultant_pay",
        bill_user_bank_pay: "bill_user_bank_pay",
        bill_user_askgwsip: "bill_user_askgwsip",
        bill_hp_line: "bill_hp_line",
        platform_400_mail: "platform_400_mail",
        platform_licence: "platform_licence",
        platform_ivr: "platform_ivr",
        bill_call_consume: "bill_call_consume",
        bill_cdr_query_zj: "bill_cdr_query_zj",
        bill_cdr_query_cc : "bill_cdr_query_cc",
        bill_cdr_query_400: "bill_cdr_query_400",
        //wwh
        bill_report_business_week:"bill_report_business_week",
        //reportmonth
        bill_report_business_month : "bill_report_business_month",
        bill_report_sales_area_week : "bill_report_sales_area_week",
        bill_report_sales_area_month : "bill_report_sales_area_month",
        bill_report_proxy_global:"bill_report_proxy_global",
        bill_report_channel_analyse:"bill_report_channel_analyse",
        bill_sales_personal_month:"bill_sales_personal_month",
        bill_sales_personal_season:"bill_sales_personal_season",
        bill_incomAnalysis_month:"bill_incomAnalysis_month",
        bill_call_line:"bill_call_line",
        bill_call_line_detail:"bill_call_line_detail",
        app_sms_sign:"app_sms_sign",
        app_sms_template:"app_sms_template",
        app_sms_edit:"app_sms_edit",
        app_sms_send:"app_sms_send",
        platform_sms_channel:"platform_sms_channel",
        platform_intl: 'platform_intl',
        platform_serviceNum_whitelist: 'platform_serviceNum_whitelist',
        platform_industry : 'platform_industry',
        bill_sms_proxy_detail:"bill_sms_proxy_detail",
        bill_sms_consume:"bill_sms_consume",
        bill_voiceVerify_consume:'bill_voiceVerify_consume',
        bill_voiceVerify_detail:"bill_voiceVerify_detail",
        bill_flow_consume:"bill_flow_consume",
        bill_flow_detail:"bill_flow_detail",
        bill_sms_detail_cc:"bill_sms_detail_cc",
        bill_sms_detail_zj:"bill_sms_detail_zj",
        bill_ytx_template_id : "ytx_template_id",

        cc_c5_call_sheet:"_c5_call_sheet",
        cc_app_role : "app_role",
        cc_app_default_role : "app_default_role",
        cc_app_optiondic: "app_optiondic",
        cc_manager_quality_check_config :"manager_quality_check_config",
        web_site_try_out: "web_site_try_out",
        web_site_cdr_count: "web_site_cdr_count",
        web_site_count: "web_site_count",
        web_site_video_count: "web_site_video_count",
        platform_hangUp_sms_template: "platform_hangUp_sms_template",

        bill_system_param :"bill_system_param",
        log_adjust_concurrent :"log_adjust_concurrent",
        log_enable_serviceNum :"log_enable_serviceNum",
        bill_notify :"bill_notify",
        platform_account_owe_fee :"platform_account_owe_fee",

        log_filingYun :"log_filingYun",
        bill_open_intlfee:"bill_open_intlfee",
        platform_sms_channel: "platform_sms_channel",
        platform_group_account_relation: "platform_group_account_relation",
        im_contacts_version: "im_contacts_version",
        app_session: "app_session",

        bill_invoice_addr: "bill_invoice_addr",
        bill_invoice_info: "bill_invoice_info",
        bill_invoice: "bill_invoice",
        voiceVerify_displayNum:"voiceVerify_displayNum",
        ytx_sms_template:"ytx_template_id",
        call_count_set : "call_count_set",

        cc:{
            app_sms_sign : "app_sms_sign",
            app_sms_send : "app_sms_send",
            app_sms_template : "app_sms_template",
            app_sms_template_to_check : "app_sms_template_to_check",
			access_ip: "access_ip",

            app_customer_pool : "app_customer_pool",
            app_customer_approval : "app_customer_approval",
            app_sms_template : "app_sms_template",
            redis_db0:"0"
        },
        ip:{
            ip_pool: 'ip_pool',
            ip_config: 'ip_config'
        },

        bill_display_num_record : 'bill_display_num_record'
    },
    accountCreateMethod: {
        bill: "bill",
        web: "register",
        proxy: "proxy"
    },
    identity:{

        proxy: 'proxy'
    },
    accountStatus: {
        newTry: "newTry",
        normal: "normal",
        stop: "stop",
        free : "free", //空闲
        try : "try"
    },
    serviceNumStatus: {
        free: "free",
        use: "use",
        use400: "use400",
        ready: "ready",
        present:"present",
        try: "try",
        stop: "stop",
        stopTry: "stopTry",
        waitPay: "waitPay",
        stopWaitPay: "stopWaitPay",
        verify:"verify"
    },
    serviceNumType: {
        try: "try",
        normal: "normal"
    },
    pbxSataus: {
        enable: "enable",
        disable: "disable"
    },
    operateLog: {
        overdraw: "overdraw",
        outCallPrice: "outCallPrice",
        balanceAlert: "balanceAlert",
        monthRent: "monthRent",
        hpLine: "hpLine"
    },
    serviceNumFlag: {
        service: 'service',
        didnum: 'didnum',
        num400: '400'
    },
    payType: {
        balance: 'balance',
        online: 'online',
        mix: 'mix'
    },
    proxyType:{
        channel: 'channel',
        zj : 'other'
    },
    payFlag: {
        snRenew: 'snRenew',
        buyConcurrent: 'buyConcurrent',
        buySn: 'buySn',
        buyDialMin: 'buyDialMin',
        buy400Min: 'buy400Min',
        pay: 'pay',
        turnBalance:'turnBalance',
        payAccount: 'payAccount',
        payAccByBill: 'payAccByBill',
        buyLicence: 'buyLicence',
        renewLicence: 'renewLicence',
        adjustLicenceNum: 'adjustLicenceNum',
        backoutPay: 'backoutPay',
        addUseLicence:'addUseLicence',
        buyMinConsumeBalance:'buyMinConsumeBalance',

        deductMonthRent:"deductMonthRent",

        payCallZJMin: 'payCallZJMin',
        payCallCCMin: 'payCallCCMin',
        payCall400Min: 'payCall400Min',

        renewCustFee:'renewCustFee',
        deductCustFee:'deductCustFee'
    },
    dedcutUserPayType:{
        work : 'workPay',
        hardware : 'hardwarePay',
        other : 'otherPay',
        tape : 'tapePay',
        backout: 'backoutPay'
    },
    proxySource: {
        serviceNo: 'serviceNo',
        licence: 'licence',
        payCallFee: 'payCallFee',
        payCall400Fee: 'payCall400Fee',

        pay: 'pay',
        payAccount: 'payAccount',
        proxyWithDraw: 'proxyWithDraw',
        systemPay: 'systemPay',
        backoutPay: 'backoutPay',

        payCallMin: 'payCallMin',//低消
        supplementDuction:'supplementDuction',
        revocationMinConsume:'revocationMinConsume',
        oweFee: 'oweFee',

        paySmsFee: 'paySmsFee',//短信收入,

        custFee: 'custFee'//自定义扣费收入
    },
    customerCareSource: {
        payAccount: 'payAccount',
        withdraw : 'withdraw'
    },
    consultantSource: {
        payAccount: 'payAccount',
        withdraw : 'withdraw'
    },
    weixinUserStatus: {
        new: "new",
        waitValid: "waitValid",
        valid: "valid"
    },
    systemUserSataus: {
        enable: "enable",
        disable: "disable"
    },
    systemUserOperateLog: {
        fee: "fee"
    },
    systemUserIndentity: {
        admin: 'admin',
        proxy: 'proxy',
        hp: 'hp',
        customerCare: 'customerCare'
//        normal:'normal'
    },
    withdrawStatus: {
        send: "send",
        revert: "revert",
        finish: "finish"
    },
    dialFeeStrategy: {
        minute: "minute",
        second6: "second6",
        minute3: "minute3"
    },
    product: {
        cc: "cc",
        zj: "zj",
        sp:"sp",
        ll:"ll",
        yy:'yy',
        custFee:'custFee'
    },
    licenceType: {
        enterprise: "enterprise",
        outcall: "outcall",
        monitor: "monitor",
        standard:'standard',
        service : 'service',
        service_p : "service_p"
    },
    licenceStatus: {
        use: "use",
        try: "try",
        present:"present"
    }

}

module.exports = constants;
