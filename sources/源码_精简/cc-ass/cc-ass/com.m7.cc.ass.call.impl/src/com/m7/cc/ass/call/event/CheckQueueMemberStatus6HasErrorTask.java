package com.m7.cc.ass.call.event;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.json.JSONWriter;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;

public class CheckQueueMemberStatus6HasErrorTask implements Runnable{

	private String pbx;
	private String peer;
	private String userName;
	private String queueName;
	private String content;
	private Logger log = Logger.getLogger(CheckQueueMemberStatus6HasErrorTask.class.getName());
	
	public CheckQueueMemberStatus6HasErrorTask(String pbx,String queueName,String peer,String userName,String content){
		this.pbx = pbx;
		this.peer = peer;
		this.userName = userName;
		this.queueName = queueName;
		this.content = content;
	}
	
	@Override
	public void run() {
		try {
			log.log(Level.WARNING,"CheckQueueMemberStatus6HasErrorTask pbx:" + pbx + ",queue:" + queueName + ",peer:"+peer +",userName:"+userName+",content:"+content);	
			HashMap<String, String> sendMap = new HashMap<String, String>();
			sendMap.put("subject", "CheckQueueMemberStatus6HasErrorTask["+ content+"]");
			sendMap.put("content", "CheckQueueMemberStatus6HasErrorTask("+pbx+")("+queueName+")("+peer+")("+userName+")("+content+")"+Utils.getCurrentDate());
			JSONWriter jw = new JSONWriter();
			String url = "http://115.29.14.183:3000/public";
			String data = "action=ass.commonWarning&data="+jw.write(sendMap);
			String billRes = HttpProvider.sendPost(url,data.getBytes("UTF-8"));
			log.log(Level.WARNING,"CheckQueueMemberStatus6HasErrorTask pbx:" + pbx + ",queue:" + queueName + ",peer:"+peer +",userName:"+userName+",content:"+content+". bill result:"+billRes);

//			String url = "http://115.29.14.183:3000/openService?action=sendInterfaceTemplateSms&account=N00000002272&password=bvff334f3x5ids&" +
//					"num=18600030392&templateNum=1&var1=CheckQueueMemberStatus6HasErrorTask("+pbx+")("+queueName+")("+peer+")("+userName+")("+content+")&md5=81f0e1f0-32df-11e3-a2e6-1d21429e5f46";
//			String billRes = HttpProvider.sendGet(url);
		} catch (Exception e) {
			log.log(Level.WARNING, "CheckQueueMemberStatus6HasErrorTask pbx:" + pbx + ",queue:" + queueName + ",peer:"+peer +",userName:"+userName+",content:"+content+"  has Exception!", e);
		}
	}
}
