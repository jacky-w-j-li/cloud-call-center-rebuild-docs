package com.dishui.bill.db.model;

import com.dishui.bill.service.Utils;
import com.mongodb.BasicDBList;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by jackwong on 16/3/17.
 */

/*
{
    "_id" : "N00000000428_cc",
    "product" : "cc",
    "account" : "N00000000428",
    "dialFee" : {
        "local" : 1500,
        "remote" : 1500,
        "localTel" : 1500,
        "remoteTel" : 1500
    },
    "transferFee" : {
        "local" : 1500,
        "remote" : 1500,
        "localTel" : 1500,
        "remoteTel" : 1500
    },
    "internationalFee" : {
        "fee1" : 12000,
        "fee2" : 24000,
        "fee3" : 36000
    },
    "calloutLicenceStrategy" : "defined",
    "minConsume" : 0,
    "giveMinute" : 0,
    "dialFeeStrategy" : "minute",
    "transferFeeStrategy" : "minute",
    "discount" : 0,
    "serviceLicence" : 990000,
    "callinLicence" : 3.99e+06,
    "monitorLicence" : 500000,
    "internationalStrategy" : "tietong",
    "smsFee" : 1000,
    "smsDiscount" : 0,
    "node" : "",
    "createTime" : "2016-03-16 15:22:35",
    "balance" : 0,
    "dataDB" : "cc_data_20140728",
    "name" : "7001qatest",
    "effectYear" : "",
    "effectMonth" : "",
    "effectDate" : "",
    "pbx" : [
        {
            "DisplayName" : "7001qatest",
            "PBX_NAME" : "1.1.1",
            "PBX" : "1.1.1.101",
            "NickName" : "101",
            "IsDialoutIntegration" : "0",
            "IsTransferIntegration" : "0",
            "DispatcherResend" : "false",
            "DispatcherAccAndId" : "false",
            "IsRecordChannelCdr" : "false",
            "Account" : "N00000000428",
            "AccountId" : "N00000000428"
        }
    ],
    "autoSave" : false
}

 */
public class Product {
    private String id;
    /**
     * 所属账户ID
     */
    private String account;
    /**
     * pbx节点所在机柜
     */
    private String node;
    /**
     * 产品名称
     */
    private String product;

    /**
     * 外呼最低消费
     */
    private long minConsume;

    /**
     * CC产品设置低消时的赠送分钟数
     */
    private long giveMinute;

    /**
     * 神秘的折扣(按通话分钟数计算)
     */
    private long discount;

    //国际长途策略
    private String internationalStrategy;

    //国际长途
    private long intlFee1;
    private long intlFee2;
    private long intlFee3;

    /**
     * 国际长途资费设置
     */
    private IntlFeeSet intlFeeSet;

    /**
     *
     * @param dbObject
     * @return
     */
    public static Product fromDB(DBObject dbObject){
        if(dbObject == null){
            return null;
        }

        Product product = new Product();

        String dbID = (String)dbObject.get("_id");
        String dbAccount = (String)dbObject.get("account");
        String dbNode = (String)dbObject.get("node");
        String dbProduct = (String)dbObject.get("product");
        Object dbMinConsume = dbObject.get("minConsume");
        Object dbGiveMinute = dbObject.get("giveMinute");
        Object dbDiscount = dbObject.get("discount");
        String dbInternationalStrategy = (String)dbObject.get("internationalStrategy");
        DBObject dbInternationalFee = (DBObject)dbObject.get("internationalFee");
        DBObject dbIntlFeeSet = (DBObject)dbObject.get("intlFeeSet");

        product.setId(dbID);
        product.setAccount(dbAccount);
        product.setNode(dbNode);
        product.setProduct(dbProduct);
        product.setMinConsume(Utils.transDBNumberLong(dbMinConsume));
        product.setGiveMinute(Utils.transDBNumberLong(dbGiveMinute));
        product.setDiscount(Utils.transDBNumberLong(dbDiscount));
        product.setInternationalStrategy(dbInternationalStrategy);
        if(dbInternationalFee != null) {
            //国际长途资费
            long intlFee1 = Utils.transDBNumberLong(dbInternationalFee.get("fee1"));
            long intlFee2 = Utils.transDBNumberLong(dbInternationalFee.get("fee2"));
            long intlFee3 = Utils.transDBNumberLong(dbInternationalFee.get("fee3"));

            product.setIntlFee1(intlFee1);
            product.setIntlFee2(intlFee2);
            product.setIntlFee3(intlFee3);
        }
        product.setIntlFeeSet(IntlFeeSet.fromDB(dbIntlFeeSet));

        return product;
    }

    public long getMinConsume() {
        return minConsume;
    }

    public void setMinConsume(long minConsume) {
        this.minConsume = minConsume;
    }

    public long getGiveMinute() {
        return giveMinute;
    }

