package com.dishui.model;

import java.util.Map;

public class UserVo {
	
	private String userId;
	private String parentId;
	private String scope;
	private String accountId;
	
	public void mapRow(Map<String, Object>data){
		if(data.containsKey("_id")) this.userId = data.get("_id").toString();
		if(data.containsKey("parentId")) this.parentId = data.get("parentId").toString();
		if(data.containsKey("scope")) this.scope = data.get("scope").toString();
		if(data.containsKey("accountId")) this.accountId = data.get("accountId").toString();
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getParentId() {
		return parentId;
	}

	public void setParentId(String parentId) {
		this.parentId = parentId;
	}

	public String getScope() {
		return scope;
	}

	public void setScope(String scope) {
		this.scope = scope;
	}

	public String getAccountId() {
		return accountId;
	}

	public void setAccountId(String accountId) {
		this.accountId = accountId;
	}

	
}
