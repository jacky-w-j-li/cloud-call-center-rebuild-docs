package com.dishui.model;

import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by zhangyang on 15/11/13.
 */
public class ReportEvent {
    private String _id;
    private String type;
    private String account;
    private String reportStatus;
    private String reportTime;
    private Map<String,Object> businessData ;
    public ReportEvent(){
        this._id = Utils.getUniqueid();
        this.businessData = new HashMap<String, Object>();
        this.reportStatus = "ready";
    }

    public String getReportTime() {
        return reportTime;
    }

    public void setReportTime(String reportTime) {
        this.reportTime = reportTime;
    }

    public String get_id() {
        return _id;
    }

    public void set_id(String _id) {
        this._id = _id;
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

    public Map<String, Object> getBusinessData() {
        return businessData;
    }

    public void setBusinessData(Map<String, Object> businessData) {
        this.businessData = businessData;
    }

    public void addBusinessData(String key , Object value){
        this.businessData.put(key , value);
    }

    public Object getBusinessData (String key){
        return this.businessData.get(key);
    }


    public DBObject getDbObjectData(){
        DBObject data = new BasicDBObject();
        data.put("_id",this._id);
        data.put("type",this.type);
        data.put("account",this.account);
        data.put("reportTime",this.reportTime);
        data.put("reportStatus",this.reportStatus);
        DBObject businessData = new BasicDBObject();
        businessData.putAll(this.businessData);
        data.put("businessData",businessData);
        return data;
    }
}
