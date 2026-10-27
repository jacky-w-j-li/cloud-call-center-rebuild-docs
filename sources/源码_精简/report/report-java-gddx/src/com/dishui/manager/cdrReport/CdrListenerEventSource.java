package com.dishui.manager.cdrReport;

import com.dishui.manager.report.CdrEventListener;
import com.dishui.manager.report.EventListener;
import com.dishui.manager.report.model.Event;

import java.util.ArrayList;
import java.util.Hashtable;
import java.util.Vector;

/**
 * Created by chenguang on 3/10/16.
 */
public class CdrListenerEventSource {
    public static CdrListenerEventSource instance;
    Hashtable<String, Vector<CdrEventListener>> cdrListenerMap = new Hashtable<String, Vector<CdrEventListener>>();
    Hashtable<String, Vector<CdrEventListener>> cdrPeerListenerMap = new Hashtable<String, Vector<CdrEventListener>>();
    Hashtable<String, Vector<CdrEventListener>> cdrInvestigateListenerMap = new Hashtable<String, Vector<CdrEventListener>>();
    Hashtable<String, Vector<CdrEventListener>> cdrQualitycheckListenerMap = new Hashtable<String, Vector<CdrEventListener>>();

    private CdrListenerEventSource() {
        long n = CdrReportManager.accCount/CdrReportManager.splitCount;
        if(n == 0){
            n = 1;
        }
        for(int i=0; i<n; i++){
            Vector<CdrEventListener> cdrListeners = new Vector<CdrEventListener>();
            cdrListenerMap.put(i+"", cdrListeners);
            Vector<CdrEventListener> cdrPeerListeners = new Vector<CdrEventListener>();
            cdrPeerListenerMap.put(i+"", cdrPeerListeners);
            Vector<CdrEventListener> cdrInvestigateListeners = new Vector<CdrEventListener>();
            cdrInvestigateListenerMap.put(i+"", cdrInvestigateListeners);
            Vector<CdrEventListener> cdrQualitycheckListeners = new Vector<CdrEventListener>();
            cdrQualitycheckListenerMap.put(i+"", cdrQualitycheckListeners);
        }
    }

    public static CdrListenerEventSource getInstance() {
        if (instance == null)
            instance = new CdrListenerEventSource();
        return instance;
    }

    public void addCdrListener(String type, CdrEventListener listener) {
        if(cdrListenerMap.containsKey(type)){
            synchronized (cdrListenerMap.get(type)) {
                cdrListenerMap.get(type).add(listener);
            }
        }else{
            synchronized (cdrListenerMap.get("0")) {
                cdrListenerMap.get("0").add(listener);
            }
        }
    }
    
    public void addCdrQualitycheckListener(String type, CdrEventListener listener) {
        if(cdrQualitycheckListenerMap.containsKey(type)){
            synchronized (cdrQualitycheckListenerMap.get(type)) {
            	cdrQualitycheckListenerMap.get(type).add(listener);
            }
        }else{
            synchronized (cdrQualitycheckListenerMap.get("0")) {
            	cdrQualitycheckListenerMap.get("0").add(listener);
            }
        }
    }

    public void addCdrPeerListener(String type, CdrEventListener listener) {
            if(cdrPeerListenerMap.containsKey(type)){
                synchronized (cdrPeerListenerMap.get(type)) {
                    cdrPeerListenerMap.get(type).add(listener);
                }
            }else{
                synchronized (cdrPeerListenerMap.get("0")) {
                    cdrPeerListenerMap.get("0").add(listener);
                }
            }
    }

    public void addInvestigateListener(String type, CdrEventListener listener){
        if(cdrInvestigateListenerMap.containsKey(type)){
            synchronized (cdrInvestigateListenerMap.get(type)) {
                cdrInvestigateListenerMap.get(type).add(listener);
            }
        }else{
            synchronized (cdrInvestigateListenerMap.get("0")) {
                cdrInvestigateListenerMap.get("0").add(listener);
            }
        }
    }

    public void addToCdrListenerBuf(String type, Event event) {
        if(cdrListenerMap.containsKey(type)){
            synchronized (cdrListenerMap.get(type)) {
                for (int i = 0; i < cdrListenerMap.get(type).size(); i++)
                    cdrListenerMap.get(type).get(i).addToBuf(event);
            }
        }else{
            synchronized (cdrListenerMap.get("0")) {
                for (int i = 0; i < cdrListenerMap.get("0").size(); i++)
                    cdrListenerMap.get("0").get(i).addToBuf(event);
            }
        }
    }

