package com.m7.cc.ass.call.event;

import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.json.JSONWriter;
import com.m7.cc.url.HttpProvider;

public class CheckInRateLowTask implements Runnable{

	private String account;
	private String serviceNo;
	private String rate;
	private String hour;
	private Logger log = Logger.getLogger(CheckRegisterIPCountryTask.class.getName());
	
	public CheckInRateLowTask(String account,String serviceNo,String rate,String hour){
		this.account = account;
		this.serviceNo = serviceNo;
		this.rate = rate;
		this.hour = hour;
	}
	
	@Override
	public void run() {
		try {
			log.log(Level.WARNING,"serviceNo in rate low serviceNo:" + serviceNo + ",rate:"+rate +",hour:"+hour);	
			HashMap<String, String> sendMap = new HashMap<String, String>();
			sendMap.put("account", account);
			sendMap.put("serviceNo", serviceNo);
			sendMap.put("rate", rate);
			sendMap.put("hour", hour);
			JSONWriter jw = new JSONWriter();
			String url = "http://115.29.14.183:3000/public?action=ass.inRateLowWarning&data=" + jw.write(sendMap);

			String billRes = HttpProvider.sendGet(url);
			log.log(Level.WARNING,serviceNo+" in rate low rate:" + rate +",hour="+this.hour+". bill result:"+billRes);
		} catch (Exception e) {
			log.log(Level.WARNING, "CheckInRateLowTask has err! [serviceNo]="+serviceNo, e);
		}
	}
}
