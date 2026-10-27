/*
 *  Copyright (c) 2014 The CCP project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a Beijing Speedtong Information Technology Co.,Ltd license
 *  that can be found in the LICENSE file in the root of the web site.
 *
 *   http://www.yuntongxun.com
 *
 *  An additional intellectual property rights grant can be found
 *  in the file PATENTS.  All contributing project authors may
 *  be found in the AUTHORS file in the root of the source tree.
 */
package com.dishui.ytx;

//import com.cloopen.rest.sdk.utils.CcopHttpClient;
//import com.cloopen.rest.sdk.utils.DateUtil;
//import com.cloopen.rest.sdk.utils.EncryptUtil;
//import com.cloopen.rest.sdk.utils.LoggerUtil;
import com.dishui.bill.command.JSONReader;
import com.dishui.bill.service.AppConfig;
import com.dishui.db.mango.MongoProvider;
import com.dishui.sms.JXFXSmsMaster;
import com.dishui.util.SmsUtil;
import com.dishui.ytx.utils.CcopHttpClient;
import com.dishui.ytx.utils.DateUtil;
import com.dishui.ytx.utils.EncryptUtil;
import com.dishui.ytx.utils.LoggerUtil;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import org.apache.log4j.chainsaw.Main;
import org.dom4j.Document;
import org.dom4j.DocumentException;
import org.dom4j.DocumentHelper;
import org.dom4j.Element;
import ytx.org.apache.http.HttpEntity;
import ytx.org.apache.http.HttpResponse;
import ytx.org.apache.http.client.methods.HttpGet;
import ytx.org.apache.http.client.methods.HttpPost;
import ytx.org.apache.http.client.methods.HttpRequestBase;
import ytx.org.apache.http.entity.BasicHttpEntity;
import ytx.org.apache.http.impl.client.DefaultHttpClient;
import ytx.org.apache.http.message.AbstractHttpMessage;
import ytx.org.apache.http.util.EntityUtils;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.Map.Entry;
import java.util.logging.Level;

public class CCPRestSDK {

	 

	private static final int Request_Get = 0;


	private static final int Request_Post = 1;
	private static final String Account_Info = "AccountInfo";
	private static final String Create_SubAccount = "SubAccounts";
	private static final String Get_SubAccounts = "GetSubAccounts";
	private static final String Query_SubAccountByName = "QuerySubAccountByName";

	private static final String SMSMessages = "SMS/Messages";
	private static final String TemplateSMS = "SMS/TemplateSMS";
	private static final String CreateSMSTemplate = "SMS/CreateSMSTemplate";
	private static final String QuerySMSTemplate = "SMS/QuerySMSTemplate";
	private static final String Call_back = "Calls/Callback";
	private static final String LandingCalls = "Calls/LandingCalls";
	private static final String VoiceVerify = "Calls/VoiceVerify";
	private static final String IvrDial = "ivr/dial";
	private static final String BillRecords = "BillRecords";
    private static final String CommitDisplayNumbers = "partner/CommitDisplayNumbers";
	private String SERVER_IP;
	private String SERVER_PORT;
	private String ACCOUNT_SID;
	private String ACCOUNT_TOKEN;
	private String SUBACCOUNT_SID;
	private String SUBACCOUNT_Token;
	private String VOIP_ACCOUNT;
	private String VOIP_TOKEN;
	public String App_ID;
	private BodyType BODY_TYPE = BodyType.Type_JSON;

	public enum BodyType {
		Type_XML, Type_JSON;
	}

	public enum AccountType {
		Accounts, SubAccounts;
	}

	/**
	 * 初始化服务地址和端口
	 * 
	 * @param serverIP
	 *            必选参数 服务器地址
	 * @param serverPort
	 *            必选参数 服务器端口
	 */
	public void init(String serverIP, String serverPort) {
		if (isEmpty(serverIP) || isEmpty(serverPort)) {
			LoggerUtil.fatal("初始化异常:serverIP或serverPort为空");
			throw new IllegalArgumentException("必选参数:" + (isEmpty(serverIP) ? " 服务器地址 " : "") + (isEmpty(serverPort) ? " 服务器端口 " : "") + "为空");
		}
		SERVER_IP = serverIP;
		SERVER_PORT = serverPort;
	}

	/**
	 * 初始化主帐号信息
	 * 
	 * @param accountSid
	 *            必选参数 主帐号名称
	 * @param accountToken
	 *            必选参数 主帐号令牌
	 */
	public void setAccount(String accountSid, String accountToken) {
		if (isEmpty(accountSid) || isEmpty(accountToken)) {
			LoggerUtil.fatal("初始化异常:accountSid或accountToken为空");
			throw new IllegalArgumentException("必选参数:" + (isEmpty(accountSid) ? " 主帐号名称" : "") + (isEmpty(accountToken) ? " 主帐号令牌 " : "") + "为空");
		}
		ACCOUNT_SID = accountSid;
		ACCOUNT_TOKEN = accountToken;
	}

	/**
	 * 初始化子帐号信息
	 * 
	 * @param subAccountSid
	 *            必选参数 子帐号名称
	 * @param subAccountToken
	 *            必选参数 子帐号令牌
	 */
	public void setSubAccount(String subAccountSid, String subAccountToken) {
		if (isEmpty(subAccountSid) || isEmpty(subAccountToken)) {
			LoggerUtil.fatal("初始化异常:subAccountSid或subAccountToken为空");
			throw new IllegalArgumentException("必选参数:" + (isEmpty(subAccountSid) ? " 子帐号名称" : "") + (isEmpty(subAccountToken) ? " 子帐号令牌 " : "") + "为空");
		}
		SUBACCOUNT_SID = subAccountSid;
		SUBACCOUNT_Token = subAccountToken;
	}

	/**
	 * 初始化应用Id
	 * 
	 * @param appId
	 *            必选参数 应用Id
	 */
	public void setAppId(String appId) {
		if (isEmpty(appId)) {
			LoggerUtil.fatal("初始化异常:appId为空");
			throw new IllegalArgumentException("必选参数: 应用Id 为空");
		}
		App_ID = appId;
	}


	/**
	 * 初始化VoIP帐号信息
	 * 
	 * @param voIPAccount
	 *            必选参数 VoIP帐号
	 * @param voIPPassWord
	 *            必选参数 VoIP密码
	 */
	public void setVoIPAccount(String voIPAccount, String voIPPassWord) {
		if (isEmpty(voIPAccount) || isEmpty(voIPPassWord)) {
			LoggerUtil.fatal("初始化异常:voIPAccount或voIPPassWord为空");
			throw new IllegalArgumentException("必选参数:" + (isEmpty(voIPAccount) ? " VoIP帐号" : "") + (isEmpty(voIPPassWord) ? " VoIP密码 " : "") + "为空");
		}
		VOIP_ACCOUNT = voIPAccount;
		VOIP_TOKEN = voIPPassWord;
	}

	/**
	 * 话单下载
	 * 
	 * @param date
	 *            必选参数 day 代表前一天的数据（从00:00 – 23:59）;week代表前一周的数据(周一 到周日)；
	 *            month表示上一个月的数据（上个月表示当前月减1，如果今天是4月10号，则查询结果是3月份的数据）
	 * @param keywords
	 *            可选参数 客户的查询条件，由客户自行定义并提供给云通讯平台。默认不填忽略此参数
	 * @return
	 */
	public HashMap<String, Object> billRecords(String date, String keywords) {
		 
		HashMap<String, Object> validate = accountValidate();
		if(validate!=null) 
			return validate;
		if ((isEmpty(date))) {
			LoggerUtil.fatal("必选参数: 日期  为空");
			throw new IllegalArgumentException("必选参数: 日期  为空");
		}
		CcopHttpClient chc = new CcopHttpClient();
		DefaultHttpClient httpclient = null;
		try {
			httpclient = chc.registerSSL(SERVER_IP, "TLS", Integer.parseInt(SERVER_PORT), "https");
		} catch (Exception e1) {
			e1.printStackTrace();
			LoggerUtil.error(e1.getMessage());
			throw new RuntimeException("初始化httpclient异常" + e1.getMessage());
		}
		String result = "";
		try {
			HttpPost httppost = (HttpPost) getHttpRequestBase(1, BillRecords);
			String requsetbody = "";
			if (BODY_TYPE == BodyType.Type_JSON) {
				JsonObject json = new JsonObject();
				json.addProperty("appId", App_ID);
				json.addProperty("date", date);
				if (!(isEmpty(keywords)))
					json.addProperty("keywords", keywords);

				requsetbody = json.toString();
			} else {
				StringBuilder sb = new StringBuilder("<?xml version='1.0' encoding='utf-8'?><BillRecords>");
				sb.append("<appId>").append(App_ID).append("</appId>").append("<date>").append(date).append("</date>");
				if (!(isEmpty(keywords)))
					sb.append("<keywords>").append(keywords).append("</keywords>");

				sb.append("</BillRecords>").toString();
				requsetbody = sb.toString();
			}
			LoggerUtil.info("BillRecords Request body = : " + requsetbody);
			BasicHttpEntity requestBody = new BasicHttpEntity();
			requestBody.setContent(new ByteArrayInputStream(requsetbody.getBytes("UTF-8")));
			requestBody.setContentLength(requsetbody.getBytes("UTF-8").length);
			httppost.setEntity(requestBody);
			HttpResponse response = httpclient.execute(httppost);

			HttpEntity entity = response.getEntity();
			if (entity != null)
				result = EntityUtils.toString(entity, "UTF-8");

			EntityUtils.consume(entity);
		} catch (IOException e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172001", "网络错误");
		} catch (Exception e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172002", "无返回");
		} finally {
			if (httpclient != null)
				httpclient.getConnectionManager().shutdown();
		}
		LoggerUtil.info("billRecords response body = " + result);
		try {
			if (BODY_TYPE == BodyType.Type_JSON) {
				return jsonToMap(result);
			} else {
				return xmlToMap(result);
			}
		} catch (Exception e) {
			   
			return getMyError("172003", "返回包体错误");
		}
	}

	

