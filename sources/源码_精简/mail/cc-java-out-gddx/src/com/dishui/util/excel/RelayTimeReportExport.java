package com.dishui.util.excel;

import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import com.dishui.model.ExportModelVo;
import com.dishui.util.report.ReportUtil;
import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class RelayTimeReportExport extends XssfWriter {
	@Override
	public void generate(Map<String, Object> query) throws Exception {
		String accountID = query.get("accountId").toString();
//		List<ExportModelVo> heads = ReportUtil.getHeaders(
//				"call_report_relay_time", accountID);
        Map<String, List<ExportModelVo>> headMapper = ReportUtil.getExportHeaders(
                "call_report_relay_time", accountID);
        List<ExportModelVo> heads = headMapper.get("Custom");
        List<ExportModelVo> allHeads = headMapper.get("All");

		int rownum = 1;
		beginSheet();
		genrateHeader(heads);

		String timeTypeKey = ReportUtil.getGroupTimeKey(query
				.get("TimeType").toString());
		query.put("TimeTypeKey", timeTypeKey);
        List<Object> queryResult = this.queryReport(query);
		if (queryResult != null && queryResult.size() > 0) {
			DBObject rowData = null;
			String fileId = null;
			int value = 0;
			Map<String, Integer> totals = new HashMap<String, Integer>();
			for (int i = 0, len = queryResult.size(); i < len; i++) {
				rowData = (DBObject) queryResult.get(i);
				insertRow(rownum);

				for (int j = 0, jLen = heads.size(); j < jLen; j++) {
					if (j == 0) {
						createCell(j, rowData.get(timeTypeKey).toString());
					} else {
						fileId = heads.get(j).getFieldId();
						value = Float.valueOf(rowData.get(fileId)
								.toString()).intValue();
						createCell(j, value);

					}
				}

                for (int k = 0, jLen = allHeads.size(); k < jLen; k++) {
                    fileId = allHeads.get(k).getFieldId();
                    if (i == 0) {
                        totals.put(fileId, 0);
                    }
                    if(!fileId.equals("ReportTime")){
                        totals.put(fileId, totals.get(fileId) + Float.valueOf(rowData.get(fileId).toString()).intValue());
                    }
                }

				endRow();
				rownum++;
			}

			insertRow(rownum);
			for (int j = 0, jLen = heads.size(); j < jLen; j++) {
				if (j == 0) {
					createCell(j, "\u5408\u8ba1");
				} else {
					fileId = heads.get(j).getFieldId();
					createCell(j, totals.get(fileId));
				}
			}
			endRow();
		}
		endSheet();
	}

	private List<Object> queryReport(Map<String, Object> queryData) {
		DBObject key = new BasicDBObject();
        String groupKey = queryData.get("TimeTypeKey").toString();
		key.put(groupKey, true);

		DBObject condition = new BasicDBObject();
		condition.put("AccountID", queryData.get("accountId"));
		ReportUtil.getReportTime(queryData, condition);

		BasicDBList servcieNosTrue = new BasicDBList();
		Iterator<String> keys = queryData.keySet().iterator();

		int num = 0;
		while(keys.hasNext()) {
			String keyService = (String)keys.next();
			if( keyService.length()>10 && "ServiceNo_".equals(keyService.substring(0,10))){
				num++;
				Boolean value= (Boolean)queryData.get(keyService);
				if(value){
					servcieNosTrue.add(keyService.split("_")[1]);
				}
			}
		}
		if(num > 0){
			condition.put("Service", new BasicDBObject("$in",servcieNosTrue));
		}

		BasicDBObject initial = new BasicDBObject();
		initial.put("DealingCount", 0);
		initial.put("NotDealCount", 0);
		initial.put("LeakCount", 0);
		initial.put("QueueLeakCount", 0);
		initial.put("BlackListCount", 0);
		initial.put("VoicemailCount", 0);

		StringBuilder reduce = new StringBuilder();
		reduce.append("function( curr, result ){")
				.append("result.DealingCount += curr.DealingCount;")
				.append("result.NotDealCount += curr.NotDealCount;")
				.append("result.LeakCount += curr.LeakCount;")
				.append("result.QueueLeakCount += curr.QueueLeakCount;")
				.append("result.BlackListCount += curr.BlackListCount;")
				.append("result.VoicemailCount += curr.VoicemailCount;")
				.append("}");

		StringBuilder finalize = new StringBuilder();
		finalize.append("function(result){")
				.append("result.AccessCount = result.DealingCount+result.NotDealCount+result.LeakCount+result.QueueLeakCount+result.BlackListCount+result.VoicemailCount;}");
//		BasicDBList list = MongoProvider.group("app_report_service_call_in", key,
//				condition, initial, reduce.toString(), finalize.toString());
        BasicDBList list = MongoProvider.groupFromReportDb("cdr_report_service_call_in", key,
                condition, initial, reduce.toString(), finalize.toString());
        //sort list
        List<Object> sortList = ReportUtil.sortListByTime(list,groupKey);
        return sortList;
	}

	public void genrateHeader(List<ExportModelVo> list) throws Exception {
		insertRow(0);
		for (int i = 0; i < list.size(); i++) {
			createCell(i, list.get(i).getFieldName());
		}
		endRow();
	}
}
