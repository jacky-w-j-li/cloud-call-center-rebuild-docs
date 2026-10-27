package com.dishui.manager.cdrReport.impl;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.cdrReport.CdrEventType;
import com.dishui.manager.report.CdrEventListener;
import com.dishui.manager.report.EventListener;
import com.dishui.manager.report.common.EventUtil;
import com.dishui.manager.report.model.Constant;
import com.dishui.manager.report.model.Event;
import com.dishui.manager.service.Utils;
import com.dishui.util.AccountUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.UUID;
import java.util.Vector;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.bson.Document;

/**
 * Created by chenguang on 4/6/16.
 */
public class CdrQualityCheckReportHandler implements CdrEventListener {

    public Vector<Event> eventBuffer = new Vector<Event>();

    private static final Logger log = Logger.getLogger(CdrQualityCheckReportHandler.class
            .getName());

    private boolean running = true;

    public CdrQualityCheckReportHandler() {
        Thread t = new Thread("CdrQualityCheckReportHandler buffer thread") {
            public void run() {
                doEvent();
            }
        };
        t.start();
    }

    private void doEvent() {
        while (running) {
            Event event = null;
            try {
                synchronized (eventBuffer) {
                    if (eventBuffer.size() == 0) {
                        List<BasicDBObject> list = MongoProvider.find("cdr_quality_check_report_overflow_events", new BasicDBObject(), 10000);
                        if(list.size() > 0){
                            for(int i =0 ;i<list.size() ;i++){
                                Event tmpEvent = new Event(list.get(i));
                                eventBuffer.add(tmpEvent);
                            }
                        }else{
                            eventBuffer.wait();
                        }
                    } else {
                        event = eventBuffer.remove(0);
                    }
                }
                if(event != null)
                    handleEvent(event);
                log.log(Level.INFO, "CdrQualityCheckReportHandler remove(0) eventBuffer size = "+ eventBuffer.size() + "  --------"+ this.toString());
            } catch (Exception e) {
                log.log(Level.WARNING, "", e);
            }
        }
    }

    public void addToBuf(Event event) {
        if (eventBuffer.size() > 1000000) {
            log.warning("cdr_quality_check_report buffer is too large to cache any event");
            //每个buffer大于 100万的时候，不再向buffer放事件，先入库保存
            MongoProvider.insert("cdr_quality_check_report_overflow_events", EventUtil.convertToDocument(event));
        } else {
            synchronized (eventBuffer) {
                eventBuffer.add(event);
                eventBuffer.notify();
            }
        }
        log.log(Level.INFO, "AgentHourCdrPeerReportHandler eventBuffer size = "+ eventBuffer.size() + "  ---"+ this.toString());
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
//        MongoProvider.insert("cdr_agent_houre_cdr_peer_report_log", EventUtil.convertToDocument(event));
    }

    @Override
    public void addToBufList(ArrayList<Event> eventList) {
        synchronized (eventBuffer) {
            eventBuffer.addAll(eventList);
            eventBuffer.notify();
        }
        //入库，模块的事件日志表。这个表是记录这个模块处理过的事件备份。这个表是固定大小表
//        for(int i = 0; i < eventList.size() ; i++)
//            MongoProvider.insert("cdr_agent_houre_cdr_peer_report_log", EventUtil.convertToDocument(eventList.get(i)));
    }

