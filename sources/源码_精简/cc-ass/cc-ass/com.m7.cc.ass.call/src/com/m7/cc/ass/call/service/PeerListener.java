package com.m7.cc.ass.call.service;

import com.m7.cc.command.C5Event;


/**
 * 
 * @author caizhibin 2009-6-11
 *
 */
public interface PeerListener
{
    public void phoneRegister(C5Event event);
    public void phoneUnregister(C5Event event);
    public void SipRemoved(C5Event event);
    public void phoneUpdate(C5Event event);
}
