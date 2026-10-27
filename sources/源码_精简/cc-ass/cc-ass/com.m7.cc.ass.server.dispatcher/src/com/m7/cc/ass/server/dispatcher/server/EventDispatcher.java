package com.m7.cc.ass.server.dispatcher.server;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.ass.model.RuntimeData;
import com.m7.cc.ass.model.cdr.impl.C5BatchDialoutRecord;
import com.m7.cc.ass.model.cdr.impl.C5CallRecord;
import com.m7.cc.ass.model.cdr.impl.C5ChannelRecord;
import com.m7.cc.ass.model.cdr.impl.C5Investigate;
import com.m7.cc.ass.model.cdr.impl.C5PeerCallRecord;
import com.m7.cc.ass.model.cdr.impl.C5PeerRecord;
import com.m7.cc.ass.model.configuration.User;
import com.m7.cc.ass.server.cdr.server.CDRServer;
import com.m7.cc.ass.server.cdr.server.CdrListener;
import com.m7.cc.command.C5Event;
import com.m7.cc.command.Fields;
import com.m7.cc.util.Utils;
import com.m7.cc.util.log.IceLogger;

public class EventDispatcher implements CdrListener {
	public static final String CALL_SHEET_ID = "CallSheetID";
	public static final String CALL_NO = "CallNo";
	public static final String CALLED_NO = "CalledNo";
	public static final String CALL_ID = "CallID";
	public static final String CALL_TYPE = "CallType";
	public static final String RECORD_FILE = "RecordFile";
	public static final String BEGIN_TIME = "Begin";
	public static final String RING_TIME = "Ring";
	public static final String END_TIME = "End";
	public static final String QUEUE_TIME = "QueueTime";
	public static final String AGENT = "Agent";
	public static final String AGENT_NAME = "AgentName";
	public static final String QUEUE = "Queue";
	public static final String USER = "User";
	public static final String EXTEN = "Exten";
	public static final String EXTEN_TYPE = "ExtenType";
	public static final String STATE = "State";
	public static final String CALL_STATE = "CallState";
	public static final String CHANNEL = "Channel";
	public static final String ACTION_ID = "ActionID";
	public static final String FILE_SERVER = "FileServer";
	public static final String PROVINCE = "Province";
	public static final String DISTRICT = "District";
	public static final String SURVEY_CONTENT = "SurveyContent";
	public static final String CDRVAR = "CdrVar";
	public static final String ACCOUNTID = "AccountId";
	public static final String ACCOUNTNAME = "AccountName";
	public static final String REF_CALL_SHEET_ID = "refCallSheetId";
	public static final String RINGING_TIMESTAMP = "RingingTimestamp";
	
	public static final String TRANSFER_MODE = "TransferMode";
	public static final String TRANSFER_NUM = "TransferNum";
	public static final String TRANSFER_AGENT = "TransferAgent";

	public static final String TYPE = "Type";
	public static final String TIME = "Time";
	public static final String BUSY_TYPE = "BusyType";

	private Logger eventLog;
	private ExecutorService excutor;

	public EventDispatcher() {
		excutor = Executors.newCachedThreadPool();
		eventLog = IceLogger.getLogger(ASConfig.getInstance().getLogDir(),
				"dispatcher", "ALL", false);
		eventLog.info("Dispatcher started");
	}

	public void start() {
		CDRServer.getInstance().addCdrListener(this, null);
	}

	public void stop() {
		try {
			CDRServer.getInstance().removeCdrListener(this, null);
			excutor.shutdownNow();
		} catch (Exception e) {
			eventLog.log(Level.WARNING, "", e);
		}

	}

	@Override
	public void callCdrNew(C5CallRecord cdr) {
	}

	@Override
	public void callCdrUpdate(C5CallRecord cdr) {
	}

	@Override
	public void channelCdrNew(C5ChannelRecord cdr) {
	}
	
	@Override
	public void batchDialoutCdrNew(C5BatchDialoutRecord cdr) {
		// TODO Auto-generated method stub
		
	}

