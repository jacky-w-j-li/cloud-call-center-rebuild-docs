package com.m7.cc.ass.gateway.config.model;

import java.util.ArrayList;
import java.util.List;

public class SipDomain {
	
	private List<String> allowedDomains = new ArrayList<String> ();
	private String removeDomain="";
	
	public void setDomains(List<String> list) {
		allowedDomains = list;
	}
	
	public List<String> getDomains(){
		return allowedDomains;
	}

	public String getRemoveDomain() {
		return removeDomain;
	}

	public void setRemoveDomain(String removeDomain) {
		this.removeDomain = removeDomain;
	}
	
}
