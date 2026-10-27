package com.dishui.util.excel;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.dishui.util.report.ReportUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

/**
 * Created by jinjiaji on 15-11-18.
 */
public class QuesResultReportExport extends XssfWriter {
	private String account;
	private static final String TABLE = "cc_ques_result_report";
	private static final String REPORT_TYPE = "cc_ques_result_report";

	@Override
	public void generate(Map<String, Object> query) throws Exception {
		account = (String) query.get("account");
		DBObject inital = new BasicDBObject();
		Map<String, String> qsStatusMap = new HashMap<String, String>();
		Map<String, List<ExportModelVo>> headMapper = getQuesResultExportHeaders(
				REPORT_TYPE, query, inital, qsStatusMap);

		List<ExportModelVo> heads = headMapper.get("QuesResultHeader");
		// 封装condition
		DBObject condition = new BasicDBObject();
		condition.put("account", query.get("account"));
		condition.put("temp_id", query.get("temp_id"));
		getReportTimeLower(query, condition);
		getBatchNoList(query, condition);
		int rownum = 1;
		beginSheet();

		DBObject key = new BasicDBObject();

		StringBuilder aggregation = new StringBuilder();
		aggregation
				.append("function (curr, result) {")
				.append("var curResults = curr.results;")
				.append(" for (var resultId in curResults) {")
				.append("  result[resultId] += curResults[resultId] || 0;")
				.append("   result['_totalResult'] += curResults[resultId] || 0;")
				.append("  }").append("  }");

		StringBuilder finalize = new StringBuilder();
		finalize.append("function (result) {}");
		BasicDBList list = MongoProvider.groupFromReportDb(TABLE, key,
				condition, inital, aggregation.toString(), finalize.toString());

		generateHeader(heads);
		if (list == null) {
			list = new BasicDBList();
		}
		for (int i = 0; i < list.size(); i++) {
			insertRow(rownum);
			createCell(0, "数量");
			BasicDBObject dbObject = (BasicDBObject) list.get(i);
			Integer total = dbObject.getInt("_totalResult");
			for (int j = 0; j < heads.size(); j++) {
				String fieldId = heads.get(j).getFieldId();
				Integer num = dbObject.getInt(fieldId);
				String numStr = num.toString();
				createCell(j + 1, numStr);
			}
			String totalStr = total.toString();
			createCell(heads.size() + 1, totalStr);
			endRow();
			rownum++;
			//占比
			insertRow(rownum);
			createCell(0, "占比");
			for (int j = 0; j < heads.size(); j++) {
				String fieldId = heads.get(j).getFieldId();
				Integer num = dbObject.getInt(fieldId);
				if(total!=null && total!=0){
					double d = num*100/(double)total;
					String dStr = String.format("%.1f",d);
					createCell(j+1, dStr+"%");
				}else{
					createCell(j+1, "-");
				}
			}
			createCell(heads.size() + 1, "100%");
			endRow();
		}
		endSheet();
	}

	public void generateHeader(List<ExportModelVo> list) throws Exception {
		insertRow(0);
		createCell(0,"回访状态：");
		for (int i = 0; i < list.size(); i++) {
			createCell(i+1, list.get(i).getFieldName());
		}
		createCell(list.size()+1,"总数量");
		endRow();
	}

	public Map<String, List<ExportModelVo>> getQuesResultExportHeaders(
			String tmplId, Map<String, Object> query, DBObject inital,
			Map<String, String> qsStatusMap) {
		Map<String, List<ExportModelVo>> headerMapper = new HashMap<String, List<ExportModelVo>>();
		List<ExportModelVo> list = new ArrayList<ExportModelVo>();
		DBObject findTemplate = new BasicDBObject();
		findTemplate.put("_id", query.get("temp_id"));
		List<BasicDBObject> stable = new ArrayList<BasicDBObject>();// (List<BasicDBObject>)
																	// model.get("Config");
		DBObject temp = MongoProvider.findOne("account_questionnaire_temp",
				findTemplate);
		if (temp != null) {
			BasicDBObject qstatus = (BasicDBObject) temp.get("qstatus");
			// 遍历
			Set<String> keySet = qstatus.keySet();
			Integer o = 0;
			for (String key : keySet) {
				o++;
				String name = key;
				String displayname = qstatus.getString(key);
				Boolean show = true;
				String order = o.toString();
				BasicDBObject configItem = new BasicDBObject();
				configItem.put("name", name);
				configItem.put("displayname", displayname);
				configItem.put("show", show);
				configItem.put("order", order);
				stable.add(configItem);
				inital.put(key, 0);
				qsStatusMap.put(key, displayname);
			}
			inital.put("_totalResult", 0);

		}

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
		headerMapper.put("QuesResultHeader", list);

		List<BasicDBObject> allHeaderList = stable;
		List<ExportModelVo> allHeaderVoList = new ArrayList<ExportModelVo>();
		for (int i = 0; i < allHeaderList.size(); i++) {
			String key = (String) stable.get(i).get("name");
			String name = (String) stable.get(i).get("displayname");
			ExportModelVo vo = new ExportModelVo();
			vo.setFieldId(key);
			vo.setFieldName(name);
			vo.setDicName("");
			allHeaderVoList.add(vo);
		}
		headerMapper.put("All", allHeaderVoList);

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