	/**
	 * 发起IVR外呼请求
	 * 
	 * @param number
	 *            必选参数 待呼叫号码，为Dial节点的属性
	 * @param userdata
	 *            可选参数 用户数据，在<startservice>通知中返回，只允许填写数字字符，为Dial节点的属性
	 * @param record
	 *            可选参数 是否录音，可填项为true和false，默认值为false不录音，为Dial节点的属性
	 * @return
	 */
	public HashMap<String, Object> ivrDial(String number, String userdata, boolean record) {
		HashMap<String, Object> validate = accountValidate();
		if(validate!=null) 
			return validate;
		if (isEmpty(number)) {
			LoggerUtil.fatal("必选参数: 待呼叫号码   为空");
			throw new IllegalArgumentException("必选参数: 待呼叫号码   为空");
		}
		CcopHttpClient chc = new CcopHttpClient();
		DefaultHttpClient httpclient = null;
		try {
			httpclient = chc.registerSSL(SERVER_IP, "TLS", Integer.parseInt(SERVER_PORT), "https");
		} catch (Exception e1) {
			e1.printStackTrace();
			throw new RuntimeException("初始化httpclient异常" + e1.getMessage());
		}
		String result = "";
		try {
			HttpPost httppost = (HttpPost) getHttpRequestBase(1, IvrDial);
			String requsetbody = "";

			StringBuilder sb = new StringBuilder("<?xml version='1.0' encoding='utf-8'?><Request>");
			sb.append("<Appid>").append(App_ID).append("</Appid>").append("<Dial number=").append("\"").append(number).append("\"");
			if (record) {
				sb.append(" record=").append("\"").append(record).append("\"");
			}
			if (userdata != null) {
				sb.append(" userdata=").append("\"").append(userdata).append("\"");
			}
			sb.append("></Dial></Request>").toString();
			requsetbody = sb.toString();

			LoggerUtil.info("ivrDial Request body = : " + requsetbody);
			BasicHttpEntity requestBody = new BasicHttpEntity();
			requestBody.setContent(new ByteArrayInputStream(requsetbody.getBytes("UTF-8")));
			requestBody.setContentLength(requsetbody.getBytes("UTF-8").length);
			httppost.setEntity(requestBody);
			HttpResponse response = httpclient.execute(httppost);

			HttpEntity entity = response.getEntity();
			if (entity != null)
				result = EntityUtils.toString(entity, "UTF-8");

			EntityUtils.consume(entity);
		} catch (IOException e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172001", "网络错误");
		} catch (Exception e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172002", "无返回");
		} finally {
			if (httpclient != null)
				httpclient.getConnectionManager().shutdown();
		}
		LoggerUtil.info("ivrDial response body = " + result);
		try {
			return xmlToMap(result);
		} catch (Exception e) {
			return getMyError("172003", "返回包体错误");
		}
	}

	/**
	 * 发起语音验证码请求
	 * 
	 * @param verifyCode
	 *            必选参数 验证码内容，为数字和英文字母，不区分大小写，长度4-8位
	 * @param to
	 *            必选参数 接收号码
	 * @param displayNum
	 *            可选参数 显示主叫号码，显示权限由服务侧控制
	 * @param playTimes
	 *            可选参数 循环播放次数，1－3次，默认播放1次
	 * @param respUrl
	 *            可选参数 语音验证码状态通知回调地址，云通讯平台将向该Url地址发送呼叫结果通知
	 * @return
	 */
	public HashMap<String, Object> voiceVerify(String verifyCode, String to, String displayNum, String playTimes, String respUrl) {
		HashMap<String, Object> validate = accountValidate();
		if(validate!=null) 
			return validate;
		if ((isEmpty(verifyCode)) || (isEmpty(to)))
			throw new IllegalArgumentException("必选参数:" + (isEmpty(verifyCode) ? " 验证码内容 " : "") + (isEmpty(to) ? " 接收号码 " : "") + "为空");
		CcopHttpClient chc = new CcopHttpClient();
		DefaultHttpClient httpclient = null;
		try {
			httpclient = chc.registerSSL(SERVER_IP, "TLS", Integer.parseInt(SERVER_PORT), "https");
		} catch (Exception e1) {
			e1.printStackTrace();
			throw new RuntimeException("初始化httpclient异常" + e1.getMessage());
		}
		String result = "";
		try {
			HttpPost httppost = (HttpPost) getHttpRequestBase(1, VoiceVerify);
			String requsetbody = "";
			if (BODY_TYPE == BodyType.Type_JSON) {
				JsonObject json = new JsonObject();
				json.addProperty("appId", App_ID);
				json.addProperty("verifyCode", verifyCode);
				json.addProperty("to", to);
				if (!(isEmpty(displayNum)))
					json.addProperty("displayNum", displayNum);

				if (!(isEmpty(playTimes)))
					json.addProperty("playTimes", playTimes);

				if (!(isEmpty(respUrl)))
					json.addProperty("respUrl", respUrl);

				requsetbody = json.toString();
			} else {
				StringBuilder sb = new StringBuilder("<?xml version='1.0' encoding='utf-8'?><VoiceVerify>");
				sb.append("<appId>").append(App_ID).append("</appId>").append("<verifyCode>").append(verifyCode).append("</verifyCode>").append("<to>")
						.append(to).append("</to>");
				if (!(isEmpty(displayNum)))
					sb.append("<displayNum>").append(displayNum).append("</displayNum>");

				if (!(isEmpty(playTimes)))
					sb.append("<playTimes>").append(playTimes).append("</playTimes>");

				if (!(isEmpty(respUrl)))
					sb.append("<respUrl>").append(respUrl).append("</respUrl>");

				sb.append("</VoiceVerify>").toString();
				requsetbody = sb.toString();
			}

			LoggerUtil.info("voiceVerify Request body = : " + requsetbody);
			BasicHttpEntity requestBody = new BasicHttpEntity();
			requestBody.setContent(new ByteArrayInputStream(requsetbody.getBytes("UTF-8")));
			requestBody.setContentLength(requsetbody.getBytes("UTF-8").length);
			httppost.setEntity(requestBody);
			HttpResponse response = httpclient.execute(httppost);

			HttpEntity entity = response.getEntity();
			if (entity != null)
				result = EntityUtils.toString(entity, "UTF-8");

			EntityUtils.consume(entity);
		} catch (IOException e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172001", "网络错误");
		} catch (Exception e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172002", "无返回");
		} finally {
			if (httpclient != null)
				httpclient.getConnectionManager().shutdown();
		}

		LoggerUtil.info("voiceVerify response body = " + result);
		
		try {
			if (BODY_TYPE == BodyType.Type_JSON) {
				return jsonToMap(result);
			} else {
				return xmlToMap(result);
			}
		} catch (Exception e) {
			   
			return getMyError("172003", "返回包体错误");
		}
	}

