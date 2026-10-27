package com.dishui.manager.report;

import com.dishui.manager.report.model.Event;

import java.util.Vector;

/**
 * Created by chenguang on 11/8/15.
 */
public class ListenerEventSource {

    public static ListenerEventSource instance;

    private ListenerEventSource(){
        instance = this;
    }

    public static ListenerEventSource getInstance(){
        if (instance == null)
            new ListenerEventSource();
        return instance;
    }

    private Vector<EventListener> imListeners = new Vector<EventListener>();
//    private Vector<EventListener> imCloseSessionListeners = new Vector<EventListener>();
    
    private Vector<EventListener> mailListeners = new Vector<EventListener>();
    
    private Vector<EventListener> quesListeners = new Vector<EventListener>();

    private Vector<EventListener> businessListeners = new Vector<EventListener>();

    private Vector<EventListener> customerListeners = new Vector<EventListener>();

//    private Vector<EventListener> customerListeners = new Vector<EventListener>();
//
//    private Vector<EventListener> customerListeners = new Vector<EventListener>();

    public void addImListener(EventListener listener){
        synchronized (imListeners) {
            imListeners.add(listener);
        }
    }
    public void addMailListener(EventListener listener){
    	synchronized (mailListeners) {
    		mailListeners.add(listener);
    	}
    }
    
    public void addQuesListener(EventListener listener){
    	synchronized (quesListeners) {
    		quesListeners.add(listener);
    	}
    }

    public void addBusinessListener(EventListener listener){
        synchronized (businessListeners) {
            businessListeners.add(listener);
        }
    }

    public void addCustomerListener(EventListener listener){
        synchronized (customerListeners) {
            customerListeners.add(listener);
        }
    }

    public void removeImListener(EventListener listener){
        synchronized (imListeners) {
            imListeners.remove(listener);
        }
    }
    public void removeMailListener(EventListener listener){
    	synchronized (mailListeners) {
    		mailListeners.remove(listener);
    	}
    }
    public void removeQuesListener(EventListener listener){
        synchronized (quesListeners) {
        	quesListeners.remove(listener);
        }
    }

    public void removeBusinessListener(EventListener listener){
        synchronized (businessListeners) {
            businessListeners.remove(listener);
        }
    }

    public void removeCustomerListener(EventListener listener){
        synchronized (customerListeners) {
            customerListeners.remove(listener);
        }
    }
//im events do dispatcher - begin
    public void addToImListenerBuf(Event event){
        synchronized (imListeners) {
            for (int i = 0; i < imListeners.size(); i++)
                imListeners.get(i).addToBuf(event);
        }
    }
    public void addToMailListenerBuf(Event event){
    	synchronized (mailListeners) {
    		for (int i = 0; i < mailListeners.size(); i++)
    			mailListeners.get(i).addToBuf(event);
    	}
    }
    public void addToQuesListenerBuf(Event event){
    	synchronized (quesListeners) {
    		System.out.println("quesListeners.size();:  "+ quesListeners.size());
    		for (int i = 0; i < quesListeners.size(); i++)
    		{
    			System.out.println("addToQuesListenerBuf");
    			quesListeners.get(i).addToBuf(event);
    		}
    	}
    }
    public void addToBusinessListenerBuf(Event event){
        synchronized (businessListeners) {
            for (int i = 0; i < businessListeners.size(); i++)
                businessListeners.get(i).addToBuf(event);
        }
    }
    public void addToCustomerListenerBuf(Event event){
        synchronized (customerListeners) {
            for (int i = 0; i < customerListeners.size(); i++)
                customerListeners.get(i).addToBuf(event);
        }
    }

}
