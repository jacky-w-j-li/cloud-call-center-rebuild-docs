package com.dishui.bill.db.model;

import com.dishui.bill.service.Utils;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBList;
import com.mongodb.DBObject;

import java.text.ParseException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Created by jackwong on 16/2/29.
 */
public class SystemUser {
    private String id;
    private long balance;
    private Date createTime;
    private String identity;
    private String proxyType;
    private Date lastLoginTime;
    private String linkManEmail;
    private String linkManName;
    private String linkManPhone;
    private String loginName;
    private String status;
    /**
     * 集团代理并不是真实代理,而是集团财务,这个字段指定了真实代理
     */
    private String realProxy;
    private List<String> role;

    public static SystemUser fromDB(DBObject dbObject) throws ParseException{
        if(dbObject == null){
            return null;
        }

        SystemUser systemUser = new SystemUser();

        String dbId = (String)dbObject.get("_id");
        Object dbBalance = dbObject.get("balance");
        String dbCreateTime = (String)dbObject.get("createTime");
        String dbIdentity = (String)dbObject.get("identity");
        String dbProxyType = (String)dbObject.get("proxyType");
        String dbLastLoginTime = (String)dbObject.get("lastLoginTime");
        String dbLinkManEmail = (String)dbObject.get("LinkManEmail");
        String dbLinkManName = (String)dbObject.get("linkManName");
        String dbLinkManPhone = (String)dbObject.get("linkManPhone");
        String dbLoginName = (String)dbObject.get("loginName");
        String dbStatus = (String)dbObject.get("status");
        String dbRealProxy = (String)dbObject.get("realProxy");
        BasicDBList dbRole = (BasicDBList)dbObject.get("role");

        systemUser.setId(dbId);
        systemUser.setBalance(Utils.transDBNumberLong(dbBalance));
        systemUser.setCreateTime(dbCreateTime == null ? null : DateUtil.parse(dbCreateTime));
        systemUser.setIdentity(dbIdentity);
        systemUser.setProxyType(dbProxyType);
        systemUser.setLastLoginTime(dbLastLoginTime == null ? null : DateUtil.parse(dbLastLoginTime));
        systemUser.setLinkManEmail(dbLinkManEmail);
        systemUser.setLinkManName((dbLinkManName));
        systemUser.setLinkManPhone(dbLinkManPhone);
        systemUser.setLoginName(dbLoginName);
        systemUser.setStatus(dbStatus);
        systemUser.setRealProxy(dbRealProxy);

        List<String> roleList = new ArrayList<String>();
        if(dbRole!=null){
            for(Object obj : dbRole){
                if(obj != null){
                    roleList.add((String)obj);
                }
            }
        }
        systemUser.setRole(roleList);

        return systemUser;
    }

    public String getProxyType() {
        return proxyType;
    }

    public void setProxyType(String proxyType) {
        this.proxyType = proxyType;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public long getBalance() {
        return balance;
    }

    public void setBalance(long balance) {
        this.balance = balance;
    }

    public Date getCreateTime() {
        return createTime;
    }

    public void setCreateTime(Date createTime) {
        this.createTime = createTime;
    }

    public String getIdentity() {
        return identity;
    }

    public void setIdentity(String identity) {
        this.identity = identity;
    }

    public Date getLastLoginTime() {
        return lastLoginTime;
    }

    public void setLastLoginTime(Date lastLoginTime) {
        this.lastLoginTime = lastLoginTime;
    }

    public String getLinkManEmail() {
        return linkManEmail;
    }

    public void setLinkManEmail(String linkManEmail) {
        this.linkManEmail = linkManEmail;
    }

    public String getLinkManName() {
        return linkManName;
    }

    public void setLinkManName(String linkManName) {
        this.linkManName = linkManName;
    }

    public String getLinkManPhone() {
        return linkManPhone;
    }

    public void setLinkManPhone(String linkManPhone) {
        this.linkManPhone = linkManPhone;
    }

    public String getLoginName() {
        return loginName;
    }

    public void setLoginName(String loginName) {
        this.loginName = loginName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<String> getRole() {
        return role;
    }

    public void setRole(List<String> role) {
        this.role = role;
    }


    public String getRealProxy() {
        return realProxy;
    }

    public void setRealProxy(String realProxy) {
        this.realProxy = realProxy;
    }

}
