package com.dishui.manager.report.model;

import java.util.Hashtable;

/**
 * Created by chenguang on 11/12/15.
 */
public class MonitorAccount {

    private String account;

    public MonitorAccount(String acc){
        this.account = acc;
    }

    private Hashtable<String, MonitorAccessNo> accessNos = new Hashtable<String, MonitorAccessNo>();
    private Hashtable<String, MonitorAgent> agents = new Hashtable<String, MonitorAgent>();
    private Hashtable<String, MonitorQueue> queues = new Hashtable<String, MonitorQueue>();

    public synchronized boolean addAccessNo(MonitorAccessNo accessNo){
        if (accessNo == null)
            return false;
        accessNos.put(accessNo.getAccessId(), accessNo);
        return true;
    }

    public synchronized boolean addAgent(MonitorAgent agent){
        if (agent == null)
            return false;
        agents.put(agent.getId(), agent);
        return true;
    }

    public synchronized boolean addQueue(MonitorQueue queue){
        if (queue == null)
            return false;
        queues.put(queue.getQueueExten(), queue);
        return true;
    }
    public MonitorAccessNo getAccessNo(String aId) {
        return accessNos.get(aId);
    }

    public MonitorAgent getAgent(String id){ return agents.get(id); }

    public MonitorQueue getQueue(String exten) {
        return queues.get(exten);
    }

    public Hashtable<String, MonitorAccessNo> getAccessNos() {
        return accessNos;
    }

    public Hashtable<String, MonitorAgent> getAgents() {
        return agents;
    }

    public Hashtable<String, MonitorQueue> getQueues() { return queues; }
}
