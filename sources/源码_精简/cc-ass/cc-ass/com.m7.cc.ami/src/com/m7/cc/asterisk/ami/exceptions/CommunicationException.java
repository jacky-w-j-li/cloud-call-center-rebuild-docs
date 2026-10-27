package com.m7.cc.asterisk.ami.exceptions;

/**
 * This exception is thrown for any communication error between the VEIL and the Asterisk server
 */
public class CommunicationException extends Exception
{

    /**
     * 
     */
    private static final long serialVersionUID = -6361274947386875089L;

    public CommunicationException(String msg)
    {
        super(msg);
    }

}
