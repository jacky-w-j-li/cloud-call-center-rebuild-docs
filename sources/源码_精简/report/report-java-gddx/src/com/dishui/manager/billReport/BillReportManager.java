package com.dishui.manager.billReport;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.billReport.impl.MaintenanceHandler;
import com.dishui.manager.billReport.impl.OperationHandler;
import com.dishui.manager.billReport.impl.ProxyHandler;
import com.dishui.manager.billReport.impl.SalesHandler;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.mongodb.BasicDBObject;

import java.util.List;
import java.util.logging.Logger;

/**
 * Created by zhangyang on 15/12/24.
 * 运营数据报表
 */
public class BillReportManager {
    private static final Logger log = Logger.getLogger(BillReportManager.class.getName());
    private static final int LIMIT_NUM = 5000; //每次从数据库里获取的条数
    private static Thread processor;
    private static BillReportManager instance;
    private BillReportManager(){
        processor = new Thread("billReportPorcessor"){
            @Override
            public void run() {
                initEventHandler();
                while (true) {
                    BasicDBObject condition = new BasicDBObject();
                    condition.put("reportStatus", "ready");
                    List<BasicDBObject> eventList = null;
                    eventList = MongoProvider.find(Constant.BILL_EVENT_TABLE, condition, LIMIT_NUM);
                    log.info("获取运营事件条数:"+eventList.size()+"条");
                    for (BasicDBObject dbObject : eventList) {
                        Event event = null;
                        try{
                            event = new Event(dbObject);
                            if(isOperationEvent(event.getType())){
                                BillListenerEventSource.getInstance().addToOperationListenerBuf(event);
                            }
                            if(isSalesEvent(event.getType())){
                                BillListenerEventSource.getInstance().addToSalesListenerBuf(event);
                            }
                            if(isProxyEvent(event.getType())){
                                BillListenerEventSource.getInstance().addToProxyListenerBuf(event);
                            }

                            if(isMaintenanceEvent(event.getType())){
                                BillListenerEventSource.getInstance().addToMaintenanceListenerBuf(event);
                            }
                        }catch (Exception e){
                            e.printStackTrace();
                            log.warning(e.getMessage() + dbObject.toString());
                        }
                        MongoProvider.remove(Constant.BILL_EVENT_TABLE, new BasicDBObject("_id",dbObject.get("_id")));
                    }

                    try {
                        Thread.sleep(1000);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }
        };
    }

    public static BillReportManager getInstance(){
        if (instance == null) {
            instance = new BillReportManager();
        }
        return instance;
    }



    public void startHandleEvents(){
        processor.start();
    }

    private boolean isProxyEvent(String type) {
        if(type.equalsIgnoreCase(BillEventType.ACCOUNT_PAY) || type.equalsIgnoreCase(BillEventType.PROXY_PAY) || type.equalsIgnoreCase(BillEventType.CHARGE_CALL) || type.equalsIgnoreCase(BillEventType.CHARGE_CONCURRENT) || type.equalsIgnoreCase(BillEventType.CHARGE_FLOW) || type.equalsIgnoreCase(BillEventType.SYSTEM_DAILY) ||
                type.equalsIgnoreCase(BillEventType.CHARGE_RENT) || type.equalsIgnoreCase(BillEventType.CHARGE_SERVICE_NUMBER) || type.equalsIgnoreCase(BillEventType.CHARGE_SMS) || type.equalsIgnoreCase(BillEventType.CHARGE_VOICE) || type.equalsIgnoreCase(BillEventType.CHARGE_MINCONSUME) ||
                type.equalsIgnoreCase(BillEventType.CHARGE_WORK) || type.equalsIgnoreCase(BillEventType.CHARGE_HARDWARE) || type.equalsIgnoreCase(BillEventType.CHARGE_TAPE) || type.equalsIgnoreCase(BillEventType.CHARGE_OTHER)){
            return true;
        }
        return false;
    }

    private boolean isSalesEvent(String type) {
        if(type.equalsIgnoreCase(BillEventType.NEW_ACCOUNT) || type.equalsIgnoreCase(BillEventType.ACCOUNT_TURN_USING) || type.equalsIgnoreCase(BillEventType.ACCOUNT_PAY)
                || type.equalsIgnoreCase(BillEventType.ACCOUNT_PROXY_PAY) || type.equalsIgnoreCase(BillEventType.ACCOUNT_CHANGE_PXOXY)|| type.equalsIgnoreCase(BillEventType.ACCOUNT_TURN_STOP)
        || type.equalsIgnoreCase(BillEventType.CHARGE_CALL)||type.equalsIgnoreCase(BillEventType.CHARGE_CONCURRENT)||type.equalsIgnoreCase(BillEventType.CHARGE_FLOW)||type.equalsIgnoreCase(BillEventType.SYSTEM_DAILY)||type.equalsIgnoreCase(BillEventType.CHARGE_RENT)||type.equalsIgnoreCase(BillEventType.CHARGE_SERVICE_NUMBER)||type.equalsIgnoreCase(BillEventType.CHARGE_SMS)||type.equalsIgnoreCase(BillEventType.CHARGE_VOICE)||
                type.equalsIgnoreCase(BillEventType.CHARGE_COST_CALL) || type.equalsIgnoreCase(BillEventType.CHARGE_COST_SMS)|| type.equalsIgnoreCase(BillEventType.CHARGE_MINCONSUME) ||
        type.equalsIgnoreCase(BillEventType.CHARGE_WORK) || type.equalsIgnoreCase(BillEventType.CHARGE_HARDWARE) || type.equalsIgnoreCase(BillEventType.CHARGE_TAPE) || type.equalsIgnoreCase(BillEventType.CHARGE_OTHER)){
            return true;
        }
        return false;
    }

    private boolean isOperationEvent(String type) {
        if (type.equalsIgnoreCase(BillEventType.NEW_ACCOUNT) || type.equalsIgnoreCase(BillEventType.ACCOUNT_TURN_USING) || type.equalsIgnoreCase(BillEventType.ACCOUNT_TURN_STOP) || type.equalsIgnoreCase(BillEventType.ACCOUNT_REOPEN)
                || type.equalsIgnoreCase(BillEventType.ACCOUNT_PAY) || type.equalsIgnoreCase(BillEventType.ACCOUNT_PROXY_PAY) ||
                type.equalsIgnoreCase(BillEventType.CHARGE_CALL)||type.equalsIgnoreCase(BillEventType.CHARGE_CONCURRENT)||type.equalsIgnoreCase(BillEventType.CHARGE_FLOW)||type.equalsIgnoreCase(BillEventType.SYSTEM_DAILY)||type.equalsIgnoreCase(BillEventType.CHARGE_RENT)||type.equalsIgnoreCase(BillEventType.CHARGE_SERVICE_NUMBER)||type.equalsIgnoreCase(BillEventType.CHARGE_SMS)||type.equalsIgnoreCase(BillEventType.CHARGE_VOICE)||
                type.equalsIgnoreCase(BillEventType.CHARGE_COST_CALL)||type.equalsIgnoreCase(BillEventType.CHARGE_COST_SMS) || type.equalsIgnoreCase(BillEventType.CHARGE_MINCONSUME) ||
                type.equalsIgnoreCase(BillEventType.CHARGE_WORK) || type.equalsIgnoreCase(BillEventType.CHARGE_HARDWARE) || type.equalsIgnoreCase(BillEventType.CHARGE_TAPE) || type.equalsIgnoreCase(BillEventType.CHARGE_OTHER)) {
            return true;
        }
        return false;
    }

    private boolean isMaintenanceEvent(String type){
        if(type.equalsIgnoreCase(BillEventType.COMPLETE_CALL)){
            return true;
        }

        return false;
    }

    private void initEventHandler() {
        OperationHandler operationHandler = new OperationHandler();
        ProxyHandler proxyHandler = new ProxyHandler();
        SalesHandler salesHandler = new SalesHandler();
        MaintenanceHandler maintenanceHandler = new MaintenanceHandler();

        BillListenerEventSource.getInstance().addOperationListener(operationHandler);
        BillListenerEventSource.getInstance().addProxyListener(proxyHandler);
        BillListenerEventSource.getInstance().addSalesListener(salesHandler);
        BillListenerEventSource.getInstance().addMaintenanceListener(maintenanceHandler);
    }

}