	@Override
	public void investigateNew(C5Investigate cdr) {
		try {
			String account = cdr.getAccount_id();
			if(account == null || account.equals("")){
				return;
			}
			String urlarr = RuntimeData.getInstance().getUrl(account, Fields.InvestigateURL);
			if(urlarr != null&& !urlarr.equalsIgnoreCase("")){
				String[] urls = urlarr.split(";");
				for(int i = 0,len =urls.length;i<len;i++){
					String url = urls[i];
					if (url != null && !"".equals(url)) {
						url = getInvestigateEncodeUrl(cdr, url);
					}
					if (url != null && !url.equalsIgnoreCase("")) {
						eventLog.info("Send event: \r\n"+url);
						excutor.execute(new EventTask(url,account));
					}
				}
			}
		} catch (Exception e) {
			this.eventLog.log(Level.WARNING, "", e);
		}
	}
	
	private String getInvestigateEncodeUrl(C5Investigate event, String eventUrl) {
		String url = eventUrl;
		try {
			url += "?" + CALL_SHEET_ID + "="
					+ URLEncoder.encode(event.getCall_sheet_id(), "UTF-8");
			url += "&" + SURVEY_CONTENT + "="
					+ URLEncoder.encode(event.getSurver_content(), "UTF-8");
			
			if(RuntimeData.getInstance().getDispatcherAccAndIdMap().containsKey(event.getAccount_id()+"@"+event.getPbx())){
				url += "&" + ACCOUNTID + "="
						+ URLEncoder.encode(event.getAccount_id(), "UTF-8");
				url += "&" + ACCOUNTNAME + "="
						+ URLEncoder.encode(RuntimeData.getInstance().getDispatcherAccAndIdMap()
								.get(event.getAccount_id()+"@"+event.getPbx()), "UTF-8");
			}
		} catch (Exception e) {
			eventLog.log(Level.WARNING, "", e);
		}
		return url;
	}

	@Override
	public void peerCallCdrNew(C5PeerCallRecord cdr) {
		
		try{
			String account = cdr.getAccount();
			if(account == null || account.equals("")){
				return;
			}
			String state = cdr.getChannelState();
			if(account == null || state == null){
				return;
			}
			String url = null;
			ArrayList<String> urls = new ArrayList<String>();
			if (state.equals(Fields.Ring)) {
				url = RuntimeData.getInstance().getUrl(account, Fields.RingURL);
				if (url != null && !url.equalsIgnoreCase("")){
					String[] ringurls = url.split(";");
					for (int i = 0; i < ringurls.length; i++) {
						urls.add(getEncodedUrl(cdr, ringurls[i]));
					}
				}
			} else if (state.equals(Fields.Ringing)) {
				url = RuntimeData.getInstance().getUrl(account, Fields.RingingURL);
				if (url != null && !url.equalsIgnoreCase("")){
					String[] ringurls = url.split(";");
					for (int i = 0; i < ringurls.length; i++) {
						urls.add(getEncodedUrl(cdr, ringurls[i]));
					}
				}
			} else if (state.equals(Fields.Link)) {
				url = RuntimeData.getInstance().getUrl(account, Fields.LinkURL);
				if (url != null && !url.equalsIgnoreCase("")){
					String[] ringurls = url.split(";");
					for (int i = 0; i < ringurls.length; i++) {
						urls.add(getEncodedUrl(cdr, ringurls[i]));
					}
				}
			} else if (state.equals(Fields.Hangup)) {
				url = RuntimeData.getInstance().getUrl(account, Fields.HanupURL);
				if (url != null && !url.equalsIgnoreCase("")){
					String[] ringurls = url.split(";");
					for (int i = 0; i < ringurls.length; i++) {
						urls.add(getEncodedUrl(cdr, ringurls[i]));
					}
				}
			}
			if (url != null && !url.equalsIgnoreCase("")) {
				for (int i = 0; i < urls.size(); i++) {
					String eveurl = urls.get(i);
					eventLog.info("Send event: \r\n"+eveurl);
					excutor.execute(new EventTask(eveurl,account));
				}
			}
			
		} catch (Exception e){
			System.out.println(e);
			this.eventLog.log(Level.WARNING, "", e);
		}

	}