    public void setGiveMinute(long giveMinute) {
        this.giveMinute = giveMinute;
    }

    public long getDiscount() {
        return discount;
    }

    public void setDiscount(long discount) {
        this.discount = discount;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAccount() {
        return account;
    }

    public void setAccount(String account) {
        this.account = account;
    }

    public String getNode() {
        return node;
    }

    public void setNode(String node) {
        this.node = node;
    }

    public String getProduct() {
        return product;
    }

    public void setProduct(String product) {
        this.product = product;
    }
    public long getIntlFee1() {
        return intlFee1;
    }


    public String getInternationalStrategy() {
        return internationalStrategy;
    }

    public void setInternationalStrategy(String internationalStrategy) {
        this.internationalStrategy = internationalStrategy;
    }

    public void setIntlFee1(long intlFee1) {
        this.intlFee1 = intlFee1;
    }

    public long getIntlFee2() {
        return intlFee2;
    }

    public void setIntlFee2(long intlFee2) {
        this.intlFee2 = intlFee2;
    }

    public long getIntlFee3() {
        return intlFee3;
    }

    public void setIntlFee3(long intlFee3) {
        this.intlFee3 = intlFee3;
    }


    public IntlFeeSet getIntlFeeSet() {
        return intlFeeSet;
    }

    public void setIntlFeeSet(IntlFeeSet intlFeeSet) {
        this.intlFeeSet = intlFeeSet;
    }

    /**
     * 国际长途资费设置
     */
    public static class IntlFeeSet{
        /**
         * 是否开通国际长途
         */
        private boolean isOpenIntl;
        /**
         * 国际长途线路
         */
        private String line;
        /**
         * 是否允许打配置之外的其他国际长途
         */
        private boolean allowOther;
        /**
         * 其他国际长途价格
         */
        private long otherPrice;

        /**
         * 开通的国际长途区域代码及价格
         */
        private List<IntlFee> fees = new ArrayList<IntlFee>();


        public static IntlFeeSet fromDB(DBObject dbObj){
            if(dbObj == null){
                return null;
            }

            IntlFeeSet intlFeeSet = new IntlFeeSet();

            String line = (String)dbObj.get("line");
            boolean dbAllowOther = Utils.transDBNumberBoolean(dbObj.get("allowOther"));
            long dbOtherPrice = Utils.transDBNumberLong(dbObj.get("otherPrice"));
            BasicDBList dbFees = (BasicDBList)dbObj.get("fees");
            boolean dbIsOpenIntl = Utils.transDBNumberBoolean(dbObj.get("isOpenIntl"));


            intlFeeSet.setLine(line);
            intlFeeSet.setAllowOther(dbAllowOther);
            intlFeeSet.setOtherPrice(dbOtherPrice);
            if(dbFees != null && !dbFees.isEmpty()){
                for(Object obj : dbFees){
                    DBObject dbIntlFee = (DBObject) obj;
                    intlFeeSet.getFees().add(IntlFee.fromDB(dbIntlFee));
                }
            }
            intlFeeSet.setOpenIntl(dbIsOpenIntl);

            return intlFeeSet;
        }

        public String getLine() {
            return line;
        }

        public boolean isAllowOther() {
            return allowOther;
        }

        public void setAllowOther(boolean allowOther) {
            this.allowOther = allowOther;
        }

        public long getOtherPrice() {
            return otherPrice;
        }

        public void setOtherPrice(long otherPrice) {
            this.otherPrice = otherPrice;
        }

        public void setLine(String line) {
            this.line = line;
        }

        public List<IntlFee> getFees() {
            return fees;
        }

        public void setFees(List<IntlFee> fees) {
            this.fees = fees;
        }


        public boolean isOpenIntl() {
            return isOpenIntl;
        }

        public void setOpenIntl(boolean openIntl) {
            isOpenIntl = openIntl;
        }
    }

    /**
     * 国际长途资费设置项
     */
    public static class IntlFee{
        /**
         * 区域代码
         */
        private String code;
        /**
         * 价格(元/分钟)
         */
        private long price;
        /**
         * 备注
         */
        private String memo;

        public static IntlFee fromDB(DBObject dbObj){
            if(dbObj == null){
                return null;
            }

            IntlFee intlFee = new IntlFee();

            String dbCode = (String)dbObj.get("code");
            long dbPrice = Utils.transDBNumberLong(dbObj.get("price"));
            String dbMemo = (String)dbObj.get("memo");

            intlFee.setCode(dbCode);
            intlFee.setPrice(dbPrice);
            intlFee.setMemo(dbMemo);

            return intlFee;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public long getPrice() {
            return price;
        }

        public void setPrice(long price) {
            this.price = price;
        }

        public String getMemo() {
            return memo;
        }

        public void setMemo(String memo) {
            this.memo = memo;
        }
    }
}
