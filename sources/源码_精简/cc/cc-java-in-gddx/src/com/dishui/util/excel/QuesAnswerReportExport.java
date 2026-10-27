package com.dishui.util.excel;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.util.CellRangeAddress;
import org.bson.types.BasicBSONList;

import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

/**
 * Created by jinjiaji on 2016/07/04.
 */
public class QuesAnswerReportExport extends XssfWriter {
	private String account;
	private static final String TABLE = "cc_ques_anwser_report";
	private static final String REPORT_TYPE = "cc_ques_answer_report";

	@Override
	public void generate(Map<String, Object> query) throws Exception {
		account = (String) query.get("account");
		List<String> ques_ids = null;
		Map<String,DBObject>quesInfos = new HashMap<String,DBObject>();
		DBObject inital = new BasicDBObject();
		Map<String, String> QuseMap = new HashMap<String, String>();
		// 封装condition
		DBObject condition = new BasicDBObject();
		condition.put("account", query.get("account"));
		condition.put("temp_id", query.get("temp_id"));
		// 封装问题
		if (query != null && query.get("ques_id") != null) {
			ques_ids = (List<String>) query.get("ques_id");
			if (ques_ids != null && ques_ids.size() > 0) {
				DBObject quesCondition = new BasicDBObject("$in", ques_ids);
				condition.put("quesId",quesCondition);
			}
		}
		Map<String, List<ExportModelVo>> headMapper = getQuesAnswerExportHeaders(
				REPORT_TYPE, query, inital, QuseMap,ques_ids,quesInfos);

		getReportTimeLower(query, condition);
		getBatchNoList(query, condition);
		beginSheet();
		DBObject key = new BasicDBObject();
		key.put("quesId", 1);
		StringBuilder aggregation = new StringBuilder();
		aggregation
				.append("function (curr, result) {")
				.append("var anws = curr.anws;")
				.append("  for (var answerId in anws) {")
				.append(" result[answerId] += anws[answerId] || 0;")
				.append(" result['_totalQuesAnswers'] += anws[answerId]|| 0;")
				.append(" }")
				.append(" result['_totalQuesSubmitNums'] += curr._totalQuesSubmitNums|| 0;")
				.append(" }");

		StringBuilder finalize = new StringBuilder();
		finalize.append("function (result) {}");
		BasicDBList list = MongoProvider.groupFromReportDb(TABLE, key,
				condition, inital, aggregation.toString(), finalize.toString());

		if (list == null) {
			list = new BasicDBList();
		}
		int rownum = 0;
		Set<String> keySet = headMapper.keySet();
		int maxLength = 0;
		for (String quesId : keySet) {
			List<ExportModelVo> heads = headMapper.get(quesId);
			if(heads.size()>maxLength){
				maxLength = heads.size();
			}
		}
		for (String quesId : keySet) {
			List<ExportModelVo> heads = headMapper.get(quesId);
			DBObject quesInfo = quesInfos.get(quesId);
			generateHeader(quesInfo,heads,rownum,maxLength);
			rownum = rownum+2;
			insertRow(rownum);
			BasicDBObject dbObject = null;// 找到的对象
			for (Object listItem : list) {
				if (listItem != null) {
					BasicDBObject dbObjItem = (BasicDBObject) listItem;
					if (dbObjItem.get("quesId") != null
							&& quesId.equalsIgnoreCase((String) dbObjItem
									.get("quesId"))) {
						dbObject = dbObjItem;
						break;
					}
				}
			}
			if(dbObject!=null){
				Integer totalQuesAnswers = dbObject.getInt("_totalQuesAnswers");
				Integer totalQuesSubmitNums = dbObject.getInt("_totalQuesSubmitNums");//回访量
				createCell(0, "数量");
				for (int j = 0; j < heads.size(); j++) {
					String fieldId = heads.get(j).getFieldId();
					Integer num = 0;
					if (dbObject != null) {
						num = dbObject.getInt(fieldId);
					}
					String numStr = num.toString();
					createCell(j+1, numStr);
				}
				createCell(maxLength+1, totalQuesAnswers.toString());
				createCell(maxLength+2,totalQuesSubmitNums.toString());
				endRow();
				rownum++;
				//百分比
				insertRow(rownum);
				createCell(0, "机会占比");
				for (int j = 0; j < heads.size(); j++) {
					String fieldId = heads.get(j).getFieldId();
					Integer num = 0;
					if (dbObject != null) {
						num = dbObject.getInt(fieldId);
					}
					if(totalQuesAnswers!=null && totalQuesAnswers!=0){
						double d = num*100/(double)totalQuesAnswers;
						String dStr = String.format("%.1f",d);
						createCell(j+1, dStr+"%");
					}else{
						createCell(j+1, "0.0%");
					}
					
				}
				createCell(maxLength+1, "-");
				endRow();
				rownum++;
				//单量占比
				if(quesInfo!=null && quesInfo.get("isMultiselect")!=null && Boolean.TRUE.equals(quesInfo.get("isMultiselect"))){
					insertRow(rownum);
					createCell(0, "单量占比");
					for (int j = 0; j < heads.size(); j++) {
						String fieldId = heads.get(j).getFieldId();
						Integer num = 0;
						if (dbObject != null) {
							num = dbObject.getInt(fieldId);
						}
						if(totalQuesSubmitNums!=null && totalQuesSubmitNums!=0){
							double d = num*100/(double)totalQuesSubmitNums;
							String dStr = String.format("%.1f",d);
							createCell(j+1, dStr+"%");
						}else{
							createCell(j+1, "-");
						}
						
					}
					createCell(maxLength+1, "0.0%");
					endRow();
					rownum++;
				}
			}
			
		}
		endSheet();
	}

