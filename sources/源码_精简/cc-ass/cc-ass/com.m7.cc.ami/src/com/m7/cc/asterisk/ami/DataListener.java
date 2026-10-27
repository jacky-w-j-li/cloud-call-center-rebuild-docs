package com.m7.cc.asterisk.ami;

/**
 * 
 * @author caizhibin 2009-6-9
 *
 */
public interface DataListener
{
    /**
     * Receive message from CoreObservables listening to
     * 
     * @param msg
     *            Message from server
     */
    public void update(String msg);
    
    
    public void connectionClosed(String message);
}