    private void handleEvent(Event event) {
        try {
            Map<String, Object> data = event.getBusinessData();
            if(event.getType().equals(CdrEventType.CDR_QUALITYCHECK)){
            	List<BasicDBObject> cycles=MongoProvider.findFromApp("cc",Constant.APP_MANAGER_QUALITY_CHECK_CYCLE_CONFIG,new BasicDBObject().append("account", data.get("ACCOUNT").toString()));
            	DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
            	Date eventdate = dateFormat.parse(data.get("GRADE_TIME").toString());
                	for (int i = 0; i < cycles.size(); i++) {
                		ArrayList<Date> curdates = (ArrayList<Date>) cutCycle(cycles.get(i));
                		for (int j = 0; j <curdates.size()-1; j++){
                			if(curdates.get(j).getTime()<=eventdate.getTime()&&eventdate.getTime()<curdates.get(j+1).getTime()){
                				BasicDBObject find = new BasicDBObject();
                                find.put("DISPOSAL_AGENT", data.get("DISPOSAL_AGENT"));
                                find.put("cycleid", cycles.get(i).get("_id"));
                                find.put("cycle_section", cycles.get(i).get("_id").toString()+j);
                                find.put("templte_id", data.get("TEMPLATE"));
                				List<BasicDBObject> list = MongoProvider.find("cdr_quality_check_report", find);
            	                if(list.size() > 0){
            	                	if(data.get("qc_type") !=null && data.get("qc_type").equals("repeat")){
            	                		int monitorcount = 0;
                                        monitorcount++;
                	                	BasicDBObject update = new BasicDBObject();
                	                	HashMap<String, Object> grade_amount= (HashMap<String, Object>)data.get("GRADE_AMOUNT");
                	                	BasicDBObject inclist = new BasicDBObject();
                	                	if(data.get("gradefinaltype") != null){
                	                		String gradefinaltype = data.get("gradefinaltype").toString();
                	                		if(gradefinaltype.equals("cruxerror")){
                	                			inclist.put("cruxerror", -1);
                	                		}else if(gradefinaltype.equals("uncruxerror")){
                	                			inclist.put("uncruxerror", -1);
                	                		}else if(gradefinaltype.equals("uncruxerrorand")){
                	                			inclist.put("uncruxerrorand", -1);
                	                		}else if(gradefinaltype.equals("pass")){
                	                			inclist.put("pass", -1);
                	                		}else if(gradefinaltype.equals("involve")){
                	                			inclist.put("involve", -1);
                	                		}
                	                	}
                	                	if(data.get("uncurxnum") != null){
                	                		inclist.put("uncurxnum", (0-Integer.valueOf(data.get("uncurxnum").toString())));
                	                	}else{
                	                		update.put("uncurxnum", 0);
                	                	}
                	                	if(data.get("uncurxerrornum") != null){
                	                		inclist.put("uncurxerrornum", (0-Integer.valueOf(data.get("uncurxerrornum").toString())));
                	                	}else{
                	                		update.put("uncurxerrornum", 0);
                	                	}
                	                    Iterator it = grade_amount.entrySet().iterator();
                	                    while(it.hasNext()){
    	            	                    Entry entry = (Entry)it.next();
    	            	                    if(grade_amount.get(entry.getKey().toString()).equals("no")){
    	            	                    	inclist.put(entry.getKey().toString()+"_no", -1);
                    	                    }
                    	                    if(monitorcount > 0){
                    	                    	inclist.put("monitorcount", -1);
                    	                    }
                	                    }
                	                    update.put("$inc", inclist);
                	                    MongoProvider.update("cdr_quality_check_report", find, update, true);
            	                	}else{
            	                		int monitorcount = 0;
                                        monitorcount++;
                	                	BasicDBObject update = new BasicDBObject();
                	                	BasicDBObject inclist = new BasicDBObject();
                	                	HashMap<String, Object> grade_amount= (HashMap<String, Object>)data.get("GRADE_AMOUNT");
                	                	if(data.get("gradefinaltype") != null){
                	                		String gradefinaltype = data.get("gradefinaltype").toString();
                	                		if(gradefinaltype.equals("cruxerror")){
                	                			inclist.put("cruxerror", 1);
                	                		}else if(gradefinaltype.equals("uncruxerror")){
                	                			inclist.put("uncruxerror", 1);
                	                		}else if(gradefinaltype.equals("uncruxerrorand")){
                	                			inclist.put("uncruxerrorand", 1);
                	                		}else if(gradefinaltype.equals("pass")){
                	                			inclist.put("pass", 1);
                	                		}else if(gradefinaltype.equals("involve")){
                	                			inclist.put("involve", 1);
                	                		}
                	                	}
                	                	if(data.get("uncurxnum") != null){
                	                		inclist.put("uncurxnum", Integer.valueOf(data.get("uncurxnum").toString()));
                	                	}else{
                	                		update.put("uncurxnum", 0);
                	                	}
                	                	if(data.get("uncurxerrornum") != null){
                	                		inclist.put("uncurxerrornum", Integer.valueOf(data.get("uncurxerrornum").toString()));
                	                	}else{
                	                		update.put("uncurxerrornum", 0);
                	                	}
                	                    Iterator it = grade_amount.entrySet().iterator();
                	                    while(it.hasNext()){
    	            	                    Entry entry = (Entry)it.next();
    	            	                    if(grade_amount.get(entry.getKey().toString()).equals("no")){
    	            	                    	inclist.put(entry.getKey().toString()+"_no", 1);
                    	                    }
                    	                    if(monitorcount > 0){
                    	                    	inclist.put("monitorcount", 1);
                    	                    }
                	                    }
                	                    update.put("$inc", inclist);
                	                    MongoProvider.update("cdr_quality_check_report", find, update, true);
            	                	}
            	               }else{
            	            	    BasicDBObject basicobj = MongoProvider.findOneFromApp("cc", "manager_quality_check_config", new BasicDBObject("_id",data.get("TEMPLATE")));
            	                    Document doc = new Document();
            	                    if(basicobj.get("uncurxratio")!=null){
            	                    	doc.put("ratio", Integer.valueOf(basicobj.get("uncurxratio").toString()));
            	                    }
            	                    doc.put("DISPOSAL_AGENT", data.get("DISPOSAL_AGENT"));
            	                    doc.put("cycleid", cycles.get(i).get("_id"));
            	                    doc.put("cycle_section", cycles.get(i).get("_id").toString()+j);
            	                    Object cycleinterval=cycles.get(i).get("cycleInterval");
            	                    String linkStr="";
            	                    if(cycleinterval == null){
            	                        linkStr = "_M_";
            	                    }else if(cycleinterval.toString().equals("1")){
            	                        linkStr = "_D_";
            	                    }else if(cycleinterval.toString().equals("7")){
            	                        linkStr = "_W_";
            	                    }else{
            	                        linkStr = "_" + cycleinterval.toString() + "D_";
            	                    }
            	                    doc.put("cycle_name", cycles.get(i).get("cycleName").toString()+linkStr+(j+1));
            	                    doc.put("templte_id", data.get("TEMPLATE"));
            	                    HashMap<String, Object> grade_amount= (HashMap<String, Object>)data.get("GRADE_AMOUNT");	
            	                    Iterator it = grade_amount.entrySet().iterator();
            	                    if(data.get("gradefinaltype") != null){
            	                		String gradefinaltype = data.get("gradefinaltype").toString();
            	                		if(gradefinaltype.equals("cruxerror")){
            	                			doc.put("cruxerror", 1);
            	                			doc.put("uncruxerror", 0);
            	                			doc.put("uncruxerrorand", 0);
            	                			doc.put("pass", 0);
            	                			doc.put("involve", 0);
            	                		}else if(gradefinaltype.equals("uncruxerror")){
            	                			doc.put("cruxerror", 0);
            	                			doc.put("uncruxerror", 1);
            	                			doc.put("uncruxerrorand", 0);
            	                			doc.put("pass", 0);
            	                			doc.put("involve", 0);
            	                		}else if(gradefinaltype.equals("uncruxerrorand")){
            	                			doc.put("cruxerror", 0);
            	                			doc.put("uncruxerror", 0);
            	                			doc.put("uncruxerrorand", 1);
            	                			doc.put("pass", 0);
            	                			doc.put("involve", 0);
            	                		}else if(gradefinaltype.equals("pass")){
            	                			doc.put("cruxerror", 0);
            	                			doc.put("uncruxerror", 0);
            	                			doc.put("uncruxerrorand", 0);
            	                			doc.put("pass", 1);
            	                			doc.put("involve", 0);
            	                		}else if(gradefinaltype.equals("involve")){
            	                			doc.put("cruxerror", 0);
            	                			doc.put("uncruxerror", 0);
            	                			doc.put("uncruxerrorand", 0);
            	                			doc.put("pass", 0);
            	                			doc.put("involve", 1);
            	                		}
            	                	}
            	                    if(data.get("uncurxnum") != null){
            	                    	doc.put("uncurxnum", Integer.valueOf(data.get("uncurxnum").toString()));
            	                	}else{
            	                		doc.put("uncurxnum", 0);
            	                	}
            	                    if(data.get("uncurxerrornum") != null){
            	                		doc.put("uncurxerrornum", Integer.valueOf(data.get("uncurxerrornum").toString()));
            	                	}else{
            	                		doc.put("uncurxerrornum", 0);
            	                	}
            	                    while(it.hasNext()){
                	                    Entry entry = (Entry)it.next();
                	                    if(grade_amount.get(entry.getKey().toString()).equals("no")){
                	                    	doc.put(entry.getKey().toString()+"_no",1);
                	                    }else{
                	                    	doc.put(entry.getKey().toString()+"_no",0);
                	                    }
            	                    }
				                	int createmonitorcount = 0;
				                	createmonitorcount++;
	                                doc.put("monitorcount",createmonitorcount);
	                                doc.put("_id", UUID.randomUUID().toString());
            	                    MongoProvider.insert("cdr_quality_check_report", doc);
            	                }
                			}
                		}
                	}
            }else{
                log.warning("AgentHourCdrPeerReportHandler don't know event type." + event.getType());
            }
        } catch (Exception e) {
            log.log(Level.WARNING, "AgentHourCdrPeerReportHandler handle event failed", e);
        }
    }

