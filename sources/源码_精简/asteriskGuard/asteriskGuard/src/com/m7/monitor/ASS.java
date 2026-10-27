package com.m7.monitor;

import java.util.ArrayList;
import java.util.List;

public class ASS {
	private String ip;
	private List<Asterisk> asterisks = new ArrayList<Asterisk>();
	
	public ASS(String ip) {
		this.ip = ip;
	}
	
	public void addAsk(Asterisk ask) {
		asterisks.add(ask);
	}

	public List<Asterisk> getAsterisks() {
		return asterisks;
	}

	public String getIp() {
		return ip;
	}
}
