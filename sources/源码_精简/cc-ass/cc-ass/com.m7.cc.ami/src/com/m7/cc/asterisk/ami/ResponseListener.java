package com.m7.cc.asterisk.ami;

import com.m7.cc.asterisk.ami.action.AsteriskResponse;

/**
 * This interface is implemented by objects interested in Asterisk server's response to commands
 * 
 */
public interface ResponseListener
{
    /**
     * Receive a response from the server
     * 
     * @param response
     *            Server response
     */
    public void processResponse(AsteriskResponse response);
}