    private List<Date> cutCycle(BasicDBObject cycle){
    	DateFormat dateFormat2 = new SimpleDateFormat("yyyy-MM-dd");
    	Long begtime = date2TimeStamp(cycle.get("cycleBegins").toString(),"yyyy-MM-dd");
    	Long endtime = date2TimeStamp(cycle.get("cycleEnds").toString(),"yyyy-MM-dd");
    	ArrayList<Date> dates = new ArrayList<Date>();
    	if(cycle.get("cycleInterval")== null){
    		Date begdate = null;
    		Date enddate = null;
			try {
				 begdate = dateFormat2.parse(timeStamp2Date(begtime.toString(),"yyyy-MM-dd"));
				 enddate = dateFormat2.parse(timeStamp2Date(endtime.toString(),"yyyy-MM-dd"));
			} catch (ParseException e1) {
				// TODO Auto-generated catch block
				e1.printStackTrace();
			}
    		int begtoendmonth = enddate.getMonth()-begdate.getMonth()+1;
    		for (int i = 0; i <=begtoendmonth; i++) {
    			Date curdate = new Date(begdate.getTime());
    			curdate.setMonth(begdate.getMonth()+i);
        		dates.add(curdate);
    		}
    	}else{
    		int cur_num = Integer.valueOf(cycle.get("cycleInterval").toString());
        	for (int i = 0; i <=(endtime-begtime)/(cur_num*86400)+1; i++) {
        		Long curtime = begtime+i*cur_num*86400;
        		try {
    				Date curdate=dateFormat2.parse(timeStamp2Date(curtime.toString(),"yyyy-MM-dd"));
    				dates.add(curdate);
    			} catch (Exception e) {
    				e.printStackTrace();
    			}
    		}
    	}
    	return dates;
    }
    
