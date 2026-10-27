package com.m7.cc.ass.server.dispatcher.server;

import java.io.FileInputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.TimerTask;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.aliyun.oss.OSSClient;
import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.json.JSONReader;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.Utils;
import com.qiniu.api.io.IoApi;
import com.qiniu.api.io.PutExtra;
import com.qiniu.api.io.PutRet;

public class QiniuHandMonitorDispatcherTask extends TimerTask {
	
	private Logger log = Logger.getLogger(QiniuHandMonitorDispatcherTask.class.getName());
	
	@Override
	public void run() {
		OSSClient ossClient = null;
		try {
			//init aliyun oss client--
			//oss wai wang
			String endpoint = "http://oss-cn-hangzhou.aliyuncs.com";
			String someOnePbx = RuntimeData.getInstance().getPbxs().get(0);
			if(someOnePbx != null && someOnePbx.indexOf("ali") != -1){
				//aliyun ecs nei wang
				endpoint = "http://oss-cn-hangzhou-internal.aliyuncs.com";
			}
			String accessKeyId = "IOJiGZytxGhRfvQT";
			String accessKeySecret = "RrjQpV29rSAIpBGc1Tk4d0qhsXoqXm";
			ossClient = new OSSClient(endpoint, accessKeyId, accessKeySecret);
			//--end init aliyun oss
			String appUrl = ASConfig.getInstance().getVar("app.url");
			if(!appUrl.endsWith("/")){
				appUrl += "/";
			}
			appUrl += "service";
			String getAccData = "action=assGetQiNiuHandPushAccounts&data={\"pbx\":\""+RuntimeData.getInstance().getPbxs().get(0)+"\"}\r\n";
			String accRes = HttpProvider.sendPost(appUrl, getAccData.getBytes("UTF-8"));
			JSONReader jRead = new JSONReader();
			
			HashMap<String,Object> accMapRes = (HashMap<String,Object>)jRead.read(accRes);
			log.log(Level.WARNING, "Qiniu hand getAccs from ["+getAccData+"] cc-server=="+accRes);
			if(Boolean.parseBoolean(accMapRes.get("success").toString())){
				ArrayList<HashMap<String,String>> accList = (ArrayList<HashMap<String,String>>)accMapRes.get("list");
				for(int i=0 ;i<accList.size(); i++){
					String curAcc = accList.get(i).get("_id");
					String curDate = accList.get(i).get("date");
					String beginDate = accList.get(i).get("beginDate");
					String endDate = accList.get(i).get("endDate");
					String curPbxName = RuntimeData.getInstance().getPbxViaAccount(curAcc);
					if(curPbxName != null){
						String qiniu_acc = accList.get(i).get("qiniu_acc");
						String getCdrData = "action=assGetQiNiuCdrByAcc&data={\"account\":\""+curAcc+"\",\"date\":\""+curDate+"\"}\r\n";
						if(beginDate != null && endDate != null){
							getCdrData = "action=assGetQiNiuCdrByAcc&data={\"account\":\""+curAcc+"\",\"beginDate\":\""+beginDate+"\",\"endDate\":\""+endDate+"\"}\r\n";
						}
						String cdrRes = HttpProvider.sendPost(appUrl, getCdrData.getBytes("UTF-8"));
						log.log(Level.WARNING, "Qiniu hand getCdrs from cc-server=="+cdrRes);
						HashMap<String,Object> cdrMapRes = (HashMap<String,Object>)jRead.read(cdrRes);
						if(Boolean.parseBoolean(cdrMapRes.get("success").toString())){
							ArrayList<HashMap<String,String>> cdrList = (ArrayList<HashMap<String,String>>)cdrMapRes.get("list");
							for(int j=0; j<cdrList.size();j++){
								String fileName = cdrList.get(j).get("RECORD_FILE_NAME");
								if(qiniu_acc != null && qiniu_acc.equals("7moor")){
									pushFileTo7moor(fileName, "/var/spool/asterisk/"+fileName, cdrList.get(j).get("_id"), cdrList.get(j).get("ACCOUNT_ID"));
								}if(qiniu_acc != null && qiniu_acc.equals("aliyunoss")){
									pushFileToAliyunOss(fileName, "/var/spool/asterisk/"+fileName, cdrList.get(j).get("_id"), cdrList.get(j).get("ACCOUNT_ID"), ossClient);
								}else{
									pushFile("/var/spool/asterisk/"+fileName
											, cdrList.get(j).get("CALL_NO")
											, cdrList.get(j).get("CALLED_NO")
											, cdrList.get(j).get("_id")
											, cdrList.get(j).get("CALL_ID")
											, cdrList.get(j).get("CONNECT_TYPE"));									
								}
							}
						}else{
							log.log(Level.WARNING, "Qiniu hand push get cdrs from cc-server failed! result="+cdrRes);
						}
					}
				}
			}else{
				log.log(Level.WARNING, "Qiniu hand push get accounts from cc-server failed! result="+accRes);
			}
		}catch(Exception e){
			log.log(Level.WARNING, "Qiniu hand push failed! has Exception !", e);
		}finally{
			if(ossClient != null){
				ossClient.shutdown();
				log.log(Level.WARNING, "ossClient shutdown!");
			}
		}
	}
	/**
	 * http://fw-v.jingzhuan.cn/?api=qiniu.token.uploadVoiceToken&amp;picName=lksjdflskdf.jpg&key=7moor&format=array&amp;ts=1425970884&sign=1e682c6036b4bd7ccb14cac328044133
		$api:     平台请求的api名称                     	格式：test.test.get
        $key:     平台授权给应用key                     	格式：7moor
        $secret: 平台授权给应用key对应的密钥(签名使用）    	格式：SDEWRV(!@#!@#)ERWDF
        $format: 平台返回数据的格式，可默认（默认返回json) 	格式：array
        $ts:        应用发起请求的时间戳（要求服务器时间必须争取）格式：1425957390
		$sign = md5('ChunTian' . $key . $secret . $api. $ts);
	 * @param filePathName
	 * @param CallNo
	 * @param CalledNo
	 * @param CallSheetID
	 * @param CallID
	 * @param CallType
	 * @return
	 */
	private void pushFile(String filePathName, String CallNo,
				String CalledNo, String CallSheetID, String CallID, String CallType){
		try {
			String time = Utils.getCurrentTimestamp();
			time = time.substring(0, 10);
			String encryptText = "ChunTian"+"7moor"+"SDEWRV(!@#!@#)ERWDF"+"qiniu.token.uploadVoiceToken"+time;
			MessageDigest md;
			md = MessageDigest.getInstance("MD5");
			md.update((encryptText).getBytes("UTF-8"));
			byte[] paramDigest = md.digest();
			String md5 = Utils.byteArrayToHexString(paramDigest);
			String fileName = filePathName.substring(filePathName.lastIndexOf("/")+1);
			String url = "http://fw-v.jingzhuan.cn/?api=qiniu.token.uploadVoiceToken&picName="+fileName+"&key=7moor&format=array&ts="
							+time+"&sign="+md5;
			String urlRes = HttpProvider.sendGet(url);
			JSONReader reader = new JSONReader();
			HashMap<String,Object> resMap = (HashMap<String,Object>)reader.read(urlRes);
			log.log(Level.WARNING, "Qiniu hand get token result="+resMap+" filePathName="+filePathName);
			
			if(resMap.get("code").toString().equals("1")){
				HashMap<String,String> tokenMap = (HashMap<String,String>)resMap.get("response");
				String token = tokenMap.get("token");
				String key = tokenMap.get("key");
				PutExtra extra = new PutExtra();
				HashMap<String, String> extraMap = new HashMap<String, String>();
				extraMap.put("x:CallNo", CallNo);
				extraMap.put("x:CalledNo", CalledNo);
				extraMap.put("x:CallSheetID", CallSheetID);
				extraMap.put("x:CallID", CallID);
				extraMap.put("x:CallType", CallType);
		        extra.params = extraMap;
		        PutRet ret = IoApi.putFile(token, key, filePathName, extra);
		        HashMap<String,Object> qiniuRes = (HashMap<String,Object>)reader.read(ret.getResponse());
		        if(Boolean.parseBoolean(qiniuRes.get("success").toString())){
		        	log.log(Level.WARNING, "Qiniu hand push file Success result="+ret.getResponse()+" filePathName="+filePathName);
		        }else{
		        	log.log(Level.WARNING, "Qiniu hand push file failed result="+ret.getResponse()+" filePathName="+filePathName);	
		        }
			}
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			log.log(Level.WARNING, "Qiniu hand push file failed has Excepiton!"+" filePathName="+filePathName, e);
		}
	}