	/**
	 * 发送营销外呼请求
	 * 
	 * @param to
	 *            必选参数 被叫号码
	 * @param mediaName
	 *            可选参数 语音文件名称，格式 wav。与mediaTxt不能同时为空，不为空时mediaTxt属性失效
	 * @param mediaTxt
	 *            可选参数 文本内容，默认值为空
	 * @param displayNum
	 *            可选参数 显示的主叫号码，显示权限由服务侧控制
	 * @param playTimes
	 *            可选参数 循环播放次数，1－3次，默认播放1次
	 * @param type
	 *            可选参数 : 如果传入type=1，则播放默认语音文件
	 * @param respUrl
	 *            可选参数 营销外呼状态通知回调地址，云通讯平台将向该Url地址发送呼叫结果通知
	 * @return
	 */
	public HashMap<String, Object> landingCall(String to, String mediaName, String mediaTxt, String displayNum, String playTimes, int type, String respUrl) {
		HashMap<String, Object> validate = accountValidate();
		if(validate!=null) 
			return validate;
		if (isEmpty(to))
			throw new IllegalArgumentException("必选参数:" + (isEmpty(to) ? " 被叫号码 " : "") + "为空");
		if ((isEmpty(mediaName)) && (isEmpty(mediaTxt)))
			throw new IllegalArgumentException("参数语音文件名称和参数语音文本内容不能同时为空");
		CcopHttpClient chc = new CcopHttpClient();
		DefaultHttpClient httpclient = null;
		try {
			httpclient = chc.registerSSL(SERVER_IP, "TLS", Integer.parseInt(SERVER_PORT), "https");
		} catch (Exception e1) {
			e1.printStackTrace();
			throw new RuntimeException("初始化httpclient异常" + e1.getMessage());
		}
		String result = "";
		try {
			HttpPost httppost = (HttpPost) getHttpRequestBase(1, LandingCalls);
			String requsetbody = "";
			if (BODY_TYPE == BodyType.Type_JSON) {
				JsonObject json = new JsonObject();
				json.addProperty("appId", App_ID);
				json.addProperty("to", to);

				if (!(isEmpty(mediaName)))
					json.addProperty("mediaName", mediaName);
				if (type == 1) {
					json.addProperty("mediaNameType", "1");
				}

				if (!(isEmpty(mediaTxt)))
					json.addProperty("mediaTxt", mediaTxt);

				if (!(isEmpty(displayNum)))
					json.addProperty("displayNum", displayNum);
				if (!(isEmpty(playTimes)))
					json.addProperty("playTimes", playTimes);

				if (!(isEmpty(respUrl)))
					json.addProperty("respUrl", respUrl);

				requsetbody = json.toString();
			} else {
				StringBuilder sb = new StringBuilder("<?xml version='1.0' encoding='utf-8'?><LandingCall>");
				sb.append("<appId>").append(App_ID).append("</appId>").append("<to>").append(to).append("</to>");
				if (!(isEmpty(mediaName)) && type == 1)
					sb.append("<mediaName type=\"1\">").append(mediaName).append("</mediaName>");
				else if (!(isEmpty(mediaName)))
					sb.append("<mediaName>").append(mediaName).append("</mediaName>");

				if (!(isEmpty(mediaTxt)))
					sb.append("<mediaTxt>").append(mediaTxt).append("</mediaTxt>");

				if (!(isEmpty(displayNum)))
					sb.append("<displayNum>").append(displayNum).append("</displayNum>");
				if (!(isEmpty(playTimes)))
					sb.append("<playTimes>").append(playTimes).append("</playTimes>");

				if (!(isEmpty(respUrl)))
					sb.append("<respUrl>").append(respUrl).append("</respUrl>");

				sb.append("</LandingCall>").toString();
				requsetbody = sb.toString();
			}
			LoggerUtil.info("landingCalls Request body = : " + requsetbody);
			BasicHttpEntity requestBody = new BasicHttpEntity();
			requestBody.setContent(new ByteArrayInputStream(requsetbody.getBytes("UTF-8")));
			requestBody.setContentLength(requsetbody.getBytes("UTF-8").length);
			httppost.setEntity(requestBody);
			HttpResponse response = httpclient.execute(httppost);

			HttpEntity entity = response.getEntity();
			if (entity != null)
				result = EntityUtils.toString(entity, "UTF-8");

			EntityUtils.consume(entity);
		} catch (IOException e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172001", "网络错误");
		} catch (Exception e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172002", "无返回");
		}  finally {
			if (httpclient != null)
				httpclient.getConnectionManager().shutdown();
		}

		LoggerUtil.info("landingCall response body = " + result);
		
		try {
			if (BODY_TYPE == BodyType.Type_JSON) {
				return jsonToMap(result);
			} else {
				return xmlToMap(result);
			}
		} catch (Exception e) {
			   
			return getMyError("172003", "返回包体错误");
		}
	}

	/**
	 * 发送双向回拨请求
	 * 
	 * @param from
	 *            必选参数 主叫电话号码
	 * @param to
	 *            必选参数 被叫电话号码
	 * @param customerSerNum
	 *            可选参数 被叫侧显示的客服号码，根据平台侧显号规则控制
	 * @param fromSerNum
	 *            可选参数 主叫侧显示的号码，根据平台侧显号规则控制
	 * @param promptTone
	 *            可选参数 第三方自定义回拨提示音
	 * @return
	 */
	public HashMap<String, Object> callback(String from, String to, String customerSerNum, String fromSerNum, String promptTone) {
		HashMap<String, Object> subAccountValidate = subAccountValidate();
		if(subAccountValidate!=null)
			return subAccountValidate;
		
		if ((isEmpty(from)) || (isEmpty(to))){
			LoggerUtil.fatal("必选参数:" + (isEmpty(from) ? " 主叫号码 " : "") + (isEmpty(to) ? " 被叫号码 " : "") + "为空");
			throw new IllegalArgumentException("必选参数:" + (isEmpty(from) ? " 主叫号码 " : "") + (isEmpty(to) ? " 被叫号码 " : "") + "为空");
		}
		CcopHttpClient chc = new CcopHttpClient();
		DefaultHttpClient httpclient = null;
		try {
			httpclient = chc.registerSSL(SERVER_IP, "TLS", Integer.parseInt(SERVER_PORT), "https");
		} catch (Exception e1) {
			e1.printStackTrace();
			throw new RuntimeException("初始化httpclient异常" + e1.getMessage());
		}
		String result = "";
		try {
			HttpPost httppost = (HttpPost) getHttpRequestBase(1, Call_back, AccountType.SubAccounts);
			String requsetbody = "";
			if (BODY_TYPE == BodyType.Type_JSON) {
				JsonObject json = new JsonObject();
				json.addProperty("from", from);
				json.addProperty("to", to);
				if (!(isEmpty(customerSerNum)))
					json.addProperty("customerSerNum", customerSerNum);

				if (!(isEmpty(fromSerNum)))
					json.addProperty("fromSerNum", fromSerNum);
				
				if (!(isEmpty(promptTone)))
					json.addProperty("promptTone", promptTone);

				requsetbody = json.toString();
			} else {
				StringBuilder sb = new StringBuilder("<?xml version='1.0' encoding='utf-8'?><CallBack>");
				sb.append("<from>").append(from).append("</from>").append("<to>").append(to).append("</to>");
				if (!(isEmpty(customerSerNum)))
					sb.append("<customerSerNum>").append(customerSerNum).append("</customerSerNum>");

				if (!(isEmpty(fromSerNum)))
					sb.append("<fromSerNum>").append(fromSerNum).append("</fromSerNum>");
				
				if (!(isEmpty(promptTone)))
					sb.append("<promptTone>").append(promptTone).append("</promptTone>");

				sb.append("</CallBack>").toString();
				requsetbody = sb.toString();
			}

			LoggerUtil.info("Callback Request body =  " + requsetbody);
			BasicHttpEntity requestBody = new BasicHttpEntity();
			requestBody.setContent(new ByteArrayInputStream(requsetbody.getBytes("UTF-8")));
			requestBody.setContentLength(requsetbody.getBytes("UTF-8").length);
			httppost.setEntity(requestBody);
			HttpResponse response = httpclient.execute(httppost);

			HttpEntity entity = response.getEntity();
			if (entity != null)
				result = EntityUtils.toString(entity, "UTF-8");

			EntityUtils.consume(entity);
		} catch (IOException e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172001", "网络错误");
		} catch (Exception e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172002", "无返回");
		}  finally {
			if (httpclient != null)
				httpclient.getConnectionManager().shutdown();
		}

		LoggerUtil.info("callback response body = " + result);
		
		try {
			if (BODY_TYPE == BodyType.Type_JSON) {
				return jsonToMap(result);
			} else {
				return xmlToMap(result);
			}
		} catch (Exception e) {
			   
			return getMyError("172003", "返回包体错误");
		}
	}


