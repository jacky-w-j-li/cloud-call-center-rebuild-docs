package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.io.IOException;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;

public class BusinessExport extends XssfWriter {
    private static Logger log = Logger.getLogger(BusinessExport.class.getName());
    public static String DB_BUSINESS = "_business";
    public static String DB_BUSINESS_HISTORY = "_business_history";
    public static String DB_BUSINESS_FLOW = "account_business_flow";
    public static String DB_BUSINESS_FLOW_STEP = "account_business_flow_step";
    public static String DB_BUSINESS_FLOW_FIELDS = "account_business_flow_field";
    public static String DB_CUSTOMER = "_customer";
    public static String DB_CALL_SHEET = "_c5_call_sheet";

    @Override
    public void generate(Map<String, Object> query) throws Exception {
        long time = System.currentTimeMillis();
        DBObject condition = new BasicDBObject();
        condition.putAll(query);
        String accountId = (String) query.get("account");
        String flow = (String) query.get("flow");
        //DBObject startFlowCondition = new BasicDBObject().append("flow_id", flow).append("isBegin", true);
        //DBObject startFlow = MongoProvider.findOne(DB_BUSINESS_FLOW_STEP, startFlowCondition);

        //查出所有工单字段,如果有step则加入step条件
        DBObject allFlowCondition = new BasicDBObject().append("flow_id", flow);
        DBObject allFlowSort = new BasicDBObject("stepFields",-1);
        if(query.get("step") != null){
            allFlowCondition = new BasicDBObject().append("flow_id", flow).append("_id",query.get("step").toString());
        }
        List<DBObject> flowList = MongoProvider.find(DB_BUSINESS_FLOW_STEP, allFlowCondition,null,allFlowSort,null);
        //如果是完成或取消的话,还是读取全部步骤字段
        if(flowList.size() == 1){
            if(flowList.get(0).get("systemFn") != null){
                allFlowCondition = new BasicDBObject().append("flow_id", flow);
                flowList = MongoProvider.find(DB_BUSINESS_FLOW_STEP, allFlowCondition);
            }
        }
        condition.removeField("step"); //为了兼容之前代码 删除query的step条件
        long duration = System.currentTimeMillis() - time;
        String msg = String.format("%s消耗时间[%d ms]", "export business", duration);
        log.info(msg);

        if (flowList.size() > 0 ) {
            List<String> fields = getStepFields(flowList);
            Map<String, DBObject> flowFields = getFlowFields(flow);
            processCascadSelect(fields, flowFields);
            beginSheet();
            genrateHeader(fields, flowFields);
            List<DBObject> businessList = MongoProvider.find(accountId + DB_BUSINESS, condition, accountId);
            //distinct  customerId
            List<DBObject> customerIdList = MongoProvider.distinct(accountId + DB_BUSINESS, "customer", condition, accountId);
            //distinct callId
            List<DBObject> callIdList = MongoProvider.distinct(accountId + DB_BUSINESS,"callId",condition,accountId);
            //find history backInfo
            List<String> busIds = new ArrayList<String>();
            System.out.println("查询工单备注开始 ===== " + new Date(System.currentTimeMillis()));
            List<String> backInfoCondition = new ArrayList<String>();
            DBObject sort = new BasicDBObject("sortTime",1);
            backInfoCondition.add(null);
            for (int i = 0; i <businessList.size() ; i++) {
                busIds.add(businessList.get(i).get("_id").toString());
            }
            DBObject busHistoryCondition = new BasicDBObject().append("businessId", new BasicDBObject().append("$in", busIds)).append("excuteData.backInfo",new BasicDBObject().append("$nin",backInfoCondition));
            DBObject backInfoReturnFields = new BasicDBObject();
            backInfoReturnFields.put("businessId",1);
            backInfoReturnFields.put("backInfo",1);
            backInfoReturnFields.put("excuteData",1);
            List<DBObject> busHistoryList = MongoProvider.find(accountId + DB_BUSINESS_HISTORY, busHistoryCondition, accountId,sort,backInfoReturnFields);
            log.info(String.format("%s消耗时间[%d ms]", "export-busHistory",  System.currentTimeMillis() - time));

            System.out.println("查询工单备注结束 ===== " + new Date(System.currentTimeMillis()));
            //find customer
            System.out.println("查询客户开始 ===== " + new Date(System.currentTimeMillis()));
            DBObject customerReturnFields = new BasicDBObject();
            customerReturnFields.put("_id",1);
            customerReturnFields.put("name",1);
            DBObject customerCondition = new BasicDBObject().append("_id", new BasicDBObject().append("$in", customerIdList));
            List<DBObject> customerList = MongoProvider.find(accountId + DB_CUSTOMER, customerCondition, accountId,customerReturnFields);
            Map<String, DBObject> customerCache = processCacheMap(customerList);
            System.out.println("查询客户结束 ===== " + new Date(System.currentTimeMillis()));
            log.info(String.format("%s消耗时间[%d ms]", "export-customer", System.currentTimeMillis() - time));

            //find callData
            System.out.println("查询通话记录开始 ===== " + new Date(System.currentTimeMillis()));
            DBObject callSheetReturnFields = new BasicDBObject();
            customerReturnFields.put("_id",1);
            DBObject callCondition = new BasicDBObject().append("_id",new BasicDBObject().append("$in",callIdList));
            List<DBObject> callList = MongoProvider.find(accountId+DB_CALL_SHEET,callCondition,accountId,callSheetReturnFields);
            Map<String, DBObject> callCache = processCacheMap(callList);
            System.out.println("查询通话记录结束 ===== " + new Date(System.currentTimeMillis()));
            log.info(String.format("%s消耗时间[%d ms]", "export-callsheet", System.currentTimeMillis() - time));
            //find flow
            DBObject flowCondition = new BasicDBObject().append("_id", flow);
            DBObject flowObj = MongoProvider.findOne(DB_BUSINESS_FLOW, flowCondition);
            //find flow step
            DBObject stepCondition = new BasicDBObject().append("flow_id", flow);
            List<DBObject> flowSteps = MongoProvider.find(DB_BUSINESS_FLOW_STEP, stepCondition);
            Map<String, DBObject> flowCache = processCacheMap(flowSteps);
            //find user
            System.out.println("查询bill用户开始 ===== " + new Date(System.currentTimeMillis()));
            DBObject userCondition = new BasicDBObject().append("account", accountId);
            userCondition.put("product","cc");
            List<DBObject> userList = MongoProvider.find("bill","platform_user", userCondition);
            Map<String, DBObject> userCache = processCacheMap(userList);
            System.out.println("查询bill用户结束 ===== " + new Date(System.currentTimeMillis()));
            userCache.put("", new BasicDBObject().append("name", "系统分配"));
            userCache.put(null, new BasicDBObject().append("name", "系统"));
            log.info(String.format("%s消耗时间[%d ms]", "export-query-end", System.currentTimeMillis() - time));

            //工单备注处理
            Map<String, String> busHistoryMap = new HashMap<String, String>();
            if(busHistoryList.size() > 0){
                for (int j = 0; j < busHistoryList.size(); j++) {
                    DBObject history = busHistoryList.get(j);
                    DBObject excuteData = (BasicDBObject)history.get("excuteData");
                    //等于空给这个工单赋值备注
                    if(busHistoryMap.get(history.get("businessId")) == null || busHistoryMap.get(history.get("businessId")).equals("")){
                        busHistoryMap.put((String)history.get("businessId"),(String)excuteData.get("backInfo"));
                    }else{
                        String currentBusHistory =  busHistoryMap.get(history.get("businessId"));
                        busHistoryMap.put((String)history.get("businessId"), currentBusHistory + " | " + (String)excuteData.get("backInfo"));
                    }
                }
            }
            //

            for (int i = 0; i < businessList.size(); i++) {
                DBObject busienss = businessList.get(i);
                insertRow(i + 1);
                createCell(0,(String)busienss.get("number"));
                createCell(1, customerCache.get(busienss.get("customer")) == null ? "" : (String) customerCache.get(busienss.get("customer")).get("name"));
                createCell(2, (String) flowObj.get("name"));
                createCell(3, flowCache.get(busienss.get("step")) == null ? "":(String) flowCache.get(busienss.get("step")).get("name"));
                createCell(4, (String) busienss.get("createTime"));
                createCell(5, getBusinssStatus((String) busienss.get("status")));
                createCell(6, userCache.get(busienss.get("createUser")) == null ? "":(String) userCache.get(busienss.get("createUser")).get("displayName"));
                createCell(7, userCache.get(busienss.get("master")) == null ? "" :(String) userCache.get(busienss.get("master")).get("displayName"));
                createCell(8, callCache.get(busienss.get("callId")) == null ? "" : (String) callCache.get(busienss.get("callId")).get("CALL_NO"));
                createCell(9, busienss.get("processEndTime") == null? "": (String) busienss.get("processEndTime"));
                int backInfoIndex = 10;// 工单备注列索引
                for (int k = 0; k < fields.size(); k++) {
                    String field = fields.get(k);
                    String fieldValue = "";
                    if (busienss.get(field) != null) {
                        Object fieldObj = busienss.get(field);
                        if (fieldObj instanceof String) {
                            fieldValue = (String) busienss.get(field);
                            if (busienss.get(field + "_default") != null) {
                                fieldValue = (String) busienss.get(field + "_default");
                            }
                        } else if (fieldObj instanceof BasicDBList) {
                            BasicDBList fieldList = (BasicDBList) fieldObj;
                            if (busienss.get(field + "_default") != null) {
                                fieldList = (BasicDBList) busienss.get(field + "_default");
                            }
                            for (Object obj : fieldList) {
                                fieldValue += (String) obj;
                                fieldValue += ",";
                            }
                            if (fieldValue.length() > 0) {
                                fieldValue = fieldValue.substring(0, fieldValue.length() - 1);
                            }
                        }

                    }
                    createCell(10 + k, fieldValue);
                    backInfoIndex++;
                }
                //工单备注
                if(busHistoryMap.size() > 0){
                    if(busHistoryMap.get(busienss.get("_id")) != null && !busHistoryMap.get(busienss.get("_id")).equals("")){
                        createCell(backInfoIndex, busHistoryMap.get(busienss.get("_id")));
                    }else{
                        createCell(backInfoIndex, "");
                    }
                }else{
                    createCell(backInfoIndex, "");
                }
                endRow();
            }
            log.info(String.format("%s消耗时间[%d ms]", "export-end", System.currentTimeMillis() - time));
            endSheet();
        } else {
            log.log(Level.WARNING, "business start flow is not found!");
        }
    }

