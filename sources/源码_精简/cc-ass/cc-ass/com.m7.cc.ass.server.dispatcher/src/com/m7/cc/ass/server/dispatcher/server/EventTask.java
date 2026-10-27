package com.m7.cc.ass.server.dispatcher.server;

import java.security.MessageDigest;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.json.JSONReader;
import com.m7.cc.json.JSONWriter;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;
import com.qiniu.api.io.IoApi;
import com.qiniu.api.io.PutExtra;
import com.qiniu.api.io.PutRet;

public class EventTask implements Runnable{

	private String url;
	private String account;
	private Logger log = Logger.getLogger(EventTask.class.getName());
	
	public EventTask(String url){
		this.url = url;
	}
	public EventTask(String url,String account){
		this.url = url;
		this.account = account;
	}
	
	@Override
	public void run() {
		String res = "";
		try {
			String address = url.split("\\?")[0];
			String param = url.split("\\?")[1];
			if (address.indexOf("[post]") != -1) {
				address = address.substring(0,address.indexOf("[post]"));
				res = HttpProvider.sendPost(address,param.getBytes("UTF-8"));
			} else {
				res = HttpProvider.sendGet(url);
			}
			/*if (address != null && address.indexOf("[post]") != -1) {
				address = address.substring(0,address.indexOf("[post]"));
				C5Event c = new C5Event(Fields.EventDispatcherResend);
				String[] strarr = param.split("\\&");
				for (int i= 0; i < strarr.length; i++) {
					if (strarr[i].split("\\=").length>1) {
						c.addParameter(strarr[i].split("\\=")[0], strarr[i].split("\\=")[1]);
					} else {
						c.addParameter(strarr[i].split("\\=")[0], "");
					}
				}
				res = HttpProvider.sendPost(address,param.getBytes("UTF-8"));
				System.out.println("console post url="+url+"......res="+res);
			} else {
				res = HttpProvider.sendGet(url);
				System.out.println("console get url="+url+"......res="+res);
			}*/
			
			if(RuntimeData.getInstance().getDispatcherResendMap().containsKey(account)){
				if(!res.trim().equals("200")){
					EventDispatcherResend.addToBuf(url);
				}
			}
		} catch (Exception e) {
			if(RuntimeData.getInstance().getDispatcherResendMap().containsKey(account)){
				EventDispatcherResend.addToBuf(url);				
			}
			log.log(Level.WARNING, url, e);
		}
	}
	
//	public static void main(String[] args) {
////		Config.ACCESS_KEY = "";
////        Config.SECRET_KEY = "";
////        Mac mac = new Mac(Config.ACCESS_KEY, Config.SECRET_KEY);
//        // 请确保该bucket已经存在
////        String bucketName = "";
////        PutPolicy putPolicy = new PutPolicy(bucketName);
////        String uptoken = putPolicy.token(mac);
//		//http://fw-v.jingzhuan.cn/?api=qiniu.token.uploadVoiceToken&amp;picName=lksjdflskdf.jpg&key=7moor&format=array&amp;ts=1425970884&sign=1e682c6036b4bd7ccb14cac328044133
//		//$api:     平台请求的api名称                                                      格式：test.test.get
//        //$key:     平台授权给应用key                                                    格式：7moor
//        //$secret: 平台授权给应用key对应的密钥(签名使用）               格式：SDEWRV(!@#!@#)ERWDF
//        //$format: 平台返回数据的格式，可默认（默认返回json)          格式：array
//        //$ts:        应用发起请求的时间戳（要求服务器时间必须争取）格式：1425957390
//		//$sign = md5('ChunTian' . $key . $secret . $api. $ts);
//		
//		try {
//			String time = Utils.getCurrentTimestamp();
//			time = time.substring(0, 10);
//			String encryptText = "ChunTian"+"7moor"+"SDEWRV(!@#!@#)ERWDF"+"qiniu.token.uploadVoiceToken"+time;
//			String fileName = "20150309-165026_N000000001907_24102146_902155783833_ckj-test-103-1425891026.706467.mp3";
//			MessageDigest md;
//			md = MessageDigest.getInstance("MD5");
//			md.update((encryptText).getBytes("UTF-8"));
//			byte[] paramDigest = md.digest();
//			String md5 = Utils.byteArrayToHexString(paramDigest);
//			String url = "http://fw-v.jingzhuan.cn/?api=qiniu.token.uploadVoiceToken&picName="+fileName+"&key=7moor&format=array&ts="
//							+time+"&sign="+md5;
//			String urlRes = HttpProvider.sendGet(url);
//			JSONReader reader = new JSONReader();
//			HashMap<String,Object> resMap = (HashMap<String,Object>)reader.read(urlRes);
//			System.out.println(resMap);
//			if(resMap.get("code").toString().equals("1")){
//				HashMap<String,String> tokenMap = (HashMap<String,String>)resMap.get("response");
//				String token = tokenMap.get("token");
//				String key = tokenMap.get("key");
//				System.out.println("-----token-----" + token);
//				System.out.println("-----key-----" + key);
//				
//				String localFile = "./20150309-165026_N000000001907_24102146_902155783833_ckj-test-103-1425891026.706467.mp3";
//				PutExtra extra = new PutExtra();
//				
//				HashMap<String, String> extraMap = new HashMap<String, String>();
//				extraMap.put("x:CallNo", "18600030392");
//				extraMap.put("x:CalledNo", "18600030392");
//				extraMap.put("x:CallSheetID", "abc-abc-abc-test111");
//				extraMap.put("x:CallID", "abc-abc-abc-test");
//				extraMap.put("x:CallType", "dialout");
//		        extra.params = extraMap;
//		        
//		        PutRet ret = IoApi.putFile(token, key, localFile, extra);
//		        System.out.println(ret.getResponse());
//		        HashMap<String,String> qiniuRes = (HashMap<String,String>)reader.read(ret.getResponse());
//		        System.out.println("--qiniu---"+qiniuRes);
//			}
//		} catch (Exception e) {
//			// TODO Auto-generated catch block
//			e.printStackTrace();
//		}
//	}
}
