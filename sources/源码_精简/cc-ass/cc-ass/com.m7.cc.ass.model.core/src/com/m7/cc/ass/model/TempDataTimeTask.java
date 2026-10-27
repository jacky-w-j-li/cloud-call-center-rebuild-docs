package com.m7.cc.ass.model;

import java.util.TimerTask;

import com.m7.cc.util.Utils;

public class TempDataTimeTask  extends TimerTask{
	private C5Pbx pbx;
	
	public TempDataTimeTask(C5Pbx pbx){
		this.pbx = pbx;
	}
	@Override
	public void run() {
		String date = Utils.getDate("HH:mm");
		if(date.equalsIgnoreCase("00:00")){
			pbx.clearTempData();
			System.gc();
		}
		pbx.saveTempData();
	}

}