    private void processCascadSelect(List<String> fields, Map<String, DBObject> flowFields) {
        List<String> tempFields = new ArrayList<String>();
        tempFields.addAll(fields);
        fields.clear();
        Map<String, DBObject> tempFlowFields = new HashMap<String, DBObject>();
        tempFlowFields.putAll(flowFields);
        for (String field : tempFields) {
            fields.add(field);
            DBObject fieldObj = tempFlowFields.get(field);
//            log.info("field========"+field);
            if (fieldObj.get("type").equals("dropdown")) {
                String dic = (String) fieldObj.get("dic");
                DBObject dicObj = MongoProvider.findOne("app_optiondic", new BasicDBObject().append("_id", dic));
                int cascade = Integer.parseInt(String.valueOf(dicObj.get("cascade")));
                if (cascade == 2) {
                    BasicDBList headers = (BasicDBList) dicObj.get("headers");
                    flowFields.get(field).put("name", headers.get(0));
                    fields.add(field + "_1");
                    flowFields.put(field + "_1", new BasicDBObject().append("name", headers.get(1)));
                } else if (cascade == 3) {
                    BasicDBList headers = (BasicDBList) dicObj.get("headers");
                    flowFields.get(field).put("name", headers.get(0));
                    fields.add(field + "_1");
                    flowFields.put(field + "_1", new BasicDBObject().append("name", headers.get(1)));
                    fields.add(field + "_2");
                    flowFields.put(field + "_2", new BasicDBObject().append("name", headers.get(2)));
                }
            }
        }
    }

