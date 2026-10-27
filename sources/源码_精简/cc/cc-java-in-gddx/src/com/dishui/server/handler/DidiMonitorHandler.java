package com.dishui.server.handler;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Response;
import com.dishui.manager.service.Utils;
import com.dishui.server.http.HttpProvider;
import com.dishui.util.MD5;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;
import com.mongodb.util.JSON;

import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Pattern;

/**
 * Created by chenguang on 6/27/16.
 */
public class DidiMonitorHandler {
    private static Logger log = Logger.getLogger(DidiMonitorHandler.class.getName());

    public static C5Response getData(C5Action action){
        C5Response response = new C5Response(action);
        try{
            String timetype = action.getStringValue("timetype");
            String city_id = action.getStringValue("city_id");

//            String json = action.getStringValue("query");
//            json = URLDecoder.decode(json, "UTF-8");

            if(timetype.equals("hourInit")){
                DBObject find = new BasicDBObject("city_id", city_id);
                List<DBObject> list = MongoProvider.findFromReportDb("interAPI", "didi_monitor", find, new BasicDBObject("_id", -1), 60);
                response.setSucceed(true);
                response.addParameter("data", list);
            }else if(timetype.equals("min")){
                DBObject find = new BasicDBObject("city_id", city_id);
                List<DBObject> list = MongoProvider.findFromReportDb("interAPI", "didi_monitor", find, new BasicDBObject("_id", -1), 10);
                response.setSucceed(true);
                response.addParameter("data", list);
            }else if(timetype.equals("hour")
                    || timetype.equals("day")
                    || timetype.equals("month")
                    || timetype.equals("year")){
                response = getDidiUberDistinctData(action, response, "didi_monitor");
            }else if(timetype.equals("manual")){
                response = getDidiUberManualTimeData(action, response, "didi_monitor");
            }
        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING, "DidiMonitorHandler getData has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }
        return response;
    }
    public static C5Response getAccountData(C5Action action){
        C5Response response = new C5Response(action);
        try{
            String timetype = action.getStringValue("timetype");
            String accountId = action.getStringValue("account");

//            String json = action.getStringValue("query");
//            json = URLDecoder.decode(json, "UTF-8");

            if(timetype.equals("hourInit")){
                DBObject find = new BasicDBObject("account", accountId);
                List<DBObject> list = MongoProvider.findFromReportDb("interAPI", "account_bind_count_perminute", find, new BasicDBObject("_id", -1), 60);
                response.setSucceed(true);
                response.addParameter("data", list);
            }else if(timetype.equals("min")){
                DBObject find = new BasicDBObject("account", accountId);
                List<DBObject> list = MongoProvider.findFromReportDb("interAPI", "account_bind_count_perminute", find, new BasicDBObject("_id", -1), 10);
                response.setSucceed(true);
                response.addParameter("data", list);
            }else if(timetype.equals("hour")
                    || timetype.equals("day")
                    || timetype.equals("month")
                    || timetype.equals("year")){
                response = getDidiUberDistinctData(action, response, "account_bind_count_perminute");
            }else if(timetype.equals("manual")){
                response = getDidiUberManualTimeData(action, response, "account_bind_count_perminute");
            }
        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING, "DidiMonitorHandler getAccountData has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }
        return response;
    }
    public static C5Response updateAccountCount(C5Action action){
        C5Response response = new C5Response(action);
        try {
            String inCount = action.getStringValue("inCount");
            String outCount = action.getStringValue("outCount");
            String city_id = action.getStringValue("cityId");
            String account = action.getStringValue("account");
            DBObject findupdate = new BasicDBObject();
            findupdate.put("_id", Utils.getDate("yyyy-MM-dd HH:mm")+"_"+city_id+"_"+account);
            DBObject update = new BasicDBObject("channel_in_count", Integer.valueOf(inCount))
                    .append("channel_out_count", Integer.valueOf(outCount)).append("account", account)
                    .append("time",Utils.getDate("yyyy-MM-dd HH:mm")).append("hour",Utils.getDate("yyyy-MM-dd HH"))
                    .append("day",Utils.getDate("yyyy-MM-dd")).append("month",Utils.getDate("yyyy-MM"))
                    .append("year",Utils.getDate("yyyy"));
            DBObject updateCount = new BasicDBObject("channel_in_count", Integer.valueOf(inCount))
                    .append("channel_out_count", Integer.valueOf(outCount));
            DBObject set = new BasicDBObject("$set", update);
            DBObject nowDoc = MongoProvider.findOneFromReportDb("interAPI", "account_bind_count_perminute", findupdate);
            if(nowDoc != null && nowDoc.get("channel_in_count") != null){
                set = new BasicDBObject("$inc", updateCount);
            }
            MongoProvider.reportUpsert("interAPI", "account_bind_count_perminute", findupdate, set);
            response.setSucceed(true);
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "DidiMonitorHandler updateAccountCount has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }
        return response;
    }
    public static C5Response updateCount(C5Action action){
        C5Response response = new C5Response(action);
        try {
            String inCount = action.getStringValue("inCount");
            String outCount = action.getStringValue("outCount");
            String city_id = action.getStringValue("cityId");
            DBObject findupdate = new BasicDBObject();
            findupdate.put("_id", Utils.getDate("yyyy-MM-dd HH:mm")+"_"+city_id);
            DBObject update = new BasicDBObject("channel_in_count", Integer.valueOf(inCount)).append("channel_out_count", Integer.valueOf(outCount));
            DBObject set = new BasicDBObject("$set", update);
            DBObject nowDoc = MongoProvider.findOneFromReportDb("interAPI", "didi_bind_count_perminute", findupdate);
            if(nowDoc != null && nowDoc.get("channel_in_count") != null){
                set = new BasicDBObject("$inc", update);
            }
            MongoProvider.reportUpsert("interAPI", "didi_bind_count_perminute", findupdate, set);
            response.setSucceed(true);
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "DidiMonitorHandler upsertData has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }
        return response;
    }

    public static C5Response getUberData(C5Action action){
        C5Response response = new C5Response(action);

        try{
            String timetype = action.getStringValue("timetype");
            String city_id = action.getStringValue("city_id");

            if(timetype.equals("hourInit")){
                DBObject find = new BasicDBObject("city_id", city_id);
                List<DBObject> list = MongoProvider.findFromReportDb("interAPI", "uber_monitor", find, new BasicDBObject("_id", -1), 60);
                response.setSucceed(true);
                response.addParameter("data", list);
            }else if(timetype.equals("min")){
                DBObject find = new BasicDBObject("city_id", city_id);
                List<DBObject> list = MongoProvider.findFromReportDb("interAPI", "uber_monitor", find, new BasicDBObject("_id", -1), 10);
                response.setSucceed(true);
                response.addParameter("data", list);
            }else if(timetype.equals("hour")
                    || timetype.equals("day")
                    || timetype.equals("month")
                    || timetype.equals("year")){
                response = getDidiUberDistinctData(action, response, "uber_monitor");
            }else if(timetype.equals("manual")) {
                response = getDidiUberManualTimeData(action, response, "uber_monitor");
            }
        } catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING, "Uber getData has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }
        return response;
    }

    public static C5Response getDidiUberDistinctData(C5Action action, C5Response response, String dbName){
        try {
            String account = "";
            String city_id = "";
            String timetype = action.getStringValue("timetype");
            if (dbName == "account_bind_count_perminute") {
                account = action.getStringValue("account");
            } else {
                city_id = action.getStringValue("city_id");
            }

            DBObject key = new BasicDBObject();
            if(timetype.equals("hour")){
                key.put("time", true);
            }else if(timetype.equals("day")){
                key.put("hour", true);
            }else if(timetype.equals("month")){
                key.put("day", true);
            }else if(timetype.equals("year")){
                key.put("month", true);
            }

            DBObject condition = new BasicDBObject();
            if (dbName == "account_bind_count_perminute") {
                condition.put("account", account);
            } else {
                condition.put("city_id", city_id);
            }
            if(timetype.equals("hour")){
                condition.put("hour", Utils.getDate("yyyy-MM-dd HH"));
            }else if(timetype.equals("day")){
                condition.put("day", Utils.getDate("yyyy-MM-dd"));
            }else if(timetype.equals("month")){
                condition.put("month", Utils.getDate("yyyy-MM"));
            }else if(timetype.equals("year")){
                condition.put("year", Utils.getDate("yyyy"));
            }
            DBObject inital = new BasicDBObject();
            StringBuilder reduce = new StringBuilder();
            if(dbName == "didi_monitor"){
                inital.put("bind", 0);
                inital.put("unbind", 0);
                inital.put("call_all", 0);
                inital.put("call_dealing", 0);
                inital.put("call_notdeal", 0);
                inital.put("call_ivr", 0);
                inital.put("channel_in_count", 0);
                inital.put("channel_out_count", 0);
                reduce.append("function( curr, result ){")
                        .append("if(curr.bind)")
                        .append("result.bind += curr.bind;")
                        .append("if(curr.unbind)")
                        .append("result.unbind += curr.unbind;")
                        .append("if(curr.call_all)")
                        .append("result.call_all += curr.call_all;")
                        .append("if(curr.call_dealing)")
                        .append("result.call_dealing += curr.call_dealing;")
                        .append("if(curr.call_notdeal)")
                        .append("result.call_notdeal += curr.call_notdeal;")
                        .append("if(curr.call_ivr)")
                        .append("result.call_ivr += curr.call_ivr;")
                        .append("if(curr.channel_in_count)")
                        .append("result.channel_in_count += curr.channel_in_count;")
                        .append("if(curr.channel_out_count)")
                        .append("result.channel_out_count += curr.channel_out_count;")
                        .append("}");
            }else{
                inital.put("channel_in_count", 0);
                inital.put("channel_out_count", 0);
                reduce.append("function( curr, result ){")
                        .append("if(curr.channel_in_count)")
                        .append("result.channel_in_count += curr.channel_in_count;")
                        .append("if(curr.channel_out_count)")
                        .append("result.channel_out_count += curr.channel_out_count;")
                        .append("}");
            }


            StringBuilder finalize = new StringBuilder();
            finalize.append("function(result){")
                    .append("}");

            BasicDBList list = MongoProvider.groupFromReportDb("interAPI",
                    dbName, key, condition, inital, reduce.toString(), finalize.toString());
            response.setSucceed(true);
            response.addParameter("data", list);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return response;
    }


    public static C5Response getDidiUberManualTimeData(C5Action action, C5Response response, String dbName){
        try {
            String city_id = "";
            String account = "";
            if (dbName == "account_bind_count_perminute") {
                account = action.getStringValue("account");
            } else {
                city_id = action.getStringValue("city_id");
            }
            if(action.getParameters().get("start") != null && action.getParameters().get("end") != null){
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm");
                DBObject condition = new BasicDBObject();
                DBObject time = new BasicDBObject();
                DBObject key = new BasicDBObject();
                String X_axis = "";
                Date start = sdf.parse(action.getStringValue("start"));
                Date end = sdf.parse(action.getStringValue("end"));
                long intervalToNow = end.getTime() - start.getTime();
                if(intervalToNow <= 3600000L){
                    X_axis = "time";
                }else if(intervalToNow <= 86400000L){
                    X_axis = "hour";
                    sdf.applyPattern("yyyy-MM-dd HH");
                }else if(intervalToNow <= 86400000L * 31){
                    X_axis = "day";
                    sdf.applyPattern("yyyy-MM-dd");
                }else if(intervalToNow < 86400000L * 31 * 12){
                    X_axis = "month";
                    sdf.applyPattern("yyyy-MM");
                }else {
                    X_axis = "year";
                    sdf.applyPattern("yyyy");
                }
                key.put(X_axis, true);
                time.put("$gte", sdf.format(start));
                time.put("$lte", sdf.format(end));
                condition.put(X_axis, time);

                if (dbName == "account_bind_count_perminute") {
                    condition.put("account", account);
                } else {
                    condition.put("city_id", city_id);
                }

                DBObject inital = new BasicDBObject();
                StringBuilder reduce = new StringBuilder();
                if(dbName == "didi_monitor"){
                    inital.put("bind", 0);
                    inital.put("unbind", 0);
                    inital.put("call_all", 0);
                    inital.put("call_dealing", 0);
                    inital.put("call_notdeal", 0);
                    inital.put("call_ivr", 0);
                    inital.put("channel_in_count", 0);
                    inital.put("channel_out_count", 0);
                    reduce.append("function( curr, result ){")
                            .append("if(curr.bind)")
                            .append("result.bind += curr.bind;")
                            .append("if(curr.unbind)")
                            .append("result.unbind += curr.unbind;")
                            .append("if(curr.call_all)")
                            .append("result.call_all += curr.call_all;")
                            .append("if(curr.call_dealing)")
                            .append("result.call_dealing += curr.call_dealing;")
                            .append("if(curr.call_notdeal)")
                            .append("result.call_notdeal += curr.call_notdeal;")
                            .append("if(curr.call_ivr)")
                            .append("result.call_ivr += curr.call_ivr;")
                            .append("if(curr.channel_in_count)")
                            .append("result.channel_in_count += curr.channel_in_count;")
                            .append("if(curr.channel_out_count)")
                            .append("result.channel_out_count += curr.channel_out_count;")
                            .append("}");
                }else{
                    inital.put("channel_in_count", 0);
                    inital.put("channel_out_count", 0);
                    reduce.append("function( curr, result ){")
                            .append("if(curr.channel_in_count)")
                            .append("result.channel_in_count += curr.channel_in_count;")
                            .append("if(curr.channel_out_count)")
                            .append("result.channel_out_count += curr.channel_out_count;")
                            .append("}");
                }

                StringBuilder finalize = new StringBuilder();
                finalize.append("function(result){")
                        .append("}");

                BasicDBList list = MongoProvider.groupFromReportDb("interAPI",
                        dbName, key, condition, inital, reduce.toString(), finalize.toString());
                response.setSucceed(true);
                response.addParameter("key", X_axis);
                response.addParameter("data", list);
            }else{
                response.setMessage("起始时间和结束时间不能为空");
                response.setSucceed(false);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return response;
    }

    public static C5Response uberUpdateCount(C5Action action){
        C5Response response = new C5Response(action);
        try {
            int inCount = Integer.valueOf(action.getStringValue("inCount"));
            int outCount = Integer.valueOf(action.getStringValue("outCount"));
            String city_id = action.getStringValue("cityId");
            DBObject find = new BasicDBObject();
            find.put("_id", Utils.getDate("yyyy-MM-dd HH:mm")+"_"+city_id);
            find.put("city_id", city_id);
            find.put("time", Utils.getDate("yyyy-MM-dd HH:mm"));
            find.put("hour", Utils.getDate("yyyy-MM-dd HH"));
            find.put("day", Utils.getDate("yyyy-MM-dd"));
            find.put("month", Utils.getDate("yyyy-MM"));
            find.put("year", Utils.getDate("yyyy"));
            BasicDBObject update = new BasicDBObject();
            BasicDBObject set = new BasicDBObject();
            set.put("channel_in_count", inCount);
            set.put("channel_out_count", outCount);
            update.put("$inc", set);
            MongoProvider.reportUpsert("interAPI", "uber_monitor", find, update);

            //check warning-------------
            DBObject warningConfig = MongoProvider.findOneFromReportDb("interAPI", "uber_monitor_warning_config", new BasicDBObject("_id", city_id));
            if(warningConfig != null){
                if(warningConfig.get("channel_disappear") != null
                        && Boolean.parseBoolean(warningConfig.get("channel_disappear").toString())){
                    if(inCount == 0 && outCount ==0){
                        //warning
                        sendMailAndSms("优步["+city_id+"] 目前无channel 报警 " + Utils.getDate("yyyy-MM-dd HH:mm")
                                , "优步["+city_id+"] 目前无channel 报警 " + Utils.getDate("yyyy-MM-dd HH:mm") + " 请立即查看!"
                                ,warningConfig.get("toMail").toString()
                                ,warningConfig.get("ccMail").toString()
                                ,warningConfig.get("phone").toString());
                    }
                }
                if(warningConfig.get("channel_in_out_rate") != null){
                    if(outCount > 0 && inCount > 0 ){
                        float nowRate = Math.round(100l*outCount/inCount)/100f;
                        float channel_in_out_rate = Float.parseFloat(warningConfig.get("channel_in_out_rate").toString());
                        int nowHour = Integer.parseInt(Utils.getDate("HH"));
                        if(Integer.parseInt(Utils.getDate("HH")) >= 0 && Integer.parseInt(Utils.getDate("HH")) <= 6){
                            channel_in_out_rate = channel_in_out_rate/4;
                        }
                        if(nowHour == 7){
                            channel_in_out_rate = channel_in_out_rate/2;
                        }
                        if(nowRate < channel_in_out_rate){
                            //warning
                            DidiMonitorHandler.sendMailAndSms("优步["+city_id+"] channelOutCount数与channelInCount数比率过低 为["+nowRate+"] 阀值为["+channel_in_out_rate+"] 报警 "+Utils.getDate("yyyy-MM-dd HH:mm")
                                    , "优步["+city_id+"] channelOutCount数与channelInCount数比率过低 为["+nowRate+"] 阀值为["+channel_in_out_rate+"] 报警 "+Utils.getDate("yyyy-MM-dd HH:mm")+" 请立即查看!"
                                    ,warningConfig.get("toMail").toString()
                                    ,warningConfig.get("ccMail").toString()
                                    ,warningConfig.get("phone").toString());
                        }
                    }
                }
                if(warningConfig.get("call_max_limit") != null && warningConfig.get("call_limit_rate") != null){
                    if(outCount >= 0 && inCount >= 0 ){
                        int max = Integer.parseInt(warningConfig.get("call_max_limit").toString());
                        float callRate = Math.round(100l*(outCount + inCount)/max)/100f;
                        float call_limit_rate = Float.parseFloat(warningConfig.get("call_limit_rate").toString());
                        if(callRate > call_limit_rate){
                            //warning
                            int nowCount = outCount + inCount;
                            sendMailAndSms("优步["+city_id+"] 并发数["+nowCount+"]超过总并发["+max+"] 的 ["+call_limit_rate+"] 报警 " + Utils.getDate("yyyy-MM-dd HH:mm")
                                    , "优步["+city_id+"] 并发数["+nowCount+"]超过总并发["+max+"] 的 ["+call_limit_rate+"] 报警 " + Utils.getDate("yyyy-MM-dd HH:mm") + " 请立即查看!"
                                    ,warningConfig.get("toMail").toString()
                                    ,warningConfig.get("ccMail").toString()
                                    ,warningConfig.get("phone").toString());
                        }
                    }
                }
            }
            response.setSucceed(true);
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "UberMonitorHandler upsertData has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }
        return response;
    }

    public static C5Response getBindGrayScale(C5Action action){
        C5Response response = new C5Response(action);

        try {
            List<DBObject> list = MongoProvider.findFromReportDb("interAPI", "didi_city_gray", new BasicDBObject(), new BasicDBObject("_id", 1), 60);
            response.setSucceed(true);
            response.addParameter("data", list);
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "DidiMonitorHandler getBindGrayScale has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }

        return response;
    }

    public static C5Response getDidiCityAccounts(C5Action action){
        C5Response response = new C5Response(action);

        try {
            List<DBObject> list = MongoProvider.findFromReportDb("interAPI", "didi_city_account", new BasicDBObject(), new BasicDBObject("_id", 1), 60);
            response.setSucceed(true);
            response.addParameter("data", list);
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "DidiMonitorHandler getDidiCityAccounts has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }

        return response;
    }

    public static C5Response getLinkRateData(C5Action action){
        C5Response response = new C5Response(action);

        try {
            String timeType = action.getStringValue("timeType");
            String account = action.getStringValue("account");
            String key = null;
            String beginTime = null;
            String endTime = null;
            BasicDBObject selector = new BasicDBObject();
            StringBuffer timeSb = new StringBuffer();
            int beforeType = -1;
            Calendar calendar = Calendar.getInstance();
            if("day".equals(timeType)){
                key = "hourId";
                timeSb.append("yyyyMMddHH");
                beforeType = Calendar.DAY_OF_MONTH;
            }else if("month".equals(timeType)){
                key = "dayId";
                timeSb.append("yyyyMMdd");
                beforeType = Calendar.MONTH;
            }else if("year".equals(timeType)){
                key = "monthId";
                timeSb.append("yyyyMM");
                beforeType = Calendar.YEAR;
            }else if("manual".equals(timeType)){
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH");
                Date start = sdf.parse(action.getStringValue("start"));
                Date end = sdf.parse(action.getStringValue("end"));
                long intervalToNow = end.getTime() - start.getTime();
                if(intervalToNow <= 86400000L){
                    sdf.applyPattern("yyyyMMddHH");
                    key = "hourId";
                }else if(intervalToNow <= 86400000L * 31){
                    sdf.applyPattern("yyyyMMdd");
                    key = "dayId";
                }else if(intervalToNow <= 86400000L * 31 * 12){
                    sdf.applyPattern("yyyyMM");
                    key = "monthId";
                }else {
                    sdf.applyPattern("yyyy");
                    key = "yearId";
                }
                beginTime = sdf.format(start);
                endTime = sdf.format(end);
            }
            if(null == key){
                response.setSucceed(false);
                response.setMessage("Wrong Parameter, [timeType] only accept day/month/year/manual");
            }else{
                if(beginTime == null){
                    SimpleDateFormat sdf = new SimpleDateFormat(timeSb.toString());
                    endTime = sdf.format(calendar.getTime());
                    calendar.add(beforeType, -1);
                    beginTime = sdf.format(calendar.getTime());
                }
                selector.append("account", account)
                        .append(key, new BasicDBObject()
                                .append("$gte", beginTime)
                                .append("$lte", endTime));
                DBObject inital = new BasicDBObject();
                StringBuilder reduce = new StringBuilder();
                inital.put("summaryCount", 0);
                inital.put("linkedCount", 0);
                reduce.append("function( curr, result ){")
                        .append("if(curr.summaryCount)")
                        .append("result.summaryCount += curr.summaryCount;")
                        .append("if(curr.linkedCount)")
                        .append("result.linkedCount += curr.linkedCount;")
                        .append("}");
                StringBuilder finalize = new StringBuilder();
                finalize.append("function(result){")
                        .append("}");
                BasicDBList list = MongoProvider.groupFromReportDb(
                        "interAPI", "didi_monitor_link_rate",
                        new BasicDBObject().append(key, true),
                        selector, inital,
                        reduce.toString(), finalize.toString());
                response.setSucceed(true);
                response.addParameter("data", list);
                response.addParameter("key", key);
            }
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "DidiMonitorHandler getDidiCityAccounts has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }

        return response;
    }

    public static C5Response updateBGSByCityId(C5Action action){
        C5Response response = new C5Response(action);

        try {
            if(action.getParameters().get("city_id") == null || action.getParameters().get("change_to") == null || action.getParameters().get("password") == null){
                response.setMessage("Lack of parameter city_id or change_to or password");
            }else{
                MD5 myMd5 = new MD5();
                if(myMd5.getMD5ofStr(action.getParameters().get("password").toString()).equalsIgnoreCase("6bc3827b3fdec57bbe57b3006fe1088d")){
                    DBObject cond = new BasicDBObject("_id", action.getParameters().get("city_id"));
                    DBObject newBGS = new BasicDBObject("gray", Integer.parseInt(action.getParameters().get("change_to").toString()));

                    MongoProvider.reportUpdate("interAPI", "didi_city_gray", cond, newBGS, true, false);
                    response.setSucceed(true);
                }else{
                    response.setMessage("密码错误");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "DidiMonitorHandler updateBGSByCityId has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }

        return response;
    }

    public static C5Response didiNSCities(C5Action action){
        C5Response response = new C5Response(action);

        try {
            List<DBObject> list = MongoProvider.reportDistinct("interAPI","didi_trunk_num_pool","city_id",new BasicDBObject());
            response.setSucceed(true);
            response.addParameter("data", list);
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "DidiMonitorHandler didiNSCities has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }

        return response;
    }

    public static C5Response getNumSegmentByCityId(C5Action action){
        C5Response response = new C5Response(action);

        DBObject cond = new BasicDBObject("city_id", action.getParameters().get("city_id"));
        try{
            List<DBObject> list = MongoProvider.findFromReportDb("interAPI", "didi_trunk_num_pool", cond, new BasicDBObject("_id", 1));
            response.setSucceed(true);
            response.addParameter("data", list);
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "DidiMonitorHandler getNumSegmentByCityId has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }

        return response;
    }

    public static C5Response addNumberSourceWithCityId(C5Action action){
        C5Response response = new C5Response(action);
        try {
            String password = action.getParameters().get("password").toString();
            MD5 myMd5 = new MD5();
            if(password != null && myMd5.getMD5ofStr(password).equalsIgnoreCase("6bc3827b3fdec57bbe57b3006fe1088d")){
                HashMap param = action.getParameters();
                if(param.get("city_id") == null){
                    response.setMessage("未选择城市");
                }else if(param.get("segment") == null){
                    response.setMessage("未填写号段");
                }else if(param.get("start_number") == null){
                    response.setMessage("未填写起始号码");
                }else if(param.get("end_number") == null){
                    response.setMessage("未填写结束号码");
                }else if(param.get("number_mbc") == null){
                    response.setMessage("未填写最大绑定数");
                }else if(param.get("number_bbc") == null){
                    response.setMessage("未填写绑定基数");
                }else{
                    String city_id = param.get("city_id").toString();
                    String segment = param.get("segment").toString();
                    String start_number_str = param.get("start_number").toString();
                    String end_number_str = param.get("end_number").toString();
                    Integer number_mbc = Integer.parseInt(param.get("number_mbc").toString());
                    Integer number_bbc = Integer.parseInt(param.get("number_bbc").toString());
                    Pattern segmentRegex = Pattern.compile(city_id + "-[1-9][0-9]{4,5}");
                    Pattern numberRegex = Pattern.compile("[0-9]{2}");
                    Integer start_number = Integer.parseInt(start_number_str);
                    Integer end_number = Integer.parseInt(end_number_str);
                    if(!segmentRegex.matcher(segment).matches()){
                        response.setMessage("号段格式为【区号-去掉后两位的号码】 且 区号必须和所选城市区号一致");
                    }else if(!numberRegex.matcher(String.valueOf(start_number_str)).matches()){
                        response.setMessage("起始号码为电话号码的最后两位数字");
                    }else if(!numberRegex.matcher(String.valueOf(end_number_str)).matches()){
                        response.setMessage("结束号码为电话号码的最后两位数字");
                    }else if(end_number < start_number){
                        response.setMessage("结束号码不能小于起始号码");
                    }else if(number_mbc < 0){
                        response.setMessage("最大绑定数不能小于0");
                    }else if(number_bbc < 0){
                        response.setMessage("绑定基数不能小于0");
                    }else{
                        List<DBObject> objList = new ArrayList<DBObject>();
                        for(int i=start_number; i<=end_number; i++){
                            DBObject item = new BasicDBObject();
                            if(i<10){
                                item.put("_id", segment.replace("-","") + "0" + String.valueOf(i));
                            }else{
                                item.put("_id", segment.replace("-","") + String.valueOf(i));
                            }
                            item.put("city_id", city_id);
                            item.put("bind_count", number_bbc);
                            item.put("base_count", number_bbc);
                            item.put("max_bind_count", number_mbc);
                            objList.add(item);
                        }
                        System.out.println(JSON.serialize(objList));
                        MongoProvider.reportBatchInsert("interAPI", "didi_trunk_num_pool", objList, new WriteConcern(1));
                        response.setSucceed(true);
                    }
                }
            }else{
                response.setMessage("密码错误");
            }

        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "DidiMonitorHandler addNumberSourceWithCityId has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }

        return response;
    }

    public static C5Response modifyMaxBindCount(C5Action action){
        C5Response response = new C5Response(action);

        try {
            Object password = action.getParameters().get("password");
            MD5 myMd5 = new MD5();
            if(password != null && myMd5.getMD5ofStr(password.toString()).equalsIgnoreCase("6bc3827b3fdec57bbe57b3006fe1088d")){
                HashMap param = action.getParameters();
                if(param.get("segment") == null){
                    response.setMessage("未填写号段");
                }else if(param.get("start_number") == null){
                    response.setMessage("未填写起始号码");
                }else if(param.get("end_number") == null){
                    response.setMessage("未填写结束号码");
                }else if(param.get("number_mbc") == null && param.get("number_bbc") == null){
                    response.setMessage("最大绑定数和绑定基数两个必填其中一个");
                }else{
                    String segment = param.get("segment").toString();
                    String start_number_str = param.get("start_number").toString();
                    String end_number_str = param.get("end_number").toString();
                    Pattern segmentRegex = Pattern.compile("[0-9]{3,4}-[1-9]{1}[0-9]{4,5}");
                    Pattern numberRegex = Pattern.compile("[0-9]{2}");
                    Integer start_number = Integer.parseInt(start_number_str);
                    Integer end_number = Integer.parseInt(end_number_str);
                    if(!segmentRegex.matcher(segment).matches()){
                        response.setMessage("号段格式为【区号-去掉后两位的号码】");
                    }else if(!numberRegex.matcher(String.valueOf(start_number_str)).matches()){
                        response.setMessage("起始号码为电话号码的最后两位数字");
                    }else if(!numberRegex.matcher(String.valueOf(end_number_str)).matches()){
                        response.setMessage("结束号码为电话号码的最后两位数字");
                    }else if(end_number < start_number){
                        response.setMessage("结束号码不能小于起始号码");
                    }else{
                        segment = segment.replace("-", "");
                        DBObject set = new BasicDBObject();
                        int number_mbc = 0;
                        int number_bbc = 0;
                        if(param.get("number_mbc") != null){
                            number_mbc = Integer.parseInt(param.get("number_mbc").toString());
                            if(number_mbc < 0){
                                response.setMessage("最大绑定数不能小于0");
                            }else{
                                set.put("max_bind_count", number_mbc);
                            }
                        }
                        if(param.get("number_bbc") != null){
                            number_bbc = Integer.parseInt(param.get("number_bbc").toString());
                            if(number_bbc < 0){
                                response.setMessage("绑定基数不能小于0");
                            }else{
                                set.put("base_count", number_bbc);
//                                base_count && bind_count are connected should be modified together
                                set.put("bind_count", number_bbc);
                            }
                        }
                        if(set.keySet().size() > 0){
                            DBObject find = new BasicDBObject();
                            String lte = segment + end_number_str;
                            String gte = segment + start_number_str;
                            find.put("_id", new BasicDBObject()
                                    .append("$gte", gte)
                                    .append("$lte", lte));
                            log.log(Level.INFO, "滴滴更改号码段：" + JSON.serialize(find) + " -----> " + JSON.serialize(set));
                            MongoProvider.reportUpdate("interAPI", "didi_trunk_num_pool", find, new BasicDBObject("$set", set), false, true);
                            response.setSucceed(true);
                        }
                    }
                }
            }else{
                response.setMessage("密码错误");
            }
        } catch (Exception e) {
            e.printStackTrace();
            log.log(Level.WARNING, "DidiMonitorHandler modifyMaxBindCount has error!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }
        return response;
    }

    public static void sendMailAndSms(String subject, String content, String toMail, String ccMail, String phone){
        DBObject mail = new BasicDBObject();
        List<String> tolist = new ArrayList<String>();
        tolist.add(toMail);
        List<String> cclist = new ArrayList<String>();
        cclist.add(ccMail);
        mail.put("toAddr", tolist);
        mail.put("type","cdrWarning");
        mail.put("subject",subject);
        mail.put("ccAddr", cclist);
        mail.put("status","undeal");
        mail.put("warningTime",Utils.getDate("yyyy-MM-dd HH:mm:ss"));
        mail.put("content", content);

        MongoProvider.insert("bill", "bill_system_mail_send", mail);
        //send sms
        try {
            //http://115.29.14.183:3000/openService?action=sendInterfaceTemplateSms&account=N00000002272&password=bvff334f3x5ids&num=18600030392&templateNum=1&var1=您的验证码是9876&md5=81f0e1f0-32df-11e3-a2e6-1d21429e5f46
            String smsData = "http://115.29.14.183:3000/openService?action=sendInterfaceTemplateSms&account=N00000002272&password=bvff334f3x5ids" +
                    "&num="+phone+"&templateNum=1&var1="+ URLEncoder.encode(content, "utf-8")+"&md5=81f0e1f0-32df-11e3-a2e6-1d21429e5f46";
            String res = HttpProvider.sendGet(smsData);

            log.log(Level.WARNING, "[" + subject + "] 发送短信报警通知!!! res="+res+" smsData="+smsData);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