	/**
	 * 发送短信模板请求
	 * 
	 * @param to
	 *            必选参数 短信接收端手机号码集合，用英文逗号分开，每批发送的手机号数量不得超过100个
	 * @param templateId
	 *            必选参数 模板Id
	 * @param datas
	 *            可选参数 内容数据，用于替换模板中{序号}
	 * @return
	 */
	public HashMap<String, Object> sendTemplateSMS(String to, String templateId, String[] datas) {
		HashMap<String, Object> validate = accountValidate();
		if(validate!=null) 
			return validate;
		if ((isEmpty(to)) || (isEmpty(App_ID)) || (isEmpty(templateId)))
			throw new IllegalArgumentException("必选参数:" + (isEmpty(to) ? " 手机号码 " : "") + (isEmpty(templateId) ? " 模板Id " : "") + "为空");
		CcopHttpClient chc = new CcopHttpClient();
		DefaultHttpClient httpclient = null;
		try {
			httpclient = chc.registerSSL(SERVER_IP, "TLS", Integer.parseInt(SERVER_PORT), "https");
		} catch (Exception e1) {
			e1.printStackTrace();
			throw new RuntimeException("初始化httpclient异常" + e1.getMessage());
		}
		String result = "";
		try {
			HttpPost httppost = (HttpPost) getHttpRequestBase(1, TemplateSMS);
			String requsetbody = "";
			if (BODY_TYPE == BodyType.Type_JSON) {
				JsonObject json = new JsonObject();
				json.addProperty("appId", App_ID);
				json.addProperty("to", to);
				json.addProperty("templateId", templateId);
				if (datas != null) {
					StringBuilder sb = new StringBuilder("[");
					for (String s : datas) {
						sb.append("\"" + s + "\"" + ",");
					}
					sb.replace(sb.length() - 1, sb.length(), "]");
					JsonParser parser = new JsonParser();
					JsonArray Jarray = parser.parse(sb.toString()).getAsJsonArray();
					json.add("datas", Jarray);
				}
				requsetbody = json.toString();
			} else {
				StringBuilder sb = new StringBuilder("<?xml version='1.0' encoding='utf-8'?><TemplateSMS>");
				sb.append("<appId>").append(App_ID).append("</appId>").append("<to>").append(to).append("</to>").append("<templateId>").append(templateId)
						.append("</templateId>");
				if (datas != null) {
					sb.append("<datas>");
					for (String s : datas) {
						sb.append("<data>").append(s).append("</data>");
					}
					sb.append("</datas>");
				}
				sb.append("</TemplateSMS>").toString();
				requsetbody = sb.toString();
			}

			LoggerUtil.info("sendTemplateSMS Request body =  " + requsetbody);
			BasicHttpEntity requestBody = new BasicHttpEntity();
			requestBody.setContent(new ByteArrayInputStream(requsetbody.getBytes("UTF-8")));
			requestBody.setContentLength(requsetbody.getBytes("UTF-8").length);
			httppost.setEntity(requestBody);
			HttpResponse response = httpclient.execute(httppost);

			HttpEntity entity = response.getEntity();
			if (entity != null)
				result = EntityUtils.toString(entity, "UTF-8");

			EntityUtils.consume(entity);
		} catch (IOException e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172001", "网络错误");
		} catch (Exception e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172002", "无返回");
		}  finally {
			if (httpclient != null)
				httpclient.getConnectionManager().shutdown();
		}

		LoggerUtil.info("sendTemplateSMS response body = " + result);
		
		try {
			if (BODY_TYPE == BodyType.Type_JSON) {
				return jsonToMap(result);
			} else {
				return xmlToMap(result);
			}
		} catch (Exception e) {
			   
			return getMyError("172003", "返回包体错误");
		}
	}

	
	public HashMap<String, Object> sendSMS(String to, String body) {
		HashMap<String, Object> validate = accountValidate();
		if(validate!=null) 
			return validate;
		if ((isEmpty(to)) || (isEmpty(body))) {
			LoggerUtil.fatal("必选参数:" + (isEmpty(to) ? " 手机号码 " : "") + (isEmpty(body) ? " 短信正文 " : "") + "为空");
			throw new IllegalArgumentException("必选参数:" + (isEmpty(to) ? " 手机号码 " : "") + (isEmpty(body) ? " 短信正文 " : "") + "为空");
		}
		CcopHttpClient chc = new CcopHttpClient();
		DefaultHttpClient httpclient = null;
		try {
			httpclient = chc.registerSSL(SERVER_IP, "TLS", Integer.parseInt(SERVER_PORT), "https");
		} catch (Exception e1) {
			e1.printStackTrace();
			throw new RuntimeException("初始化httpclient异常" + e1.getMessage());
		}
		String result = "";
		try {
			HttpPost httppost = (HttpPost) getHttpRequestBase(1, SMSMessages);
			String requsetbody = "";
			if (BODY_TYPE == BodyType.Type_JSON) {
				JsonObject json = new JsonObject();
				json.addProperty("appId", App_ID);
				json.addProperty("to", to);
				json.addProperty("body", body);
				requsetbody = json.toString();
			} else {
				requsetbody = "<?xml version='1.0' encoding='utf-8'?><SMSMessage>" + "<appId>" + App_ID + "</appId>" + "<to>" + to + "</to>" + "<body>" + body
						+ "</body>" + "</SMSMessage>";
			}
			LoggerUtil.info("sendSMS Request body =  " + requsetbody);
			BasicHttpEntity requestBody = new BasicHttpEntity();
			requestBody.setContent(new ByteArrayInputStream(requsetbody.getBytes("UTF-8")));
			requestBody.setContentLength(requsetbody.getBytes("UTF-8").length);
			httppost.setEntity(requestBody);
			HttpResponse response = httpclient.execute(httppost);
			HttpEntity entity = response.getEntity();
			if (entity != null)
				result = EntityUtils.toString(entity, "UTF-8");

			EntityUtils.consume(entity);
		}catch (IOException e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172001", "网络错误");
		} catch (Exception e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172002", "无返回");
		} finally {
			if (httpclient != null)
				httpclient.getConnectionManager().shutdown();
		}

		LoggerUtil.info("sendSMS response body = " + result);
		
		try {
			if (BODY_TYPE == BodyType.Type_JSON) {
				return jsonToMap(result);
			} else {
				return xmlToMap(result);
			}
		} catch (Exception e) {
			   
			return getMyError("172003", "返回包体错误");
		}
	}
	//云通讯营销短息报备
	public HashMap<String, Object> createyxsmstemplate(String body,String sign) {
		HashMap<String, Object> validate = accountValidate();
		if(validate!=null) 
			return validate;
		if (isEmpty(body)) {
			LoggerUtil.fatal("必选参数:" + (isEmpty(sign) ? " 短信签名 " : "") + (isEmpty(body) ? " 短信正文 " : "") + "为空");
			throw new IllegalArgumentException("必选参数:" + (isEmpty(sign) ? " 短信签名 " : "") + (isEmpty(body) ? " 短信正文 " : "") + "为空");
		}
		CcopHttpClient chc = new CcopHttpClient();
		DefaultHttpClient httpclient = null;
		try {
			httpclient = chc.registerSSL(SERVER_IP, "TLS", Integer.parseInt(SERVER_PORT), "https");
		} catch (Exception e1) {
			e1.printStackTrace();
			throw new RuntimeException("初始化httpclient异常" + e1.getMessage());
		}
		String result = "";
		try {
			HttpPost httppost = (HttpPost) getHttpRequestBase(1, CreateSMSTemplate);
			String requsetbody = "";
			if (BODY_TYPE == BodyType.Type_JSON) {
				JsonObject json = new JsonObject();
				json.addProperty("appId","8a216da85607361a0156075237130034");
				json.addProperty("productType", "1");
				json.addProperty("addr", "http://cc.7moor.com/");
				json.addProperty("title", "容联七陌");
				json.addProperty("signature", sign );
				json.addProperty("templateContent", body);
				//回调地址
				json.addProperty("auditNotifyUrl", AppConfig.getInstance().getytxCallback()+"YTXYxSmsTemplateService");
				requsetbody = json.toString();
			} else {
				requsetbody = "<?xml version='1.0' encoding='utf-8'?><TemplateSMS>" + "<appId>" + App_ID + "</appId><productType>1</productType><addr>1</addr><title>1</title><signature>1</signature><templateContent>" + body
						+ "</templateContent><auditNotifyUrl>http://115.29.10.194:8888/YTXSmsTemplateService</auditNotifyUrl>"+ "</TemplateSMS>";
			}
			LoggerUtil.info("sendSMS Request body =  " + requsetbody);
			BasicHttpEntity requestBody = new BasicHttpEntity();
			requestBody.setContent(new ByteArrayInputStream(requsetbody.getBytes("UTF-8")));
			requestBody.setContentLength(requsetbody.getBytes("UTF-8").length);
			httppost.setEntity(requestBody);
			HttpResponse response = httpclient.execute(httppost);

			HttpEntity entity = response.getEntity();
			if (entity != null)
				result = EntityUtils.toString(entity, "UTF-8");

			EntityUtils.consume(entity);
		}catch (IOException e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172001", "网络错误");
		} catch (Exception e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172002", "无返回");
		} finally {
			if (httpclient != null)
				httpclient.getConnectionManager().shutdown();
		}

		LoggerUtil.info("sendSMS response body = " + result);
		
		try {
			if (BODY_TYPE == BodyType.Type_JSON) {
				return jsonToMap(result);
			} else {
				return xmlToMap(result);
			}
		} catch (Exception e) {
			   
			return getMyError("172003", "返回包体错误");
		}
	}
	//云通讯短信模板查询
	public HashMap<String, Object> querysmstemplate(String appId,String templateId){
		HashMap<String, Object> validate = accountValidate();
		if(validate!=null) 
			return validate;
		CcopHttpClient chc = new CcopHttpClient();
		DefaultHttpClient httpclient = null;
		try {
			httpclient = chc.registerSSL(SERVER_IP, "TLS", Integer.parseInt(SERVER_PORT), "https");
		} catch (Exception e1) {
			e1.printStackTrace();
			throw new RuntimeException("初始化httpclient异常" + e1.getMessage());
		}
		String result = "";
		try {
			HttpPost httppost = (HttpPost) getHttpRequestBase(1, QuerySMSTemplate);
			String requsetbody = "";
			if (BODY_TYPE == BodyType.Type_JSON) {
				JsonObject json = new JsonObject();
				json.addProperty("appId",appId);
				json.addProperty("templateId",templateId);
				requsetbody = json.toString();
			} else {
				requsetbody = "<?xml version='1.0' encoding='utf-8'?><Request>" + "<appId>" + appId + "</appId><templateId>"+templateId+"</templateId></Request>";
			}
			LoggerUtil.info("sendSMS Request body =  " + requsetbody);
			BasicHttpEntity requestBody = new BasicHttpEntity();
			requestBody.setContent(new ByteArrayInputStream(requsetbody.getBytes("UTF-8")));
			requestBody.setContentLength(requsetbody.getBytes("UTF-8").length);
			httppost.setEntity(requestBody);
			HttpResponse response = httpclient.execute(httppost);

			HttpEntity entity = response.getEntity();
			if (entity != null)
				result = EntityUtils.toString(entity, "UTF-8");

			EntityUtils.consume(entity);
		}catch (IOException e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172001", "网络错误");
		} catch (Exception e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172002", "无返回");
		} finally {
			if (httpclient != null)
				httpclient.getConnectionManager().shutdown();
		}

		LoggerUtil.info("sendSMS response body = " + result);
		
		try {
			if (BODY_TYPE == BodyType.Type_JSON) {
				return queryjsonToMap(result);
			} else {
				return xmlToMap(result);
			}
		} catch (Exception e) {
			   
			return getMyError("172003", "返回包体错误");
		}
	}
	//云通讯短信模板报备
	public HashMap<String, Object> createsmstemplate(String body,String sign) {
		HashMap<String, Object> validate = accountValidate();
		if(validate!=null) 
			return validate;
		if (isEmpty(body)) {
			LoggerUtil.fatal("必选参数:" + (isEmpty(sign) ? " 短信签名 " : "") + (isEmpty(body) ? " 短信正文 " : "") + "为空");
			throw new IllegalArgumentException("必选参数:" + (isEmpty(sign) ? " 短信签名 " : "") + (isEmpty(body) ? " 短信正文 " : "") + "为空");
		}
		CcopHttpClient chc = new CcopHttpClient();
		DefaultHttpClient httpclient = null;
		try {
			httpclient = chc.registerSSL(SERVER_IP, "TLS", Integer.parseInt(SERVER_PORT), "https");
		} catch (Exception e1) {
			e1.printStackTrace();
			throw new RuntimeException("初始化httpclient异常" + e1.getMessage());
		}
		String result = "";
		try {
			HttpPost httppost = (HttpPost) getHttpRequestBase(1, CreateSMSTemplate);
			String requsetbody = "";
			if (BODY_TYPE == BodyType.Type_JSON) {
				JsonObject json = new JsonObject();
				json.addProperty("appId","8a216da854ff8dcc0155054e58a5091a");
				json.addProperty("productType", "1");
				json.addProperty("addr", "http://cc.7moor.com/");
				json.addProperty("title", "容联七陌");
				json.addProperty("signature", sign );
				json.addProperty("templateContent", body);
				//回调地址
				json.addProperty("auditNotifyUrl", AppConfig.getInstance().getytxCallback()+"YTXSmsTemplateService");
				requsetbody = json.toString();
			} else {
				requsetbody = "<?xml version='1.0' encoding='utf-8'?><TemplateSMS>" + "<appId>" + App_ID + "</appId><productType>1</productType><addr>1</addr><title>1</title><signature>1</signature><templateContent>" + body
						+ "</templateContent><auditNotifyUrl>http://115.29.10.194:8888/YTXSmsTemplateService</auditNotifyUrl>"+ "</TemplateSMS>";
			}
			LoggerUtil.info("sendSMS Request body =  " + requsetbody);
			BasicHttpEntity requestBody = new BasicHttpEntity();
			requestBody.setContent(new ByteArrayInputStream(requsetbody.getBytes("UTF-8")));
			requestBody.setContentLength(requsetbody.getBytes("UTF-8").length);
			httppost.setEntity(requestBody);
			HttpResponse response = httpclient.execute(httppost);

			HttpEntity entity = response.getEntity();
			if (entity != null)
				result = EntityUtils.toString(entity, "UTF-8");

			EntityUtils.consume(entity);
		}catch (IOException e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172001", "网络错误");
		} catch (Exception e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172002", "无返回");
		} finally {
			if (httpclient != null)
				httpclient.getConnectionManager().shutdown();
		}

		LoggerUtil.info("sendSMS response body = " + result);
		
		try {
			if (BODY_TYPE == BodyType.Type_JSON) {
				return jsonToMap(result);
			} else {
				return xmlToMap(result);
			}
		} catch (Exception e) {
			   
			return getMyError("172003", "返回包体错误");
		}
	}
	
