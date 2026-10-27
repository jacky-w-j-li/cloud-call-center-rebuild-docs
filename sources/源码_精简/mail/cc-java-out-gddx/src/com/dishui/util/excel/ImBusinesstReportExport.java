package com.dishui.util.excel;

import com.dishui.db.mango.MongoProvider;
import com.dishui.model.ExportModelVo;
import com.dishui.util.report.ReportUtil;
import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import org.apache.commons.codec.binary.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by yaxi on 15-11-18.
 */
public class ImBusinesstReportExport extends XssfWriter {

    private String account;
    private static final String TABLE = "cc_im_business_report";
    private static final String DIC_TABLE = "app_channel_dic";
    private static final String REPORT_TYPE = "im_report_business_analyse";
    private  Map<String, DicModel> dicMaps = null;

    public void generateHeader(List<ExportModelVo> list) throws Exception{
        insertRow(0);
        for(int i=0;i<list.size();i++){
            createCell(i,list.get(i).getFieldName());
        }
        createCell(list.size(), "总计");
        endRow();
    }

    private void parseChannelDic(BasicDBList dbList, String fKey){
        if(dbList == null){
            return;
        }
        for(int i = 0; i<dbList.size(); i++){
            Map<String , Object> dicMap = (Map<String, Object>) dbList.get(i);
            String key = dicMap.get("key").toString();
            String name = dicMap.get("name").toString();
            DicModel dicModel = new DicModel(key, name, fKey);
            dicMaps.put(key, dicModel);
            BasicDBList dbList1 = (BasicDBList) dicMap.get("options");
            parseChannelDic(dbList1, key);
        }

    }

    /**
     *
     * @param key
     * @param path
     * @return
     */
    private String getDicPath(String key, String path){
        DicModel dicModel = dicMaps.get(key);
        if(dicModel == null){
            return key;
        }
        if(path.isEmpty()){
            path = dicModel.getValue();
        }else{
            path = dicModel.getValue() + "->" + path;
        }

        String fKey = dicModel.getfKey();
        if(fKey.isEmpty()){
            return path;
        }
        path = getDicPath(fKey, path);
        return path;
    }

    @Override
    public void generate(Map<String, Object> query) throws Exception {
        account = (String) query.get("accountId");

        Map<String, List<ExportModelVo>> headMapper = ReportUtil.getExportHeaders(
                REPORT_TYPE, account);

        List<ExportModelVo> heads = headMapper.get("Custom");
//        List<ExportModelVo> allHeads = headMapper.get("All");
        BasicDBObject dicCondition = new BasicDBObject("account", account);
        dicCondition.put("type", "webchat");
        dicMaps = new HashMap<String, DicModel>();
        DBObject dicObj = MongoProvider.findOne(DIC_TABLE, dicCondition);
        System.out.println(dicObj.toString());
        if(dicObj !=null && dicObj.get("options") != null){
            BasicDBList dbList = (BasicDBList) dicObj.get("options");
            parseChannelDic(dbList, "");
        }
        int rownum = 1;
        beginSheet();

        DBObject key = new BasicDBObject();
        key.put("consultType", true);

        DBObject condition = new BasicDBObject();
        condition.put("account", account);
        ReportUtil.getReportTimeLower(query, condition);
        System.out.println(condition.toString());
        DBObject inital = new BasicDBObject();
        inital.put("pc", 0);
        inital.put("wap", 0);
        inital.put("sdk", 0);
        inital.put("weixin", 0);

        StringBuilder aggregation = new StringBuilder();
        aggregation.append("function( curr, result ){")
                .append("result.pc += curr.pc || 0;")
                .append("result.wap += curr.wap || 0;")
                .append("result.sdk += curr.sdk || 0;")
                .append("result.weixin += curr.weixin || 0;")
                .append("}");

        StringBuilder finalize = new StringBuilder();
        finalize.append("function(result){").append("};");
        BasicDBList list = MongoProvider.groupFromReportDb(TABLE, key, condition, inital, aggregation.toString(), finalize.toString());
        generateHeader(heads);
        if(list == null){
            list = new BasicDBList();
        }

        Map<String, Integer> totalMap = new HashMap<String, Integer>();
        totalMap.put("pc", 0);
        totalMap.put("wap", 0);
        totalMap.put("sdk", 0);
        totalMap.put("weixin", 0);
        for(int i = 0; i<list.size();i++){
            insertRow(rownum);
            BasicDBObject dbObject = (BasicDBObject) list.get(i);
            int totoalNum = 0;
            for(int j=0; j<heads.size(); j++){
                String fieldId = heads.get(j).getFieldId();
                Object temp = null;
                if(fieldId.equals("consultType")){
                    temp = getDicPath(dbObject.get(fieldId).toString(), "");
                }else{
                    temp = dbObject.get(fieldId);
                }


                if(!fieldId.equals("consultType")){
                    int num = Double.valueOf(temp.toString()).intValue();
                    createCell(j, temp==null?0 : num);
                    totalMap.put(fieldId, totalMap.get(fieldId) + Float.valueOf(dbObject.get(fieldId).toString()).intValue());
                    totoalNum +=num;
                }else{
                    createCell(j, temp==null?"" : temp.toString());
                }

            }
            createCell(heads.size(), totoalNum);
            endRow();
            rownum++;
        }

        if(list.size() > 0){
            insertRow(rownum);
            int totalNum = 0;
            for(int j=0; j<heads.size(); j++){
                String fieldId = heads.get(j).getFieldId();

                if(fieldId.equals("consultType")){
                    createCell(j, "\u5408\u8ba1");
                }else{
                    createCell(j, totalMap.get(fieldId).toString());
                    totalNum += totalMap.get(fieldId);
                }
            }
            createCell(heads.size(), totalNum);
            endRow();
        }
        endSheet();
    }

    class DicModel{
        private String key;
        private String value;
        private String fKey;

        DicModel(String key, String value, String fKey){
            this.key = key;
            this.value = value;
            this.fKey = fKey;
        }

        public String getKey() {
            return key;
        }

        public void setKey(String key) {
            this.key = key;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }

        public String getfKey() {
            return fKey;
        }

        public void setfKey(String fKey) {
            this.fKey = fKey;
        }
    }
}
