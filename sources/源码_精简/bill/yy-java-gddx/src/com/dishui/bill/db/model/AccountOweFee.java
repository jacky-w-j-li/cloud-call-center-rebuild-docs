package com.dishui.bill.db.model;

/**
 * Created by jackwong on 16/3/18.
 */

import com.dishui.bill.service.Utils;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import org.bson.types.ObjectId;

import java.util.Date;

/**
 * 账户欠费记录,账户欠费时只扣除账户余额,不会给代理反提成,
 * 在账户充值后再给代理提成,同时冲消账户欠费记录
 */
/*
{
    "_id" : ObjectId("5867d7d777c853d232f1d116"),
    "fee" : NumberLong(-24000000),
    "proxyFee" : 0,
    "minConsume" : NumberLong(24000000),
    "account" : "N00000000247",
    "proxy" : "26df66d0-947f-11e4-83c5-3f7dccf3236a",
    "type" : "minConsume",
    "num400" : "",
    "createTime" : "2017-01-01 00:07:51",
    "status" : "nodeal",
    "orderNo" : "N00000000247_2017-01_cc",
    "product" : "cc"
}
 */
public class AccountOweFee {
    private String id;

    /**
     * 账户欠费额度
     */
    private long fee;

    /**
     * 因账户欠费,未返给代理的钱
     */
    private long proxyFee;

    /**
     * 账户ID
     */
    private String account;

    /**
     * 所属代理
     */
    private String proxy;

    /**
     * 欠的什么钱.低消,月租
     */
    private String type;

    /**
     * 状态.冲销,未冲销
     */
    private String status;

    /**
     * 对应外呼月账单ID
     */
    private String orderNo;

    /**
     * 产品ID.cc,zj,400
     */
    private String product;

    private long minConsume;

    private Date createTime;



    public static AccountOweFee fromDB(DBObject dbObj) throws Exception{
        if(dbObj == null){
            return null;
        }

        String dbId = dbObj.get("_id").toString();
        Object dbFee = dbObj.get("fee");
        Object dbProxyFee = dbObj.get("proxyFee");
        String dbAccount = (String)dbObj.get("account");
        String dbProxy = (String)dbObj.get("proxy");
        String dbType = (String)dbObj.get("type");
        String dbStatus = (String)dbObj.get("status");
        String dbOrderNo = (String)dbObj.get("orderNo");
        String dbProduct = (String)dbObj.get("product");
        Object dbMinConsume = dbObj.get("minConsume");
        String dbCreateTime = (String)dbObj.get("createTime");

        AccountOweFee accountOweFee = new AccountOweFee();
        accountOweFee.setId(dbId);
        accountOweFee.setFee(Utils.transDBNumberLong(dbFee));
        accountOweFee.setProxyFee(Utils.transDBNumberLong(dbProxyFee));
        accountOweFee.setAccount(dbAccount);
        accountOweFee.setProxy(dbProxy);
        accountOweFee.setType(dbType);
        accountOweFee.setStatus(dbStatus);
        accountOweFee.setOrderNo(dbOrderNo);
        accountOweFee.setProduct(dbProduct);
        accountOweFee.setMinConsume(Utils.transDBNumberLong(dbMinConsume));
        accountOweFee.setCreateTime(dbCreateTime == null ? null : DateUtil.parse(dbCreateTime));

        return accountOweFee;
    }

    public DBObject toDB(){
        BasicDBObject dbObject = new BasicDBObject();

        dbObject.append("fee",fee)
                .append("proxyFee",proxyFee)
                .append("account",account)
                .append("proxy",proxy)
                .append("type",type)
                .append("status",status)
                .append("orderNo",orderNo)
                .append("product",product)
                .append("minConsume",minConsume)
                .append("createTime",DateUtil.getFormatTime(createTime));

        return dbObject;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public long getFee() {
        return fee;
    }

    public void setFee(long fee) {
        this.fee = fee;
    }

    public long getProxyFee() {
        return proxyFee;
    }

    public void setProxyFee(long proxyFee) {
        this.proxyFee = proxyFee;
    }

    public String getAccount() {
        return account;
    }

    public void setAccount(String account) {
        this.account = account;
    }

    public String getProxy() {
        return proxy;
    }

    public void setProxy(String proxy) {
        this.proxy = proxy;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getOrderNo() {
        return orderNo;
    }

    public void setOrderNo(String orderNo) {
        this.orderNo = orderNo;
    }

    public String getProduct() {
        return product;
    }

    public void setProduct(String product) {
        this.product = product;
    }
    public long getMinConsume() {
        return minConsume;
    }

    public void setMinConsume(long minConsume) {
        this.minConsume = minConsume;
    }

    public Date getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }


}