	 public String handlerYTXDeliverMessage(String str){
        try {
            str = URLDecoder.decode(str, "UTF-8");
            LoggerUtil.info("++++ ytx URLDecoder= "+ str);
            
            JSONReader reader =new JSONReader();
            Map<String, Object> map = xmlToMap(str);
            Map<String, Object> getmap = (Map<String, Object>) map.get("data");
                DBObject find = new BasicDBObject();
                find.put("smsChannel", "ytx");
                find.put("smsMessageSid", getmap.get("content"));
                DBObject sendDoc = MongoProvider.findOne("cc", "app_sms_send", find);
                if(sendDoc != null){
                    DBObject findAcc = new BasicDBObject();
                    findAcc.put("_id",sendDoc.get("account")+"_cc");

                    DBObject accDoc = MongoProvider.findOne("platform_account_product", findAcc);
                    if(accDoc != null){
                        DBObject findSms = new BasicDBObject();
                        findSms.put("smsMessageSid", getmap.get("content"));
                        findSms.put("num", getmap.get("fromNum"));
                        DBObject updateSms = new BasicDBObject();
                        if(getmap.get("status").equals("0")){
                            updateSms.put("$set", new BasicDBObject("by_errordescription", "送达手机").append("m7Status","deliver"));
                        }else{
                            updateSms.put("$set", new BasicDBObject("by_errordescription", "状态"+getmap.get("deliverCode")).append("m7Status","undeliver"));
                        }
                        MongoProvider.update(accDoc.get("dataDB").toString(), accDoc.get("account")+"_sms", findSms, updateSms);
                    }
                }
        } catch (Exception e) {
        	LoggerUtil.info("ytx handlerYTXDeliverMessage:"+e.toString());
        }
        return "ok";
    }
	 public  String handlerYTXYXDeliverMessage(String str){
	        try {
	            str = URLDecoder.decode(str, "UTF-8");
	            LoggerUtil.info("++++ ytxyx URLDecoder= "+ str);
	            JSONReader reader =new JSONReader();
	            Map<String, Object> map = xmlToMap(str);
	            Map<String, Object> getmap = (Map<String, Object>) map.get("data");
	                DBObject find = new BasicDBObject();
	                find.put("smsChannel", "ytxyx");
	                find.put("smsMessageSid", getmap.get("content"));
	                DBObject sendDoc = MongoProvider.findOne("cc", "app_sms_send", find);
	                if(sendDoc != null){
	                    DBObject findAcc = new BasicDBObject();
	                    findAcc.put("_id",sendDoc.get("account")+"_cc");

	                    DBObject accDoc = MongoProvider.findOne("platform_account_product", findAcc);
	                    if(accDoc != null){
	                        DBObject findSms = new BasicDBObject();
	                        findSms.put("smsMessageSid", getmap.get("content"));
	                        findSms.put("num", getmap.get("fromNum"));
	                        DBObject updateSms = new BasicDBObject();
	                        if(getmap.get("status").equals("0")){
	                            updateSms.put("$set", new BasicDBObject("by_errordescription", "送达手机").append("m7Status","deliver"));
	                        }else{
	                            updateSms.put("$set", new BasicDBObject("by_errordescription", "状态"+getmap.get("deliverCode")).append("m7Status","undeliver"));
	                        }
	                        MongoProvider.update(accDoc.get("dataDB").toString(), accDoc.get("account")+"_sms", findSms, updateSms);
	                    }
	                }
	        } catch (Exception e) {
	        	LoggerUtil.info("ytx handlerYTXYXDeliverMessage:"+e.toString());
	        }
	        return "ok";
	    }