	/**
	 * upload to 7moor qiniu account bucket 'm7-cdr-record'
	 * @param filePathName
	 * @return
	 */
	private void pushFileTo7moor(String fileName, String filePathName, String callSheetID,String account){
		try {
			String appUrl = ASConfig.getInstance().getVar("app.url");
			if(!appUrl.endsWith("/")){
				appUrl += "/";
			}
			appUrl += "service";
			String urlRes = HttpProvider.sendGet(appUrl +"?action=assGetQiniuUptoken&data={}");
			JSONReader reader = new JSONReader();
			HashMap<String,Object> resMap = (HashMap<String,Object>)reader.read(urlRes);
			log.log(Level.WARNING, "Qiniu 7moor get token result="+resMap+" filePathName="+filePathName);
			if(resMap.get("success").toString().equals("true")){
				String token = resMap.get("uptoken").toString();
				PutExtra extra = new PutExtra();
		        PutRet ret = IoApi.putFile(token, account+"/"+fileName, filePathName, extra);
		        HashMap<String,Object> qiniuRes = (HashMap<String,Object>)reader.read(ret.getResponse());
		        if(qiniuRes.get("hash").toString() != null){
		        	log.log(Level.WARNING, "Qiniu 7moor push file Success result="+ret.getResponse()+" filePathName="+filePathName);
		        	//update mongodb cdr fileserver
		        	String sendPost = "action=assUpdateQiNiuCdrFileServer&data={\"id\":\""+callSheetID+"\",\"account\":\""+account+"\"}";
		        	String cdrRes = HttpProvider.sendPost(appUrl, sendPost.getBytes("UTF-8"));
					log.log(Level.WARNING, "Qiniu 7moor assUpdateQiNiuCdrFileServer result="+cdrRes+" filePathName="+filePathName);
		        }else{
		        	log.log(Level.WARNING, "Qiniu 7moor push file failed result="+ret.getResponse()+" filePathName="+filePathName);	
		        }
			}
		} catch (Exception e) {
			e.printStackTrace();
			log.log(Level.WARNING, "Qiniu 7moor push file failed has Excepiton!"+" filePathName="+filePathName, e);
		}
	}
	
