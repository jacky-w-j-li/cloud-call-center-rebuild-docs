package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.io.IOException;
import java.util.*;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Pattern;

/**
 * Created by zhangyang on 15/3/11.
 */
public class QuestionnaireExport extends XssfWriter {
    private static Logger log = Logger.getLogger(QuestionnaireExport.class.getName());
    public static String DB_QUESTIONNAIRE_TEMP = "account_questionnaire_temp";
    public static String DB_QUESTIONNAIRE_QUES = "account_questionnaire_question";
    public static String DB_QUESTIONNAIRE = "_questionnaire";
    public static Map<String,Integer> headerMap = new HashMap<String, Integer>();


    @Override
    public void generate(Map<String, Object> query) throws Exception {
        DBObject condition = new BasicDBObject();
        condition.putAll(query);
        condition.removeField("account");
        condition.removeField("query");

        //process $or
        if(query.get("query") != null){
            String queryStr = (String)query.get("query");
            BasicDBList dbOrList = new BasicDBList();
            dbOrList.add(new BasicDBObject("name", Pattern.compile(queryStr)));
            dbOrList.add(new BasicDBObject("phone",Pattern.compile(queryStr)));
            condition.put("$or",dbOrList);
        }

        String accountId = (String) query.get("account");
        String tempId = (String)query.get("temp_id");
        DBObject tempObj = MongoProvider.findOne(DB_QUESTIONNAIRE_TEMP, new BasicDBObject().append("_id", tempId));
        if(tempObj != null){
            //find user
            DBObject userCondition = new BasicDBObject().append("account", accountId);
            userCondition.put("product","cc");
            List<DBObject> userList = MongoProvider.find("bill", "platform_user", userCondition);
            Map<String, DBObject> userCache = processCacheMap(userList);

            List<DBObject> ques = MongoProvider.find(DB_QUESTIONNAIRE_QUES, new BasicDBObject().append("temp_id", tempId));
            Map<String,Map<String,String>> quesMap = new HashMap<String, Map<String, String>>();
            for(int i=0;i<ques.size();i++){
                DBObject oneQues = ques.get(i);
                Map<String,String> answerMap = new HashMap<String, String>();
                List<DBObject> answers = (List<DBObject>)oneQues.get("anws");
                for(int m = 0;m < answers.size();m++){
                    DBObject oneAnswerObj = answers.get(m);
                    answerMap.put((String)oneAnswerObj.get("_id"),(String)oneAnswerObj.get("answer"));
                }
                quesMap.put((String)oneQues.get("_id"),answerMap);
            }

            beginSheet();
            genrateHeader(ques);
            List<DBObject> quesList = MongoProvider.find(accountId + DB_QUESTIONNAIRE, condition, accountId);
            for(int i=0;i<quesList.size();i++){
                DBObject quesObj = quesList.get(i);
                insertRow(i + 1);
                createCell(0, (String) quesObj.get("name"));
                createCell(1,(String)quesObj.get("phone"));
                createCell(2,(String)quesObj.get("lastUpdateTime"));
                createCell(3, getQuesResult((String) quesObj.get("result"),tempObj));
                createCell(4,userCache.get(quesObj.get("owner")) == null ? "":(String) userCache.get(quesObj.get("owner")).get("exten"));
                DBObject answs = (DBObject)quesObj.get("anws");
                Set<String> answSet = answs.keySet();

                Map<Integer,String> valueMap = new HashMap<Integer, String>();
                for(int r = 0; r < ques.size(); r ++){
                    valueMap.put(r+5,"");
                }


                for(String key : answSet){
                    int index = headerMap.get(key);
                    String answerId = (String)answs.get(key);
                    String value = quesMap.get(key).get(answerId);
                    if(value == null) value = "";
                    valueMap.put(index,value);
                }

                for(int r = 0; r < ques.size(); r ++){
                    createCell(r+5,valueMap.get(r+5) == null ? "":valueMap.get(r+5));
                }


                List<DBObject> comments = (List<DBObject>)quesObj.get("comments");
                if(comments != null && comments.size() > 0){
                    for(int k = 0;k < comments.size();k ++){
                        DBObject commentObj = comments.get(k);
                        createCell(k + ques.size() + 5,commentObj.get("comment") == null ? "" : (String)commentObj.get("comment"));
                    }

                }
                endRow();
            }
            endSheet();

        } else {
            log.log(Level.WARNING,"questionnaire temp is not found !");
        }

    }

    private Map<String, DBObject> processCacheMap(List<DBObject> list) {
        Map<String, DBObject> map = new HashMap<String, DBObject>();
        for (DBObject obj : list) {
            map.put((String) obj.get("_id"), obj);
        }
        return map;
    }

    private String getQuesResult(String result , DBObject tempObj) {
        if(tempObj.get("qstatus") != null){
            DBObject statusObj = (DBObject)tempObj.get("qstatus");
            Object resultStr = statusObj.get(result);
            if(resultStr != null){
                return (String)resultStr;
            }else {
                return "其他";
            }

        } else {
            if (result.equalsIgnoreCase("success")) {
                return "回访成功";
            } else if (result.equalsIgnoreCase("invalid")) {
                return "无效电话";
            } else if (result.equalsIgnoreCase("noAnswer")) {
                return "无人接听";
            } else if (result.equalsIgnoreCase("imparity")) {
                return "客户部配合";
            } else {
                return "其他";
            }
        }

    }

    private void genrateHeader(List<DBObject> ques) throws IOException {
        insertRow(0);
        List<String> headers = new ArrayList<String>();
        headers.add("客户姓名");
        headers.add("回访电话");
        headers.add("回访时间");
        headers.add("回访结果");
        headers.add("回访坐席");
        headerMap.clear();
        for(int i=0;i<ques.size();i++){
            DBObject quesObj = ques.get(i);
            String name = (String) quesObj.get("name");
            String context = (String) quesObj.get("context");
            headers.add(name + ":" + context);
            headerMap.put((String)quesObj.get("_id"),i+5);
        }
        headers.add("备注");

        for(int i=0;i<headers.size();i++){
            createCell(i,headers.get(i));
        }
        endRow();
    }
}