	public void generateHeader(DBObject quesInfo,List<ExportModelVo> list,Integer rownum,Integer maxLength) throws Exception {
		insertRow(rownum);
		String qName ="";
		if(quesInfo.get("name")!=null){
			qName = (String) quesInfo.get("name");
		}
		String qContext ="";
		if(quesInfo.get("name")!=null){
			qContext = (String) quesInfo.get("context");
		}
		createCell(0, "问题");
		createCell(1, qName+":"+qContext);
		endRow();
		mergedCellNoStyle(rownum,rownum, 1, maxLength+2);
		
		insertRow(++rownum);
		createCell(0, "问题结果");
		for (int i = 0; i < list.size(); i++) {
			createCell(i+1, list.get(i).getFieldName());
		}
		
		createCell(maxLength+1,"结果合计");
		createCell(maxLength+2,"回访总量");
		endRow();
	}
	
	public Map<String, List<ExportModelVo>> getQuesAnswerExportHeaders(
			String tmplId, Map<String, Object> query, DBObject inital,
			Map<String, String> qsStatusMap, List<String> ques_ids, Map<String, DBObject> quesInfos) {
		Map<String, List<ExportModelVo>> headerMapper = new LinkedHashMap<String, List<ExportModelVo>>();
		DBObject findQuestion = new BasicDBObject();
		DBObject sort = new BasicDBObject("createTime",1);
		findQuestion.put("temp_id", query.get("temp_id"));
		List<DBObject> quess = MongoProvider.findAndSort("account_questionnaire_question",
				findQuestion,sort);
		if (quess != null) {
			for (DBObject currques : quess) {
				if(ques_ids==null || ques_ids.contains(currques.get("_id"))){
					quesInfos.put((String) currques.get("_id"), currques);
					Object anwsObject = currques.get("anws");
					if(anwsObject!=null){
						List<ExportModelVo> list = new ArrayList<ExportModelVo>();
						List<BasicDBObject> stable = new ArrayList<BasicDBObject>();// (List<BasicDBObject>)
						List<BasicDBObject> anws = (List<BasicDBObject>) anwsObject;
						//遍历答案
						Integer o = 0;
						for (BasicDBObject anw : anws) {
							o++;
							String name = anw.getString("_id");
							String displayname = anw.getString("answer");
							Boolean show = true;
							String order = o.toString();
							BasicDBObject configItem = new BasicDBObject();
							configItem.put("name", name);
							configItem.put("displayname", displayname);
							configItem.put("show", show);
							configItem.put("order", order);
							stable.add(configItem);
							inital.put(name, 0);
						}
						inital.put("_totalQuesAnswers", 0);//所有被选答案数相加
						inital.put("_totalQuesSubmitNums", 0);//回访量
						for (int i = 0; i < stable.size(); i++) {
							if ((Boolean) stable.get(i).get("show")) {
								String key = (String) stable.get(i).get("name");
								String name = (String) stable.get(i).get("displayname");
								ExportModelVo vo = new ExportModelVo();
								vo.setFieldId(key);
								vo.setFieldName(name);
								vo.setDicName("");
								list.add(vo);
							}
						}
						headerMapper.put((String) currques.get("_id"), list);
					}
				}
			}
		}
		return headerMapper;
	}

