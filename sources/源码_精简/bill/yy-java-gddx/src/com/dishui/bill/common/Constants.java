package com.dishui.bill.common;

/**
 * Created by jackwong on 16/3/7.
 */
public interface Constants {
    String DB_BILL = "bill";
    String DB_BILL_DATA = "bill_data";

    String DB_COLLECTION_PLATFORM_INTL = "platform_intl";
    String DB_COLLECTION_PLATFORM_ACCOUNT_PRODUCT = "platform_account_product";
    String DB_COLLECTION_PLATFORM_ACCOUNT = "platform_account";
    String DB_COLLECTION_PLATFORM_ACCOUNT_OWE_FEE = "platform_account_owe_fee";
    String DB_COLLECTION_SYSTEM_USER = "bill_system_user";
    String DB_COLLECTION_BILL_CALL_CONSUME = "bill_call_consume";
    String DB_COLLECTION_PLATFORM_ACCOUNT_PAY_CONSUME = "platform_account_pay_consume";

    String DB_COLLECTION_BILL_USER_PAY = "bill_user_pay";

    String DB_COLLECTION_USER_PAY = "user_pay";
    String CUSTFEE_STATE_STOP = "stop";
    String CUSTFEE_STATE_NORMAL = "normal";
    String CUSTFEE_PRICE_PERIOD_YEAR = "year";
    String CUSTFEE_PRICE_PERIOD_MONTH = "month";

    String CUSTFEE_PRICE_PERIOD_WEEK = "week";
    String CUSTFEE_PRICE_PERIOD_DAY = "day";
    String CUSTFEE_PRICE_PERIOD_HOUR = "hour";

    String PAY_TYPE_BALANCE = "balance";
    String PAY_FLAG_DEDUCT_CUSTFEE = "deductCustFee";

    String PROXY_SOURCE_CUSTFEE = "custFee";
    String PRODUCT_CUSTFEE = "custFee";
    String PRODUCT_CC = "cc";

    String PRODUCT_400 = "400";
    String SYSTEM_USER_IDENTITY_PROXY = "proxy";
    String SYSTEM_USER_STATUS_ENABLE = "enable";

    String PROXY_TYPE_CHANNEL = "channel";
    String PROXY_OWE_FEE_TYPE_MINCONSUME = "minConsume";
    String PROXY_OWE_FEE_STATUS_DEAL = "deal";
    String PROXY_OWE_FEE_STATUS_NO_DEAL = "nodeal";
}
