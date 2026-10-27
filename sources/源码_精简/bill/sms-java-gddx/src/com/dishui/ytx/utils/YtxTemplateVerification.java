package com.dishui.ytx.utils;

import java.net.URLDecoder;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.json.JSONArray;
import org.json.JSONObject;

import com.dishui.bill.command.C5Action;
import com.dishui.bill.command.C5Response;
import com.dishui.bill.command.JSONReader;
import com.dishui.db.mango.MongoProvider;
import com.dishui.ytx.CCPRestSDK;
import com.dishui.ytx.SingleCCPRestSDK;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class YtxTemplateVerification {
	 private static final Logger log = Logger.getLogger(YtxTemplateVerification.class.getName());
	 public static C5Response templateverification(C5Action action){
		 
	        C5Response response = new C5Response(action);
	        try{
	        	String templatebody = action.getStringValue("content");
	        	String templateid = action.getStringValue("_id");
	        	String account = action.getStringValue("account");
	        	String name = action.getStringValue("name");
	        	String sign = action.getStringValue("sign");
	        	String smsChannel = action.getStringValue("smsChannel");
	        	String[] smsChannels = smsChannel.split(",");
	        	int vars = action.getIntValue("vars");
	        	String num = action.getStringValue("num");
				CCPRestSDK ccpsdk = SingleCCPRestSDK.getInstance();
				String ip = "app.cloopen.com";
			    String port = "8883";
			    String acc = "aaf98f894ecd7d6a014ed906116b12bc";
			    String accAuth = "be7d06a2c2314ec9bae18c9655b9798d";
			    
			    ccpsdk.init(ip, port);
			    ccpsdk.setAccount(acc, accAuth);
			    DBObject cursign = MongoProvider.findOne("cc","app_sms_sign", new BasicDBObject("_id",sign));
			    String templatesign = cursign.get("name").toString();
			    templatesign = templatesign.substring(1,templatesign.length()-1);
			    //备案透传号码APPId
			    HashMap<String, Object> mapinfo = null;
			    if(smsChannels[0].equals("ytx")){
			    	String ytxappId = "8a216da854ff8dcc0155054e58a5091a";
			    	ccpsdk.setAppId(ytxappId);
			    	mapinfo = ccpsdk.createsmstemplate(templatebody,templatesign);
			    }else if(smsChannels[0].equals("ytxyx")){
			    	String ytxyxappId = "8a216da85607361a0156075237130034";
			    	ccpsdk.setAppId(ytxyxappId);
			    	mapinfo = ccpsdk.createyxsmstemplate(templatebody,templatesign);
			    }
			    String[] ytxsmsChannel = {smsChannels[0]};
				if(mapinfo.get("statusCode").equals("000000")){
					DBObject doc =  new BasicDBObject();
					doc.put("_id", templateid);
					doc.put("ytxtemplateid", mapinfo.get("templateId"));
					doc.put("account", account);
					doc.put("name", name);
					doc.put("sign", sign);
					doc.put("smsChannel",ytxsmsChannel);
					doc.put("vars", vars);
					doc.put("num", num);
					doc.put("templatebody", templatebody);
					doc.put("templatesign", templatesign);
					doc.put("ytxverification", 2);
					doc.put("ytxverificationinfo", "待审核");
					MongoProvider.upsert("ytx_template_id",new BasicDBObject("_id", templateid),new BasicDBObject("$set", doc));
					response.setSucceed(true);
				}else{
					response.setSucceed(false);
					response.addParameter("msg", mapinfo.get("statusMsg"));
				}
				
	        } catch (Exception e){
	            e.printStackTrace();
	            log.log(Level.WARNING, "ytx YtxTemplateVerification", e);
	            response.setSucceed(false);
	            response.addParameter("result", "500");
	            response.setMessage(e.getMessage());
	        }
	        return response;
	    }
	 public static String handlerytxTemplateVerification(String str){
	        try {
	            str = URLDecoder.decode(str, "UTF-8");
	            log.info("++++ ytxdx URLDecoder= "+ str);
	            JSONReader reader =new JSONReader();
	            Map<String, Object> map = (Map<String, Object>)reader.read(str);
	            DBObject doc = new BasicDBObject();
				doc.put("ytxverification", Integer.valueOf(map.get("status").toString()));
				DBObject find = new BasicDBObject();
				find.put("ytxtemplateid", map.get("templateId").toString());
				String[] smsChannel = {"ytx"};
				find.put("smsChannel", smsChannel);
				if(map.get("status").toString().equals("1")){
					DBObject ytxok= MongoProvider.findOne("ytx_template_id",find);
					DBObject insert = new BasicDBObject();
					insert.put("_id", ytxok.get("_id"));
					insert.put("account", ytxok.get("account"));
					insert.put("content", ytxok.get("templatebody"));
					insert.put("name", ytxok.get("name"));
					insert.put("sign", ytxok.get("sign"));
					insert.put("smsChannel",ytxok.get("smsChannel"));
					insert.put("vars", ytxok.get("vars"));
					insert.put("num", ytxok.get("num"));
					Date date=new Date();
	                DateFormat format=new SimpleDateFormat("yyyy-MM-ddHH:mm:ss");
	                String time=format.format(date);
					insert.put("createTime", time);
					MongoProvider.upsert("cc","app_sms_template",new BasicDBObject("_id", ytxok.get("_id")),new BasicDBObject("$set",insert));
				}
				doc.put("ytxverificationinfo",map.get("msg").toString());
				MongoProvider.update("ytx_template_id",find,new BasicDBObject("$set",doc));
	        } catch (Exception e) {
	            log.log(Level.WARNING, "ytx YtxTemplateVerification:", e);
	        }
	        return "ok";
	    }
	 public static String handlerytxyxTemplateVerification(String str){
	        try {
	            str = URLDecoder.decode(str, "UTF-8");
	            log.info("++++ ytxyxdx URLDecoder= "+ str);
	            JSONReader reader =new JSONReader();
	            Map<String, Object> map = (Map<String, Object>)reader.read(str);
	            DBObject doc = new BasicDBObject();
				doc.put("ytxverification", Integer.valueOf(map.get("status").toString()));
				DBObject find = new BasicDBObject();
				find.put("ytxtemplateid", map.get("templateId").toString());
				String[] smsChannel = {"ytxyx"};
				find.put("smsChannel", smsChannel);
				if(map.get("status").toString().equals("1")){
					DBObject ytxok= MongoProvider.findOne("ytx_template_id",find);
						DBObject insert = new BasicDBObject();
						insert.put("_id", ytxok.get("_id"));
						insert.put("account", ytxok.get("account"));
						insert.put("content", ytxok.get("templatebody"));
						insert.put("name", ytxok.get("name"));
						insert.put("sign", ytxok.get("sign"));
						insert.put("smsChannel",ytxok.get("smsChannel"));
						insert.put("vars", ytxok.get("vars"));
						insert.put("num", ytxok.get("num"));
						MongoProvider.upsert("cc","app_sms_template",new BasicDBObject("_id", ytxok.get("_id")),new BasicDBObject("$set",insert));
				}
				doc.put("ytxverificationinfo",map.get("msg").toString());
				MongoProvider.update("ytx_template_id",find,new BasicDBObject("$set",doc));
	        } catch (Exception e) {
	            log.log(Level.WARNING, "ytx YtxTemplateVerification:", e);
	        }
	        return "ok";
	    }
	 public static C5Response handlerytxTemplateSelect(C5Action action){
		  C5Response response = new C5Response(action);
		 String appid = "";
		 String templateid = "";
		try {
			templateid = action.getStringValue("templateid");
			appid = action.getStringValue("appid");
		} catch (Exception e) {
			e.printStackTrace();
            log.log(Level.WARNING, "ytx YtxTemplateQuery", e);
            response.setSucceed(false);
            response.addParameter("result", "500");
            response.setMessage(e.getMessage());
		}
		 CCPRestSDK ccpsdk = SingleCCPRestSDK.getInstance();
			String ip = "app.cloopen.com";
		    String port = "8883";
		    String acc = "aaf98f894ecd7d6a014ed906116b12bc";
		    String accAuth = "be7d06a2c2314ec9bae18c9655b9798d";
		    
		    ccpsdk.init(ip, port);
		    ccpsdk.setAccount(acc, accAuth);
		    ccpsdk.setAppId(appid);
		    HashMap<String, Object> result = ccpsdk.querysmstemplate(appid,templateid);
		    if(result.get("statusCode").equals("000000")){
		    	  HashMap<String, Object> datamap = (HashMap<String, Object>) result.get("data");
		    	  HashMap<String, String> templmap=  (HashMap<String, String>) datamap.get("TemplateSMS");
		    	if(templmap.get("status").equals("0")){
		    		response.setSucceed(true);
		            response.addParameter("result", "0");//待审核，稍后
		    	}else if(templmap.get("status").equals("1")||templmap.get("status").equals("2")){
		    		
		    		DBObject find = new BasicDBObject();
		    		find.put("ytxtemplateid", templmap.get("id").toString());
					String[] smsChannel = new String[1];
					if(appid.equals("8a216da854ff8dcc0155054e58a5091a")){
						smsChannel[0] = "ytx";
					}else if(appid.equals("8a216da85607361a0156075237130034")){
						smsChannel[0] = "ytxyx";
					}
					find.put("smsChannel", smsChannel);
		    		DBObject ytxok = MongoProvider.findOne("ytx_template_id",find);
		    		DBObject ytxtempl = MongoProvider.findOne("cc","app_sms_template",new BasicDBObject("_id", ytxok.get("_id")));
		    		if(ytxtempl != null){
		    			DBObject insert = new BasicDBObject();
			    		insert.put("_id", ytxok.get("_id"));
			    		insert.put("account", ytxok.get("account"));
			    		insert.put("content", ytxok.get("templatebody"));
			    		insert.put("name", ytxok.get("name"));
			    		insert.put("sign", ytxok.get("sign"));
			    		insert.put("smsChannel",ytxok.get("smsChannel"));
			    		insert.put("vars", ytxok.get("vars"));
			    		insert.put("num", ytxok.get("num"));
			    		MongoProvider.upsert("cc","app_sms_template",new BasicDBObject("_id", ytxok.get("_id")),new BasicDBObject("$set",insert));
			    		
			    		DBObject doc = new BasicDBObject();
			    		
			    		doc.put("ytxverification", Integer.valueOf(templmap.get("status").toString()));
			    		if(templmap.get("status").toString().equals("1")){
			    			doc.put("ytxverificationinfo","模板审核成功");
			    		}else{
			    			doc.put("ytxverificationinfo","模板审核失败");
			    		}
			    		MongoProvider.update("ytx_template_id",find,new BasicDBObject("$set",doc));
		    		}else{
			    		DBObject insert = new BasicDBObject();
			    		insert.put("_id", ytxok.get("_id"));
			    		insert.put("account", ytxok.get("account"));
			    		insert.put("content", ytxok.get("templatebody"));
			    		insert.put("name", ytxok.get("name"));
			    		insert.put("sign", ytxok.get("sign"));
			    		insert.put("smsChannel",ytxok.get("smsChannel"));
			    		insert.put("vars", ytxok.get("vars"));
			    		insert.put("num", ytxok.get("num"));
			    		Date date=new Date();
			    		DateFormat format=new SimpleDateFormat("yyyy-MM-ddHH:mm:ss");
			    		String time=format.format(date);
			    		insert.put("createTime", time);
			    		MongoProvider.upsert("cc","app_sms_template",new BasicDBObject("_id", ytxok.get("_id")),new BasicDBObject("$set",insert));
			    		
			    		DBObject doc = new BasicDBObject();
			    		
			    		doc.put("ytxverification", Integer.valueOf(templmap.get("status").toString()));
			    		if(templmap.get("status").toString().equals("1")){
			    			doc.put("ytxverificationinfo","模板审核成功");
			    		}else{
			    			doc.put("ytxverificationinfo","模板审核失败");
			    		}
			    		MongoProvider.update("ytx_template_id",find,new BasicDBObject("$set",doc));
			    	}
					response.setSucceed(true);
		            response.addParameter("result", templmap.get("status").toString());
		    	}else if(templmap.get("status").equals("-1")){
		    		response.setSucceed(true);
		            response.addParameter("result", "-1");//模板已删除
		    	}else{
		    		response.setSucceed(true);
		            response.addParameter("result", "3");//该状态无法识别
		    	}
		    }else{
		    	response.setSucceed(true);
	            response.addParameter("result", "404");//未找到该模板
		    }
			return response;
	 }
}
