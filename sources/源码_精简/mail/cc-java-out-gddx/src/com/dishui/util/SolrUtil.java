package com.dishui.util;

//import org.apache.solr.client.solrj.*;
//import org.apache.solr.client.solrj.impl.HttpSolrClient;
//import org.apache.solr.client.solrj.response.QueryResponse;
//import org.apache.solr.common.SolrDocument;
//import org.apache.solr.common.SolrDocumentList;
//import org.apache.solr.common.SolrInputDocument;
//import java.io.IOException;
//import java.util.ArrayList;
//import java.util.List;


import com.dishui.db.mango.MongoConnect;
import com.dishui.db.mango.MongoProvider;
import com.dishui.manager.service.AppConfig;
import com.dishui.util.log.IceLogger;
import com.mongodb.BasicDBObject;
import com.mongodb.DBCollection;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStreamReader;

public class SolrUtil {

    //solr url
//    public static final String URL = "http://121.40.122.105:8983/solr";
    public static final String URL = "http://121.40.122.105:8090/solr";
    //solr应用
    public static final String SERVER = "customer";
    //待索引、查询字段
    public static String[] docs = {
            "Solr是一个独立的企业级搜索应用服务器",
            "用户可以通过http请求",
            "向搜索引擎服务器提交一定格式的XML文件生成索引"
            };

//    public static SolrClient getSolrClient(){
//        return new HttpSolrClient(URL+"/"+SERVER);
//    }

    /**
     * 新建索引
     */
    public static void createIndex(){
//        SolrClient client = getSolrClient();
//        int i = 0;
//        List<SolrInputDocument> docList = new ArrayList<SolrInputDocument>();
//        for(String str : docs){
//            SolrInputDocument doc = new SolrInputDocument();
//            doc.addField("_id",i++);
//            doc.addField("custName", str);
//            docList.add(doc);
//        }
//        try {
//            client.add(docList);
//            client.commit();
//        } catch (SolrServerException e) {
//            e.printStackTrace();
//        } catch (IOException e) {
//            e.printStackTrace();
//        }
    }

    /**
     * 搜索
     */
    public static void search(){
//        SolrClient client = getSolrClient();
//        SolrQuery query = new SolrQuery();
//        query.setQuery("custName:搜索");
//        QueryResponse response = null;
//        try {
//            response = client.query(query);
//            System.out.println(response.toString());
//            System.out.println();
//            SolrDocumentList docs = response.getResults();
//            System.out.println("文档个数：" + docs.getNumFound());
//            System.out.println("查询时间：" + response.getQTime());
//            for (SolrDocument doc : docs) {
//                System.out.println("id: " + doc.getFieldValue("id") + "      content: " + doc.getFieldValue("content_test"));
//            }
//        } catch (SolrServerException e) {
//            e.printStackTrace();
//        } catch (IOException e) {
//            e.printStackTrace();
//        }
    }

//    public static void main(String[] args) {
//        createIndex();
//        search();

//        String json="{\"add\":[{\"_id\": \"100\", \"name\": \"test\",\"account\":\"N00000000143\"},{\"_id\": \"101\", \"name\": \"test2\",\"account\":\"N00000000143\"}]}";
//        try {
//            HttpProvider.sendSolrPost("http://121.40.122.105:8090/solr/customer/update/json?commit=true", json);
//        } catch (Exception e) {
//            e.printStackTrace();
//        }
//    }


    public static void readTxtFile(String filePath){
        try {
            String encoding="UTF-8";
            File file=new File(filePath);
            if(file.isFile() && file.exists()){
                InputStreamReader read = new InputStreamReader(
                        new FileInputStream(file),encoding);
                BufferedReader bufferedReader = new BufferedReader(read);
                String lineTxt = null;
                while((lineTxt = bufferedReader.readLine()) != null){
                    String[] ary=lineTxt.trim().split("\\|");
                    System.out.println(ary[1]);
                    DBCollection collection = MongoConnect.getInstance().getDB("bill").getCollection("tbl_province");
                    collection.insert(new BasicDBObject().append("_id",ary[0]).append("n",ary[1]));

//                    DBCollection collection = MongoConnect.getInstance().getDB("bill").getCollection("tbl_city");
//                    collection.insert(new BasicDBObject().append("_id",ary[1]).append("n",ary[2]).append("pid",ary[0]));
                }
                read.close();
            }else{
                System.out.println("找不到指定的文件");
            }
        } catch (Exception e) {
            System.out.println("读取文件内容出错");
            e.printStackTrace();
        }

    }

    public static void main(String argv[]){
//        AppConfig.getInstance();
//        MongoConnect.getInstance().connect();
//        String filePath = "/Users/hotchwong/Downloads/province";
//        String filePath = "/Users/hotchwong/Downloads/district";
//        readTxtFile(filePath);
    }
}