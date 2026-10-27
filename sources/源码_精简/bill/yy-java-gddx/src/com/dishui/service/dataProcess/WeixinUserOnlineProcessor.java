package com.dishui.service.dataProcess;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;

import java.util.Date;

/**
 * Created with IntelliJ IDEA.
 * User: zhangyang
 * Date: 14-2-8
 * Time: 上午11:55
 * To change this template use File | Settings | File Templates.
 */
public class WeixinUserOnlineProcessor implements Processor {
    private static String name = "weixinUserOnline";
    private long validTime = 8 * 60 * 60 * 1000;

    @Override
    public void process() {
        long now = new Date().getTime();
        long minTime = now - validTime;
        MongoProvider.update("platform_weixin_user", new BasicDBObject().append("online", true).append("flushTime", new BasicDBObject().append("$lt", minTime)), new BasicDBObject().append("$set", new BasicDBObject().append("online", false)));
    }

    @Override
    public String getName() {
        return name;
    }
}
