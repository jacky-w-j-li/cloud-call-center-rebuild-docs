package com.dishui.model;

/**
 * Created by zengyx on 16/6/15.
 */
public class AssignTask {
    private String peerId; //技能组id
    private String sessionId; //会话id
    private String account;
    private String data; //推送数据
    private String agent; //座席
    private String sessionVersion; //会话版本
    private String sid; //访客id
    private String id;
    private String platform;

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSid() {
        return sid;
    }

    public void setSid(String sid) {
        this.sid = sid;
    }

    public String getSessionVersion() {
        return sessionVersion;
    }

    public void setSessionVersion(String sessionVersion) {
        this.sessionVersion = sessionVersion;
    }

    public String getAgent() {
        return agent;
    }

    public void setAgent(String agent) {
        this.agent = agent;
    }

    public String getPeerId() {
        return peerId;
    }

    public void setPeerId(String peerId) {
        this.peerId = peerId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getAccount() {
        return account;
    }

    public void setAccount(String account) {
        this.account = account;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }
}
