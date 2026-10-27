package com.dishui.manager.cdrReport;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.cdrReport.impl.*;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.mongodb.BasicDBObject;

import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by chenguang on 3/10/16.
 */
public class CdrReportManager {
    private static final Logger log = Logger.getLogger(CdrReportManager.class.getName());
    private static final int LIMIT_NUM = 6000; //每次从数据库里获取的条数
    private static Thread cdr_processor;
    private static CdrReportManager instance;
    public static long accCount = 6000;
    public static int splitCount = 200;
    public static long queueCount = accCount/splitCount;

    private CdrReportManager(){
        cdr_processor = new Thread("cdrReportPorcessor"){
            @Override
            public void run() {
                if(queueCount == 0){
                    queueCount = 1;
                }
                ArrayList<Event> cdrList = new ArrayList<Event>();
                ArrayList<Event> investigateList = new ArrayList<Event>();
                ArrayList<Event> peerList = new ArrayList<Event>();
                ArrayList<Event> qualitycheckList = new ArrayList<Event>();

                while (true) {
                    BasicDBObject condition = new BasicDBObject();
                    condition.put("reportStatus", "ready");
                    List<BasicDBObject> eventList = null;
                    eventList = MongoProvider.find(Constant.CDR_EVENT_TABLE, condition, LIMIT_NUM);
                    log.info("获取通话事件条数:"+eventList.size()+"条");

                    int count = 1;
                    for (BasicDBObject dbObject : eventList) {
                        count++;
                        Event event = null;
                        try{
                            event = new Event(dbObject);
                            if(event.getType().equals(CdrEventType.CDR_CALL)){
                                cdrList.add(event);
                            }else if(event.getType().equals(CdrEventType.CDR_INVESTIGATE)){
                                investigateList.add(event);
                            }else if(event.getType().equals(CdrEventType.CDR_PEER)){
                                peerList.add(event);
                            }else if(event.getType().equals(CdrEventType.CDR_QUALITYCHECK)){
                            	qualitycheckList.add(event);
                            }
                            if(count % 300 == 0){
                                CdrListenerEventSource.getInstance()
                                        .addToCdrListenerBufList(Utils.getScopeRandom(0,(int)queueCount)+"", cdrList);
                                CdrListenerEventSource.getInstance()
                                        .addToCdrInvestigateListenerBufList(Utils.getScopeRandom(0,(int)queueCount)+"", investigateList);
                                CdrListenerEventSource.getInstance()
                                        .addToCdrPeerListenerBufList(Utils.getScopeRandom(0,(int)queueCount)+"", peerList);
                                CdrListenerEventSource.getInstance()
                                		.addToCdrQualitycheckListenerBufList(Utils.getScopeRandom(0,(int)queueCount)+"", qualitycheckList);
                                cdrList.clear();
                                investigateList.clear();
                                peerList.clear();
                                qualitycheckList.clear();
                            }
                            if(count % 1000 == 0){
                                log.info("cdrReport 处理通话事件 count="+count);
                            }
                        }catch (Exception e){
                            e.printStackTrace();
                            log.log(Level.WARNING, e.getMessage() + dbObject.toString(), e);
                        }
                        MongoProvider.remove(Constant.CDR_EVENT_TABLE, new BasicDBObject("_id",dbObject.get("_id")));
                    }
                    CdrListenerEventSource.getInstance()
                            .addToCdrListenerBufList(Utils.getScopeRandom(0,(int)queueCount)+"", cdrList);
                    CdrListenerEventSource.getInstance()
                            .addToCdrInvestigateListenerBufList(Utils.getScopeRandom(0,(int)queueCount)+"", investigateList);
                    CdrListenerEventSource.getInstance()
                            .addToCdrPeerListenerBufList(Utils.getScopeRandom(0,(int)queueCount)+"", peerList);
                    CdrListenerEventSource.getInstance()
            				.addToCdrQualitycheckListenerBufList(Utils.getScopeRandom(0,(int)queueCount)+"", qualitycheckList);
                    cdrList.clear();
                    investigateList.clear();
                    peerList.clear();
                    qualitycheckList.clear();
                    //--------------------------bak
//                    int count = 1;
//                    for (BasicDBObject dbObject : eventList) {
//                        count++;
//                        Event event = null;
//                        try{
//                            event = new Event(dbObject);
//                            if(event.getType().equals(CdrEventType.CDR_CALL)){
////                                CdrListenerEventSource.getInstance()
////                                        .addToCdrListenerBuf(getAccQueueType(event.getAccount()), event);
//                                CdrListenerEventSource.getInstance()
//                                        .addToCdrListenerBuf(Utils.getScopeRandom(0,(int)queueCount)+"", event);
//                            }else
//                            if(event.getType().equals(CdrEventType.CDR_INVESTIGATE)){
////                                CdrListenerEventSource.getInstance()
////                                        .addToCdrInvestigateListenerBuf(getAccQueueType(event.getAccount()), event);
//                                CdrListenerEventSource.getInstance()
//                                        .addToCdrInvestigateListenerBuf(Utils.getScopeRandom(0,(int)queueCount)+"", event);
//                            }else
//                            if(event.getType().equals(CdrEventType.CDR_PEER)){
////                                CdrListenerEventSource.getInstance()
////                                        .addToCdrPeerListenerBuf(getAccQueueType(event.getAccount()), event);
//                                CdrListenerEventSource.getInstance()
//                                        .addToCdrPeerListenerBuf(Utils.getScopeRandom(0,(int)queueCount)+"", event);
//                            }
//                            if(count % 1000 == 0){
//                                log.info("cdrReport 处理通话事件 count="+count);
//                            }
//                        }catch (Exception e){
//                            e.printStackTrace();
//                            log.log(Level.WARNING, e.getMessage() + dbObject.toString(), e);
//                        }
//                        MongoProvider.remove(Constant.CDR_EVENT_TABLE, new BasicDBObject("_id",dbObject.get("_id")));
//                    }
                    //--------------------------bak
                    try {
                        Thread.sleep(2000);
                    } catch (Exception e) {
                        e.printStackTrace();
                        log.log(Level.WARNING, "分发通话事件发生异常", e);
                    }
                }
            }
        };
    }