    private String getBusinssStatus(String status) {
        if ("dealing".equalsIgnoreCase(status)) {
            return "处理中";
        } else if ("complete".equalsIgnoreCase(status)) {
            return "已完成";
        } else {
            return "已取消";
        }
    }

    private void genrateHeader(List<String> fields, Map<String, DBObject> flowFields) throws IOException {
        insertRow(0);
        List<String> headers = new ArrayList<String>();
        headers.add("业务编号");
        headers.add("客户名称");
        headers.add("业务类型");
        headers.add("业务步骤");
        headers.add("创建时间");
        headers.add("业务状态");
        headers.add("创建人");
        headers.add("当前处理人");
        headers.add("来电号码");
        headers.add("关闭时间");
        for (String field : fields) {
            if(flowFields.get(field)!=null){
                headers.add((String) flowFields.get(field).get("name"));
            }
        }
        headers.add("工单备注");

        for (int i = 0; i < headers.size(); i++) {
            createCell(i, headers.get(i));
        }
        endRow();
    }

    private Map<String, DBObject> processCacheMap(List<DBObject> list) {
        Map<String, DBObject> map = new HashMap<String, DBObject>();
        for (DBObject obj : list) {
            map.put((String) obj.get("_id"), obj);
        }
        return map;
    }


    private Map<String, DBObject> getFlowFields(String flow) {
        Map<String, DBObject> result = new HashMap<String, DBObject>();
        DBObject condition = new BasicDBObject().append("flow_id", flow);
        List<DBObject> fields = MongoProvider.find(DB_BUSINESS_FLOW_FIELDS, condition);
        for (int i = 0; i < fields.size(); i++) {
            DBObject obj=fields.get(i);
            String type=(String)obj.get("type");
            if(!"file".equals(type)){
                result.put((String) fields.get(i).get("_id"), fields.get(i));
            }
        }
        return result;
    }

