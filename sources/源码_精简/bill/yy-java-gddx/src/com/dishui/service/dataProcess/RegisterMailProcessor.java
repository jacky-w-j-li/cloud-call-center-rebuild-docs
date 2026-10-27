package com.dishui.service.dataProcess;

import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.Date;
import java.util.List;

/**
 * Created by zhangyang on 15/8/24.
 */
public class RegisterMailProcessor implements Processor{
    private static String name = "registerMailTimeout";
    private long validTime = 24 * 60 * 60 * 1000;

    @Override
    public void process() {
        long now = new Date().getTime();
        long minTime = now - validTime;
        DBObject condition = new BasicDBObject();
        condition.put("status","ready");
        condition.put("timestamp",new BasicDBObject().append("$lte",minTime));
        List<DBObject> mailList =  MongoProvider.find("bill_platform_mail_register",condition);
        for(int i=0;i<mailList.size();i++){
            DBObject mailObj = mailList.get(i);
            mailObj.put("status","timeout");
            MongoProvider.insert("bill_platform_mail_register_timeout", mailObj);
            MongoProvider.remove("bill_platform_mail_register",new BasicDBObject().append("_id",mailObj.get("_id")));
        }
    }

    @Override
    public String getName() {
        return name;
    }
}
