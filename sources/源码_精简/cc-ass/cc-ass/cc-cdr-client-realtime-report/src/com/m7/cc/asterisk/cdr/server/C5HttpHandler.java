package com.m7.cc.asterisk.cdr.server;

import java.io.IOException;
import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.cc.net.httpserver.Headers;
import com.cc.net.httpserver.HttpExchange;
import com.cc.net.httpserver.HttpHandler;
import com.m7.cc.command.C5Action;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.C5Response;
import com.m7.cc.command.Fields;
import com.m7.cc.db.mongo.MongoConnect;
import com.m7.cc.db.mongo.MongoProvider;
import com.m7.cc.json.JSONReader;
import com.m7.cc.util.Utils;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;
import com.mongodb.WriteConcern;
import com.mongodb.WriteResult;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCursor;

/**
 * This class will handle HTTP request from CDR request
 * 
 * @author yangwl
 * 
 */
public class C5HttpHandler implements HttpHandler {
	public final Hashtable<String, String> MIME_TYPES = new Hashtable<String, String>();
	private static final Logger log = Logger.getLogger(C5HttpHandler.class
			.getName());
	private CDREventProcessor processor = null;
	private Map<String, CDREventProcessor> processors = new HashMap<String, CDREventProcessor>();

	public C5HttpHandler() {
		String image = "image/";
		MIME_TYPES.put(".gif", image + "gif");
		MIME_TYPES.put(".jpg", image + "jpeg");
		MIME_TYPES.put(".jpeg", image + "jpeg");
		MIME_TYPES.put(".png", image + "png");
		String text = "text/";
		MIME_TYPES.put(".html", text + "html");
		MIME_TYPES.put(".htm", text + "html");
		MIME_TYPES.put(".txt", text + "plain");
	}

	public void handle(HttpExchange exchange) throws IOException {
		String requestMethod = exchange.getRequestMethod();
		try {
			if (requestMethod.equalsIgnoreCase("GET")) {
				processGet(exchange);
			} else if (requestMethod.equalsIgnoreCase("POST")) {
				processPost(exchange);
			}
		} catch (Exception e) {
			sendOK("500", exchange);
		}
	}

	/**
	 * C5 Action will be transported via POST request. We parse it in this
	 * method and then send it to c5session for handling.
	 * 
	 * @param exchange
	 * @throws IOException
	 */
	private void processPost(HttpExchange exchange) throws Exception {
		String content_length = exchange.getRequestHeaders()
				.get("Content-length").get(0);
		int length = Integer.valueOf(content_length);
		byte[] data = new byte[1024];
		int count = 0;
		StringBuffer buffer = new StringBuffer();
		while ((count = exchange.getRequestBody().read(data)) != -1) {
			buffer.append(new String(data, 0, count, "UTF-8"));
			length -= count;
		}
		if (length != 0) {
			log.warning("Imcompleted POST data! [" + buffer.toString() + "]");
			sendOK("204", exchange);
			return;
		}
		processString(buffer.toString(), exchange);
	}

	private void processString(String strData, HttpExchange exchange)
			throws Exception {
		String path = exchange.getRequestURI().getPath();
		if(path.endsWith("cdr")) {
			
			try {
				strData = URLDecoder.decode(strData, "UTF-8");
				String[] a = strData.split("<>");
				log.warning("getcdrs count: "+a.length);
				if(a.length < 40) {
					log.warning("getcdrs limit 40 count: we sleep 500ms");
					Thread.sleep(500);
				}
				for(int i=0;i<a.length;i++) {
					JSONReader jsonReader = new JSONReader();
					HashMap<String, Object> map = (HashMap<String, Object>) jsonReader.read(a[i]);
					String pbx = map.get(Fields.PBX).toString();
					if (!map.containsKey(Fields.Event) || pbx == null){
						log.log(Level.WARNING, "Error action: "+map);
						continue;
					}
					
					C5Event event = new C5Event(map.get(Fields.Event).toString());
					event.getParameters().putAll(map);
					pbx = pbx.substring(0, pbx.lastIndexOf("."));
					synchronized (processors) {
						if (!processors.containsKey(pbx)){
							processors.put(pbx, new CDREventProcessor(pbx, CdrServer
									.getInstance().getCDRHandler()));
						}
						processor = processors.get(pbx);
					}
					processor.processEvent(event);
				}
				sendOK("200", exchange);
			} catch (Exception e1) {
				log.log(Level.WARNING, "Error action: "+strData, e1);
				sendOK("200", exchange);
				return;
			}
			
		} else {
			HashMap<String, Object> map = null;
			try {
				strData = URLDecoder.decode(strData, "UTF-8");
				JSONReader jsonReader = new JSONReader();
				map = (HashMap<String, Object>) jsonReader.read(strData);
			} catch (Exception e1) {
				log.log(Level.WARNING, "Error action: "+strData, e1);
				sendOK("200", exchange);
				return;
			}
			processData(map, exchange);
		}
		
	}