	/**
	 * 获取子帐号信息
	 * 
	 * @param  appId
	 *            必选参数 应用Id
	 * @param friendlyName
	 *            必选参数 子帐号名称
	 * @return
	 */
	public HashMap<String, Object> querySubAccount(String friendlyName) {
		HashMap<String, Object> validate = accountValidate();
		if(validate!=null) 
			return validate;
		if ((isEmpty(friendlyName))) {
			LoggerUtil.fatal("必选参数: 子帐号名称 为空");
			throw new IllegalArgumentException("必选参数: 子帐号名称 为空");
		}
		CcopHttpClient chc = new CcopHttpClient();
		DefaultHttpClient httpclient = null;
		try {
			httpclient = chc.registerSSL(SERVER_IP, "TLS", Integer.parseInt(SERVER_PORT), "https");
		} catch (Exception e1) {
			e1.printStackTrace();
			throw new RuntimeException("初始化httpclient异常" + e1.getMessage());
		}
		String result = "";
		try {
			HttpPost httppost = (HttpPost) getHttpRequestBase(1, Query_SubAccountByName);
			String requsetbody = "";
			if (BODY_TYPE == BodyType.Type_JSON) {
				JsonObject json = new JsonObject();
				json.addProperty("appId", App_ID);
				json.addProperty("friendlyName", friendlyName);
				requsetbody = json.toString();
			} else {
				requsetbody = "<?xml version='1.0' encoding='utf-8'?><SubAccount>" + "<appId>" + App_ID + "</appId>" + "<friendlyName>" + friendlyName
						+ "</friendlyName>" + "</SubAccount>";
			}
			LoggerUtil.info("querySubAccountByName Request body =  " + requsetbody);
			BasicHttpEntity requestBody = new BasicHttpEntity();
			requestBody.setContent(new ByteArrayInputStream(requsetbody.getBytes("UTF-8")));
			requestBody.setContentLength(requsetbody.getBytes("UTF-8").length);
			httppost.setEntity(requestBody);
			HttpResponse response = httpclient.execute(httppost);

			HttpEntity entity = response.getEntity();
			if (entity != null)
				result = EntityUtils.toString(entity, "UTF-8");

			EntityUtils.consume(entity);
		} catch (IOException e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172001", "网络错误");
		} catch (Exception e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172002", "无返回");
		} finally {
			if (httpclient != null)
				httpclient.getConnectionManager().shutdown();
		}

		LoggerUtil.info("querySubAccount result " + result);
		
		try {
			if (BODY_TYPE == BodyType.Type_JSON) {
				return jsonToMap(result);
			} else {
				return xmlToMap(result);
			}
		} catch (Exception e) {
			   
			return getMyError("172003", "返回包体错误");
		}
		
	}

	/**
	 * 获取子帐号
	 * 
	 * @param startNo
	 *            可选参数 开始的序号，默认从0开始
	 * @param offset
	 *            可选参数 一次查询的最大条数，最小是1条，最大是100条
	 * @return
	 */
	public HashMap<String, Object> getSubAccounts(String startNo, String offset) {
		HashMap<String, Object> validate = accountValidate();
		if(validate!=null) 
			return validate;
		CcopHttpClient chc = new CcopHttpClient();
		DefaultHttpClient httpclient = null;
		try {
			httpclient = chc.registerSSL(SERVER_IP, "TLS", Integer.parseInt(SERVER_PORT), "https");
		} catch (Exception e1) {
			e1.printStackTrace();
			throw new RuntimeException("初始化httpclient异常" + e1.getMessage());
		}
		String result = "";
		try {
			HttpPost httppost = (HttpPost) getHttpRequestBase(1, Get_SubAccounts);
			String requsetbody = "";
			if (BODY_TYPE == BodyType.Type_JSON) {
				JsonObject json = new JsonObject();
				json.addProperty("appId", App_ID);
				if (!(isEmpty(startNo)))
					json.addProperty("startNo", startNo);
				if (!(isEmpty(offset)))
					json.addProperty("offset", offset);
				requsetbody = json.toString();
			} else {
				StringBuilder sb = new StringBuilder("<?xml version='1.0' encoding='utf-8'?><SubAccount>");
				sb.append("<appId>").append(App_ID).append("</appId>");
				if (!(isEmpty(startNo)))
					sb.append("<startNo>").append(startNo).append("</startNo>");
				if (!(isEmpty(offset)))
					sb.append("<offset>").append(offset).append("</offset>");
				sb.append("</SubAccount>").toString();
				requsetbody = sb.toString();
			}
			LoggerUtil.info("GetSubAccounts Request body =  " + requsetbody);
			BasicHttpEntity requestBody = new BasicHttpEntity();
			requestBody.setContent(new ByteArrayInputStream(requsetbody.getBytes("UTF-8")));
			requestBody.setContentLength(requsetbody.getBytes("UTF-8").length);
			httppost.setEntity(requestBody);
			HttpResponse response = httpclient.execute(httppost);

			HttpEntity entity = response.getEntity();
			if (entity != null)
				result = EntityUtils.toString(entity, "UTF-8");

			EntityUtils.consume(entity);
		} catch (IOException e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172001", "网络错误");
		} catch (Exception e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172002", "无返回");
		} finally {
			if (httpclient != null)
				httpclient.getConnectionManager().shutdown();
		}

		LoggerUtil.info("getSubAccounts result " + result);
		
		try {
			if (BODY_TYPE == BodyType.Type_JSON) {
				return jsonToMap(result);
			} else {
				return xmlToMap(result);
			}
		} catch (Exception e) {
			   
			return getMyError("172003", "返回包体错误");
		}
	}

	/**
	 * 获取主帐号信息查询
	 * 
	 * @return
	 */
	public HashMap<String, Object> queryAccountInfo() {
		if ((isEmpty(SERVER_IP))) {
			return getMyError("172004", "IP为空");
		}
		if ((isEmpty(SERVER_PORT))) {
			return getMyError("172005", "端口错误");
		}
		if ((isEmpty(ACCOUNT_SID))) {
			return getMyError("172006", "主帐号为空");
		}
		if ((isEmpty(ACCOUNT_TOKEN))) {
			return getMyError("172007", "主帐号令牌为空");
		}
		 
		
		CcopHttpClient chc = new CcopHttpClient();
		DefaultHttpClient httpclient = null;
		try {
			httpclient = chc.registerSSL(SERVER_IP, "TLS", Integer.parseInt(SERVER_PORT), "https");
		} catch (Exception e1) {
			e1.printStackTrace();
			LoggerUtil.fatal(e1.getMessage());
			throw new RuntimeException("初始化httpclient异常" + e1.getMessage());
		}
		String result = "";
		try {
			HttpGet httpGet = (HttpGet) getHttpRequestBase(0, Account_Info);
			HttpResponse response = httpclient.execute(httpGet);

			HttpEntity entity = response.getEntity();
			if (entity != null)
				result = EntityUtils.toString(entity, "UTF-8");

			EntityUtils.consume(entity);
		} catch (IOException e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172001", "网络错误");
		} catch (Exception e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172002", "无返回");
		} finally {
			if (httpclient != null)
				httpclient.getConnectionManager().shutdown();
		}
		LoggerUtil.info("queryAccountInfo response body = " + result);
		try {
			if (BODY_TYPE == BodyType.Type_JSON) {
				return jsonToMap(result);
			} else {
				return xmlToMap(result);
			}
		} catch (Exception e) {
			   
			return getMyError("172003", "返回包体错误");
		}
	}

	/**
	 * 创建子帐号
	 * 
	 * @param friendlyName
	 *            必选参数 子帐号名称。可由英文字母和阿拉伯数字组成子帐号唯一名称，推荐使用电子邮箱地址
	 * @return
	 */
	public HashMap<String, Object> createSubAccount(String friendlyName) {
		HashMap<String, Object> validate = accountValidate();
		if(validate!=null) 
			return validate;
		if (isEmpty(friendlyName)) {
			LoggerUtil.fatal("必选参数: 子帐号名称 为空");
			throw new IllegalArgumentException("必选参数: 子帐号名称 为空");
		}

		CcopHttpClient chc = new CcopHttpClient();
		DefaultHttpClient httpclient = null;
		try {
			httpclient = chc.registerSSL(SERVER_IP, "TLS", Integer.parseInt(SERVER_PORT), "https");
		} catch (Exception e1) {
			e1.printStackTrace();
			LoggerUtil.error(e1.getMessage());
			throw new RuntimeException("初始化httpclient异常" + e1.getMessage());
		}
		String result = "";
		try {
			HttpPost httppost = (HttpPost) getHttpRequestBase(1, Create_SubAccount);
			String requsetbody = "";

			if (BODY_TYPE == BodyType.Type_JSON) {
				JsonObject json = new JsonObject();
				json.addProperty("appId", App_ID);
				json.addProperty("friendlyName", friendlyName);
				requsetbody = json.toString();
			} else {
				requsetbody = "<?xml version='1.0' encoding='utf-8'?><SubAccount>" + "<appId>" + App_ID + "</appId>" + "<friendlyName>" + friendlyName
						+ "</friendlyName>" + "</SubAccount>";
			}
			LoggerUtil.info("CreateSubAccount Request body =  " + requsetbody);

			BasicHttpEntity requestBody = new BasicHttpEntity();
			requestBody.setContent(new ByteArrayInputStream(requsetbody.getBytes("UTF-8")));
			requestBody.setContentLength(requsetbody.getBytes("UTF-8").length);
			httppost.setEntity(requestBody);

			HttpResponse response = httpclient.execute(httppost);

			HttpEntity entity = response.getEntity();

			if (entity != null) {
				result = EntityUtils.toString(entity, "UTF-8");
			}

			EntityUtils.consume(entity);
		} catch (IOException e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172001", "网络错误");
		} catch (Exception e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
			return getMyError("172002", "无返回");
		} finally {
			if (httpclient != null)
				httpclient.getConnectionManager().shutdown();
		}
		LoggerUtil.info("createSubAccount response body = " + result);
		try {
			if (BODY_TYPE == BodyType.Type_JSON) {
				return jsonToMap(result);
			} else {
				return xmlToMap(result);
			}
		} catch (Exception e) {
			   
			return getMyError("172003", "返回包体错误");
		}
	}

