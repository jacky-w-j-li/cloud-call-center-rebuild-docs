package com.dishui.util.excel;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.util.AccountUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

import java.io.IOException;
import java.util.*;
import java.util.Map.Entry;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.regex.Pattern;

import org.apache.commons.lang.StringUtils;

/**
 * Created by zhangyang on 15/3/11.
 */
public class QuestionnaireExport extends XssfWriter {
    private static Logger log = Logger.getLogger(QuestionnaireExport.class.getName());
    public static String DB_QUESTIONNAIRE_TEMP = "account_questionnaire_temp";
    public static String DB_QUESTIONNAIRE_QUES = "account_questionnaire_question";
    public static String DB_QUESTIONNAIRE = "_questionnaire";
    public static String DB_QUESTIONNAIRE_FIELD = "account_questionnaire_field";
    public static Map<String,Integer> headerMap = new HashMap<String, Integer>();



    @Override
    public void generate(Map<String, Object> query) throws Exception {

        Map<String,Integer> awsFromTempColMap = new LinkedHashMap<String, Integer>();
        Map<String,String> awsFromTempMap = new LinkedHashMap<String, String>();
    	
        DBObject condition = new BasicDBObject();
        condition.putAll(query);
        condition.removeField("account");
        condition.removeField("query");

        //process $or
        if(query.get("name") != null){
        	String queryStr = (String)query.get("name");
        	condition.put("name", Pattern.compile(queryStr));
        }
        if(query.get("phone") != null){
        	String queryStr = (String)query.get("phone");
        	condition.put("phone", Pattern.compile(queryStr));
        }

        if(query.get("batchNo") != null){
        	String batchNoStr = (String) query.get("batchNo");
        	batchNoStr = batchNoStr.replaceAll("; ", ";");
        	String[] batchNos =batchNoStr .split(";");
        	DBObject batchNoCondition = new BasicDBObject("$in",batchNos);
        	condition.put("batchNo", batchNoCondition);
        }
        if(query.get("batchRemark") != null){
        	String batchRemarkStr = (String) query.get("batchRemark");
        	batchRemarkStr = batchRemarkStr.replaceAll("; ", ";");
        	String[] batchRemarks =batchRemarkStr .split(";");
        	DBObject batchRemarkCondition = new BasicDBObject("$in",batchRemarks);
        	condition.put("batchRemark", batchRemarkCondition);
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

            List<DBObject> ques = new ArrayList<DBObject>();
    		DBCollection quesCollection = null;
    		quesCollection = MongoConnect.getInstance().getDB().getCollection(DB_QUESTIONNAIRE_QUES);
    		DBObject sort = new BasicDBObject("createTime",1);
    		DBCursor result = quesCollection.find(new BasicDBObject().append("temp_id", tempId)).sort(sort);
    		while (result.hasNext()) {
				DBObject ob = result.next();
				ques.add(ob);
			}
    		
            
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
            List<DBObject> fieldlistFromDb = MongoProvider.find(DB_QUESTIONNAIRE_FIELD, new BasicDBObject().append("temp_id", tempId));
            Map<String,String> fieldMapFromTemp = new LinkedHashMap<String, String>();
            //查询出自定义字段
        	for(DBObject field :fieldlistFromDb){
        		Object object = field.get("_id");
        		if(object!=null){
        			String str = (String)object;
            		fieldMapFromTemp.put(str,(String) (field.get("name")));
        		}
        	}
            //计算表头
            genrateHeader(ques,fieldMapFromTemp,awsFromTempColMap,awsFromTempMap);
            
            
            int i=0;
            try {
    			DBCollection collection = MongoConnect.getInstance().getDB(AccountUtil.getAccountDb(accountId))
    					.getCollection(accountId + DB_QUESTIONNAIRE);
    			DBCursor mongoResult = collection.find(condition);
    			while (mongoResult.hasNext()) {
                    DBObject quesObj = mongoResult.next();
    				insertRow(i + 2);
                    int j =0;
                    if(fieldMapFromTemp.size()>0){
                    	Set<Entry<String, String>> fieldMapFromTempEntrySet = fieldMapFromTemp.entrySet();
                    	for(Entry<String, String> entry :fieldMapFromTempEntrySet){
    	                	String  value = "";
    	                	String key = entry.getKey();
    	                	if(key.indexOf("_name")>-1){
    	                		value = (String) quesObj.get("name");
    	                	}else if(key.indexOf("_phone")>-1){
    	                		value = (String) quesObj.get("phone");
    	                	}else{
    	                		value = (String)(quesObj.get(entry.getKey()));
    	                	}
    	                	createCell(j,value);
    	                	j++;
                    	}
                    }

                    createCell(j+0,(String)quesObj.get("lastUpdateTime"));
                    createCell(j+1, getQuesResult((String) quesObj.get("result"),tempObj));
                    createCell(j+2,userCache.get(quesObj.get("owner")) == null ? "":(String) userCache.get(quesObj.get("owner")).get("exten"));
                    DBObject answs = (DBObject)quesObj.get("anws");
                    Set<String> answSet = answs.keySet();
                    Map<Integer,Boolean> valueMap = new HashMap<Integer, Boolean>();
                    /*for(int r = 0; r < awsFromTempMap.size(); r ++){
                        valueMap.put(j+r+3,false);
                    }*/

                    for(String key : answSet){
                        Object answer = answs.get(key);
                        //如果是字符串(多选框升级时兼容之前的单选)
                        if(answer instanceof String){
                        	String answerId = (String)answs.get(key);
                        	Integer answerCol = awsFromTempColMap.get(answerId);
                        	if(answerCol!=null){
                        		awsFromTempMap.get(answerId);
                            	createCell(answerCol,awsFromTempMap.get(answerId));
                        	}
                        }else if (answer instanceof Object){
                        	DBObject answerObject = (DBObject) answer;
                        	List<String> aws= (List<String>) answerObject.get("aws");
                        	if(aws!=null){
    	                    	for(String awId : aws){
    	                    		Integer answerCol = awsFromTempColMap.get(awId);
    	                    		if(answerCol!=null){
    	                    			createCell(answerCol,awsFromTempMap.get(awId));
    	                    		}
    	                    	}
    	                    	String other = (String) answerObject.get("other");
    	                    	if(StringUtils.isNotBlank(other)){
    	                    		Integer otherCol = awsFromTempColMap.get(key);
    	                    		if(otherCol!=null){
    	                    			createCell(otherCol,other);
    	                    		}
    	                    	}
                        	}
                        }
                    }
                    List<DBObject> comments = (List<DBObject>)quesObj.get("comments");
                    if(comments != null && comments.size() > 0){
                        for(int k = 0;k < comments.size();k ++){
                            DBObject commentObj = comments.get(k);
                            createCell(j+ k + awsFromTempColMap.size() + 3,commentObj.get("comment") == null ? "" : (String)commentObj.get("comment"));
                        }
                    }
                    endRow();
                    i++;
    				
    			}
    		} catch (Exception e) {
    			log.log(Level.WARNING, "", e);
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
    /**
     * fieldMapFromTemp 自定义字段的列表
     */
    private void genrateHeader(List<DBObject> ques, Map<String, String> fieldMapFromTemp,Map<String,Integer> awsFromTempColMap,Map<String,String> awsFromTempMap) throws IOException {
    	List<DBObject> anwsFromTemp = new ArrayList<DBObject>();
        insertRow(0);
        List<String> headers = new ArrayList<String>();
        for(Entry<String, String> entry:fieldMapFromTemp.entrySet()){
        	String fieldName = entry.getValue();
        	 headers.add(fieldName);
        }
        headers.add("回访时间");
        headers.add("回访结果");
        headers.add("回访坐席");
        for(int i=0;i<headers.size();i++){
            createCell(i,headers.get(i));
            mergedCell(0,1,i,i);
        }
        headerMap.clear();
        for(int i=0;i<ques.size();i++){
            DBObject quesObj = ques.get(i);
            int quesHeaderStartCol = 3+fieldMapFromTemp.size()+awsFromTempColMap.size();
            //还要计算答案的个数
            Object anwsObject = quesObj.get("anws");
            List<DBObject> anwsList = new ArrayList<DBObject>();
            if(anwsObject!=null){
            	anwsList = (List<DBObject>) anwsObject;
            }

        	for(int j=0;j<anwsList.size();j++){
            	DBObject anwFromTemp = anwsList.get(j);
            	String id = (String)anwFromTemp.get("_id");
            	int anwCol = 3+fieldMapFromTemp.size()+awsFromTempColMap.size();
            	awsFromTempColMap.put(id, anwCol);//答案对应的列数;
            	awsFromTempMap.put(id,(String) anwFromTemp.get("answer"));
            }
            
        	awsFromTempColMap.put((String) quesObj.get("_id"), 3+fieldMapFromTemp.size()+awsFromTempColMap.size());//答案对应的列数;
        	awsFromTempMap.put((String) quesObj.get("_id"),"备注");
            
            int anwsNum = anwsList.size();
            String name = (String) quesObj.get("name");
            String context = (String) quesObj.get("context");
            createCell(quesHeaderStartCol,name + ":" + context);
            //合并单元格 
            if(anwsNum>0){
            	mergedCell(0,0,quesHeaderStartCol,quesHeaderStartCol+anwsNum);
            }
            //headerMap.put((String)quesObj.get("_id"),i+3+fieldMapFromTemp.size());
        }
        createCell(3+fieldMapFromTemp.size()+awsFromTempColMap.size(),"备注");
        mergedCell(0,1,3+fieldMapFromTemp.size()+awsFromTempColMap.size(),3+fieldMapFromTemp.size()+awsFromTempColMap.size());
        endRow();
        //开始第二行打印--答案的打印
        insertRow(1);
        Set<Entry<String, String>> entrySet = awsFromTempMap.entrySet();
        for(Entry<String, String> entry:entrySet){
        	String key = entry.getKey();
        	String answer = entry.getValue();
        	Integer col = awsFromTempColMap.get(key);
        	if(col!=null){
        		createCell(col,answer);
        	}
        }
        endRow();
    }
}
