package com.dishui.util.excel;

import com.dishui.db.mango.MongoConnect;
import com.dishui.model.ExportModelVo;
import com.mongodb.*;

import java.util.*;
import java.util.logging.Logger;

public class TelListExport extends XssfWriter{
	private static Logger log = Logger.getLogger(TelListExport.class.getName());
	public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();
	

	@Override
	public void generate(Map<String,Object> query) throws Exception {
//        account=query.get("account").toString();
		List<ExportModelVo> heads=getHeaders();
	    //电子表格开始
		int rownum = 1;
        beginSheet();
		DBCollection collection = MongoConnect.getInstance().getDB().getCollection("platform_autocall");
		DBObject where=new BasicDBObject();
		setQueryCondition(query);
		where.putAll(query);
		DBCursor cursor = collection.find(where);
		genrateHeader(heads);
		while (cursor.hasNext()) {
			DBObject obj = cursor.next();
			insertRow(rownum);
			for(int i=0;i<heads.size();i++){
				Object temp=obj.get(heads.get(i).getFieldId());
				if(temp!=null && heads.get(i).getDicName()!=null && !heads.get(i).getDicName().equals("")){
					String dicName=heads.get(i).getDicName();
					String desc="";
                    if("reason".equals(dicName)){
                        if(temp.equals("4")){
                            desc="呼叫成功";
                        }else if(temp.equals("3")){
                            desc="振铃未接听";
                        }else{
                            desc="呼叫失败("+temp+")";
                        }
                    }else if("keypress".equals(dicName)){
                        if(temp.equals(true)){
                            desc="是";
                        }else{
                            desc="否";
                        }
                    }
					createCell(i,desc);
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
	
	public List<ExportModelVo> getHeaders(){
		List<ExportModelVo> list=new ArrayList<ExportModelVo>();

        ExportModelVo field1=new ExportModelVo();
        field1.setFieldId("num");
        field1.setFieldName("号码");
        field1.setDicName("");
        list.add(field1);

        ExportModelVo field2=new ExportModelVo();
        field2.setFieldId("batchNo");
        field2.setFieldName("批次号");
        field2.setDicName("");
        list.add(field2);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("beginTime");
        field3.setFieldName("开始时间");
        field3.setDicName("");
        list.add(field3);

        ExportModelVo field5=new ExportModelVo();
        field5.setFieldId("duration");
        field5.setFieldName("时长(秒)");
        field5.setDicName("");
        list.add(field5);

        ExportModelVo field6=new ExportModelVo();
        field6.setFieldId("keypress");
        field6.setFieldName("是否按键");
        field6.setDicName("keypress");
        list.add(field6);

        ExportModelVo field4=new ExportModelVo();
        field4.setFieldId("reason");
        field4.setFieldName("状态");
        field4.setDicName("reason");
		list.add(field4);

		return list;
	}

	public void setReason(){
		Map<String,String> map=new HashMap<String,String>();
		map.put("4", "呼叫成功");
		map.put("0", "呼叫失败");
		dics.put("reason", map);
	}

	private void setQueryCondition(Map<String, Object> query){
        query.remove("flag");
        if(query.get("called")!=null){
            query.put("called",query.get("called").toString().equals("true"));
        }
        if(query.get("keypress")!=null){
            query.put("keypress",query.get("keypress").toString().equals("true"));
        }
        if(query.get("reason")!=null && query.get("reason").toString().equals("0")){
            query.put("reason",new BasicDBObject("$ne","4"));
        }
	}
}