	@Override
	public void peerCallCdrUpdate(C5PeerCallRecord cdr) {
		try{
			String account = cdr.getAccount();
			if(account == null || account.equals("")){
				return;
			}
			String state = cdr.getChannelState();
			String url = null;
			ArrayList<String> urls = new ArrayList<String>();
			if (state.equals(Fields.Ring)) {
				url = RuntimeData.getInstance().getUrl(account, Fields.RingURL);
				if (url != null && !url.equalsIgnoreCase("")){
					String[] ringurls = url.split(";");
					for (int i = 0; i < ringurls.length; i++) {
						urls.add(getEncodedUrl(cdr, ringurls[i]));
					}
				}
			} else if (state.equals(Fields.Ringing)) {
				url = RuntimeData.getInstance().getUrl(account, Fields.RingingURL);
				if (url != null && !url.equalsIgnoreCase("")){
					String[] ringurls = url.split(";");
					for (int i = 0; i < ringurls.length; i++) {
						urls.add(getEncodedUrl(cdr, ringurls[i]));
					}
				}
			} else if (state.equals(Fields.Link)) {
				url = RuntimeData.getInstance().getUrl(account, Fields.LinkURL);
				if (url != null && !url.equalsIgnoreCase("")){
					String[] ringurls = url.split(";");
					for (int i = 0; i < ringurls.length; i++) {
						urls.add(getEncodedUrl(cdr, ringurls[i]));
					}
				}
			} else if (state.equals(Fields.Hangup) || state.equals(Fields.Unlink)) {
				url = RuntimeData.getInstance().getUrl(account, Fields.HanupURL);
				if (url != null && !url.equalsIgnoreCase("")){
					String[] ringurls = url.split(";");
					for (int i = 0; i < ringurls.length; i++) {
						urls.add(getEncodedUrl(cdr, ringurls[i]));
					}
				}
			}
			if (url != null && !url.equalsIgnoreCase("")) {
				for (int i = 0; i < urls.size(); i++) {
					String eveurl = urls.get(i);
					if (eveurl.indexOf("[post]") != -1) {
						String address = eveurl.substring(0,eveurl.indexOf("[post]"));
						String param = eveurl.split("\\?")[1];
						eventLog.info("Send event: \r\n"+address+"\r\n data:"+param);
					} else {
						eventLog.info("Send event: \r\n"+eveurl);
					}
					excutor.execute(new EventTask(eveurl,account));
				}
				
			}
		} catch (Exception e){
			this.eventLog.log(Level.WARNING, "", e);
		}
		
	}

