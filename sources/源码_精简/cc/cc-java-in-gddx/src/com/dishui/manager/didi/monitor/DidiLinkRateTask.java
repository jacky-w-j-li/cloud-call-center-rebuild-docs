package com.dishui.manager.didi.monitor;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import net.sf.json.JSON;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.bson.BasicBSONObject;
import sun.misc.Regexp;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Logger;
import java.util.logging.Level;
import java.util.regex.Pattern;

/**
 * Created by Panshuyang on 2016/10/19 0019.
 */
public class DidiLinkRateTask extends TimerTask {
    private static Logger logger = Logger.getLogger(DidiLinkRateTask.class.getName());
    private static String intervalBegin = "";
    private static String intervalEnd = "";
    private static JSONObject didiAccounts = new JSONObject();
    private static final String reportTable = "didi_monitor_link_rate";

    public void run (){
        getInterval();
        logger.info("Starting calculate didi link rate thread!");
        getDidiAccountConstants();
        for(Object key : didiAccounts.keySet()){
            JSONObject account = JSONObject.fromObject(didiAccounts.get(key));
            calLinkRatePerAccount(account);
        }
        logger.info("Ending calculate didi link rate thread!");
    }

    public static void getInterval(){
        JSONObject hour = Utils.getLastHour("yyyy-MM-dd HH:00:00");
        intervalBegin = hour.getString("lastHour");
        intervalEnd = hour.getString("thisHour");
    }

    public static void getDidiAccountConstants(){
        List<DBObject> cityAccount = MongoProvider.findFromReportDb("interAPI", "didi_city_account", new BasicDBObject());
        BasicDBObject find = new BasicDBObject();
        JSONArray accounts = new JSONArray();
        for(DBObject temp : cityAccount){
            if("yes".equals(temp.get("link_rate_monitor"))){
                accounts.add(temp.get("_id"));
            }
        }
        find.append("account", new BasicDBObject().append("$in", accounts))
            .append("product", "cc");
        List<DBObject> didiAccountInfo = MongoProvider.find("bill", "platform_account_product", find);
        for(DBObject temp : didiAccountInfo){
            JSONObject jsonTemp = JSONObject.fromObject(temp);
            didiAccounts.put(temp.get("account"), jsonTemp);
        }
    }

    public static void calLinkRatePerAccount(JSONObject account){
        logger.info("Start calculate " + account.getString("account") + " Link Rate");
        BasicDBObject statistics = new BasicDBObject();
        statistics.append("account",account.getString("account"));
        String account_db = account.getString("dataDB");
        String collection = account.getString("account") + "_c5_call_sheet";
        BasicDBObject selector = new BasicDBObject();
        selector.append("END_TIME", new BasicDBObject()
                    .append("$gte", intervalBegin)
                    .append("$lt", intervalEnd));
        long summaryCount = MongoProvider.count(account_db, collection, selector);
        statistics.append("summaryCount", summaryCount);
        selector.append("BEGIN_TIME", new BasicDBObject().append("$ne", null))
                .append("$where", "this.BEGIN_TIME < this.END_TIME");
        long linkedCount = MongoProvider.count(account_db, collection, selector);
        statistics.append("linkedCount",linkedCount);
        Map<String, String> timeIds = generateTimeIds(intervalBegin);
        statistics.putAll(timeIds);
        statistics.append("_id", account.getString("account") + "_" + timeIds.get("hourId"));
        MongoProvider.reportUpsert("interAPI", reportTable, new BasicDBObject().append("_id", statistics.getString("_id")), statistics);
    }

    public static Map<String, String> generateTimeIds(String begin){
        Map<String, String> timeIds = new HashMap<String, String>();
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        try {
            Calendar calendar = Calendar.getInstance();
            timeIds.put("reportTime", sdf.format(calendar.getTime()));
            Date idDate = sdf.parse(begin);
            calendar.setTime(idDate);
            StringBuffer timeIdStr = new StringBuffer();
            timeIdStr.append(String.valueOf(calendar.get(Calendar.YEAR)));
            timeIds.put("yearId", timeIdStr.toString());
            if(calendar.get(Calendar.MONTH) < 9){
                timeIdStr.append("0");
            }
            timeIdStr.append(calendar.get(Calendar.MONTH) + 1);
            timeIds.put("monthId", timeIdStr.toString());
            if(calendar.get(Calendar.DAY_OF_MONTH) < 10){
                timeIdStr.append("0");
            }
            timeIdStr.append(calendar.get(Calendar.DAY_OF_MONTH));
            timeIds.put("dayId", timeIdStr.toString());
            if(calendar.get(Calendar.HOUR_OF_DAY) < 10){
                timeIdStr.append("0");
            }
            timeIdStr.append(calendar.get(Calendar.HOUR_OF_DAY));
            timeIds.put("hourId", timeIdStr.toString());
            return timeIds;
        } catch (ParseException e) {
            logger.severe("generateTimeIds Failed , dateString src is :" + begin);
            e.printStackTrace();
            return null;
        }
    }
}
