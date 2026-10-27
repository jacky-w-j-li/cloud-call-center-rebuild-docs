package com.dishui.service.mail;

import java.util.ArrayList;

/**
 * Created with IntelliJ IDEA.
 * User: zhangyang
 * Date: 13-12-23
 * Time: 下午9:32
 * To change this template use File | Settings | File Templates.
 */
public class DsMail {
    private ArrayList<String> toAddr;
    private ArrayList<String> ccAddr;
    private String subject;
    private String content;

    public ArrayList<String> getToAddr() {
        return toAddr;
    }

    public void setToAddr(ArrayList<String> toAddr) {
        this.toAddr = toAddr;
    }

    public void setToAddr(String toAddr) {
        if (this.toAddr == null) {
            this.toAddr = new ArrayList<String>();
        }
        this.toAddr.add(toAddr);
    }


    public ArrayList<String> getCcAddr() {
        return ccAddr;
    }

    public void setCcAddr(ArrayList<String> ccAddr) {
        this.ccAddr = ccAddr;
    }

    public void setCcAddr(String ccAddr) {
        if (this.ccAddr == null) {
            this.ccAddr = new ArrayList<String>();
        }
        this.ccAddr.add(ccAddr);
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
