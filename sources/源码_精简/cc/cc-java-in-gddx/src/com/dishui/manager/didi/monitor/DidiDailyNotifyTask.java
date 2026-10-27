package com.dishui.manager.didi.monitor;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Pattern;

public class DidiDailyNotifyTask extends TimerTask {
    private Logger log = Logger.getLogger(DidiMonitorTask.class.getName());

    private static HashMap<String, String> didi_cities = new HashMap<String, String>();
    private static Pattern areaNumPattern = Pattern.compile("[0-9]{3,4}");

    static {
        didi_cities.put("010","北京");
        didi_cities.put("020","广州");
        didi_cities.put("021","上海");
        didi_cities.put("022","天津");
        didi_cities.put("023","重庆");
        didi_cities.put("024","沈阳");
        didi_cities.put("025","南京");
        didi_cities.put("027","武汉");
        didi_cities.put("0571","杭州");
        didi_cities.put("0755","深圳");
        didi_cities.put("028","成都");
        didi_cities.put("029","西安");
        didi_cities.put("0531","济南");
        didi_cities.put("0592","厦门");
        didi_cities.put("0769","东莞");
        didi_cities.put("0731","长沙");
        didi_cities.put("0898","海口");
        didi_cities.put("0899","三亚");
        didi_cities.put("0575","绍兴");
        didi_cities.put("0574","宁波");
        didi_cities.put("0579","金华");
        didi_cities.put("0757","佛山");
        didi_cities.put("0512","苏州");
        didi_cities.put("0532","青岛");
        didi_cities.put("0411","大连");
    }

    public void run() {

        try {
            String day = Utils.getLastDate();
            log.log(Level.INFO, "Begin DidiDailyNotifyTask nowDate = "+ day);
            List<DBObject> didiCityList = MongoProvider.findFromReportDb("interAPI", "didi_monitor_config", new BasicDBObject());

            StringBuilder content = new StringBuilder("滴滴" + day + "各城市并发峰值<br/><br/>");
            content = buildMailContent(content, "didi_monitor", didiCityList, day);

            List<DBObject> uberCityList = MongoProvider.findFromReportDb("interAPI", "uber_monitor_warning_config", new BasicDBObject());
            content = buildMailContent(content, "uber_monitor", uberCityList, day);

            sendMail("滴滴和优步" + day + "各城市并发峰值",content.toString());
        } catch (Exception e) {
            log.log(Level.WARNING, e.getMessage(), e);
        }
    }

    public void sendMail(String subject, String content){
        DBObject mail = new BasicDBObject();

        List<String> tolist = new ArrayList<String>();
        tolist.add("chenguang@7moor.com");
        tolist.add("pengwei@7moor.com");
        tolist.add("caizb@7moor.com");
        tolist.add("wangxb@7moor.com");
        tolist.add("licheng@7moor.com");
        tolist.add("zhaoxz@7moor.com");
        tolist.add("zhangyang@7moor.com");

        List<String> cclist = new ArrayList<String>();
        cclist.add("shenjc@7moor.com");
        cclist.add("pansy@7moor.com");
        cclist.add("jingdl@7moor.com");

        mail.put("toAddr", tolist);
        mail.put("type","cdrWarning");
        mail.put("subject",subject);
        mail.put("ccAddr", cclist);
        mail.put("status","undeal");
        mail.put("warningTime",Utils.getDate("yyyy-MM-dd HH:mm:ss"));
        mail.put("content", content);

        MongoProvider.insert("bill", "bill_system_mail_send", mail);
    }

    public StringBuilder buildMailContent(StringBuilder sb, String dbName, List<DBObject> cityList, String day){
        if(dbName == "uber_monitor"){
            sb.append("<br/><br/>优步" + day + "各城市并发峰值<br/><br/>");
        }
        for(int i=0;i<cityList.size();i++){
            DBObject city_config = cityList.get(i);
            String city_id = city_config.get("_id").toString();
            if(areaNumPattern.matcher(city_id).matches()){
                String city_name = didi_cities.get(city_id) == null?"未知":didi_cities.get(city_id);
                DBObject find = new BasicDBObject();
                DBObject sort = new BasicDBObject("channel_in_count", -1);
                find.put("city_id", city_id);
                find.put("day", day);
                List<DBObject> peak = MongoProvider.findFromReportDb("interAPI", dbName, find, sort, 1);

                if(peak != null && peak.size() > 0){
                    DBObject peakObj = peak.get(0);
                    sb.append(city_name)
                            .append("(" + city_id + ")   :   ");
                    int channel_in_count = 0;
                    int channel_out_count = 0;
                    if(peakObj.get("channel_in_count") != null){
                        channel_in_count = Integer.parseInt(peakObj.get("channel_in_count").toString());
                    }
                    if(peakObj.get("channel_out_count") != null){
                        channel_out_count = Integer.parseInt(peakObj.get("channel_out_count").toString());
                    }
                    sb.append((channel_in_count + channel_out_count)==0?"暂无":(channel_in_count + channel_out_count))
                            .append("<br/>");
                }else{
                    sb.append(city_name)
                            .append("(" + city_id + ")   :   ")
                            .append("暂无")
                            .append("<br/>");
                }
            }else{
                System.out.println("不合法区号：" + city_id);
            }
        }

        return sb;
    }
}