    public void addToCdrPeerListenerBuf(String type, Event event) {
            if(cdrPeerListenerMap.containsKey(type)){
                synchronized (cdrPeerListenerMap.get(type)) {
                    for (int i = 0; i < cdrPeerListenerMap.get(type).size(); i++){
                        cdrPeerListenerMap.get(type).get(i).addToBuf(event);
                    }
                }
            }else{
                synchronized (cdrPeerListenerMap.get("0")) {
                    for (int i = 0; i < cdrPeerListenerMap.get("0").size(); i++){
                        cdrPeerListenerMap.get("0").get(i).addToBuf(event);
                    }
                }
            }
    }

    public void addToCdrInvestigateListenerBuf(String type, Event event) {
        if(cdrInvestigateListenerMap.containsKey(type)){
            synchronized (cdrInvestigateListenerMap.get(type)) {
                for (int i = 0; i < cdrInvestigateListenerMap.get(type).size(); i++)
                    cdrInvestigateListenerMap.get(type).get(i).addToBuf(event);
            }
        }else{
            synchronized (cdrInvestigateListenerMap.get("0")) {
                for (int i = 0; i < cdrInvestigateListenerMap.get("0").size(); i++)
                    cdrInvestigateListenerMap.get("0").get(i).addToBuf(event);
            }
        }
    }

    public void addToCdrListenerBufList(String type, ArrayList<Event> eventList) {
        if(cdrListenerMap.containsKey(type)){
            synchronized (cdrListenerMap.get(type)) {
                for (int i = 0; i < cdrListenerMap.get(type).size(); i++)
                    cdrListenerMap.get(type).get(i).addToBufList(eventList);
            }
        }else{
            synchronized (cdrListenerMap.get("0")) {
                for (int i = 0; i < cdrListenerMap.get("0").size(); i++)
                    cdrListenerMap.get("0").get(i).addToBufList(eventList);
            }
        }
    }

    public void addToCdrPeerListenerBufList(String type, ArrayList<Event> eventList) {
        if(cdrPeerListenerMap.containsKey(type)){
            synchronized (cdrPeerListenerMap.get(type)) {
                for (int i = 0; i < cdrPeerListenerMap.get(type).size(); i++){
                    cdrPeerListenerMap.get(type).get(i).addToBufList(eventList);
                }
            }
        }else{
            synchronized (cdrPeerListenerMap.get("0")) {
                for (int i = 0; i < cdrPeerListenerMap.get("0").size(); i++){
                    cdrPeerListenerMap.get("0").get(i).addToBufList(eventList);
                }
            }
        }
    }

    public void addToCdrInvestigateListenerBufList(String type, ArrayList<Event> eventList) {
        if(cdrInvestigateListenerMap.containsKey(type)){
            synchronized (cdrInvestigateListenerMap.get(type)) {
                for (int i = 0; i < cdrInvestigateListenerMap.get(type).size(); i++)
                    cdrInvestigateListenerMap.get(type).get(i).addToBufList(eventList);
            }
        }else{
            synchronized (cdrInvestigateListenerMap.get("0")) {
                for (int i = 0; i < cdrInvestigateListenerMap.get("0").size(); i++)
                    cdrInvestigateListenerMap.get("0").get(i).addToBufList(eventList);
            }
        }
    }
    
    public void addToCdrQualitycheckListenerBufList(String type, ArrayList<Event> eventList) {
    	if(cdrQualitycheckListenerMap.containsKey(type)){
            synchronized (cdrQualitycheckListenerMap.get(type)) {
                for (int i = 0; i < cdrQualitycheckListenerMap.get(type).size(); i++)
                	cdrQualitycheckListenerMap.get(type).get(i).addToBufList(eventList);
            }
        }else{
            synchronized (cdrQualitycheckListenerMap.get("0")) {
                for (int i = 0; i < cdrQualitycheckListenerMap.get("0").size(); i++)
                	cdrQualitycheckListenerMap.get("0").get(i).addToBufList(eventList);
            }
        }
    }
}
