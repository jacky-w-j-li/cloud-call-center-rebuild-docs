package com.dishui.manager.billReport.impl;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.billReport.BillEventType;
import com.dishui.manager.billReport.impl.operation.OperationAccountPayChargeReportHandler;
import com.dishui.manager.billReport.impl.operation.OperationMonthReportHandler;
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
public class OperationHandler implements EventListener {
    private static final Logger log = Logger.getLogger(OperationHandler.class.getName());

    public Vector<Event> eventBuffer = new Vector<Event>();
    private boolean running = true;

    public OperationHandler() {
        Thread t = new Thread("OperationHandler buffer thread") {
            public void run() {
                doEvent();
            }
        };
        t.start();
    }

    private void doEvent() {
        while (running) {
            try {
                synchronized (eventBuffer) {
                    if (eventBuffer.size() == 0) {
                        List<BasicDBObject> list = MongoProvider.find("operation_report_overflow_events", new BasicDBObject(), 10000);
                        if (list.size() > 0) {
                            for (int i = 0; i < list.size(); i++) {
                                Event tmpEvent = new Event(list.get(i));
                                eventBuffer.add(tmpEvent);
                            }
                        } else {
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

    @Override
    public void addToBuf(Event event) {
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
        MongoProvider.insert("operation_report_log", EventUtil.convertToDocument(event));
        synchronized (eventBuffer) {
            if (eventBuffer.size() > 1000000) {
                log.warning("account buffer is too large to cache any event");
                //每个buffer大于 100万的时候，不再向buffer放事件，先入库保存
                MongoProvider.insert("operation_report_overflow_events", EventUtil.convertToDocument(event));
            } else {
                eventBuffer.add(event);
            }
            eventBuffer.notify();
        }
    }

    private void handleEvent(Event event) {
        try {
            if(event.getType().equalsIgnoreCase(BillEventType.NEW_ACCOUNT)) {
                OperationMonthReportHandler.newAccount(event);

            }else if(event.getType().equalsIgnoreCase(BillEventType.ACCOUNT_TURN_USING)){
                OperationMonthReportHandler.newPayAccount(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.ACCOUNT_PAY)){
                OperationMonthReportHandler.pay(event);

                OperationAccountPayChargeReportHandler.pay(event);

            }else if(event.getType().equalsIgnoreCase(BillEventType.ACCOUNT_PROXY_PAY)){
                OperationMonthReportHandler.pay(event);

                OperationAccountPayChargeReportHandler.pay(event);

            }else if(event.getType().equalsIgnoreCase(BillEventType.ACCOUNT_TURN_STOP)){
                OperationMonthReportHandler.stopAccount(event);

            }else if(event.getType().equalsIgnoreCase(BillEventType.ACCOUNT_REOPEN)){
                OperationMonthReportHandler.reopenAccount(event);

            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_CALL)){
                OperationMonthReportHandler.charge(event);

                OperationAccountPayChargeReportHandler.charge(event);

            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_CONCURRENT)){
                OperationMonthReportHandler.charge(event);

                OperationAccountPayChargeReportHandler.charge(event);

            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_FLOW)){
                OperationMonthReportHandler.charge(event);

                OperationAccountPayChargeReportHandler.charge(event);

            }else if(event.getType().equalsIgnoreCase(BillEventType.SYSTEM_DAILY)){
                OperationMonthReportHandler.dailyTask(event);

                OperationAccountPayChargeReportHandler.dailyTask(event);
            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_RENT)){
                OperationMonthReportHandler.charge(event);

                OperationAccountPayChargeReportHandler.charge(event);

            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_SERVICE_NUMBER)){
                OperationMonthReportHandler.charge(event);

                OperationAccountPayChargeReportHandler.charge(event);

            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_SMS)){
                OperationMonthReportHandler.charge(event);

                OperationAccountPayChargeReportHandler.charge(event);

            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_VOICE)){
                OperationMonthReportHandler.charge(event);

                OperationAccountPayChargeReportHandler.charge(event);

            } else if (event.getType().equalsIgnoreCase((BillEventType.CHARGE_MINCONSUME))) {
                OperationMonthReportHandler.charge(event);

                OperationAccountPayChargeReportHandler.charge(event);

            } else if (event.getType().equalsIgnoreCase((BillEventType.CHARGE_WORK))) {
                OperationMonthReportHandler.charge(event);

                OperationAccountPayChargeReportHandler.charge(event);

            } else if (event.getType().equalsIgnoreCase((BillEventType.CHARGE_HARDWARE))) {
                OperationMonthReportHandler.charge(event);

                OperationAccountPayChargeReportHandler.charge(event);

            } else if (event.getType().equalsIgnoreCase((BillEventType.CHARGE_TAPE))) {
                OperationMonthReportHandler.charge(event);

                OperationAccountPayChargeReportHandler.charge(event);

            } else if (event.getType().equalsIgnoreCase((BillEventType.CHARGE_OTHER))) {
                OperationMonthReportHandler.charge(event);

                OperationAccountPayChargeReportHandler.charge(event);

            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_COST_CALL)){
                OperationMonthReportHandler.chargeCost(event);

            }else if(event.getType().equalsIgnoreCase(BillEventType.CHARGE_COST_SMS)){
                OperationMonthReportHandler.chargeCost(event);

            }
        } catch (Exception e) {
            log.log(Level.WARNING, "BusinessReportHandler handle event failed", e);
        }
    }

    public void close() {
        running = false;
    }
}