	public void getReportTimeLower(Map<String, Object> data, DBObject condition) {
		BasicDBObject time = new BasicDBObject();
		if (data.get("return_time_begin") != null
				&& !"".equals(data.get("return_time_begin").toString())) {
			time.put("$gte", data.get("return_time_begin").toString()
					.replaceAll("-", ""));
		}
		if (data.get("return_time_end") != null
				&& !"".equals(data.get("return_time_end").toString())) {
			time.put("$lte",
					data.get("return_time_end").toString().replaceAll("-", ""));
		}
		if (time.size() > 0) {
			condition.put("dayId", time);
		}
	}

	public void getBatchNoList(Map<String, Object> data, DBObject conditionGroup) {
		DBObject condition = new BasicDBObject();
		condition.put("accountId", data.get("account"));
		condition.put("type", "questionnaire");
		condition.put("flag", "finish");
		Object batchNosObj = data.get("batchNos");
		Object batchRemarksObj = data.get("batchRemarks");
		Object beginTimeObj = data.get("create_time_begin");
		Object endTimeObj = data.get("create_time_end");
		if (batchNosObj != null && ((List<String>) batchNosObj).size() > 0) {
			condition.put("batchNo", new BasicDBObject("$in",
					((List<String>) batchNosObj)));
		}
		if (batchRemarksObj != null
				&& ((List<String>) batchRemarksObj).size() > 0) {
			condition.put("batchRemark", new BasicDBObject("$in",
					((List<String>) batchRemarksObj)));
		}
		if (beginTimeObj != null && !"".equals((String) beginTimeObj)) {
			BasicDBObject createTimeCondition = new BasicDBObject("$gte",
					(String) beginTimeObj + " 00:00:00");
			condition.put("createTime", createTimeCondition);
		}
		if (endTimeObj != null && !"".equals((String) endTimeObj)) {
			BasicDBObject createTimeCondition = null;
			if (condition.get("createTime") == null) {
				createTimeCondition = new BasicDBObject("$lte",
						(String) endTimeObj + " 23:59:59");
				condition.put("createTime", createTimeCondition);
			} else {
				createTimeCondition = (BasicDBObject) (condition
						.get("createTime"));
				createTimeCondition.put("$lte", (String) endTimeObj
						+ " 23:59:59");
			}
		}
		if (condition.get("batchNo") != null
				|| condition.get("batchRemark") != null
				|| condition.get("createTime") != null) {
			List<DBObject> tasks = MongoProvider.find("app_import_task",
					condition);
			List<String> list = new ArrayList<String>();
			for (DBObject task : tasks) {
				if (task != null) {
					list.add((String) task.get("batchNo"));
				}
			}
			BasicDBObject batchNoCondition = new BasicDBObject("$in", list);
			conditionGroup.put("batchNo", batchNoCondition);
		}
	}
}
