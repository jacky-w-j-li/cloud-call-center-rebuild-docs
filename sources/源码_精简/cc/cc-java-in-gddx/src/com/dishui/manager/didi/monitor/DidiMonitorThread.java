package com.dishui.manager.didi.monitor;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.AppConfig;
import com.dishui.manager.service.Utils;
import com.dishui.server.http.HttpProvider;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 6/27/16.
 */
public class DidiMonitorThread extends Thread{
    private Logger log = Logger.getLogger(DidiMonitorThread.class.getName());
    String curTime;
    String lastTime;
    String lastWarningTime;
    DBObject cityAcc;

    public DidiMonitorThread(String curtime, String lasttime, DBObject cityacc, String lastWarningTime){
        this.curTime = curtime;
        this.lastTime = lasttime;
        this.cityAcc = cityacc;
        this.lastWarningTime = lastWarningTime;
    }

    @Override
    public void run() {
        String city_id = cityAcc.get("_id").toString();
        String account = cityAcc.get("account").toString();
        String data_db = cityAcc.get("data_db").toString();

        DBObject insertDoc = new BasicDBObject();
        insertDoc.put("_id", curTime + "_" + city_id);
        insertDoc.put("city_id", city_id);
        insertDoc.put("time", curTime);
        insertDoc.put("hour", Utils.getDate("yyyy-MM-dd HH"));
        insertDoc.put("day", Utils.getDefaultCurrentDate());
        insertDoc.put("month", Utils.getDate("yyyy-MM"));
        insertDoc.put("year", Utils.getDate("yyyy"));

        DBObject bindDoc = MongoProvider.findOneFromReportDb("interAPI", "didi_bind_count_perminute", new BasicDBObject("_id", curTime + "_" + city_id));
        DBObject unbindDoc = MongoProvider.findOneFromReportDb("interAPI", "didi_unbind_count_perminute", new BasicDBObject("_id", curTime + "_" + city_id));

        if(bindDoc != null && bindDoc.get("count") != null){
            insertDoc.put("bind", bindDoc.get("count"));
        }else{
            insertDoc.put("bind", 0);
        }
        if(bindDoc != null && bindDoc.get("channel_in_count") != null){
            insertDoc.put("channel_in_count", bindDoc.get("channel_in_count"));
        }else{
            insertDoc.put("channel_in_count", 0);
        }
        if(bindDoc != null && bindDoc.get("channel_out_count") != null){
            insertDoc.put("channel_out_count", bindDoc.get("channel_out_count"));
        }else{
            insertDoc.put("channel_out_count", 0);
        }
        if(unbindDoc != null && unbindDoc.get("count") != null){
            insertDoc.put("unbind", unbindDoc.get("count"));
        }else{
            insertDoc.put("unbind", 0);
        }
        MongoProvider.reportUpdate("interAPI", "didi_monitor", new BasicDBObject("_id",curTime + "_" + city_id), insertDoc, true, false);

        //count cdr
        DBObject findCall = new BasicDBObject("OFFERING_TIME",new BasicDBObject("$gte",lastTime+":00").append("$lte",lastTime+":59"));
        DBObject updateSet = new BasicDBObject();
        DBObject docSet = new BasicDBObject();

        long count = MongoProvider.count(data_db, account + "_c5_call_sheet", findCall);
        docSet.put("call_all", (int)count);

        findCall.put("STATUS", "dealing");
        long dealCount = MongoProvider.count(data_db, account + "_c5_call_sheet", findCall);
        docSet.put("call_dealing", (int)dealCount);

        findCall.put("STATUS", "notDeal");
        long notDealCount = MongoProvider.count(data_db, account + "_c5_call_sheet", findCall);
        docSet.put("call_notdeal", (int)notDealCount);

        findCall.put("STATUS", "leak");
        long ivrCount = MongoProvider.count(data_db, account + "_c5_call_sheet", findCall);
        docSet.put("call_ivr", (int)ivrCount);

        DBObject findUpdate = new BasicDBObject();
        findUpdate.put("_id", lastTime + "_" + city_id);
        updateSet.put("$set", docSet);
        MongoProvider.reportUpdate("interAPI", "didi_monitor", findUpdate, updateSet, false, false);

        log.log(Level.INFO, "End DidiMonitorThread nowDate="+ curTime +" lastDate =" + lastTime + " city_id = "+city_id+". end time =" +Utils.getCurrentDate());
        //check warning-------------
        DBObject warningConfig = MongoProvider.findOneFromReportDb("interAPI", "didi_monitor_warning_config", new BasicDBObject("_id", city_id));
        if(warningConfig != null){
            if(warningConfig.get("call_bind_rate") != null){
                DBObject lastBindDoc = MongoProvider.findOneFromReportDb("interAPI", "didi_bind_count_perminute", new BasicDBObject("_id", lastTime + "_" + city_id));
                if(lastBindDoc != null){
                    int lastBindCount =  Integer.parseInt(lastBindDoc.get("count").toString());
                    if(lastBindCount > 0){
                        float nowCallBindRate = Math.round(100l*count/lastBindCount)/100f;
                        float call_bind_rate = Float.parseFloat(warningConfig.get("call_bind_rate").toString());
                        int nowHour = Integer.parseInt(Utils.getDate("HH"));
                        if(nowHour > 6){
                            if(nowHour == 7){
                                call_bind_rate = call_bind_rate + 1.3f;
                            }
                            if(nowCallBindRate > call_bind_rate){
                                //warning
                                sendMailAndSms("滴滴["+city_id+"] 所有通话数与绑定数比率过 高 为["+nowCallBindRate+"] 阀值为["+call_bind_rate+"] 报警 "+curTime
                                        , "滴滴["+city_id+"] 所有通话数与绑定数比率过 高 为["+nowCallBindRate+"] 阀值为["+call_bind_rate+"] 报警 "+curTime+" 请立即查看!"
                                        ,warningConfig.get("toMail").toString()
                                        ,warningConfig.get("ccMail").toString()
                                        ,warningConfig.get("phone").toString());
                            }
                        }
                    }
                }
            }
            if(warningConfig.get("ivr_call_rate") != null && count > 20){
                float nowIvrCallRate = Math.round(100l*(notDealCount+ivrCount)/count)/100f;
                float ivr_call_rate = Float.parseFloat(warningConfig.get("ivr_call_rate").toString());
                int nowHour = Integer.parseInt(Utils.getDate("HH"));
                if(nowHour > 6){
                    if(nowHour == 7){
                        ivr_call_rate = ivr_call_rate + 0.6f;
                    }
                    if(nowIvrCallRate > ivr_call_rate){
                        //warning
                        sendMailAndSms("滴滴["+city_id+"] IVR+振铃未接数与总通话数比率过 高 为["+nowIvrCallRate+"] 阀值为["+ivr_call_rate+"] 报警 "+curTime
                                , "滴滴["+city_id+"] IVR+振铃未接数与总通话数比率过 高 为["+nowIvrCallRate+"] 阀值为["+ivr_call_rate+"] 报警 "+curTime+" 请立即查看!"
                                ,warningConfig.get("toMail").toString()
                                ,warningConfig.get("ccMail").toString()
                                ,warningConfig.get("phone").toString());
                    }
                }
            }
        }
        if(warningConfig != null
                && bindDoc != null
                && bindDoc.get("count")!= null
                && bindDoc.get("channel_in_count") != null
                && bindDoc.get("channel_out_count") != null){
            int bindCount =  Integer.parseInt(bindDoc.get("count").toString());
            int channelInCount = Integer.parseInt(bindDoc.get("channel_in_count").toString());
            int channelOutCount = Integer.parseInt(bindDoc.get("channel_out_count").toString());
            if(warningConfig.get("channel_disappear") != null
                        && Boolean.parseBoolean(warningConfig.get("channel_disappear").toString())){
                if(bindCount > 20 && channelInCount == 0){
                    //warning
                    sendMailAndSms("滴滴["+city_id+"] 有绑定["+bindCount+"]个 但无channel 报警 " + curTime
                            , "滴滴["+city_id+"] 有绑定["+bindCount+"]个 但无channel 报警 " + curTime + " 请立即查看!"
                            ,warningConfig.get("toMail").toString()
                            ,warningConfig.get("ccMail").toString()
                            ,warningConfig.get("phone").toString());
                    doWarning(city_id, "channel_disappear", bindCount+"", bindCount+"", curTime, lastWarningTime, warningConfig);
                }
            }
            if(warningConfig.get("channel_bind_rate") != null){
                if(bindCount > 0 && (channelInCount > 0 || channelOutCount > 0)){
                    float nowRate = Math.round(100l*(channelInCount+channelOutCount)/bindCount)/100f;
                    float channel_bind_rate = Float.parseFloat(warningConfig.get("channel_bind_rate").toString());
                    int nowHour = Integer.parseInt(Utils.getDate("HH"));
                    if(nowHour >= 0 && nowHour <= 6){
                        channel_bind_rate = channel_bind_rate/4;
                    }
                    if(nowHour == 7){
                        channel_bind_rate = channel_bind_rate/2;
                    }
                    if(nowRate < channel_bind_rate){
                        //warning
                        sendMailAndSms("滴滴["+city_id+"] channel数与绑定数比率过低 为["+nowRate+"] 阀值为["+channel_bind_rate+"] 报警 "+curTime
                                , "滴滴["+city_id+"] channel数与绑定数比率过低 为["+nowRate+"] 阀值为["+channel_bind_rate+"] 报警 "+curTime+" 请立即查看!"
                                ,warningConfig.get("toMail").toString()
                                ,warningConfig.get("ccMail").toString()
                                ,warningConfig.get("phone").toString());
                        doWarning(city_id, "channel_bind_rate", nowRate+"", channel_bind_rate+"", curTime, lastWarningTime, warningConfig);
                    }
                }
            }
            if(warningConfig.get("channel_in_out_rate") != null){
                if(channelOutCount > 0 && channelInCount > 0 ){
                    float nowRate = Math.round(100l*channelOutCount/channelInCount)/100f;
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
                        sendMailAndSms("滴滴["+city_id+"] channelOutCount数与channelInCount数比率过低 为["+nowRate+"] 阀值为["+channel_in_out_rate+"] 报警 "+curTime
                                , "滴滴["+city_id+"] channelOutCount数与channelInCount数比率过低 为["+nowRate+"] 阀值为["+channel_in_out_rate+"] 报警 "+curTime+" 请立即查看!"
                                ,warningConfig.get("toMail").toString()
                                ,warningConfig.get("ccMail").toString()
                                ,warningConfig.get("phone").toString());
                        doWarning(city_id, "channel_in_out_rate", nowRate+"", channel_in_out_rate+"", curTime, lastWarningTime, warningConfig);
                    }
                }
            }
            if(warningConfig.get("call_max_limit") != null && warningConfig.get("call_limit_rate") != null){
                if(channelOutCount >= 0 && channelInCount >= 0 ){
                    int max = Integer.parseInt(warningConfig.get("call_max_limit").toString());
                    float callRate = Math.round(100l*(channelOutCount+channelInCount)/max)/100f;
                    float call_limit_rate = Float.parseFloat(warningConfig.get("call_limit_rate").toString());
                    if(callRate > call_limit_rate){
                        //warning
                        int nowCount = channelOutCount+channelInCount;
                        sendMailAndSms("滴滴["+city_id+"] 并发数["+nowCount+"]超过总并发["+max+"] 的 ["+call_limit_rate+"] 报警 " + curTime
                                , "滴滴["+city_id+"] 并发数["+nowCount+"]超过总并发["+max+"] 的 ["+call_limit_rate+"] 报警 " + curTime + " 请立即查看!"
                                ,warningConfig.get("toMail").toString()
                                ,warningConfig.get("ccMail").toString()
                                ,warningConfig.get("phone").toString());
                    }
                }
            }
        }
    }

    public void sendMailAndSms(String subject, String content, String toMail, String ccMail, String phone){
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

    /**
     *
     * @param city
     * @param warningType
     * @param value
     * @param max
     * @param curTime
     * @param lastWarningTime
     * @param warningConfig
     */
    public void doWarning(String city,String warningType, String value, String max,String curTime,String lastWarningTime, DBObject warningConfig){
        try {
            DBObject find = new BasicDBObject();
            find.put("_id", warningType+"_"+city );
            DBObject doc = MongoProvider.findOneFromReportDb("interAPI", "didi_monitor_warning_record", find);
            if(doc != null){
                if(warningConfig.get(warningType + "_stop_min_count") != null){
                    int stop_count = Integer.parseInt(warningConfig.get(warningType + "_stop_min_count").toString());
                    if(doc.get("newTime").equals(lastWarningTime)){
                        int count = Integer.parseInt(doc.get("count").toString());
                        count++;
                        if(count > stop_count){
                            DBObject nowGray = MongoProvider.findOneFromReportDb("interAPI", "didi_city_gray", new BasicDBObject("_id", city).append("gray", new BasicDBObject("$ne", -1)));
                            if(nowGray != null){
                                //to stop this ctiy
                                DBObject updateGray = new BasicDBObject();
                                DBObject grayCode = new BasicDBObject();
                                int responseCode = 31001;
                                if(warningType.equals("channel_disappear")){
                                    responseCode = 31001;
                                }else if(warningType.equals("channel_bind_rate")){
                                    responseCode = 32002;
                                }else if(warningType.equals("channel_in_out_rate")){
                                    responseCode = 32003;
                                }
                                grayCode.put("gray", -1);
                                grayCode.put("code", responseCode);
                                updateGray.put("$set", grayCode);
                                MongoProvider.reportUpdate("interAPI", "didi_city_gray", new BasicDBObject("_id", city).append("gray", new BasicDBObject("$ne", -1)), updateGray, false, false);
                                sendMailAndSms("滴滴["+city+"] ["+warningType+"] 报警连续["+count+"]次 超过降级阀值["+stop_count+"]次 已降级！！该城市绑定请求将返回错误码["+ responseCode +"] 降级时间" + curTime
                                        , "滴滴["+city+"] ["+warningType+"] 报警连续["+count+"]次 超过降级阀值["+stop_count+"]次 已降级！！该城市绑定请求将返回错误码["+ responseCode +"] 降级时间" + curTime
                                        ,warningConfig.get("toMail").toString()
                                        ,warningConfig.get("ccMail").toString()
                                        ,warningConfig.get("phone").toString());
                            }
                        }else{
                            DBObject update = new BasicDBObject();
                            update.put("$set", new BasicDBObject("count", count).append("newTime", curTime));
                            update.put("$push", new BasicDBObject("records", new BasicDBObject("time", curTime).append("value", value).append("max", max)));
                            MongoProvider.reportUpdate("interAPI", "didi_monitor_warning_record", find, update, false, false);
                        }
                    }else{
                        DBObject update = new BasicDBObject();
                        update.put("$set", new BasicDBObject("count", 1).append("newTime", curTime));
                        update.put("$push", new BasicDBObject("records", new BasicDBObject("time", curTime).append("value", value).append("max", max)));
                        MongoProvider.reportUpdate("interAPI", "didi_monitor_warning_record", find, update, false, false);
                    }
                }
            }else{
                DBObject newOne = new BasicDBObject();
                newOne.put("_id", warningType+"_"+city);
                newOne.put("type", warningType);
                newOne.put("city_id", city);
                newOne.put("newTime", curTime);
                newOne.put("count", 1);
                DBObject oneRecord = new BasicDBObject();
                oneRecord.put("time", curTime);
                oneRecord.put("value", value);
                oneRecord.put("max", max);
                BasicDBList list = new BasicDBList();
                list.add(oneRecord);
                newOne.put("records", list);
                MongoProvider.reportInsert("interAPI", "didi_monitor_warning_record", newOne);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "didi doWarningres has exception!", e);
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        float a = 1.1f;
        float b = 30;
//        System.out.printf(Math.round(b/a*100)/100f+"");
//        int time = Integer.parseInt(Utils.getDate("HH"));
//        System.out.println(time);
//        if(time >17){
//            System.out.println(time);
//        }
        System.out.println(a/3 + "");
        System.out.println(Math.round(a/3l*100l)/100l + "");
    }
}