	private String getEncodedUrl(C5PeerCallRecord event, String eventUrl) {
		
		
		String url = eventUrl;
		try {
			url += "?" + CALL_NO + "="
					+ URLEncoder.encode(event.getCall_no(), "UTF-8");
			url += "&" + CALL_SHEET_ID + "="
					+ URLEncoder.encode(event.getCall_sheet_id(), "UTF-8");
			url += "&" + CALLED_NO + "="
					+ URLEncoder.encode(event.getCalled_no(), "UTF-8");
			url += "&" + CALL_ID + "="
					+ URLEncoder.encode(event.getCall_id(), "UTF-8");
			url += "&" + CALL_TYPE + "="
					+ URLEncoder.encode(event.getConnect_type(), "UTF-8");
			url += "&"
					+ RECORD_FILE
					+ "="
					+ URLEncoder.encode(
							event.getRecord_file_name() == null ? "" : event
									.getRecord_file_name(), "UTF-8");

			Timestamp _begin_time = Utils.getTimestamp(event.getBegin_time());
			Timestamp _offering_time = Utils.getTimestamp(event
					.getOffering_time());
			Timestamp _end_time = Utils.getTimestamp(event.getEnd_time());
			Timestamp _queue_time = Utils.getTimestamp(event.getQueue_time());
			long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
			long offering_time = _offering_time == null ? -1 : _offering_time
					.getTime();
			long end_time = _end_time == null ? -1 : _end_time.getTime();
			long queue_time = _queue_time == null ? -1 : _queue_time.getTime();
			String otime = Utils.getDate(offering_time);
			String btime = Utils.getDate(begin_time);
			String etime = Utils.getDate(end_time);
			String qtime = Utils.getDate(queue_time);
			url += "&" + RING_TIME + "="
					+ URLEncoder.encode(otime == null ? "" : otime, "UTF-8");
			url += "&" + BEGIN_TIME + "="
					+ URLEncoder.encode(btime == null ? "" : btime, "UTF-8");
			url += "&" + END_TIME + "="
					+ URLEncoder.encode(etime == null ? "" : etime, "UTF-8");
			url += "&" + QUEUE_TIME + "="
					+ URLEncoder.encode(qtime == null ? "" : qtime, "UTF-8");
			if(event.getQueue_name() != null){
				url += "&" + QUEUE + "="
				+ URLEncoder.encode(event.getQueue_name(), "UTF-8");
			}
			//agent
			try{
				String agentID = event.getDisposal_agent();
				User user = RuntimeData.getInstance().getAccount(event.getPbx(), 
						event.getAccount()).getUser(agentID);
				agentID = user.getUser();
				String exten = user.getExten();
				String name = user.getDisplayName();
				url += "&"
					+ AGENT
					+ "="
					+ URLEncoder.encode(agentID == null ? ""
							: agentID, "UTF-8");
				url += "&"
					+ EXTEN
					+ "="
					+ URLEncoder.encode(exten == null ? ""
							: exten, "UTF-8");
				url += "&"
					+ AGENT_NAME
					+ "="
					+ URLEncoder.encode(name == null ? ""
							: name, "UTF-8");
			} catch (Exception e){
				
			}
			
			url += "&"
					+ ACTION_ID
					+ "="
					+ URLEncoder.encode(event.getAction_id() == null ? ""
							: event.getAction_id(), "UTF-8");
			url += "&" + CALL_STATE + "="
					+ URLEncoder.encode(event.getChannelState(), "UTF-8");
			url += "&" + STATE + "="
					+ URLEncoder.encode(event.getStatus(), "UTF-8");
			url += "&" + FILE_SERVER + "="
			+ URLEncoder.encode(event.getFileServer(), "UTF-8");
			try {
				Hashtable<String, String> map = event.getVars();
				Iterator<String> keys = map.keySet().iterator();
				while (keys.hasNext()) {
					String key = keys.next();
					if (!key.equals(Fields.CallSheetID)
							&& !key.equals(Fields.ListenExten)
							&& !key.equals(Fields.BeginTime)
							&& !key.equals(Fields.EndTime)
							&& !key.equals(Fields.Agent)) {
						url += "&" + key + "="
								+ URLEncoder.encode(map.get(key), "UTF-8");
					}
				}
			} catch (Exception e) {

			}

			if(event.getProvince() != null && !event.getProvince().equals("")){
				url += "&" + PROVINCE + "=";
					if(event.getProvince().contains("\\")){
						url += URLEncoder.encode(Utils.unicodeToGB(event.getProvince()), "UTF-8");
					}else{
						url += URLEncoder.encode(event.getProvince(), "UTF-8");
					}
			}
			if(event.getDistrict() != null && !event.getDistrict().equals("")){
				url += "&" + DISTRICT + "=";
						if(event.getDistrict().contains("\\")){
							url += URLEncoder.encode(Utils.unicodeToGB(event.getDistrict()), "UTF-8");							
						}else{
							url += URLEncoder.encode(event.getDistrict(), "UTF-8");
						}
			}
			if(event.getCdrVar() != null && !event.getCdrVar().equals("")){
				url += "&" + CDRVAR + "="
						+ URLEncoder.encode(event.getCdrVar(), "UTF-8");
			}
			if(RuntimeData.getInstance().getDispatcherAccAndIdMap().containsKey(event.getAccount()+"@"+event.getPbx())){
				url += "&" + ACCOUNTID + "="
						+ URLEncoder.encode(event.getAccount(), "UTF-8");
				url += "&" + ACCOUNTNAME + "="
						+ URLEncoder.encode(RuntimeData.getInstance().getDispatcherAccAndIdMap()
								.get(event.getAccount()+"@"+event.getPbx()), "UTF-8");
			}
			if(event.getConnect_type().equalsIgnoreCase(Fields.transfer) || event.getConnect_type().equalsIgnoreCase(Fields.dialTransfer)){
				url += "&" + REF_CALL_SHEET_ID + "="
						+ URLEncoder.encode(event.getRef_call_sheet_id(), "UTF-8");
			}
			if(event.getRingingTimestamp() != null){
				url += "&" + RINGING_TIMESTAMP + "=" + URLEncoder.encode(event.getRingingTimestamp(), "UTF-8");
			}
			if(event.getTransferMode() != null){
				url += "&" + TRANSFER_MODE + "=" + URLEncoder.encode(event.getTransferMode(), "UTF-8");
			}
			if(event.getTransferNum() != null){
				url += "&" + TRANSFER_NUM + "=" + URLEncoder.encode(event.getTransferNum(), "UTF-8");
			}
			if(event.getTransferAgent() != null){
				url += "&" + TRANSFER_AGENT + "=" + URLEncoder.encode(event.getTransferAgent(), "UTF-8");
			}
			
		} catch (Exception e) {
			eventLog.log(Level.WARNING, "", e);
		}
		return url;
	}

