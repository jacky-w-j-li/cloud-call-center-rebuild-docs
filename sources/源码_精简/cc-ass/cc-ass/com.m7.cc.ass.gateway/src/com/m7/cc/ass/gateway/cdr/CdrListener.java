package com.m7.cc.ass.gateway.cdr;

import com.m7.cc.ass.gateway.GWChannel;


public interface CdrListener {
	public void channelCdrNew(GWChannel cdr);
}
