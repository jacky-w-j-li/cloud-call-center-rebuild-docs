package com.dishui.manager.billReport;

import com.dishui.manager.billReport.impl.MaintenanceHandler;
import com.dishui.manager.report.EventListener;
import com.dishui.manager.report.model.Event;

import java.util.Vector;

/**
 * Created by zhangyang on 15/12/24.
 */
public class BillListenerEventSource {
    public static BillListenerEventSource instance;

    private BillListenerEventSource() {

    }

    public static BillListenerEventSource getInstance() {
        if (instance == null)
            instance = new BillListenerEventSource();
        return instance;
    }

    //运营报表
    private Vector<EventListener> operationListeners = new Vector<EventListener>();
    //销售报表
    private Vector<EventListener> salesListeners = new Vector<EventListener>();
    //渠道代理报表
    private Vector<EventListener> proxyListeners = new Vector<EventListener>();
    //运维报表
    private Vector<EventListener> maintenanceListeners = new Vector<EventListener>();


    public void addOperationListener(EventListener listener) {
        synchronized (operationListeners) {
            operationListeners.add(listener);
        }
    }

    public void addSalesListener(EventListener listener) {
        synchronized (salesListeners) {
            salesListeners.add(listener);
        }
    }

    public void addProxyListener(EventListener listener) {
        synchronized (proxyListeners) {
            proxyListeners.add(listener);
        }
    }


    public void addMaintenanceListener(EventListener listener) {
        synchronized (maintenanceListeners){
            maintenanceListeners.add(listener);
        }
    }

    public void removeOperationListener(EventListener listener) {
        synchronized (operationListeners) {
            operationListeners.remove(listener);
        }
    }

    public void removeSalesListener(EventListener listener) {
        synchronized (salesListeners) {
            salesListeners.remove(listener);
        }
    }

    public void removeProxyListener(EventListener listener) {
        synchronized (proxyListeners) {
            proxyListeners.remove(listener);
        }
    }

    public void removeMaintenanceListener(EventListener listener){
        synchronized (maintenanceListeners){
            maintenanceListeners.remove(listener);
        }
    }

    public void addToOperationListenerBuf(Event event) {
        synchronized (operationListeners) {
            for (int i = 0; i < operationListeners.size(); i++)
                operationListeners.get(i).addToBuf(event);
        }
    }

    public void addToSalesListenerBuf(Event event) {
        synchronized (salesListeners) {
            for (int i = 0; i < salesListeners.size(); i++)
                salesListeners.get(i).addToBuf(event);
        }
    }

    public void addToProxyListenerBuf(Event event) {
        synchronized (proxyListeners) {
            for (int i = 0; i < proxyListeners.size(); i++)
                proxyListeners.get(i).addToBuf(event);
        }
    }

    public void addToMaintenanceListenerBuf(Event event) {
        synchronized (maintenanceListeners){
            for(int i = 0; i < maintenanceListeners.size(); i++){
                maintenanceListeners.get(i).addToBuf(event);
            }
        }
    }

}
