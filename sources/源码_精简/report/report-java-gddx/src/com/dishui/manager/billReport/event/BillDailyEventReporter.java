package com.dishui.manager.billReport.event;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.billReport.BillEventType;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.service.Utils;
import com.dishui.util.DateUtil;
import com.mongodb.BasicDBObject;

import java.util.Date;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Created by jackwong on 16/5/23.
 *
 * 每天发送一个事件,用于驱动报表Handler执行定时任务.
 *
 *
 *
 */
public class BillDailyEventReporter {
    public static void start(){
        //第二天2点,夜深人静的时候,抛出一个事件.
        Date now = new Date();
        long time2EndOfDay = DateUtil.getEndOfDay(now).getTime() - now.getTime();

        long time2TwoClock = time2EndOfDay + TimeUnit.MILLISECONDS.convert(2,TimeUnit.HOURS);


        Executors.newScheduledThreadPool(1).scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                //check
                BasicDBObject dbBillDailyTask = MongoProvider.findOne(Constant.SYS_TASK_EVENT_CONTROL,new BasicDBObject("_id","billDailyTask"));
                if(dbBillDailyTask != null){
                    String lastEventDay = (String)dbBillDailyTask.get("lastEventDay");

                    if(lastEventDay != null && lastEventDay.equalsIgnoreCase(Utils.getCurrentDateWithoutTime())){
                        return;
                    }
                }

                EventData eventData = new EventData(BillEventType.SYSTEM_DAILY,"").addBusinessItem("","");

                MongoProvider.insertDBObject(Constant.BILL_EVENT_TABLE,eventData.toDB());

                //标记今天的事件已经抛出.
                MongoProvider.update(Constant.SYS_TASK_EVENT_CONTROL,new BasicDBObject("_id","billDailyTask"),new BasicDBObject("$set",new BasicDBObject("lastEventDay",Utils.getCurrentDateWithoutTime())),true);

            }
        }, time2TwoClock, TimeUnit.MILLISECONDS.convert(1,TimeUnit.DAYS), TimeUnit.MILLISECONDS);
    }


}
