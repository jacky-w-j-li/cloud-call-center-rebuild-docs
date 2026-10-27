package com.dishui.service.mail;

/**
 * Created with IntelliJ IDEA.
 * User: zhangyang
 * Date: 13-12-23
 * Time: 下午9:41
 * To change this template use File | Settings | File Templates.
 */
public class DsMailConfig {
    private String mailHost;
    private boolean isAuthenticate;
    private String username;
    private String password;
    private String fromAddr;
    private String fromName;

    public String getFromAddr() {
        return fromAddr;
    }

    public void setFromAddr(String fromAddr) {
        this.fromAddr = fromAddr;
    }

    public String getFromName() {
        return fromName;
    }

    public void setFromName(String fromName) {
        this.fromName = fromName;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getMailHost() {
        return mailHost;
    }

    public void setMailHost(String mailHost) {
        this.mailHost = mailHost;
    }

    public boolean isAuthenticate() {
        return isAuthenticate;
    }

    public void setAuthenticate(boolean authenticate) {
        isAuthenticate = authenticate;
    }
}
