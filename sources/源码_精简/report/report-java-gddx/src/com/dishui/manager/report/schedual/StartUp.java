package com.dishui.manager.report.schedual;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.impl.im.ImAgentReportHandler;
import com.dishui.manager.report.impl.im.ImBusinessReportHandler;
import com.dishui.manager.report.impl.im.ImMessageReportHandler;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.AppConfig;
import com.dishui.manager.service.Utils;
import com.dishui.util.log.IceLogger;
import com.mongodb.BasicDBObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Created by yaxi on 15-11-10.
 */
public class StartUp {


    public void start(){
        /*
        {
	"_id": ObjectId('564c4813839d8045862e295b'),
	"account": "N00000000264",
	"agentId": "d5614bb0-41a9-11e5-9402-bbb5995842ea",
	"dayId": "20151118",
	"monthId": "201511",
	"platform": "pc",
	"yearId": "2015",
	"finishSessionCount": 2,
	"sessionToTalTimeLength": 94,
	"accessSessionCount": 2,
	"replyCount": 2
}
         */
        /*
        this._id = obj.get("_id").toString();
        this.type = obj.get("type").toString();
        this.account = obj.get("account").toString();
        this.reportTime = obj.get("reportTime").toString();
        this.reportStatus = obj.get("reportStatus").toString();
        this.businessData =(HashMap<String, Object>) obj.get("businessData");
         */
       List<String> platforms = new ArrayList<String>();
        platforms.add("pc");
        platforms.add("sdk");
        platforms.add("weixin");
        platforms.add("wap");

        for(int i=0; i<189; i++){
            BasicDBObject dbObject = new BasicDBObject();
            dbObject.put("_id", Utils.getUniqueid());
            dbObject.put("type", "newSession");
            dbObject.put("account", "N00000000264");
            dbObject.put("reportTime", "2015-11-20 11:45:26");
            dbObject.put("reportStatus", "ready");
            BasicDBObject dbObject1 = new BasicDBObject();
            dbObject1.append("platform", platforms.get(new Random().nextInt(4)));
            dbObject1.append("accessId", "a8cd6f10-785f-11e5-af51-552f9a7c5fda");
            dbObject1.append("agentType", "manual");
            dbObject.put("businessData", dbObject1);
            ImMessageReportHandler.getInstance().newSession(new Event(dbObject));
        }

       for(int i=0; i<34; i++){
           BasicDBObject dbObject = new BasicDBObject();
           dbObject.put("_id", Utils.getUniqueid());
           dbObject.put("type", "firstReply");
           dbObject.put("account", "N00000000264");
           dbObject.put("reportTime", "2015-11-20 11:45:26");
           dbObject.put("reportStatus", "ready");
           BasicDBObject dbObject1 = new BasicDBObject();
           dbObject1.append("platform", platforms.get(new Random().nextInt(4)));
           dbObject1.append("accessId", "a8cd6f10-785f-11e5-af51-552f9a7c5fda");
           dbObject1.append("agentId", "d5614bb0-41a9-11e5-9402-bbb5995842ea");
           dbObject1.append("firstResponseTimeLength", 102630+new Random().nextInt(2328));

           dbObject.put("businessData", dbObject1);
           ImMessageReportHandler.getInstance().firstReply(new Event(dbObject));
       }
        for(int i=0; i<234; i++){
            BasicDBObject dbObject = new BasicDBObject();
            dbObject.put("_id", Utils.getUniqueid());
            dbObject.put("type", "msgOut");
            dbObject.put("account", "N00000000264");
            dbObject.put("reportTime", "2015-11-20 11:45:26");
            dbObject.put("reportStatus", "ready");
            BasicDBObject dbObject1 = new BasicDBObject();
            dbObject1.append("platform", platforms.get(new Random().nextInt(4)));
            dbObject1.append("accessId", "a8cd6f10-785f-11e5-af51-552f9a7c5fda");
            dbObject1.append("agentId", "d5614bb0-41a9-11e5-9402-bbb5995842ea");

            dbObject.put("businessData", dbObject1);
            ImAgentReportHandler.getInstance().newMsgOut(new Event(dbObject));
        }

        for(int i=0; i<47; i++){
            BasicDBObject dbObject = new BasicDBObject();
            dbObject.put("_id", Utils.getUniqueid());
            dbObject.put("type", "closeSession");
            dbObject.put("account", "N00000000264");
            dbObject.put("reportTime", "2015-11-20 11:45:26");
            dbObject.put("reportStatus", "ready");
            BasicDBObject dbObject1 = new BasicDBObject();
            dbObject1.append("platform", platforms.get(new Random().nextInt(4)));
            dbObject1.append("accessId", "a8cd6f10-785f-11e5-af51-552f9a7c5fda");
            dbObject1.append("agentId", "d5614bb0-41a9-11e5-9402-bbb5995842ea");
           dbObject1.append("consultType", "07eee290-7eb3-11e5-a5d0-9b0216b408b8");
           dbObject1.append("sessionTimeLength", 71361+new Random().nextInt(2345));

            dbObject.put("businessData", dbObject1);
            ImAgentReportHandler.getInstance().closeSession(new Event(dbObject));
            ImMessageReportHandler.getInstance().closeSession(new Event(dbObject));
            ImBusinessReportHandler.getInstance().closeSession(new Event(dbObject));
        }

        for(int i=0; i<59; i++){
            BasicDBObject dbObject = new BasicDBObject();
            dbObject.put("_id", Utils.getUniqueid());
            dbObject.put("type", "accessSession");
            dbObject.put("account", "N00000000264");
            dbObject.put("reportTime", "2015-11-20 11:45:26");
            dbObject.put("reportStatus", "ready");
            BasicDBObject dbObject1 = new BasicDBObject();
            dbObject1.append("platform", platforms.get(new Random().nextInt(4)));
            dbObject1.append("accessId", "a8cd6f10-785f-11e5-af51-552f9a7c5fda");
            dbObject1.append("agentId", "d5614bb0-41a9-11e5-9402-bbb5995842ea");
           dbObject1.append("accessSessionCount", 1);

            dbObject.put("businessData", dbObject1);
            ImAgentReportHandler.getInstance().accessSession(new Event(dbObject));
        }

        for(int i=0; i<200; i++){

            BasicDBObject dbObject = new BasicDBObject();
            dbObject.put("_id", Utils.getUniqueid());
            dbObject.put("type", "msgIn");
            dbObject.put("account", "N00000000264");
            dbObject.put("reportTime", "2015-11-20 11:45:26");
            dbObject.put("reportStatus", "ready");
            BasicDBObject dbObject1 = new BasicDBObject();
            dbObject1.append("platform", platforms.get(new Random().nextInt(4)));
            dbObject1.append("accessId", "a8cd6f10-785f-11e5-af51-552f9a7c5fda");
           dbObject1.append("agentType", "manual");

            dbObject.put("businessData", dbObject1);
            ImMessageReportHandler.getInstance().newMsgIn(new Event(dbObject));
        }

        for(int i=0; i<10; i++){
            BasicDBObject dbObject = new BasicDBObject();
            dbObject.put("_id", Utils.getUniqueid());
            dbObject.put("type", "redirectSession");
            dbObject.put("account", "N00000000264");
            dbObject.put("reportTime", "2015-11-20 11:45:26");
            dbObject.put("reportStatus", "ready");
            BasicDBObject dbObject1 = new BasicDBObject();
            dbObject1.append("platform", platforms.get(new Random().nextInt(4)));
            dbObject1.append("accessId", "a8cd6f10-785f-11e5-af51-552f9a7c5fda");
            dbObject1.append("agentId", "d5614bb0-41a9-11e5-9402-bbb5995842ea");
            dbObject1.append("toUser", "d5dce450-41a9-11e5-9402-bbb5995842ea");

            dbObject.put("businessData", dbObject1);
            ImAgentReportHandler.getInstance().redirectSession(new Event(dbObject));
        }

        for(int i=0; i<30; i++){
            BasicDBObject dbObject = new BasicDBObject();
            dbObject.put("_id", Utils.getUniqueid());
            dbObject.put("type", "newVisitor");
            dbObject.put("account", "N00000000264");
            dbObject.put("reportTime", "2015-11-20 11:45:26");
            dbObject.put("reportStatus", "ready");
            BasicDBObject dbObject1 = new BasicDBObject();
            dbObject1.append("platform", platforms.get(new Random().nextInt(4)));
            dbObject1.append("accessId", "a8cd6f10-785f-11e5-af51-552f9a7c5fda");
            dbObject1.append("agentType", "manual");
//            dbObject1.append("toUser", "d5dce450-41a9-11e5-9402-bbb5995842ea");

            dbObject.put("businessData", dbObject1);
            ImMessageReportHandler.getInstance().newVisitor(new Event(dbObject));
        }


    }

    public static void main(String[] args){
        AppConfig.getInstance();
        IceLogger.initLogger(AppConfig.getInstance().getLogDir(),
                "managerService", AppConfig.getInstance().getLogLevel(),
                true);
        System.out.println("Starting DB plugin...");
        MongoConnect.getInstance().connect();
        new StartUp().start();
    }
}
