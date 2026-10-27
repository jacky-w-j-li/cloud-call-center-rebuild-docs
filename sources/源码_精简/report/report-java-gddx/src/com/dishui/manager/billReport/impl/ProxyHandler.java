package com.dishui.manager.billReport.impl;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.billReport.BillEventType;
import com.dishui.manager.billReport.impl.proxy.ChannelProxyAllReportHandler;
import com.dishui.manager.billReport.impl.proxy.ChannelProxyAnalyseReportHandler;
import com.dishui.manager.report.EventListener;
import com.dishui.manager.report.common.EventUtil;
import com.dishui.manager.report.model.Event;
import com.mongodb.BasicDBObject;

import java.util.List;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 15/12/24.
 */
public class ProxyHandler implements EventListener {

    public Vector<Event> eventBuffer = new Vector<Event>();

    private static final Logger log = Logger.getLogger(ProxyHandler.class.getName());

    private boolean running = true;

    public ProxyHandler() {
        Thread t = new Thread("ProxyHandler buffer thread") {
            public void run() {
                doEvent();
            }
        };
        t.start();
    }

    @Override
    public void addToBuf(Event event) {
        MongoProvider.insert("bill_proxy_report_log", EventUtil.convertToDocument(event));
        synchronized (eventBuffer) {
            if (eventBuffer.size() > 1000000) {
                log.warning("account buffer is too large to cache any event");
                //每个buffer大于 100万的时候，不再向buffer放事件，先入库保存
                MongoProvider.insert("bill_proxy_report_overflow_events", EventUtil.convertToDocument(event));
            } else {
                eventBuffer.add(event);
            }
            eventBuffer.notify();
        }
    }


    private void doEvent() {
        while (running) {
            try {
                synchronized (eventBuffer) {
                    if (eventBuffer.size() == 0) {
                        List<BasicDBObject> list = MongoProvider.find("bill_proxy_report_overflow_events",new BasicDBObject(),10000);
                        if(list.size() > 0){
                            for(int i =0 ;i<list.size() ;i++){
                                Event tmpEvent = new Event(list.get(i));
                                eventBuffer.add(tmpEvent);
                            }
                        }else{
                            eventBuffer.wait();
                        }
                    } else {
                        handleEvent(eventBuffer.remove(0));
                    }
                }
            } catch (Exception e) {
                log.log(Level.WARNING, "", e);
            }
        }
    }

    private void handleEvent(Event event) {
        try {
            if(event.getType().equalsIgnoreCase(BillEventType.ACCOUNT_PAY)){
                ChannelProxyAllReportHandler.payAccount(event);

                ChannelProxyAnalyseReportHandler.payAccount(event);
            } else if(event.getType().equalsIgnoreCase(BillEventType.PROXY_PAY)){
                ChannelProxyAllReportHandler.payProxy(event);

                ChannelProxyAnalyseReportHandler.payProxy(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_CALL)){
                ChannelProxyAllReportHandler.chargeCall(event);
                ChannelProxyAllReportHandler.charge(event);

                ChannelProxyAnalyseReportHandler.charge(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_CONCURRENT)){
                ChannelProxyAllReportHandler.chargeConcurrent(event);
                ChannelProxyAllReportHandler.charge(event);

                ChannelProxyAnalyseReportHandler.charge(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_FLOW)){
                ChannelProxyAllReportHandler.chargeFlow(event);
                ChannelProxyAllReportHandler.charge(event);

                ChannelProxyAnalyseReportHandler.charge(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.SYSTEM_DAILY)){
                ChannelProxyAllReportHandler.dailyTask(event);

                ChannelProxyAnalyseReportHandler.dailyTask(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_RENT)){
                ChannelProxyAllReportHandler.chargeRent(event);
                ChannelProxyAllReportHandler.charge(event);

                ChannelProxyAnalyseReportHandler.charge(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_SERVICE_NUMBER)){
                ChannelProxyAllReportHandler.chargeServiceNumber((event));
                ChannelProxyAllReportHandler.charge(event);

                ChannelProxyAnalyseReportHandler.charge(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_SMS)){
                ChannelProxyAllReportHandler.chargeSMS(event);
                ChannelProxyAllReportHandler.charge(event);

                ChannelProxyAnalyseReportHandler.charge(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_VOICE)){
                ChannelProxyAllReportHandler.chargeVoice(event);
                ChannelProxyAllReportHandler.charge(event);

                ChannelProxyAnalyseReportHandler.charge(event);
            } else if (event.getType().equalsIgnoreCase((BillEventType.CHARGE_MINCONSUME))) {
                ChannelProxyAllReportHandler.chargeMinConsume(event);
                ChannelProxyAllReportHandler.charge(event);

                ChannelProxyAnalyseReportHandler.charge(event);
            } else if (event.getType().equalsIgnoreCase((BillEventType.CHARGE_WORK))) {
                ChannelProxyAllReportHandler.chargeWork(event);
                ChannelProxyAllReportHandler.charge(event);

                ChannelProxyAnalyseReportHandler.charge(event);
            }else if (event.getType().equalsIgnoreCase((BillEventType.CHARGE_HARDWARE))) {
                ChannelProxyAllReportHandler.chargeHardware(event);
                ChannelProxyAllReportHandler.charge(event);

                ChannelProxyAnalyseReportHandler.charge(event);
            }else if (event.getType().equalsIgnoreCase((BillEventType.CHARGE_TAPE))) {
                ChannelProxyAllReportHandler.chargeTape(event);
                ChannelProxyAllReportHandler.charge(event);

                ChannelProxyAnalyseReportHandler.charge(event);
            }else if (event.getType().equalsIgnoreCase((BillEventType.CHARGE_OTHER))) {
                ChannelProxyAllReportHandler.chargeOther(event);
                ChannelProxyAllReportHandler.charge(event);

                ChannelProxyAnalyseReportHandler.charge(event);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "BusinessReportHandler handle event failed", e);
        }
    }

    public void close() {
        running = false;
    }
}
