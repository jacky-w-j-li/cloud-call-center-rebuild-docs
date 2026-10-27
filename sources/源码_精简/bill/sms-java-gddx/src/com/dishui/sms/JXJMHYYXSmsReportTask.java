package com.dishui.sms;

import com.dishui.db.mango.MongoProvider;
import com.dishui.util.JXJMHYYXSmsUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.Map;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by shenjc on 11/07/16.
 */
public class JXJMHYYXSmsReportTask extends TimerTask {
    private static Logger log = Logger.getLogger(JXJMHYYXSmsReportTask.class.getName());

    @Override
    public void run() {
        try{
            JXJMHYYXSmsUtil.getReport();
        }catch (Exception e){
            log.log(Level.WARNING, "JXJMHYYXSmsReportTask has exception", e);
        }
    }
}
