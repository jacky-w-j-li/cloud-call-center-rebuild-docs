package com.m7.cc.ass.model;

import com.m7.cc.command.Fields;

public class C5Lisence {
	private int monitorCount = 0;
	private int enterpriseCount = 0;
	private int standardCount = 0;
	private int outCallCount = 0;
	private int outcallSpecialCount = 0;
	private int ivrCount = 0;
	private int businessCount = 0;
	private int orderCount = 0;
	private int serviceCount = 0;
	private int maxIncomingCalls = 2;
	private int maxOutboundCalls = -1;
	private boolean canDialout = true;
	private boolean callable400 = true;
	private String autoCallStrategy = Fields.AutoCallStrategy_Static;
	private int smartAutoCallCount = 1;

	private String account;

	public C5Lisence(String account) {
		this.account = account;
	}

	public int getAppCount() {
		return this.orderCount;
	}

	public int getCallCount() {
		return this.monitorCount + this.enterpriseCount + this.standardCount
				+ this.outCallCount + this.businessCount+ this.outcallSpecialCount;
	}

	public int getCount(String version) {
		if (version.equals(Fields.VersionMonitor))//监控版
			return this.monitorCount;
		else if (version.equals(Fields.VersionEnterprise))//企业版
			return this.enterpriseCount;
		else if (version.equals(Fields.VersionService))//标准版
			return this.serviceCount;
		else if (version.equals(Fields.VersionOutcallSpecial))//电销专用版
			return this.outcallSpecialCount;
		else if (version.equals(Fields.VersionOutCall))//电销版
			return this.outCallCount;
		else if (version.equals(Fields.VersionStandard))
			return this.standardCount;
		else if (version.equals(Fields.VersionIVR))
			return this.ivrCount;
		else if (version.equals(Fields.VersionBusiness))
			return this.businessCount;
		else if (version.equals(Fields.VersionOrder))
			return this.orderCount;
		
		else
			return -1;
	}

	public int getMonitorCount() {
		return monitorCount;
	}

	public void setMonitorCount(int monitorCount) {
		this.monitorCount = monitorCount;
	}

	public int getEnterpriseCount() {
		return enterpriseCount;
	}

	public void setEnterpriseCount(int enterpriseCount) {
		this.enterpriseCount = enterpriseCount;
	}

	public int getStandardCount() {
		return standardCount;
	}

	public void setStandardCount(int standardCount) {
		this.standardCount = standardCount;
	}

	public int getOutCallCount() {
		return outCallCount;
	}

	public void setOutCallCount(int outCallCount) {
		this.outCallCount = outCallCount;
	}
	
	public int getOutCallSpecialCount() {
		return outcallSpecialCount;
	}
	public void setOutCallSpecialCount(int outcallSpecialCount) {
		this.outcallSpecialCount = outcallSpecialCount;
	}
	
	public int getIvrCount() {
		return ivrCount;
	}

	public void setIvrCount(int ivrCount) {
		this.ivrCount = ivrCount;
	}

	public int getBusinessCount() {
		return businessCount;
	}

	public void setBusinessCount(int businessCount) {
		this.businessCount = businessCount;
	}

	public int getOrderCount() {
		return orderCount;
	}

	public void setOrderCount(int orderCount) {
		this.orderCount = orderCount;
	}

	public int getServiceCount() {
		return serviceCount;
	}

	public void setServiceCount(int serviceCount) {
		this.serviceCount = serviceCount;
	}

	public boolean isCanDialout() {
		return canDialout;
	}

	public void setCanDialout(boolean canDialout) {
		this.canDialout = canDialout;
	}

	public String getAccount() {
		return account;
	}

	public int getMaxIncomingCalls() {
		return maxIncomingCalls;
	}

	public void setMaxIncomingCalls(int maxIncomingCalls) {
		this.maxIncomingCalls = maxIncomingCalls;
	}

	public int getMaxOutboundCalls() {
		return maxOutboundCalls;
	}

	public void setMaxOutboundCalls(int maxOutboundCalls) {
		this.maxOutboundCalls = maxOutboundCalls;
	}

	public boolean isCallable400() {
		return callable400;
	}

	public void setCallable400(boolean callable400) {
		this.callable400 = callable400;
	}

	public String getAutoCallStrategy() {
		return autoCallStrategy;
	}

	public void setAutoCallStrategy(String autoCallStrategy) {
		this.autoCallStrategy = autoCallStrategy;
	}

	public int getSmartAutoCallCount() {
		return smartAutoCallCount;
	}

	public void setSmartAutoCallCount(int smartAutoCallCount) {
		this.smartAutoCallCount = smartAutoCallCount;
	}
	
}