    private List<String> getStepFields(List<DBObject> flowList) {
        List<String> result = new ArrayList<String>();
        Map<String,String> mapResult = new LinkedHashMap<String,String>();
        for (int ii = 0; ii <flowList.size() ; ii++) {
            BasicDBList rows = (BasicDBList) flowList.get(ii).get("stepFields");
            BasicDBList actions = (BasicDBList) flowList.get(ii).get("actions"); //步骤动作
            if(rows != null){
                for (int i = 0; i < rows.size(); i++) {
                    DBObject rowItem = (DBObject) rows.get(i);
                    BasicDBList cols = (BasicDBList) rowItem.get("cols");
                    for (int j = 0; j < cols.size(); j++) {
                        DBObject colItem = (DBObject) cols.get(j);
                        BasicDBList fields = (BasicDBList) colItem.get("fields");
                        for (int k = 0; k < fields.size(); k++) {
                            DBObject field = (DBObject) fields.get(k);
                            String type=(String)field.get("type");
                            if(!"file".equals(type)){//用map过滤到重复的字段
                                mapResult.put((String) field.get("_id"),(String) field.get("_id"));
                            }
                        }
                    }
                }
            }

            if(actions!=null && actions.size() > 0){
                DBObject action = (DBObject) actions.get(0);
                BasicDBList actionFields = (BasicDBList) action.get("actionFields");
                if(actionFields.size() > 0){
                    for (int i = 0; i < actionFields.size(); i++) {
                        DBObject rowItem = (DBObject) actionFields.get(i);
                        BasicDBList cols = (BasicDBList) rowItem.get("cols");
                        for (int j = 0; j < cols.size(); j++) {
                            DBObject colItem = (DBObject) cols.get(j);
                            BasicDBList fields = (BasicDBList) colItem.get("fields");
                            for (int k = 0; k < fields.size(); k++) {
                                DBObject field = (DBObject) fields.get(k);
                                String type=(String)field.get("type");
                                if(!"file".equals(type)){//用map过滤到重复的字段
                                    mapResult.put((String) field.get("_id"),(String) field.get("_id"));
                                }
                            }
                        }
                    }
                }
            }
        }
        //讲去重的字段放入list
        Iterator it = mapResult.keySet().iterator();
        while (it.hasNext()) {
            String key = it.next().toString();
            result.add(key);
        }
        return result;
    }
}
