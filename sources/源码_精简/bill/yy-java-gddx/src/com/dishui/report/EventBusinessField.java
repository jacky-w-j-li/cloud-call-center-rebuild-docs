package com.dishui.report;

/**
 * Created by jackwong on 16/1/12.
 */
public class EventBusinessField {
    /**
     * 消费结算业务字段
     */
    public static final String CHARGE_MONEY = "money";// 消费金额

    public static final String CHARGE_PRODUCT = "product";//消费产品: 总机 呼叫中心...
    public static final String CHARGE_PRODUCT_ZJ = "zj";
    public static final String CHARGE_PRODUCT_CC = "cc";
    public static final String CHARGE_PRODUCT_SMS = "sms";
    public static final String CHARGE_PRODUCT_FLOW = "flow";
    public static final String CHARGE_PRODUCT_VOICE = "voice";

    public static final String COMPLETE_CALL_MILLISECONDS = "milliseconds";
    public static final String COMPLETE_CALL_LINE = "line";


    /**
     * 运营成本结算
     */
    public static final String CHARGE_COST_PRODUCT = "product";//运营成本计算的产品

    public static final String CHARGE_COST_COST = "cost";// 运营成本金额

    public static final String CHARGE_COST_TOTALFEE = "totalFee";//用户资费=成本+利润
}
