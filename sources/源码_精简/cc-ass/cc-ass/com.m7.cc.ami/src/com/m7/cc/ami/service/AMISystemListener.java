package com.m7.cc.ami.service;

import com.m7.cc.ami.service.AMIClient;

public interface AMISystemListener {
	public void asteriskReloaded(AMIClient client);
	public void asteriskDisonnected(AMIClient client);
	public void asteriskConnected(AMIClient client);
}
