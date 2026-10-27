package com.dishui.manager.billReport.impl;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.billReport.BillEventType;
import com.dishui.manager.billReport.impl.sales.SalesAreaReportHandler;
import com.dishui.manager.billReport.impl.sales.SalesPersonalReportHandler;
import com.dishui.manager.billReport.impl.sales.SalesUserCheckReportHandler;
import com.dishui.manager.report.EventListener;
import com.dishui.manager.report.common.EventUtil;
import com.dishui.manager.report.impl.business.BusinessAgentReportHandler;
import com.dishui.manager.report.impl.business.BusinessAnalyseReportHandler;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.report.model.EventType;
import com.mongodb.BasicDBObject;

import java.util.List;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 15/12/24.
 */
public class SalesHandler implements EventListener {

    public Vector<Event> eventBuffer = new Vector<Event>();

    private static final Logger log = Logger.getLogger(SalesHandler.class.getName());

    private boolean running = true;

    public SalesHandler() {
        Thread t = new Thread("SalesHandler buffer thread") {
            public void run() {
                doEvent();
            }
        };
        t.start();
    }

    @Override
    public void addToBuf(Event event) {
        MongoProvider.insert("bill_sales_report_log", EventUtil.convertToDocument(event));
        synchronized (eventBuffer) {
            if (eventBuffer.size() > 1000000) {
                log.warning("account buffer is too large to cache any event");
                //每个buffer大于 100万的时候，不再向buffer放事件，先入库保存
                MongoProvider.insert("bill_sales_report_overflow_events", EventUtil.convertToDocument(event));
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
                        List<BasicDBObject> list = MongoProvider.find("bill_sales_report_overflow_events",new BasicDBObject(),10000);
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
            if(event.getType().equalsIgnoreCase(BillEventType.NEW_ACCOUNT)){
                SalesUserCheckReportHandler.newAccount(event);

                SalesAreaReportHandler.newAccount(event);

                SalesPersonalReportHandler.newAccount(event);
            } else if(event.getType().equalsIgnoreCase(BillEventType.ACCOUNT_TURN_USING)){
                SalesUserCheckReportHandler.turnUsing(event);

                SalesAreaReportHandler.newPayAccount(event);

                SalesPersonalReportHandler.newPayAccount(event);
            } else if(event.getType().equalsIgnoreCase(BillEventType.ACCOUNT_PAY)){
                SalesUserCheckReportHandler.accountPay(event);

                //SalesAreaReportHandler.pay(event);

                SalesPersonalReportHandler.pay(event);
            } else if(event.getType().equalsIgnoreCase(BillEventType.ACCOUNT_PROXY_PAY)){
                SalesUserCheckReportHandler.proxyPay(event);

                //SalesAreaReportHandler.pay(event);

                SalesPersonalReportHandler.pay(event);
            } else if(event.getType().equalsIgnoreCase(BillEventType.ACCOUNT_CHANGE_PXOXY)){
                SalesUserCheckReportHandler.changeProxy(event);

                SalesPersonalReportHandler.changeProxy(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.ACCOUNT_TURN_STOP)){
                SalesAreaReportHandler.stopAccount(event);

                SalesPersonalReportHandler.stopAccount(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_CALL)){
                SalesAreaReportHandler.chargeCall(event);
                SalesAreaReportHandler.charge(event);

                SalesPersonalReportHandler.chargeCall(event);
                SalesPersonalReportHandler.charge(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_CONCURRENT)){
                SalesAreaReportHandler.chargeConcurrent(event);
                SalesAreaReportHandler.charge(event);

                SalesPersonalReportHandler.chargeConcurrent(event);
                SalesPersonalReportHandler.charge(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_FLOW)){
                SalesAreaReportHandler.chargeFlow(event);
                SalesAreaReportHandler.charge(event);

                SalesPersonalReportHandler.chargeFlow(event);
                SalesPersonalReportHandler.charge(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.SYSTEM_DAILY)){
                SalesAreaReportHandler.dailyTask(event);

                SalesPersonalReportHandler.dailyTask(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_RENT)){
                SalesAreaReportHandler.chargeRent(event);
                SalesAreaReportHandler.charge(event);

                SalesPersonalReportHandler.chargeRent(event);
                SalesPersonalReportHandler.charge(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_SERVICE_NUMBER)){
                SalesAreaReportHandler.chargeServiceNumber((event));
                SalesAreaReportHandler.charge(event);

                SalesPersonalReportHandler.chargeServiceNumber(event);
                SalesPersonalReportHandler.charge(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_SMS)){
                SalesAreaReportHandler.chargeSMS(event);
                SalesAreaReportHandler.charge(event);

                SalesPersonalReportHandler.chargeSMS(event);
                SalesPersonalReportHandler.charge(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_VOICE)){
                SalesAreaReportHandler.chargeVoice(event);
                SalesAreaReportHandler.charge(event);

                SalesPersonalReportHandler.chargeVoice(event);
                SalesPersonalReportHandler.charge(event);
            } else if (event.getType().equalsIgnoreCase((BillEventType.CHARGE_MINCONSUME))) {
                SalesAreaReportHandler.chargeMinConsume(event);
                SalesAreaReportHandler.charge(event);

                SalesPersonalReportHandler.chargeMinConsume(event);
                SalesPersonalReportHandler.charge(event);
            }else if (event.getType().equalsIgnoreCase((BillEventType.CHARGE_WORK))) {
                SalesAreaReportHandler.chargeWork(event);
                SalesAreaReportHandler.charge(event);

                SalesPersonalReportHandler.chargeWork(event);
                SalesPersonalReportHandler.charge(event);

                SalesUserCheckReportHandler.chargeWork(event);
            } else if (event.getType().equalsIgnoreCase((BillEventType.CHARGE_HARDWARE))) {
                SalesAreaReportHandler.chargeHardware(event);
                SalesAreaReportHandler.charge(event);

                SalesPersonalReportHandler.chargeHardware(event);
                SalesPersonalReportHandler.charge(event);

                SalesUserCheckReportHandler.chargeHardware(event);
            } else if (event.getType().equalsIgnoreCase((BillEventType.CHARGE_TAPE))) {
                SalesAreaReportHandler.chargeTape(event);
                SalesAreaReportHandler.charge(event);

                SalesPersonalReportHandler.chargeTape(event);
                SalesPersonalReportHandler.charge(event);

                SalesUserCheckReportHandler.chargeTape(event);
            } else if (event.getType().equalsIgnoreCase((BillEventType.CHARGE_OTHER))) {
                SalesAreaReportHandler.chargeOther(event);
                SalesAreaReportHandler.charge(event);

                SalesPersonalReportHandler.chargeOther(event);
                SalesPersonalReportHandler.charge(event);

                SalesUserCheckReportHandler.chargeOther(event);
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "BusinessReportHandler handle event failed", e);
        }
    }

    public void close() {
        running = false;
    }
}
