package com.dishui.manager.report.model;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Created by yaxi on 15-11-10.
 */
public class Constant {
    public final static String EVENT_TABLE = "app_report_event";
    public final static String BILL_EVENT_TABLE = "bill_report_event";
    public final static String CDR_EVENT_TABLE = "cdr_report_event";
    public final static String CUSTOMER_EVENT_TABLE = "customer_report_event";

    public final static String SYS_TASK_EVENT_CONTROL = "sys_task_event_control";

    public final static String PLATFORM_ACCOUNT_PRODUCT_TABLE = "platform_account_product";

    /**
     * 在线客服消息报表
     */
    public final static String IM_MESSAGE_REPORT_TABLE = "cc_im_message_report";

    /**
     * 在线客服业务报表
     */
    public final static String IM_BUSINESS_REPORT_TABLE = "cc_im_business_report";

    /**
     * 在线客服接入号报表
     */
    public final static String IM_ACCESSID_REPORT_TABLE = "cc_im_access_report";

    /**
     * 在线客服座席报表
     */
    public final static String IM_AGENT_REPORT_TABLE = "cc_im_agent_report";
    public final static String IM_ACCESS_REPORT = "cc_im_access_report";

    public final static String CUSTOMER_INCREASE_REPORT_TABLE = "cc_customer_increase_report";
    public final static String CUSTOMER_STATUS_REPORT_TABLE = "cc_customer_status_report";
    public final static String CUSTOMER_SALES_REPORT_TABLE = "cc_customer_sales_report";
    public final static String CUSTOMER_OPPORTUNITY_REPORT_TABLE = "cc_customer_opportunity_report";
    public final static String CUSTOMER_COMMON_REPORT_TABLE = "cc_customer_common_report";
    public final static String CUSTOMER_COMMON_USER_REPORT_TABLE = "cc_customer_common_user_report";
    public final static String BUSINESS_ANALYSE_REPORT_TABLE = "cc_business_analyse_report";
    public final static String BUSINESS_AGENT_REPORT_TABLE = "cc_business_agent_report";
    /**
     * 在线客服坐席满意度报表
     */
    public final static String CC_IM_CSR_REPORT = "cc_im_csr_report";
    
    
    /**
     * 问卷调查回访状态报表
     */
    public final static String CC_QUES_RESULT_REPORT = "cc_ques_result_report";
    /**
     * 问卷调查问题明细报表
     */
    public final static String CC_QUES_ANSWSER_REPORT = "cc_ques_anwser_report";
    
    
    /**
     * 邮件坐席工作量报表
     */
    public final static String MAIL_AGENT_REPORT_TABLE = "cc_mail_agent_report";
    

    /**
     * 运营系统报表
     */
    public final static String BILL_SALES_CHECK_REPORT_TABLE = "bill_sales_check_report";

    public final static String BILL_OPER_MONTH_REPORT_TABLE = "bill_oper_month_report";
    public static final String BILL_OPER_MONTH_REPORT_CHARGE_ACCOUNT_TABLE = "bill_oper_month_report_charge_account";

    public static final String BILL_OPER_ACCOUNT_PAY_CHARGE_REPORT_TABLE = "bill_oper_account_pay_charge_report";

    public final static String BILL_SALES_AREA_REPORT_TABLE = "bill_sales_area_report";

    public final static String BILL_SALES_PERSONAL_REPORT_TABLE = "bill_sales_personal_report";

    public final static String BILL_CHANNEL_PROXY_ALL_REPORT_TABLE = "bill_channel_proxy_all_report";

    public final static String BILL_CHANNEL_PROXY_ANALYSE_REPORT_TABLE = "bill_channel_proxy_analyse_report";

    /**
     * 运维报表
     */
    public static final String BILL_MAINTENANCE_TELETRAFFIC_REPORT_TABLE = "bill_maintenance_teletraffic_report_table";

    /**
     * 应用库中表名
     */
    public final static String APP_PUSH_CLIENT = "app_push_client";
    public final static String APP_MULTI_CHANNEL_CHAT_SESSION = "app_multi_channel_chat_session";

    public final static String APP_PLATFORM_ACCOUNT = "platform_account";
    public final static String APP_PLATFORM_LICENCE = "platform_licence";
    public final static String APP_PLATFORM_ACCOUNT_PAY_CONSUME = "platform_account_pay_consume";
    public final static String APP_BILL_SYSTEM_USER = "bill_system_user";
    public final static String APP_BILL_USER_PAY = "bill_user_pay";
    public final static String APP_MANAGER_QUALITY_CHECK_CYCLE_CONFIG = "manager_quality_check_cycle_config";
    

    public final static String APP_USER_BANK_PAY = "user_bank_pay";

    /**
     * 销售区域(proxyType)
     */
    public static final List<String> AREA_LIST = Collections.unmodifiableList(Arrays.asList("mysales","hd","hn","channel","other","UNKOWN"));

}
