package com.m7.cc.ass.server.handler.core;

import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;

public interface C5Handler {
	public C5Response handle(C5Action action);
}
