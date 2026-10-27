package com.m7.cc.ass.model;

import java.util.TimerTask;

import com.m7.cc.util.Utils;

public class C5LisenceTask extends TimerTask{

	@Override
	public void run() {
		String date = Utils.getDate("HH:mm");
		if(date.startsWith("01")){
			C5LisenceHandler.updateLisence();
			C5LisenceHandler.update400Lisence();
		}
	}

}
