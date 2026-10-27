package com.m7.cc.asterisk.ami.exceptions;

/**
 * This error is thrown if the VEIL is not able to connect to the Asterisk server
 */
public class ConnectionException extends Exception
{

    /**
     * 
     */
    private static final long serialVersionUID = 4057728594030243992L;

    public ConnectionException(String msg)
    {
        super(msg);
    }
}