	/**
	 * upload to 7moor aliyun oss account bucket 'm7-record'
	 * @param filePathName
	 * @return
	 */
	private void pushFileToAliyunOss(String fileName, String filePathName, String callSheetID, String account, OSSClient ossClient){
		try {
	        InputStream inputStream;
			inputStream = new FileInputStream(filePathName);
			ossClient.putObject("m7-record", account+"/"+fileName, inputStream);
			
        	log.log(Level.WARNING, "Aliyun oss 7moor push file Success ! filePathName="+filePathName);
        	//update mongodb cdr fileserver
        	String appUrl = ASConfig.getInstance().getVar("app.url");
			if(!appUrl.endsWith("/")){
				appUrl += "/";
			}
			appUrl += "service";
        	String sendPost = "action=assUpdateAliyunOssCdrFileServer&data={\"id\":\""+callSheetID+"\",\"account\":\""+account+"\"}";
        	String cdrRes = HttpProvider.sendPost(appUrl, sendPost.getBytes("UTF-8"));
			log.log(Level.WARNING, "Aliyun oss assUpdateQiNiuCdrFileServer result="+cdrRes+" filePathName="+filePathName);
		} catch (Exception e) {
			e.printStackTrace();
			log.log(Level.WARNING, "Aliyun oss push file failed has Excepiton! filePathName="+filePathName, e);
		}
	}
	
}
