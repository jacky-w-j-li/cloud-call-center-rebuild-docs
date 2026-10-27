package com.dishui.util.excel;

import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.mongodb.*;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

public class CallSheetGradeResultExport extends XssfWriter {
	private static Logger log = Logger.getLogger(CallSheetGradeResultExport.class.getName());

	@Override
	public void generate(Map<String, Object> query) throws Exception {
		// TODO Auto-generated method stub
        DBObject findTemplate = new BasicDBObject("_id",query.get("TEMPLATE"));
        DBObject curTemplate = MongoConnect.getInstance().getDB().getCollection("manager_quality_check_config").findOne(findTemplate);
		//获取表头
		List<ExportModelVo> heads = getHeaders(curTemplate);
        List<DBObject> tempConfigList = (ArrayList<DBObject>)curTemplate.get("config");

	    //电子表格开始
		int rownum = 1;
        beginSheet();

        DBObject condition = new BasicDBObject();
		String accountId = query.get("accountId").toString();
        condition.put("ACCOUNT",accountId);
		String CollectionName = "app_call_sheet_quality_check";

        //解析查询条件
        if(query.get("selectedAgent") != null && !query.get("selectedAgent").equals("")){
            String selectedStr = query.get("selectedAgent").toString();
            selectedStr = selectedStr.substring(1);
            String[] agentArr = selectedStr.split(",");
            if(agentArr.length > 0){
                condition.put("DISPOSAL_AGENT", new BasicDBObject("$in", agentArr));
            }
        }
        if(query.get("TEMPLATE") != null && !query.get("TEMPLATE").equals("")){
            condition.put("TEMPLATE", query.get("TEMPLATE"));
        }
        boolean isSearchDate = false;
        DBObject dateCondition = new BasicDBObject();
        if(query.get("BEGIN_TIME") != null && !query.get("BEGIN_TIME").equals("")){
        	dateCondition.put("$gte",query.get("BEGIN_TIME"));
        	isSearchDate = true;
        }
        if(query.get("END_TIME") != null && !query.get("END_TIME").equals("")) {
        	dateCondition.put("$lte", query.get("END_TIME"));
        	isSearchDate = true;
        }
        if(isSearchDate) {
            condition.put("OFFERING_TIME", dateCondition);
        }

		genrateHeader(heads);
		
		//查询账户下所有坐席
		DBObject whereAgent = new BasicDBObject();
		whereAgent.put("account", accountId);
        whereAgent.put("product","cc");
		DBCursor agentCursor = MongoConnect.getInstance().getDB("bill").getCollection("platform_user").find(whereAgent);
		Map<String,String> agentNameMap = new HashMap<String,String>();
        Map<String,String> agentExtenMap = new HashMap<String,String>();
		while (agentCursor.hasNext()) {
			DBObject obj = agentCursor.next();
			agentNameMap.put(obj.get("_id").toString(), obj.get("displayName").toString()+"["+obj.get("exten").toString()+"]");
            agentExtenMap.put(obj.get("_id").toString(), obj.get("exten").toString());
		}

        DBObject key = new BasicDBObject();
        key.put("DISPOSAL_AGENT", true);

        DBObject inital = new BasicDBObject();
        for(int i=0 ; i < tempConfigList.size(); i++) {
            inital.put(tempConfigList.get(i).get("order").toString(), 0);
        }
        inital.put("COUNT", 0);

        StringBuilder reduce = new StringBuilder();
        reduce.append("function( curr, result ){")
                .append("for(var i= 0,len=20;i<len;i++){")
                .append("if(curr[i]){")
                .append("result[i] += curr[i];")
                .append("}")
                .append("}")
                .append("result.COUNT++;")
                .append("}");

        StringBuilder finalize = new StringBuilder();
        finalize.append("function(result){")
                .append("var amount = 0;")
                .append("for(var i= 0,len=20;i<len;i++){")
                .append("if(result[i]){")
                .append("result[i] = Math.round(result[i]/result.COUNT * 10) / 10;")
                .append("amount += result[i];")
                .append("}")
                .append("}")
                .append("result.AMOUNT = Math.round(amount * 10) / 10;")
                .append("}");

        BasicDBList list = MongoProvider.group(CollectionName, key, condition, inital, reduce.toString(), finalize.toString());

        for(int j=0 ;j < list.size() ; j++){
			DBObject obj = (DBObject)list.get(j);
			insertRow(rownum);
			
			for(int i=0;i<heads.size();i++){
				Object temp=obj.get(heads.get(i).getFieldId());
				
			    if(temp!=null && heads.get(i).getFieldId().equals("DISPOSAL_AGENT")){
					if(agentNameMap.containsKey(temp.toString())){
						createCell(i,agentNameMap.get(temp.toString()));
					}else{
						createCell(i,"");
					}
				}else{
                    createCell(i,temp==null?"":temp.toString());
                }
				
			}
			endRow();
			rownum++;
		}
        //电子表格结束
        endSheet();
	}
	
	public void genrateHeader(List<ExportModelVo> list) throws Exception{
		insertRow(0);
		for(int i=0;i<list.size();i++){
			createCell(i,list.get(i).getFieldName());
		}
		endRow();		
	}
	
	public List<ExportModelVo> getHeaders(DBObject curTemplate){
		List<ExportModelVo> list=new ArrayList<ExportModelVo>();
		
		ExportModelVo vo1=new ExportModelVo();
		vo1.setFieldId("DISPOSAL_AGENT");
		vo1.setFieldName("座席");
		vo1.setDicName("");
		list.add(vo1);

        List<DBObject> tempConfigList = (ArrayList<DBObject>)curTemplate.get("config");
        for(int i=0 ; i < tempConfigList.size(); i++) {
            ExportModelVo tvo=new ExportModelVo();
            tvo.setFieldId(tempConfigList.get(i).get("order").toString());
            tvo.setFieldName(tempConfigList.get(i).get("name").toString()+"("+tempConfigList.get(i).get("weight").toString()+"%)");
            tvo.setDicName("");
            list.add(tvo);
        }

        ExportModelVo threeVo=new ExportModelVo();
        threeVo.setFieldId("AMOUNT");
        threeVo.setFieldName("平均总得分");
        threeVo.setDicName("");
        list.add(threeVo);

		return list;
	}
}
