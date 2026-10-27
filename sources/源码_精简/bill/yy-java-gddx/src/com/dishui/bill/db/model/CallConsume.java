package com.dishui.bill.db.model;

/**
 * Created by jackwong on 16/3/17.
 */

import com.dishui.bill.service.Utils;
import com.mongodb.DBObject;

/**
 *
 * 外呼月账单
 *
 */
public class CallConsume {
    private String id;
    private String account;
    /**
     * 产品名称 cc zj ...
     */
    private String name;

    /**
     * 账单年份
     */
    private String year;

    /**
     * 账单月份
     */
    private String month;

    /**
     * 外呼数量
     */
    private long calls;

    /**
     * 本地通话时长 分钟
     */
    private long localMinutes;

    /**
     * 长途通话时长 分钟
     */
    private long remoteMinutes;

    /**
     * 本地通话时长 6s
     */
    private long localSecond6;

    /**
     * 长途通话时长 6s
     */
    private long remoteSecond6;

    /**
     * 对应产品低消.也是balance的初始值
     */
    private long minConsume;

    /**
     * 低消余额.总机,400号码的话费低消扣除走低消余额
     */
    private long balance;

    /**
     * 对应产品赠送分钟数.也是giveMinute的初始值.
     */
    private long presentMinute;

    /**
     * CC产品低消对应分钟数.CC的外呼话费低消扣除走赠送分钟数
     */
    private long giveMinute;

    /**
     * 实际通话费用.不计算低消,并不等价于实际扣款
     */
    private long actualConsume;

    /**
     * 扣除月租
     */
    private long monthRent;

    /**
     * 实际扣除折扣
     */
    private long discount;

    /**
     * 创建时间
     */
    private String createTime;

    public static CallConsume fromDB(DBObject dbObject){
        if(dbObject == null){
            return null;
        }

        CallConsume callConsume = new CallConsume();

        String dbId = (String)dbObject.get("_id");
        String dbAccount = (String)dbObject.get("account");
        String dbName = (String)dbObject.get("name");
        String dbYear = (String)dbObject.get("year");
        String dbMonth = (String)dbObject.get("month");
        Object dbCalls = dbObject.get("calls");
        Object dbLocalMinutes = dbObject.get("localMinutes");
        Object dbRemoteMinutes = dbObject.get("remoteMinutes");
        Object dbLocalSecond6 = dbObject.get("localSecond6");
        Object dbRemoteSecond6 = dbObject.get("remoteSecond6");
        Object dbMinConsume = dbObject.get("minConsume");
        Object dbBalance = dbObject.get("balance");
        Object dbPresentMinute = dbObject.get("presentMinute");
        Object dbGiveMinute = dbObject.get("giveMinute");
        Object dbActualConsume = dbObject.get("actualConsume");
        Object dbMonthRent = dbObject.get("monthRent");
        Object dbDiscount = dbObject.get("discount");
        String dbCreateTime = (String)dbObject.get("createTime");


        callConsume.setId(dbId);
        callConsume.setAccount(dbAccount);
        callConsume.setName(dbName);
        callConsume.setYear(dbYear);
        callConsume.setMonth(dbMonth);
        callConsume.setCalls(Utils.transDBNumberLong(dbCalls));
        callConsume.setLocalMinutes(Utils.transDBNumberLong(dbLocalMinutes));
        callConsume.setRemoteMinutes(Utils.transDBNumberLong(dbRemoteMinutes));
        callConsume.setLocalSecond6(Utils.transDBNumberLong(dbLocalSecond6));
        callConsume.setRemoteSecond6(Utils.transDBNumberLong(dbRemoteSecond6));
        callConsume.setMinConsume(Utils.transDBNumberLong(dbMinConsume));
        callConsume.setBalance(Utils.transDBNumberLong(dbBalance));
        callConsume.setPresentMinute(Utils.transDBNumberLong(dbPresentMinute));
        callConsume.setGiveMinute(Utils.transDBNumberLong(dbGiveMinute));
        callConsume.setActualConsume(Utils.transDBNumberLong(dbActualConsume));
        callConsume.setMonthRent(Utils.transDBNumberLong(dbMonthRent));
        callConsume.setDiscount(Utils.transDBNumberLong(dbDiscount));
        callConsume.setCreateTime(dbCreateTime);

        return callConsume;
    }


    public long getActualConsume() {
        return actualConsume;
    }

    public void setActualConsume(long actualConsume) {
        this.actualConsume = actualConsume;
    }

    public long getMonthRent() {
        return monthRent;
    }

    public void setMonthRent(long monthRent) {
        this.monthRent = monthRent;
    }

    public long getDiscount() {
        return discount;
    }

    public void setDiscount(long discount) {
        this.discount = discount;
    }

    public String getCreateTime() {
        return createTime;
    }

    public void setCreateTime(String createTime) {
        this.createTime = createTime;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getYear() {
        return year;
    }

    public void setYear(String year) {
        this.year = year;
    }

    public String getMonth() {
        return month;
    }

    public void setMonth(String month) {
        this.month = month;
    }

    public long getCalls() {
        return calls;
    }

    public void setCalls(long calls) {
        this.calls = calls;
    }

    public long getLocalMinutes() {
        return localMinutes;
    }

    public void setLocalMinutes(long localMinutes) {
        this.localMinutes = localMinutes;
    }

    public long getRemoteMinutes() {
        return remoteMinutes;
    }

    public void setRemoteMinutes(long remoteMinutes) {
        this.remoteMinutes = remoteMinutes;
    }

    public long getLocalSecond6() {
        return localSecond6;
    }

    public void setLocalSecond6(long localSecond6) {
        this.localSecond6 = localSecond6;
    }

    public long getRemoteSecond6() {
        return remoteSecond6;
    }

    public void setRemoteSecond6(long remoteSecond6) {
        this.remoteSecond6 = remoteSecond6;
    }

    public long getMinConsume() {
        return minConsume;
    }

    public void setMinConsume(long minConsume) {
        this.minConsume = minConsume;
    }

    public long getBalance() {
        return balance;
    }

    public void setBalance(long balance) {
        this.balance = balance;
    }

    public long getPresentMinute() {
        return presentMinute;
    }

    public void setPresentMinute(long presentMinute) {
        this.presentMinute = presentMinute;
    }

    public long getGiveMinute() {
        return giveMinute;
    }

    public void setGiveMinute(long giveMinute) {
        this.giveMinute = giveMinute;
    }
}
