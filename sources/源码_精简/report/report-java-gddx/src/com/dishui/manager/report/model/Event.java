package com.dishui.manager.report.model;

import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.HashMap;
import java.util.Map;

/**
 * Created by chenguang on 11/8/15.
 */
public class Event {

    private String _id;
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

    private String dayId = "";

    private String yearId = "";

    private String seasonId = "";

    private String monthId = "";

    private String hourId = "";

    private String minuteId = "";

    public String getId() {
        return _id;
    }

    /**
     * 事件业务数据
     */
    private Map<String, Object> businessData;

    public String getAccount() {
        return account;
    }

    public String getReportStatus() {
        return reportStatus;
    }

    public String getReportTime() {
        return reportTime;
    }

    public String getDayId() {
        return dayId;
    }

    public String getYearId() {
        return yearId;
    }

    public String getSeasonId() { return seasonId; }

    public String getMonthId() {
        return monthId;
    }

    public String getHourId() {
        return hourId;
    }

    public String getMinuteId() {
        return minuteId;
    }

    public Map<String, Object> getBusinessData() {
        return businessData;
    }

    public Event(DBObject obj){
        this._id = obj.get("_id").toString();
        this.type = obj.get("type").toString();
        if(obj.get("account")!=null) {
            this.account = obj.get("account").toString();
        }
        this.reportTime = obj.get("reportTime").toString();
        this.reportStatus = obj.get("reportStatus").toString();
        this.businessData =(HashMap<String, Object>) obj.get("businessData");
        Map<String, String> timeMap = DateUtil.parseTime(reportTime);
        if(timeMap != null){
            this.yearId = timeMap.get("yearId");
            this.monthId = this.yearId + timeMap.get("monthId");
            this.seasonId = timeMap.get("seasonId");
            this.dayId = this.monthId + timeMap.get("dayId");
            this.hourId = this.dayId + timeMap.get("hourId");
            int minutes = Integer.parseInt(timeMap.get("minuteId"));
            if(minutes>=0 && minutes <= 9){
                this.minuteId = "00";
            }else if(minutes>=10 && minutes < 20){
                this.minuteId = "10";
            }else if(minutes>=20 && minutes < 30){
                this.minuteId = "20";
            }else if(minutes>=30 && minutes < 40){
                this.minuteId = "30";
            }else if(minutes>=40 && minutes < 50){
                this.minuteId = "40";
            }else if(minutes>=50 && minutes < 60){
                this.minuteId = "50";
            }

        }
    }
    public String getType() {
        return type;
    }


    public void resetReportTime(String resettTime){
        Map<String, String> timeMap = DateUtil.parseTime(resettTime);
        if(timeMap != null){
            this.yearId = timeMap.get("yearId");
            this.monthId = this.yearId + timeMap.get("monthId");
            this.seasonId = timeMap.get("seasonId");
            this.dayId = this.monthId + timeMap.get("dayId");
            this.hourId = this.dayId + timeMap.get("hourId");
            int minutes = Integer.parseInt(timeMap.get("minuteId"));
            if(minutes>=0 && minutes <= 9){
                this.minuteId = "00";
            }else if(minutes>=10 && minutes < 20){
                this.minuteId = "10";
            }else if(minutes>=20 && minutes < 30){
                this.minuteId = "20";
            }else if(minutes>=30 && minutes < 40){
                this.minuteId = "30";
            }else if(minutes>=40 && minutes < 50){
                this.minuteId = "40";
            }else if(minutes>=50 && minutes < 60){
                this.minuteId = "50";
            }
        }
    }


    @Override
    public String toString(){
        StringBuffer stringBuffer = new StringBuffer("Event{")
                .append("_id:\"").append(this._id).append("\"")
                .append(",type:\"").append(this.type).append("\"")
                .append(",account:\"").append(this.account).append("\"")
                .append(",reportTime:\"").append(this.reportTime).append("\"")
                .append(",reportStatus:\"").append(this.reportStatus).append("\"")
                .append(",businessData:").append(this.businessData)
                .append("}");
        return stringBuffer.toString();
    }

    public static void main(String[] args){
        DBObject dbObject = new BasicDBObject();
        DBObject dbObject1 = new BasicDBObject();
        dbObject1.put("accessId", "121111111111111");
        dbObject1.put("platform", "pc");
        dbObject1.put("agentId", "zengyx");
        dbObject.put("type", "msgIn");
        dbObject.put("account", "N00000000143");
        dbObject.put("reportTime", "2015-11-09 12:00:23");
        dbObject.put("reportStatus", "ready");
        dbObject.put("businessData", dbObject1);
        Event event = new Event(dbObject);
        System.out.println(event.toString());

    }
}