	private HashMap<String, Object> jsonToMap(String result) {
		HashMap<String, Object> hashMap = new HashMap<String, Object>();
		JsonParser parser = new JsonParser();
		JsonObject asJsonObject = parser.parse(result).getAsJsonObject();
		Set<Entry<String, JsonElement>> entrySet = asJsonObject.entrySet();
		HashMap<String, Object> hashMap2 = new HashMap<String, Object>();

		for (Entry<String, JsonElement> m : entrySet) {
			if ("statusCode".equals(m.getKey()) || "statusMsg".equals(m.getKey()))
				hashMap.put(m.getKey(), m.getValue().getAsString());
			else if("templateId".equals(m.getKey())){
				hashMap.put(m.getKey(), m.getValue().getAsString());
			}else {
				if ("SubAccount".equals(m.getKey()) || "totalCount".equals(m.getKey())
						||"token".equals(m.getKey())||"downUrl".equals(m.getKey())) {
					if (!"SubAccount".equals(m.getKey()))
						hashMap2.put(m.getKey(), m.getValue().getAsString());
					else {
						try {
							if((m.getValue().toString().trim().length()<=2)&&!m.getValue().toString().contains("[")){
								hashMap2.put(m.getKey(), m.getValue().getAsString());
								hashMap.put("data", hashMap2);
								break;
							}
							if(m.getValue().toString().contains("[]")){
								hashMap2.put(m.getKey(), new JsonArray());
								hashMap.put("data", hashMap2);
								continue;
							}
							JsonArray asJsonArray = parser.parse(m.getValue().toString()).getAsJsonArray();
							ArrayList<HashMap<String, Object>> arrayList = new ArrayList<HashMap<String, Object>>();
							for (JsonElement j : asJsonArray) {
								Set<Entry<String, JsonElement>> entrySet2 = j.getAsJsonObject().entrySet();
								HashMap<String, Object> hashMap3 = new HashMap<String, Object>();
								for (Entry<String, JsonElement> m2 : entrySet2) {
									hashMap3.put(m2.getKey(), m2.getValue().getAsString());
								}
								arrayList.add(hashMap3);
							}
							hashMap2.put("SubAccount", arrayList);
						} catch (Exception e) {
							JsonObject asJsonObject2 = parser.parse(m.getValue().toString()).getAsJsonObject();
							Set<Entry<String, JsonElement>> entrySet2 = asJsonObject2.entrySet();
							HashMap<String, Object> hashMap3 = new HashMap<String, Object>();
							for (Entry<String, JsonElement> m2 : entrySet2) {
								hashMap3.put(m2.getKey(), m2.getValue().getAsString());
							}
							hashMap2.put(m.getKey(), hashMap3);
							hashMap.put("data", hashMap2);
						}

					}
					hashMap.put("data", hashMap2);
				} else {

					JsonObject asJsonObject2 = parser.parse(m.getValue().toString()).getAsJsonObject();
					Set<Entry<String, JsonElement>> entrySet2 = asJsonObject2.entrySet();
					HashMap<String, Object> hashMap3 = new HashMap<String, Object>();
					for (Entry<String, JsonElement> m2 : entrySet2) {
						hashMap3.put(m2.getKey(), m2.getValue().getAsString());
					}
					if (hashMap3.size() != 0) {
						hashMap2.put(m.getKey(), hashMap3);
					} else {
						hashMap2.put(m.getKey(), m.getValue().getAsString());
					}
					hashMap.put("data", hashMap2);
				}
			}
		}
		return hashMap;
	}
	//短信查询json转map
	private HashMap<String, Object> queryjsonToMap(String result) {
		HashMap<String, Object> hashMap = new HashMap<String, Object>();
		JsonParser parser = new JsonParser();
		JsonObject asJsonObject = parser.parse(result).getAsJsonObject();
		Set<Entry<String, JsonElement>> entrySet = asJsonObject.entrySet();
		HashMap<String, Object> hashMap2 = new HashMap<String, Object>();

		for (Entry<String, JsonElement> m : entrySet) {
			if ("statusCode".equals(m.getKey()) || "statusMsg".equals(m.getKey()))
				hashMap.put(m.getKey(), m.getValue().getAsString());
			else if("templateId".equals(m.getKey())){
				hashMap.put(m.getKey(), m.getValue().getAsString());
			}else {
				if ("SubAccount".equals(m.getKey()) || "totalCount".equals(m.getKey())
						||"token".equals(m.getKey())||"downUrl".equals(m.getKey())) {
					if (!"SubAccount".equals(m.getKey()))
						hashMap2.put(m.getKey(), m.getValue().getAsString());
					else {
						try {
							if((m.getValue().toString().trim().length()<=2)&&!m.getValue().toString().contains("[")){
								hashMap2.put(m.getKey(), m.getValue().getAsString());
								hashMap.put("data", hashMap2);
								break;
							}
							if(m.getValue().toString().contains("[]")){
								hashMap2.put(m.getKey(), new JsonArray());
								hashMap.put("data", hashMap2);
								continue;
							}
							JsonArray asJsonArray = parser.parse(m.getValue().toString()).getAsJsonArray();
							ArrayList<HashMap<String, Object>> arrayList = new ArrayList<HashMap<String, Object>>();
							for (JsonElement j : asJsonArray) {
								Set<Entry<String, JsonElement>> entrySet2 = j.getAsJsonObject().entrySet();
								HashMap<String, Object> hashMap3 = new HashMap<String, Object>();
								for (Entry<String, JsonElement> m2 : entrySet2) {
									hashMap3.put(m2.getKey(), m2.getValue().getAsString());
								}
								arrayList.add(hashMap3);
							}
							hashMap2.put("SubAccount", arrayList);
						} catch (Exception e) {
							JsonObject asJsonObject2 = parser.parse(m.getValue().toString()).getAsJsonObject();
							Set<Entry<String, JsonElement>> entrySet2 = asJsonObject2.entrySet();
							HashMap<String, Object> hashMap3 = new HashMap<String, Object>();
							for (Entry<String, JsonElement> m2 : entrySet2) {
								hashMap3.put(m2.getKey(), m2.getValue().getAsString());
							}
							hashMap2.put(m.getKey(), hashMap3);
							hashMap.put("data", hashMap2);
						}

					}
					hashMap.put("data", hashMap2);
				} else {

					JsonObject asJsonObject2 = parser.parse(m.getValue().toString().substring(1,m.getValue().toString().length()-1)).getAsJsonObject();
					Set<Entry<String, JsonElement>> entrySet2 = asJsonObject2.entrySet();
					HashMap<String, Object> hashMap3 = new HashMap<String, Object>();
					for (Entry<String, JsonElement> m2 : entrySet2) {
						hashMap3.put(m2.getKey(), m2.getValue().getAsString());
					}
					if (hashMap3.size() != 0) {
						hashMap2.put(m.getKey(), hashMap3);
					} else {
						hashMap2.put(m.getKey(), m.getValue().getAsString());
					}
					hashMap.put("data", hashMap2);
				}
			}
		}
		return hashMap;
	}
	/**
	 * @description 将xml字符串转换成map
	 * @param xml
	 * @return Map
	 */
	private HashMap<String, Object> xmlToMap(String xml) {
		HashMap<String, Object> map = new HashMap<String, Object>();
		Document doc = null;
		try {
			doc = DocumentHelper.parseText(xml); // 将字符串转为XML
			Element rootElt = doc.getRootElement(); // 获取根节点
			HashMap<String, Object> hashMap2 = new HashMap<String, Object>();
			for (Iterator i = rootElt.elementIterator(); i.hasNext();) {
				Element e = (Element) i.next();
				if ("statusCode".equals(e.getName()) || "statusMsg".equals(e.getName()))
					map.put(e.getName(), e.getText());
				else {
					if ("SubAccount".equals(e.getName()) || "totalCount".equals(e.getName())
							||"token".equals(e.getName())||"downUrl".equals(e.getName())) {
						if (!"SubAccount".equals(e.getName())) {
							hashMap2.put(e.getName(), e.getText());
						} else {
//							if(( e.getText().toString().trim().length()<=2)){
//								hashMap2.put(e.getName(),e.getText().toString());
//								map.put("data", hashMap2);
//								break;
//							}
							
							ArrayList<HashMap<String, Object>> arrayList = new ArrayList<HashMap<String, Object>>();

							HashMap<String, Object> hashMap3 = new HashMap<String, Object>();
							for (Iterator i2 = e.elementIterator(); i2.hasNext();) {
								Element e2 = (Element) i2.next();
								hashMap3.put(e2.getName(), e2.getText());
								arrayList.add(hashMap3);
							}
							hashMap2.put("SubAccount", arrayList);
						}
						map.put("data", hashMap2);
					} else {

						HashMap<String, Object> hashMap3 = new HashMap<String, Object>();
						for (Iterator i2 = e.elementIterator(); i2.hasNext();) {
							Element e2 = (Element) i2.next();
							// hashMap2.put(e2.getName(),e2.getText());
							hashMap3.put(e2.getName(), e2.getText());
						}
						if (hashMap3.size() != 0) {
							hashMap2.put(e.getName(), hashMap3);
						} else {
							hashMap2.put(e.getName(), e.getText());
						}
						map.put("data", hashMap2);
					}
				}
			}
		} catch (DocumentException e) {
			e.printStackTrace();
			LoggerUtil.error(e.getMessage());
		} catch (Exception e) {
			LoggerUtil.error(e.getMessage());
			e.printStackTrace();
		}
		return map;
	}