    public static CdrReportManager getInstance() {
        if (instance == null) {
            instance = new CdrReportManager();
        }
        return instance;
    }

    public void startHandleEvents(){
        initEventHandler();
        cdr_processor.start();
        log.info("CdrReportManager started!");
    }

    private void initEventHandler() {
        accCount = MongoProvider.countFromApp("bill", "platform_account_product", new BasicDBObject("product","cc"));
        log.info("cdr report has = accCount="+accCount);
        long queueCount = accCount/splitCount;
        if(queueCount == 0){
            queueCount = 1;
        }
        log.info("cdr report create thread count="+queueCount);
        for(int i=0 ; i < queueCount ; i++){
            CallInReportHandler callInReportHandler = new CallInReportHandler();
            CallOutReportHandler callOutReportHandler = new CallOutReportHandler();
            QueueReportHandler queueReportHandler = new QueueReportHandler();
            ApproveSurveyReportHandler approveSurveyReportHandler = new ApproveSurveyReportHandler();
            AgentHourReportHandler agentHourReportHandler = new AgentHourReportHandler();
            AgentHourCdrPeerReportHandler agentHourCdrPeerReportHandler = new AgentHourCdrPeerReportHandler();
            CdrQualityCheckReportHandler cdrqualitycheckreporthandler = new CdrQualityCheckReportHandler();
            CdrListenerEventSource.getInstance().addCdrListener(i+"", callInReportHandler);
            CdrListenerEventSource.getInstance().addCdrListener(i+"", callOutReportHandler);
            CdrListenerEventSource.getInstance().addCdrListener(i+"", queueReportHandler);
            CdrListenerEventSource.getInstance().addCdrListener(i+"", approveSurveyReportHandler);
            CdrListenerEventSource.getInstance().addInvestigateListener(i+"", approveSurveyReportHandler);
            CdrListenerEventSource.getInstance().addCdrListener(i+"", agentHourReportHandler);
            CdrListenerEventSource.getInstance().addCdrPeerListener(i+"", agentHourCdrPeerReportHandler);
            CdrListenerEventSource.getInstance().addCdrQualitycheckListener(i+"", cdrqualitycheckreporthandler);
        }
    }

    public String getAccQueueType(String account){
        String subAcc = account.substring(1);
        int num = Integer.parseInt(subAcc);
        return num/splitCount+"";
    }


}
