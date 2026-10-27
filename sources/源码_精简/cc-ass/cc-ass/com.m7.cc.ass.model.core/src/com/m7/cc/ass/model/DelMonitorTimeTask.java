package com.m7.cc.ass.model;

import java.util.TimerTask;

import com.m7.cc.util.Utils;

public class DelMonitorTimeTask  extends TimerTask{
	
	@Override
	public void run() {
		String date = Utils.getDate("HH:mm");
		if (date.equalsIgnoreCase("01:00")){
			DelRecord.deleteRecord();
		} else if (date.equalsIgnoreCase("02:00")){
			DelRecord.deleteRecordZip();
		}else if (date.equalsIgnoreCase("02:30")){
			DelKdxfTtsWav.deleteKdxfTtsWav();
		}else if (date.equalsIgnoreCase("03:00")) {
			DelThirdWav.deletethirdWav();
		}
	}

}
