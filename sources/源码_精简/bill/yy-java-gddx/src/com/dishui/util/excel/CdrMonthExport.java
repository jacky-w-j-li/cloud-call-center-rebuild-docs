package com.dishui.util.excel;

import com.dishui.bill.service.Utils;
import com.dishui.db.mango.MongoConnect;
import com.dishui.model.ExportModelVo;
import com.mongodb.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

public class CdrMonthExport extends XssfWriter{
	private static Logger log = Logger.getLogger(CdrMonthExport.class.getName());
	public Map<String,Map<String,String>> dics=new HashMap<String,Map<String,String>>();
	

	@Override
	public void generate(Map<String,Object> query) throws Exception {
//        account=query.get("account").toString();
        String product=String.valueOf(query.get("name"));
		List<ExportModelVo> heads=getHeaders(product);
	    //电子表格开始
		int rownum = 1;
        beginSheet();
		DBCollection collection = MongoConnect.getInstance().getDB("bill_data").getCollection("bill_call_consume");
		DBObject where=new BasicDBObject();
//		setQueryCondition(query);
		where.putAll(query);
		DBCursor cursor = collection.find(where);
		genrateHeader(heads);
		while (cursor.hasNext()) {
			DBObject obj = cursor.next();
			insertRow(rownum);
			for(int i=0;i<heads.size();i++){
				Object temp=obj.get(heads.get(i).getFieldId());
                if("yearMonth".equals(heads.get(i).getFieldId())){
                    temp=""+obj.get("year")+"-"+obj.get("month");
                }else if("balance".equals(heads.get(i).getFieldId()) || "minConsume".equals(heads.get(i).getFieldId()) || "actualConsume".equals(heads.get(i).getFieldId())){
                    temp= Utils.formatRound2Money(Long.valueOf(temp.toString()));
                }else if("monthRent".equals(heads.get(i).getFieldId())){
                    if (temp==null){
                        temp= 0.0;
                    }else {
                        temp= Utils.formatRound2Money(Long.valueOf(temp.toString()));
                    }

                }else if("finalConsume".equals(heads.get(i).getFieldId())){
                    long minConsume=Long.valueOf(obj.get("minConsume").toString());
                    long actualConsume=Long.valueOf(obj.get("actualConsume").toString());
                    long finalConsume=actualConsume> minConsume?actualConsume:minConsume;
                    temp= Utils.formatRound2Money(finalConsume);
                }else if("_id".equals(heads.get(i).getFieldId())){
                    String[] _ary=String.valueOf(temp).split("_");
                    if(_ary.length>=4){
                        temp=_ary[3];
                    }
                }
				if(temp!=null && heads.get(i).getDicName()!=null && !heads.get(i).getDicName().equals("")){
					String dicName=heads.get(i).getDicName();
					String desc="";
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
	
	public List<ExportModelVo> getHeaders(String product){
		List<ExportModelVo> list=new ArrayList<ExportModelVo>();

        ExportModelVo field1=new ExportModelVo();
        field1.setFieldId("yearMonth");
        field1.setFieldName("月份");
        field1.setDicName("");
        list.add(field1);
        if("400".equals(product)){
            ExportModelVo _field1=new ExportModelVo();
            _field1.setFieldId("_id");
            _field1.setFieldName("400号码");
            _field1.setDicName("");
            list.add(_field1);
        }
        ExportModelVo field2=new ExportModelVo();
        field2.setFieldId("balance");
        field2.setFieldName("余额(元)");
        field2.setDicName("");
        list.add(field2);

        ExportModelVo field3=new ExportModelVo();
        field3.setFieldId("minConsume");
        field3.setFieldName("最低消费(元)");
        field3.setDicName("");
        list.add(field3);

        ExportModelVo field4=new ExportModelVo();
        field4.setFieldId("actualConsume");
        field4.setFieldName("实际消费(元)");
        field4.setDicName("");
        list.add(field4);

        ExportModelVo field5=new ExportModelVo();
        field5.setFieldId("monthRent");
        field5.setFieldName("月租(元)");
        field5.setDicName("");
        list.add(field5);

        ExportModelVo field6=new ExportModelVo();
        field6.setFieldId("finalConsume");
        field6.setFieldName("最终费用(元)");
        field6.setDicName("");
        list.add(field6);

        ExportModelVo field7=new ExportModelVo();
        field7.setFieldId("calls");
        field7.setFieldName("电话总量(个)");
        field7.setDicName("");
        list.add(field7);

        ExportModelVo field8=new ExportModelVo();
        field8.setFieldId("localMinutes");
        field8.setFieldName("本地时长(分钟)");
        field8.setDicName("");
        list.add(field8);

        ExportModelVo field9=new ExportModelVo();
        field9.setFieldId("remoteMinutes");
        field9.setFieldName("长途时长(分钟)");
        field9.setDicName("");
        list.add(field9);

		return list;
	}


	private void setQueryCondition(Map<String, Object> query){
        String product=(String)query.get("name");

	}
}
