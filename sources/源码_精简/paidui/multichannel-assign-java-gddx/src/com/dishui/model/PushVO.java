package com.dishui.model;

import java.util.List;
import java.util.Set;

/**
 * Created by zengyx on 16/8/16.
 */
public class PushVO {
    private String agent;
    private Set<String> sessionIds;
    private String account;
    private String peerId;
    private int memorySeconds;
    private String pushVoType = Constant.PUSHVOTYPE_CLAIM;

    public PushVO(String agent, Set<String> sessionIds, String account, String peerId, int memorySeconds){
        this.agent = agent;
        this.sessionIds = sessionIds;
        this.account = account;
        this.peerId = peerId;
        this.memorySeconds = memorySeconds;
    }
    public PushVO(String agent, Set<String> sessionIds, String account, String peerId, int memorySeconds,String pushVoType){
        this.agent = agent;
        this.sessionIds = sessionIds;
        this.account = account;
        this.peerId = peerId;
        this.memorySeconds = memorySeconds;
        this.pushVoType = pushVoType;
    }
    public Set<String> getSessionIds() {
        return sessionIds;
    }

    public void setSessionIds(Set<String> sessionIds) {
        this.sessionIds = sessionIds;
    }

    public String getAgent() {
        return agent;
    }

    public void setAgent(String agent) {
        this.agent = agent;
    }

    public String getAccount() {
        return account;
    }

    public void setAccount(String account) {
        this.account = account;
    }

    public String getPeerId() {
        return peerId;
    }

    public void setPeerId(String peerId) {
        this.peerId = peerId;
    }

    public int getMemorySeconds() {
        return memorySeconds;
    }

    public void setMemorySeconds(int memorySeconds) {
        this.memorySeconds = memorySeconds;
    }
	public String getPushVoType() {
		return pushVoType;
	}
	public void setPushVoType(String pushVoType) {
		this.pushVoType = pushVoType;
	}
    
    
}