    private long date2TimeStamp(String date_str,String format){  
        try {  
            SimpleDateFormat sdf = new SimpleDateFormat(format);  
            return sdf.parse(date_str).getTime()/1000;  
        } catch (Exception e) {  
            e.printStackTrace();  
        }  
        return 0;  
    } 
    private  String timeStamp2Date(String seconds,String format) {  
        if(seconds == null || seconds.isEmpty() || seconds.equals("null")){  
            return "";  
        }  
        if(format == null || format.isEmpty()) format = "yyyy-MM-dd HH:mm:ss";  
        SimpleDateFormat sdf = new SimpleDateFormat(format);  
        return sdf.format(new Date(Long.valueOf(seconds+"000")));  
    } 
    private void doCdrPeerDB(String agent, String reportTime, String stateType, String account,int timeLength){
        BasicDBObject find = new BasicDBObject();
        find.put("ReportTime", reportTime);
        find.put("AgentID", agent);
        List<BasicDBObject> list = MongoProvider.find("cdr_report_agent_houre", find);
        if(list.size() > 0){
            BasicDBObject update = new BasicDBObject();
            update.put("$inc", new BasicDBObject(stateType + "_TIME_LENGTH", timeLength));
            MongoProvider.update("cdr_report_agent_houre", find, update, true);
        }else{
            BasicDBObject doc = new BasicDBObject();
            doc.put("AccountID", account);
            doc.put("ReportTime", reportTime);
            doc.put("YearID", Utils.getYearID(reportTime));
            doc.put("MonthID", Utils.getMonthID(reportTime));
            doc.put("DayID", Utils.getDayID(reportTime));
            doc.put("AgentID", agent);
            doc.put("CallInAccessCount", 0);
            doc.put("CallInAcceptCount", 0);
            doc.put("CallInTimeLength", 0);
            doc.put("CallOutAccessCount", 0);
            doc.put("CallOutAcceptCount", 0);
            doc.put("CallOutTimeLength", 0);
            doc.put("TransferAcceptCount", 0);
            doc.put("IDLE_TIME_LENGTH", 0);
            doc.put("BUSY_TIME_LENGTH", 0);
            doc.put("LOGIN_TIME_LENGTH", 0);
            doc.put("STATE2_TIME_LENGTH", 0);
            doc.put("STATE3_TIME_LENGTH", 0);
            doc.put("STATE4_TIME_LENGTH", 0);
            doc.put("STATE5_TIME_LENGTH", 0);
            doc.put("STATE6_TIME_LENGTH", 0);
            doc.put("STATE7_TIME_LENGTH", 0);
            doc.put("STATE8_TIME_LENGTH", 0);
            doc.put("STATE9_TIME_LENGTH", 0);
            doc.put("STATE99_TIME_LENGTH", 0);
            doc.put(stateType + "_TIME_LENGTH", timeLength);
            MongoProvider.insertDBObject("cdr_report_agent_houre", doc);
        }
    }

    public void close() {
        running = false;
    }
}
