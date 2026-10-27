package com.dishui.manager.report.model;

/**
 * Created by chenguang on 11/11/15.
 */
public class EventType {
    //事件类型都在这里定义常量
    public static final String BUS_NEW_BUSINESS = "newBusiness";
    public static final String BUS_NEXT_STEP_BUSINESS = "nextStepBusiness";
    public static final String BUS_CANCEL_BUSINESS = "cancelBusiness";
    public static final String BUS_FINISH_BUSINESS = "finishBusiness";
    public static final String BUS_PICK_BUSINESS = "pickBusiness";
    public static final String BUS_ASSIGN_BUSINESS ="assignBusiness";

    public static final String IM_NEW_VISITOR = "newVisitor";
    public static final String IM_NEW_SESSION = "newSession";
    public static final String IM_NEW_MSG_IN = "msgIn";
    public static final String IM_NEW_MSG_OUT = "msgOut";
    public static final String IM_REDIRECT_SESSION = "redirectSession";
    public static final String IM_CONVERT_MANUAL = "convertManual";
    public static final String IM_FIRST_REPLY = "firstReply";
    public static final String IM_CLOSE_SESSION = "closeSession";
    public static final String IM_ACCESS_SESSION = "accessSession";
    public static final String IM_AUTO_CLAIM_STATUS = "autoClaimStatus";
    public static final String IM_SOCKET_PUSH_CONNECTED= "socketPushConnected";
    public static final String IM_CSR= "im_csr";
    public static final String IM_LOST_SESSION= "lostSession";

    //TODO
    public static final String IM_REDUCE_SESSION = "reduceSession";
    
    //邮件模块报表事件
    public static final String MAIL_NEW_SESSION = "newMailSession";
    public static final String MAIL_NEW_OUT = "mailOut";
    public static final String MAIL_REDIRECT_SESSION = "mailRedirectSession";
    public static final String MAIL_FIRST_REPLY = "mailFirstReply";
    public static final String MAIL_CLOSE_SESSION = "mailCloseSession";
    public static final String MAIL_ACCESS_SESSION = "mailSessionAccess";
    public static final String MAIL_AUTO_CLAIM_LENGTH = "mailAutoClaimLength";
    public static final String MAIL_SOCKET_PUSH_DISCONNECT = "mailSocketPushDisconnected";
    //邮件监控时间
    public static final String MAIL_AUTO_CLAIM_MONITOR = "mailAutoClaimMonitor";

    /**
     * 问卷调查回访状态报表
     */
    public final static String QUES_COMPLATE = "ques_complate";

    //customer
    public static final String CUST_ADD ="addCust";
    public static final String CUST_UPDATE = "updateCust";
    public static final String CUST_UPDATE_STATUS = "updateCustStatus";
    public static final String CUST_UPDATE_SOURCE = "updateCustSource";
    public static final String CUST_UPDATE_OWNER = "updateCustOwner";
    public static final String CUST_DEL = "delCust";
    public static final String CUST_MERGE = "mergeCust";
    public static final String CUST_UPDATE_CONTACT_STATUS = "updateCustContact";//跟进状态
    public static final String CUST_UPDATE_CATEGORY = "updateCustCategory";//分类

}
