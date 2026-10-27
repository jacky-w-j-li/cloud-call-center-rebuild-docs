package com.dishui.util.report;

import java.text.CollationKey;
import java.text.DateFormat;
import java.text.RuleBasedCollator;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.model.ExportModelVo;
import com.dishui.model.UserVo;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class ReportUtil {
    private static Logger log = Logger.getLogger(ReportUtil.class.getName());

    public static void processAccountReport(ReportAnalyseData data) {
        List<DBObject> accountList = data.getAccountList();
        if (accountList != null && accountList.size() != 0) {
            for (DBObject obj : accountList) {
                try {
                    String accountId = (String) obj.get("_id");
                    if (accountId != null && !accountId.equals("")) {
                        processReport(accountId, data);
                    } else {
                        log.log(Level.WARNING, "can not process accountReport ,the accountId is empty! !");
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    log.log(Level.WARNING, "", e);
                }
            }
        }
    }

    private static void processReport(String accountId, ReportAnalyseData data) {

        List<DBObject> flows = data.getBusinessFlow(accountId);
        DBObject key = new BasicDBObject();
        if (flows == null) {
            List<String> fields = data.getAccountGroupFields(accountId);
            if (fields != null && fields.size() != 0) {
                for (String field : fields) {
                    key.put(field, true);
                }
            }
            String queryTable = data.getQueryTable(accountId);
            String insertTable = data.getInsertTable(accountId);
            DBObject init = data.getGroupInit(accountId);
            DBObject condition = data.getGroupCondition(accountId);
            String reduce = data.getGroupReduce(accountId);
            String fn = null;
            BasicDBList resultList = MongoProvider.group(queryTable, key, condition, init, reduce, fn, accountId);
            List<DBObject> insertList = new ArrayList<DBObject>();
            for (int i = 0; i < resultList.size(); i++) {
                DBObject obj = (DBObject) resultList.get(i);
                obj = data.processResult(obj);
                insertList.add(obj);
            }
            DBObject removeCondition = data.getRemoveCondition(accountId);
            MongoProvider.remove(insertTable,removeCondition,accountId);
            MongoProvider.batchInsert(insertTable, insertList, accountId);
        } else {
            for (int i = 0; i < flows.size(); i++) {
                DBObject flowObj = flows.get(i);
                List<String> fields = data.getAccountGroupFields(accountId,(String)flowObj.get("_id"));
                if (fields != null && fields.size() != 0) {
                    for (String field : fields) {
                        key.put(field, true);
                    }
                }
                String queryTable = data.getQueryTable(accountId);
                String insertTable = data.getInsertTable(accountId);
                DBObject init = data.getGroupInit(accountId);
                DBObject condition = data.getGroupCondition(accountId,(String)flowObj.get("_id"));
                String reduce = data.getGroupReduce(accountId);
                String fn = null;
                BasicDBList resultList = MongoProvider.group(queryTable, key, condition, init, reduce, fn, accountId);
                List<DBObject> insertList = new ArrayList<DBObject>();
                for (int m = 0; m < resultList.size(); m++) {
                    DBObject obj = (DBObject) resultList.get(m);
                    obj = data.processResult(obj);
                    insertList.add(obj);
                }
                DBObject removeCondition = data.getRemoveCondition(accountId);
                removeCondition.put("flow",flowObj.get("_id"));
                MongoProvider.remove(insertTable,removeCondition,accountId);
                MongoProvider.batchInsert(insertTable, insertList, accountId);
            }
        }
    }


    public static List<ExportModelVo> getHeaders(String tmplId, String accountId) {
        List<ExportModelVo> list = new ArrayList<ExportModelVo>();

        DBObject model = null;
        DBObject find = new BasicDBObject();
        find.put("Type", tmplId);
        find.put("Account", accountId);
        List<DBObject> models = MongoProvider.find(
                "app_report_table_header_config", find);
        if (models.size() >= 1) {
            model = models.get(0);
        } else {
            // 无自定义表头，那么取 系统默认表头
            find.put("Account", "system");
            model = MongoProvider.findOne("app_report_table_header_config",
                    find);
        }

        List<BasicDBObject> stable = (List<BasicDBObject>) model.get("Config");
        // BasicDBList rows =(BasicDBList)model.get("custom_fields");

        for (int i = 0; i < stable.size(); i++) {
            if ((Boolean) stable.get(i).get("show")) {
                String key = (String) stable.get(i).get("name");
                String name = (String) stable.get(i).get("displayname");
                ExportModelVo vo = new ExportModelVo();
                vo.setFieldId(key);
                vo.setFieldName(name);
                vo.setDicName("");
                list.add(vo);
            }
        }
        // Iterator iterator=stable.keySet().iterator();
        // while(iterator.hasNext()){
        // String key=(String)iterator.next();
        // String name=stable.getString(key);
        // ExportModelVo vo=new ExportModelVo();
        // vo.setFieldId(key);
        // vo.setFieldName(name);
        // vo.setDicName("");
        // list.add(vo);
        // }
        // for (Object obj : rows) {
        // BasicDBObject row =(BasicDBObject)obj;
        // BasicDBList cols=(BasicDBList)row.get("cols");
        // for(Object obj2:cols){
        // BasicDBObject col =(BasicDBObject)obj2;
        // BasicDBList fields=(BasicDBList)col.get("fields");
        // for(int i=0;i<fields.size();i++){
        // BasicDBObject field =(BasicDBObject)fields.get(i);
        // ExportModelVo vo=new ExportModelVo();
        // vo.setFieldId(field.getString("_id"));
        // vo.setFieldName(field.getString("name"));
        // vo.setDicName(field.getString("dic"));
        // list.add(vo);
        // }
        // }
        // }
        System.out.println("-----get Headers-----------" + list);

        return list;
    }

    public static Map<String, List<ExportModelVo>> getExportHeaders(String tmplId, String accountId) {
        Map<String, List<ExportModelVo>> headerMapper = new HashMap<String, List<ExportModelVo>>();
        List<ExportModelVo> list = new ArrayList<ExportModelVo>();

        DBObject allHeaderModel = null;
        DBObject model = null;
        DBObject find = new BasicDBObject();
        find.put("Type", tmplId);
        find.put("Account", accountId);
        List<DBObject> models = MongoProvider.find(
                "app_report_table_header_config", find);
        if (models.size() >= 1) {
            model = models.get(0);
        } else {
            // 无自定义表头，那么取 系统默认表头
            find.put("Account", "system");
            model = MongoProvider.findOne("app_report_table_header_config",
                    find);
            allHeaderModel = model;
        }

        List<BasicDBObject> stable = (List<BasicDBObject>) model.get("Config");
        // BasicDBList rows =(BasicDBList)model.get("custom_fields");

        for (int i = 0; i < stable.size(); i++) {
            if ((Boolean) stable.get(i).get("show")) {
                String key = (String) stable.get(i).get("name");
                String name = (String) stable.get(i).get("displayname");
                ExportModelVo vo = new ExportModelVo();
                vo.setFieldId(key);
                vo.setFieldName(name);
                vo.setDicName("");
                list.add(vo);
            }
        }
        headerMapper.put("Custom", list);

        if (allHeaderModel == null) {
            find.put("Account", "system");
            allHeaderModel = MongoProvider.findOne("app_report_table_header_config",
                    find);
        }

        List<BasicDBObject> allHeaderList = (List<BasicDBObject>) allHeaderModel.get("Config");
        List<ExportModelVo> allHeaderVoList = new ArrayList<ExportModelVo>();
        for (int i = 0; i < allHeaderList.size(); i++) {
            String key = (String) stable.get(i).get("name");
            String name = (String) stable.get(i).get("displayname");
            ExportModelVo vo = new ExportModelVo();
            vo.setFieldId(key);
            vo.setFieldName(name);
            vo.setDicName("");
            allHeaderVoList.add(vo);
        }
        headerMapper.put("All", allHeaderVoList);

        // Iterator iterator=stable.keySet().iterator();
        // while(iterator.hasNext()){
        // String key=(String)iterator.next();
        // String name=stable.getString(key);
        // ExportModelVo vo=new ExportModelVo();
        // vo.setFieldId(key);
        // vo.setFieldName(name);
        // vo.setDicName("");
        // list.add(vo);
        // }
        // for (Object obj : rows) {
        // BasicDBObject row =(BasicDBObject)obj;
        // BasicDBList cols=(BasicDBList)row.get("cols");
        // for(Object obj2:cols){
        // BasicDBObject col =(BasicDBObject)obj2;
        // BasicDBList fields=(BasicDBList)col.get("fields");
        // for(int i=0;i<fields.size();i++){
        // BasicDBObject field =(BasicDBObject)fields.get(i);
        // ExportModelVo vo=new ExportModelVo();
        // vo.setFieldId(field.getString("_id"));
        // vo.setFieldName(field.getString("name"));
        // vo.setDicName(field.getString("dic"));
        // list.add(vo);
        // }
        // }
        // }
        return headerMapper;
    }

    public static List<Object> sortListByChinese(BasicDBList dbList, String sortName) {

        final String sortName1 = sortName;

        List<Object> sortedList = Arrays.asList(dbList.toArray());
        final RuleBasedCollator collator = (RuleBasedCollator) java.text.Collator.getInstance(Locale.CHINA);
        Collections.sort(sortedList, new Comparator<Object>() {

            @Override
            public int compare(Object o1, Object o2) {
                DBObject db1 = (DBObject) o1;
                DBObject db2 = (DBObject) o2;
                CollationKey c1 = collator.getCollationKey(db1
                        .get(sortName1).toString());
                CollationKey c2 = collator.getCollationKey(db2
                        .get(sortName1).toString());
                return collator.compare(((CollationKey) c1).getSourceString(),
                        ((CollationKey) c2).getSourceString());
            }

        });
        return sortedList;
    }

    public static List<Object> sortListByTime(BasicDBList dbList, String sortName) {

        final String sortName1 = sortName;

        List<Object> sortedList = Arrays.asList(dbList.toArray());
        Collections.sort(sortedList, new Comparator<Object>() {
            @Override
            public int compare(Object o1, Object o2) {
                DBObject db1 = (DBObject) o1;
                DBObject db2 = (DBObject) o2;
                long longstr1 = Long.valueOf(db1.get(sortName1).toString().replaceAll("[-\\s:]", ""));
                long longstr2 = Long.valueOf(db2.get(sortName1).toString().replaceAll("[-\\s:]", ""));
                if (longstr1 > longstr2) {
                    return 1;
                } else {
                    return 0;
                }
            }
        });
        return sortedList;
    }
//
//    public static void main(String[] args){
//        BasicDBList list = new BasicDBList();
//        list.add(new BasicDBObject("name","20131128"));
//
//        list.add(new BasicDBObject("name","20131228"));
//
//        list.add(new BasicDBObject("name","20131023"));
//
//        list.add(new BasicDBObject("name","20131028"));
//        List<Object> alist = ReportUtil.sortListByTime(list,"name");
//        System.out.println(alist);
//    }

    public static void getReportTime(Map<String, Object> data, DBObject condition) {
        String reportTimeType = data.get("TimeType").toString();
        String monthStr = "";
        String dayStr = "";
        if (data.get("monthReport") != null) {
            int month = Integer.parseInt(data.get("monthReport").toString());
            if (month < 10) {
                monthStr = "0" + month;
            } else {
                monthStr = month + "";
            }
        }
        if (data.get("dayReport") != null) {
            int day = Integer.parseInt(data.get("dayReport").toString());
            if (day < 10) {
                dayStr = "0" + day;
            } else {
                dayStr = day + "";
            }
        }
        if (reportTimeType.equalsIgnoreCase("day")) {
            condition.put("DayID", data.get("yearReport") + monthStr + dayStr);
        } else if (reportTimeType.equalsIgnoreCase("month")) {
            condition.put("MonthID", data.get("yearReport") + monthStr);
        } else if (reportTimeType.equalsIgnoreCase("year")) {
            condition.put("YearID", data.get("yearReport"));
        } else if (reportTimeType.equalsIgnoreCase("other")) {
        	DBObject time = new BasicDBObject();
        	time.put("$gte", data.get("StartTime").toString().replaceAll("-","") );
        	time.put("$lte", data.get("EndTime").toString().replaceAll("-",""));
            condition.put("DayID", time);     
        } else if (reportTimeType.equalsIgnoreCase("other_half_hour")) {
            DBObject time = new BasicDBObject();
            time.put("$gte", data.get("StartTime").toString() );
            time.put("$lte", data.get("EndTime").toString());
            condition.put("ReportTime", time);
        } else {
            condition.put("ReportTime", data.get("timeReport"));
        }
    }

    public static void getReportTimeLower(Map<String, Object> data, DBObject condition) {
        System.out.println(data.toString());
        String reportTimeType = data.get("timeType").toString();
        String reportTypes=data.get("reportType").toString();
        String monthStr = "";
        String dayStr = "";
        Date date = new Date();
        if (data.get("monthReport") != null) {
            int month = Integer.parseInt(data.get("monthReport").toString());
            if (month < 10) {
                monthStr = "0" + month;
            } else {
                monthStr = month + "";
            }
        }else{
            int month = date.getMonth() + 1;
            if (month < 10) {
                monthStr = "0" + month;
            } else {
                monthStr = month + "";
            }
        }
        if (data.get("dayReport") != null) {
            int day = Integer.parseInt(data.get("dayReport").toString());
            if (day < 10) {
                dayStr = "0" + day;
            } else {
                dayStr = day + "";
            }
        }else {
            int day = date.getDate();
            if (day < 10) {
                dayStr = "0" + day;
            } else {
                dayStr = day + "";
            }
        }

        if(data.get("yearReport") == null){
            data.put("yearReport", DateUtil.getCurrentDate("yyyy"));
        }
        System.out.println(data.toString());
        if (reportTimeType.equalsIgnoreCase("day")) {
            condition.put("dayId", data.get("yearReport") + monthStr + dayStr);
        } else if (reportTimeType.equalsIgnoreCase("month")) {
            condition.put("monthId", data.get("yearReport") + monthStr);
        } else if (reportTimeType.equalsIgnoreCase("year")) {
            condition.put("yearId", data.get("yearReport"));
        } else if (reportTimeType.equalsIgnoreCase("other")) {
        	 DBObject time = new BasicDBObject();
         	if(reportTypes.equals("im_report_session_seoKeywords")){
         		if((data.get("EndTime").equals(""))||data.get("EndTime")==null){
         			 //Date datetime=new Date();
         	    	 //DateFormat format=new SimpleDateFormat("yyyyMMdd");
         			 time.put("$gte", data.get("StartTime").toString().replaceAll("-","") );
         			 time.put("$lte", "30160101");
                    condition.put("dayId", time);
         		}else{
         			time.put("$gte", data.get("StartTime").toString().replaceAll("-","") );
                    time.put("$lte", data.get("EndTime").toString().replaceAll("-",""));
                     condition.put("dayId", time);
         		}
         	}else{
         		time.put("$gte", data.get("StartTime").toString().replaceAll("-","") );
                 time.put("$lte", data.get("EndTime").toString().replaceAll("-",""));
                 condition.put("dayId", time);
         	}
        } else if (reportTimeType.equalsIgnoreCase("other_half_hour")) {
            DBObject time = new BasicDBObject();
            int hasHalfHourDay = 20161012;
            String startDateTime = data.get("StartTime").toString();
            String endDateTime = data.get("EndTime").toString();
            String startDateStr = startDateTime.equals("") ? "0" : startDateTime.split(" ")[0].replaceAll("-", "");
            String endDateStr = endDateTime.equals("") ? "99999999" : endDateTime.split(" ")[0].replaceAll("-", "");
            int startDate = Integer.parseInt(startDateStr);
            int endDate = Integer.parseInt(endDateStr);

            if (startDate > hasHalfHourDay && endDate > hasHalfHourDay) {
                time.put("$gte", data.get("StartTime").toString());
                if (endDate != 99999999) {
                    time.put("$lt", data.get("EndTime").toString());
                }
                condition.put("reportTime", time);
            } else {
                if (startDate != 0 || endDate != 99999999) {
                    if (startDate != 0) {
                        time.put("$gte", startDateStr);
                    }
                    if (endDate != 99999999) {
                        time.put("$lt", endDateStr);
                    }
                    condition.put("dayId", time);
                }
            }
        } else {
            condition.put("dayId", data.get("yearReport") + monthStr + dayStr);
        }
    }

    public static String getGroupTimeKey(String reportTimeType) {
        if (reportTimeType.equals("day") || reportTimeType.equals("time")) {
            return "ReportTime";
        } else if (reportTimeType.equals("month")) {
            return "DayID";
        } else if (reportTimeType.equals("year")) {
            return "MonthID";
        } else if (reportTimeType.equals("other")){
        	return "DayID";
        } else if (reportTimeType.equals("other_half_hour")){
            return "ReportTime";
        }
        return "";
    }

    public static String formatTime(int seconds) {
        String result = "00:00:00";
        String hourStr = null;
        String minuteStr = null;
        String secondStr = null;
        if (seconds > 0) {
            int hour = seconds / 3600;
            int minute = (seconds % 3600) / 60;
            int second = seconds % 60;
            if (hour < 10) {
                hourStr = "0" + hour;
            } else {
                hourStr = "" + hour;
            }
            if (minute < 10) {
                minuteStr = "0" + minute;
            } else {
                minuteStr = "" + minute;
            }
            if (second < 10) {
                secondStr = "0" + second;
            } else {
                secondStr = "" + second;
            }
            result = hourStr + ":" + minuteStr + ":" + secondStr;
        }
        return result;
    }

    //--------get user all childs---------add by qiaoqian--------------
    public static List<String> getUserChilds (String accountId, String userId){
    	DBObject queryUser = new BasicDBObject();
    	queryUser.put("accountId", accountId);
    	queryUser.put("parentId", new BasicDBObject("$ne", "null"));
        List<DBObject> userList = MongoProvider.find("platform_user", queryUser);
        List<Object> users = new ArrayList<Object>();
        for(DBObject user:userList){
            UserVo userVo = new UserVo();
            userVo.mapRow(user.toMap());
            users.add(userVo);
        }
        List<String> usersString = getAllUsers(userId, users);
        return usersString;
    }  
    
    public static List<String> getAllUsers (String parentId, List<Object> users){
    	List<String> userList = new ArrayList<String>();
		for(int i=0; i<users.size(); i++){
			UserVo userVo = new UserVo(); 
			userVo = (UserVo) users.get(i);
			if(userVo.getParentId().equalsIgnoreCase(parentId)){
				userList.add(userVo.getUserId());
				List<String> userTemp = getAllUsers(userVo.getUserId(), users);
				if(userTemp.size() >0){
					userList.addAll(userTemp);
//					for(int j=0; j<userTemp.size(); j++){
//						userList.add(userTemp.get(j));
//					}
				}
			}
		}
    	return userList;
    }
    //--------get user all childs---------add by qiaoqian--------------end
    //make the user condition
    public static List<String> getUserCondition (String userId, String userType, String[] agents){
    	List<String> userCondition = new ArrayList<String>();
    	if(userType.equalsIgnoreCase("manager") || userType.equalsIgnoreCase("admin")){
    		return null;
    	}else{
    		DBObject queryUser = new BasicDBObject();
        	queryUser.put("_id", userId);
            DBObject user = MongoProvider.findOne("platform_user", queryUser);
            UserVo userVo = new UserVo();
            userVo.mapRow(user.toMap());
            if(userVo.getScope() == null || userVo.getScope().equals("")){
                return null;
            }
            if(userVo.getScope().equalsIgnoreCase("1")){
            	return null;
            }else{
            	List<String> ownerList = new ArrayList<String>();
            	List<String> userList = getUserChilds(userVo.getAccountId(), userId);
        		userList.add(userId);
            	if(agents.length > 0){
            		List<String> agentList = Arrays.asList(agents);
            		for(int i=0; i<userList.size(); i++){
            			for(int j=0; j<agentList.size(); j++){
            				if(userList.get(i).equalsIgnoreCase(agentList.get(j))){
            					ownerList.add(agentList.get(j));
            					break;
            				}
            			}
            		}
//            		if (ownerList.size() < 1) {
//            			userCondition = null;
//            		} else {
//            			userCondition = ownerList; 
//            		}
            		if (ownerList.size() > 0){
            			userCondition = ownerList;
            		}
            		return userCondition;
            	}else{
            		return userList;
            	}
            }
    	}
    }
}
