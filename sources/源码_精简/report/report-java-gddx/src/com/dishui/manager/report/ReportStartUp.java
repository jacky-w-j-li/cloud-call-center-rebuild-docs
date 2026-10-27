package com.dishui.manager.report;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.report.impl.BusinessReportHandler;
import com.dishui.manager.report.impl.ImMonitorHandler;
import com.dishui.manager.report.impl.ImReportHandler;
import com.dishui.manager.report.impl.MailMonitorHandler;
import com.dishui.manager.report.impl.MailReportHandler;
import com.dishui.manager.report.impl.QuesReportHandler;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.report.model.EventType;
import com.mongodb.BasicDBObject;

import java.util.List;
import java.util.Timer;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

/**
 * Created by yaxi on 15-11-6.
 */
public class ReportStartUp {
    private static final Logger log = Logger.getLogger(ReportStartUp.class.getName());
    private static final int LIMIT_NUM = 1000; //每次从数据库里获取的条数
    private static Thread processor;
    private static ReportStartUp instance = null;
    private ReportStartUp() {
        instance = this;
        processor = new Thread("appReportProcessor"){
            @Override
            public void run() {
                initEventHandler();
                while (true) {
                    BasicDBObject condition = new BasicDBObject();
                    condition.put("reportStatus", "ready");
                    List<BasicDBObject> eventList = null;
                    eventList = MongoProvider.find(Constant.EVENT_TABLE, condition, LIMIT_NUM);
                    log.info("获取事件条数:"+eventList.size()+"条");
                    for (BasicDBObject dbObject : eventList) {
                        Event event = null;
                        try{
                            event = new Event(dbObject);
                            if(isImEvent(event.getType())){
                                ListenerEventSource.getInstance().addToImListenerBuf(event);
                            }else if(isBusinessEvent(event.getType())){
                                ListenerEventSource.getInstance().addToBusinessListenerBuf(event);
                            }else if(isQuesEvent(event.getType())){
                            	ListenerEventSource.getInstance().addToQuesListenerBuf(event);
                            }else if(isMailEvent(event.getType())){
                            	ListenerEventSource.getInstance().addToMailListenerBuf(event);
                            }
                            //todo...
                        }catch (Exception e){
                            e.printStackTrace();
                            log.warning(e.getMessage() + dbObject.toString());
                        }
                        MongoProvider.remove(Constant.EVENT_TABLE, new BasicDBObject("_id", dbObject.get("_id")));
                    }

                    if(eventList.size()<1000){
                        try {
                            Thread.sleep(1000);
                        } catch (Exception e) {
                            e.printStackTrace();
                        }
                    }
                }
            }
        };
    };
    public Timer timer = new Timer();
    public Timer mailMonitorTimer = new Timer();

    public static ReportStartUp getInstance() {
        if (instance == null) {
            new ReportStartUp();
        }
        return instance;
    }

    public void doWork(){
        ThreadPoolExecutor workPool = new ThreadPoolExecutor(12, 80, 600, TimeUnit.SECONDS,
                new LinkedBlockingQueue<Runnable>(1000));

    }


    private void initEventHandler() {
        BusinessReportHandler bHandler = new BusinessReportHandler();
        ImReportHandler imHandler = new ImReportHandler();
        QuesReportHandler quesHandler = new QuesReportHandler();
        ImMonitorHandler imMonitorHandler = new ImMonitorHandler();
        MailMonitorHandler mailMonitorHandler = new MailMonitorHandler();
        MailReportHandler mailReportHandler = new MailReportHandler();

        ListenerEventSource.getInstance().addImListener(imMonitorHandler);
        ListenerEventSource.getInstance().addMailListener(mailMonitorHandler);
        ListenerEventSource.getInstance().addMailListener(mailReportHandler);
        ListenerEventSource.getInstance().addImListener(imHandler);
        ListenerEventSource.getInstance().addQuesListener(quesHandler);
        ListenerEventSource.getInstance().addBusinessListener(bHandler);
    }

    public void startHandleEvents(){
        processor.start();
    }

    public boolean isBusinessEvent(String type){
        if(type.equalsIgnoreCase(EventType.BUS_ASSIGN_BUSINESS) || type.equalsIgnoreCase(EventType.BUS_CANCEL_BUSINESS)
                || type.equalsIgnoreCase(EventType.BUS_FINISH_BUSINESS) || type.equalsIgnoreCase(EventType.BUS_NEW_BUSINESS)
                || type.equalsIgnoreCase(EventType.BUS_NEXT_STEP_BUSINESS) || type.equalsIgnoreCase(EventType.BUS_PICK_BUSINESS)){
            return true;
        }
        return false;
    }


    public boolean isImEvent(String type){
        if(type.equalsIgnoreCase(EventType.IM_NEW_SESSION) || type.equalsIgnoreCase(EventType.IM_NEW_VISITOR)
                || type.equalsIgnoreCase(EventType.IM_NEW_MSG_IN) || type.equalsIgnoreCase(EventType.IM_REDIRECT_SESSION)
                || type.equalsIgnoreCase(EventType.IM_CONVERT_MANUAL) || type.equalsIgnoreCase(EventType.IM_FIRST_REPLY)
                || type.equalsIgnoreCase(EventType.IM_CLOSE_SESSION) || type.equalsIgnoreCase(EventType.IM_NEW_MSG_OUT)
                || type.equalsIgnoreCase(EventType.IM_ACCESS_SESSION) || type.equalsIgnoreCase(EventType.IM_AUTO_CLAIM_STATUS)
                || type.equalsIgnoreCase(EventType.IM_SOCKET_PUSH_CONNECTED) || type.equalsIgnoreCase(EventType.IM_REDUCE_SESSION)
                || type.equalsIgnoreCase(EventType.IM_CSR) || type.equalsIgnoreCase(EventType.IM_LOST_SESSION)
        ){
            return true;
        }
        return false;
    }

    public boolean isMailEvent(String type) {
        if (type.equalsIgnoreCase(EventType.MAIL_SOCKET_PUSH_DISCONNECT)
                || type.equalsIgnoreCase(EventType.MAIL_ACCESS_SESSION)
                || type.equalsIgnoreCase(EventType.MAIL_NEW_SESSION)
                || type.equalsIgnoreCase(EventType.MAIL_AUTO_CLAIM_LENGTH)
                || type.equalsIgnoreCase(EventType.MAIL_AUTO_CLAIM_MONITOR)
                || type.equalsIgnoreCase(EventType.MAIL_NEW_OUT)
                || type.equalsIgnoreCase(EventType.MAIL_REDIRECT_SESSION)
                || type.equalsIgnoreCase(EventType.MAIL_CLOSE_SESSION)
                || type.equalsIgnoreCase(EventType.MAIL_FIRST_REPLY)
                ) {
            return true;
        }
        return false;
    }

    public boolean isQuesEvent(String type){
    	if(type.equalsIgnoreCase(EventType.QUES_COMPLATE)){
    		return true;
    	}
    	return false;
    }
}
