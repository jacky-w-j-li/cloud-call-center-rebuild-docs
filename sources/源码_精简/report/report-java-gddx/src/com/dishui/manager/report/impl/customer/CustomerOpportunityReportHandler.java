package com.dishui.manager.report.impl.customer;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.mongodb.BasicDBObject;

import java.util.Map;
import java.util.logging.Logger;


public class CustomerOpportunityReportHandler {
    private static final Logger log = Logger.getLogger(CustomerOpportunityReportHandler.class.getName());
    private static String OWNER_NA = "NA";

    /**
     * cc库app_dic_codes表 code_type：sys_status
     0 默认
     1 跟进
     2 无效
     3 成单
     4 丢单
     5 无效待审
     6 成单待审
     7 丢单待审
     * @param status
     * @return
     */
    private  static boolean checkSysStatus(String status){
        if("2".equals(status)||"3".equals(status)||"4".equals(status)||"8".equals(status)){
            return true;
        }
        return false;
    }
    private  static boolean checkDeal(String status){
        if ("3".equals(status)) {
            return true;
        }
        return false;
    }
    private  static String getSysStatusAlias(String status){
        String field="";
        if("4".equals(status)){
            field="lost";
        }else if("3".equals(status)){
            field="deal";
        }else if("2".equals(status)){
            field="invalid";
        }
        return field;
    }

    /**
         cc_customer_opportunity_report（触发：增加、导入、删除、跟进状态变化）
         {
         "_id" : ObjectId("56e27530839d8045862e3dbd"),
         "account" : "N00000000143",
         "day" : "20151203",
         "month" : "201512",
         "year" : "2015",
         "deal" : 0,
         "lost" : 0,
         "invalid" : 0,
         "money":0,
         add:0,//增加数量
         del:0,//删除数量
         total:0//每日商机总数
         }
     * @param event
     */
    public static void addToOpportunity(Event event){
        Map<String, Object> map = event.getBusinessData();
        if(map==null)return;
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("day", event.getDayId());
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("add", 1);
        incDoc.put("total", 1);

        MongoProvider.update(Constant.CUSTOMER_OPPORTUNITY_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }

    /**
     * 修改跟进状态
     * @param event
     */
    public static void updateSysStatus(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("day", event.getDayId());
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());

        String tType =  (String)map.get("tType");
        Double money = Double.valueOf(map.get("money")==null?"0":map.get("money").toString())*10000;
        long  _money= money.longValue();

        String status = "";
        String field=  "";
        if(map != null && map.get("sysStatus") != null){
            status = (String)map.get("sysStatus");
            if(checkSysStatus(status)){
                field=getSysStatusAlias(status);
            }else{
                return;
            }
        }
        BasicDBObject incDoc = new BasicDBObject();
        if("8".equals(status)){
            incDoc.put("money", _money);
            MongoProvider.update(Constant.CUSTOMER_OPPORTUNITY_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }else{
            incDoc.put(field, 1);
            if(checkDeal(status)){
                incDoc.put("money", _money);
            }
            MongoProvider.update(Constant.CUSTOMER_OPPORTUNITY_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
        }

    }

    /**
      续费
     * @param event
     */
    public static void renewFee(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("day", event.getDayId());
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());

        String tType =  (String)map.get("tType");
        Double money = Double.valueOf(map.get("money")==null?"0":(String)map.get("money"))*10000;
        long  _money= money.longValue();

        BasicDBObject incDoc = new BasicDBObject();
        String status = "";
        if(map != null && map.get("sysStatus") != null){
            status = (String)map.get("sysStatus");
            if(checkDeal(status)){
                incDoc.put("money", _money);
            }else{
                return;
            }
        }

        MongoProvider.update(Constant.CUSTOMER_OPPORTUNITY_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }


    public static void delToOpportunity(Event event){
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("day", event.getDayId());
        condition.put("year", event.getYearId());
        condition.put("month",event.getMonthId());

        BasicDBObject incDoc = new BasicDBObject();
        incDoc.put("del", 1);
        incDoc.put("total", -1);
        MongoProvider.update(Constant.CUSTOMER_OPPORTUNITY_REPORT_TABLE, condition, new BasicDBObject("$inc", incDoc), true);
    }


}
