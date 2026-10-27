package com.dishui.manager.report.impl.ques;

import java.util.Map;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.mongodb.BasicDBObject;

/**
 * 问卷调查报表
 * @author jiaji 2016/07/02
 *
 */
public class QuesResultReportHandler {

    public static QuesResultReportHandler instance;

    private QuesResultReportHandler(){
        instance = this;
    }

    public static QuesResultReportHandler getInstance(){
        if (instance == null)
            new QuesResultReportHandler();
        return instance;
    }
    public void newResult(Event event) {
        Map<String, Object> map = event.getBusinessData();
        BasicDBObject condition = new BasicDBObject();
        condition.put("account", event.getAccount());
        condition.put("yearId", event.getYearId());
        condition.put("monthId", event.getMonthId());
        condition.put("dayId", event.getDayId());
        condition.put("temp_id", map.get("temp_id"));
        condition.put("batchNo", map.get("batchNo"));
        condition.put("batchRemark", map.get("batchRemark"));
        BasicDBObject incDocResult = new BasicDBObject();
        //给每个匹配的问卷结果加1
        String result = (String) map.get("result");
        incDocResult.put("results."+result, 1);
        MongoProvider.update(Constant.CC_QUES_RESULT_REPORT, condition, new BasicDBObject("$inc", incDocResult), true);
    }

}
