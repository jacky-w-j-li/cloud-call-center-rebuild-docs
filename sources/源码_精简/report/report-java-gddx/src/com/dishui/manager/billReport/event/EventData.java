package com.dishui.manager.billReport.event;

import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Created by jackwong on 16/1/12.
 */
public class EventData {
    /**
     * 事件类型
     */
    private String type;

    /**
     * 账户
     */
    private String account;
    /**
     * 事件状态
     */
    private String reportStatus;

    /**
     * 报表时间
     */
    private String reportTime;
    /**
     * 事件业务数据
     */
    private Map<String, Object> businessData = new HashMap<String, Object>();

    public EventData(String type, String account) {
        this.type = type;
        this.account = account;
        this.reportStatus = "ready";
        this.reportTime = DateUtil.getFormatTime(new Date());
    }

    public BasicDBObject toDB(){
        BasicDBObject dbObj =  new BasicDBObject().append("type",type).append("account",account).append("reportStatus",reportStatus).append("reportTime",reportTime);
        if(!businessData.isEmpty()){
            BasicDBObject businessDataDBObj = new BasicDBObject();
            dbObj.append("businessData",businessDataDBObj);
            for(Map.Entry<String,Object> entry : businessData.entrySet()){
                businessDataDBObj.append(entry.getKey(),entry.getValue());
            }
        }

        return dbObj;
    }

    public Map<String, Object> getBusinessData() {
        return businessData;
    }

    public void setBusinessData(Map<String, Object> businessData) {
        this.businessData = businessData;
    }

    public EventData addBusinessItem(String key,Object val){
        this.businessData.put(key,val);
        return this;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getAccount() {
        return account;
    }

    public void setAccount(String account) {
        this.account = account;
    }

    public String getReportStatus() {
        return reportStatus;
    }

    public void setReportStatus(String reportStatus) {
        this.reportStatus = reportStatus;
    }

    public String getReportTime() {
        return reportTime;
    }

    public void setReportTime(String reportTime) {
        this.reportTime = reportTime;
    }

}