	private HttpRequestBase getHttpRequestBase(int get, String action) throws NoSuchAlgorithmException, UnsupportedEncodingException {
		return getHttpRequestBase(get, action, AccountType.Accounts);
	}

	private HttpRequestBase getHttpRequestBase(int get, String action, AccountType mAccountType) throws NoSuchAlgorithmException, UnsupportedEncodingException {
		String timestamp = DateUtil.dateToStr(new Date(), DateUtil.DATE_TIME_NO_SLASH);
		EncryptUtil eu = new EncryptUtil();
		String sig = "";
		String acountName = "";
		String acountType = "";
		if (mAccountType == AccountType.Accounts) {
			acountName = ACCOUNT_SID;
			sig = ACCOUNT_SID + ACCOUNT_TOKEN + timestamp;
			acountType = "Accounts";
		} else {
			acountName = SUBACCOUNT_SID;
			sig = SUBACCOUNT_SID + SUBACCOUNT_Token + timestamp;
			acountType = "SubAccounts";
		}
		String signature = eu.md5Digest(sig);

		String url = getBaseUrl().append("/" + acountType + "/").append(acountName).append("/" + action + "?sig=").append(signature).toString();
		LoggerUtil.info(getmethodName(action)+" url = " + url);
		HttpRequestBase mHttpRequestBase = null;
		if (get == Request_Get)
			mHttpRequestBase = new HttpGet(url);
		else if (get == Request_Post)
			mHttpRequestBase = new HttpPost(url);
		if (IvrDial.equals(action) || CommitDisplayNumbers.equals(action)) {
			setHttpHeaderXML(mHttpRequestBase);
		} else {
			setHttpHeader(mHttpRequestBase);
		}

		String src = acountName + ":" + timestamp;

		String auth = eu.base64Encoder(src);
		mHttpRequestBase.setHeader("Authorization", auth);
		return mHttpRequestBase;
	}

	

	private String getmethodName(String action) {
		 if(action.equals(Account_Info)){
			 return "queryAccountInfo";
		 }else if(action.equals(Create_SubAccount)){
			 return "createSubAccount";
		 }else if(action.equals(Get_SubAccounts)){
			 return "getSubAccounts";
		 }else if(action.equals(Query_SubAccountByName)){
			 return "querySubAccount";
		 }else if(action.equals(SMSMessages)){
			 return "sendSMS";
		 }else if(action.equals(TemplateSMS)){
			 return "sendTemplateSMS";
		 }else if(action.equals(Call_back)){
			 return "callback";
		 }else if(action.equals(LandingCalls)){
			 return "landingCalls";
		 }else if(action.equals(VoiceVerify)){
			 return "voiceVerify";
		 }else if(action.equals(IvrDial)){
			 return "ivrDial";
		 }else if(action.equals(BillRecords)){
			 return "billRecords";
		 }else{
			 return ""; 
		 }
	}
	private void setHttpHeaderXML(AbstractHttpMessage httpMessage) {
		httpMessage.setHeader("Accept", "application/xml");
		httpMessage.setHeader("Content-Type", "application/xml;charset=utf-8");
	}

	private void setHttpHeader(AbstractHttpMessage httpMessage) {
		if (BODY_TYPE == BodyType.Type_JSON) {
			httpMessage.setHeader("Accept", "application/json");
			httpMessage.setHeader("Content-Type", "application/json;charset=utf-8");
		} else {
			httpMessage.setHeader("Accept", "application/xml");
			httpMessage.setHeader("Content-Type", "application/xml;charset=utf-8");
		}
	}

	private StringBuffer getBaseUrl() {
		StringBuffer sb = new StringBuffer("https://");
		sb.append(SERVER_IP).append(":").append(SERVER_PORT);
		sb.append("/2013-12-26");
		return sb;
	}

	private boolean isEmpty(String str) {
		return (("".equals(str)) || (str == null));
	}

	private HashMap<String, Object> getMyError(String code, String msg) {
		HashMap<String, Object> hashMap = new HashMap<String, Object>();
		hashMap.put("statusCode", code);
		hashMap.put("statusMsg", msg);
		return hashMap;
	}
	private HashMap<String, Object> subAccountValidate() {
		if ((isEmpty(SERVER_IP))) {
			return getMyError("172004", "IP为空");
		}
		if ((isEmpty(SERVER_PORT))) {
			return getMyError("172005", "端口错误");
		}
		if (isEmpty(SUBACCOUNT_SID))
			return getMyError("172008", "子帐号空");
		if (isEmpty(SUBACCOUNT_Token))
			return getMyError("172009", "子帐号令牌空");
		return null;
	}
	private HashMap<String,Object> accountValidate() {
		if ((isEmpty(SERVER_IP))) {
			return getMyError("172004", "IP为空");
		}
		if ((isEmpty(SERVER_PORT))) {
			return getMyError("172005", "端口错误");
		}
		if ((isEmpty(ACCOUNT_SID))) {
			return getMyError("172006", "主帐号为空");
		}
		if ((isEmpty(ACCOUNT_TOKEN))) {
			return getMyError("172007", "主帐号令牌为空");
		}
		if ((isEmpty(App_ID))) {
			return getMyError("172012", "应用ID为空");
		}
		return null;
	}
	private void setBodyType(BodyType bodyType) {
		BODY_TYPE = bodyType;
	}

    public HashMap<String, Object> commitDisplayNumbers(List<String> numbers) {
        HashMap<String, Object> validate = accountValidate();
        if(validate!=null)
            return validate;
        CcopHttpClient chc = new CcopHttpClient();
        DefaultHttpClient httpclient = null;
        try {
            httpclient = chc.registerSSL(SERVER_IP, "TLS", Integer.parseInt(SERVER_PORT), "https");
        } catch (Exception e1) {
            e1.printStackTrace();
            throw new RuntimeException("初始化httpclient异常" + e1.getMessage());
        }
        String result = "";
        try {
            HttpPost httppost = (HttpPost) getHttpRequestBase(1, CommitDisplayNumbers);
            String requsetbody = "";
            BODY_TYPE = BodyType.Type_XML;
            if (BODY_TYPE == BodyType.Type_JSON) {
                JsonObject json = new JsonObject();
                json.addProperty("appId", App_ID);
                json.addProperty("count", numbers.size());
                json.addProperty("numbers", numbers.toString());
                requsetbody = json.toString();
            } else {
                int count = numbers.size();
                String body = "";
                for(int i=0 ;i<numbers.size();i++){
                    body+= "<number>"+ numbers.get(i) +"</number>";
                }
                requsetbody = "<?xml version='1.0' encoding='utf-8'?>" +
                        "<CommitDisplay>"
                        + "<appId>" + App_ID + "</appId>"
                        + "<count>" + count + "</count>"
                        + "<numbers>" + body
                        + "</numbers>"
                        + "</CommitDisplay>";
            }
            System.out.println(requsetbody);
            LoggerUtil.info("CommitDisplay Request body =  " + requsetbody);
            BasicHttpEntity requestBody = new BasicHttpEntity();
            requestBody.setContent(new ByteArrayInputStream(requsetbody.getBytes("UTF-8")));
            requestBody.setContentLength(requsetbody.getBytes("UTF-8").length);
            httppost.setEntity(requestBody);
            HttpResponse response = httpclient.execute(httppost);

            HttpEntity entity = response.getEntity();
            if (entity != null)
                result = EntityUtils.toString(entity, "UTF-8");

            EntityUtils.consume(entity);
        }catch (IOException e) {
            e.printStackTrace();
            LoggerUtil.error(e.getMessage());
            return getMyError("172001", "网络错误");
        } catch (Exception e) {
            e.printStackTrace();
            LoggerUtil.error(e.getMessage());
            return getMyError("172002", "无返回");
        } finally {
            if (httpclient != null)
                httpclient.getConnectionManager().shutdown();
        }

        LoggerUtil.info("CommitDisplay response body = " + result);

        try {
            if (BODY_TYPE == BodyType.Type_JSON) {
                return jsonToMap(result);
            } else {
                return xmlToMap(result);
            }
        } catch (Exception e) {

            return getMyError("172003", "返回包体错误");
        }
    }
}