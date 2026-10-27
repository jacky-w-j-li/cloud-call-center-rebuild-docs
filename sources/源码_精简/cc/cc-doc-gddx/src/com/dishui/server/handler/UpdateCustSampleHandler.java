package com.dishui.server.handler;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.command.C5Action;
import com.dishui.manager.command.C5Response;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by wangyk on 2016/3/17.
 */
public class UpdateCustSampleHandler {
    private static Logger log = Logger.getLogger(UpdateCustSampleHandler.class.getName());
    private static final String CUSTOMER_SAMPLE="_customer_sample";
    /**
     * 通过样本ID修改所属人，分库
     * @param action
     * @return response
     */
    public static synchronized C5Response updateCustSample(C5Action action){
        C5Response response = new C5Response(action);
        try {
            //获取参数
            String account = action.getStringValue("account");
            String taskId = action.getStringValue("taskId");
            String ownerId = action.getStringValue("ownerId");

            if(!account.equals("") && !ownerId.equals("")){
                //设置查询条件
                String collectionName = account + CUSTOMER_SAMPLE;

                DBObject sample = null;
                boolean isNewFlag = false;
                //先查询未拨电话
                DBObject getUnCalledSampleCondition = new BasicDBObject();
                getUnCalledSampleCondition.put("owner", ownerId);
                getUnCalledSampleCondition.put("taskId", taskId);
                getUnCalledSampleCondition.put("dialTag", "NA");
                sample = MongoProvider.findOne(collectionName, getUnCalledSampleCondition, account);

                //如果没有未拨打取出一条号码
                if(sample == null) {
                    isNewFlag = true;
                    DBObject getSampleCondition = new BasicDBObject();
                    DBObject sort = new BasicDBObject("lastTime",1);
                    getSampleCondition.put("owner", "NA");
                    getSampleCondition.put("taskId", taskId);
                    List<DBObject> samples = MongoProvider.find(collectionName, getSampleCondition, account, sort);
                    if(samples.size() > 0)
                        sample = samples.get(0);
                }

                if(sample == null){
                    response.setSucceed(false);
                }else if (sample != null && !isNewFlag){
                    response.addParameter("sample",sample);
                    response.addParameter("isNewFlag",isNewFlag);
                    response.setSucceed(true);
                }else {
                    response.addParameter("sample",sample);
                    response.addParameter("isNewFlag",isNewFlag);
                    DBObject condition = new BasicDBObject();
                    condition.put("_id",sample.get("_id"));
                    //设置更新条件
                    DBObject setData = new BasicDBObject();
                    setData.put("owner",ownerId);
                    setData.put("lastTime", Utils.getCurrentDate());
                    DBObject updateData = new BasicDBObject();
                    updateData.put("$set",setData);

                    MongoProvider.update(collectionName, condition, updateData,account);
                    response.setSucceed(true);
                }
            }else{
                response.setSucceed(false);
            }
        }catch (Exception e){
            e.printStackTrace();
            log.log(Level.WARNING, "updateCustSampl eerror!", e);
            response.setMessage(e.getMessage());
            response.setSucceed(false);
        }
        return  response;
    }
}
