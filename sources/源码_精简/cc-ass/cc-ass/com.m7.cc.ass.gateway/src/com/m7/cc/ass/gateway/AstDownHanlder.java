package com.m7.cc.ass.gateway;

import com.m7.cc.asterisk.ami.AsteriskSysListener;

public class AstDownHanlder implements AsteriskSysListener {

	private String id;
	private EventHandler handler;
	
	public AstDownHanlder(String aid, EventHandler ehandler) {
		this.id = aid;
		this.handler = ehandler;
	}
	
	@Override
	public void asteriskDown(String pbx) {
		this.handler.emptyChannels();
		// TODO Auto-generated method stub

	}

	@Override
	public void asteriskReload(String pbx) {
		// TODO Auto-generated method stub

	}

}
