package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.Utils;
import com.dishui.server.handler.ImportHandler;
import com.dishui.util.CommonUtil;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

import java.util.ArrayList;
import java.util.List;

public class QuestionnaireImport implements RowHandler {
//	public final int batchCount=1000;
	public List<String> heads=null;
//	public Map<String,Map<String,String>> dicitem=new HashMap<String,Map<String,String>>();
//	public Map<String,String> phones=new HashMap<String,String>();
//	public Map<String,String> names=new HashMap<String,String>();


	public List<DBObject> rows=null;
	public List<DBObject> repeatRows=null;
//	private String template="";
	private String accountId="";
	private String userId="";
	private String batchNo="";
	private String dbType="";
	private String batchRemark="";
//	private String status="";
//	private String source1="";
//	private boolean isName=false;
//	private boolean isPhone=false;
	public QuestionnaireImport(DBObject task){
		rows=new ArrayList<DBObject>();
		repeatRows=new ArrayList<DBObject>();
		accountId=task.get("accountId").toString();
		userId=task.get("creator").toString();
		batchNo=task.get("batchNo").toString();
		if(task.get("batchRemark")!=null){
			batchRemark=task.get("batchRemark").toString();
		}
		dbType=task.get("dbType").toString();
//		DBObject tmpl=getQuestionTmpl(this.dbType);

		heads=(ArrayList)task.get("heads");
	}
	private void addBlankCell(List<String> collist){
		int len=heads.size();
		int len2=collist.size();
		if(len2<len){
			for (int i = 0; i <len-len2 ; i++) {
				collist.add("");
			}
		}
	}
	@Override
	public void processRow(int sheetIndex, int curRow, List<String> collist) {
		if(heads==null) return;
		if(curRow==0) return;//clear row head
		addBlankCell(collist);
//        String field_name=this.dbType+"_name";
		DBObject row=new BasicDBObject();
		for (int i = 0; i < heads.size(); i++) {
			String field=heads.get(i);
			if("".equals(field)){
				continue;
			}
			String cell=collist.get(i);
			if(cell==null)cell="";
            cell=cell.trim();
            if("name".equals(field) && "".equals(cell)){
                cell="未知客户";
            }
            if("phone".equals(field)){
                cell= CommonUtil.clearPhone(cell);
            }
			row.put(field, cell);
		}
		String custId= Utils.getUniqueid();
		String time= Utils.getCurrentDate();
		row.put("_id", custId);
		row.put("createTime", time);
		row.put("lastUpdateTime", time);
//		row.put("accountId", this.accountId);
		row.put("owner", "");
		row.put("temp_id", this.dbType);
		row.put("batchNo", this.batchNo);
		row.put("batchRemark", this.batchRemark);
		row.put("status", "uncomplete");

        rows.add(row);

		if(rows.size()>0 &&rows.size()% ImportHandler.batchCount==0){
			MongoProvider.batchInsert(this.accountId + "_questionnaire", rows, this.accountId);
			rows.clear();
		}
	}

	public void processEndRow() {
		if(rows.size()>0){
			MongoProvider.batchInsert(this.accountId + "_questionnaire", rows, this.accountId);
			rows.clear();
		}
	}
	


/*    public DBObject getQuestionTmpl(String id){
		DBObject result= MongoProvider.findOne("account_questionnaire_field", new BasicDBObject("temp_id",id));
		return result;
	}*/

    public static void main(String[] args) {

    }
}