	private void processData(HashMap<String, Object> map, HttpExchange exchange)
			throws Exception {
		if (map.size() < 2) {
			log.log(Level.WARNING, "Empty action: "+map);
			sendOK("200", exchange);
			return;
		}
		if(map.get(Fields.Command).equals("Action")) {
			C5Action action = new C5Action((String)map.get(Fields.Action), (String)map.get(Fields.ActionID));
			action.setValues(map);
			processAction(action, exchange);
		} else {
			sendOK("404", exchange);
		}
	}
	
	private void processAction(C5Action action, HttpExchange exchange) throws Exception {
		if(action.getActionName().equals("GetAutoDialList")) {
			String account = action.getStringValue("account");
			String tableName = "app_autocall_new";
			String freeTableName = "app_autocall_import";
			String taskTableName = "app_autocall_task";
			String numType = action.getStringValue("numType");
			
			BasicDBObject keys = new BasicDBObject();
			keys.put("num", 1);
			keys.put("_id", 1);
			keys.put("current", 1);
			keys.put("batchNo", 1);
			
			StringBuffer sb = new StringBuffer();
			List<String> numList = new ArrayList<String>();
			long calledCount = 0;
			BasicDBObject newNo = new BasicDBObject();
			newNo.put("account", account);
			newNo.put("beginTime", Utils.getDate("yyyy-MM-dd HH:mm:ss"));
			newNo.put("beginTimestamp", Utils.getCurrentTimestamp());
			newNo.put("duration", 0);
			newNo.put("endTime", Utils.getDate("yyyy-MM-dd HH:mm:ss"));
			newNo.put("endTimestamp", Utils.getCurrentTimestamp());
			newNo.put("reason", "none");
			newNo.put("taskName", action.getStringValue("taskName"));
			newNo.put("taskId", action.getStringValue("taskId"));
			if(numType.equals("import")){
				BasicDBObject ref = new BasicDBObject();
//				ref.put("account", account);
				ref.put("taskId", action.getStringValue("taskId"));
				FindIterable<BasicDBObject> iterable = MongoProvider.getInstance().getConection("cc_autocall",freeTableName).find(ref).projection(keys).limit(50);
			    MongoCursor<BasicDBObject> cursor = iterable.iterator();
				while (cursor.hasNext()) {
					BasicDBObject ob = cursor.next();
					String num = (String)ob.get("num");
					String _id = (String)ob.get("_id");
					String batchNo = (String)ob.get("batchNo");
					
					sb.append(num+":"+_id+",");
					numList.add(_id);
					newNo.put("_id", _id);
					newNo.put("batchNo", batchNo);
					newNo.put("num", num);
					MongoProvider.getInstance().insert("cc_autocall",tableName, newNo);						
					MongoProvider.getInstance().getConection("cc_autocall",freeTableName).deleteOne(new BasicDBObject().append("_id", _id));
				}
			}else if(numType.equals("generate")){
				BasicDBObject generateKeys = new BasicDBObject();
				keys.put("_id", 1);
				keys.put("beginNum", 1);
				keys.put("endNum", 1);
				keys.put("currentNum", 1);
				BasicDBObject ref = new BasicDBObject();
				ref.put("account", account);
				ref.put("_id", action.getStringValue("taskId"));
				List<DBObject> result = MongoProvider.getInstance().find("cc_autocall_task", taskTableName, ref, generateKeys);
				for(int j=0 ; j<result.size() ; j++) {
					DBObject ob = result.get(j);
					String startNo = (String)ob.get("beginNum");
					String endNo = (String)ob.get("endNum");
					String _id = (String)ob.get("_id");
					try{
						if(startNo.length()>6 && endNo.length()>6
								&& (Long.valueOf(endNo) > Long.valueOf(startNo))){
							String current = startNo;
							if(ob.get("currentNum") != null){
								current = (String)ob.get("currentNum");
							}
							long s = Long.valueOf(startNo);
							long c = Long.valueOf(current);
							long e = Long.valueOf(endNo);
							//结束
							if(c > e || s > e){

							} else {
								long n = 50;
								if(e - c < n) {
									n = e-c+1;
								}
								for(int i=0;i<n;i++) {
									String newID = Utils.getUniqueid();
									sb.append(c+":"+newID+",");
									c++;
								}
								MongoProvider.getInstance().update("cc_autocall_task", taskTableName,
										new BasicDBObject().append("_id", _id), 
										new BasicDBObject().append("$set", new BasicDBObject().append("currentNum", c+"")),
										WriteConcern.SAFE);
								calledCount = n;
							}
						}else{
							log.log(Level.WARNING, "Error auto call num :" + startNo);
						}
					} catch (Exception e){
						log.log(Level.WARNING, "", e);
					}
				}
			}else{
				sendOK("404", exchange);
			}
			if(numList.size() > 0){
				calledCount = numList.size();				
			}
			String res = sb.toString();
			if(res.endsWith(",")){
				res = res.substring(0, res.length() - 1);
				if(action.hasKey("taskId")){
					BasicDBObject findTask = new BasicDBObject();
					findTask.put("_id", action.getStringValue("taskId"));
					List<DBObject> curTasks = MongoProvider.getInstance().find("cc_autocall_task","app_autocall_task",findTask);
					if(curTasks.size() > 0){
						DBObject curTask = curTasks.get(0);
						if(curTask.containsField("total") && curTask.containsField("calledNum")){
							long total = Long.parseLong(curTask.get("total").toString());
							long calledNum = Long.parseLong(curTask.get("calledNum").toString());
							if(calledNum + calledCount > total){
								log.log(Level.WARNING, "Find task calledNum["+calledNum+"] + thisCount["+calledCount+"] Beyond total ! taskId="+action.getStringValue("taskId"));
								if(numType.equals("import")){
									long willDialCount = MongoProvider.getInstance().count("cc_autocall"
											,freeTableName, new BasicDBObject("taskId",action.getStringValue("taskId")));
									DBObject taskDoc = new BasicDBObject();
									taskDoc.put("calledNum",(int)(total-willDialCount));
									MongoProvider.getInstance().update("cc_autocall_task", "app_autocall_task", 
											findTask, new BasicDBObject("$set",taskDoc), WriteConcern.SAFE);
								}else{
									DBObject taskDoc = new BasicDBObject();
									taskDoc.put("calledNum",(int)total);
									MongoProvider.getInstance().update("cc_autocall_task", "app_autocall_task", 
											findTask, new BasicDBObject("$set",taskDoc), WriteConcern.SAFE);
								}
							}else{
								DBObject taskDoc = new BasicDBObject();
								taskDoc.put("calledNum",(int)calledCount);
								MongoProvider.getInstance().update("cc_autocall_task", "app_autocall_task", 
										findTask, new BasicDBObject("$inc",taskDoc), WriteConcern.SAFE);	
							}
						}else{
							DBObject taskDoc = new BasicDBObject();
							taskDoc.put("calledNum",(int)calledCount);
							MongoProvider.getInstance().update("cc_autocall_task", "app_autocall_task", 
									findTask, new BasicDBObject("$inc",taskDoc), WriteConcern.SAFE);							
						}
					}
				}
				sendOK(res, exchange);
			} else {
				sendOK("404", exchange);
			}
		} else if(action.getActionName().equals("GetAutoFaxList")) {
			BasicDBObject ref = new BasicDBObject();
			ref.put("account", action.getStringValue("account"));
			ref.put("called", false);
			BasicDBObject keys = new BasicDBObject();
			keys.put("num", 1);
			FindIterable<BasicDBObject> iterable = MongoProvider.getInstance().getConection("app_autofax").find(ref).projection(keys).limit(100);
			MongoCursor<BasicDBObject> result = iterable.iterator();
			StringBuffer sb = new StringBuffer();
			List<String> numList = new ArrayList<String>();
			while (result.hasNext()) {
				DBObject ob = result.next();
				String num = (String)ob.get("num");
				String _id = (String)ob.get("_id");
				sb.append(num+":"+_id+",");
				numList.add(_id);
			}
			String res = sb.toString();
			if(res.endsWith(",")){
				res = res.substring(0, res.length() - 1);
				DBObject in = new BasicDBObject();
				in.put("$in", numList);
				BasicDBObject q = new BasicDBObject();
				q.put("account", ref.get("account"));
				q.put("called", false);
				q.put("_id", in);
				DBObject set = new BasicDBObject();
				set.put("called", true);
				set.put("beginTime", Utils.getDate("yyyy-MM-dd HH:mm:ss"));
				set.put("beginTimestamp", Utils.getCurrentTimestamp());
				BasicDBObject o = new BasicDBObject();
				o.put("$set", set);
				MongoProvider.getInstance().getConection("app_autofax").updateMany(q, o);
				sendOK(res, exchange);
			} else {
				sendOK("404", exchange);
			}
		} else if(action.getActionName().equals("GuardServerAlive")) {
//			boolean success = true;
//			DBObject doc = new BasicDBObject();
//			doc.put("serverName", action.getStringValue("serverName"));
//			doc.put("time", Utils.getDate("yyyy-MM-dd HH:mm:ss"));
//			MongoDatabase db = null;
//			db = MongoConnect.getInstance().getDB("bill");
//			db.requestStart();
//			DBCollection collection = db.getCollection("guard_alive_check");
//			WriteResult ret = collection.insert(doc);
//			if(!ret.getLastError().ok()){
//				success = false;
//				log.log(Level.WARNING, "mongdb insert failed! getLastError = " + ret.getLastError().getErrorMessage());
//			}
//			db.requestDone();
//			if(success){
				sendOK("200", exchange);				
//			}else{
//				sendOK("500", exchange);
//			}
		} else {
			sendOK("404", exchange);
		}
	}