	@Override
	public void peerCdrNew(C5PeerRecord cdr) {
		String actionType = cdr.getActionType();
		String account = cdr.getAccount();
		if(account == null || account.equals("")){
			return;
		}
		String urlstr = null;
		if (actionType.equals("busy") || actionType.equals("login")) {
			urlstr = RuntimeData.getInstance().getUrl(account, Fields.PeerURL);
			if(urlstr != null&& !urlstr.equalsIgnoreCase("")){
				String[] urls = urlstr.split(";");
				for (int i = 0; i < urls.length; i++) {
					if(!urls[i].equals("")){
						String url =urls[i];
						if(url != null && !url.equalsIgnoreCase("")) {
							if (!url.equalsIgnoreCase("")) {
								url = url +"?"+AGENT+"="+cdr.getUserID();
								url += "&" + USER+"="+cdr.getAgent();
								url += "&" + EXTEN+"="+cdr.getExten();
								url += "&" + EXTEN_TYPE+"="+cdr.getExtenType();
								url += "&" + TYPE+"="+cdr.getActionType();
								url += "&" + BUSY_TYPE+"="+cdr.getBusyType();
								if (cdr.getEnd_time() == null) {
									Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
									long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
									String btime = Utils.getDate(begin_time);
									url += "&" + STATE+"="+ "1";
									url += "&" + Fields.Timestamp+"="+ cdr.getBegin_time();
									try {
										url = url += "&" + TIME+"="+ URLEncoder.encode(btime == null ? "" : btime, "UTF-8");
									} catch (UnsupportedEncodingException e) {
										// TODO Auto-generated catch block
										e.printStackTrace();
									}
								} else {
									Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
									long end_time = _end_time == null ? -1 : _end_time.getTime();
									String btime = Utils.getDate(end_time);
									url = url += "&" + STATE+"="+ "0";
									url += "&" + Fields.Timestamp+"="+ cdr.getBegin_time();
									try {
										url = url += "&" + TIME+"="+ URLEncoder.encode(btime == null ? "" : btime, "UTF-8");
									} catch (UnsupportedEncodingException e) {
										// TODO Auto-generated catch block
										e.printStackTrace();
									}
								}
								if(RuntimeData.getInstance().getDispatcherAccAndIdMap().containsKey(cdr.getAccount()+"@"+cdr.getAsterisk())){
									try {
										url += "&" + ACCOUNTID + "="
												+ URLEncoder.encode(cdr.getAccount(), "UTF-8");
										url += "&" + ACCOUNTNAME + "="
												+ URLEncoder.encode(RuntimeData.getInstance().getDispatcherAccAndIdMap()
														.get(cdr.getAccount()+"@"+cdr.getAsterisk()), "UTF-8");
									} catch (UnsupportedEncodingException e) {
										// TODO Auto-generated catch block
										e.printStackTrace();
									}
								}
							}
							eventLog.info("Send event: \r\n"+url);
							excutor.execute(new EventTask(url,account));
						}
					}
				}
			}
		}
	}

