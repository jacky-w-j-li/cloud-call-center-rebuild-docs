package com.dishui.bill.db.model;

import com.dishui.bill.common.Constants;
import com.dishui.bill.service.Utils;
import com.dishui.util.DateUtil;
import com.mongodb.DBObject;

import java.util.Date;
import java.util.logging.Logger;

/**
 * 自定义扣费
 *
 * Created by jackwong on 16/3/7.
 */
public class CustFee {
    private static Logger logger = Logger.getLogger(CustFee.class.getName());
    /**
     * 唯一ID
     */
    private String id;
    /**
     * 状态: 在用 停用
     */
    private String state;
    /**
     * 名称
     */
    private String name;

    /**
     * 开始计费时间
     */
    private Date beginTime;
    /**
     * 手动计费,停止计费时间
     */
    private Date endTime;
    /**
     * 字段更新时间
     */
    private Date updateTime;
    /**
     * 创建时间
     */
    private Date createTime;

    /**
     * 自动扣费,费用到期时间
     *
     */
    private Date autoRenewEndTime;

    /**
     * 计费周期
     */
    private String pricePeriod;
    /**
     * 单价
     */
    private long price;
    /**
     * 是否自动续费
     */
    private boolean autoRenew;

    public static CustFee fromDB(DBObject dbObj) throws Exception{
        if(dbObj==null){
            return null;
        }

        String dbId = (String)dbObj.get("id");
        String dbState = (String)dbObj.get("state");
        String dbName = (String)dbObj.get("name");
        String dbBeginTime = (String)dbObj.get("beginTime");
        String dbEndTime = (String)dbObj.get("endTime");
        String dbUpdateTime = (String)dbObj.get("updateTime");
        String dbCreateTime = (String)dbObj.get("createTime");
        String dbAutoRenewEndTime = (String)dbObj.get("autoRenewEndTime");
        String dbPricePeriod = (String)dbObj.get("pricePeriod");

        Object dbPrice = dbObj.get("price");
        Object dbAutoRenew = dbObj.get("autoRenew");

        CustFee custFee = new CustFee();

        custFee.setId(dbId);
        custFee.setState(dbState==null? Constants.CUSTFEE_STATE_STOP : dbState);
        custFee.setName(dbName);

        custFee.setBeginTime(dbBeginTime==null ? null : DateUtil.parse(dbBeginTime));
        custFee.setEndTime(dbEndTime==null ? null : DateUtil.parse(dbEndTime));
        custFee.setUpdateTime(dbUpdateTime==null ? null : DateUtil.parse(dbUpdateTime));
        custFee.setCreateTime(dbCreateTime==null ? null : DateUtil.parse(dbCreateTime));
        custFee.setAutoRenewEndTime(dbAutoRenewEndTime==null ? null : DateUtil.parse(dbAutoRenewEndTime));

        custFee.setPricePeriod(dbPricePeriod);
        custFee.setPrice(Utils.transDBNumberLong(dbPrice));
        custFee.setAutoRenew(dbAutoRenew==null ? false : Boolean.valueOf(String.valueOf(dbAutoRenew)));

        return custFee;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getName() {
        return name;
    }

    public Date getAutoRenewEndTime() {
        return autoRenewEndTime;
    }

    public void setAutoRenewEndTime(Date autoRenewEndTime) {
        this.autoRenewEndTime = autoRenewEndTime;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Date getBeginTime() {
        return beginTime;
    }

    public void setBeginTime(Date beginTime) {
        this.beginTime = beginTime;
    }

    public Date getEndTime() {
        return endTime;
    }

    public void setEndTime(Date endTime) {
        this.endTime = endTime;
    }

    public Date getUpdateTime() {
        return updateTime;
    }

    public void setUpdateTime(Date updateTime) {
        this.updateTime = updateTime;
    }

    public Date getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }

    public String getPricePeriod() {
        return pricePeriod;
    }

    public void setPricePeriod(String pricePeriod) {
        this.pricePeriod = pricePeriod;
    }

    public long getPrice() {
        return price;
    }

    public void setPrice(long price) {
        this.price = price;
    }

    public boolean isAutoRenew() {
        return autoRenew;
    }

    public void setAutoRenew(boolean autoRenew) {
        this.autoRenew = autoRenew;
    }
}
