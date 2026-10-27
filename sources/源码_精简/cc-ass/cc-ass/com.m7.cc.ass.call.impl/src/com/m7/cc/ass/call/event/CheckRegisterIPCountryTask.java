package com.m7.cc.ass.call.event;

import java.net.URLEncoder;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.json.JSONReader;
import com.m7.cc.json.JSONWriter;
import com.m7.cc.url.HttpProvider;

public class CheckRegisterIPCountryTask implements Runnable{

	private String ip;
	private String pbx;
	private String sipNo;
	private String taobaoUrl = "http://ip.taobao.com/service/getIpInfo.php";
	private Logger log = Logger.getLogger(CheckRegisterIPCountryTask.class.getName());
	
	public CheckRegisterIPCountryTask(String ip,String pbx,String sipNo){
		this.ip = ip;
		this.pbx = pbx;
		this.sipNo = sipNo;
	}
	
	@Override
	public void run() {
		try {
			log.log(Level.WARNING,"check register sip IP:" + ip + ",sipNo:"+sipNo +",pbx:"+pbx);	
			String res = HttpProvider.sendGet(taobaoUrl+"?ip="+ip, 30000);
			log.log(Level.WARNING,"check register sip IP:" + ip + ",sipNo:"+sipNo +",pbx:"+pbx+",taobao res="+res);
			JSONReader jr = new JSONReader();
			HashMap<String, Object> map = (HashMap<String, Object>)jr.read(res);
			String code = map.get("code").toString();
			if(code.equals("0")){
				HashMap<String, String> countryMap = (HashMap<String, String>)map.get("data");
				if(!countryMap.get("country_id").equals("CN") && !countryMap.get("country_id").equals("IANA")){
					log.log(Level.WARNING,pbx+"find foreign IP register:" + ip +",sipNo="+this.sipNo);	
					HashMap<String, String> sendMap = new HashMap<String, String>();
					sendMap.put("pbx", pbx);
					sendMap.put("sipNo", sipNo);
					sendMap.put("ip", ip);
					sendMap.put("country", URLEncoder.encode(countryMap.get("country"),"utf-8"));
					sendMap.put("country_id", countryMap.get("country_id"));
					JSONWriter jw = new JSONWriter();
					String url = "http://115.29.14.183:3000/public?action=ass.foreignIpRegisterWarning&data=" + jw.write(sendMap);

					String billRes = HttpProvider.sendGet(url);
					log.log(Level.WARNING,pbx+"find foreign IP register:" + ip +",sipNo="+this.sipNo+".bill result:"+billRes);
				}else{
					log.log(Level.WARNING,"china IP:" + ip);		
				}
			}else{
				log.log(Level.WARNING,"from taobao inter face query IP country failed!:"+res);				
			}
		} catch (Exception e) {
			log.log(Level.WARNING, "CheckRegisterIPCountryTask has err! [ip]="+ip, e);
		}
	}
}
