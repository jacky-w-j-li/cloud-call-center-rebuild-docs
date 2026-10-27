package com.m7.cc.asterisk.ami;

public interface AsteriskSysListener {
	public void asteriskDown(String pbx);
	public void asteriskReload(String pbx);
}
