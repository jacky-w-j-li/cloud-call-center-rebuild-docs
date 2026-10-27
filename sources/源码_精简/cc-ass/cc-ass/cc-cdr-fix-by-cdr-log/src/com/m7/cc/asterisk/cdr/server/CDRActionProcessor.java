package com.m7.cc.asterisk.cdr.server;

import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;

public class CDRActionProcessor {
	private static CDRActionProcessor instance = null;
	
	private CDRActionProcessor(){
		instance = this;
	}
	
	public static CDRActionProcessor getInstance(){
		if(instance == null){
			new CDRActionProcessor();
		}
		return instance;
	}
	
	public C5Response processAction(C5Action action){
		return new C5Response(action, false);
	}
}
