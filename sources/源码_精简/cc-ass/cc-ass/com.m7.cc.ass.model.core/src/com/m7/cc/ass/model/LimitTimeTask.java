package com.m7.cc.ass.model;

import java.util.TimerTask;

import com.m7.cc.util.Utils;

public class LimitTimeTask  extends TimerTask{
	
	@Override
	public void run() {
		String date = Utils.getDate("HH:mm");
		if (date.equalsIgnoreCase("00:00")){
			RuntimeData.getInstance().getNumCallToManyACCLimit().clear();
			RuntimeData.getInstance().getNumCallToManyLimit().clear();
		} 
	}

}