	@Override
	public void peerCdrUpdate(C5PeerRecord cdr) {
		String actionType = cdr.getActionType();
		String account = cdr.getAccount();
		if(account == null || account.equals("")){
			return;
		}
		if (actionType.equals("busy") || actionType.equals("login")) {
			String urlstr = RuntimeData.getInstance().getUrl(account, Fields.PeerURL);
			if(urlstr != null&& !urlstr.equalsIgnoreCase("")){
				String[] urls = urlstr.split(";");
				for (int i = 0; i < urls.length; i++) {
					if(!urls[i].equals("")){
						String url =urls[i];
						if(url != null && !url.equalsIgnoreCase("")) {
							if (!url.equalsIgnoreCase("")) {
								url = url +"?"+AGENT+"="+cdr.getUserID();
								url += "&" + USER+"="+cdr.getAgent();
								url += "&" + EXTEN+"="+cdr.getExten();
								url += "&" + EXTEN_TYPE+"="+cdr.getExtenType();
								url += "&" + TYPE+"="+cdr.getActionType();
								url += "&" + BUSY_TYPE+"="+cdr.getBusyType();
								if (cdr.getEnd_time() == null) {
									Timestamp _begin_time = Utils.getTimestamp(cdr.getBegin_time());
									long begin_time = _begin_time == null ? -1 : _begin_time.getTime();
									String btime = Utils.getDate(begin_time);
									url += "&" + STATE+"="+ "1";
									url += "&" + Fields.Timestamp+"="+ cdr.getBegin_time();
									try {
										url = url += "&" + TIME+"="+ URLEncoder.encode(btime == null ? "" : btime, "UTF-8");
									} catch (UnsupportedEncodingException e) {
										// TODO Auto-generated catch block
										e.printStackTrace();
									}
								} else {
									Timestamp _end_time = Utils.getTimestamp(cdr.getEnd_time());
									long end_time = _end_time == null ? -1 : _end_time.getTime();
									String btime = Utils.getDate(end_time);
									url = url += "&" + STATE+"="+ "0";
									url += "&" + Fields.Timestamp+"="+ cdr.getBegin_time();
									try {
										url = url += "&" + TIME+"="+ URLEncoder.encode(btime == null ? "" : btime, "UTF-8");
									} catch (UnsupportedEncodingException e) {
										// TODO Auto-generated catch block
										e.printStackTrace();
									}
								}
								if(RuntimeData.getInstance().getDispatcherAccAndIdMap().containsKey(cdr.getAccount()+"@"+cdr.getAsterisk())){
									try {
										url += "&" + ACCOUNTID + "="
												+ URLEncoder.encode(cdr.getAccount(), "UTF-8");
										url += "&" + ACCOUNTNAME + "="
												+ URLEncoder.encode(RuntimeData.getInstance().getDispatcherAccAndIdMap()
														.get(cdr.getAccount()+"@"+cdr.getAsterisk()), "UTF-8");
									} catch (UnsupportedEncodingException e) {
										// TODO Auto-generated catch block
										e.printStackTrace();
									}
								}
							}
							eventLog.info("Send event: \r\n"+url);
							excutor.execute(new EventTask(url,account));
						}
					}
				}
			}
			
		}
//		if (url != null && !url.equalsIgnoreCase("")) {
//			eventLog.info("Send event: \r\n"+url);
//			excutor.execute(new EventTask(url,account));
//		}
	}

	@Override
	public void autoCall(C5Event cdr) {
		// TODO Auto-generated method stub
		
	}
}
