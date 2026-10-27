package com.m7.cc.interfaces;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.asterisk.cdr.server.CdrServerConfig;
import com.m7.cc.json.JSONWriter;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.log.IceLogger;


public class HangupSMSSend implements Runnable {
	private String account;//	1	账号	呼叫中心账号ID，用户请到“对接数据查询”根据开通的账号查询。
	private String hangupsms;	//	内部挂机模板参数
	private String num;	//1	接收手机号码	多个手机号码以英文逗号分隔，一次调用最大为3000个号码
	private String templateNum;	//1	短信模板编号	必须传提前报备过的，从模板查询接口获得
	private static Logger log = IceLogger.getLogger(CdrServerConfig.getInstance().getLogDir(),
			"hangup_sms", "ALL", false);
	public HangupSMSSend(String account, String hangupsms, String num,
			String templateNum) {
		this.account = account;
		this.hangupsms = hangupsms;
		this.num = num;
		this.templateNum = templateNum;

	}
	@Override
	public void run() {
		try {
			log.setUseParentHandlers(false);
			String url=CdrServerConfig.getInstance().getHangup_sms_url()+"openService?action=sendInterfaceTemplateSms";
			String data="&account="+account+"&hangupsms="+hangupsms+"&num="+num+"&templateNum="+templateNum;
			log.log(Level.INFO,url+data);
			String Messageres=HttpProvider.sendGet(url+data);
			log.log(Level.INFO,url+data+"has send!! RES="+Messageres);
		} catch (Exception e) {
			log.log(Level.WARNING,"account:"+account+"hangupsms:"+hangupsms+"num:"+num+"templateNum:"+templateNum+"has send error!!",e);
		}
	
	}
	
	
}
