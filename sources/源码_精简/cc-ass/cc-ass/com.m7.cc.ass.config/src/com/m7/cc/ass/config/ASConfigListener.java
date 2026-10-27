package com.m7.cc.ass.config;

public interface ASConfigListener {
	public void pbxRemoved(String ip);
	public void pbxAdd(String ip);
	public void pbxChanged(String ip);
}
