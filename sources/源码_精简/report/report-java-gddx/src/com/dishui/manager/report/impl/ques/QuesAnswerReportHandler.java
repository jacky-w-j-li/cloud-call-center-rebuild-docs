package com.dishui.manager.report.impl.ques;

import java.util.List;
import java.util.Map;
import java.util.Set;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

/**
 * 问卷调查报表
 * @author jiaji 2016/07/02
 *
 */
public class QuesAnswerReportHandler {

    public static QuesAnswerReportHandler instance;

    private QuesAnswerReportHandler(){
        instance = this;
    }

    public static QuesAnswerReportHandler getInstance(){
        if (instance == null)
            new QuesAnswerReportHandler();
        return instance;
    }
    public void newAnwser(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("temp_id", map.get("temp_id"));
        condition.put("batchNo", map.get("batchNo"));
        condition.put("batchRemark", map.get("batchRemark"));
        //给每个匹配的问卷问题结果加1
        BasicDBObject anws = (BasicDBObject) map.get("anws");
        //前边key是问题id，后边是答案内容
        Set<String> keySet = anws.keySet();
        
        //获取ques list
        BasicDBObject findQuestion = new BasicDBObject();
		findQuestion.put("temp_id", map.get("temp_id"));
		List<BasicDBObject> quess = MongoProvider.findFromApp("cc","account_questionnaire_question",
				findQuestion);
        
		for(BasicDBObject ques :quess){
			String quesId = ques.getString("_id");
			BasicDBObject incDocAnwser= new BasicDBObject();
        	condition.put("quesId", quesId);
        	BasicDBObject anwResultItem = (BasicDBObject) anws.get(quesId);
        	if(anwResultItem!=null){
        		Object awsObj = anwResultItem.get("aws");
            	if(awsObj!=null){
            		@SuppressWarnings("unchecked")
    				List<String> aws = (List<String>) awsObj;
            		for(String answerId:aws){
            			incDocAnwser.put("anws."+answerId,1);
            		}
            	}
        	}
        	incDocAnwser.put("_totalQuesSubmitNums", 1);//问卷提交的数量
        	if(incDocAnwser.size()>0){
        		MongoProvider.update(Constant.CC_QUES_ANSWSER_REPORT, condition, new BasicDBObject("$inc", incDocAnwser), true);
        	}
		}
    }

}
