package com.dishui.util.excel;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.dishui.util.report.ReportUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCursor;
import com.mongodb.DBObject;

public class ImChannelCSRReportExport extends XssfWriter {
	private String account;
	private static final String REPORT_TYPE = "im_report_channel_csr";
	private static final String REPORT_TABLE = "cc_im_csr_report";
    @Override
    public void generate(Map<String, Object> query) throws Exception {
        account = (String) query.get("accountId");
        
        DBObject webchatCSR = MongoProvider.findOne("app_channel_dic",new BasicDBObject().append("account",account).append("type", "webchatCSR"));
        List<DBObject> sources = new ArrayList<DBObject>();
        if(webchatCSR != null){
            sources = (List<DBObject>) webchatCSR.get("options");
        }
        
        Map<String, List<ExportModelVo>> headMapper = ReportUtil.getExportHeaders(
                REPORT_TYPE, account);

        List<ExportModelVo> heads = headMapper.get("Custom");
//        List<ExportModelVo> allHeads = headMapper.get("All");

        //查询账户下所有坐席
/*        DBObject whereAgent = new BasicDBObject();
        whereAgent.put("account", account);
        whereAgent.put("product", "cc");
        DBCursor agentCursor = MongoConnect.getInstance().getDB("bill").getCollection("platform_user").find(whereAgent);
        Map<String,String> agentNameMap = new HashMap<String,String>();
        Map<String,String> agentEmpnoMap = new HashMap<String,String>();
        while (agentCursor.hasNext()) {
            DBObject obj = agentCursor.next();
            String tmpName = "";
            if(obj.get("displayName")!=null){
                tmpName = obj.get("displayName").toString();
            }
            agentNameMap.put(obj.get("_id").toString(), tmpName+"["+obj.get("exten").toString()+"]");
            agentEmpnoMap.put(obj.get("_id").toString(), obj.get("exten").toString());
        }
        System.out.println(agentNameMap.toString());*/
     
        Map<String,String> channelNameMap = new HashMap<String,String>();
        channelNameMap.put("pc", "pc");
        channelNameMap.put("wap", "wap");
        channelNameMap.put("sdk", "app");
        channelNameMap.put("weixin", "微信");
        
        int rownum = 1;
        beginSheet();
        generateHeader(heads,sources);
        DBObject condition = new BasicDBObject();
        condition.put("account",account);
        condition.put("channel", new BasicDBObject("$ne",null));
        ReportUtil.getReportTimeLower(query, condition);
        DBObject group = new BasicDBObject();
        group.put("_id","$channel");
        group.put("sessionCount",new BasicDBObject().append("$sum","$sessionCount"));
        group.put("totalAppraiseCount",new BasicDBObject().append("$sum","$totalAppraiseCount"));
        Map<String, Integer> totalMap = new HashMap<String, Integer>();
        totalMap.put("sessionCount", 0);
        totalMap.put("totalAppraiseCount", 0);
        for(int i= 0;i<sources.size();i++){
            group.put((String)sources.get(i).get("key"),new BasicDBObject().append("$sum","$"+(String)sources.get(i).get("key")));
            totalMap.put((String)sources.get(i).get("key"), 0);
        }


        DBObject sort = new BasicDBObject("$sort", new BasicDBObject("dayId",1));
        
        List<DBObject> list = MongoProvider.aggregateFromReportDb(REPORT_TABLE,new BasicDBObject("$match",condition),new BasicDBObject("$group",group),sort);
       
        if (list.size() > 0){
            for(int i= 0 ; i< list.size();i++){
                insertRow(rownum);
                DBObject dataObj = list.get(i);
                createCell(0,channelNameMap.get((String)dataObj.get("_id")));
                Object sessionCount = dataObj.get("sessionCount");
                createCell(1,sessionCount == null ? "0" : String.valueOf(sessionCount));
                Object totalAppraiseCount = dataObj.get("totalAppraiseCount");
                createCell(2,totalAppraiseCount == null ? "0" : String.valueOf(totalAppraiseCount));
                int sessionCount1 = Integer.valueOf(sessionCount == null ? "0" : String.valueOf(sessionCount));
                int totalAppraiseCount1 = Integer.valueOf(totalAppraiseCount == null ? "0" : String.valueOf(totalAppraiseCount));
                double per = sessionCount1==0?0: (double)totalAppraiseCount1*100/(double)sessionCount1;
                createCell(3,String.format("%.1f",per) + "%");
              for(int m =0 ;m < sources.size();m++){
	              Object value = dataObj.get((String) sources.get(m).get("key"));
	              if(value!= null && (Integer)value<0){
	                  value = 0;
	              }
                  int itemCount = Integer.parseInt(String.valueOf(value));
                  double valuedb = value == null || totalAppraiseCount1 == 0 ? 0 : (double)itemCount *100 / (double)totalAppraiseCount1;
	              createCell(m+4 ,String.format("%.1f",valuedb) +"%");
	              int int_key = Integer.valueOf(value == null ? "0" : String.valueOf(value));
	              totalMap.put((String) sources.get(m).get("key"), totalMap.get((String) sources.get(m).get("key")) + int_key);
              }
              totalMap.put("sessionCount", totalMap.get("sessionCount") + sessionCount1);
              totalMap.put("totalAppraiseCount", totalMap.get("totalAppraiseCount") + totalAppraiseCount1);
                endRow();
                rownum++;
            }
            insertRow(rownum);
            createCell(0, "\u5408\u8ba1");
            createCell(1, String.valueOf(totalMap.get("sessionCount")));
            createCell(2, String.valueOf(totalMap.get("totalAppraiseCount")));
            
            int sessionCountInt = Integer.valueOf(totalMap.get("sessionCount") == null ? "0" : String.valueOf(totalMap.get("sessionCount")));
            int totalAppraiseCountInt = Integer.valueOf(totalMap.get("totalAppraiseCount") == null ? "0" : String.valueOf(totalMap.get("totalAppraiseCount")));
            double perInt = sessionCountInt==0?0:(double)totalMap.get("totalAppraiseCount")*100/(double)sessionCountInt;
            createCell(3, String.format("%.1f",perInt)+ "%");
            for(int m =0 ;m < sources.size();m++){
	              Object value = totalMap.get((String) sources.get(m).get("key"));
	              if(value!= null && (Integer)value<0){
	                  value = 0;
	              }
	              Integer valueInt = value == null ? 0 : Integer.valueOf(String.valueOf(value));
	              double perInt2 = totalAppraiseCountInt==0?0:(double)valueInt*100/(double)totalAppraiseCountInt;
	              String dStr = String.format("%.1f",perInt2);
	              createCell(m+4 , dStr+ "%");
            }
            endRow();
            
        }


        endSheet();
    }


    public void generateHeader(List<ExportModelVo> list,List<DBObject> heads) throws Exception{
        insertRow(0);
        for(int i=0;i<list.size();i++){
            createCell(i,list.get(i).getFieldName());
        }
        for (int i = 0; i < heads.size(); i++) {
            createCell(list.size()+i, (String)heads.get(i).get("name"));
        }
        endRow();
    }
}