	/**
	 * 
	 * @param exchange
	 * @throws IOException
	 */
	private void processGet(HttpExchange exchange) throws Exception {
		String path = exchange.getRequestURI().getPath();
		if(path.endsWith(Fields.Command)) {
			processCommand(exchange);
			return;
		}
		sendOK("401", exchange);
	}
	
	private void processCommand(HttpExchange exchange) throws Exception {
		String strData = exchange.getRequestURI().getQuery();
		Hashtable<String, String> map = new Hashtable<String, String>();
		if (strData.indexOf('&') > -1) {
			String[] commands = strData.split("&");
			for (int i = 0; i < commands.length; i++) {
				String[] command = commands[i].split("=");
				if (command.length == 2)
					map.put(command[0], command[1]);
			}
			C5Action action = new C5Action(map.get(Fields.Action), map.get(Fields.Action)+Math.random());
			action.setValues(map);
			C5Response response = CDRActionProcessor.getInstance().processAction(action);
			sendOK(response, exchange);
			return;
		} else {
			sendOK("401", exchange);
		}
	}

	public static void sendOK(C5Response response, HttpExchange exchange)
			throws IOException {
		String data = response.getJsonString();
		sendOK(data, exchange);
	}

	public static void sendOK(String data, HttpExchange exchange)
			throws IOException {
		try {
			String callbackName = (String) exchange.getVar("callbackName");
			if (callbackName != null) {
				data = callbackName + "(" + data + ")";
				exchange.setVar("callbackName", null);
			}
			Headers responseHeaders = exchange.getResponseHeaders();
			responseHeaders.set("Content-Type", "text/plain");
			byte[] toSend = data.getBytes("UTF-8");
			responseHeaders.set("Content-Length", toSend.length + "");
			exchange.sendResponseHeaders(200, 0);
			exchange.getResponseBody().write(toSend);
			exchange.getResponseBody().flush();
			exchange.getResponseBody().close();
		} catch (Exception e) {
			// log.log(Level.WARNING, "", e);
		} finally {
			exchange.close();
		}
	}
}
